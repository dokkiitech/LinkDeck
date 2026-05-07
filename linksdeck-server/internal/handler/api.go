package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"linksdeck-server/internal/auth"
	"linksdeck-server/internal/db/sqlc"
	"linksdeck-server/internal/gen"
	"linksdeck-server/internal/repository"
)

type APIHandler struct {
	store *repository.Store
}

func NewAPIHandler(store *repository.Store) *APIHandler {
	return &APIHandler{store: store}
}

func (h *APIHandler) GetLiveHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, gen.HealthResponse{Status: "ok", Timestamp: time.Now().UTC()})
}

func (h *APIHandler) GetReadyHealth(w http.ResponseWriter, r *http.Request) {
	if err := h.store.Ping(r.Context()); err != nil {
		writeError(w, http.StatusServiceUnavailable, "database is not ready")
		return
	}
	writeJSON(w, http.StatusOK, gen.HealthResponse{Status: "ready", Timestamp: time.Now().UTC()})
}

func (h *APIHandler) GetMaintenanceStatus(w http.ResponseWriter, r *http.Request) {
	status, err := h.store.GetMaintenanceStatus(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch maintenance status")
		return
	}
	writeJSON(w, http.StatusOK, toMaintenanceStatus(status))
}

func (h *APIHandler) ListLinks(w http.ResponseWriter, r *http.Request, params gen.ListLinksParams) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	includeArchived := false
	if params.IncludeArchived != nil {
		includeArchived = *params.IncludeArchived
	}

	links, err := h.store.ListLinks(r.Context(), principal.UserID, includeArchived, params.Tag)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list links")
		return
	}

	items := make([]gen.Link, 0, len(links))
	for _, link := range links {
		items = append(items, toLink(link))
	}

	writeJSON(w, http.StatusOK, map[string][]gen.Link{"links": items})
}

func (h *APIHandler) CreateLink(w http.ResponseWriter, r *http.Request) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	var body gen.CreateLinkJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	url := strings.TrimSpace(body.Url)
	title := strings.TrimSpace(body.Title)
	if url == "" || title == "" {
		writeError(w, http.StatusBadRequest, "url and title are required")
		return
	}

	tags := []string{}
	if body.Tags != nil {
		tags = *body.Tags
	}

	created, err := h.store.CreateLink(r.Context(), principal.UserID, url, title, tags)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create link")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"id": created.Link.ID})
}

func (h *APIHandler) CheckLinkExists(w http.ResponseWriter, r *http.Request, params gen.CheckLinkExistsParams) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	url := strings.TrimSpace(params.Url)
	if url == "" {
		writeError(w, http.StatusBadRequest, "url is required")
		return
	}

	exists, err := h.store.LinkExists(r.Context(), principal.UserID, url)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to check link")
		return
	}

	writeJSON(w, http.StatusOK, gen.LinkExistsResponse{Exists: exists})
}

func (h *APIHandler) DeleteLink(w http.ResponseWriter, r *http.Request, linkID gen.LinkId) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	deleted, err := h.store.DeleteLink(r.Context(), principal.UserID, string(linkID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete link")
		return
	}
	if !deleted {
		writeError(w, http.StatusNotFound, "link not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *APIHandler) GetLink(w http.ResponseWriter, r *http.Request, linkID gen.LinkId) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	link, err := h.store.GetLink(r.Context(), principal.UserID, string(linkID))
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "link not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to get link")
		return
	}

	writeJSON(w, http.StatusOK, toLink(link))
}

func (h *APIHandler) UpdateLink(w http.ResponseWriter, r *http.Request, linkID gen.LinkId) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	var body gen.UpdateLinkJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.store.UpdateLink(
		r.Context(),
		principal.UserID,
		string(linkID),
		body.Url,
		body.Title,
		body.IsArchived,
		body.Summary,
	)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "link not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to update link")
		return
	}

	writeJSON(w, http.StatusOK, toLink(updated))
}

func (h *APIHandler) AddNoteToLink(w http.ResponseWriter, r *http.Request, linkID gen.LinkId) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	var body gen.AddNoteToLinkJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	content := strings.TrimSpace(body.Content)
	if content == "" {
		writeError(w, http.StatusBadRequest, "content is required")
		return
	}

	entryType := "note"
	if body.Type != nil {
		entryType = string(*body.Type)
	}
	if entryType != "note" && entryType != "summary" {
		writeError(w, http.StatusBadRequest, "type must be note or summary")
		return
	}

	updated, err := h.store.AddTimelineEntry(r.Context(), principal.UserID, string(linkID), entryType, content)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "link not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to add note")
		return
	}

	writeJSON(w, http.StatusOK, toLink(updated))
}

