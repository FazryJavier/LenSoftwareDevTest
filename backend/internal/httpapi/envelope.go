package httpapi

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

// Error codes shared by more than one handler. See docs/API.md.
const (
	codeNotFound         = "not_found"
	codeMethodNotAllowed = "method_not_allowed"
	codeInternalError    = "internal_error"
	codeUnavailable      = "unavailable"
)

type envelope struct {
	Code    int         `json:"code"`
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    any         `json:"data"`
	Errors  []errorItem `json:"errors"`
	Meta    any         `json:"meta"`
}

type errorItem struct {
	Field   *string `json:"field"`
	Code    string  `json:"code"`
	Message string  `json:"message"`
}

// writeSuccess writes a success envelope. Pass nil for data or meta when there is none.
func writeSuccess(w http.ResponseWriter, status int, message string, data, meta any) {
	writeEnvelope(w, envelope{Code: status, Success: true, Message: message, Data: data, Meta: meta})
}

// writeError writes a failure envelope.
func writeError(w http.ResponseWriter, status int, message string, items ...errorItem) {
	writeEnvelope(w, envelope{Code: status, Message: message, Errors: items})
}

// generalError builds an error that does not relate to a specific field.
func generalError(code, message string) errorItem {
	return errorItem{Code: code, Message: message}
}

func writeEnvelope(w http.ResponseWriter, body envelope) {
	// Marshal before touching the response so a failure can still produce a clean 500.
	payload, err := json.Marshal(body)
	if err != nil {
		slog.Error("encode response", "error", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		// The literal below is valid JSON and cannot fail to encode.
		_, _ = w.Write([]byte(`{"code":500,"success":false,"message":"Internal server error.","data":null,` +
			`"errors":[{"field":null,"code":"internal_error","message":"Internal server error."}],"meta":null}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(body.Code)
	if _, err := w.Write(payload); err != nil {
		// The client went away, so there is nothing left to send.
		slog.Debug("write response", "error", err)
	}
}
