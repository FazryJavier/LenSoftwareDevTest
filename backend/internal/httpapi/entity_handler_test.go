package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/internal/domain"
)

type fakeEntityStore struct {
	page       domain.EntityPage
	entity     domain.Entity
	err        error
	lastFilter domain.ListFilter
	lastID     string
}

func (f *fakeEntityStore) Get(_ context.Context, id string) (domain.Entity, error) {
	f.lastID = id
	return f.entity, f.err
}

func (f *fakeEntityStore) List(_ context.Context, filter domain.ListFilter) (domain.EntityPage, error) {
	f.lastFilter = filter
	return f.page, f.err
}

func entityDeps(store EntityStore) Dependencies {
	deps := testDeps(&fakeHealthChecker{})
	deps.Entities = store
	return deps
}

type listBody struct {
	Data []map[string]any `json:"data"`
	Meta paginationMeta   `json:"meta"`
}

func decodeList(t *testing.T, raw []byte) listBody {
	t.Helper()
	var body listBody
	if err := json.Unmarshal(raw, &body); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	return body
}

func TestListEntities_WithData_ReturnsContractShape(t *testing.T) {
	created := time.Date(2026, 11, 5, 17, 0, 0, 0, time.FixedZone("WIB", 7*60*60))
	store := &fakeEntityStore{page: domain.EntityPage{
		Total: 201,
		Entities: []domain.Entity{{
			ID: "0b5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e11", Name: "Truk", Type: "vehicle", Status: "active",
			Latitude: -6.9175, Longitude: 107.6191, CreatedAt: created, UpdatedAt: created,
		}},
	}}

	rec := perform(t, NewRouter(entityDeps(store)), http.MethodGet, "/api/v1/entities", nil)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	decodeEnvelope(t, rec)
	body := decodeList(t, rec.Body.Bytes())
	if len(body.Data) != 1 {
		t.Fatalf("data = %+v", body.Data)
	}
	entity := body.Data[0]
	want := map[string]any{
		"name": "Truk", "type": "vehicle", "status": "active", "description": nil,
		"latitude": -6.9175, "longitude": 107.6191,
		"created_at": "2026-11-05T10:00:00Z", "updated_at": "2026-11-05T10:00:00Z",
	}
	for field, value := range want {
		got, ok := entity[field]
		if !ok {
			t.Errorf("field %q is missing", field)
		} else if got != value {
			t.Errorf("%s = %v, want %v", field, got, value)
		}
	}
	if attributes, ok := entity["attributes"].(map[string]any); !ok || len(attributes) != 0 {
		t.Errorf("attributes = %#v, want empty object", entity["attributes"])
	}
	if body.Meta != (paginationMeta{Page: 1, PerPage: 100, Total: 201, TotalPages: 3}) {
		t.Errorf("meta = %+v", body.Meta)
	}
}

func TestListEntities_NoData_ReturnsEmptyArrayNotNull(t *testing.T) {
	rec := perform(t, NewRouter(entityDeps(&fakeEntityStore{})), http.MethodGet, "/api/v1/entities", nil)

	if !strings.Contains(rec.Body.String(), `"data":[]`) {
		t.Errorf("body = %s, want an empty data array", rec.Body)
	}
	if meta := decodeList(t, rec.Body.Bytes()).Meta; meta.Total != 0 || meta.TotalPages != 0 {
		t.Errorf("meta = %+v", meta)
	}
}

func TestListEntities_Parameters_AreForwardedToStore(t *testing.T) {
	store := &fakeEntityStore{}

	rec := perform(t, NewRouter(entityDeps(store)), http.MethodGet,
		"/api/v1/entities?bbox=106,-7,108,-6&page=2&per_page=500", nil)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
	filter := store.lastFilter
	if filter.Page != 2 || filter.PerPage != 500 || filter.BoundingBox == nil || filter.BoundingBox.MaxLongitude != 108 {
		t.Errorf("filter = %+v", filter)
	}
}

func TestListEntities_InvalidQuery_Returns400WithoutCallingStore(t *testing.T) {
	store := &fakeEntityStore{err: errors.New("must not be called")}

	rec := perform(t, NewRouter(entityDeps(store)), http.MethodGet, "/api/v1/entities?bbox=bad", nil)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d", rec.Code)
	}
	body := decodeEnvelope(t, rec)
	assertSingleError(t, body, codeInvalidQuery)
	if body.Errors[0].Field == nil || *body.Errors[0].Field != "bbox" {
		t.Errorf("field = %v", body.Errors[0].Field)
	}
}

