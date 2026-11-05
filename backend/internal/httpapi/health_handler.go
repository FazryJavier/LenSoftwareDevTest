package httpapi

import (
	"context"
	"log/slog"
	"net/http"
	"time"
)

const healthCheckTimeout = 2 * time.Second

// HealthChecker reports whether a dependency is reachable.
type HealthChecker interface {
	Ping(ctx context.Context) error
}

func healthHandler(checker HealthChecker, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), healthCheckTimeout)
		defer cancel()

		if err := checker.Ping(ctx); err != nil {
			logger.ErrorContext(r.Context(), "health check failed",
				"request_id", requestIDFrom(r.Context()),
				"error", err,
			)
			writeError(w, http.StatusServiceUnavailable, "Service unavailable.",
				generalError(codeUnavailable, "A required dependency is unavailable."))
			return
		}

		writeSuccess(w, http.StatusOK, "Service is healthy.", nil, nil)
	})
}
