// Package store persists application data in PostgreSQL.
package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	// Registers the "pgx" database/sql driver, which goose requires.
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/migrations"
)

// NewPool opens the connection pool used by the application.
func NewPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("create connection pool: %w", err)
	}
	return pool, nil
}

// Migrate applies every pending migration. Applying them again changes nothing.
func Migrate(ctx context.Context, databaseURL string) (err error) {
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return fmt.Errorf("open migration connection: %w", err)
	}

	provider, err := goose.NewProvider(goose.DialectPostgres, db, migrations.FS)
	if err != nil {
		return fmt.Errorf("create migration provider: %w", errors.Join(err, db.Close()))
	}
	defer func() {
		// The provider owns the connection once it has been created.
		if closeErr := provider.Close(); closeErr != nil && err == nil {
			err = fmt.Errorf("close migration connection: %w", closeErr)
		}
	}()

	if _, err := provider.Up(ctx); err != nil {
		return fmt.Errorf("apply migrations: %w", err)
	}
	return nil
}
