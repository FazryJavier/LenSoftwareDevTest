package store

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

const pgCheckViolation = "23514"

// checkTestDatabaseName protects real data: these tests must never reach another database.
func checkTestDatabaseName(rawURL string) error {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return errors.New("TEST_DATABASE_URL is not a valid URL")
	}
	name := strings.TrimPrefix(parsed.Path, "/")
	if !strings.HasSuffix(name, "_test") {
		return fmt.Errorf("database %q does not end with _test", name)
	}
	return nil
}

func testDatabase(t *testing.T) (context.Context, string, *pgxpool.Pool) {
	t.Helper()
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		// A skip would otherwise report success in CI without testing anything.
		if os.Getenv("CI") != "" {
			t.Fatal("TEST_DATABASE_URL must be set in CI")
		}
		t.Skip("TEST_DATABASE_URL is not set")
	}
	if err := checkTestDatabaseName(databaseURL); err != nil {
		t.Fatalf("refusing to run: %v", err)
	}

	ctx := context.Background()
	if err := Migrate(ctx, databaseURL); err != nil {
		t.Fatalf("Migrate() error = %v", err)
	}
	pool, err := NewPool(ctx, databaseURL)
	if err != nil {
		t.Fatalf("NewPool() error = %v", err)
	}
	t.Cleanup(pool.Close)
	return ctx, databaseURL, pool
}

// rolledBackTx isolates a test: nothing it writes survives the test.
func rolledBackTx(ctx context.Context, t *testing.T, pool *pgxpool.Pool) pgx.Tx {
	t.Helper()
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatalf("Begin() error = %v", err)
	}
	t.Cleanup(func() {
		if err := tx.Rollback(ctx); err != nil && !errors.Is(err, pgx.ErrTxClosed) {
			t.Errorf("Rollback() error = %v", err)
		}
	})
	return tx
}

func TestCheckTestDatabaseName(t *testing.T) {
	tests := []struct {
		name    string
		url     string
		wantErr bool
	}{
		{"test database", "postgres://u:p@localhost:5432/geoentity_test", false},
		{"test database with params", "postgres://u:p@localhost/geoentity_test?sslmode=disable", false},
		{"real database", "postgres://u:p@localhost:5432/geoentity", true},
		{"suffix elsewhere", "postgres://u:p@host_test:5432/geoentity", true},
		{"no database", "postgres://u:p@localhost:5432", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := checkTestDatabaseName(tt.url)
			if (err != nil) != tt.wantErr {
				t.Errorf("checkTestDatabaseName() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestMigrate_CreatesEntitiesTableAndIndexes(t *testing.T) {
	ctx, _, pool := testDatabase(t)

	for _, relation := range []string{
		"entities",
		"entities_location_geometry_gist_idx",
		"entities_type_status_idx",
		"entities_created_at_id_idx",
	} {
		var found *string
		if err := pool.QueryRow(ctx, "SELECT to_regclass($1)::text", relation).Scan(&found); err != nil {
			t.Fatalf("look up %s: %v", relation, err)
		}
		if found == nil {
			t.Errorf("relation %s does not exist", relation)
		}
	}
}

func TestMigrate_RunTwice_Succeeds(t *testing.T) {
	ctx, databaseURL, _ := testDatabase(t)

	if err := Migrate(ctx, databaseURL); err != nil {
		t.Errorf("second Migrate() error = %v", err)
	}
}

func TestMigrate_LocationColumn_KeepsLongitudeAndLatitude(t *testing.T) {
	ctx, _, pool := testDatabase(t)
	tx := rolledBackTx(ctx, t, pool)

	var latitude, longitude float64
	err := tx.QueryRow(ctx, `
		INSERT INTO entities (name, type, status, location)
		VALUES ('Titik uji', 'other', 'active', ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)
		RETURNING ST_Y(location::geometry), ST_X(location::geometry)`,
		107.6191, -6.9175).Scan(&latitude, &longitude)
	if err != nil {
		t.Fatalf("insert: %v", err)
	}
	if latitude != -6.9175 || longitude != 107.6191 {
		t.Errorf("latitude = %v, longitude = %v", latitude, longitude)
	}
}

func TestMigrate_Constraints_RejectInvalidRows(t *testing.T) {
	ctx, _, pool := testDatabase(t)

	tests := []struct {
		name, entityName, entityType, status, attributes string
	}{
		{"blank name", "   ", "other", "active", "{}"},
		{"unknown type", "Uji", "spaceship", "active", "{}"},
		{"unknown status", "Uji", "other", "lost", "{}"},
		{"attributes not an object", "Uji", "other", "active", "[]"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tx := rolledBackTx(ctx, t, pool)
			_, err := tx.Exec(ctx, `
				INSERT INTO entities (name, type, status, attributes, location)
				VALUES ($1, $2, $3, $4::jsonb, ST_SetSRID(ST_MakePoint(0, 0), 4326)::geography)`,
				tt.entityName, tt.entityType, tt.status, tt.attributes)

			var pgErr *pgconn.PgError
			if !errors.As(err, &pgErr) || pgErr.Code != pgCheckViolation {
				t.Errorf("error = %v, want a check violation", err)
			}
		})
	}
}
