package domain

import (
	"fmt"
	"strings"
	"testing"
)

func validRaw() RawEntityInput {
	return RawEntityInput{
		Name:      "Truk Logistik",
		Type:      "vehicle",
		Status:    "active",
		Latitude:  -6.9175,
		Longitude: 107.6191,
	}
}

func attributesOfSize(size int) map[string]any {
	attributes := make(map[string]any, size)
	for i := range size {
		attributes[fmt.Sprintf("key_%d", i)] = "value"
	}
	return attributes
}

func TestValidate_ValidInput_ReturnsTypedValues(t *testing.T) {
	raw := validRaw()
	raw.Description = "Armada Bandung"
	raw.Attributes = map[string]any{"plate_number": "D 1234 ABC"}

	input, violations := raw.Validate()

	if violations != nil {
		t.Fatalf("violations = %+v", violations)
	}
	if input.Name != "Truk Logistik" || input.Type != "vehicle" || input.Status != "active" {
		t.Errorf("input = %+v", input)
	}
	if input.Latitude != -6.9175 || input.Longitude != 107.6191 {
		t.Errorf("latitude = %v, longitude = %v", input.Latitude, input.Longitude)
	}
	if input.Description == nil || *input.Description != "Armada Bandung" {
		t.Errorf("description = %v", input.Description)
	}
	if input.Attributes["plate_number"] != "D 1234 ABC" {
		t.Errorf("attributes = %v", input.Attributes)
	}
}

func TestValidate_Normalization(t *testing.T) {
	t.Run("name is trimmed", func(t *testing.T) {
		raw := validRaw()
		raw.Name = "  Truk  "
		input, violations := raw.Validate()
		if violations != nil || input.Name != "Truk" {
			t.Errorf("name = %q, violations = %+v", input.Name, violations)
		}
	})
	for _, description := range []any{nil, "", "   "} {
		t.Run(fmt.Sprintf("description %q becomes null", description), func(t *testing.T) {
			raw := validRaw()
			raw.Description = description
			input, violations := raw.Validate()
			if violations != nil || input.Description != nil {
				t.Errorf("description = %v, violations = %+v", input.Description, violations)
			}
		})
	}
	t.Run("missing attributes become an empty object", func(t *testing.T) {
		input, violations := validRaw().Validate()
		if violations != nil || input.Attributes == nil || len(input.Attributes) != 0 {
			t.Errorf("attributes = %#v, violations = %+v", input.Attributes, violations)
		}
	})
}

func TestValidate_ValuesOnTheLimits_AreAccepted(t *testing.T) {
	tests := []struct {
		name   string
		change func(*RawEntityInput)
	}{
		{"zero coordinates", func(r *RawEntityInput) { r.Latitude, r.Longitude = 0.0, 0.0 }},
		{"maximum coordinates", func(r *RawEntityInput) { r.Latitude, r.Longitude = 90.0, 180.0 }},
		{"minimum coordinates", func(r *RawEntityInput) { r.Latitude, r.Longitude = -90.0, -180.0 }},
		{"name of 100 characters", func(r *RawEntityInput) { r.Name = strings.Repeat("a", 100) }},
		{"name of 100 multibyte characters", func(r *RawEntityInput) { r.Name = strings.Repeat("é", 100) }},
		{"description of 500 characters", func(r *RawEntityInput) { r.Description = strings.Repeat("a", 500) }},
		{"20 attributes", func(r *RawEntityInput) { r.Attributes = attributesOfSize(20) }},
		{"attribute key of 50 characters", func(r *RawEntityInput) {
			r.Attributes = map[string]any{strings.Repeat("k", 50): "value"}
		}},
		{"attribute key with every allowed symbol", func(r *RawEntityInput) {
			r.Attributes = map[string]any{"aZ0_.-": "value"}
		}},
		{"attribute value of 200 characters", func(r *RawEntityInput) {
			r.Attributes = map[string]any{"key": strings.Repeat("v", 200)}
		}},
		{"empty attribute value", func(r *RawEntityInput) { r.Attributes = map[string]any{"key": ""} }},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			raw := validRaw()
			tt.change(&raw)
			if _, violations := raw.Validate(); violations != nil {
				t.Errorf("violations = %+v", violations)
			}
		})
	}
}

