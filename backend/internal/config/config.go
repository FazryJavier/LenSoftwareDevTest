// Package config loads application settings from the environment.
package config

import (
	"errors"
	"fmt"
	"net"
	"net/url"
	"os"
	"strings"
)

const defaultHTTPAddr = ":8080"

// Config holds validated application settings.
type Config struct {
	DatabaseURL        string
	HTTPAddr           string
	CORSAllowedOrigins []string
}

// Load reads settings from the process environment.
func Load() (Config, error) {
	return load(os.Getenv)
}

// load reports every invalid variable at once so an operator can fix them in one pass.
// Error messages never include values because DATABASE_URL contains a password.
func load(getenv func(string) string) (Config, error) {
	var problems []error

	databaseURL := getenv("DATABASE_URL")
	if err := validateDatabaseURL(databaseURL); err != nil {
		problems = append(problems, err)
	}

	httpAddr := getenv("HTTP_ADDR")
	if httpAddr == "" {
		httpAddr = defaultHTTPAddr
	}
	if _, _, err := net.SplitHostPort(httpAddr); err != nil {
		problems = append(problems, errors.New("HTTP_ADDR must be in host:port form"))
	}

	origins, err := parseOrigins(getenv("CORS_ALLOWED_ORIGINS"))
	if err != nil {
		problems = append(problems, err)
	}

	if len(problems) > 0 {
		return Config{}, fmt.Errorf("invalid configuration: %w", errors.Join(problems...))
	}

	return Config{
		DatabaseURL:        databaseURL,
		HTTPAddr:           httpAddr,
		CORSAllowedOrigins: origins,
	}, nil
}

func validateDatabaseURL(raw string) error {
	if raw == "" {
		return errors.New("DATABASE_URL is required")
	}
	parsed, err := url.Parse(raw)
	if err != nil || (parsed.Scheme != "postgres" && parsed.Scheme != "postgresql") || parsed.Host == "" {
		return errors.New("DATABASE_URL must be a postgres:// URL")
	}
	return nil
}

func parseOrigins(raw string) ([]string, error) {
	if strings.TrimSpace(raw) == "" {
		return nil, nil
	}

	var origins []string
	for _, part := range strings.Split(raw, ",") {
		origin := strings.TrimSpace(part)
		if origin == "*" {
			return nil, errors.New("CORS_ALLOWED_ORIGINS must not contain a wildcard")
		}
		parsed, err := url.Parse(origin)
		if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" || parsed.Path != "" {
			return nil, errors.New("CORS_ALLOWED_ORIGINS must contain origins such as http://localhost:5173")
		}
		origins = append(origins, origin)
	}
	return origins, nil
}
