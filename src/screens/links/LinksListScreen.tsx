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
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinksStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getUserLinks, deleteLink, createLink } from '../../services/firestore';
import { Link } from '../../types';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../constants/messages';
import QRCodeScanner from '../../components/links/QRCodeScanner';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [fabAnimation] = useState(new Animated.Value(0));

  const loadLinks = async () => {
    if (!user) return;

    try {
      const fetchedLinks = await getUserLinks(user.uid, false);
      setLinks(fetchedLinks);
    } catch (error) {
      if (__DEV__) {
        console.error('[LinksList] Error loading links:', error);
      }
      Alert.alert('エラー', ERROR_MESSAGES.LINKS.LOAD_FAILED);
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

  const toggleFabMenu = () => {
    const toValue = showFabMenu ? 0 : 1;
    Animated.spring(fabAnimation, {
      toValue,
      useNativeDriver: true,
      friction: 6,
    }).start();
    setShowFabMenu(!showFabMenu);
  };

  const handleManualAdd = () => {
    setShowFabMenu(false);
    Animated.timing(fabAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    navigation.navigate('AddLink');
  };

  const handleQRScan = () => {
    setShowFabMenu(false);
    Animated.timing(fabAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setShowQRScanner(true);
  };

  const handleQRCodeScanned = (url: string) => {
    setShowQRScanner(false);
    // QRコードから読み取ったURLを持ってAddLink画面に遷移
    navigation.navigate('AddLink', { initialUrl: url } as any);
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
          <Text style={styles.emptyText}>リンクがまだありません</Text>
          <Text style={styles.emptySubtext}>
            右下の「+」ボタンからURLを追加してみましょう
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

      {/* FAB Menu Overlay */}
      {showFabMenu && (
        <TouchableOpacity
          style={styles.fabMenuOverlay}
          activeOpacity={1}
          onPress={toggleFabMenu}
        />
      )}

      {/* FAB Menu Items - QRコード（左上） */}
      {showFabMenu && (
        <Animated.View
          style={[
            styles.fabMenuItem,
            styles.fabMenuItemTopLeft,
            {
              transform: [
                {
                  translateX: fabAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -80],
                  }),
                },
                {
                  translateY: fabAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -80],
                  }),
                },
                {
                  scale: fabAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
              opacity: fabAnimation,
            },
          ]}
        >
          <Text style={styles.fabMenuLabel}>QRコード</Text>
          <TouchableOpacity
            style={styles.fabMenuButton}
            onPress={handleQRScan}
          >
            <Text style={styles.fabMenuIcon}>📷</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* FAB Menu Items - 手動入力（真上） */}
      {showFabMenu && (
        <Animated.View
          style={[
            styles.fabMenuItem,
            styles.fabMenuItemTop,
            {
              transform: [
                {
                  translateY: fabAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -100],
                  }),
                },
                {
                  scale: fabAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
              opacity: fabAnimation,
            },
          ]}
        >
          <Text style={styles.fabMenuLabel}>手動入力</Text>
          <TouchableOpacity
            style={styles.fabMenuButton}
            onPress={handleManualAdd}
          >
            <Text style={styles.fabMenuIcon}>✏️</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, showFabMenu && styles.fabRotated]}
        onPress={toggleFabMenu}
      >
        <Animated.Text
          style={[
            styles.fabText,
            {
              transform: [
                {
                  rotate: fabAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                  }),
                },
              ],
            },
          ]}
        >
          +
        </Animated.Text>
      </TouchableOpacity>

      {/* QR Code Scanner */}
      <QRCodeScanner
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRCodeScanned}
      />
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
    zIndex: 10,
  },
  fabRotated: {
    backgroundColor: '#FF3B30',
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
  fabMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 8,
  },
  fabMenuItem: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    alignItems: 'center',
    zIndex: 9,
  },
  fabMenuItemTop: {
    alignItems: 'center',
  },
  fabMenuItemTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabMenuButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabMenuIcon: {
    fontSize: 24,
  },
  fabMenuLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});

export default LinksListScreen;
