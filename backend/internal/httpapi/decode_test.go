package httpapi

import (
	"net/url"
	"testing"
)

func mustQuery(t *testing.T, raw string) url.Values {
	t.Helper()
	query, err := url.ParseQuery(raw)
	if err != nil {
		t.Fatalf("parse query %q: %v", raw, err)
	}
	return query
}

func TestParseListQuery_NoParameters_UsesDefaults(t *testing.T) {
	filter, problems := parseListQuery(url.Values{})

	if problems != nil {
		t.Fatalf("problems = %+v", problems)
	}
	if filter.Page != 1 || filter.PerPage != 100 || filter.BoundingBox != nil {
		t.Errorf("filter = %+v", filter)
	}
}

func TestParseListQuery_ValidValues_AreAccepted(t *testing.T) {
	tests := []struct {
		name  string
		query string
	}{
		{"smallest page", "page=1"},
		{"largest page", "page=1000000"},
		{"smallest per_page", "per_page=1"},
		{"largest per_page", "per_page=500"},
		{"normal bbox", "bbox=106.6,-7.1,107.8,-6.1"},
		{"world bbox", "bbox=-180,-90,180,90"},
		{"bbox containing zero", "bbox=-1,-1,0,0"},
		{"unknown parameter is ignored", "other=value"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if _, problems := parseListQuery(mustQuery(t, tt.query)); problems != nil {
				t.Errorf("problems = %+v", problems)
			}
		})
	}
}

func TestParseListQuery_BoundingBox_MapsOrderCorrectly(t *testing.T) {
	filter, problems := parseListQuery(mustQuery(t, "bbox=106.6,-7.1,107.8,-6.1"))
	if problems != nil {
		t.Fatalf("problems = %+v", problems)
	}
	box := filter.BoundingBox
	if box.MinLongitude != 106.6 || box.MinLatitude != -7.1 || box.MaxLongitude != 107.8 || box.MaxLatitude != -6.1 {
		t.Errorf("box = %+v", box)
	}
}

func TestParseListQuery_InvalidValues_NameTheField(t *testing.T) {
	tests := []struct {
		name, query, field string
	}{
		{"page zero", "page=0", "page"},
		{"page negative", "page=-1", "page"},
		{"page above limit", "page=1000001", "page"},
		{"page text", "page=abc", "page"},
		{"page decimal", "page=1.5", "page"},
		{"page empty", "page=", "page"},
		{"page overflow", "page=99999999999999999999", "page"},
		{"per_page zero", "per_page=0", "per_page"},
		{"per_page above limit", "per_page=501", "per_page"},
		{"per_page text", "per_page=abc", "per_page"},
		{"bbox empty", "bbox=", "bbox"},
		{"bbox three parts", "bbox=1,2,3", "bbox"},
		{"bbox five parts", "bbox=1,2,3,4,5", "bbox"},
		{"bbox text", "bbox=a,b,c,d", "bbox"},
		{"bbox NaN", "bbox=NaN,0,1,1", "bbox"},
		{"bbox infinity", "bbox=-Inf,0,1,1", "bbox"},
		{"bbox longitude below range", "bbox=-180.1,0,1,1", "bbox"},
		{"bbox longitude above range", "bbox=0,0,180.1,1", "bbox"},
		{"bbox latitude below range", "bbox=0,-90.1,1,1", "bbox"},
		{"bbox latitude above range", "bbox=0,0,1,90.1", "bbox"},
		{"bbox min longitude above max", "bbox=10,0,5,1", "bbox"},
		{"bbox min latitude above max", "bbox=0,10,1,5", "bbox"},
		{"bbox equal longitude", "bbox=5,0,5,1", "bbox"},
		{"bbox equal latitude", "bbox=0,5,1,5", "bbox"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, problems := parseListQuery(mustQuery(t, tt.query))
			if len(problems) != 1 {
				t.Fatalf("problems = %+v, want exactly one", problems)
			}
			if problems[0].Code != codeInvalidQuery {
				t.Errorf("code = %q", problems[0].Code)
			}
			if problems[0].Field == nil || *problems[0].Field != tt.field {
				t.Errorf("field = %v, want %q", problems[0].Field, tt.field)
			}
		})
	}
}

func TestParseListQuery_ManyInvalidValues_ReportsAll(t *testing.T) {
	_, problems := parseListQuery(mustQuery(t, "bbox=x&page=0&per_page=0"))

	if len(problems) != 3 {
		t.Errorf("problems = %+v, want 3", problems)
	}
}
