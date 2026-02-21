-- name: IsDeveloper :one
SELECT EXISTS (
  SELECT 1
  FROM developers
  WHERE uid = $1
    AND deleted_at IS NULL
) AS is_developer;

-- name: ListDevelopers :many
SELECT uid, email, added_at, deleted_at
FROM developers
WHERE deleted_at IS NULL
ORDER BY added_at DESC;

-- name: UpsertDeveloper :one
INSERT INTO developers (uid, email, added_at, deleted_at)
VALUES ($1, $2, $3, NULL)
ON CONFLICT (uid)
DO UPDATE SET
  email = EXCLUDED.email,
  deleted_at = NULL
RETURNING uid, email, added_at, deleted_at;

-- name: SoftDeleteDeveloper :execrows
UPDATE developers
SET deleted_at = $2
WHERE uid = $1
  AND deleted_at IS NULL;
