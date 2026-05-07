package db

import (
	"errors"
	"fmt"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func RunMigrations(databaseURL, migrationsDir string) error {
	absPath, err := filepath.Abs(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to resolve migrations dir: %w", err)
	}

	m, err := migrate.New("file://"+absPath, databaseURL)
	if err != nil {
		return fmt.Errorf("failed to init migrate: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	return nil
}
