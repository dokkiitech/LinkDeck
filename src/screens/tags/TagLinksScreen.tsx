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
import { RouteProp } from '@react-navigation/native';
import { TagsStackParamList, Link } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getLinksByTag } from '../../services/firestore';
import { colors, spacing, semanticSpacing, textStyles } from '../../theme/tokens';

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
        <ActivityIndicator size="large" color={colors.primary} />
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
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  header: {
    backgroundColor: colors.surface.default,
    padding: spacing.space200,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    alignItems: 'center',
  },
  tagBadge: {
    backgroundColor: colors.primary,
    borderRadius: semanticSpacing.radiusMedium,
    paddingHorizontal: spacing.space200,
    paddingVertical: spacing.space100,
    marginBottom: spacing.space100,
  },
  tagText: {
    color: colors.text.inverse,
    fontSize: textStyles.h3.fontSize,
    fontWeight: textStyles.h3.fontWeight,
  },
  countText: {
    fontSize: textStyles.label.fontSize,
    color: colors.text.subtle,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: semanticSpacing.screenPadding,
  },
  emptyText: {
    fontSize: textStyles.body.fontSize,
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
    color: colors.primary,
    marginBottom: spacing.space75,
  },
  linkDate: {
    fontSize: textStyles.caption.fontSize,
    color: colors.text.subtle,
  },
});

export default TagLinksScreen;
