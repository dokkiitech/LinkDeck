# linksdeck-server

Go backend for LinksDeck.

## Stack

- Go
- OpenAPI + oapi-codegen
- chi
- PostgreSQL (pgx + sqlc)
- golang-migrate
- Firebase Authentication ID token verification

## Endpoints

- Swagger UI: `/swagger`
- OpenAPI JSON: `/openapi.json`
- Liveness: `/v1/health/live`
- Readiness: `/v1/health/ready`

## Setup

```bash
cp .env.example .env
make gen
go mod tidy
go run ./cmd/server
```

## Code generation

```bash
make gen-openapi
make gen-sqlc
```

## Firestore migration tool

```bash
# full run
go run ./cmd/migrate-firestore --mode all \
  --project-id "$FIREBASE_PROJECT_ID" \
  --database-url "$DATABASE_URL"

# individual steps
go run ./cmd/migrate-firestore --mode export --project-id "$FIREBASE_PROJECT_ID"
go run ./cmd/migrate-firestore --mode transform
go run ./cmd/migrate-firestore --mode import --database-url "$DATABASE_URL"
go run ./cmd/migrate-firestore --mode verify --database-url "$DATABASE_URL"
```

## Coolify

Create two services:

1. `linksdeck-postgres` (managed PostgreSQL)
2. `linksdeck-server` (Dockerfile deploy)

Required env vars:

- `DATABASE_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `CORS_ALLOW_ORIGINS`
- `PORT`
- `LOG_LEVEL`

Health checks:

- Liveness: `/v1/health/live`
- Readiness: `/v1/health/ready`
