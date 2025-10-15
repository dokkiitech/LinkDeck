import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinksStackParamList, Link } from '../../types';
import { getLink, updateLink } from '../../services/firestore';

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
  const [link, setLink] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    loadLink();
  }, [linkId]);

  const loadLink = async () => {
    try {
      const fetchedLink = await getLink(linkId);
      setLink(fetchedLink);
    } catch (error) {
      console.error('Error loading link:', error);
      Alert.alert('エラー', 'リンクの読み込みに失敗しました');
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
        Alert.alert('エラー', 'このURLを開くことができません');
      }
    } catch (error) {
      Alert.alert('エラー', 'URLを開く際にエラーが発生しました');
    }
  };

  const handleGenerateSummary = async () => {
    // TODO: Gemini APIとの統合を実装
    Alert.alert(
      '機能準備中',
      'AI要約機能は現在準備中です。設定画面でGemini APIキーを設定してください。'
    );
  };

  const handleToggleArchive = async () => {
    if (!link) return;

    try {
      await updateLink(linkId, { isArchived: !link.isArchived });
      setLink({ ...link, isArchived: !link.isArchived });
      Alert.alert(
        '成功',
        link.isArchived ? 'アーカイブを解除しました' : 'アーカイブしました'
      );
    } catch (error) {
      Alert.alert('エラー', '更新に失敗しました');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
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
      {link.imageUrl && (
        <Image source={{ uri: link.imageUrl }} style={styles.image} />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{link.title}</Text>

        <TouchableOpacity onPress={handleOpenLink} style={styles.urlContainer}>
          <Text style={styles.url}>{link.url}</Text>
        </TouchableOpacity>

        {link.description && (
          <Text style={styles.description}>{link.description}</Text>
        )}

        {link.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>タグ:</Text>
            <View style={styles.tags}>
              {link.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleGenerateSummary}
            disabled={generatingSummary}
          >
            <Text style={styles.actionButtonText}>
              {generatingSummary ? '生成中...' : 'AI要約を生成'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.archiveButton]}
            onPress={handleToggleArchive}
          >
            <Text style={styles.actionButtonText}>
              {link.isArchived ? 'アーカイブを解除' : 'アーカイブ'}
            </Text>
          </TouchableOpacity>
        </View>

        {link.summary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryLabel}>AI要約:</Text>
            <Text style={styles.summaryText}>{link.summary}</Text>
          </View>
        )}

        <Text style={styles.date}>
          保存日時: {link.createdAt.toLocaleString('ja-JP')}
        </Text>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  urlContainer: {
    marginBottom: 15,
  },
  url: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  description: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 20,
    lineHeight: 20,
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  actions: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  archiveButton: {
    backgroundColor: '#8E8E93',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default LinkDetailScreen;
