import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  GEMINI_API_KEY: '@linkdeck:gemini_api_key',
};

/**
 * Gemini APIキーを保存
 */
export const saveGeminiApiKey = async (apiKey: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, apiKey);
  } catch (error) {
    console.error('Error saving Gemini API key:', error);
    throw new Error('APIキーの保存に失敗しました');
  }
};

/**
 * Gemini APIキーを取得
 */
export const getGeminiApiKey = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
  } catch (error) {
    console.error('Error getting Gemini API key:', error);
    return null;
  }
};

/**
 * Gemini APIキーを削除
 */
export const removeGeminiApiKey = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
  } catch (error) {
    console.error('Error removing Gemini API key:', error);
    throw new Error('APIキーの削除に失敗しました');
  }
};
