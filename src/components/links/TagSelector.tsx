import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Tag } from '../../types';
import { ERROR_MESSAGES } from '../../constants/messages';
import { colors, spacing, semanticSpacing, textStyles } from '../../theme/tokens';

interface TagSelectorProps {
  selectedTags: string[];
  existingTags: Tag[];
  newTagName: string;
  onNewTagChange: (text: string) => void;
  onAddTag: () => void;
  onSelectTag: (tagName: string) => void;
  onRemoveTag: (tagName: string) => void;
  disabled?: boolean;
}

/**
 * タグ選択コンポーネント
 * リンク追加/編集画面で使用するタグ選択UI
 */
export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  existingTags,
  newTagName,
  onNewTagChange,
  onAddTag,
  onSelectTag,
  onRemoveTag,
  disabled = false,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>タグ</Text>

      {/* 既存のタグから選択 */}
      {existingTags.length > 0 && (
        <>
          <Text style={styles.subLabel}>既存のタグから選択</Text>
          <View style={styles.existingTagsContainer}>
            {existingTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.name);
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.existingTag,
                    isSelected && styles.existingTagSelected,
                  ]}
                  onPress={() => onSelectTag(tag.name)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.existingTagText,
                      isSelected && styles.existingTagTextSelected,
                    ]}
                  >
                    {tag.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* 新しいタグを追加 */}
      <Text style={styles.subLabel}>新しいタグを追加</Text>
      <View style={styles.tagInputContainer}>
        <TextInput
          style={styles.tagInput}
          placeholder="タグ名を入力"
          value={newTagName}
          onChangeText={onNewTagChange}
          editable={!disabled}
          onSubmitEditing={onAddTag}
        />
        <TouchableOpacity
          style={styles.addTagButton}
          onPress={onAddTag}
          disabled={disabled}
        >
          <Text style={styles.addTagButtonText}>追加</Text>
        </TouchableOpacity>
      </View>

      {/* 選択中のタグ */}
      {selectedTags.length > 0 && (
        <>
          <Text style={styles.subLabel}>選択中のタグ</Text>
          <View style={styles.tagsContainer}>
            {selectedTags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tag}
                onPress={() => onRemoveTag(tag)}
              >
                <Text style={styles.tagText}>{tag}</Text>
                <Text style={styles.tagRemove}> ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: semanticSpacing.sectionGap,
  },
  label: {
    fontSize: textStyles.body.fontSize,
    fontWeight: textStyles.labelBold.fontWeight,
    color: colors.text.default,
    marginBottom: spacing.space100,
  },
  subLabel: {
    fontSize: textStyles.label.fontSize,
    fontWeight: textStyles.labelBold.fontWeight,
    color: colors.text.subtle,
    marginTop: spacing.space150,
    marginBottom: spacing.space100,
  },
  existingTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.space100,
  },
  existingTag: {
    backgroundColor: colors.surface.default,
    borderRadius: semanticSpacing.radiusRound,
    paddingHorizontal: spacing.space200,
    paddingVertical: spacing.space100,
    marginRight: spacing.space100,
    marginBottom: spacing.space100,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  existingTagSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  existingTagText: {
    fontSize: textStyles.label.fontSize,
    color: colors.text.default,
  },
  existingTagTextSelected: {
    color: colors.text.inverse,
    fontWeight: textStyles.labelBold.fontWeight,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    backgroundColor: colors.surface.default,
    borderRadius: spacing.space100,
    padding: spacing.space150,
    fontSize: textStyles.body.fontSize,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing.space100,
  },
  addTagButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing.space100,
    paddingHorizontal: semanticSpacing.cardPadding,
    paddingVertical: spacing.space150,
  },
  addTagButtonText: {
    color: colors.text.inverse,
    fontSize: textStyles.button.fontSize,
    fontWeight: textStyles.button.fontWeight,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.space150,
  },
  tag: {
    backgroundColor: colors.primary,
    borderRadius: semanticSpacing.radiusMedium,
    paddingHorizontal: spacing.space150,
    paddingVertical: spacing.space75,
    marginRight: spacing.space100,
    marginBottom: spacing.space100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    color: colors.text.inverse,
    fontSize: textStyles.label.fontSize,
  },
  tagRemove: {
    color: colors.text.inverse,
    fontSize: textStyles.body.fontSize,
    fontWeight: 'bold',
    marginLeft: spacing.space50,
  },
});
