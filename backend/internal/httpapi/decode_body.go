package httpapi

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"mime"
	"net/http"
	"strings"
)

const (
	codeMalformedJSON    = "malformed_json"
	codeUnknownField     = "unknown_field"
	codeUnsupportedMedia = "unsupported_media_type"
	codePayloadTooLarge  = "payload_too_large"

	maxBodyBytes  = 64 << 10
	maxDrainBytes = 1 << 20
)

// decodeFailure is why a request body could not be read. These bodies never reach the
// domain rules.
type decodeFailure struct {
	status  int
	message string
	item    errorItem
}

// decodeJSONBody reads exactly one JSON object from a request of limited size.
func decodeJSONBody(r *http.Request, target any) *decodeFailure {
	mediaType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || mediaType != "application/json" {
		return &decodeFailure{
			status:  http.StatusUnsupportedMediaType,
			message: "Unsupported media type.",
			item:    generalError(codeUnsupportedMedia, "Content-Type must be application/json."),
		}
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, maxBodyBytes+1))
	if err != nil {
		return classifyDecodeError(err)
	}
	if len(body) > maxBodyBytes {
		// Answering with the rest unread made the Vite proxy report ECONNRESET and a 502 in
		// place of this 413. The read is bounded, and a failure only means the client is gone.
		_, _ = io.CopyN(io.Discard, r.Body, maxDrainBytes)
		return &decodeFailure{
			status:  http.StatusRequestEntityTooLarge,
			message: "Request body is too large.",
			item:    generalError(codePayloadTooLarge, "Request body must be at most 64 KiB."),
		}
	}

	decoder := json.NewDecoder(bytes.NewReader(body))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return classifyDecodeError(err)
	}
	// A second value after the object means the body was not one JSON object.
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return classifyDecodeError(err)
	}
	return nil
}

func classifyDecodeError(err error) *decodeFailure {
	// A nil error here means a second, valid value followed the object. encoding/json has no
	// error type for an unknown field, so its message is the only signal for that case.
	if err != nil {
		if field, ok := strings.CutPrefix(err.Error(), "json: unknown field "); ok {
			name := strings.Trim(field, `"`)
			return &decodeFailure{
				status:  http.StatusBadRequest,
				message: "Request body has an unknown field.",
				item:    errorItem{Field: &name, Code: codeUnknownField, Message: "This field is not part of the contract."},
			}
		}
	}
	return &decodeFailure{
		status:  http.StatusBadRequest,
		message: "Request body is not valid JSON.",
		item:    generalError(codeMalformedJSON, "Request body must be a single JSON object."),
	}
}
