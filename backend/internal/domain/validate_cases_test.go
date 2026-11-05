package domain

import (
	"encoding/json"
	"fmt"
	"maps"
	"os"
	"strings"
	"testing"
)

const validationCasesPath = "../../../testdata/validation-cases.json"

type validationCase struct {
	Name   string         `json:"name"`
	Change map[string]any `json:"change"`
	Field  string         `json:"field"`
	Code   string         `json:"code"`
}

type validationCases struct {
	Valid    map[string]any   `json:"valid"`
	Accepted []validationCase `json:"accepted"`
	Rejected []validationCase `json:"rejected"`
}

func loadValidationCases(t *testing.T) validationCases {
	t.Helper()
	raw, err := os.ReadFile(validationCasesPath)
	if err != nil {
		t.Fatalf("read shared cases: %v", err)
	}
	var cases validationCases
	if err := json.Unmarshal(raw, &cases); err != nil {
		t.Fatalf("decode shared cases: %v", err)
	}
	if len(cases.Accepted) == 0 || len(cases.Rejected) == 0 {
		t.Fatal("the shared cases are empty")
	}
	return cases
}

// expandCaseValue turns the file's shorthand markers into real values.
func expandCaseValue(value any) any {
	object, isObject := value.(map[string]any)
	if !isObject {
		return value
	}
	if text, ok := object["$repeat"].(string); ok {
		count, _ := object["count"].(float64)
		return strings.Repeat(text, int(count))
	}
	if size, ok := object["$attributes"].(float64); ok {
		attributes := make(map[string]any, int(size))
		for i := range int(size) {
			attributes[fmt.Sprintf("key_%d", i)] = "value"
		}
		return attributes
	}
	expanded := make(map[string]any, len(object))
	for key, inner := range object {
		expanded[key] = expandCaseValue(inner)
	}
	return expanded
}

func rawInputFor(base, change map[string]any) RawEntityInput {
	values := maps.Clone(base)
	for key, value := range change {
		values[key] = expandCaseValue(value)
	}
	return RawEntityInput{
		Name:        values["name"],
		Type:        values["type"],
		Status:      values["status"],
		Description: values["description"],
		Attributes:  values["attributes"],
		Latitude:    values["latitude"],
		Longitude:   values["longitude"],
	}
}

func TestSharedCases_Accepted(t *testing.T) {
	cases := loadValidationCases(t)
	for _, tt := range cases.Accepted {
		t.Run(tt.Name, func(t *testing.T) {
			if _, violations := rawInputFor(cases.Valid, tt.Change).Validate(); violations != nil {
				t.Errorf("violations = %+v", violations)
			}
		})
	}
}

func TestSharedCases_Rejected(t *testing.T) {
	cases := loadValidationCases(t)
	for _, tt := range cases.Rejected {
		t.Run(tt.Name, func(t *testing.T) {
			_, violations := rawInputFor(cases.Valid, tt.Change).Validate()

			if len(violations) != 1 {
				t.Fatalf("violations = %+v, want exactly one", violations)
			}
			if violations[0].Field != tt.Field || violations[0].Code != tt.Code {
				t.Errorf("violation = %+v, want field %q and code %q", violations[0], tt.Field, tt.Code)
			}
		})
	}
}
