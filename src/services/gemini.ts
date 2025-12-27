import { getFunctions, httpsCallable } from 'firebase/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ERROR_MESSAGES } from '../constants/messages';

/**
 * URLのコンテンツを取得して要約する
 * Cloud Functions経由で実行（APIキーは暗号化されてFirestoreに保存済み）
 * @param url 対象のURL
 * @returns 生成された要約文
 */
export const summarizeURL = async (url: string): Promise<string> => {
  try {
    const functions = getFunctions();
    const summarize = httpsCallable<{ url: string }, { summary: string }>(
      functions,
      'summarizeURL'
    );

    const result = await summarize({ url });
    return result.data.summary;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[Gemini] Error summarizing URL:', error);
    }

    // Cloud Functionsのエラーメッセージを処理
    const message = error.message || 'URL要約中にエラーが発生しました';

    if (message.includes('INSUFFICIENT_CONTENT')) {
      throw new Error('INSUFFICIENT_CONTENT');
    }

    if (message.includes('APIキーが設定されていません')) {
      throw new Error('APIキーが設定されていません');
    }

    throw new Error(message);
  }
};

/**
 * APIキーの検証
 * ユーザーが入力したAPIキーが有効かチェック
 * @param apiKey Gemini APIキー
 * @returns 有効かどうか
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
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
