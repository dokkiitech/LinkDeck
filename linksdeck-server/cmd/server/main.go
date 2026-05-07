package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"

	"linksdeck-server/internal/auth"
	"linksdeck-server/internal/config"
	"linksdeck-server/internal/db"
	"linksdeck-server/internal/gen"
	"linksdeck-server/internal/handler"
	"linksdeck-server/internal/middleware"
	"linksdeck-server/internal/repository"
	"linksdeck-server/internal/swagger"
)

func main() {
	ctx := context.Background()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	if err := db.RunMigrations(cfg.DatabaseURL, "db/migrations"); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect db: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("failed to ping db: %v", err)
	}

	verifier, err := auth.NewVerifier(ctx, cfg.FirebaseProjectID, cfg.FirebaseServiceAccountJSON)
	if err != nil {
		log.Fatalf("failed to initialize firebase verifier: %v", err)
	}

	store := repository.NewStore(pool)
	apiHandler := handler.NewAPIHandler(store)
	authz := middleware.NewAuthz(verifier, store)
	docs := swagger.New("api/openapi.yaml")

	router := chi.NewRouter()
	router.Use(chimiddleware.RequestID)
	router.Use(chimiddleware.RealIP)
	router.Use(chimiddleware.Logger)
	router.Use(chimiddleware.Recoverer)
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.CORSAllowOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	router.Use(authz.Middleware)

	router.Get("/openapi.json", docs.OpenAPIJSONHandler())
	router.Get("/swagger", docs.SwaggerUIHandler())
	router.Get("/swagger/", docs.SwaggerUIHandler())

	api := gen.HandlerFromMux(apiHandler, router)

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           api,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("linksdeck-server listening on :%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}
}
