package store

import (
	"context"
	"slices"
	"testing"

	"github.com/jackc/pgx/v5"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/internal/domain"
)

func insertFilterEntity(ctx context.Context, t *testing.T, tx pgx.Tx, name, entityType, status string, longitude, latitude float64) {
	t.Helper()
	_, err := tx.Exec(ctx, `
		INSERT INTO entities (name, type, status, location)
		VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography)`,
		name, entityType, status, longitude, latitude)
	if err != nil {
		t.Fatalf("insert %s: %v", name, err)
	}
}

func TestList_Filters_ReturnOnlyMatchingEntitiesAndCountThem(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	insertFilterEntity(ctx, t, tx, "truk-aktif", "vehicle", "active", 107, -7)
	insertFilterEntity(ctx, t, tx, "truk-servis", "vehicle", "maintenance", 107, -7)
	insertFilterEntity(ctx, t, tx, "sensor-aktif", "iot_device", "active", 107, -7)
	insertFilterEntity(ctx, t, tx, "gedung-mati", "facility", "inactive", 107, -7)
	insertFilterEntity(ctx, t, tx, "truk-jauh", "vehicle", "active", 0, 50)

	box := &domain.BoundingBox{MinLongitude: 106, MinLatitude: -8, MaxLongitude: 108, MaxLatitude: -6}
	tests := []struct {
		name   string
		filter domain.ListFilter
		want   []string
	}{
		{"one type", domain.ListFilter{Types: []string{"vehicle"}},
			[]string{"truk-aktif", "truk-servis", "truk-jauh"}},
		{"many types", domain.ListFilter{Types: []string{"iot_device", "facility"}},
			[]string{"sensor-aktif", "gedung-mati"}},
		{"one status", domain.ListFilter{Statuses: []string{"inactive"}},
			[]string{"gedung-mati"}},
		{"many statuses", domain.ListFilter{Statuses: []string{"maintenance", "inactive"}},
			[]string{"truk-servis", "gedung-mati"}},
		{"type and status", domain.ListFilter{Types: []string{"vehicle"}, Statuses: []string{"active"}},
			[]string{"truk-aktif", "truk-jauh"}},
		{"type, status, and area", domain.ListFilter{Types: []string{"vehicle"}, Statuses: []string{"active"}, BoundingBox: box},
			[]string{"truk-aktif"}},
		{"nothing matches", domain.ListFilter{Types: []string{"other"}}, nil},
		{"no filters", domain.ListFilter{},
			[]string{"truk-aktif", "truk-servis", "sensor-aktif", "gedung-mati", "truk-jauh"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.filter.Page, tt.filter.PerPage = 1, 10

			page, err := store.List(ctx, tt.filter)
			if err != nil {
				t.Fatalf("List() error = %v", err)
			}
			got := names(page)
			slices.Sort(got)
			want := slices.Clone(tt.want)
			slices.Sort(want)
			if !slices.Equal(got, want) {
				t.Errorf("names = %v, want %v", got, want)
			}
			if page.Total != len(tt.want) {
				t.Errorf("total = %d, want %d", page.Total, len(tt.want))
			}
		})
	}
}

func TestList_FiltersWithPagination_LimitsPageButNotTotal(t *testing.T) {
	ctx, tx, store := newStoreInTx(t)
	insertFilterEntity(ctx, t, tx, "a", "vehicle", "active", 107, -7)
	insertFilterEntity(ctx, t, tx, "b", "vehicle", "active", 107, -7)
	insertFilterEntity(ctx, t, tx, "c", "vehicle", "active", 107, -7)
	insertFilterEntity(ctx, t, tx, "d", "other", "active", 107, -7)

	page, err := store.List(ctx, domain.ListFilter{Types: []string{"vehicle"}, Page: 2, PerPage: 2})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(page.Entities) != 1 || page.Total != 3 {
		t.Errorf("entities = %d, total = %d, want 1 and 3", len(page.Entities), page.Total)
	}
}
