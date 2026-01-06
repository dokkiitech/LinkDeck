import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Linking,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AgentStackParamList, MainTabParamList, Link } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { getGeminiApiKey } from '../../utils/storage';
import { searchWithAgentStream, getSearchQuerySuggestions, ConversationMessage } from '../../services/agentSearch';
import { getUserLinks, createLink, checkLinkExists } from '../../services/firestore';
import { fetchUrlTitle } from '../../utils/urlMetadata';
import { ERROR_MESSAGES } from '../../constants/messages';

type AgentSearchScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<AgentStackParamList, 'AgentSearch'>,
  BottomTabNavigationProp<MainTabParamList>
>;

interface Props {
  navigation: AgentSearchScreenNavigationProp;
}

const AgentSearchScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { showError, showConfirm, showSuccess } = useDialog();
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingApiKey, setCheckingApiKey] = useState(true);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userLinks, setUserLinks] = useState<Link[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [onlineSearchEnabled, setOnlineSearchEnabled] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Gemini APIキーとユーザーリンクの確認
  useEffect(() => {
    checkApiKey();
    loadUserLinks();

    // 画面に戻ってきたときにリンクを再読み込み（検索例を更新）
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserLinks();
    });

    return unsubscribe;
  }, [navigation]);

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

  const loadUserLinks = async () => {
    if (!user) return;

    try {
      const links = await getUserLinks(user.uid, false);
      setUserLinks(links);
    } catch (error) {
      if (__DEV__) {
        console.error('[AgentSearch] Error loading links:', error);
      }
      setUserLinks([]);
    } finally {
      setLoadingLinks(false);
    }
  };

  // セッションをリセット
  const handleResetSession = () => {
    showConfirm(
      '新しいセッションを開始',
      '会話履歴をクリアして新しいセッションを開始しますか？',
      () => {
        setMessages([]);
        setInputText('');
      }
    );
  };

  // メッセージを送信
  const handleSendMessage = async () => {
    if (!user) {
      showError('エラー', 'ログインが必要です');
      return;
    }

    if (!inputText.trim()) {
      return;
    }

    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const queryText = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    // メッセージ追加後にスクロール
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        showError('エラー', 'Gemini APIキーが設定されていません');
        setIsProcessing(false);
        return;
      }

      // 会話履歴から直近のメッセージを取得（最大10件）
      const recentHistory = messages.slice(-10);

      const result = await searchWithAgentStream(
        apiKey,
        user.uid,
        queryText,
        recentHistory,
        onlineSearchEnabled
      );

      // 結果をアシスタントメッセージとして追加
      const assistantMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.explanation,
        links: result.links,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // 最終スクロール
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[AgentSearch] Error:', error);
      }

      // エラーメッセージを安全に取得
      const errorMessage = error?.message || ERROR_MESSAGES.GEMINI.GENERIC_ERROR;

      showError('検索エラー', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // クエリ提案をタップ
  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
  };

  // リンクをタップ（URLを直接開く）
  const handleLinkPress = (link: Link) => {
    handleOpenUrl(link.url);
  };

  // URLを開く
  const handleOpenUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showError('エラー', 'このURLを開けません');
      }
    } catch (error) {
      showError('エラー', 'URLを開く際にエラーが発生しました');
    }
  };

  // リンクを保存
  const handleSaveLink = async (url: string) => {
    if (!user) {
      showError('エラー', 'ログインが必要です');
      return;
    }

    try {
      // 既に保存されているかチェック
      const exists = await checkLinkExists(user.uid, url);
      if (exists) {
        showError('リンク保存', 'このリンクは既に保存されています');
        return;
      }

      // タイトルを自動取得
      const title = await fetchUrlTitle(url);
      const linkTitle = title || new URL(url).hostname;

      // リンクを保存
      await createLink(user.uid, url, linkTitle, []);

      showSuccess('リンク保存完了', `「${linkTitle}」を保存しました`);

      // リンクリストを再読み込み（検索結果に反映されるように）
      loadUserLinks();
    } catch (error: any) {
      if (__DEV__) {
        console.error('[AgentSearch] Error saving link:', error);
      }
      showError('保存エラー', error?.message || 'リンクの保存に失敗しました');
    }
  };

  // テキストからURLを抽出
  const extractURLsFromText = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    if (!matches) return [];

    // 末尾の句読点を削除して重複を排除
    const cleanedUrls = matches.map((url) => url.replace(/[.,;:!?)]+$/, ''));
    return Array.from(new Set(cleanedUrls));
  };

  // テキスト内のURLをクリック可能なリンクとしてレンダリング
  const renderTextWithLinks = (text: string) => {
    // URLを検出する正規表現
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
      <Text style={styles.assistantMessageText}>
        {parts.map((part, index) => {
          if (part.match(urlRegex)) {
            // URLの場合はクリック可能に
            return (
              <Text
                key={index}
                style={styles.linkTextInMessage}
                onPress={() => handleOpenUrl(part)}
              >
                {part}
              </Text>
            );
          } else {
            // 通常のテキスト
            return <Text key={index}>{part}</Text>;
          }
        })}
      </Text>
    );
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
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={20} color="#fff" />
            <Text style={styles.settingsButtonText}>設定画面へ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 思考中インジケーター
  const ThinkingIndicator = () => {
    const dot1Opacity = useRef(new Animated.Value(0.3)).current;
    const dot2Opacity = useRef(new Animated.Value(0.3)).current;
    const dot3Opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
      const animate = () => {
        Animated.sequence([
          Animated.timing(dot1Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Opacity, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();

        setTimeout(() => {
          Animated.sequence([
            Animated.timing(dot2Opacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Opacity, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start();
        }, 200);

        setTimeout(() => {
          Animated.sequence([
            Animated.timing(dot3Opacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot3Opacity, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start();
        }, 400);
      };

      animate();
      const interval = setInterval(animate, 1200);

      return () => clearInterval(interval);
    }, []);

    return (
      <View style={styles.assistantMessageContainer}>
        <View style={styles.assistantMessageBubble}>
          <View style={styles.thinkingContainer}>
            <Animated.View style={[styles.thinkingDot, { opacity: dot1Opacity }]} />
            <Animated.View style={[styles.thinkingDot, { opacity: dot2Opacity }]} />
            <Animated.View style={[styles.thinkingDot, { opacity: dot3Opacity }]} />
          </View>
        </View>
      </View>
    );
  };

  // メッセージアイテムのレンダリング
  const renderMessage = ({ item }: { item: ConversationMessage }) => {
    if (item.role === 'user') {
      return (
        <View style={styles.userMessageContainer}>
          <View style={styles.userMessageBubble}>
            <Text style={styles.userMessageText}>{item.content}</Text>
          </View>
        </View>
      );
    } else {
      // テキストから新しいURLを抽出（保存済みリンクのURLは除外）
      const extractedUrls = extractURLsFromText(item.content);
      const savedLinkUrls = item.links?.map((link) => link.url) || [];
      const newUrls = extractedUrls.filter((url) => !savedLinkUrls.includes(url));

      return (
        <View style={styles.assistantMessageContainer}>
          <View style={styles.assistantMessageBubble}>
            {renderTextWithLinks(item.content)}
            {item.links && item.links.length > 0 && (
              <View style={styles.linksContainer}>
                <Text style={styles.linksHeader}>
                  {item.links.length}件の保存済みリンク
                </Text>
                {item.links.map((link) => (
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
                        <Ionicons name="open-outline" size={18} color="#007AFF" />
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
            )}
            {newUrls.length > 0 && (
              <View style={styles.linksContainer}>
                <Text style={styles.linksHeader}>
                  {newUrls.length}件の見つかったリンク
                </Text>
                {newUrls.map((url, index) => (
                  <View key={index} style={styles.newLinkCard}>
                    <View style={styles.newLinkContent}>
                      <Text style={styles.newLinkUrl} numberOfLines={2}>
                        {url}
                      </Text>
                      <View style={styles.newLinkActions}>
                        <TouchableOpacity
                          style={styles.openLinkButton}
                          onPress={() => handleOpenUrl(url)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="open-outline" size={18} color="#666" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.saveLinkButton}
                          onPress={() => handleSaveLink(url)}
                        >
                          <Ionicons name="bookmark-outline" size={16} color="#fff" />
                          <Text style={styles.saveLinkButtonText}>保存</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      );
    }
  };

  // メイン画面
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>AIエージェント</Text>
          <Text style={styles.headerSubtitle}>
            会話しながらリンクを探せます
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.toggleContainer}>
            <Ionicons
              name="globe-outline"
              size={16}
              color={onlineSearchEnabled ? '#007AFF' : '#999'}
              style={styles.toggleIcon}
            />
            <Switch
              value={onlineSearchEnabled}
              onValueChange={setOnlineSearchEnabled}
              trackColor={{ false: '#d0d0d0', true: '#007AFF80' }}
              thumbColor={onlineSearchEnabled ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#d0d0d0"
            />
          </View>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetSession}
          >
            <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* メッセージリスト */}
        {messages.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
            <Text style={styles.emptyStateTitle}>会話を始めましょう</Text>
            <Text style={styles.emptyStateDescription}>
              保存したリンクについて、自然な言葉で質問できます
            </Text>
            {!loadingLinks && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.suggestionsTitle}>質問の例:</Text>
                {getSearchQuerySuggestions(userLinks).map((suggestion, index) => (
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
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />
            {isProcessing && (
              <View style={styles.thinkingIndicatorWrapper}>
                <ThinkingIndicator />
              </View>
            )}
          </>
        )}

        {/* 入力エリア */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="メッセージを入力..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isProcessing}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isProcessing) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleIcon: {
    marginRight: 2,
  },
  resetButton: {
    padding: 4,
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
  chatContainer: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  suggestionsSection: {
    marginTop: 24,
    width: '100%',
    paddingHorizontal: 20,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  suggestionChip: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  userMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  userMessageBubble: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  assistantMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  assistantMessageBubble: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  assistantMessageText: {
    color: '#333',
    fontSize: 15,
    lineHeight: 20,
  },
  linkTextInMessage: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  linksContainer: {
    marginTop: 12,
  },
  linksHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  linkCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  linkTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  linkUrl: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 6,
  },
  linkMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkDate: {
    fontSize: 11,
    color: '#999',
  },
  linkTags: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    color: '#0D47A1',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  thinkingIndicatorWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
  newLinkCard: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  newLinkContent: {
    flexDirection: 'column',
    gap: 10,
  },
  newLinkUrl: {
    fontSize: 13,
    color: '#007AFF',
    lineHeight: 18,
  },
  newLinkActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  openLinkButton: {
    padding: 6,
  },
  saveLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  saveLinkButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default AgentSearchScreen;
