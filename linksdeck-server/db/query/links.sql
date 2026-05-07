-- name: ListLinks :many
SELECT l.id, l.user_id, l.url, l.title, l.is_archived, l.summary, l.created_at, l.updated_at
FROM links l
WHERE l.user_id = sqlc.arg(user_id)
  AND (sqlc.arg(include_archived)::boolean OR l.is_archived = FALSE)
  AND (sqlc.narg(tag_name)::text IS NULL OR EXISTS (
    SELECT 1
    FROM link_tags lt
    INNER JOIN tags t ON t.id = lt.tag_id
    WHERE lt.link_id = l.id
      AND t.user_id = sqlc.arg(user_id)
      AND t.name = sqlc.narg(tag_name)::text
  ))
ORDER BY l.created_at DESC;

-- name: CreateLink :one
INSERT INTO links (id, user_id, url, title, is_archived, summary, created_at, updated_at)
VALUES ($1, $2, $3, $4, FALSE, NULL, $5, $5)
RETURNING id, user_id, url, title, is_archived, summary, created_at, updated_at;

-- name: GetLinkByID :one
SELECT id, user_id, url, title, is_archived, summary, created_at, updated_at
FROM links
WHERE id = $1
  AND user_id = $2
LIMIT 1;

-- name: UpdateLink :one
UPDATE links
SET
  url = COALESCE(sqlc.narg(url), url),
  title = COALESCE(sqlc.narg(title), title),
  is_archived = COALESCE(sqlc.narg(is_archived), is_archived),
  summary = COALESCE(sqlc.narg(summary), summary),
  updated_at = NOW()
WHERE id = sqlc.arg(id)
  AND user_id = sqlc.arg(user_id)
RETURNING id, user_id, url, title, is_archived, summary, created_at, updated_at;

-- name: DeleteLink :execrows
DELETE FROM links
WHERE id = $1
  AND user_id = $2;

-- name: LinkExists :one
SELECT EXISTS (
  SELECT 1
  FROM links
  WHERE user_id = $1
    AND url = $2
) AS exists;

-- name: IsLinkOwner :one
SELECT EXISTS (
  SELECT 1
  FROM links
  WHERE id = $1
    AND user_id = $2
) AS exists;
