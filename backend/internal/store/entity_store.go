package store

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/internal/domain"
)

// DBTX is satisfied by both a connection pool and a transaction, which lets integration
// tests run every query inside a transaction that is rolled back.
type DBTX interface {
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

const (
	entityColumns = `id::text, name, type, status, description, attributes,
		ST_Y(location::geometry), ST_X(location::geometry), created_at, updated_at`

	// The geometry cast matches the expression index. It also gives the rectangle the
	// longitude/latitude meaning a map viewport has, including at world scale.
	boundingBoxCondition = "ST_Intersects(location::geometry, ST_MakeEnvelope($%d, $%d, $%d, $%d, 4326))"
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
	where, args := listConditions(filter)

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

// Create stores a validated entity and returns it as saved.
func (s *EntityStore) Create(ctx context.Context, input domain.EntityInput) (domain.Entity, error) {
	rows, err := s.db.Query(ctx, `
		INSERT INTO entities (name, type, status, description, attributes, location)
		VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography)
		RETURNING `+entityColumns,
		input.Name, input.Type, input.Status, input.Description, input.Attributes, input.Longitude, input.Latitude)
	if err != nil {
		return domain.Entity{}, fmt.Errorf("create entity: %w", err)
	}
	entity, err := pgx.CollectExactlyOneRow(rows, scanEntity)
	if err != nil {
		return domain.Entity{}, fmt.Errorf("read created entity: %w", err)
	}
	return entity, nil
}

// Update replaces an entity's data, or returns domain.ErrNotFound when it does not exist.
func (s *EntityStore) Update(ctx context.Context, id string, input domain.EntityInput) (domain.Entity, error) {
	// clock_timestamp, because now() stays at the start of the transaction.
	rows, err := s.db.Query(ctx, `
		UPDATE entities
		SET name = $2, type = $3, status = $4, description = $5, attributes = $6,
		    location = ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography,
		    updated_at = clock_timestamp()
		WHERE id = $1::uuid
		RETURNING `+entityColumns,
		id, input.Name, input.Type, input.Status, input.Description, input.Attributes, input.Longitude, input.Latitude)
	if err != nil {
		return domain.Entity{}, fmt.Errorf("update entity: %w", err)
	}
	entity, err := pgx.CollectExactlyOneRow(rows, scanEntity)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Entity{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.Entity{}, fmt.Errorf("read updated entity: %w", err)
	}
	return entity, nil
}

// Delete removes an entity permanently, or returns domain.ErrNotFound when it does not exist.
func (s *EntityStore) Delete(ctx context.Context, id string) error {
	tag, err := s.db.Exec(ctx, "DELETE FROM entities WHERE id = $1::uuid", id)
	if err != nil {
		return fmt.Errorf("delete entity: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
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

// listConditions builds the WHERE clause. Its text comes only from constants, and every
// value is passed as a parameter.
func listConditions(filter domain.ListFilter) (string, []any) {
	var conditions []string
	var args []any
	if box := filter.BoundingBox; box != nil {
		next := len(args) + 1
		conditions = append(conditions, fmt.Sprintf(boundingBoxCondition, next, next+1, next+2, next+3))
		args = append(args, box.MinLongitude, box.MinLatitude, box.MaxLongitude, box.MaxLatitude)
	}
	if len(filter.Types) > 0 {
		args = append(args, filter.Types)
		conditions = append(conditions, fmt.Sprintf("type = ANY($%d)", len(args)))
	}
	if len(filter.Statuses) > 0 {
		args = append(args, filter.Statuses)
		conditions = append(conditions, fmt.Sprintf("status = ANY($%d)", len(args)))
	}
	if len(conditions) == 0 {
		return "", nil
	}
	return " WHERE " + strings.Join(conditions, " AND "), args
}

func scanEntity(row pgx.CollectableRow) (domain.Entity, error) {
	var entity domain.Entity
	err := row.Scan(
		&entity.ID, &entity.Name, &entity.Type, &entity.Status, &entity.Description, &entity.Attributes,
		&entity.Latitude, &entity.Longitude, &entity.CreatedAt, &entity.UpdatedAt,
	)
	return entity, err
}
