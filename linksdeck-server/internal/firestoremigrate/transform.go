package firestoremigrate

import (
	"fmt"
	"sort"
	"strings"
	"time"
)

func TransformExport(exportPath, outPath string) error {
	var exported FirestoreExport
	if err := readJSON(exportPath, &exported); err != nil {
		return fmt.Errorf("failed to read export file: %w", err)
	}

	now := time.Now().UTC()
	transformed := TransformedData{
		GeneratedAt: now,
		Users:       []UserRow{},
		Links:       []LinkRow{},
		Tags:        []TagRow{},
		LinkTags:    []LinkTagRow{},
		TimelineEntries: []TimelineEntryRow{},
		MaintenanceStatus: MaintenanceStatusRow{
			ID:                "current",
			IsMaintenanceMode: false,
		},
		Developers:      []DeveloperRow{},
		MaintenanceLogs: []MaintenanceLogRow{},
		Report:          []string{},
	}

	tagMap := map[string]TagRow{}
	linkTagMap := map[string]LinkTagRow{}
	duplicateTagCount := 0

	putTag := func(tag TagRow) {
		key := tagKey(tag.UserID, tag.Name)
		existing, exists := tagMap[key]
		if !exists {
			tagMap[key] = tag
			return
		}
		duplicateTagCount++
		if tag.CreatedAt.Before(existing.CreatedAt) {
			tagMap[key] = tag
		}
	}

	for _, userDoc := range exported.Collections["users"] {
		createdAt := parseTime(userDoc.Data["createdAt"], now)
		updatedAt := parseTime(userDoc.Data["updatedAt"], createdAt)
		transformed.Users = append(transformed.Users, UserRow{
			ID:          userDoc.ID,
			Email:       parseStringPtr(userDoc.Data["email"]),
			DisplayName: parseStringPtr(userDoc.Data["displayName"]),
			CreatedAt:   createdAt,
			UpdatedAt:   updatedAt,
		})
	}

	for _, tagDoc := range exported.Collections["tags"] {
		userID := parseString(tagDoc.Data["userId"])
		name := sanitizeTagName(parseString(tagDoc.Data["name"]))
		if userID == "" || name == "" {
			continue
		}
		putTag(TagRow{
			ID:        tagDoc.ID,
			UserID:    userID,
			Name:      name,
			CreatedAt: parseTime(tagDoc.Data["createdAt"], now),
		})
	}

	for _, linkDoc := range exported.Collections["links"] {
		userID := parseString(linkDoc.Data["userId"])
		url := strings.TrimSpace(parseString(linkDoc.Data["url"]))
		title := strings.TrimSpace(parseString(linkDoc.Data["title"]))
		if userID == "" || url == "" {
			continue
		}
		if title == "" {
			title = url
		}

		createdAt := parseTime(linkDoc.Data["createdAt"], now)
		transformed.Links = append(transformed.Links, LinkRow{
			ID:         linkDoc.ID,
			UserID:     userID,
			URL:        url,
			Title:      title,
			IsArchived: parseBool(linkDoc.Data["isArchived"], false),
			Summary:    parseStringPtr(linkDoc.Data["summary"]),
			CreatedAt:  createdAt,
			UpdatedAt:  parseTime(linkDoc.Data["updatedAt"], createdAt),
		})

		for _, tagAny := range toSlice(linkDoc.Data["tags"]) {
			name := sanitizeTagName(parseString(tagAny))
			if name == "" {
				continue
			}
			key := tagKey(userID, name)
			tag, exists := tagMap[key]
			if !exists {
				tag = TagRow{
					ID:        deterministicTagID(userID, name),
					UserID:    userID,
					Name:      name,
					CreatedAt: createdAt,
				}
				tagMap[key] = tag
			}
			linkTagKey := fmt.Sprintf("%s|%s", linkDoc.ID, tag.ID)
			linkTagMap[linkTagKey] = LinkTagRow{
				LinkID:    linkDoc.ID,
				TagID:     tag.ID,
				CreatedAt: createdAt,
			}
		}

		for index, entryAny := range toSlice(linkDoc.Data["timeline"]) {
			entry := toMap(entryAny)
			content := strings.TrimSpace(parseString(entry["content"]))
			if content == "" {
				continue
			}
			entryType := strings.TrimSpace(parseString(entry["type"]))
			if entryType != "note" && entryType != "summary" {
				entryType = "note"
			}
			transformed.TimelineEntries = append(transformed.TimelineEntries, TimelineEntryRow{
				ID:        fmt.Sprintf("%s_%d", linkDoc.ID, index),
				LinkID:    linkDoc.ID,
				Type:      entryType,
				Content:   content,
				CreatedAt: parseTime(entry["createdAt"], createdAt),
			})
		}
	}

	for _, tag := range tagMap {
		transformed.Tags = append(transformed.Tags, tag)
	}
	for _, linkTag := range linkTagMap {
		transformed.LinkTags = append(transformed.LinkTags, linkTag)
	}

	for _, developerDoc := range exported.Collections["developers"] {
		data := developerDoc.Data
		email := strings.TrimSpace(parseString(data["email"]))
		if email == "" {
			continue
		}

		var deletedAt *time.Time
		if parseBool(data["deleted"], false) {
			deletedAt = parseTimePtr(data["deletedAt"])
			if deletedAt == nil {
				nowCopy := now
				deletedAt = &nowCopy
			}
		} else {
			deletedAt = parseTimePtr(data["deletedAt"])
		}

		transformed.Developers = append(transformed.Developers, DeveloperRow{
			UID:       developerDoc.ID,
			Email:     email,
			AddedAt:   parseTime(data["addedAt"], now),
			DeletedAt: deletedAt,
		})
	}

	for _, logDoc := range exported.Collections["maintenanceLogs"] {
		data := logDoc.Data
		action := strings.TrimSpace(parseString(data["action"]))
		if action != "enabled" && action != "disabled" {
			action = "disabled"
		}
		transformed.MaintenanceLogs = append(transformed.MaintenanceLogs, MaintenanceLogRow{
			ID:             logDoc.ID,
			Action:         action,
			Reason:         parseStringPtr(data["reason"]),
			PerformedBy:    strings.TrimSpace(parseString(data["performedBy"])),
			PerformedByUID: strings.TrimSpace(parseString(data["performedByUid"])),
			Timestamp:      parseTime(data["timestamp"], now),
			PreviousStatus: parseBool(data["previousStatus"], false),
		})
	}

	if exported.MaintenanceCurrent != nil {
		data := exported.MaintenanceCurrent.Data
		transformed.MaintenanceStatus = MaintenanceStatusRow{
			ID:                "current",
			IsMaintenanceMode: parseBool(data["isMaintenanceMode"], false),
			Reason:            parseStringPtr(data["reason"]),
			StartedAt:         parseTimePtr(data["startedAt"]),
			StartedBy:         parseStringPtr(data["startedBy"]),
		}
	}

	sort.Slice(transformed.Users, func(i, j int) bool { return transformed.Users[i].ID < transformed.Users[j].ID })
	sort.Slice(transformed.Links, func(i, j int) bool { return transformed.Links[i].CreatedAt.After(transformed.Links[j].CreatedAt) })
	sort.Slice(transformed.Tags, func(i, j int) bool {
		if transformed.Tags[i].UserID == transformed.Tags[j].UserID {
			return transformed.Tags[i].Name < transformed.Tags[j].Name
		}
		return transformed.Tags[i].UserID < transformed.Tags[j].UserID
	})
	sort.Slice(transformed.LinkTags, func(i, j int) bool {
		if transformed.LinkTags[i].LinkID == transformed.LinkTags[j].LinkID {
			return transformed.LinkTags[i].TagID < transformed.LinkTags[j].TagID
		}
		return transformed.LinkTags[i].LinkID < transformed.LinkTags[j].LinkID
	})
	sort.Slice(transformed.TimelineEntries, func(i, j int) bool {
		if transformed.TimelineEntries[i].LinkID == transformed.TimelineEntries[j].LinkID {
			return transformed.TimelineEntries[i].CreatedAt.Before(transformed.TimelineEntries[j].CreatedAt)
		}
		return transformed.TimelineEntries[i].LinkID < transformed.TimelineEntries[j].LinkID
	})
	sort.Slice(transformed.Developers, func(i, j int) bool { return transformed.Developers[i].UID < transformed.Developers[j].UID })
	sort.Slice(transformed.MaintenanceLogs, func(i, j int) bool { return transformed.MaintenanceLogs[i].Timestamp.After(transformed.MaintenanceLogs[j].Timestamp) })

	transformed.Report = append(transformed.Report,
		fmt.Sprintf("users: %d", len(transformed.Users)),
		fmt.Sprintf("links: %d", len(transformed.Links)),
		fmt.Sprintf("tags: %d", len(transformed.Tags)),
		fmt.Sprintf("link_tags: %d", len(transformed.LinkTags)),
		fmt.Sprintf("timeline_entries: %d", len(transformed.TimelineEntries)),
		fmt.Sprintf("developers: %d", len(transformed.Developers)),
		fmt.Sprintf("maintenance_logs: %d", len(transformed.MaintenanceLogs)),
		fmt.Sprintf("duplicate_tags_merged: %d", duplicateTagCount),
	)

	if err := writeJSON(outPath, transformed); err != nil {
		return fmt.Errorf("failed to write transformed file: %w", err)
	}
	return nil
}

func tagKey(userID, tagName string) string {
	return fmt.Sprintf("%s|%s", userID, strings.ToLower(strings.TrimSpace(tagName)))
}
