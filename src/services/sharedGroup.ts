import { NativeModules, Platform } from 'react-native';

interface SharedGroupManager {
  getPendingURLs(): Promise<string[]>;
  clearPendingURLs(): Promise<boolean>;
}

const { SharedGroupManager } = NativeModules as { SharedGroupManager?: SharedGroupManager };

/**
 * App Groupから保留中の共有URLを取得
 * Share Extensionから共有されたURLのリストを返す
 */
export const getPendingSharedURLs = async (): Promise<string[]> => {
  if (Platform.OS !== 'ios' || !SharedGroupManager) {
    return [];
  }

  try {
    return await SharedGroupManager.getPendingURLs();
  } catch (error) {
    console.error('Failed to get pending URLs:', error);
    return [];
  }
};

/**
 * App Groupの保留中のURLをクリア
 * 処理済みのURLを削除する
 */
export const clearPendingSharedURLs = async (): Promise<void> => {
  if (Platform.OS !== 'ios' || !SharedGroupManager) {
    return;
  }

  try {
    await SharedGroupManager.clearPendingURLs();
  } catch (error) {
    console.error('Failed to clear pending URLs:', error);
  }
};

/**
 * Share Extensionが利用可能かどうかをチェック
 */
export const isShareExtensionAvailable = (): boolean => {
  return Platform.OS === 'ios' && !!SharedGroupManager;
};
