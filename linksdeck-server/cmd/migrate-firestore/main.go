package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"

	"linksdeck-server/internal/firestoremigrate"
)

func main() {
	mode := flag.String("mode", "all", "execution mode: export|transform|import|verify|all")
	projectID := flag.String("project-id", os.Getenv("FIREBASE_PROJECT_ID"), "Firebase project ID")
	serviceAccountJSON := flag.String("service-account-json", os.Getenv("FIREBASE_SERVICE_ACCOUNT_JSON"), "Firebase service account JSON")
	databaseURL := flag.String("database-url", os.Getenv("DATABASE_URL"), "PostgreSQL DATABASE_URL")
	exportFile := flag.String("export-file", "./tmp/firestore-export.json", "path to Firestore export json")
	transformedFile := flag.String("transformed-file", "./tmp/transformed.json", "path to transformed json")
	verifyReport := flag.String("verify-report", "./tmp/verify-report.json", "path to verification report json")
	flag.Parse()

	ctx := context.Background()

	run := func(step string, fn func() error) {
		log.Printf("[%s] start", step)
		if err := fn(); err != nil {
			log.Fatalf("[%s] failed: %v", step, err)
		}
		log.Printf("[%s] done", step)
	}

	switch *mode {
	case "export":
		requireNonEmpty("project-id", *projectID)
		run("export", func() error {
			return firestoremigrate.ExportFromFirestore(ctx, *projectID, *serviceAccountJSON, *exportFile)
		})
	case "transform":
		run("transform", func() error {
			return firestoremigrate.TransformExport(*exportFile, *transformedFile)
		})
	case "import":
		requireNonEmpty("database-url", *databaseURL)
		run("import", func() error {
			return firestoremigrate.ImportToPostgres(ctx, *databaseURL, *transformedFile)
		})
	case "verify":
		requireNonEmpty("database-url", *databaseURL)
		run("verify", func() error {
			summary, err := firestoremigrate.VerifyImport(ctx, *databaseURL, *transformedFile, *verifyReport)
			if err != nil {
				return err
			}
			log.Printf("verify matched: %v", summary.Matched)
			log.Printf("expected: %+v", summary.Expected)
			log.Printf("actual: %+v", summary.Actual)
			return nil
		})
	case "all":
		requireNonEmpty("project-id", *projectID)
		requireNonEmpty("database-url", *databaseURL)
		run("export", func() error {
			return firestoremigrate.ExportFromFirestore(ctx, *projectID, *serviceAccountJSON, *exportFile)
		})
		run("transform", func() error {
			return firestoremigrate.TransformExport(*exportFile, *transformedFile)
		})
		run("import", func() error {
			return firestoremigrate.ImportToPostgres(ctx, *databaseURL, *transformedFile)
		})
		run("verify", func() error {
			summary, err := firestoremigrate.VerifyImport(ctx, *databaseURL, *transformedFile, *verifyReport)
			if err != nil {
				return err
			}
			if !summary.Matched {
				return fmt.Errorf("verification failed: expected=%+v actual=%+v", summary.Expected, summary.Actual)
			}
			log.Printf("verification report written to %s", *verifyReport)
			return nil
		})
	default:
		log.Fatalf("invalid mode: %s", *mode)
	}
}

func requireNonEmpty(name, value string) {
	if value == "" {
		log.Fatalf("%s is required", name)
	}
}
