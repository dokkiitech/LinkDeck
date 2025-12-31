import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinksStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { getUserLinks, deleteLink } from '../../services/firestore';
import { Link } from '../../types';
import { ERROR_MESSAGES } from '../../constants/messages';

type ArchivedLinksScreenNavigationProp = NativeStackNavigationProp<
  LinksStackParamList,
  'ArchivedLinks'
>;

interface Props {
  navigation: ArchivedLinksScreenNavigationProp;
}

const ArchivedLinksScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { showError, showSuccess, showConfirm } = useDialog();
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
      showError('エラー', ERROR_MESSAGES.LINKS.ARCHIVED_LOAD_FAILED);
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
    showConfirm(
      '確認',
      'このリンクを削除しますか?',
      async () => {
        try {
          await deleteLink(linkId);
          setLinks(links.filter((link) => link.id !== linkId));
        } catch (error) {
          showError('エラー', 'リンクの削除に失敗しました');
        }
      }
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
        <ActivityIndicator size="large" color="#007AFF" />
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
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  listContent: {
    padding: 10,
  },
  sectionHeader: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginTop: 10,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  linkItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  linkContent: {
    padding: 15,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 5,
  },
  linkUrl: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 5,
    marginBottom: 5,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  linkDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default ArchivedLinksScreen;
