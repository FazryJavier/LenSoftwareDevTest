package httpapi

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/internal/domain"
)

func performCreate(t *testing.T, store EntityStore, contentType, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/v1/entities", strings.NewReader(body))
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	rec := httptest.NewRecorder()
	NewRouter(entityDeps(store)).ServeHTTP(rec, req)
	return rec
}

const validCreateBody = `{"name":"  Truk  ","type":"vehicle","status":"active","description":"Armada",` +
	`"attributes":{"plate_number":"D 1234 ABC"},"latitude":-6.9175,"longitude":107.6191}`

func TestCreateEntity_ValidBody_Returns201WithLocation(t *testing.T) {
	store := &fakeEntityStore{entity: domain.Entity{ID: existingID, Name: "Truk", Type: "vehicle", Status: "active"}}

	rec := performCreate(t, store, "application/json; charset=utf-8", validCreateBody)

	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	if got := rec.Header().Get("Location"); got != "/api/v1/entities/"+existingID {
		t.Errorf("Location = %q", got)
	}
	body := decodeEnvelope(t, rec)
	if !body.Success || body.Errors != nil || body.Meta != nil {
		t.Errorf("body = %+v", body)
	}
	saved := store.lastInput
	if saved.Name != "Truk" {
		t.Errorf("name = %q, want it trimmed", saved.Name)
	}
	if saved.Latitude != -6.9175 || saved.Longitude != 107.6191 {
		t.Errorf("latitude = %v, longitude = %v", saved.Latitude, saved.Longitude)
	}
}

func TestCreateEntity_ZeroCoordinates_AreAccepted(t *testing.T) {
	rec := performCreate(t, &fakeEntityStore{}, "application/json",
		`{"name":"Nol","type":"other","status":"active","latitude":0,"longitude":0}`)

	if rec.Code != http.StatusCreated {
		t.Errorf("status = %d, body = %s", rec.Code, rec.Body)
	}
}

func TestCreateEntity_BrokenRules_Returns422WithEveryViolationAndSavesNothing(t *testing.T) {
	store := &fakeEntityStore{}

	rec := performCreate(t, store, "application/json",
		`{"name":"","type":"spaceship","latitude":"north","longitude":181,"attributes":{"count":5}}`)

	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	body := decodeEnvelope(t, rec)
	got := map[string]string{}
	for _, item := range body.Errors {
		if item.Field == nil || item.Message == "" {
			t.Errorf("incomplete error: %+v", item)
			continue
		}
		got[*item.Field] = item.Code
	}
	want := map[string]string{
		"name": "required", "type": "invalid_enum", "status": "required",
		"latitude": "invalid_type", "longitude": "out_of_range", "attributes.count": "invalid_type",
	}
	for field, code := range want {
		if got[field] != code {
			t.Errorf("%s = %q, want %q; all errors = %v", field, got[field], code, got)
		}
	}
	if store.created {
		t.Error("the store was called for an invalid body")
	}
}

func TestCreateEntity_UnreadableBodies_AreRejected(t *testing.T) {
	tests := []struct {
		name, contentType, body string
		status                  int
		code                    string
	}{
		{"no content type", "", validCreateBody, http.StatusUnsupportedMediaType, codeUnsupportedMedia},
		{"text content type", "text/plain", validCreateBody, http.StatusUnsupportedMediaType, codeUnsupportedMedia},
		{"form content type", "application/x-www-form-urlencoded", validCreateBody, http.StatusUnsupportedMediaType, codeUnsupportedMedia},
		{"empty body", "application/json", "", http.StatusBadRequest, codeMalformedJSON},
		{"broken JSON", "application/json", `{"name":`, http.StatusBadRequest, codeMalformedJSON},
		{"array body", "application/json", `[]`, http.StatusBadRequest, codeMalformedJSON},
		{"second value", "application/json", validCreateBody + `{}`, http.StatusBadRequest, codeMalformedJSON},
		{"trailing garbage", "application/json", validCreateBody + `x`, http.StatusBadRequest, codeMalformedJSON},
		{"number too large", "application/json", `{"latitude":1e999}`, http.StatusBadRequest, codeMalformedJSON},
		{"unknown field", "application/json", `{"owner":"me"}`, http.StatusBadRequest, codeUnknownField},
		{"body too large", "application/json", `{"name":"` + strings.Repeat("a", 65<<10) + `"}`, http.StatusRequestEntityTooLarge, codePayloadTooLarge},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeEntityStore{}

			rec := performCreate(t, store, tt.contentType, tt.body)

			if rec.Code != tt.status {
				t.Fatalf("status = %d, want %d; body = %.200s", rec.Code, tt.status, rec.Body)
			}
			assertSingleError(t, decodeEnvelope(t, rec), tt.code)
			if store.created {
				t.Error("the store was called")
			}
		})
	}
}

func TestCreateEntity_BodyJustUnderTheLimit_IsRead(t *testing.T) {
	body := `{"name":"` + strings.Repeat("a", 64<<10-len(`{"name":""}`)) + `"}`

	rec := performCreate(t, &fakeEntityStore{}, "application/json", body)

	if rec.Code != http.StatusUnprocessableEntity {
		t.Errorf("status = %d, want the body to be read and fail validation", rec.Code)
	}
}

func TestCreateEntity_UnknownField_NamesTheField(t *testing.T) {
	rec := performCreate(t, &fakeEntityStore{}, "application/json", `{"owner":"me"}`)

	body := decodeEnvelope(t, rec)
	if len(body.Errors) != 1 || body.Errors[0].Field == nil || *body.Errors[0].Field != "owner" {
		t.Errorf("errors = %+v", body.Errors)
	}
}

func TestCreateEntity_StoreFails_Returns500WithoutDetails(t *testing.T) {
	store := &fakeEntityStore{err: errors.New("ERROR: duplicate key (SQLSTATE 23505)")}

	rec := performCreate(t, store, "application/json", validCreateBody)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d", rec.Code)
	}
	assertSingleError(t, decodeEnvelope(t, rec), codeInternalError)
	if strings.Contains(rec.Body.String(), "SQLSTATE") {
		t.Errorf("body leaks details: %s", rec.Body)
	}
}
