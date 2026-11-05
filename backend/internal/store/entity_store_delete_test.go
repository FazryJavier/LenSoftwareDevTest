package store

import (
	"errors"
	"testing"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/internal/domain"
)

func TestDelete_ExistingEntity_RemovesOnlyThatRow(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	insertEntity(ctx, t, tx, seedEntity{id: idA, name: "Target", createdAt: baseTime})
	insertEntity(ctx, t, tx, seedEntity{id: idB, name: "Lain", createdAt: baseTime})

	if err := store.Delete(ctx, idA); err != nil {
		t.Fatalf("Delete() error = %v", err)
	}

	if _, err := store.Get(ctx, idA); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("Get(deleted) error = %v, want domain.ErrNotFound", err)
	}
	if _, err := store.Get(ctx, idB); err != nil {
		t.Errorf("Get(other) error = %v, want the other entity untouched", err)
	}
}

func TestDelete_Twice_ReturnsNotFound(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	insertEntity(ctx, t, tx, seedEntity{id: idA, name: "Target", createdAt: baseTime})

	if err := store.Delete(ctx, idA); err != nil {
		t.Fatalf("first Delete() error = %v", err)
	}
	if err := store.Delete(ctx, idA); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("second Delete() error = %v, want domain.ErrNotFound", err)
	}
}
