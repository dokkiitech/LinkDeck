import AsyncStorage from '@react-native-async-storage/async-storage';
import { ERROR_MESSAGES } from '../constants/messages';

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
    if (__DEV__) {
      console.error('[Storage] Error saving Gemini API key:', error);
    }
    throw new Error(ERROR_MESSAGES.API.KEY_SAVE_FAILED);
  }
};

/**
 * Gemini APIキーを取得
 */
export const getGeminiApiKey = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
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
    await AsyncStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
  } catch (error) {
    if (__DEV__) {
      console.error('[Storage] Error removing Gemini API key:', error);
    }
    throw new Error(ERROR_MESSAGES.API.KEY_DELETE_FAILED);
  }
};
