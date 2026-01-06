import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  
  Linking,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinksStackParamList, Link, Tag } from '../../types';
import { getLink, updateLink, addTagToLink, removeTagFromLink, getUserTags, deleteLink, createTag, addNoteToLink, addSummaryToTimeline, deleteNoteFromTimeline } from '../../services/firestore';
import { getGeminiApiKey } from '../../utils/storage';
import { summarizeURL } from '../../services/gemini';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import Timeline from '../../components/links/Timeline';

type LinkDetailScreenNavigationProp = NativeStackNavigationProp<
  LinksStackParamList,
  'LinkDetail'
>;

type LinkDetailScreenRouteProp = RouteProp<LinksStackParamList, 'LinkDetail'>;

interface Props {
  navigation: LinkDetailScreenNavigationProp;
  route: LinkDetailScreenRouteProp;
}

const LinkDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { linkId } = route.params;
  const { user } = useAuth();
  const { showError, showSuccess, showConfirm } = useDialog();
  const [link, setLink] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    loadLink();
  }, [linkId]);

  useEffect(() => {
    // ヘッダー右側にメニューボタンを追加
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowMenu(true)}
          style={{ marginRight: 15, padding: 8 }}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const loadLink = async () => {
    try {
      const fetchedLink = await getLink(linkId);
      setLink(fetchedLink);
    } catch (error) {
      console.error('Error loading link:', error);
      if (Platform.OS === 'web') {
        alert('エラー: リンクの読み込みに失敗しました');
      } else {
        showError('エラー', 'リンクの読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = async () => {
    if (!link) return;

    try {
      const supported = await Linking.canOpenURL(link.url);
      if (supported) {
        await Linking.openURL(link.url);
      } else {
        if (Platform.OS === 'web') {
          alert('エラー: このURLを開くことができません');
        } else {
          showError('エラー', 'このURLを開くことができません');
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('エラー: URLを開く際にエラーが発生しました');
      } else {
        showError('エラー', 'URLを開く際にエラーが発生しました');
      }
    }
  };

  const handleGenerateSummary = async () => {
    if (!link) return;

    const proceed = async () => {
      await generateSummaryInternal();
    };

    if (link.summary) {
      showConfirm(
        '確認',
        '既に要約が生成されています。新しく生成しますか？',
        proceed
      );
    } else {
      await proceed();
    }
  };

  const generateSummaryInternal = async () => {
    if (!link) return;

    setGeneratingSummary(true);

    try {
      const apiKey = await getGeminiApiKey();

      if (!apiKey) {
        const navigateToSettings = () => navigation.navigate('LinksList' as any);

        showConfirm(
          'APIキー未設定',
          '設定画面でGemini APIキーを設定してください。',
          navigateToSettings
        );
        setGeneratingSummary(false);
        return;
      }

      const summary = await summarizeURL(apiKey, link.url);

      // Add summary to timeline
      await addSummaryToTimeline(linkId, summary);

      // Reload link to get updated timeline
      const updatedLink = await getLink(linkId);
      if (updatedLink) {
        setLink(updatedLink);
      }

      showSuccess('成功', '要約を生成しました');
    } catch (error: any) {
      console.error('Error generating summary:', error);
      const errorMessage = error?.message === 'INSUFFICIENT_CONTENT'
        ? 'このリンクは要約できません。\n十分なテキストコンテンツが取得できませんでした。'
        : error?.message || '要約の生成に失敗しました';

      showError(
        error?.message === 'INSUFFICIENT_CONTENT' ? '要約不可' : 'エラー',
        errorMessage
      );
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleToggleArchive = async () => {
    if (!link) return;

    try {
      await updateLink(linkId, { isArchived: !link.isArchived });
      setLink({ ...link, isArchived: !link.isArchived });
      const message = link.isArchived ? 'アーカイブを解除しました' : 'アーカイブしました';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        showSuccess('成功', message);
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('エラー: 更新に失敗しました');
      } else {
        showError('エラー', '更新に失敗しました');
      }
    }
  };

  const handleOpenTagModal = async () => {
    if (!user) return;

    try {
      const tags = await getUserTags(user.uid);
      setAvailableTags(tags);
      setShowTagModal(true);
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('エラー: タグの読み込みに失敗しました');
      } else {
        showError('エラー', 'タグの読み込みに失敗しました');
      }
    }
  };

  const handleToggleTag = async (tagName: string) => {
    if (!link) return;

    const isAlreadyAdded = link.tags.includes(tagName);

    try {
      if (isAlreadyAdded) {
        await removeTagFromLink(linkId, tagName);
      } else {
        await addTagToLink(linkId, tagName);
      }

      const updatedLink = await getLink(linkId);
      if (updatedLink) {
        setLink(updatedLink);
      }
    } catch (error) {
      const message = isAlreadyAdded ? 'タグの削除に失敗しました' : 'タグの追加に失敗しました';
      if (Platform.OS === 'web') {
        alert(`エラー: ${message}`);
      } else {
        showError('エラー', message);
      }
    }
  };

  const handleAddNewTag = async () => {
    if (!user || !newTagName.trim()) return;

    const tagName = newTagName.trim();

    try {
      const existingTag = availableTags.find((tag) => tag.name === tagName);

      if (!existingTag) {
        const tagId = await createTag(user.uid, tagName);
        const newTagObj: Tag = {
          id: tagId,
          userId: user.uid,
          name: tagName,
          createdAt: new Date(),
        };
        setAvailableTags([newTagObj, ...availableTags]);
      }

      await handleToggleTag(tagName);
      setNewTagName('');
    } catch (error) {
      console.error('Error creating tag:', error);
      if (Platform.OS === 'web') {
        alert('エラー: タグの作成に失敗しました');
      } else {
        showError('エラー', 'タグの作成に失敗しました');
      }
    }
  };

  const handleOpenEditModal = () => {
    if (!link) return;
    setEditTitle(link.title);
    setEditUrl(link.url);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!link) return;

    // URLは必須
    if (!editUrl.trim()) {
      const message = 'URLは必須です';
      if (Platform.OS === 'web') {
        alert(`エラー: ${message}`);
      } else {
        showError('エラー', message);
      }
      return;
    }

    try {
      // タイトルが空の場合はURLを使用
      const finalTitle = editTitle.trim() || editUrl.trim();

      await updateLink(linkId, {
        title: finalTitle,
        url: editUrl.trim(),
      });

      const updatedLink = await getLink(linkId);
      if (updatedLink) {
        setLink(updatedLink);
      }
      setShowEditModal(false);
      if (Platform.OS === 'web') {
        alert('リンクを更新しました');
      } else {
        showSuccess('成功', 'リンクを更新しました');
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('エラー: リンクの更新に失敗しました');
      } else {
        showError('エラー', 'リンクの更新に失敗しました');
      }
    }
  };

  const handleDeleteLink = () => {
    const performDelete = async () => {
      try {
        await deleteLink(linkId);
        if (Platform.OS === 'web') {
          alert('リンクを削除しました');
          navigation.goBack();
        } else {
          showSuccess('成功', 'リンクを削除しました', () => navigation.goBack());
        }
      } catch (error) {
        if (Platform.OS === 'web') {
          alert('エラー: リンクの削除に失敗しました');
        } else {
          showError('エラー', 'リンクの削除に失敗しました');
        }
      }
    };

    showConfirm('確認', 'このリンクを削除しますか？', performDelete);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      if (Platform.OS === 'web') {
        alert('エラー: メモを入力してください');
      } else {
        showError('エラー', 'メモを入力してください');
      }
      return;
    }

    setAddingNote(true);

    try {
      await addNoteToLink(linkId, noteText.trim());

      // Reload link to get updated timeline
      const updatedLink = await getLink(linkId);
      if (updatedLink) {
        setLink(updatedLink);
      }

      setNoteText('');
      if (Platform.OS === 'web') {
        alert('メモを追加しました');
      } else {
        showSuccess('成功', 'メモを追加しました');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      if (Platform.OS === 'web') {
        alert('エラー: メモの追加に失敗しました');
      } else {
        showError('エラー', 'メモの追加に失敗しました');
      }
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const performDelete = async () => {
      try {
        await deleteNoteFromTimeline(linkId, noteId);

        // Reload link to get updated timeline
        const updatedLink = await getLink(linkId);
        if (updatedLink) {
          setLink(updatedLink);
        }

        if (Platform.OS === 'web') {
          alert('メモを削除しました');
        } else {
          showSuccess('成功', 'メモを削除しました');
        }
      } catch (error) {
        console.error('Error deleting note:', error);
        if (Platform.OS === 'web') {
          alert('エラー: メモの削除に失敗しました');
        } else {
          showError('エラー', 'メモの削除に失敗しました');
        }
      }
    };

    showConfirm('確認', 'このメモを削除しますか？', performDelete);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!link) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>リンクが見つかりませんでした</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{link.title}</Text>

        <TouchableOpacity onPress={handleOpenLink} style={styles.urlContainer}>
          <Text style={styles.url}>{link.url}</Text>
        </TouchableOpacity>

        <View style={styles.tagsContainer}>
          <View style={styles.tagsHeader}>
            <Text style={styles.tagsLabel}>タグ:</Text>
            <TouchableOpacity onPress={handleOpenTagModal} style={styles.editTagButton}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {link.tags.length > 0 ? (
            <View style={styles.tags}>
              {link.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noTagsText}>タグが設定されていません</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.openLinkButton}
          onPress={handleOpenLink}
        >
          <Ionicons name="open-outline" size={20} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.openLinkButtonText}>リンクを開く</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.generateSummaryButton,
            Platform.OS === 'web' && styles.disabledButton
          ]}
          onPress={handleGenerateSummary}
          disabled={generatingSummary || Platform.OS === 'web'}
        >
          <Text style={[
            styles.generateSummaryButtonText,
            Platform.OS === 'web' && styles.disabledButtonText
          ]}>
            {generatingSummary ? 'AI要約生成中...' : 'AI要約を生成'}
          </Text>
        </TouchableOpacity>

        {Platform.OS === 'web' && (
          <Text style={styles.webNotice}>
            要約機能はアプリ版から利用してください
          </Text>
        )}

        <View style={styles.noteInputContainer}>
          <Text style={styles.noteInputLabel}>メモを追加</Text>
          <View style={styles.noteInputRow}>
            <TextInput
              style={styles.noteInput}
              placeholder="メモを入力してください..."
              value={noteText}
              onChangeText={setNoteText}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[styles.addNoteButton, addingNote && styles.disabledButton]}
            onPress={handleAddNote}
            disabled={addingNote}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.addNoteButtonText}>
              {addingNote ? 'メモを追加中...' : 'メモを追加'}
            </Text>
          </TouchableOpacity>
        </View>

        {link.timeline && link.timeline.length > 0 && (
          <Timeline entries={link.timeline} onDeleteNote={handleDeleteNote} />
        )}

        <Text style={styles.date}>
          保存日時: {link.createdAt.toLocaleString('ja-JP')}
        </Text>
      </View>

      <Modal
        visible={showMenu}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleOpenEditModal();
              }}
            >
              <Text style={styles.menuItemText}>編集</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleToggleArchive();
              }}
            >
              <Text style={styles.menuItemText}>
                {link?.isArchived ? 'アーカイブを解除' : 'アーカイブ'}
              </Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleDeleteLink();
              }}
            >
              <Text style={styles.menuItemDangerText}>削除</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowEditModal(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>リンクを編集</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Text style={styles.modalCloseButton}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.editFormContainer}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.inputLabel}>URL（必須）</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="https://example.com"
                  value={editUrl}
                  onChangeText={setEditUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                  multiline
                />

                <Text style={styles.inputLabel}>タイトル（任意）</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="タイトル（未入力の場合はURLを使用）"
                  value={editTitle}
                  onChangeText={setEditTitle}
                  multiline
                />
                <Text style={styles.inputHint}>
                  ※ 空欄の場合、URLがタイトルとして使用されます
                </Text>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.saveButtonText}>保存</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showTagModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTagModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>タグを編集</Text>
              <TouchableOpacity onPress={() => setShowTagModal(false)}>
                <Text style={styles.modalCloseButton}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.newTagContainer}>
              <TextInput
                style={styles.newTagInput}
                placeholder="新しいタグ名"
                value={newTagName}
                onChangeText={setNewTagName}
                onSubmitEditing={handleAddNewTag}
              />
              <TouchableOpacity
                style={styles.addNewTagButton}
                onPress={handleAddNewTag}
              >
                <Text style={styles.addNewTagButtonText}>追加</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.existingTagsLabel}>タグを選択（タップで追加/削除）:</Text>
            <ScrollView style={styles.tagsList}>
              {availableTags.map((tag) => {
                const isSelected = link?.tags.includes(tag.name) || false;
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagItem,
                      isSelected && styles.tagItemSelected,
                    ]}
                    onPress={() => handleToggleTag(tag.name)}
                  >
                    <Text
                      style={[
                        styles.tagItemText,
                        isSelected && styles.tagItemTextSelected,
                      ]}
                    >
                      {tag.name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  errorText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.tertiary,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: 10,
  },
  urlContainer: {
    marginBottom: 15,
  },
  url: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagsLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.text.primary,
  },
  editTagButton: {
    padding: 4,
  },
  editTagButtonText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 5,
    marginBottom: 5,
  },
  tagText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.regular,
  },
  noTagsText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  openLinkButton: {
    backgroundColor: colors.success,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  openLinkButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
  },
  generateSummaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  generateSummaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
  },
  disabledButton: {
    backgroundColor: colors.borderGray,
  },
  disabledButtonText: {
    color: colors.text.tertiary,
  },
  webNotice: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: -15,
    marginBottom: 20,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 10,
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    padding: 16,
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.primary,
  },
  menuItemDangerText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.error,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.borderGray,
  },
  date: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.text.primary,
  },
  modalCloseButton: {
    fontSize: 32,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.tertiary,
    fontWeight: '300',
  },
  newTagContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  newTagInput: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    marginRight: 10,
  },
  addNewTagButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addNewTagButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
  },
  existingTagsLabel: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: 10,
  },
  tagsList: {
    maxHeight: 300,
  },
  tagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  tagItemSelected: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tagItemText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.primary,
  },
  tagItemTextSelected: {
    color: colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  checkmark: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  editFormContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: 8,
    marginTop: 10,
  },
  editInput: {
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    minHeight: 44,
    maxHeight: 120,
  },
  inputHint: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.text.tertiary,
    marginTop: 5,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: colors.success,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
  },
  noteInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    marginTop: 20,
  },
  noteInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  noteInputRow: {
    marginBottom: 10,
  },
  noteInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  addNoteButton: {
    backgroundColor: '#34C759',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNoteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LinkDetailScreen;
