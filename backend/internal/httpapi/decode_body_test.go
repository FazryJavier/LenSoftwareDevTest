package httpapi

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type countingReader struct {
	reader io.Reader
	read   int
}

func (c *countingReader) Read(p []byte) (int, error) {
	n, err := c.reader.Read(p)
	c.read += n
	return n, err
}

func TestDecodeJSONBody_TooLarge_ReadsTheRestBeforeAnswering(t *testing.T) {
	const size = 300_000
	body := &countingReader{reader: strings.NewReader(`{"name":"` + strings.Repeat("a", size) + `"}`)}
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/", body)
	req.Header.Set("Content-Type", "application/json")

	failure := decodeJSONBody(req, &entityRequest{})

	if failure == nil || failure.status != http.StatusRequestEntityTooLarge {
		t.Fatalf("failure = %+v, want 413", failure)
	}
	if body.read < size {
		t.Errorf("read %d bytes, want the whole body so a proxy can receive the answer", body.read)
	}
}

func TestDecodeJSONBody_EndlessBody_StopsReading(t *testing.T) {
	body := &countingReader{reader: strings.NewReader(strings.Repeat("a", 3*maxDrainBytes))}
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/", body)
	req.Header.Set("Content-Type", "application/json")

	failure := decodeJSONBody(req, &entityRequest{})

	if failure == nil || failure.status != http.StatusRequestEntityTooLarge {
		t.Fatalf("failure = %+v, want 413", failure)
	}
	if body.read > 2*maxDrainBytes {
		t.Errorf("read %d bytes, want reading to stop near the limit", body.read)
	}
}
