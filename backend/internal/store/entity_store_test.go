package store

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/internal/domain"
)

type seedEntity struct {
	id                  string
	name                string
	description         *string
	attributes          string
	longitude, latitude float64
	createdAt           time.Time
}

func insertEntity(ctx context.Context, t *testing.T, tx pgx.Tx, e seedEntity) {
	t.Helper()
	attributes := e.attributes
	if attributes == "" {
		attributes = "{}"
	}
	_, err := tx.Exec(ctx, `
		INSERT INTO entities (id, name, type, status, description, attributes, location, created_at)
		VALUES ($1, $2, 'vehicle', 'active', $3, $4::jsonb,
		        ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7)`,
		e.id, e.name, e.description, attributes, e.longitude, e.latitude, e.createdAt)
	if err != nil {
		t.Fatalf("insert entity %s: %v", e.name, err)
	}
}

func newStoreInTx(t *testing.T) (context.Context, pgx.Tx, *EntityStore) {
	t.Helper()
	ctx, _, pool := testDatabase(t)
	tx := rolledBackTx(ctx, t, pool)
	return ctx, tx, NewEntityStore(tx)
}

func names(page domain.EntityPage) []string {
	result := make([]string, 0, len(page.Entities))
	for _, entity := range page.Entities {
		result = append(result, entity.Name)
	}
	return result
}

func assertNames(t *testing.T, page domain.EntityPage, want ...string) {
	t.Helper()
	got := names(page)
	if len(got) != len(want) {
		t.Fatalf("names = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("names = %v, want %v", got, want)
		}
	}
}

const (
	idA = "00000000-0000-4000-8000-00000000000a"
	idB = "00000000-0000-4000-8000-00000000000b"
	idC = "00000000-0000-4000-8000-00000000000c"
)

var baseTime = time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

func TestList_NoEntities_ReturnsEmptyPage(t *testing.T) {
	ctx, _, store := newStoreInTx(t)

	page, err := store.List(ctx, domain.ListFilter{Page: 1, PerPage: 10})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if page.Total != 0 || len(page.Entities) != 0 {
		t.Errorf("page = %+v, want empty", page)
	}
}

func TestList_Entity_ReturnsAllFieldsWithoutSwappingCoordinates(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	description := "Armada Bandung"
	insertEntity(ctx, t, tx, seedEntity{
		id: idA, name: "Truk", description: &description, attributes: `{"plate_number":"D 1234 ABC"}`,
		longitude: 107.6191, latitude: -6.9175, createdAt: baseTime,
	})

	page, err := store.List(ctx, domain.ListFilter{Page: 1, PerPage: 10})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(page.Entities) != 1 {
		t.Fatalf("entities = %d, want 1", len(page.Entities))
	}
	got := page.Entities[0]
	if got.ID != idA || got.Name != "Truk" || got.Type != "vehicle" || got.Status != "active" {
		t.Errorf("entity = %+v", got)
	}
	if got.Latitude != -6.9175 || got.Longitude != 107.6191 {
		t.Errorf("latitude = %v, longitude = %v", got.Latitude, got.Longitude)
	}
	if got.Description == nil || *got.Description != description {
		t.Errorf("description = %v", got.Description)
	}
	if got.Attributes["plate_number"] != "D 1234 ABC" {
		t.Errorf("attributes = %v", got.Attributes)
	}
	if !got.CreatedAt.Equal(baseTime) || got.UpdatedAt.IsZero() {
		t.Errorf("created_at = %v, updated_at = %v", got.CreatedAt, got.UpdatedAt)
	}
}

func TestList_NullDescriptionAndEmptyAttributes_AreReturned(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	insertEntity(ctx, t, tx, seedEntity{id: idA, name: "Kosong", createdAt: baseTime})

	page, err := store.List(ctx, domain.ListFilter{Page: 1, PerPage: 10})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if page.Entities[0].Description != nil {
		t.Errorf("description = %v, want nil", *page.Entities[0].Description)
	}
	if page.Entities[0].Attributes == nil || len(page.Entities[0].Attributes) != 0 {
		t.Errorf("attributes = %#v, want empty map", page.Entities[0].Attributes)
	}
}

func TestList_OrdersNewestFirstThenByID(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	insertEntity(ctx, t, tx, seedEntity{id: idA, name: "lama", createdAt: baseTime})
	insertEntity(ctx, t, tx, seedEntity{id: idB, name: "sama-b", createdAt: baseTime.Add(time.Hour)})
	insertEntity(ctx, t, tx, seedEntity{id: idC, name: "sama-c", createdAt: baseTime.Add(time.Hour)})

	page, err := store.List(ctx, domain.ListFilter{Page: 1, PerPage: 10})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	assertNames(t, page, "sama-c", "sama-b", "lama")
}

func TestList_Pagination_ReturnsRequestedPageAndFullTotal(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	insertEntity(ctx, t, tx, seedEntity{id: idA, name: "satu", createdAt: baseTime.Add(2 * time.Hour)})
	insertEntity(ctx, t, tx, seedEntity{id: idB, name: "dua", createdAt: baseTime.Add(time.Hour)})
	insertEntity(ctx, t, tx, seedEntity{id: idC, name: "tiga", createdAt: baseTime})

	tests := []struct {
		page, perPage int
		want          []string
	}{
		{1, 2, []string{"satu", "dua"}},
		{2, 2, []string{"tiga"}},
		{3, 2, nil},
	}
	for _, tt := range tests {
		page, err := store.List(ctx, domain.ListFilter{Page: tt.page, PerPage: tt.perPage})
		if err != nil {
			t.Fatalf("List() error = %v", err)
		}
		assertNames(t, page, tt.want...)
		if page.Total != 3 {
			t.Errorf("page %d total = %d, want 3", tt.page, page.Total)
		}
	}
}

