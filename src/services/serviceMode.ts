import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  ServiceModeConfig,
  ServiceModeConfigDocument,
  ServiceModeHistory,
  ServiceModeHistoryDocument,
} from '../types';

/**
 * サービスモード設定ドキュメントの参照
 */
const serviceModeDocRef = doc(db, 'config', 'serviceMode');

/**
 * サービスモード変更履歴コレクションの参照
 */
const serviceModeHistoryCollection = collection(db, 'config', 'serviceMode', 'history');

/**
 * サービスモード設定を取得
 */
export const getServiceModeConfig = async (): Promise<ServiceModeConfig | null> => {
  try {
    const docSnap = await getDoc(serviceModeDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as ServiceModeConfigDocument;
      return {
        enabled: data.enabled,
        message: data.message || '',
        disabledFeatures: data.disabledFeatures || [],
        updatedAt: data.updatedAt.toDate(),
        updatedBy: data.updatedBy,
        updatedByEmail: data.updatedByEmail,
        reason: data.reason || '',
      };
    }

    // デフォルト値を返す
    return {
      enabled: false,
      message: '',
      disabledFeatures: [],
      updatedAt: new Date(),
      updatedBy: '',
      updatedByEmail: '',
      reason: '',
    };
  } catch (error) {
    console.error('Error getting service mode config:', error);
    return null;
  }
};

/**
 * サービスモード設定をリアルタイムで監視
 */
export const subscribeToServiceMode = (
  callback: (config: ServiceModeConfig | null) => void
): (() => void) => {
  return onSnapshot(
    serviceModeDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ServiceModeConfigDocument;
        callback({
          enabled: data.enabled,
          message: data.message || '',
          disabledFeatures: data.disabledFeatures || [],
          updatedAt: data.updatedAt.toDate(),
          updatedBy: data.updatedBy,
          updatedByEmail: data.updatedByEmail,
          reason: data.reason || '',
        });
      } else {
        // デフォルト値を返す
        callback({
          enabled: false,
          message: '',
          disabledFeatures: [],
          updatedAt: new Date(),
          updatedBy: '',
          updatedByEmail: '',
          reason: '',
        });
      }
    },
    (error) => {
      console.error('Error subscribing to service mode:', error);
      callback(null);
    }
  );
};

/**
 * サービスモード設定を更新
 * @param config 設定内容
 * @param userId 更新するユーザーのUID
 * @param userEmail 更新するユーザーのメールアドレス
 * @param reason 変更理由
 */
export const updateServiceModeConfig = async (
  config: {
    enabled: boolean;
    message: string;
    disabledFeatures: string[];
  },
  userId: string,
  userEmail: string,
  reason: string
): Promise<void> => {
  try {
    const configData: ServiceModeConfigDocument = {
      enabled: config.enabled,
      message: config.message,
      disabledFeatures: config.disabledFeatures,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
      updatedByEmail: userEmail,
      reason,
    };

    // 設定を保存
    await setDoc(serviceModeDocRef, configData);

    // 変更履歴を保存
    await addServiceModeHistory({
      enabled: config.enabled,
      message: config.message,
      disabledFeatures: config.disabledFeatures,
      changedBy: userId,
      changedByEmail: userEmail,
      reason,
    });
  } catch (error) {
    console.error('Error updating service mode config:', error);
    throw error;
  }
};

/**
 * サービスモード変更履歴を追加
 */
const addServiceModeHistory = async (data: {
  enabled: boolean;
  message: string;
  disabledFeatures: string[];
  changedBy: string;
  changedByEmail: string;
  reason: string;
}): Promise<void> => {
  try {
    const historyData: ServiceModeHistoryDocument = {
      enabled: data.enabled,
      message: data.message,
      disabledFeatures: data.disabledFeatures,
      changedAt: Timestamp.now(),
      changedBy: data.changedBy,
      changedByEmail: data.changedByEmail,
      reason: data.reason,
    };

    await addDoc(serviceModeHistoryCollection, historyData);
  } catch (error) {
    console.error('Error adding service mode history:', error);
    throw error;
  }
};

/**
 * サービスモード変更履歴を取得
 * @param limitCount 取得する履歴の最大数
 */
export const getServiceModeHistory = async (
  limitCount: number = 20
): Promise<ServiceModeHistory[]> => {
  try {
    const q = query(
      serviceModeHistoryCollection,
      orderBy('changedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as ServiceModeHistoryDocument;
      return {
        id: doc.id,
        enabled: data.enabled,
        message: data.message || '',
        disabledFeatures: data.disabledFeatures || [],
        changedAt: data.changedAt.toDate(),
        changedBy: data.changedBy,
        changedByEmail: data.changedByEmail,
        reason: data.reason || '',
      };
    });
  } catch (error) {
    console.error('Error getting service mode history:', error);
    return [];
  }
};

/**
 * 特定の機能が無効化されているかチェック
 */
export const isFeatureDisabled = (
  config: ServiceModeConfig | null,
  featureName: string
): boolean => {
  if (!config || !config.enabled) {
    return false;
  }

  return config.disabledFeatures.includes(featureName);
};
