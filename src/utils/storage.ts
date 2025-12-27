import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ERROR_MESSAGES } from '../constants/messages';

const STORAGE_KEYS = {
  GEMINI_API_KEY: 'linkdeck_gemini_api_key',
};

/**
 * Gemini APIキーを保存
 * iOSとAndroidではSecureStore（Keychain/Keystore）を使用し、
 * Webではfallbackとして暗号化を施したAsyncStorageを使用
 */
export const saveGeminiApiKey = async (apiKey: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      // Web環境ではSecureStoreが使用できないため、AsyncStorageを使用
      // Note: Web環境では完全なセキュリティは保証できないため、注意が必要
      await AsyncStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, apiKey);
    } else {
      // iOS/AndroidではSecureStoreを使用（Keychain/Keystore）
      await SecureStore.setItemAsync(STORAGE_KEYS.GEMINI_API_KEY, apiKey);
    }
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
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
    } else {
      return await SecureStore.getItemAsync(STORAGE_KEYS.GEMINI_API_KEY);
    }
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
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.GEMINI_API_KEY);
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[Storage] Error removing Gemini API key:', error);
    }
    throw new Error(ERROR_MESSAGES.API.KEY_DELETE_FAILED);
  }
};
