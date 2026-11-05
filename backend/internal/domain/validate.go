package domain

import (
	"fmt"
	"maps"
	"regexp"
	"slices"
	"strings"
	"unicode/utf8"
)

// Violation codes. See docs/PRD.md section 5.
const (
	CodeRequired      = "required"
	CodeTooLong       = "too_long"
	CodeTooMany       = "too_many"
	CodeInvalidEnum   = "invalid_enum"
	CodeInvalidFormat = "invalid_format"
	CodeInvalidType   = "invalid_type"
	CodeOutOfRange    = "out_of_range"
)

const (
	maxNameLength           = 100
	maxDescriptionLength    = 500
	maxAttributes           = 20
	maxAttributeValueLength = 200
	maxLatitude             = 90.0
	maxLongitude            = 180.0
)

var (
	attributeKeyPattern = regexp.MustCompile(`^[A-Za-z0-9_.-]{1,50}$`)
	entityTypes         = []string{"vehicle", "iot_device", "facility", "other"}
	entityStatuses      = []string{"active", "inactive", "maintenance"}
)

// IsEntityType reports whether the value is a known entity type.
func IsEntityType(value string) bool {
	return slices.Contains(entityTypes, value)
}

// IsEntityStatus reports whether the value is a known entity status.
func IsEntityStatus(value string) bool {
	return slices.Contains(entityStatuses, value)
}

// Violation is one broken rule. Field is the JSON path of the offending value.
type Violation struct {
	Field   string
	Code    string
	Message string
}

// RawEntityInput holds decoded JSON values before any rule has been applied. The fields
// are untyped so that a wrong type is reported as a violation alongside all the others.
type RawEntityInput struct {
	Name        any
	Type        any
	Status      any
	Description any
	Attributes  any
	Latitude    any
	Longitude   any
}

// EntityInput is entity data that satisfies every rule.
type EntityInput struct {
	Name        string
	Type        EntityType
	Status      EntityStatus
	Description *string
	Attributes  map[string]string
	Latitude    float64
	Longitude   float64
}

// Validate normalizes the input and reports every broken rule at once.
func (r RawEntityInput) Validate() (EntityInput, []Violation) {
	v := &validator{}
	input := EntityInput{
		Name:        v.name(r.Name),
		Type:        EntityType(v.enum("type", r.Type, entityTypes)),
		Status:      EntityStatus(v.enum("status", r.Status, entityStatuses)),
		Description: v.description(r.Description),
		Attributes:  v.attributes(r.Attributes),
		Latitude:    v.coordinate("latitude", r.Latitude, maxLatitude),
		Longitude:   v.coordinate("longitude", r.Longitude, maxLongitude),
	}
	return input, v.violations
}

type validator struct {
	violations []Violation
}

func (v *validator) add(field, code, message string) {
	v.violations = append(v.violations, Violation{Field: field, Code: code, Message: message})
}

func (v *validator) name(raw any) string {
	if raw == nil {
		v.add("name", CodeRequired, "name is required.")
		return ""
	}
	value, ok := raw.(string)
	if !ok {
		v.add("name", CodeInvalidType, "name must be a string.")
		return ""
	}
	name := strings.TrimSpace(value)
	switch {
	case name == "":
		v.add("name", CodeRequired, "name is required.")
	case utf8.RuneCountInString(name) > maxNameLength:
		v.add("name", CodeTooLong, fmt.Sprintf("name must be at most %d characters.", maxNameLength))
	}
	return name
}

func (v *validator) enum(field string, raw any, allowed []string) string {
	if raw == nil {
		v.add(field, CodeRequired, field+" is required.")
		return ""
	}
	value, ok := raw.(string)
	if !ok {
		v.add(field, CodeInvalidType, field+" must be a string.")
		return ""
	}
	switch {
	case value == "":
		v.add(field, CodeRequired, field+" is required.")
	case !slices.Contains(allowed, value):
		v.add(field, CodeInvalidEnum, fmt.Sprintf("%s must be one of %s.", field, strings.Join(allowed, ", ")))
	}
	return value
}

func (v *validator) description(raw any) *string {
	if raw == nil {
		return nil
	}
	value, ok := raw.(string)
	if !ok {
		v.add("description", CodeInvalidType, "description must be a string.")
		return nil
	}
	description := strings.TrimSpace(value)
	if description == "" {
		return nil
	}
	if utf8.RuneCountInString(description) > maxDescriptionLength {
		v.add("description", CodeTooLong, fmt.Sprintf("description must be at most %d characters.", maxDescriptionLength))
	}
	return &description
}

func (v *validator) attributes(raw any) map[string]string {
	result := map[string]string{}
	if raw == nil {
		return result
	}
	values, ok := raw.(map[string]any)
	if !ok {
		v.add("attributes", CodeInvalidType, "attributes must be an object.")
		return result
	}
	if len(values) > maxAttributes {
		v.add("attributes", CodeTooMany, fmt.Sprintf("attributes must hold at most %d entries.", maxAttributes))
	}
	// Sorted so that the order of reported violations is stable.
	for _, key := range slices.Sorted(maps.Keys(values)) {
		field := "attributes." + key
		if !attributeKeyPattern.MatchString(key) {
			v.add(field, CodeInvalidFormat, "attribute keys must be 1 to 50 letters, digits, or . _ - characters.")
		}
		value, ok := values[key].(string)
		if !ok {
			v.add(field, CodeInvalidType, "attribute values must be strings.")
			continue
		}
		if utf8.RuneCountInString(value) > maxAttributeValueLength {
			v.add(field, CodeTooLong, fmt.Sprintf("attribute values must be at most %d characters.", maxAttributeValueLength))
		}
		result[key] = value
	}
	return result
}

func (v *validator) coordinate(field string, raw any, limit float64) float64 {
	if raw == nil {
		v.add(field, CodeRequired, field+" is required.")
		return 0
	}
	value, ok := raw.(float64)
	if !ok {
		v.add(field, CodeInvalidType, field+" must be a number.")
		return 0
	}
	if value < -limit || value > limit {
		v.add(field, CodeOutOfRange, fmt.Sprintf("%s must be between %v and %v.", field, -limit, limit))
	}
	return value
}
