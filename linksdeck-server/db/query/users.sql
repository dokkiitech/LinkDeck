-- name: UpsertUser :one
INSERT INTO users (id, email, display_name, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  updated_at = EXCLUDED.updated_at
RETURNING id, email, display_name, created_at, updated_at;
