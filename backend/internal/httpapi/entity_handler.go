package httpapi

import (
	"log/slog"
	"net/http"
)

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
