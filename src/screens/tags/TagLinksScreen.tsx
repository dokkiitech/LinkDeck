import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { TagsStackParamList, Link } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
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
      Alert.alert('エラー', 'リンクの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
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
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.linkImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>画像なし</Text>
        </View>
      )}
      <View style={styles.linkContent}>
        <Text style={styles.linkTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description && (
          <Text style={styles.linkDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
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
        <FlatList
          data={links}
          renderItem={renderLinkItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
  linkImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#8E8E93',
    fontSize: 14,
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
  linkDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
    lineHeight: 20,
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
