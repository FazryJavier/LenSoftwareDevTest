package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

const allowedOrigin = "http://localhost:5173"

type fakeHealthChecker struct {
	err      error
	deadline bool
}

func (f *fakeHealthChecker) Ping(ctx context.Context) error {
	_, f.deadline = ctx.Deadline()
	return f.err
}

func testDeps(checker HealthChecker) Dependencies {
	return Dependencies{
		Health:         checker,
		AllowedOrigins: []string{allowedOrigin},
		Logger:         slog.New(slog.DiscardHandler),
	}
}

func perform(t *testing.T, handler http.Handler, method, target string, headers map[string]string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequestWithContext(context.Background(), method, target, nil)
	for key, value := range headers {
		req.Header.Set(key, value)
	}
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	return rec
}

// decodeEnvelope also fails when a contract field is missing, because a missing
// "data" and an explicit null would otherwise decode to the same value.
func decodeEnvelope(t *testing.T, rec *httptest.ResponseRecorder) envelope {
	t.Helper()
	if got := rec.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", got)
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(rec.Body.Bytes(), &raw); err != nil {
		t.Fatalf("body is not JSON: %v; body = %s", err, rec.Body)
	}
	for _, field := range []string{"code", "success", "message", "data", "errors", "meta"} {
		if _, ok := raw[field]; !ok {
			t.Errorf("envelope has no %q field: %s", field, rec.Body)
		}
	}
	var body envelope
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode envelope: %v", err)
	}
	if body.Code != rec.Code {
		t.Errorf("envelope code = %d, HTTP status = %d", body.Code, rec.Code)
	}
	return body
}

func assertSingleError(t *testing.T, body envelope, wantCode string) {
	t.Helper()
	if body.Success {
		t.Error("success = true, want false")
	}
	if len(body.Errors) != 1 {
		t.Fatalf("errors = %+v, want exactly one", body.Errors)
	}
	if body.Errors[0].Code != wantCode {
		t.Errorf("error code = %q, want %q", body.Errors[0].Code, wantCode)
	}
	if body.Data != nil || body.Meta != nil {
		t.Errorf("data = %v, meta = %v, want null", body.Data, body.Meta)
	}
}

func TestHealth_DependencyReachable_Returns200(t *testing.T) {
	checker := &fakeHealthChecker{}
	rec := perform(t, NewRouter(testDeps(checker)), http.MethodGet, "/api/v1/health", nil)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	body := decodeEnvelope(t, rec)
	if !body.Success {
		t.Error("success = false, want true")
	}
	if body.Data != nil || body.Errors != nil || body.Meta != nil {
		t.Errorf("data = %v, errors = %v, meta = %v, want all null", body.Data, body.Errors, body.Meta)
	}
	if !checker.deadline {
		t.Error("Ping context has no deadline, want a timeout")
	}
}

func TestHealth_DependencyUnreachable_Returns503WithoutDetails(t *testing.T) {
	const secretDetail = "dial tcp db:5432 password=s3cret failed" //nolint:gosec // Test fixture, not a real credential.
	rec := perform(t, NewRouter(testDeps(&fakeHealthChecker{err: errors.New(secretDetail)})),
		http.MethodGet, "/api/v1/health", nil)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}
	assertSingleError(t, decodeEnvelope(t, rec), codeUnavailable)
	for _, leak := range []string{"dial tcp", "db:5432", "s3cret"} {
		if strings.Contains(rec.Body.String(), leak) {
			t.Errorf("body leaks %q: %s", leak, rec.Body)
		}
	}
}

func TestHealth_DependencyUnreachable_LogsDetailWithRequestID(t *testing.T) {
	var logs bytes.Buffer
	deps := testDeps(&fakeHealthChecker{err: errors.New("dial tcp failed")})
	deps.Logger = slog.New(slog.NewJSONHandler(&logs, nil))

	rec := perform(t, NewRouter(deps), http.MethodGet, "/api/v1/health", nil)

	if !strings.Contains(logs.String(), "dial tcp failed") {
		t.Errorf("logs do not contain the cause: %s", logs.String())
	}
	if id := rec.Header().Get(headerRequestID); !strings.Contains(logs.String(), id) {
		t.Errorf("logs do not contain request ID %q: %s", id, logs.String())
	}
}

