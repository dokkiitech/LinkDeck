package firestoremigrate

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

func VerifyImport(ctx context.Context, databaseURL, transformedPath, reportPath string) (*VerificationSummary, error) {
	var transformed TransformedData
	if err := readJSON(transformedPath, &transformed); err != nil {
		return nil, fmt.Errorf("failed to read transformed file: %w", err)
	}

	expected := map[string]int{
		"users":             len(transformed.Users),
		"links":             len(transformed.Links),
		"tags":              len(transformed.Tags),
		"link_tags":         len(transformed.LinkTags),
		"timeline_entries":  len(transformed.TimelineEntries),
		"developers":        len(transformed.Developers),
		"maintenance_logs":  len(transformed.MaintenanceLogs),
		"maintenance_status": 1,
	}

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect postgres: %w", err)
	}
	defer pool.Close()

	actual := map[string]int{}
	countQueries := map[string]string{
		"users":              "SELECT COUNT(*) FROM users",
		"links":              "SELECT COUNT(*) FROM links",
		"tags":               "SELECT COUNT(*) FROM tags",
		"link_tags":          "SELECT COUNT(*) FROM link_tags",
		"timeline_entries":   "SELECT COUNT(*) FROM timeline_entries",
		"developers":         "SELECT COUNT(*) FROM developers",
		"maintenance_logs":   "SELECT COUNT(*) FROM maintenance_logs",
		"maintenance_status": "SELECT COUNT(*) FROM maintenance_status WHERE id = 'current'",
	}

	for key, query := range countQueries {
		var count int
		if err := pool.QueryRow(ctx, query).Scan(&count); err != nil {
			return nil, fmt.Errorf("failed to count %s: %w", key, err)
		}
		actual[key] = count
	}

	var orphanLinkTags int
	if err := pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM link_tags lt
		LEFT JOIN links l ON l.id = lt.link_id
		LEFT JOIN tags t ON t.id = lt.tag_id
		WHERE l.id IS NULL OR t.id IS NULL
	`).Scan(&orphanLinkTags); err != nil {
		return nil, fmt.Errorf("failed to validate link_tags relations: %w", err)
	}
	actual["orphan_link_tags"] = orphanLinkTags

	summary := &VerificationSummary{
		Expected: expected,
		Actual:   actual,
		Matched:  true,
	}

	for key, expectedCount := range expected {
		if actual[key] != expectedCount {
			summary.Matched = false
		}
	}
	if orphanLinkTags > 0 {
		summary.Matched = false
	}

	if reportPath != "" {
		if err := writeJSON(reportPath, summary); err != nil {
			return nil, fmt.Errorf("failed to write verification report: %w", err)
		}
	}

	return summary, nil
}
