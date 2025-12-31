import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Tag } from '../../types';
import { ERROR_MESSAGES } from '../../constants/messages';
import { colors } from '../../theme';

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
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 10,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginTop: 15,
    marginBottom: 8,
  },
  existingTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  existingTag: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  existingTagSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  existingTagText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  existingTagTextSelected: {
    color: 'colors.white',
    fontWeight: '600',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.borderGray,
    marginRight: 10,
  },
  addTagButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  addTagButtonText: {
    color: 'colors.white',
    fontSize: 16,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
  },
  tag: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    color: 'colors.white',
    fontSize: 14,
  },
  tagRemove: {
    color: 'colors.white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
