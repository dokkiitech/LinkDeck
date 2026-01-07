import { db } from '../config/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

/**
 * メンテナンスモードの状態
 */
export interface MaintenanceStatus {
  isMaintenanceMode: boolean;
  reason?: string;
  startedAt?: string;
  startedBy?: string;
}

const MAINTENANCE_DOC_ID = 'current';
const MAINTENANCE_COLLECTION = 'maintenance';

/**
 * メンテナンスモードの状態を取得
 */
export const getMaintenanceStatus = async (): Promise<MaintenanceStatus> => {
  try {
    const docRef = doc(db, MAINTENANCE_COLLECTION, MAINTENANCE_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as MaintenanceStatus;
    }

    // デフォルトはメンテナンスモードOFF
    return {
      isMaintenanceMode: false,
    };
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return {
      isMaintenanceMode: false,
    };
  }
};

/**
 * メンテナンスモードを設定
 */
export const setMaintenanceMode = async (
  isMaintenanceMode: boolean,
  reason?: string,
  userEmail?: string
): Promise<void> => {
  try {
    const docRef = doc(db, MAINTENANCE_COLLECTION, MAINTENANCE_DOC_ID);
    const status: MaintenanceStatus = {
      isMaintenanceMode,
      reason: isMaintenanceMode ? reason : undefined,
      startedAt: isMaintenanceMode ? new Date().toISOString() : undefined,
      startedBy: isMaintenanceMode ? userEmail : undefined,
    };

    await setDoc(docRef, status);
  } catch (error) {
    console.error('Error setting maintenance mode:', error);
    throw error;
  }
};

/**
 * メンテナンスモードの状態をリアルタイムで監視
 */
export const subscribeToMaintenanceStatus = (
  callback: (status: MaintenanceStatus) => void
): (() => void) => {
  const docRef = doc(db, MAINTENANCE_COLLECTION, MAINTENANCE_DOC_ID);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as MaintenanceStatus);
      } else {
        callback({ isMaintenanceMode: false });
      }
    },
    (error) => {
      console.error('Error subscribing to maintenance status:', error);
      callback({ isMaintenanceMode: false });
    }
  );
};
