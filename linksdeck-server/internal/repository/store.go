package repository

import (
	"context"
	"errors"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"linksdeck-server/internal/db/sqlc"
)

var ErrNotFound = errors.New("not found")

type LinkAggregate struct {
	Link     sqlc.Link
	Tags     []string
	Timeline []sqlc.TimelineEntry
}

type Store struct {
	db *pgxpool.Pool
	q  *sqlc.Queries
}

func NewStore(db *pgxpool.Pool) *Store {
	return &Store{db: db, q: sqlc.New(db)}
}

func (s *Store) Ping(ctx context.Context) error {
	_, err := s.q.Ping(ctx)
	return err
}

func (s *Store) UpsertUser(ctx context.Context, userID string, email, displayName *string) error {
	now := nowPG()
	_, err := s.q.UpsertUser(ctx, sqlc.UpsertUserParams{
		ID:          userID,
		Email:       email,
		DisplayName: displayName,
		CreatedAt:   now,
		UpdatedAt:   now,
	})
	return err
}

func (s *Store) IsDeveloper(ctx context.Context, uid string) (bool, error) {
	return s.q.IsDeveloper(ctx, uid)
}

func (s *Store) ListDevelopers(ctx context.Context) ([]sqlc.Developer, error) {
	return s.q.ListDevelopers(ctx)
}

func (s *Store) AddDeveloper(ctx context.Context, uid, email string) (sqlc.Developer, error) {
	return s.q.UpsertDeveloper(ctx, sqlc.UpsertDeveloperParams{
		Uid:     uid,
		Email:   email,
		AddedAt: nowPG(),
	})
}

func (s *Store) RemoveDeveloper(ctx context.Context, uid string) (bool, error) {
	rows, err := s.q.SoftDeleteDeveloper(ctx, sqlc.SoftDeleteDeveloperParams{
		Uid:       uid,
		DeletedAt: nowPG(),
	})
	if err != nil {
		return false, err
	}
	return rows > 0, nil
}

func (s *Store) GetMaintenanceStatus(ctx context.Context) (sqlc.MaintenanceStatus, error) {
	status, err := s.q.GetMaintenanceStatus(ctx)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return s.q.UpsertMaintenanceStatus(ctx, sqlc.UpsertMaintenanceStatusParams{
				IsMaintenanceMode: false,
				Reason:            nil,
				StartedAt:         pgtype.Timestamptz{},
				StartedBy:         nil,
			})
		}
		return sqlc.MaintenanceStatus{}, err
	}
	return status, nil
}

func (s *Store) SetMaintenanceStatus(
	ctx context.Context,
	isMaintenanceMode bool,
	reason *string,
	startedBy *string,
) (sqlc.MaintenanceStatus, error) {
	var startedAt pgtype.Timestamptz
	if isMaintenanceMode {
		startedAt = nowPG()
	} else {
		reason = nil
		startedBy = nil
		startedAt = pgtype.Timestamptz{}
	}

	return s.q.UpsertMaintenanceStatus(ctx, sqlc.UpsertMaintenanceStatusParams{
		IsMaintenanceMode: isMaintenanceMode,
		Reason:            reason,
		StartedAt:         startedAt,
		StartedBy:         startedBy,
	})
}

func (s *Store) AddMaintenanceLog(
	ctx context.Context,
	action string,
	reason *string,
	performedBy string,
	performedByUID string,
	previousStatus bool,
) (sqlc.MaintenanceLog, error) {
	return s.q.CreateMaintenanceLog(ctx, sqlc.CreateMaintenanceLogParams{
		ID:             uuid.NewString(),
		Action:         action,
		Reason:         reason,
		PerformedBy:    performedBy,
		PerformedByUid: performedByUID,
		Timestamp:      nowPG(),
		PreviousStatus: previousStatus,
	})
}

func (s *Store) ListMaintenanceLogs(ctx context.Context, limit int32) ([]sqlc.MaintenanceLog, error) {
	return s.q.ListMaintenanceLogs(ctx, limit)
}