func TestList_BoundingBox_FiltersByLongitudeAndLatitude(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	insertEntity(ctx, t, tx, seedEntity{id: idA, name: "bandung", longitude: 107.6, latitude: -6.9, createdAt: baseTime})
	insertEntity(ctx, t, tx, seedEntity{id: idB, name: "jakarta", longitude: 106.8, latitude: -6.2, createdAt: baseTime})
	// Longitude and latitude swapped: only this one matches if the store mixes them up.
	insertEntity(ctx, t, tx, seedEntity{id: idC, name: "tertukar", longitude: -6.9, latitude: 75, createdAt: baseTime})

	box := &domain.BoundingBox{MinLongitude: 107, MinLatitude: -7.5, MaxLongitude: 108, MaxLatitude: -6.5}
	page, err := store.List(ctx, domain.ListFilter{BoundingBox: box, Page: 1, PerPage: 10})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	assertNames(t, page, "bandung")
	if page.Total != 1 {
		t.Errorf("total = %d, want it to count only the area", page.Total)
	}
}

func TestList_BoundingBox_IncludesPointsOnItsEdge(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	insertEntity(ctx, t, tx, seedEntity{id: idA, name: "sudut", longitude: 107, latitude: -7, createdAt: baseTime})

	box := &domain.BoundingBox{MinLongitude: 107, MinLatitude: -7, MaxLongitude: 108, MaxLatitude: -6}
	page, err := store.List(ctx, domain.ListFilter{BoundingBox: box, Page: 1, PerPage: 10})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	assertNames(t, page, "sudut")
}

func TestList_WorldBoundingBox_IncludesPointsEverywhere(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	insertEntity(ctx, t, tx, seedEntity{id: idA, name: "barat", longitude: -180, latitude: -90, createdAt: baseTime})
	insertEntity(ctx, t, tx, seedEntity{id: idB, name: "timur", longitude: 180, latitude: 90, createdAt: baseTime})
	insertEntity(ctx, t, tx, seedEntity{id: idC, name: "tengah", longitude: 0, latitude: 0, createdAt: baseTime})

	box := &domain.BoundingBox{MinLongitude: -180, MinLatitude: -90, MaxLongitude: 180, MaxLatitude: 90}
	page, err := store.List(ctx, domain.ListFilter{BoundingBox: box, Page: 1, PerPage: 10})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if page.Total != 3 {
		t.Errorf("total = %d, names = %v, want all 3", page.Total, names(page))
	}
}

func TestList_LargeBoundingBox_ExcludesPointsOutsideTheRectangle(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	insertEntity(ctx, t, tx, seedEntity{id: idA, name: "dalam", longitude: 100, latitude: 0, createdAt: baseTime})
	insertEntity(ctx, t, tx, seedEntity{id: idB, name: "luar", longitude: 100, latitude: 75, createdAt: baseTime})

	box := &domain.BoundingBox{MinLongitude: 0, MinLatitude: -60, MaxLongitude: 170, MaxLatitude: 60}
	page, err := store.List(ctx, domain.ListFilter{BoundingBox: box, Page: 1, PerPage: 10})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	assertNames(t, page, "dalam")
}

func TestGet_ExistingEntity_ReturnsAllFieldsWithoutSwappingCoordinates(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	description := "Armada Bandung"
	insertEntity(ctx, t, tx, seedEntity{
		id: idA, name: "Truk", description: &description, attributes: `{"plate_number":"D 1234 ABC"}`,
		longitude: 107.6191, latitude: -6.9175, createdAt: baseTime,
	})
	insertEntity(ctx, t, tx, seedEntity{id: idB, name: "Lain", createdAt: baseTime})

	got, err := store.Get(ctx, idA)
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	if got.ID != idA || got.Name != "Truk" {
		t.Errorf("entity = %+v", got)
	}
	if got.Latitude != -6.9175 || got.Longitude != 107.6191 {
		t.Errorf("latitude = %v, longitude = %v", got.Latitude, got.Longitude)
	}
	if got.Description == nil || *got.Description != description || got.Attributes["plate_number"] != "D 1234 ABC" {
		t.Errorf("description = %v, attributes = %v", got.Description, got.Attributes)
	}
}

func TestGet_UppercaseID_FindsEntity(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	insertEntity(ctx, t, tx, seedEntity{id: idA, name: "Truk", createdAt: baseTime})

	got, err := store.Get(ctx, strings.ToUpper(idA))
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	if got.ID != idA {
		t.Errorf("ID = %q, want the stored form %q", got.ID, idA)
	}
}

func TestGet_MissingEntity_ReturnsNotFound(t *testing.T) {
	ctx, _, store := newStoreInTx(t)

	_, err := store.Get(ctx, idA)
	if !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("error = %v, want domain.ErrNotFound", err)
	}
}
