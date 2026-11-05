package config

import (
	"slices"
	"strings"
	"testing"
)

const validDatabaseURL = "postgres://geo:s3cret-value@db:5432/geoentity?sslmode=disable" //nolint:gosec // Test fixture, not a real credential.

func fakeEnv(values map[string]string) func(string) string {
	return func(key string) string { return values[key] }
}

func TestLoad_ValidValues_ReturnsConfig(t *testing.T) {
	cfg, err := load(fakeEnv(map[string]string{
		"DATABASE_URL":         validDatabaseURL,
		"HTTP_ADDR":            "127.0.0.1:9000",
		"CORS_ALLOWED_ORIGINS": "http://localhost:5173, https://app.example.com",
	}))
	if err != nil {
		t.Fatalf("load() error = %v", err)
	}
	if cfg.DatabaseURL != validDatabaseURL {
		t.Errorf("DatabaseURL = %q", cfg.DatabaseURL)
	}
	if cfg.HTTPAddr != "127.0.0.1:9000" {
		t.Errorf("HTTPAddr = %q", cfg.HTTPAddr)
	}
	want := []string{"http://localhost:5173", "https://app.example.com"}
	if !slices.Equal(cfg.CORSAllowedOrigins, want) {
		t.Errorf("CORSAllowedOrigins = %v, want %v", cfg.CORSAllowedOrigins, want)
	}
}

func TestLoad_OptionalValuesEmpty_UsesDefaults(t *testing.T) {
	cfg, err := load(fakeEnv(map[string]string{"DATABASE_URL": validDatabaseURL}))
	if err != nil {
		t.Fatalf("load() error = %v", err)
	}
	if cfg.HTTPAddr != ":8080" {
		t.Errorf("HTTPAddr = %q, want :8080", cfg.HTTPAddr)
	}
	if len(cfg.CORSAllowedOrigins) != 0 {
		t.Errorf("CORSAllowedOrigins = %v, want empty", cfg.CORSAllowedOrigins)
	}
}

func TestLoad_InvalidValues_NamesVariable(t *testing.T) {
	tests := []struct {
		name    string
		env     map[string]string
		wantVar string
	}{
		{"database url empty", map[string]string{}, "DATABASE_URL"},
		{"database url wrong scheme", map[string]string{"DATABASE_URL": "mysql://db/app"}, "DATABASE_URL"},
		{"http addr without port", map[string]string{"DATABASE_URL": validDatabaseURL, "HTTP_ADDR": "localhost"}, "HTTP_ADDR"},
		{"cors wildcard", map[string]string{"DATABASE_URL": validDatabaseURL, "CORS_ALLOWED_ORIGINS": "*"}, "CORS_ALLOWED_ORIGINS"},
		{"cors wildcard in list", map[string]string{"DATABASE_URL": validDatabaseURL, "CORS_ALLOWED_ORIGINS": "http://a.test, *"}, "CORS_ALLOWED_ORIGINS"},
		{"cors with path", map[string]string{"DATABASE_URL": validDatabaseURL, "CORS_ALLOWED_ORIGINS": "http://a.test/path"}, "CORS_ALLOWED_ORIGINS"},
		{"cors without scheme", map[string]string{"DATABASE_URL": validDatabaseURL, "CORS_ALLOWED_ORIGINS": "a.test"}, "CORS_ALLOWED_ORIGINS"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := load(fakeEnv(tt.env))
			if err == nil {
				t.Fatal("load() error = nil, want error")
			}
			if !strings.Contains(err.Error(), tt.wantVar) {
				t.Errorf("error %q does not name %s", err, tt.wantVar)
			}
		})
	}
}

func TestLoad_ManyInvalidValues_ReportsAll(t *testing.T) {
	_, err := load(fakeEnv(map[string]string{
		"HTTP_ADDR":            "localhost",
		"CORS_ALLOWED_ORIGINS": "*",
	}))
	if err == nil {
		t.Fatal("load() error = nil, want error")
	}
	for _, name := range []string{"DATABASE_URL", "HTTP_ADDR", "CORS_ALLOWED_ORIGINS"} {
		if !strings.Contains(err.Error(), name) {
			t.Errorf("error %q does not name %s", err, name)
		}
	}
}

func TestLoad_InvalidDatabaseURL_DoesNotPrintSecret(t *testing.T) {
	tests := []string{
		"mysql://geo:s3cret-value@db/app",
		"postgres://geo:s3cret-value@%zz/app",
	}
	for _, raw := range tests {
		_, err := load(fakeEnv(map[string]string{"DATABASE_URL": raw}))
		if err == nil {
			t.Fatalf("load(%q) error = nil, want error", raw)
		}
		if strings.Contains(err.Error(), "s3cret-value") {
			t.Errorf("error leaks the password: %q", err)
		}
	}
}