func (s *Store) ListLinks(ctx context.Context, userID string, includeArchived bool, tagName *string) ([]LinkAggregate, error) {
	links, err := s.q.ListLinks(ctx, sqlc.ListLinksParams{
		UserID:          userID,
		IncludeArchived: includeArchived,
		TagName:         normalizeOptionalString(tagName),
	})
	if err != nil {
		return nil, err
	}

	result := make([]LinkAggregate, 0, len(links))
	for _, link := range links {
		agg, err := s.buildLinkAggregate(ctx, link)
		if err != nil {
			return nil, err
		}
		result = append(result, agg)
	}
	return result, nil
}

func (s *Store) CreateLink(ctx context.Context, userID, url, title string, tags []string) (LinkAggregate, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return LinkAggregate{}, err
	}
	defer tx.Rollback(ctx)

	qtx := s.q.WithTx(tx)
	linkID := uuid.NewString()
	now := nowPG()

	link, err := qtx.CreateLink(ctx, sqlc.CreateLinkParams{
		ID:        linkID,
		UserID:    userID,
		Url:       url,
		Title:     title,
		CreatedAt: now,
	})
	if err != nil {
		return LinkAggregate{}, err
	}

	for _, tagName := range uniqueTags(tags) {
		tag, err := qtx.CreateTag(ctx, sqlc.CreateTagParams{
			ID:        uuid.NewString(),
			UserID:    userID,
			Name:      tagName,
			CreatedAt: now,
		})
		if err != nil {
			return LinkAggregate{}, err
		}
		if err := qtx.AddLinkTag(ctx, sqlc.AddLinkTagParams{
			LinkID:    link.ID,
			TagID:     tag.ID,
			CreatedAt: now,
		}); err != nil {
			return LinkAggregate{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return LinkAggregate{}, err
	}

	return s.GetLink(ctx, userID, linkID)
}

func (s *Store) GetLink(ctx context.Context, userID, linkID string) (LinkAggregate, error) {
	link, err := s.q.GetLinkByID(ctx, sqlc.GetLinkByIDParams{ID: linkID, UserID: userID})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LinkAggregate{}, ErrNotFound
		}
		return LinkAggregate{}, err
	}
	return s.buildLinkAggregate(ctx, link)
}

func (s *Store) UpdateLink(
	ctx context.Context,
	userID, linkID string,
	url, title *string,
	isArchived *bool,
	summary *string,
) (LinkAggregate, error) {
	updated, err := s.q.UpdateLink(ctx, sqlc.UpdateLinkParams{
		ID:         linkID,
		UserID:     userID,
		Url:        normalizeOptionalString(url),
		Title:      normalizeOptionalString(title),
		IsArchived: isArchived,
		Summary:    summary,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LinkAggregate{}, ErrNotFound
		}
		return LinkAggregate{}, err
	}
	return s.buildLinkAggregate(ctx, updated)
}

func (s *Store) DeleteLink(ctx context.Context, userID, linkID string) (bool, error) {
	rows, err := s.q.DeleteLink(ctx, sqlc.DeleteLinkParams{ID: linkID, UserID: userID})
	if err != nil {
		return false, err
	}
	return rows > 0, nil
}

func (s *Store) LinkExists(ctx context.Context, userID, url string) (bool, error) {
	return s.q.LinkExists(ctx, sqlc.LinkExistsParams{UserID: userID, Url: url})
}

