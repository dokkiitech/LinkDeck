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
import { RouteProp } from '@react-navigation/native';
import { TagsStackParamList, Link } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { getLinksByTag } from '../../services/firestore';

type TagLinksScreenNavigationProp = NativeStackNavigationProp<
  TagsStackParamList,
  'TagLinks'
>;

type TagLinksScreenRouteProp = RouteProp<TagsStackParamList, 'TagLinks'>;

interface Props {
  navigation: TagLinksScreenNavigationProp;
  route: TagLinksScreenRouteProp;
}

const TagLinksScreen: React.FC<Props> = ({ navigation, route }) => {
  const { tagName } = route.params;
  const { user } = useAuth();
  const { showError, showSuccess, showConfirm } = useDialog();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLinks();
  }, [tagName]);

  const loadLinks = async () => {
    if (!user) return;

    try {
      const fetchedLinks = await getLinksByTag(user.uid, tagName);
      setLinks(fetchedLinks);
    } catch (error) {
      console.error('Error loading links by tag:', error);
      showError('エラー', 'リンクの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
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

  const renderLinkItem = ({ item }: { item: Link }) => (
    <TouchableOpacity
      style={styles.linkItem}
      onPress={() => {
        // LinksスタックのLinkDetail画面に遷移
        (navigation as any).navigate('Links', {
          screen: 'LinkDetail',
          params: { linkId: item.id },
        });
      }}
    >
      <View style={styles.linkContent}>
        <Text style={styles.linkTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.linkUrl} numberOfLines={1}>
          {item.url}
        </Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{tagName}</Text>
        </View>
        <Text style={styles.countText}>{links.length}件のリンク</Text>
      </View>

      {links.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            このタグが付いたリンクはありません
          </Text>
        </View>
      ) : (
        <SectionList
          sections={groupLinksByDate()}
          renderItem={renderLinkItem}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.date}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center',
  },
  tagBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  countText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
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
    color: '#007AFF',
    marginBottom: 5,
  },
  linkDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default TagLinksScreen;
