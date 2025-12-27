import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as crypto from 'crypto';

// Firebase Admin初期化
admin.initializeApp();

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * 環境変数から暗号化キーを取得
 * デプロイ時に `firebase functions:secrets:set ENCRYPTION_KEY` で設定
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not set');
  }
  // 32バイトのキーに変換
  return Buffer.from(key.padEnd(32, '0').substring(0, 32));
}

/**
 * APIキーを暗号化
 */
function encryptApiKey(apiKey: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // iv + authTag + encrypted を結合
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

/**
 * APIキーを復号化
 */
function decryptApiKey(encryptedData: string): string {
  const key = getEncryptionKey();

  // iv + authTag + encrypted を分離
  const ivHex = encryptedData.slice(0, IV_LENGTH * 2);
  const authTagHex = encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2);
  const encryptedHex = encryptedData.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * ユーザーのGemini APIキーを保存
 */
export const saveGeminiApiKey = onCall(async (request) => {
  // 認証チェック
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'ユーザーが認証されていません');
  }

  const { apiKey } = request.data;

  if (!apiKey || typeof apiKey !== 'string') {
    throw new HttpsError('invalid-argument', 'APIキーが無効です');
  }

  try {
    // APIキーを暗号化
    const encryptedKey = encryptApiKey(apiKey);

    // Firestoreに保存
    await admin.firestore()
      .collection('users')
      .doc(request.auth.uid)
      .set({
        encryptedGeminiKey: encryptedKey,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error saving API key:', error);
    throw new HttpsError('internal', 'APIキーの保存に失敗しました');
  }
});

/**
 * ユーザーのGemini APIキーを削除
 */
export const removeGeminiApiKey = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'ユーザーが認証されていません');
  }

  try {
    await admin.firestore()
      .collection('users')
      .doc(request.auth.uid)
      .update({
        encryptedGeminiKey: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    console.error('Error removing API key:', error);
    throw new HttpsError('internal', 'APIキーの削除に失敗しました');
  }
});

/**
 * Gemini APIキーが設定されているか確認
 */
export const hasGeminiApiKey = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'ユーザーが認証されていません');
  }

  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(request.auth.uid)
      .get();

    const hasKey = !!userDoc.data()?.encryptedGeminiKey;
    return { hasKey };
  } catch (error) {
    console.error('Error checking API key:', error);
    throw new HttpsError('internal', 'APIキーの確認に失敗しました');
  }
});

/**
 * HTMLからテキストコンテンツを抽出
 */
function extractTextFromHTML(html: string): string {
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/\s+/g, ' ');
  return text.trim();
}

/**
 * URLの内容を要約
 */
export const summarizeURL = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'ユーザーが認証されていません');
  }

  const { url } = request.data;

  if (!url || typeof url !== 'string') {
    throw new HttpsError('invalid-argument', 'URLが無効です');
  }

  try {
    // ユーザーの暗号化されたAPIキーを取得
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(request.auth.uid)
      .get();

    const encryptedKey = userDoc.data()?.encryptedGeminiKey;

    if (!encryptedKey) {
      throw new HttpsError('failed-precondition', 'APIキーが設定されていません');
    }

    // APIキーを復号化
    const apiKey = decryptApiKey(encryptedKey);

    // URLからコンテンツを取得
    const response = await fetch(url);
    if (!response.ok) {
      throw new HttpsError('not-found', 'URLのコンテンツの取得に失敗しました');
    }

    const html = await response.text();
    const textContent = extractTextFromHTML(html);

    if (!textContent || textContent.trim().length < 100) {
      throw new HttpsError('failed-precondition', 'INSUFFICIENT_CONTENT');
    }

    // Gemini APIで要約生成
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    const prompt = `以下のWebページのコンテンツを日本語で簡潔に要約してください。要約は3〜5文程度で、重要なポイントを押さえた内容にしてください。

コンテンツ:
${textContent.slice(0, 10000)}

要約:`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    if (!summary || summary.trim() === '') {
      throw new HttpsError('internal', '要約の生成に失敗しました');
    }

    return { summary: summary.trim() };
  } catch (error: any) {
    console.error('Error summarizing URL:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', error.message || 'URL要約中にエラーが発生しました');
  }
});
