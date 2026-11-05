package httpapi

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/FazryJavier/LenSoftwareDevTest/backend/internal/domain"
)

// readEntityInput writes the error response itself and reports false when the body is unusable.
func readEntityInput(w http.ResponseWriter, r *http.Request) (domain.EntityInput, bool) {
	var request entityRequest
	if failure := decodeJSONBody(w, r, &request); failure != nil {
		writeError(w, failure.status, failure.message, failure.item)
		return domain.EntityInput{}, false
	}

	input, violations := request.toDomain().Validate()
	if violations != nil {
		writeError(w, http.StatusUnprocessableEntity, "Validation failed.", newViolationItems(violations)...)
		return domain.EntityInput{}, false
	}
	return input, true
}

// readEntityID writes the error response itself and reports false when the ID is not a UUID.
func readEntityID(w http.ResponseWriter, r *http.Request) (string, bool) {
	id := r.PathValue("id")
	if !uuidPattern.MatchString(id) {
		field := "id"
		writeError(w, http.StatusBadRequest, "Invalid entity ID.",
			errorItem{Field: &field, Code: codeInvalidID, Message: "id must be a UUID."})
		return "", false
	}
	return id, true
}

// writeStoreFailure answers for an error from the store, keeping its details in the log.
func writeStoreFailure(w http.ResponseWriter, r *http.Request, logger *slog.Logger, action string, err error) {
	if errors.Is(err, domain.ErrNotFound) {
		writeError(w, http.StatusNotFound, "Entity not found.", generalError(codeNotFound, "Entity not found."))
		return
	}
	logger.ErrorContext(r.Context(), action+" failed",
		"request_id", requestIDFrom(r.Context()),
		"error", err,
	)
	writeError(w, http.StatusInternalServerError, "Internal server error.",
		generalError(codeInternalError, "Internal server error."))
}

func createEntityHandler(entities EntityStore, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		input, ok := readEntityInput(w, r)
		if !ok {
			return
		}

		entity, err := entities.Create(r.Context(), input)
		if err != nil {
			writeStoreFailure(w, r, logger, "create entity", err)
			return
		}

		w.Header().Set("Location", "/api/v1/entities/"+entity.ID)
		writeSuccess(w, http.StatusCreated, "Entity created.", newEntityResponse(entity), nil)
	})
}

func updateEntityHandler(entities EntityStore, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id, ok := readEntityID(w, r)
		if !ok {
			return
		}
		input, ok := readEntityInput(w, r)
		if !ok {
			return
		}

		entity, err := entities.Update(r.Context(), id, input)
		if err != nil {
			writeStoreFailure(w, r, logger, "update entity", err)
			return
		}

		writeSuccess(w, http.StatusOK, "Entity updated.", newEntityResponse(entity), nil)
	})
}

func deleteEntityHandler(entities EntityStore, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id, ok := readEntityID(w, r)
		if !ok {
			return
		}

		if err := entities.Delete(r.Context(), id); err != nil {
			writeStoreFailure(w, r, logger, "delete entity", err)
			return
		}

		writeSuccess(w, http.StatusOK, "Entity deleted.", nil, nil)
	})
}

func getEntityHandler(entities EntityStore, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id, ok := readEntityID(w, r)
		if !ok {
			return
		}

		entity, err := entities.Get(r.Context(), id)
		if err != nil {
			writeStoreFailure(w, r, logger, "get entity", err)
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
			writeStoreFailure(w, r, logger, "list entities", err)
			return
		}

		body := make([]entityResponse, 0, len(page.Entities))
		for _, entity := range page.Entities {
			body = append(body, newEntityResponse(entity))
		}
		writeSuccess(w, http.StatusOK, "Entities retrieved.", body, newPaginationMeta(filter, page.Total))
	})
}