func TestRouter_UnknownPath_Returns404Envelope(t *testing.T) {
	rec := perform(t, NewRouter(testDeps(&fakeHealthChecker{})), http.MethodGet, "/api/v1/nope", nil)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
	assertSingleError(t, decodeEnvelope(t, rec), codeNotFound)
}

func TestRouter_WrongMethod_Returns405EnvelopeWithAllow(t *testing.T) {
	rec := perform(t, NewRouter(testDeps(&fakeHealthChecker{})), http.MethodPost, "/api/v1/health", nil)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("status = %d, want 405", rec.Code)
	}
	assertSingleError(t, decodeEnvelope(t, rec), codeMethodNotAllowed)
	if allow := rec.Header().Get("Allow"); !strings.Contains(allow, http.MethodGet) {
		t.Errorf("Allow = %q, want it to contain GET", allow)
	}
}

func TestEnvelopeFallback_HandlerWrites404_IsNotRewritten(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/things/{id}", func(w http.ResponseWriter, _ *http.Request) {
		writeError(w, http.StatusNotFound, "Thing not found.", generalError(codeNotFound, "Thing not found."))
	})

	rec := perform(t, withEnvelopeFallback(mux), http.MethodGet, "/api/v1/things/1", nil)

	body := decodeEnvelope(t, rec)
	if body.Message != "Thing not found." {
		t.Errorf("message = %q, handler response was rewritten", body.Message)
	}
}

func TestEnvelopeFallback_UncleanPath_KeepsRedirect(t *testing.T) {
	rec := perform(t, NewRouter(testDeps(&fakeHealthChecker{})), http.MethodGet, "/api//v1/health", nil)

	if rec.Code != http.StatusTemporaryRedirect {
		t.Fatalf("status = %d, want 307", rec.Code)
	}
}

func TestRouter_AnyResponse_HasUniqueRequestID(t *testing.T) {
	router := NewRouter(testDeps(&fakeHealthChecker{}))
	first := perform(t, router, http.MethodGet, "/api/v1/health", nil).Header().Get(headerRequestID)
	second := perform(t, router, http.MethodGet, "/api/v1/nope", nil).Header().Get(headerRequestID)

	if first == "" || second == "" {
		t.Fatalf("request IDs = %q and %q, want non-empty", first, second)
	}
	if first == second {
		t.Errorf("request ID %q was reused", first)
	}
}

func TestRouter_InboundRequestID_IsIgnored(t *testing.T) {
	rec := perform(t, NewRouter(testDeps(&fakeHealthChecker{})), http.MethodGet, "/api/v1/health",
		map[string]string{headerRequestID: "client-controlled"})

	if got := rec.Header().Get(headerRequestID); got == "client-controlled" {
		t.Errorf("request ID = %q, want a generated value", got)
	}
}

func TestRouter_AnyResponse_HasSecurityHeaders(t *testing.T) {
	rec := perform(t, NewRouter(testDeps(&fakeHealthChecker{})), http.MethodGet, "/api/v1/health", nil)

	want := map[string]string{
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options":        "DENY",
		"Cache-Control":          "no-store",
	}
	for name, value := range want {
		if got := rec.Header().Get(name); got != value {
			t.Errorf("%s = %q, want %q", name, got, value)
		}
	}
}

