import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini APIを使用してテキストを要約する
 * @param apiKey ユーザーのGemini APIキー
 * @param content 要約対象のテキストコンテンツ
 * @returns 生成された要約文
 */
export const generateSummary = async (
  apiKey: string,
  content: string
): Promise<string> => {
  try {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('APIキーが設定されていません');
    }

    // Gemini APIクライアントの初期化
    const genAI = new GoogleGenerativeAI(apiKey);
    // models/gemini-flash-latestを使用
    const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    // プロンプトの作成
    const prompt = `以下のWebページのコンテンツを日本語で簡潔に要約してください。要約は3〜5文程度で、重要なポイントを押さえた内容にしてください。

コンテンツ:
${content.slice(0, 10000)} // 最大10,000文字まで

要約:`;

    // 要約生成
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    if (!summary || summary.trim() === '') {
      throw new Error('要約の生成に失敗しました');
    }

    return summary.trim();
  } catch (error: any) {
    console.error('Error generating summary with Gemini:', error);
    throw new Error(error.message || '要約の生成中にエラーが発生しました');
  }
};

/**
 * URLのコンテンツを取得して要約する
 * @param apiKey ユーザーのGemini APIキー
 * @param url 対象のURL
 * @returns 生成された要約文
 */
export const summarizeURL = async (
  apiKey: string,
  url: string
): Promise<string> => {
  try {
    // URLからHTMLコンテンツを取得
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('URLのコンテンツの取得に失敗しました');
    }

    const html = await response.text();

    // HTMLからテキストコンテンツを抽出（簡易版）
    const textContent = extractTextFromHTML(html);

    if (!textContent || textContent.trim().length < 100) {
      throw new Error('INSUFFICIENT_CONTENT');
    }

    // Gemini APIで要約生成
    return await generateSummary(apiKey, textContent);
  } catch (error: any) {
    console.error('Error summarizing URL:', error);
    // 十分なコンテンツがない場合は専用のエラーコードを返す
    if (error.message === 'INSUFFICIENT_CONTENT') {
      throw error;
    }
    throw new Error(error.message || 'URL要約中にエラーが発生しました');
  }
};

/**
 * HTMLからテキストコンテンツを抽出（簡易版）
 * @param html HTML文字列
 * @returns 抽出されたテキスト
 */
const extractTextFromHTML = (html: string): string => {
  // scriptタグとstyleタグを除去
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // HTMLタグを除去
  text = text.replace(/<[^>]+>/g, ' ');

  // HTMLエンティティをデコード
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // 連続する空白を1つにまとめる
  text = text.replace(/\s+/g, ' ');

  // 前後の空白を削除
  return text.trim();
};

/**
 * APIキーの検証
 * @param apiKey Gemini APIキー
 * @returns 有効かどうか
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // models/gemini-flash-latestを使用
    const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    // 簡単なテストリクエスト
    const result = await model.generateContent('こんにちは');
    const response = await result.response;

    return !!response.text();
  } catch (error) {
    console.error('API key validation failed:', error);
    return false;
  }
};