func (s *Store) AddTagToLink(ctx context.Context, userID, linkID, tagName string) (LinkAggregate, error) {
	owner, err := s.q.IsLinkOwner(ctx, sqlc.IsLinkOwnerParams{ID: linkID, UserID: userID})
	if err != nil {
		return LinkAggregate{}, err
	}
	if !owner {
		return LinkAggregate{}, ErrNotFound
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return LinkAggregate{}, err
	}
	defer tx.Rollback(ctx)

	qtx := s.q.WithTx(tx)
	now := nowPG()
	tag, err := qtx.CreateTag(ctx, sqlc.CreateTagParams{
		ID:        uuid.NewString(),
		UserID:    userID,
		Name:      tagName,
		CreatedAt: now,
	})
	if err != nil {
		return LinkAggregate{}, err
	}

	if err := qtx.AddLinkTag(ctx, sqlc.AddLinkTagParams{
		LinkID:    linkID,
		TagID:     tag.ID,
		CreatedAt: now,
	}); err != nil {
		return LinkAggregate{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return LinkAggregate{}, err
	}

	return s.GetLink(ctx, userID, linkID)
}

func (s *Store) RemoveTagFromLink(ctx context.Context, userID, linkID, tagName string) (LinkAggregate, error) {
	owner, err := s.q.IsLinkOwner(ctx, sqlc.IsLinkOwnerParams{ID: linkID, UserID: userID})
	if err != nil {
		return LinkAggregate{}, err
	}
	if !owner {
		return LinkAggregate{}, ErrNotFound
	}

	_, err = s.q.RemoveLinkTagByName(ctx, sqlc.RemoveLinkTagByNameParams{
		ID:     linkID,
		UserID: userID,
		Name:   tagName,
	})
	if err != nil {
		return LinkAggregate{}, err
	}

	return s.GetLink(ctx, userID, linkID)
}

func (s *Store) AddTimelineEntry(ctx context.Context, userID, linkID, entryType, content string) (LinkAggregate, error) {
	owner, err := s.q.IsLinkOwner(ctx, sqlc.IsLinkOwnerParams{ID: linkID, UserID: userID})
	if err != nil {
		return LinkAggregate{}, err
	}
	if !owner {
		return LinkAggregate{}, ErrNotFound
	}

	_, err = s.q.AddTimelineEntry(ctx, sqlc.AddTimelineEntryParams{
		ID:        uuid.NewString(),
		LinkID:    linkID,
		Type:      entryType,
		Content:   content,
		CreatedAt: nowPG(),
	})
	if err != nil {
		return LinkAggregate{}, err
	}

	if entryType == "summary" {
		if _, err := s.q.UpdateLink(ctx, sqlc.UpdateLinkParams{
			ID:      linkID,
			UserID:  userID,
			Summary: &content,
		}); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return LinkAggregate{}, ErrNotFound
			}
			return LinkAggregate{}, err
		}
	}

	return s.GetLink(ctx, userID, linkID)
}

func (s *Store) DeleteTimelineEntry(ctx context.Context, userID, linkID, noteID string) (LinkAggregate, error) {
	rows, err := s.q.DeleteTimelineEntryByID(ctx, sqlc.DeleteTimelineEntryByIDParams{
		ID:     noteID,
		ID_2:   linkID,
		UserID: userID,
	})
	if err != nil {
		return LinkAggregate{}, err
	}
	if rows == 0 {
		return LinkAggregate{}, ErrNotFound
	}

	return s.GetLink(ctx, userID, linkID)
}

func (s *Store) ListTags(ctx context.Context, userID string) ([]sqlc.Tag, error) {
	return s.q.ListTagsByUser(ctx, userID)
}

func (s *Store) CreateTag(ctx context.Context, userID, name string) (sqlc.Tag, error) {
	return s.q.CreateTag(ctx, sqlc.CreateTagParams{
		ID:        uuid.NewString(),
		UserID:    userID,
		Name:      name,
		CreatedAt: nowPG(),
	})
}

func (s *Store) DeleteTag(ctx context.Context, userID, tagID string) (bool, error) {
	rows, err := s.q.DeleteTagByID(ctx, sqlc.DeleteTagByIDParams{ID: tagID, UserID: userID})
	if err != nil {
		return false, err
	}
	return rows > 0, nil
}

func (s *Store) buildLinkAggregate(ctx context.Context, link sqlc.Link) (LinkAggregate, error) {
	tags, err := s.q.ListTagNamesByLinkID(ctx, link.ID)
	if err != nil {
		return LinkAggregate{}, err
	}
	timeline, err := s.q.ListTimelineByLinkID(ctx, link.ID)
	if err != nil {
		return LinkAggregate{}, err
	}
	return LinkAggregate{Link: link, Tags: tags, Timeline: timeline}, nil
}

func nowPG() pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}
}

func normalizeOptionalString(input *string) *string {
	if input == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*input)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func uniqueTags(tags []string) []string {
	set := make(map[string]struct{})
	out := make([]string, 0, len(tags))
	for _, t := range tags {
		trimmed := strings.TrimSpace(t)
		if trimmed == "" {
			continue
		}
		if _, exists := set[trimmed]; exists {
			continue
		}
		set[trimmed] = struct{}{}
		out = append(out, trimmed)
	}
	sort.Strings(out)
	return out
}
