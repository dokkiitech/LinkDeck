import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinksStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getUserLinks, deleteLink } from '../../services/firestore';
import { Link } from '../../types';
import { ERROR_MESSAGES } from '../../constants/messages';
import { colors, spacing, semanticSpacing, textStyles } from '../../theme/tokens';

type ArchivedLinksScreenNavigationProp = NativeStackNavigationProp<
  LinksStackParamList,
  'ArchivedLinks'
>;

interface Props {
  navigation: ArchivedLinksScreenNavigationProp;
}

const ArchivedLinksScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLinks = async () => {
    if (!user) return;

    try {
      // アーカイブされたリンクのみ取得
      const allLinks = await getUserLinks(user.uid, true);
      const archivedLinks = allLinks.filter((link) => link.isArchived);
      setLinks(archivedLinks);
    } catch (error) {
      if (__DEV__) {
        console.error('[ArchivedLinks] Error loading archived links:', error);
      }
      Alert.alert('エラー', ERROR_MESSAGES.LINKS.ARCHIVED_LOAD_FAILED);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLinks();

    // 画面に戻ってきたときにリンクを再読み込み
    const unsubscribe = navigation.addListener('focus', () => {
      loadLinks();
    });

    return unsubscribe;
  }, [user, navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLinks();
  };

  // 日付をフォーマット (YYYY年MM月DD日)
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  // リンクを日付でグループ化
  const groupLinksByDate = (): { date: string; data: Link[] }[] => {
    const grouped: { [key: string]: Link[] } = {};

    links.forEach((link) => {
      const dateKey = formatDate(link.createdAt);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(link);
    });

    return Object.keys(grouped).map((date) => ({
      date,
      data: grouped[date],
    }));
  };

  const handleDeleteLink = (linkId: string) => {
    Alert.alert(
      '確認',
      'このリンクを削除しますか?',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLink(linkId);
              setLinks(links.filter((link) => link.id !== linkId));
            } catch (error) {
              Alert.alert('エラー', 'リンクの削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const renderLinkItem = ({ item }: { item: Link }) => (
    <TouchableOpacity
      style={styles.linkItem}
      onPress={() => navigation.navigate('LinkDetail', { linkId: item.id })}
      onLongPress={() => handleDeleteLink(item.id)}
    >
      <View style={styles.linkContent}>
        <Text style={styles.linkTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.linkUrl} numberOfLines={1}>
          {new URL(item.url).hostname}
        </Text>
        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.linkDate}>
          {item.createdAt.toLocaleDateString('ja-JP')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const sections = groupLinksByDate();

  return (
    <View style={styles.container}>
      {links.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>アーカイブしたリンクはありません</Text>
          <Text style={styles.emptySubtext}>
            リンクをアーカイブすると、ここに表示されます
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderLinkItem}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.date}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: semanticSpacing.screenPadding,
  },
  emptyText: {
    fontSize: textStyles.h3.fontSize,
    fontWeight: textStyles.h3.fontWeight,
    color: colors.text.subtle,
    marginBottom: spacing.space150,
  },
  emptySubtext: {
    fontSize: textStyles.label.fontSize,
    color: colors.text.subtle,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.space150,
  },
  sectionHeader: {
    backgroundColor: colors.background.default,
    paddingHorizontal: spacing.space200,
    paddingVertical: spacing.space100,
    marginTop: spacing.space150,
  },
  sectionHeaderText: {
    fontSize: textStyles.h3.fontSize,
    fontWeight: textStyles.h3.fontWeight,
    color: colors.text.default,
  },
  linkItem: {
    backgroundColor: colors.surface.default,
    borderRadius: semanticSpacing.radiusMedium,
    marginBottom: spacing.space150,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.text.default,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  linkContent: {
    padding: spacing.space200,
  },
  linkTitle: {
    fontSize: textStyles.body.fontSize,
    fontWeight: textStyles.bodyBold.fontWeight,
    color: colors.text.default,
    marginBottom: spacing.space75,
  },
  linkUrl: {
    fontSize: textStyles.caption.fontSize,
    color: colors.text.subtle,
    marginBottom: spacing.space150,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.space150,
  },
  tag: {
    backgroundColor: colors.primary,
    borderRadius: semanticSpacing.radiusMedium,
    paddingHorizontal: spacing.space150,
    paddingVertical: spacing.space75,
    marginRight: spacing.space75,
    marginBottom: spacing.space75,
  },
  tagText: {
    color: colors.text.inverse,
    fontSize: textStyles.caption.fontSize,
  },
  linkDate: {
    fontSize: textStyles.caption.fontSize,
    color: colors.text.subtle,
  },
});

export default ArchivedLinksScreen;
