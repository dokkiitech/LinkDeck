import { GoogleGenerativeAI } from '@google/generative-ai';
import { Link } from '../types';
import { getUserLinks } from './firestore';
import { ERROR_MESSAGES } from '../constants/messages';

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
 * @returns 検索結果とエージェントの説明
 */
export const searchWithAgent = async (
  apiKey: string,
  userId: string,
  query: string
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

    // プロンプトの作成
    const prompt = `あなたは、ユーザーが保存したリンク集から関連する情報を検索するAIアシスタントです。

ユーザーの検索クエリ:
${query}

ユーザーが保存しているリンク一覧（JSON形式）:
${JSON.stringify(linksData, null, 2)}

指示:
1. ユーザーの検索クエリを分析し、関連性の高いリンクを見つけてください
2. 日付の表現（"3月くらい"、"最近"、"去年"など）も考慮してください
3. キーワードだけでなく、文脈や意図も理解してください
4. 見つかったリンクのindexを配列で返してください
5. 検索結果について日本語で簡潔な説明を付けてください

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
 * 検索クエリの提案を生成
 * @returns クエリの例の配列
 */
export const getSearchQuerySuggestions = (): string[] => {
  return [
    '3月くらいにReactについて調べた気がする',
    '最近保存したデザインに関する記事',
    '去年の夏にAIについて見たやつ',
    'TypeScriptのチュートリアル',
    'Node.jsの設定方法',
  ];
};
