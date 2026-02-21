package firestoremigrate

import "time"

type FirestoreDocument struct {
	ID   string         `json:"id"`
	Data map[string]any `json:"data"`
}

type FirestoreExport struct {
	ExportedAt          time.Time                      `json:"exportedAt"`
	Collections         map[string][]FirestoreDocument `json:"collections"`
	MaintenanceCurrent  *FirestoreDocument             `json:"maintenanceCurrent,omitempty"`
}

type UserRow struct {
	ID          string     `json:"id"`
	Email       *string    `json:"email,omitempty"`
	DisplayName *string    `json:"displayName,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

type LinkRow struct {
	ID         string     `json:"id"`
	UserID     string     `json:"userId"`
	URL        string     `json:"url"`
	Title      string     `json:"title"`
	IsArchived bool       `json:"isArchived"`
	Summary    *string    `json:"summary,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
}

type TagRow struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
}

type LinkTagRow struct {
	LinkID    string    `json:"linkId"`
	TagID     string    `json:"tagId"`
	CreatedAt time.Time `json:"createdAt"`
}

type TimelineEntryRow struct {
	ID        string    `json:"id"`
	LinkID    string    `json:"linkId"`
	Type      string    `json:"type"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}

type MaintenanceStatusRow struct {
	ID                string      `json:"id"`
	IsMaintenanceMode bool        `json:"isMaintenanceMode"`
	Reason            *string     `json:"reason,omitempty"`
	StartedAt         *time.Time  `json:"startedAt,omitempty"`
	StartedBy         *string     `json:"startedBy,omitempty"`
}

type DeveloperRow struct {
	UID       string      `json:"uid"`
	Email     string      `json:"email"`
	AddedAt   time.Time   `json:"addedAt"`
	DeletedAt *time.Time  `json:"deletedAt,omitempty"`
}

type MaintenanceLogRow struct {
	ID             string     `json:"id"`
	Action         string     `json:"action"`
	Reason         *string    `json:"reason,omitempty"`
	PerformedBy    string     `json:"performedBy"`
	PerformedByUID string     `json:"performedByUid"`
	Timestamp      time.Time  `json:"timestamp"`
	PreviousStatus bool       `json:"previousStatus"`
}

type TransformedData struct {
	GeneratedAt       time.Time              `json:"generatedAt"`
	Users             []UserRow              `json:"users"`
	Links             []LinkRow              `json:"links"`
	Tags              []TagRow               `json:"tags"`
	LinkTags          []LinkTagRow           `json:"linkTags"`
	TimelineEntries   []TimelineEntryRow     `json:"timelineEntries"`
	MaintenanceStatus MaintenanceStatusRow   `json:"maintenanceStatus"`
	Developers        []DeveloperRow         `json:"developers"`
	MaintenanceLogs   []MaintenanceLogRow    `json:"maintenanceLogs"`
	Report            []string               `json:"report"`
}

type VerificationSummary struct {
	Expected map[string]int `json:"expected"`
	Actual   map[string]int `json:"actual"`
	Matched  bool           `json:"matched"`
}
