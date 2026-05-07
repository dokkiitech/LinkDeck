-- name: GetMaintenanceStatus :one
SELECT id, is_maintenance_mode, reason, started_at, started_by, updated_at
FROM maintenance_status
WHERE id = 'current'
LIMIT 1;

-- name: UpsertMaintenanceStatus :one
INSERT INTO maintenance_status (id, is_maintenance_mode, reason, started_at, started_by, updated_at)
VALUES ('current', $1, $2, $3, $4, NOW())
ON CONFLICT (id)
DO UPDATE SET
  is_maintenance_mode = EXCLUDED.is_maintenance_mode,
  reason = EXCLUDED.reason,
  started_at = EXCLUDED.started_at,
  started_by = EXCLUDED.started_by,
  updated_at = NOW()
RETURNING id, is_maintenance_mode, reason, started_at, started_by, updated_at;

-- name: CreateMaintenanceLog :one
INSERT INTO maintenance_logs (id, action, reason, performed_by, performed_by_uid, timestamp, previous_status)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, action, reason, performed_by, performed_by_uid, timestamp, previous_status;

-- name: ListMaintenanceLogs :many
SELECT id, action, reason, performed_by, performed_by_uid, timestamp, previous_status
FROM maintenance_logs
ORDER BY timestamp DESC
LIMIT $1;
