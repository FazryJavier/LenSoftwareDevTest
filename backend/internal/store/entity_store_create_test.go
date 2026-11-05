package store

import (
	"testing"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/internal/domain"
)

func TestCreate_FullInput_SavesEveryFieldWithoutSwappingCoordinates(t *testing.T) {
	ctx, _, store := newStoreInTx(t)
	description := "Armada Bandung"

	created, err := store.Create(ctx, domain.EntityInput{
		Name: "Truk", Type: "vehicle", Status: "maintenance", Description: &description,
		Attributes: map[string]string{"plate_number": "D 1234 ABC"},
		Latitude:   -6.9175, Longitude: 107.6191,
	})
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if created.ID == "" || created.CreatedAt.IsZero() || created.UpdatedAt.IsZero() {
		t.Errorf("generated fields are empty: %+v", created)
	}

	got, err := store.Get(ctx, created.ID)
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	if got.Name != "Truk" || got.Type != "vehicle" || got.Status != "maintenance" {
		t.Errorf("entity = %+v", got)
	}
	if got.Latitude != -6.9175 || got.Longitude != 107.6191 {
		t.Errorf("latitude = %v, longitude = %v", got.Latitude, got.Longitude)
	}
	if got.Description == nil || *got.Description != description || got.Attributes["plate_number"] != "D 1234 ABC" {
		t.Errorf("description = %v, attributes = %v", got.Description, got.Attributes)
	}
}

func TestCreate_MinimalInputAtZeroCoordinates_IsSaved(t *testing.T) {
	ctx, _, store := newStoreInTx(t)

	created, err := store.Create(ctx, domain.EntityInput{
		Name: "Nol", Type: "other", Status: "active", Attributes: map[string]string{},
	})
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if created.Latitude != 0 || created.Longitude != 0 {
		t.Errorf("latitude = %v, longitude = %v", created.Latitude, created.Longitude)
	}
	if created.Description != nil {
		t.Errorf("description = %v, want nil", *created.Description)
	}
	if created.Attributes == nil || len(created.Attributes) != 0 {
		t.Errorf("attributes = %#v, want empty", created.Attributes)
	}
}
