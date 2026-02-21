-- name: ListTimelineByLinkID :many
SELECT id, link_id, type, content, created_at
FROM timeline_entries
WHERE link_id = $1
ORDER BY created_at ASC;

-- name: AddTimelineEntry :one
INSERT INTO timeline_entries (id, link_id, type, content, created_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, link_id, type, content, created_at;

-- name: DeleteTimelineEntryByID :execrows
DELETE FROM timeline_entries te
USING links l
WHERE te.id = $1
  AND te.link_id = l.id
  AND l.id = $2
  AND l.user_id = $3;
