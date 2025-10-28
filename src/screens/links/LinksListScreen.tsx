import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinksStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getUserLinks, deleteLink } from '../../services/firestore';
import { Link } from '../../types';

type LinksListScreenNavigationProp = NativeStackNavigationProp<
  LinksStackParamList,
  'LinksList'
>;

interface Props {
  navigation: LinksListScreenNavigationProp;
}

const LinksListScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLinks = async () => {
    if (!user) return;

    try {
      const fetchedLinks = await getUserLinks(user.uid, showArchived);
      setLinks(fetchedLinks);
    } catch (error) {
      console.error('Error loading links:', error);
      Alert.alert('エラー', 'リンクの読み込みに失敗しました');
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
  }, [user, navigation, showArchived]);

  // ヘッダー右側にアーカイブ切り替えボタンを追加
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowArchived(!showArchived)}
          style={{ marginRight: 15, padding: 8 }}
        >
          <Text style={{ color: '#007AFF', fontSize: 16 }}>
            {showArchived ? 'アクティブ' : 'アーカイブ'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, showArchived]);

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

  // 検索フィルタリング
  const filteredLinks = links.filter((link) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      link.title.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query) ||
      link.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // リンクを日付でグループ化
  const groupLinksByDate = (): { date: string; data: Link[] }[] => {
    const grouped: { [key: string]: Link[] } = {};

    filteredLinks.forEach((link) => {
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
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const sections = groupLinksByDate();

  return (
    <View style={styles.container}>
      {/* 検索バー */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="タイトル、URL、タグで検索..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {links.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {showArchived ? 'アーカイブしたリンクはありません' : 'リンクがまだありません'}
          </Text>
          <Text style={styles.emptySubtext}>
            {showArchived
              ? 'リンクをアーカイブすると、ここに表示されます'
              : '右下の「+」ボタンからURLを追加してみましょう'}
          </Text>
        </View>
      ) : filteredLinks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>検索結果が見つかりません</Text>
          <Text style={styles.emptySubtext}>
            別のキーワードで検索してみてください
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddLink')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 10,
    marginBottom: 5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    padding: 0,
  },
  clearButton: {
    padding: 4,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
});

export default LinksListScreen;
