package firestoremigrate

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

func ImportToPostgres(ctx context.Context, databaseURL, transformedPath string) error {
	var transformed TransformedData
	if err := readJSON(transformedPath, &transformed); err != nil {
		return fmt.Errorf("failed to read transformed file: %w", err)
	}

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return fmt.Errorf("failed to connect postgres: %w", err)
	}
	defer pool.Close()

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, "SET TIME ZONE 'UTC'"); err != nil {
		return fmt.Errorf("failed to set timezone: %w", err)
	}

	for _, user := range transformed.Users {
		_, err = tx.Exec(ctx, `
			INSERT INTO users (id, email, display_name, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (id) DO UPDATE
			SET email = EXCLUDED.email,
			    display_name = EXCLUDED.display_name,
			    updated_at = EXCLUDED.updated_at
		`, user.ID, user.Email, user.DisplayName, user.CreatedAt, user.UpdatedAt)
		if err != nil {
			return fmt.Errorf("failed to import user %s: %w", user.ID, err)
		}
	}

	for _, link := range transformed.Links {
		_, err = tx.Exec(ctx, `
			INSERT INTO links (id, user_id, url, title, is_archived, summary, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (id) DO UPDATE
			SET user_id = EXCLUDED.user_id,
			    url = EXCLUDED.url,
			    title = EXCLUDED.title,
			    is_archived = EXCLUDED.is_archived,
			    summary = EXCLUDED.summary,
			    created_at = EXCLUDED.created_at,
			    updated_at = EXCLUDED.updated_at
		`, link.ID, link.UserID, link.URL, link.Title, link.IsArchived, link.Summary, link.CreatedAt, link.UpdatedAt)
		if err != nil {
			return fmt.Errorf("failed to import link %s: %w", link.ID, err)
		}
	}

	for _, tag := range transformed.Tags {
		_, err = tx.Exec(ctx, `
			INSERT INTO tags (id, user_id, name, created_at)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (user_id, name) DO UPDATE
			SET created_at = LEAST(tags.created_at, EXCLUDED.created_at)
		`, tag.ID, tag.UserID, tag.Name, tag.CreatedAt)
		if err != nil {
			return fmt.Errorf("failed to import tag %s: %w", tag.ID, err)
		}
	}

	for _, linkTag := range transformed.LinkTags {
		_, err = tx.Exec(ctx, `
			INSERT INTO link_tags (link_id, tag_id, created_at)
			VALUES ($1, $2, $3)
			ON CONFLICT (link_id, tag_id) DO NOTHING
		`, linkTag.LinkID, linkTag.TagID, linkTag.CreatedAt)
		if err != nil {
			return fmt.Errorf("failed to import link_tag (%s,%s): %w", linkTag.LinkID, linkTag.TagID, err)
		}
	}

	for _, entry := range transformed.TimelineEntries {
		_, err = tx.Exec(ctx, `
			INSERT INTO timeline_entries (id, link_id, type, content, created_at)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (id) DO UPDATE
			SET link_id = EXCLUDED.link_id,
			    type = EXCLUDED.type,
			    content = EXCLUDED.content,
			    created_at = EXCLUDED.created_at
		`, entry.ID, entry.LinkID, entry.Type, entry.Content, entry.CreatedAt)
		if err != nil {
			return fmt.Errorf("failed to import timeline entry %s: %w", entry.ID, err)
		}
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO maintenance_status (id, is_maintenance_mode, reason, started_at, started_by, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (id) DO UPDATE
		SET is_maintenance_mode = EXCLUDED.is_maintenance_mode,
		    reason = EXCLUDED.reason,
		    started_at = EXCLUDED.started_at,
		    started_by = EXCLUDED.started_by,
		    updated_at = NOW()
	`, transformed.MaintenanceStatus.ID, transformed.MaintenanceStatus.IsMaintenanceMode, transformed.MaintenanceStatus.Reason, transformed.MaintenanceStatus.StartedAt, transformed.MaintenanceStatus.StartedBy)
	if err != nil {
		return fmt.Errorf("failed to import maintenance status: %w", err)
	}

	for _, developer := range transformed.Developers {
		_, err = tx.Exec(ctx, `
			INSERT INTO developers (uid, email, added_at, deleted_at)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (uid) DO UPDATE
			SET email = EXCLUDED.email,
			    added_at = LEAST(developers.added_at, EXCLUDED.added_at),
			    deleted_at = EXCLUDED.deleted_at
		`, developer.UID, developer.Email, developer.AddedAt, developer.DeletedAt)
		if err != nil {
			return fmt.Errorf("failed to import developer %s: %w", developer.UID, err)
		}
	}

	for _, logEntry := range transformed.MaintenanceLogs {
		_, err = tx.Exec(ctx, `
			INSERT INTO maintenance_logs (id, action, reason, performed_by, performed_by_uid, timestamp, previous_status)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (id) DO UPDATE
			SET action = EXCLUDED.action,
			    reason = EXCLUDED.reason,
			    performed_by = EXCLUDED.performed_by,
			    performed_by_uid = EXCLUDED.performed_by_uid,
			    timestamp = EXCLUDED.timestamp,
			    previous_status = EXCLUDED.previous_status
		`, logEntry.ID, logEntry.Action, logEntry.Reason, logEntry.PerformedBy, logEntry.PerformedByUID, logEntry.Timestamp, logEntry.PreviousStatus)
		if err != nil {
			return fmt.Errorf("failed to import maintenance log %s: %w", logEntry.ID, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit import transaction: %w", err)
	}
	return nil
}
