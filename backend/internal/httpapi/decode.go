package httpapi

import (
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/internal/domain"
)

// uuidPattern rejects bad IDs here, because PostgreSQL would otherwise answer with an error
// that looks like a server failure.
var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

const (
	codeInvalidQuery = "invalid_query"
	codeInvalidID    = "invalid_id"

	defaultPage    = 1
	maxPage        = 1_000_000 // Keeps the computed OFFSET far from overflowing.
	defaultPerPage = 100
	maxPerPage     = 500

	boundingBoxParts = 4
)

// parseListQuery reports every invalid parameter at once.
func parseListQuery(query url.Values) (domain.ListFilter, []errorItem) {
	filter := domain.ListFilter{Page: defaultPage, PerPage: defaultPerPage}
	var problems []errorItem

	if query.Has("bbox") {
		box, ok := parseBoundingBox(query.Get("bbox"))
		if !ok {
			problems = append(problems, queryError("bbox",
				"bbox must be minLng,minLat,maxLng,maxLat within coordinate ranges, with each minimum below its maximum."))
		}
		filter.BoundingBox = box
	}
	if query.Has("page") {
		page, ok := parseBoundedInt(query.Get("page"), 1, maxPage)
		if !ok {
			problems = append(problems, queryError("page", "page must be an integer between 1 and 1000000."))
		}
		filter.Page = page
	}
	if query.Has("per_page") {
		perPage, ok := parseBoundedInt(query.Get("per_page"), 1, maxPerPage)
		if !ok {
			problems = append(problems, queryError("per_page", "per_page must be an integer between 1 and 500."))
		}
		filter.PerPage = perPage
	}

	return filter, problems
}

func queryError(field, message string) errorItem {
	return errorItem{Field: &field, Code: codeInvalidQuery, Message: message}
}

func parseBoundedInt(raw string, minimum, maximum int) (int, bool) {
	value, err := strconv.Atoi(raw)
	if err != nil || value < minimum || value > maximum {
		return 0, false
	}
	return value, true
}

func parseBoundingBox(raw string) (*domain.BoundingBox, bool) {
	parts := strings.Split(raw, ",")
	if len(parts) != boundingBoxParts {
		return nil, false
	}

	var values [boundingBoxParts]float64
	for i, part := range parts {
		value, err := strconv.ParseFloat(strings.TrimSpace(part), 64)
		if err != nil {
			return nil, false
		}
		values[i] = value
	}

	box := domain.BoundingBox{
		MinLongitude: values[0],
		MinLatitude:  values[1],
		MaxLongitude: values[2],
		MaxLatitude:  values[3],
	}
	// The comparisons also reject NaN, which ParseFloat accepts and every comparison fails.
	valid := box.MinLongitude >= -180 && box.MaxLongitude <= 180 &&
		box.MinLatitude >= -90 && box.MaxLatitude <= 90 &&
		box.MinLongitude < box.MaxLongitude && box.MinLatitude < box.MaxLatitude
	if !valid {
		return nil, false
	}
	return &box, true
}
