import { GoogleGenerativeAI } from '@google/generative-ai';
import { Link } from '../types';
import { getUserLinks } from './firestore';
import { ERROR_MESSAGES } from '../constants/messages';
import { searchWeb, WebSearchResult } from './webSearch';

/**
 * Gemini APIのエラーを解析してユーザーフレンドリーなメッセージを返す
 */
const parseGeminiError = (error: any): string => {
  // エラーオブジェクトが存在しない場合
  if (!error) {
    return ERROR_MESSAGES.GEMINI.GENERIC_ERROR;
  }

  // エラーメッセージを安全に取得
  const errorMessage = error?.message || error?.toString() || '';
  const errorString = errorMessage.toLowerCase();

  // クォータ超過エラー
  if (
    errorString.includes('quota') ||
    errorString.includes('resource_exhausted') ||
    errorString.includes('429') ||
    errorString.includes('rate limit')
  ) {
    return ERROR_MESSAGES.GEMINI.QUOTA_EXCEEDED;
  }

  // 無効なAPIキーエラー
  if (
    errorString.includes('api key') ||
    errorString.includes('api_key') ||
    errorString.includes('invalid_argument') ||
    errorString.includes('401') ||
    errorString.includes('403')
  ) {
    return ERROR_MESSAGES.GEMINI.INVALID_API_KEY;
  }

  // ネットワークエラー
  if (
    errorString.includes('network') ||
    errorString.includes('fetch') ||
    errorString.includes('connection') ||
    errorString.includes('timeout')
  ) {
    return ERROR_MESSAGES.GEMINI.NETWORK_ERROR;
  }

  // デフォルトのエラーメッセージ
  return ERROR_MESSAGES.GEMINI.GENERIC_ERROR;
};

/**
 * 会話メッセージの型
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  links?: Link[];
  webResults?: WebSearchResult[]; // Web検索結果
  timestamp: number;
  isStreaming?: boolean; // ストリーミング中かどうか
}

/**
 * エージェント検索結果の型
 */
export interface AgentSearchResult {
  links: Link[];
  webResults?: WebSearchResult[]; // Web検索結果
  explanation: string;
}

/**
 * ストリーミングコールバックの型
 */
export type StreamCallback = (chunk: string) => void;

/**
 * Gemini AIエージェントを使って自然言語クエリでリンクを検索する
 * @param apiKey ユーザーのGemini APIキー
 * @param userId ユーザーID
 * @param query 自然言語の検索クエリ（例: "3月くらいにReactについて調べた気がする"）
 * @param conversationHistory 会話履歴（省略可）
 * @returns 検索結果とエージェントの説明
 */
export const searchWithAgent = async (
  apiKey: string,
  userId: string,
  query: string,
  conversationHistory: ConversationMessage[] = []
): Promise<AgentSearchResult> => {
  try {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('APIキーが設定されていません');
    }

    if (!query || query.trim() === '') {
      throw new Error('検索クエリを入力してください');
    }

    // ユーザーのすべてのリンクを取得（アーカイブ含む）
    const allLinks = await getUserLinks(userId, true);

    if (allLinks.length === 0) {
      return {
        links: [],
        explanation: '保存されているリンクがまだありません。',
      };
    }

    // Gemini APIクライアントの初期化
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    // リンクデータをJSON形式で整形
    const linksData = allLinks.map((link, index) => ({
      index,
      id: link.id,
      title: link.title,
      url: link.url,
      tags: link.tags,
      createdAt: link.createdAt.toISOString(),
      isArchived: link.isArchived,
      summary: link.summary,
      notes: link.timeline?.filter(entry => entry.type === 'note').map(entry => ({
        content: entry.content,
        createdAt: entry.createdAt.toISOString(),
      })),
    }));

    // 会話履歴の整形
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = '\n\n過去の会話履歴:\n';
      conversationHistory.forEach((msg) => {
        if (msg.role === 'user') {
          conversationContext += `ユーザー: ${msg.content}\n`;
        } else {
          conversationContext += `アシスタント: ${msg.content}\n`;
          if (msg.links && msg.links.length > 0) {
            conversationContext += `  (${msg.links.length}件のリンクを提示)\n`;
          }
        }
      });
    }

    // プロンプトの作成
    const prompt = `あなたは、ユーザーが保存したリンク集から関連する情報を検索するAIアシスタントです。
会話の文脈を理解して、適切に応答してください。${conversationContext}

ユーザーの検索クエリ:
${query}

ユーザーが保存しているリンク一覧（JSON形式）:
${JSON.stringify(linksData, null, 2)}

指示:
1. ユーザーの検索クエリを分析し、関連性の高いリンクを見つけてください
2. タイトル、URL、タグだけでなく、AI要約（summary）やユーザーが追加したメモ（notes）の内容も検索対象に含めてください
3. 会話の文脈を考慮してください（例: 「それ」「前回の」などの指示代名詞を理解）
4. 日付の表現（"3月くらい"、"最近"、"去年"など）も考慮してください
5. キーワードだけでなく、文脈や意図も理解してください
6. 見つかったリンクのindexを配列で返してください
7. 検索結果について日本語で簡潔な説明を付けてください

回答は必ず以下のJSON形式で返してください:
{
  "matchedIndexes": [0, 3, 5],
  "explanation": "◯月に保存された◯◯に関するリンクを◯件見つけました。"
}

見つからない場合は:
{
  "matchedIndexes": [],
  "explanation": "該当するリンクが見つかりませんでした。"
}`;

    // エージェントに検索を依頼
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // JSON部分を抽出
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('エージェントからの応答を解析できませんでした');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]) as {
      matchedIndexes: number[];
      explanation: string;
    };

    // マッチしたリンクを取得
    const matchedLinks = parsedResponse.matchedIndexes
      .filter((index) => index >= 0 && index < allLinks.length)
      .map((index) => allLinks[index]);

    return {
      links: matchedLinks,
      explanation: parsedResponse.explanation || '検索が完了しました。',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('[AgentSearch] Error:', error);
    }

    // JSONパースエラーの場合
    if (error instanceof SyntaxError) {
      throw new Error('検索結果の解析に失敗しました。もう一度お試しください。');
    }

    // エラーメッセージを安全に取得
    const errorMessage = error?.message || '';

    // すでにパース済みのGeminiエラーメッセージの場合はそのまま使う
    if (errorMessage && Object.values(ERROR_MESSAGES.GEMINI).includes(errorMessage)) {
      throw error;
    }

    // その他のエラーはパースして返す
    const userFriendlyMessage = parseGeminiError(error);
    throw new Error(userFriendlyMessage);
  }
};

