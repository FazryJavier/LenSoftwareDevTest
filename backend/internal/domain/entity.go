// Package domain holds the application's core types and rules.
package domain

import "time"

// EntityType is the kind of real-world object an entity represents.
type EntityType string

// EntityStatus is the operational state of an entity.
type EntityStatus string

// Entity is an object with a geographic location.
type Entity struct {
	ID          string
	Name        string
	Type        EntityType
	Status      EntityStatus
	Description *string
	Attributes  map[string]string
	Latitude    float64
	Longitude   float64
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// BoundingBox is a longitude/latitude rectangle. It does not cross the antimeridian.
type BoundingBox struct {
	MinLongitude float64
	MinLatitude  float64
	MaxLongitude float64
	MaxLatitude  float64
}

// ListFilter selects a page of entities. A nil BoundingBox means everywhere.
type ListFilter struct {
	BoundingBox *BoundingBox
	Types       []string // Empty means every type.
	Statuses    []string // Empty means every status.
	Page        int
	PerPage     int
}

// EntityPage is one page of entities and the number of entities across all pages.
type EntityPage struct {
	Entities []Entity
	Total    int
}
