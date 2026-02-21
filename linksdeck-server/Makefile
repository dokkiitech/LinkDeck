.PHONY: gen-openapi gen-sqlc gen all tidy run

gen-openapi:
	go run github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@v2.4.0 -config api/openapi.codegen.yaml api/openapi.yaml

gen-sqlc:
	go run github.com/sqlc-dev/sqlc/cmd/sqlc@v1.30.0 generate

gen: gen-openapi gen-sqlc

all: gen tidy

tidy:
	go mod tidy

run:
	go run ./cmd/server
