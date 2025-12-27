import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinksStackParamList, Link } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getGeminiApiKey } from '../../utils/storage';
import { searchWithAgent, getSearchQuerySuggestions } from '../../services/agentSearch';
import { ERROR_MESSAGES } from '../../constants/messages';

type AgentSearchScreenNavigationProp = NativeStackNavigationProp<
  LinksStackParamList,
  'AgentSearch'
>;

interface Props {
  navigation: AgentSearchScreenNavigationProp;
}

const AgentSearchScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingApiKey, setCheckingApiKey] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Link[]>([]);
  const [explanation, setExplanation] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Gemini APIキーの確認
  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const apiKey = await getGeminiApiKey();
      setHasApiKey(!!apiKey);
    } catch (error) {
      setHasApiKey(false);
    } finally {
      setCheckingApiKey(false);
    }
  };

  // 検索実行
  const handleSearch = async () => {
    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    if (!searchQuery.trim()) {
      Alert.alert('エラー', '検索クエリを入力してください');
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        Alert.alert('エラー', 'Gemini APIキーが設定されていません');
        return;
      }

      const result = await searchWithAgent(apiKey, user.uid, searchQuery);
      setSearchResults(result.links);
      setExplanation(result.explanation);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[AgentSearch] Error:', error);
      }
      Alert.alert('検索エラー', error.message || ERROR_MESSAGES.GEMINI.SUMMARY_FAILED);
      setSearchResults([]);
      setExplanation('');
    } finally {
      setSearching(false);
    }
  };

  // クエリ提案をタップ
  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
  };

  // リンクをタップ
  const handleLinkPress = (link: Link) => {
    navigation.navigate('LinkDetail', { linkId: link.id });
  };

  // URLを開く
  const handleOpenUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('エラー', 'このURLを開けません');
      }
    } catch (error) {
      Alert.alert('エラー', 'URLを開く際にエラーが発生しました');
    }
  };

  // APIキーが設定されていない場合
  if (checkingApiKey) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (!hasApiKey) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AIエージェント検索</Text>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="key-outline" size={80} color="#ccc" />
          <Text style={styles.noApiKeyTitle}>Gemini APIキーが必要です</Text>
          <Text style={styles.noApiKeyDescription}>
            AIエージェント検索を使用するには、設定画面でGemini APIキーを登録してください。
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('LinksList')}
          >
            <Ionicons name="settings-outline" size={20} color="#fff" />
            <Text style={styles.settingsButtonText}>設定画面へ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // メイン画面
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AIエージェント検索</Text>
        <Text style={styles.headerSubtitle}>
          ざっくりとした記憶からリンクを探せます
        </Text>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* 検索入力エリア */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="例: 3月くらいにReactについて調べた気がする"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
          <TouchableOpacity
            style={[styles.searchButton, searching && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={styles.searchButtonText}>検索</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* クエリ提案 */}
        {!hasSearched && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>検索例:</Text>
            {getSearchQuerySuggestions().map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 検索結果 */}
        {hasSearched && (
          <View style={styles.resultsSection}>
            {/* エージェントの説明 */}
            {explanation && (
              <View style={styles.explanationContainer}>
                <Ionicons name="information-circle" size={20} color="#007AFF" />
                <Text style={styles.explanationText}>{explanation}</Text>
              </View>
            )}

            {/* 結果リスト */}
            {searchResults.length > 0 ? (
              <View style={styles.resultsList}>
                <Text style={styles.resultsHeader}>
                  {searchResults.length}件のリンクが見つかりました
                </Text>
                {searchResults.map((link) => (
                  <TouchableOpacity
                    key={link.id}
                    style={styles.linkCard}
                    onPress={() => handleLinkPress(link)}
                  >
                    <View style={styles.linkHeader}>
                      <Text style={styles.linkTitle} numberOfLines={2}>
                        {link.title}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleOpenUrl(link.url)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="open-outline" size={20} color="#007AFF" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.linkUrl} numberOfLines={1}>
                      {link.url}
                    </Text>
                    <View style={styles.linkMeta}>
                      <Text style={styles.linkDate}>
                        {new Date(link.createdAt).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                      {link.tags.length > 0 && (
                        <View style={styles.linkTags}>
                          {link.tags.slice(0, 3).map((tag, index) => (
                            <View key={index} style={styles.tag}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="sad-outline" size={60} color="#ccc" />
                <Text style={styles.noResultsText}>
                  該当するリンクが見つかりませんでした
                </Text>
                <Text style={styles.noResultsHint}>
                  別のキーワードで検索してみてください
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  noApiKeyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  noApiKeyDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    minHeight: 60,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  suggestionChip: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  resultsSection: {
    flex: 1,
  },
  explanationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    gap: 12,
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    color: '#0D47A1',
    lineHeight: 20,
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  linkCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  linkTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  linkUrl: {
    fontSize: 13,
    color: '#007AFF',
    marginBottom: 8,
  },
  linkMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkDate: {
    fontSize: 12,
    color: '#999',
  },
  linkTags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#0D47A1',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  noResultsHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default AgentSearchScreen;
