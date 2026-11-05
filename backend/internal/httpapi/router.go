// Package httpapi exposes the application over HTTP.
package httpapi

import (
	"log/slog"
	"net/http"
)

// Dependencies are the collaborators the HTTP layer needs.
type Dependencies struct {
	Health         HealthChecker
	AllowedOrigins []string
	Logger         *slog.Logger
}

// NewRouter builds the complete HTTP handler.
func NewRouter(deps Dependencies) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("GET /api/v1/health", healthHandler(deps.Health, deps.Logger))

	return withMiddleware(withEnvelopeFallback(mux), deps)
}

func withMiddleware(next http.Handler, deps Dependencies) http.Handler {
	handler := corsMiddleware(deps.AllowedOrigins)(next)
	handler = securityHeadersMiddleware(handler)
	handler = recoverMiddleware(deps.Logger)(handler)
	handler = loggingMiddleware(deps.Logger)(handler)
	return requestIDMiddleware(handler)
}

// withEnvelopeFallback returns the mux's own 404 and 405 responses as envelopes. ServeMux
// writes those as plain text, and it reports an empty pattern only when no route matched,
// so responses written by real handlers are never affected.
func withEnvelopeFallback(mux *http.ServeMux) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fallback, pattern := mux.Handler(r)
		if pattern != "" {
			mux.ServeHTTP(w, r)
			return
		}

		probe := &fallbackProbe{header: http.Header{}}
		fallback.ServeHTTP(probe, r)

		switch probe.status {
		case http.StatusNotFound:
			writeError(w, http.StatusNotFound, "Route not found.",
				generalError(codeNotFound, "Route not found."))
		case http.StatusMethodNotAllowed:
			w.Header().Set("Allow", probe.header.Get("Allow"))
			writeError(w, http.StatusMethodNotAllowed, "Method not allowed.",
				generalError(codeMethodNotAllowed, "Method not allowed."))
		default:
			// A redirect that cleans up the path, for example.
			mux.ServeHTTP(w, r)
		}
	})
}

// fallbackProbe captures what the mux would send without sending it.
type fallbackProbe struct {
	header http.Header
	status int
}

func (p *fallbackProbe) Header() http.Header { return p.header }

func (p *fallbackProbe) WriteHeader(status int) { p.status = status }

func (p *fallbackProbe) Write(body []byte) (int, error) { return len(body), nil }