func TestListEntities_StoreFails_Returns500WithoutDetails(t *testing.T) {
	store := &fakeEntityStore{err: errors.New(`ERROR: relation "entities" does not exist (SQLSTATE 42P01)`)}

	rec := perform(t, NewRouter(entityDeps(store)), http.MethodGet, "/api/v1/entities", nil)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d", rec.Code)
	}
	assertSingleError(t, decodeEnvelope(t, rec), codeInternalError)
	for _, leak := range []string{"relation", "SQLSTATE"} {
		if strings.Contains(rec.Body.String(), leak) {
			t.Errorf("body leaks %q: %s", leak, rec.Body)
		}
	}
}

const existingID = "0b5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e11"

func TestGetEntity_Existing_ReturnsEntityWithNullMeta(t *testing.T) {
	store := &fakeEntityStore{entity: domain.Entity{
		ID: existingID, Name: "Truk", Type: "vehicle", Status: "active", Latitude: -6.9, Longitude: 107.6,
	}}

	rec := perform(t, NewRouter(entityDeps(store)), http.MethodGet, "/api/v1/entities/"+existingID, nil)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	body := decodeEnvelope(t, rec)
	if body.Meta != nil || body.Errors != nil {
		t.Errorf("meta = %v, errors = %v, want null", body.Meta, body.Errors)
	}
	data, ok := body.Data.(map[string]any)
	if !ok {
		t.Fatalf("data = %#v, want an object", body.Data)
	}
	if data["id"] != existingID || data["name"] != "Truk" || data["latitude"] != -6.9 {
		t.Errorf("data = %+v", data)
	}
	if store.lastID != existingID {
		t.Errorf("store received %q", store.lastID)
	}
}

func TestGetEntity_UppercaseID_IsAccepted(t *testing.T) {
	rec := perform(t, NewRouter(entityDeps(&fakeEntityStore{})), http.MethodGet,
		"/api/v1/entities/"+strings.ToUpper(existingID), nil)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", rec.Code)
	}
}

func TestGetEntity_Missing_Returns404(t *testing.T) {
	store := &fakeEntityStore{err: domain.ErrNotFound}

	rec := perform(t, NewRouter(entityDeps(store)), http.MethodGet, "/api/v1/entities/"+existingID, nil)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
	body := decodeEnvelope(t, rec)
	assertSingleError(t, body, codeNotFound)
	if body.Message != "Entity not found." {
		t.Errorf("message = %q", body.Message)
	}
}

func TestGetEntity_InvalidID_Returns400WithoutCallingStore(t *testing.T) {
	tests := []string{
		"not-a-uuid",
		"123",
		"0b5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e1",
		"0b5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e111",
		"0b5f6c1e3d1a4c559d583f0a0a2c1e11",
		"gb5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e11",
	}
	for _, id := range tests {
		t.Run(id, func(t *testing.T) {
			store := &fakeEntityStore{}

			rec := perform(t, NewRouter(entityDeps(store)), http.MethodGet, "/api/v1/entities/"+id, nil)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400", rec.Code)
			}
			body := decodeEnvelope(t, rec)
			assertSingleError(t, body, codeInvalidID)
			if body.Errors[0].Field == nil || *body.Errors[0].Field != "id" {
				t.Errorf("field = %v", body.Errors[0].Field)
			}
			if store.lastID != "" {
				t.Errorf("store was called with %q", store.lastID)
			}
		})
	}
}

func TestGetEntity_StoreFails_Returns500WithoutDetails(t *testing.T) {
	store := &fakeEntityStore{err: errors.New("ERROR: connection refused (SQLSTATE 08006)")}

	rec := perform(t, NewRouter(entityDeps(store)), http.MethodGet, "/api/v1/entities/"+existingID, nil)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d", rec.Code)
	}
	assertSingleError(t, decodeEnvelope(t, rec), codeInternalError)
	if strings.Contains(rec.Body.String(), "SQLSTATE") {
		t.Errorf("body leaks details: %s", rec.Body)
	}
}
