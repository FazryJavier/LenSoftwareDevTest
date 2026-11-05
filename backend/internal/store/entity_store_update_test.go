package store

import (
	"errors"
	"testing"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/internal/domain"
)

func TestUpdate_ExistingEntity_ReplacesDataAndKeepsIdentity(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	description := "Lama"
	insertEntity(ctx, t, tx, seedEntity{
		id: idA, name: "Lama", description: &description, attributes: `{"old":"value"}`,
		longitude: 100, latitude: 1, createdAt: baseTime,
	})
	before, err := store.Get(ctx, idA)
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	newDescription := "Baru"

	updated, err := store.Update(ctx, idA, domain.EntityInput{
		Name: "Baru", Type: "facility", Status: "maintenance", Description: &newDescription,
		Attributes: map[string]string{"new": "value"},
		Latitude:   -6.9175, Longitude: 107.6191,
	})
	if err != nil {
		t.Fatalf("Update() error = %v", err)
	}

	got, err := store.Get(ctx, idA)
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	if got.Name != "Baru" || got.Type != "facility" || got.Status != "maintenance" {
		t.Errorf("entity = %+v", got)
	}
	if got.Latitude != -6.9175 || got.Longitude != 107.6191 {
		t.Errorf("latitude = %v, longitude = %v", got.Latitude, got.Longitude)
	}
	if got.Description == nil || *got.Description != "Baru" {
		t.Errorf("description = %v", got.Description)
	}
	if _, kept := got.Attributes["old"]; kept || got.Attributes["new"] != "value" {
		t.Errorf("attributes = %v, want them replaced", got.Attributes)
	}
	if updated.ID != idA || !got.CreatedAt.Equal(baseTime) {
		t.Errorf("id = %q, created_at = %v, want them unchanged", updated.ID, got.CreatedAt)
	}
	if !got.UpdatedAt.After(before.UpdatedAt) {
		t.Errorf("updated_at = %v, want it after %v", got.UpdatedAt, before.UpdatedAt)
	}
}

func TestUpdate_WithoutOptionalValues_ClearsThem(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	description := "Ada"
	insertEntity(ctx, t, tx, seedEntity{
		id: idA, name: "Truk", description: &description, attributes: `{"key":"value"}`, createdAt: baseTime,
	})

	got, err := store.Update(ctx, idA, domain.EntityInput{
		Name: "Truk", Type: "vehicle", Status: "active", Attributes: map[string]string{},
	})
	if err != nil {
		t.Fatalf("Update() error = %v", err)
	}
	if got.Description != nil {
		t.Errorf("description = %v, want nil", *got.Description)
	}
	if len(got.Attributes) != 0 {
		t.Errorf("attributes = %v, want empty", got.Attributes)
	}
}

func TestUpdate_OtherEntities_AreUntouched(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	insertEntity(ctx, t, tx, seedEntity{id: idA, name: "Target", createdAt: baseTime})
	insertEntity(ctx, t, tx, seedEntity{id: idB, name: "Lain", createdAt: baseTime})

	if _, err := store.Update(ctx, idA, domain.EntityInput{
		Name: "Berubah", Type: "other", Status: "active", Attributes: map[string]string{},
	}); err != nil {
		t.Fatalf("Update() error = %v", err)
	}

	other, err := store.Get(ctx, idB)
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	if other.Name != "Lain" {
		t.Errorf("name = %q, the other entity changed", other.Name)
	}
}

func TestUpdate_MissingEntity_ReturnsNotFound(t *testing.T) {
	ctx, _, store := newStoreInTx(t)

	_, err := store.Update(ctx, idA, domain.EntityInput{
		Name: "Truk", Type: "vehicle", Status: "active", Attributes: map[string]string{},
	})
	if !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("error = %v, want domain.ErrNotFound", err)
	}
}
