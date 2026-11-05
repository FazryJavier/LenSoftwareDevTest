package httpapi

import (
	"time"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/internal/domain"
)

type entityResponse struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Type        string            `json:"type"`
	Status      string            `json:"status"`
	Description *string           `json:"description"`
	Attributes  map[string]string `json:"attributes"`
	Latitude    float64           `json:"latitude"`
	Longitude   float64           `json:"longitude"`
	CreatedAt   string            `json:"created_at"`
	UpdatedAt   string            `json:"updated_at"`
}

type paginationMeta struct {
	Page       int `json:"page"`
	PerPage    int `json:"per_page"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

func newEntityResponse(entity domain.Entity) entityResponse {
	attributes := entity.Attributes
	if attributes == nil {
		attributes = map[string]string{}
	}
	return entityResponse{
		ID:          entity.ID,
		Name:        entity.Name,
		Type:        string(entity.Type),
		Status:      string(entity.Status),
		Description: entity.Description,
		Attributes:  attributes,
		Latitude:    entity.Latitude,
		Longitude:   entity.Longitude,
		CreatedAt:   entity.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:   entity.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func newPaginationMeta(filter domain.ListFilter, total int) paginationMeta {
	return paginationMeta{
		Page:       filter.Page,
		PerPage:    filter.PerPage,
		Total:      total,
		TotalPages: (total + filter.PerPage - 1) / filter.PerPage,
	}
}

// entityRequest uses untyped fields so that domain validation can report wrong types
// together with every other violation.
type entityRequest struct {
	Name        any `json:"name"`
	Type        any `json:"type"`
	Status      any `json:"status"`
	Description any `json:"description"`
	Attributes  any `json:"attributes"`
	Latitude    any `json:"latitude"`
	Longitude   any `json:"longitude"`
}

func (r entityRequest) toDomain() domain.RawEntityInput {
	return domain.RawEntityInput(r)
}

func newViolationItems(violations []domain.Violation) []errorItem {
	items := make([]errorItem, 0, len(violations))
	for _, violation := range violations {
		field := violation.Field
		items = append(items, errorItem{Field: &field, Code: violation.Code, Message: violation.Message})
	}
	return items
}
