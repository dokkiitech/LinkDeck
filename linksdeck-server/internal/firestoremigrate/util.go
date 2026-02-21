package firestoremigrate

import (
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func writeJSON(path string, value any) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	bytes, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, bytes, 0o644)
}

func readJSON(path string, value any) error {
	bytes, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(bytes, value)
}

func parseString(v any) string {
	s, _ := v.(string)
	return s
}

func parseStringPtr(v any) *string {
	s, ok := v.(string)
	if !ok {
		return nil
	}
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	copy := s
	return &copy
}

func parseBool(v any, fallback bool) bool {
	b, ok := v.(bool)
	if ok {
		return b
	}
	return fallback
}

func parseTime(v any, fallback time.Time) time.Time {
	switch t := v.(type) {
	case time.Time:
		return t.UTC()
	case string:
		if t == "" {
			return fallback.UTC()
		}
		parsed, err := time.Parse(time.RFC3339Nano, t)
		if err == nil {
			return parsed.UTC()
		}
		parsed, err = time.Parse(time.RFC3339, t)
		if err == nil {
			return parsed.UTC()
		}
	}
	return fallback.UTC()
}

func parseTimePtr(v any) *time.Time {
	if v == nil {
		return nil
	}
	t := parseTime(v, time.Time{})
	if t.IsZero() {
		return nil
	}
	copy := t.UTC()
	return &copy
}

func toMap(v any) map[string]any {
	mapped, ok := v.(map[string]any)
	if !ok {
		return map[string]any{}
	}
	return mapped
}

func toSlice(v any) []any {
	slice, ok := v.([]any)
	if !ok {
		return nil
	}
	return slice
}

func deterministicTagID(userID, tagName string) string {
	h := sha1.Sum([]byte(fmt.Sprintf("%s:%s", userID, strings.ToLower(tagName))))
	return "tag_" + hex.EncodeToString(h[:])[:20]
}

func sanitizeTagName(name string) string {
	return strings.TrimSpace(name)
}