/**
 * 検索クエリの提案を生成（ユーザーのリンクデータに基づく）
 * @param links ユーザーの保存リンク
 * @returns クエリの例の配列
 */
export const getSearchQuerySuggestions = (links: Link[]): string[] => {
  // リンクがない場合はデフォルトの例を返す
  if (links.length === 0) {
    return [
      'リンクを保存すると、ここに検索例が表示されます',
    ];
  }

  const suggestions: string[] = [];

  // タグの抽出（使用頻度が高い順）
  const tagCounts = new Map<string, number>();
  links.forEach((link) => {
    link.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  // 月の抽出（最近の3ヶ月）
  const monthCounts = new Map<string, number>();
  links.forEach((link) => {
    const date = new Date(link.createdAt);
    const monthKey = `${date.getFullYear()}/${date.getMonth() + 1}`;
    monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
  });
  const recentMonths = Array.from(monthCounts.entries())
    .sort((a, b) => {
      const [yearA, monthA] = a[0].split('/').map(Number);
      const [yearB, monthB] = b[0].split('/').map(Number);
      return yearB * 12 + monthB - (yearA * 12 + monthA);
    })
    .slice(0, 3)
    .map(([month]) => {
      const [year, monthNum] = month.split('/').map(Number);
      return `${monthNum}月`;
    });

  // 1. タグベースの検索例
  if (topTags.length > 0) {
    suggestions.push(`${topTags[0]}に関する記事`);
    if (topTags.length > 1) {
      suggestions.push(`${topTags[1]}について調べたやつ`);
    }
  }

  // 2. 時期ベースの検索例
  if (recentMonths.length > 0) {
    suggestions.push(`${recentMonths[0]}に保存したリンク`);
    if (recentMonths.length > 1 && topTags.length > 0) {
      suggestions.push(`${recentMonths[1]}くらいに${topTags[0]}について見た気がする`);
    }
  }

  // 3. 最近の保存
  const recentLink = links[0];
  if (recentLink && recentLink.tags.length > 0) {
    suggestions.push(`最近保存した${recentLink.tags[0]}の記事`);
  } else {
    suggestions.push('最近保存した記事');
  }

  // 提案が少ない場合は汎用的な例を追加
  if (suggestions.length < 3) {
    const genericSuggestions = [
      'タイトルに「チュートリアル」が含まれるリンク',
      '先週保存したやつ',
      'ドキュメント系のリンク',
    ];
    suggestions.push(...genericSuggestions.slice(0, 5 - suggestions.length));
  }

  return suggestions.slice(0, 5);
};

/**
 * Gemini AIエージェントを使って自然言語クエリでリンクを検索する
 * @param apiKey ユーザーのGemini APIキー
 * @param userId ユーザーID
 * @param query 自然言語の検索クエリ
 * @param conversationHistory 会話履歴（省略可）
 * @param onlineSearchEnabled オンライン検索を有効にするか
 * @returns 検索結果とエージェントの説明
 */
export const searchWithAgentStream = async (
  apiKey: string,
  userId: string,
  query: string,
  conversationHistory: ConversationMessage[] = [],
  onlineSearchEnabled: boolean = false
): Promise<AgentSearchResult> => {
  try {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('APIキーが設定されていません');
    }

    if (!query || query.trim() === '') {
      throw new Error('検索クエリを入力してください');
    }

    // ユーザーのすべてのリンクを取得（アーカイブ含む）
    const allLinks = await getUserLinks(userId, true);

    // リンクデータをJSON形式で整形
    const linksData = allLinks.map((link, index) => ({
      index,
      id: link.id,
      title: link.title,
      url: link.url,
      tags: link.tags,
      createdAt: link.createdAt.toISOString(),
      isArchived: link.isArchived,
      summary: link.summary,
      notes: link.timeline?.filter(entry => entry.type === 'note').map(entry => ({
        content: entry.content,
        createdAt: entry.createdAt.toISOString(),
      })),
    }));

    // Web検索を実行（オンライン検索有効時）
    let webSearchResults: WebSearchResult[] = [];
    if (onlineSearchEnabled) {
      try {
        webSearchResults = await searchWeb(query, 10);
        if (__DEV__) {
          console.log(`[AgentSearch] Web search found ${webSearchResults.length} results`);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[AgentSearch] Web search failed:', error);
        }
        // Web検索失敗時も続行
      }
    }

    // Web検索結果をJSON形式で整形
    const webSearchData = webSearchResults.map((result, index) => ({
      index,
      title: result.title,
      url: result.url,
      snippet: result.snippet,
    }));

    // 会話履歴の整形
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = '\n\n過去の会話履歴:\n';
      conversationHistory.forEach((msg) => {
        if (msg.role === 'user') {
          conversationContext += `ユーザー: ${msg.content}\n`;
        } else {
          conversationContext += `アシスタント: ${msg.content}\n`;
          if (msg.links && msg.links.length > 0) {
            conversationContext += `  (${msg.links.length}件のリンクを提示)\n`;
          }
        }
      });
    }

    // プロンプトの作成
    let prompt: string;

    if (onlineSearchEnabled) {
      // オンライン検索有効時: Web検索結果と保存リンクを組み合わせる
      const hasWebResults = webSearchResults.length > 0;
      const hasLinks = allLinks.length > 0;

      if (!hasLinks && !hasWebResults) {
        // リンクもWeb検索結果もない場合
        prompt = `あなたは親切なAIアシスタントです。ユーザーの質問に対して、適切に回答してください。${conversationContext}

ユーザーの質問:
${query}

指示:
1. ユーザーの質問を分析し、適切に回答してください
2. 会話の文脈を考慮してください（例: 「それ」「前回の」などの指示代名詞を理解）
3. 正確で役立つ情報を提供してください
4. 簡潔で分かりやすい日本語で回答してください
5. マークダウン形式（**太字**、*斜体*、見出し記号など）を使わず、プレーンテキストのみで回答してください

回答は必ず以下のJSON形式で返してください:
{
  "matchedIndexes": [],
  "matchedWebIndexes": [],
  "explanation": "ユーザーの質問に対する回答をここに記載"
}`;
      } else if (!hasLinks && hasWebResults) {
        // Web検索結果のみの場合
        prompt = `あなたは、Web検索結果から関連する情報を見つけて回答するAIアシスタントです。${conversationContext}

ユーザーの質問:
${query}

Web検索結果（JSON形式）:
${JSON.stringify(webSearchData, null, 2)}

指示:
1. ユーザーの質問を分析し、Web検索結果から関連する情報を見つけてください
2. 関連するWeb検索結果があれば、そのindex番号を matchedWebIndexes 配列に含めてください
3. Web検索結果のタイトル、URL、スニペットを参考にしてください
4. 検索結果を基に、簡潔で分かりやすい回答を作成してください
5. 参考にしたURLがあれば、回答文に含めてください（例: https://example.com を参考にすると...）
6. マークダウン形式を使わず、プレーンテキストのみで回答してください

回答は必ず以下のJSON形式で返してください:
{
  "matchedIndexes": [],
  "matchedWebIndexes": [0, 2, 5],
  "explanation": "Web検索結果を基にした回答。参考URL: https://example.com"
}`;
      } else {
        // 保存リンクとWeb検索結果の両方がある場合
        prompt = `あなたは、ユーザーが保存したリンクとWeb検索結果から関連する情報を見つけて回答するAIアシスタントです。${conversationContext}

ユーザーの質問:
${query}

ユーザーが保存しているリンク一覧（JSON形式）:
${JSON.stringify(linksData, null, 2)}

${hasWebResults ? `Web検索結果（JSON形式）:\n${JSON.stringify(webSearchData, null, 2)}` : ''}

指示:
1. ユーザーの質問を分析してください
2. 保存されているリンクの中に関連するものがあれば、そのindex番号を matchedIndexes 配列に含めてください
3. Web検索結果の中に関連するものがあれば、そのindex番号を matchedWebIndexes 配列に含めてください
4. タイトル、URL、タグ、AI要約（summary）、メモ（notes）、スニペットなど、すべての情報を検索対象に含めてください
5. 保存リンクとWeb検索結果の両方を活用して、最適な回答を作成してください
6. 参考にしたWebのURLがあれば、回答文に含めてください（例: https://example.com によると...）
7. 会話の文脈を考慮してください
8. マークダウン形式を使わず、プレーンテキストのみで回答してください

回答は必ず以下のJSON形式で返してください:
{
  "matchedIndexes": [0, 3],
  "matchedWebIndexes": [1, 5],
  "explanation": "保存リンクとWeb検索結果を組み合わせた回答"
}`;
      }
    } else {
      // オンライン検索無効時: 保存リンクのみを検索
      if (allLinks.length === 0) {
        return {
          links: [],
          explanation: '保存されているリンクがまだありません。',
        };
      }

      prompt = `あなたは、ユーザーが保存したリンク集から関連する情報を検索するAIアシスタントです。
会話の文脈を理解して、適切に応答してください。${conversationContext}

ユーザーの検索クエリ:
${query}

ユーザーが保存しているリンク一覧（JSON形式）:
${JSON.stringify(linksData, null, 2)}

指示:
1. ユーザーの検索クエリを分析し、関連性の高いリンクを見つけてください
2. タイトル、URL、タグだけでなく、AI要約（summary）やユーザーが追加したメモ（notes）の内容も検索対象に含めてください
3. 会話の文脈を考慮してください（例: 「それ」「前回の」などの指示代名詞を理解）
4. 日付の表現（"3月くらい"、"最近"、"去年"など）も考慮してください
5. キーワードだけでなく、文脈や意図も理解してください
6. 見つかったリンクのindexを配列で返してください
7. 検索結果について日本語で簡潔な説明を付けてください
8. マークダウン形式（**太字**、*斜体*、見出し記号など）を使わず、プレーンテキストのみで回答してください
9. 説明文（explanation）にindex番号（例：「index 8」）を含めないでください

回答は必ず以下のJSON形式で返してください:
{
  "matchedIndexes": [0, 3, 5],
  "matchedWebIndexes": [],
  "explanation": "◯月に保存された◯◯に関するリンクを◯件見つけました。"
}

見つからない場合は:
{
  "matchedIndexes": [],
  "matchedWebIndexes": [],
  "explanation": "該当するリンクが見つかりませんでした。"
}`;
    }

    // ユーザーのAPIキーで生成（非ストリーミング）
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const fullText = response.text();

    // JSON部分を抽出
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('エージェントからの応答を解析できませんでした');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]) as {
      matchedIndexes: number[];
      matchedWebIndexes?: number[];
      explanation: string;
    };

    // マッチしたリンクを取得
    const matchedLinks = parsedResponse.matchedIndexes
      .filter((index) => index >= 0 && index < allLinks.length)
      .map((index) => allLinks[index]);

    // マッチしたWeb検索結果を取得
    const matchedWebResults = (parsedResponse.matchedWebIndexes || [])
      .filter((index) => index >= 0 && index < webSearchResults.length)
      .map((index) => webSearchResults[index]);

    return {
      links: matchedLinks,
      webResults: matchedWebResults.length > 0 ? matchedWebResults : undefined,
      explanation: parsedResponse.explanation || '検索が完了しました。',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('[AgentSearch] Error:', error);
    }

    // JSONパースエラーの場合
    if (error instanceof SyntaxError) {
      throw new Error('検索結果の解析に失敗しました。もう一度お試しください。');
    }

    // エラーメッセージを安全に取得
    const errorMessage = error?.message || '';

    // すでにパース済みのGeminiエラーメッセージの場合はそのまま使う
    if (errorMessage && Object.values(ERROR_MESSAGES.GEMINI).includes(errorMessage)) {
      throw error;
    }

    // その他のエラーはパースして返す
    const userFriendlyMessage = parseGeminiError(error);
    throw new Error(userFriendlyMessage);
  }
};
