package httpapi

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/internal/domain"
)

func getEntityHandler(entities EntityStore, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if !uuidPattern.MatchString(id) {
			field := "id"
			writeError(w, http.StatusBadRequest, "Invalid entity ID.",
				errorItem{Field: &field, Code: codeInvalidID, Message: "id must be a UUID."})
			return
		}

		entity, err := entities.Get(r.Context(), id)
		if errors.Is(err, domain.ErrNotFound) {
			writeError(w, http.StatusNotFound, "Entity not found.", generalError(codeNotFound, "Entity not found."))
			return
		}
		if err != nil {
			logger.ErrorContext(r.Context(), "get entity failed",
				"request_id", requestIDFrom(r.Context()),
				"error", err,
			)
			writeError(w, http.StatusInternalServerError, "Internal server error.",
				generalError(codeInternalError, "Internal server error."))
			return
		}

		writeSuccess(w, http.StatusOK, "Entity retrieved.", newEntityResponse(entity), nil)
	})
}

func listEntitiesHandler(entities EntityStore, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		filter, problems := parseListQuery(r.URL.Query())
		if problems != nil {
			writeError(w, http.StatusBadRequest, "Invalid query parameters.", problems...)
			return
		}

		page, err := entities.List(r.Context(), filter)
		if err != nil {
			logger.ErrorContext(r.Context(), "list entities failed",
				"request_id", requestIDFrom(r.Context()),
				"error", err,
			)
			writeError(w, http.StatusInternalServerError, "Internal server error.",
				generalError(codeInternalError, "Internal server error."))
			return
		}

		body := make([]entityResponse, 0, len(page.Entities))
		for _, entity := range page.Entities {
			body = append(body, newEntityResponse(entity))
		}
		writeSuccess(w, http.StatusOK, "Entities retrieved.", body, newPaginationMeta(filter, page.Total))
	})
}
