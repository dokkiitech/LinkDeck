package firestoremigrate

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
)

func ExportFromFirestore(ctx context.Context, projectID, serviceAccountJSON, outPath string) error {
	client, err := newFirestoreClient(ctx, projectID, serviceAccountJSON)
	if err != nil {
		return err
	}
	defer client.Close()

	collections := []string{"users", "links", "tags", "developers", "maintenanceLogs"}
	data := make(map[string][]FirestoreDocument, len(collections))

	for _, collection := range collections {
		docs, err := fetchCollection(ctx, client, collection)
		if err != nil {
			return fmt.Errorf("failed to export collection %s: %w", collection, err)
		}
		data[collection] = docs
	}

	maintenanceDoc, err := fetchDocument(ctx, client, "maintenance", "current")
	if err != nil {
		return fmt.Errorf("failed to export maintenance/current: %w", err)
	}

	exportPayload := FirestoreExport{
		ExportedAt:         time.Now().UTC(),
		Collections:        data,
		MaintenanceCurrent: maintenanceDoc,
	}

	if err := writeJSON(outPath, exportPayload); err != nil {
		return fmt.Errorf("failed to write export file: %w", err)
	}
	return nil
}

func newFirestoreClient(ctx context.Context, projectID, serviceAccountJSON string) (*firestore.Client, error) {
	opts := make([]option.ClientOption, 0, 1)
	if serviceAccountJSON != "" {
		opts = append(opts, option.WithCredentialsJSON([]byte(serviceAccountJSON)))
	}
	client, err := firestore.NewClient(ctx, projectID, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create firestore client: %w", err)
	}
	return client, nil
}

func fetchCollection(ctx context.Context, client *firestore.Client, collection string) ([]FirestoreDocument, error) {
	iter := client.Collection(collection).Documents(ctx)
	defer iter.Stop()

	result := make([]FirestoreDocument, 0)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		result = append(result, FirestoreDocument{ID: doc.Ref.ID, Data: doc.Data()})
	}
	return result, nil
}

func fetchDocument(ctx context.Context, client *firestore.Client, collection, id string) (*FirestoreDocument, error) {
	doc, err := client.Collection(collection).Doc(id).Get(ctx)
	if err != nil {
		return nil, nil
	}
	return &FirestoreDocument{ID: doc.Ref.ID, Data: doc.Data()}, nil
}
