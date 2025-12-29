import { GoogleGenerativeAI } from '@google/generative-ai';
import { Link } from '../types';
import { getUserLinks } from './firestore';
import { ERROR_MESSAGES } from '../constants/messages';

/**
 * 会話メッセージの型
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  links?: Link[];
  timestamp: number;
}

/**
 * エージェント検索結果の型
 */
export interface AgentSearchResult {
  links: Link[];
  explanation: string;
}

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
2. 会話の文脈を考慮してください（例: 「それ」「前回の」などの指示代名詞を理解）
3. 日付の表現（"3月くらい"、"最近"、"去年"など）も考慮してください
4. キーワードだけでなく、文脈や意図も理解してください
5. 見つかったリンクのindexを配列で返してください
6. 検索結果について日本語で簡潔な説明を付けてください

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

    throw new Error(error.message || ERROR_MESSAGES.GEMINI.SUMMARY_FAILED);
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