func (h *APIHandler) DeleteNoteFromLink(w http.ResponseWriter, r *http.Request, linkID gen.LinkId, noteID string) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	updated, err := h.store.DeleteTimelineEntry(r.Context(), principal.UserID, string(linkID), noteID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "note not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to delete note")
		return
	}

	writeJSON(w, http.StatusOK, toLink(updated))
}

func (h *APIHandler) AddTagToLink(w http.ResponseWriter, r *http.Request, linkID gen.LinkId) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	var body gen.AddTagToLinkJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	tagName := strings.TrimSpace(body.Name)
	if tagName == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	updated, err := h.store.AddTagToLink(r.Context(), principal.UserID, string(linkID), tagName)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "link not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to add tag")
		return
	}

	writeJSON(w, http.StatusOK, toLink(updated))
}

func (h *APIHandler) RemoveTagFromLink(w http.ResponseWriter, r *http.Request, linkID gen.LinkId, tagName string) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	updated, err := h.store.RemoveTagFromLink(r.Context(), principal.UserID, string(linkID), tagName)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "link not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to remove tag")
		return
	}

	writeJSON(w, http.StatusOK, toLink(updated))
}

func (h *APIHandler) ListTags(w http.ResponseWriter, r *http.Request) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	tags, err := h.store.ListTags(r.Context(), principal.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list tags")
		return
	}

	items := make([]gen.Tag, 0, len(tags))
	for _, tag := range tags {
		items = append(items, toTag(tag))
	}

	writeJSON(w, http.StatusOK, map[string][]gen.Tag{"tags": items})
}

func (h *APIHandler) CreateTag(w http.ResponseWriter, r *http.Request) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	var body gen.CreateTagJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	tagName := strings.TrimSpace(body.Name)
	if tagName == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	tag, err := h.store.CreateTag(r.Context(), principal.UserID, tagName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create tag")
		return
	}

	writeJSON(w, http.StatusCreated, toTag(tag))
}

func (h *APIHandler) DeleteTag(w http.ResponseWriter, r *http.Request, tagID string) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	deleted, err := h.store.DeleteTag(r.Context(), principal.UserID, tagID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete tag")
		return
	}
	if !deleted {
		writeError(w, http.StatusNotFound, "tag not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *APIHandler) IsDeveloper(w http.ResponseWriter, r *http.Request) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	isDeveloper, err := h.store.IsDeveloper(r.Context(), principal.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to check developer")
		return
	}

	writeJSON(w, http.StatusOK, gen.IsDeveloperResponse{IsDeveloper: isDeveloper})
}

func (h *APIHandler) SetMaintenanceMode(w http.ResponseWriter, r *http.Request) {
	principal, ok := principalFromRequest(w, r)
	if !ok {
		return
	}

	var body gen.SetMaintenanceModeJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if body.IsMaintenanceMode && (body.Reason == nil || strings.TrimSpace(*body.Reason) == "") {
		writeError(w, http.StatusBadRequest, "reason is required when enabling maintenance mode")
		return
	}

	current, err := h.store.GetMaintenanceStatus(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch current maintenance status")
		return
	}

	performedBy := principal.UserID
	if principal.Email != nil && *principal.Email != "" {
		performedBy = *principal.Email
	}

	status, err := h.store.SetMaintenanceStatus(r.Context(), body.IsMaintenanceMode, body.Reason, &performedBy)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update maintenance status")
		return
	}

	action := "disabled"
	if body.IsMaintenanceMode {
		action = "enabled"
	}
	_, _ = h.store.AddMaintenanceLog(
		r.Context(),
		action,
		body.Reason,
		performedBy,
		principal.UserID,
		current.IsMaintenanceMode,
	)

	writeJSON(w, http.StatusOK, toMaintenanceStatus(status))
}

func (h *APIHandler) ListDevelopers(w http.ResponseWriter, r *http.Request) {
	developers, err := h.store.ListDevelopers(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list developers")
		return
	}

	items := make([]gen.Developer, 0, len(developers))
	for _, developer := range developers {
		items = append(items, gen.Developer{
			Uid:     developer.Uid,
			Email:   developer.Email,
			AddedAt: pgTime(developer.AddedAt),
		})
	}

	writeJSON(w, http.StatusOK, map[string][]gen.Developer{"developers": items})
}

