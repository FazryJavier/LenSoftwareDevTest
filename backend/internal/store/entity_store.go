package store

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/internal/domain"
)

// DBTX is satisfied by both a connection pool and a transaction, which lets integration
// tests run every query inside a transaction that is rolled back.
type DBTX interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

const (
	entityColumns = `id::text, name, type, status, description, attributes,
		ST_Y(location::geometry), ST_X(location::geometry), created_at, updated_at`

	// The geometry cast matches the expression index. It also gives the rectangle the
	// longitude/latitude meaning a map viewport has, including at world scale.
	boundingBoxCondition = ` WHERE ST_Intersects(location::geometry, ST_MakeEnvelope($1, $2, $3, $4, 4326))`
)

// EntityStore reads and writes entities.
type EntityStore struct {
	db DBTX
}

// NewEntityStore creates an EntityStore.
func NewEntityStore(db DBTX) *EntityStore {
	return &EntityStore{db: db}
}

// List returns one page of entities, newest first.
func (s *EntityStore) List(ctx context.Context, filter domain.ListFilter) (domain.EntityPage, error) {
	where := ""
	var args []any
	if box := filter.BoundingBox; box != nil {
		where = boundingBoxCondition
		args = []any{box.MinLongitude, box.MinLatitude, box.MaxLongitude, box.MaxLatitude}
	}

	var total int
	if err := s.db.QueryRow(ctx, "SELECT count(*) FROM entities"+where, args...).Scan(&total); err != nil {
		return domain.EntityPage{}, fmt.Errorf("count entities: %w", err)
	}

	query := fmt.Sprintf("SELECT %s FROM entities%s ORDER BY created_at DESC, id DESC LIMIT $%d OFFSET $%d",
		entityColumns, where, len(args)+1, len(args)+2)
	args = append(args, filter.PerPage, (filter.Page-1)*filter.PerPage)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return domain.EntityPage{}, fmt.Errorf("list entities: %w", err)
	}
	entities, err := pgx.CollectRows(rows, scanEntity)
	if err != nil {
		return domain.EntityPage{}, fmt.Errorf("read entities: %w", err)
	}

	return domain.EntityPage{Entities: entities, Total: total}, nil
}

// Get returns one entity, or domain.ErrNotFound when it does not exist.
func (s *EntityStore) Get(ctx context.Context, id string) (domain.Entity, error) {
	rows, err := s.db.Query(ctx, "SELECT "+entityColumns+" FROM entities WHERE id = $1::uuid", id)
	if err != nil {
		return domain.Entity{}, fmt.Errorf("get entity: %w", err)
	}
	entity, err := pgx.CollectExactlyOneRow(rows, scanEntity)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Entity{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.Entity{}, fmt.Errorf("read entity: %w", err)
	}
	return entity, nil
}

func scanEntity(row pgx.CollectableRow) (domain.Entity, error) {
	var entity domain.Entity
	err := row.Scan(
		&entity.ID, &entity.Name, &entity.Type, &entity.Status, &entity.Description, &entity.Attributes,
		&entity.Latitude, &entity.Longitude, &entity.CreatedAt, &entity.UpdatedAt,
	)
	return entity, err
}