func TestValidate_BrokenRules_ReportFieldAndCode(t *testing.T) {
	tests := []struct {
		name   string
		change func(*RawEntityInput)
		field  string
		code   string
	}{
		{"name missing", func(r *RawEntityInput) { r.Name = nil }, "name", CodeRequired},
		{"name blank", func(r *RawEntityInput) { r.Name = "   " }, "name", CodeRequired},
		{"name too long", func(r *RawEntityInput) { r.Name = strings.Repeat("a", 101) }, "name", CodeTooLong},
		{"name wrong type", func(r *RawEntityInput) { r.Name = 123.0 }, "name", CodeInvalidType},
		{"type missing", func(r *RawEntityInput) { r.Type = nil }, "type", CodeRequired},
		{"type empty", func(r *RawEntityInput) { r.Type = "" }, "type", CodeRequired},
		{"type unknown", func(r *RawEntityInput) { r.Type = "spaceship" }, "type", CodeInvalidEnum},
		{"type wrong case", func(r *RawEntityInput) { r.Type = "VEHICLE" }, "type", CodeInvalidEnum},
		{"type wrong type", func(r *RawEntityInput) { r.Type = true }, "type", CodeInvalidType},
		{"status missing", func(r *RawEntityInput) { r.Status = nil }, "status", CodeRequired},
		{"status unknown", func(r *RawEntityInput) { r.Status = "lost" }, "status", CodeInvalidEnum},
		{"status wrong type", func(r *RawEntityInput) { r.Status = 1.0 }, "status", CodeInvalidType},
		{"description too long", func(r *RawEntityInput) { r.Description = strings.Repeat("a", 501) }, "description", CodeTooLong},
		{"description wrong type", func(r *RawEntityInput) { r.Description = 1.0 }, "description", CodeInvalidType},
		{"attributes wrong type", func(r *RawEntityInput) { r.Attributes = []any{"a"} }, "attributes", CodeInvalidType},
		{"too many attributes", func(r *RawEntityInput) { r.Attributes = attributesOfSize(21) }, "attributes", CodeTooMany},
		{"attribute key empty", func(r *RawEntityInput) { r.Attributes = map[string]any{"": "v"} }, "attributes.", CodeInvalidFormat},
		{"attribute key with a space", func(r *RawEntityInput) { r.Attributes = map[string]any{"a b": "v"} }, "attributes.a b", CodeInvalidFormat},
		{"attribute key too long", func(r *RawEntityInput) {
			r.Attributes = map[string]any{strings.Repeat("k", 51): "v"}
		}, "attributes." + strings.Repeat("k", 51), CodeInvalidFormat},
		{"attribute value wrong type", func(r *RawEntityInput) { r.Attributes = map[string]any{"count": 5.0} }, "attributes.count", CodeInvalidType},
		{"attribute value too long", func(r *RawEntityInput) {
			r.Attributes = map[string]any{"key": strings.Repeat("v", 201)}
		}, "attributes.key", CodeTooLong},
		{"latitude missing", func(r *RawEntityInput) { r.Latitude = nil }, "latitude", CodeRequired},
		{"latitude too small", func(r *RawEntityInput) { r.Latitude = -90.1 }, "latitude", CodeOutOfRange},
		{"latitude too large", func(r *RawEntityInput) { r.Latitude = 90.1 }, "latitude", CodeOutOfRange},
		{"latitude wrong type", func(r *RawEntityInput) { r.Latitude = "-6.9" }, "latitude", CodeInvalidType},
		{"longitude missing", func(r *RawEntityInput) { r.Longitude = nil }, "longitude", CodeRequired},
		{"longitude too small", func(r *RawEntityInput) { r.Longitude = -180.1 }, "longitude", CodeOutOfRange},
		{"longitude too large", func(r *RawEntityInput) { r.Longitude = 180.1 }, "longitude", CodeOutOfRange},
		{"longitude wrong type", func(r *RawEntityInput) { r.Longitude = "107" }, "longitude", CodeInvalidType},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			raw := validRaw()
			tt.change(&raw)

			_, violations := raw.Validate()

			if len(violations) != 1 {
				t.Fatalf("violations = %+v, want exactly one", violations)
			}
			if violations[0].Field != tt.field || violations[0].Code != tt.code {
				t.Errorf("violation = %+v, want field %q and code %q", violations[0], tt.field, tt.code)
			}
			if violations[0].Message == "" {
				t.Error("message is empty")
			}
		})
	}
}

func TestValidate_ManyBrokenRules_ReportsEveryOne(t *testing.T) {
	_, violations := RawEntityInput{
		Attributes: map[string]any{"a b": 1.0},
	}.Validate()

	got := map[string]bool{}
	for _, violation := range violations {
		got[violation.Field+":"+violation.Code] = true
	}
	for _, want := range []string{
		"name:required", "type:required", "status:required", "latitude:required", "longitude:required",
		"attributes.a b:invalid_format", "attributes.a b:invalid_type",
	} {
		if !got[want] {
			t.Errorf("missing %q in %+v", want, violations)
		}
	}
}
