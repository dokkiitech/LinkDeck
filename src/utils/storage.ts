import { getFunctions, httpsCallable } from 'firebase/functions';
import { ERROR_MESSAGES } from '../constants/messages';

/**
 * Gemini APIキーを保存
 * Cloud Functions経由でFirestoreに暗号化して保存
 */
export const saveGeminiApiKey = async (apiKey: string): Promise<void> => {
  try {
    const functions = getFunctions();
    const saveKey = httpsCallable(functions, 'saveGeminiApiKey');

    await saveKey({ apiKey });
  } catch (error: any) {
    if (__DEV__) {
      console.error('[Storage] Error saving Gemini API key:', error);
    }
    throw new Error(error.message || ERROR_MESSAGES.API.KEY_SAVE_FAILED);
  }
};

/**
 * Gemini APIキーが設定されているか確認
 */
export const getGeminiApiKey = async (): Promise<string | null> => {
  try {
    const functions = getFunctions();
    const hasKey = httpsCallable<{}, { hasKey: boolean }>(functions, 'hasGeminiApiKey');

    const result = await hasKey({});
    return result.data.hasKey ? 'exists' : null;
  } catch (error) {
    if (__DEV__) {
      console.error('[Storage] Error getting Gemini API key:', error);
    }
    return null;
  }
};

/**
 * Gemini APIキーを削除
 */
export const removeGeminiApiKey = async (): Promise<void> => {
  try {
    const functions = getFunctions();
    const removeKey = httpsCallable(functions, 'removeGeminiApiKey');

    await removeKey({});
  } catch (error: any) {
    if (__DEV__) {
      console.error('[Storage] Error removing Gemini API key:', error);
    }
    throw new Error(error.message || ERROR_MESSAGES.API.KEY_DELETE_FAILED);
  }
};