func TestPanic_HandlerPanics_Returns500WithoutStack(t *testing.T) {
	var logs bytes.Buffer
	deps := testDeps(&fakeHealthChecker{})
	deps.Logger = slog.New(slog.NewJSONHandler(&logs, nil))
	handler := withMiddleware(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		panic("secret internal detail")
	}), deps)

	rec := perform(t, handler, http.MethodGet, "/", nil)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", rec.Code)
	}
	assertSingleError(t, decodeEnvelope(t, rec), codeInternalError)
	for _, leak := range []string{"secret internal detail", "goroutine", ".go:"} {
		if strings.Contains(rec.Body.String(), leak) {
			t.Errorf("body leaks %q: %s", leak, rec.Body)
		}
	}
	if !strings.Contains(logs.String(), "secret internal detail") {
		t.Errorf("logs do not contain the panic: %s", logs.String())
	}
	if !strings.Contains(logs.String(), `"status":500`) {
		t.Errorf("request log does not record status 500: %s", logs.String())
	}
}

func TestPanic_AfterResponseStarted_DoesNotWriteSecondBody(t *testing.T) {
	handler := withMiddleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		writeSuccess(w, http.StatusOK, "Started.", nil, nil)
		panic("too late")
	}), testDeps(&fakeHealthChecker{}))

	rec := perform(t, handler, http.MethodGet, "/", nil)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want the original 200", rec.Code)
	}
	if strings.Contains(rec.Body.String(), codeInternalError) {
		t.Errorf("a second body was written: %s", rec.Body)
	}
}

func TestPanic_AbortHandler_IsNotSwallowed(t *testing.T) {
	handler := withMiddleware(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		panic(http.ErrAbortHandler)
	}), testDeps(&fakeHealthChecker{}))

	defer func() {
		if recovered := recover(); !errors.Is(recovered.(error), http.ErrAbortHandler) {
			t.Errorf("recovered = %v, want http.ErrAbortHandler", recovered)
		}
	}()
	perform(t, handler, http.MethodGet, "/", nil)
	t.Error("the abort panic was swallowed")
}

func TestCORS_Origins(t *testing.T) {
	tests := []struct {
		name       string
		origin     string
		wantHeader string
	}{
		{"allowed origin", allowedOrigin, allowedOrigin},
		{"unknown origin", "http://evil.test", ""},
		{"no origin", "", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			headers := map[string]string{}
			if tt.origin != "" {
				headers["Origin"] = tt.origin
			}
			rec := perform(t, NewRouter(testDeps(&fakeHealthChecker{})), http.MethodGet, "/api/v1/health", headers)

			if got := rec.Header().Get("Access-Control-Allow-Origin"); got != tt.wantHeader {
				t.Errorf("Access-Control-Allow-Origin = %q, want %q", got, tt.wantHeader)
			}
			if got := rec.Header().Get("Vary"); got != "Origin" {
				t.Errorf("Vary = %q, want Origin", got)
			}
		})
	}
}

func TestCORS_PreflightFromAllowedOrigin_Returns204(t *testing.T) {
	rec := perform(t, NewRouter(testDeps(&fakeHealthChecker{})), http.MethodOptions, "/api/v1/health",
		map[string]string{"Origin": allowedOrigin, "Access-Control-Request-Method": http.MethodGet})

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Methods"); !strings.Contains(got, http.MethodPut) {
		t.Errorf("Access-Control-Allow-Methods = %q", got)
	}
}

func TestCORS_PreflightFromUnknownOrigin_HasNoAllowHeaders(t *testing.T) {
	rec := perform(t, NewRouter(testDeps(&fakeHealthChecker{})), http.MethodOptions, "/api/v1/health",
		map[string]string{"Origin": "http://evil.test", "Access-Control-Request-Method": http.MethodGet})

	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Errorf("Access-Control-Allow-Origin = %q, want empty", got)
	}
	if got := rec.Header().Get("Access-Control-Allow-Methods"); got != "" {
		t.Errorf("Access-Control-Allow-Methods = %q, want empty", got)
	}
}

func TestWriteEnvelope_UnencodableData_Returns500Envelope(t *testing.T) {
	rec := httptest.NewRecorder()

	writeSuccess(rec, http.StatusOK, "Bad.", make(chan int), nil)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", rec.Code)
	}
	assertSingleError(t, decodeEnvelope(t, rec), codeInternalError)
}
