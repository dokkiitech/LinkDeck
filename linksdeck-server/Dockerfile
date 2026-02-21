FROM golang:1.25-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags='-s -w' -o /out/server ./cmd/server && \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags='-s -w' -o /out/migrate-firestore ./cmd/migrate-firestore

FROM gcr.io/distroless/static-debian12
WORKDIR /app

COPY --from=builder /out/server /app/server
COPY --from=builder /out/migrate-firestore /app/migrate-firestore
COPY --from=builder /app/api /app/api
COPY --from=builder /app/db/migrations /app/db/migrations

EXPOSE 8080
ENTRYPOINT ["/app/server"]
