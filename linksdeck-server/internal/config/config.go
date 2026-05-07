package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                      string
	DatabaseURL               string
	FirebaseProjectID         string
	FirebaseServiceAccountJSON string
	CORSAllowOrigins          []string
	LogLevel                  string
}

func Load() (Config, error) {
	_ = godotenv.Load()

	cfg := Config{
		Port:                      getenv("PORT", "8080"),
		DatabaseURL:               os.Getenv("DATABASE_URL"),
		FirebaseProjectID:         os.Getenv("FIREBASE_PROJECT_ID"),
		FirebaseServiceAccountJSON: normalizeJSONSecret(os.Getenv("FIREBASE_SERVICE_ACCOUNT_JSON")),
		CORSAllowOrigins:          splitCSV(getenv("CORS_ALLOW_ORIGINS", "*")),
		LogLevel:                  getenv("LOG_LEVEL", "info"),
	}

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}

	if cfg.FirebaseProjectID == "" {
		return Config{}, fmt.Errorf("FIREBASE_PROJECT_ID is required")
	}

	return cfg, nil
}

func getenv(key, fallback string) string {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	return v
}

func splitCSV(v string) []string {
	parts := strings.Split(v, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	if len(out) == 0 {
		return []string{"*"}
	}
	return out
}

func normalizeJSONSecret(v string) string {
	if v == "" {
		return ""
	}
	return strings.ReplaceAll(v, "\\n", "\n")
}
