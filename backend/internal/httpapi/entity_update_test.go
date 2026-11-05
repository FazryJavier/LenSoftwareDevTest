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

func performUpdate(t *testing.T, store EntityStore, id, contentType, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPut, "/api/v1/entities/"+id, strings.NewReader(body))
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	rec := httptest.NewRecorder()
	NewRouter(entityDeps(store)).ServeHTTP(rec, req)
	return rec
}

func TestUpdateEntity_ValidBody_Returns200WithSavedEntity(t *testing.T) {
	store := &fakeEntityStore{entity: domain.Entity{ID: existingID, Name: "Truk", Type: "vehicle", Status: "active"}}

	rec := performUpdate(t, store, existingID, "application/json", validCreateBody)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	body := decodeEnvelope(t, rec)
	if !body.Success || body.Message != "Entity updated." || body.Meta != nil {
		t.Errorf("body = %+v", body)
	}
	if store.lastID != existingID {
		t.Errorf("store received ID %q", store.lastID)
	}
	if store.lastInput.Name != "Truk" || store.lastInput.Latitude != -6.9175 || store.lastInput.Longitude != 107.6191 {
		t.Errorf("input = %+v", store.lastInput)
	}
}

func TestUpdateEntity_Rejections_DoNotReachTheStore(t *testing.T) {
	tests := []struct {
		name, id, contentType, body string
		status                      int
		code                        string
	}{
		{"invalid id", "not-a-uuid", "application/json", validCreateBody, http.StatusBadRequest, codeInvalidID},
		{"invalid id wins over a broken body", "not-a-uuid", "application/json", `{`, http.StatusBadRequest, codeInvalidID},
		{"wrong content type", existingID, "text/plain", validCreateBody, http.StatusUnsupportedMediaType, codeUnsupportedMedia},
		{"broken JSON", existingID, "application/json", `{"name":`, http.StatusBadRequest, codeMalformedJSON},
		{"unknown field", existingID, "application/json", `{"owner":"me"}`, http.StatusBadRequest, codeUnknownField},
		{"body too large", existingID, "application/json", `{"name":"` + strings.Repeat("a", 65<<10) + `"}`, http.StatusRequestEntityTooLarge, codePayloadTooLarge},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeEntityStore{}

			rec := performUpdate(t, store, tt.id, tt.contentType, tt.body)

			if rec.Code != tt.status {
				t.Fatalf("status = %d, want %d; body = %.200s", rec.Code, tt.status, rec.Body)
			}
			assertSingleError(t, decodeEnvelope(t, rec), tt.code)
			if store.updated {
				t.Error("the store was called")
			}
		})
	}
}

func TestUpdateEntity_BrokenRules_Returns422WithoutReachingTheStore(t *testing.T) {
	store := &fakeEntityStore{}

	rec := performUpdate(t, store, existingID, "application/json", `{"name":"","latitude":91}`)

	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	if body := decodeEnvelope(t, rec); len(body.Errors) < 2 {
		t.Errorf("errors = %+v, want every violation", body.Errors)
	}
	if store.updated {
		t.Error("the store was called")
	}
}

func TestUpdateEntity_Missing_Returns404(t *testing.T) {
	store := &fakeEntityStore{err: domain.ErrNotFound}

	rec := performUpdate(t, store, existingID, "application/json", validCreateBody)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
	assertSingleError(t, decodeEnvelope(t, rec), codeNotFound)
}

func TestUpdateEntity_StoreFails_Returns500WithoutDetails(t *testing.T) {
	store := &fakeEntityStore{err: errors.New("ERROR: deadlock detected (SQLSTATE 40P01)")}

	rec := performUpdate(t, store, existingID, "application/json", validCreateBody)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d", rec.Code)
	}
	assertSingleError(t, decodeEnvelope(t, rec), codeInternalError)
	if strings.Contains(rec.Body.String(), "SQLSTATE") {
		t.Errorf("body leaks details: %s", rec.Body)
	}
}
