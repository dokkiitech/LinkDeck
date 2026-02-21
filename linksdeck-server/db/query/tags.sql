-- name: ListTagsByUser :many
SELECT id, user_id, name, created_at
FROM tags
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: CreateTag :one
INSERT INTO tags (id, user_id, name, created_at)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, name)
DO UPDATE SET name = EXCLUDED.name
RETURNING id, user_id, name, created_at;

-- name: GetTagByUserAndName :one
SELECT id, user_id, name, created_at
FROM tags
WHERE user_id = $1
  AND name = $2
LIMIT 1;

-- name: DeleteTagByID :execrows
DELETE FROM tags
WHERE id = $1
  AND user_id = $2;

-- name: AddLinkTag :exec
INSERT INTO link_tags (link_id, tag_id, created_at)
VALUES ($1, $2, $3)
ON CONFLICT (link_id, tag_id) DO NOTHING;

-- name: RemoveLinkTagByName :execrows
DELETE FROM link_tags lt
USING tags t, links l
WHERE lt.link_id = l.id
  AND lt.tag_id = t.id
  AND l.id = $1
  AND l.user_id = $2
  AND t.user_id = $2
  AND t.name = $3;

-- name: ListTagNamesByLinkID :many
SELECT t.name
FROM link_tags lt
INNER JOIN tags t ON t.id = lt.tag_id
WHERE lt.link_id = $1
ORDER BY t.created_at DESC;
