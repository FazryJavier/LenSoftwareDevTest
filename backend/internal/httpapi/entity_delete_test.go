package httpapi

import (
	"errors"
	"net/http"
	"strings"
	"testing"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/internal/domain"
)

func TestDeleteEntity_Existing_Returns200WithNullData(t *testing.T) {
	store := &fakeEntityStore{}

	rec := perform(t, NewRouter(entityDeps(store)), http.MethodDelete, "/api/v1/entities/"+existingID, nil)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	body := decodeEnvelope(t, rec)
	if !body.Success || body.Data != nil || body.Errors != nil || body.Meta != nil {
		t.Errorf("body = %+v", body)
	}
	if store.lastID != existingID {
		t.Errorf("store received %q", store.lastID)
	}
}

func TestDeleteEntity_Missing_Returns404(t *testing.T) {
	store := &fakeEntityStore{err: domain.ErrNotFound}

	rec := perform(t, NewRouter(entityDeps(store)), http.MethodDelete, "/api/v1/entities/"+existingID, nil)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
	assertSingleError(t, decodeEnvelope(t, rec), codeNotFound)
}

func TestDeleteEntity_InvalidID_Returns400WithoutReachingTheStore(t *testing.T) {
	store := &fakeEntityStore{}

	rec := perform(t, NewRouter(entityDeps(store)), http.MethodDelete, "/api/v1/entities/not-a-uuid", nil)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rec.Code)
	}
	assertSingleError(t, decodeEnvelope(t, rec), codeInvalidID)
	if store.lastID != "" {
		t.Errorf("store was called with %q", store.lastID)
	}
}

func TestDeleteEntity_StoreFails_Returns500WithoutDetails(t *testing.T) {
	store := &fakeEntityStore{err: errors.New("ERROR: lock timeout (SQLSTATE 55P03)")}

	rec := perform(t, NewRouter(entityDeps(store)), http.MethodDelete, "/api/v1/entities/"+existingID, nil)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d", rec.Code)
	}
	assertSingleError(t, decodeEnvelope(t, rec), codeInternalError)
	if strings.Contains(rec.Body.String(), "SQLSTATE") {
		t.Errorf("body leaks details: %s", rec.Body)
	}
}
