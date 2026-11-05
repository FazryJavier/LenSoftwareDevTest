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