func (h *APIHandler) AddDeveloper(w http.ResponseWriter, r *http.Request) {
	var body gen.AddDeveloperJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(body.Uid) == "" || strings.TrimSpace(body.Email) == "" {
		writeError(w, http.StatusBadRequest, "uid and email are required")
		return
	}

	developer, err := h.store.AddDeveloper(r.Context(), strings.TrimSpace(body.Uid), strings.TrimSpace(body.Email))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to add developer")
		return
	}

	writeJSON(w, http.StatusCreated, gen.Developer{
		Uid:     developer.Uid,
		Email:   developer.Email,
		AddedAt: pgTime(developer.AddedAt),
	})
}

func (h *APIHandler) RemoveDeveloper(w http.ResponseWriter, r *http.Request, uid string) {
	deleted, err := h.store.RemoveDeveloper(r.Context(), uid)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to remove developer")
		return
	}
	if !deleted {
		writeError(w, http.StatusNotFound, "developer not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *APIHandler) ListMaintenanceLogs(w http.ResponseWriter, r *http.Request, params gen.ListMaintenanceLogsParams) {
	limit := int32(50)
	if params.Limit != nil {
		limit = int32(*params.Limit)
	}
	if limit < 1 {
		limit = 1
	}
	if limit > 200 {
		limit = 200
	}

	logs, err := h.store.ListMaintenanceLogs(r.Context(), limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list maintenance logs")
		return
	}

	items := make([]gen.MaintenanceLog, 0, len(logs))
	for _, logEntry := range logs {
		items = append(items, gen.MaintenanceLog{
			Id:             logEntry.ID,
			Action:         gen.MaintenanceLogAction(logEntry.Action),
			Reason:         logEntry.Reason,
			PerformedBy:    logEntry.PerformedBy,
			PerformedByUid: logEntry.PerformedByUid,
			Timestamp:      pgTime(logEntry.Timestamp),
			PreviousStatus: logEntry.PreviousStatus,
		})
	}

	writeJSON(w, http.StatusOK, map[string][]gen.MaintenanceLog{"logs": items})
}

func principalFromRequest(w http.ResponseWriter, r *http.Request) (*auth.Principal, bool) {
	principal, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return nil, false
	}
	return principal, true
}

func toLink(aggregate repository.LinkAggregate) gen.Link {
	timeline := make([]gen.TimelineEntry, 0, len(aggregate.Timeline))
	for _, entry := range aggregate.Timeline {
		timeline = append(timeline, gen.TimelineEntry{
			Id:        entry.ID,
			Type:      gen.TimelineEntryType(entry.Type),
			Content:   entry.Content,
			CreatedAt: pgTime(entry.CreatedAt),
		})
	}

	var timelinePtr *[]gen.TimelineEntry
	if len(timeline) > 0 {
		timelinePtr = &timeline
	}

	return gen.Link{
		Id:         aggregate.Link.ID,
		UserId:     aggregate.Link.UserID,
		Url:        aggregate.Link.Url,
		Title:      aggregate.Link.Title,
		Tags:       aggregate.Tags,
		IsArchived: aggregate.Link.IsArchived,
		CreatedAt:  pgTime(aggregate.Link.CreatedAt),
		Summary:    aggregate.Link.Summary,
		Timeline:   timelinePtr,
	}
}

func toTag(tag sqlc.Tag) gen.Tag {
	return gen.Tag{
		Id:        tag.ID,
		UserId:    tag.UserID,
		Name:      tag.Name,
		CreatedAt: pgTime(tag.CreatedAt),
	}
}

func toMaintenanceStatus(status sqlc.MaintenanceStatus) gen.MaintenanceStatus {
	return gen.MaintenanceStatus{
		IsMaintenanceMode: status.IsMaintenanceMode,
		Reason:            status.Reason,
		StartedAt:         pgTimePtr(status.StartedAt),
		StartedBy:         status.StartedBy,
	}
}

func pgTime(ts pgtype.Timestamptz) time.Time {
	if !ts.Valid {
		return time.Time{}
	}
	return ts.Time.UTC()
}

func pgTimePtr(ts pgtype.Timestamptz) *time.Time {
	if !ts.Valid {
		return nil
	}
	t := ts.Time.UTC()
	return &t
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, gen.ErrorResponse{Message: message})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
