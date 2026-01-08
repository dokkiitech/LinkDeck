import { db } from '../config/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, getDocs } from 'firebase/firestore';

/**
 * メンテナンスモードの状態
 */
export interface MaintenanceStatus {
  isMaintenanceMode: boolean;
  reason?: string;
  startedAt?: string;
  startedBy?: string;
}

/**
 * 開発者情報
 */
export interface Developer {
  uid: string;
  email: string;
  addedAt: string;
}

const MAINTENANCE_DOC_ID = 'current';
const MAINTENANCE_COLLECTION = 'maintenance';
const DEVELOPERS_COLLECTION = 'developers';

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

    // メンテナンスモードONの場合
    if (isMaintenanceMode) {
      const status: MaintenanceStatus = {
        isMaintenanceMode: true,
        reason,
        startedAt: new Date().toISOString(),
        startedBy: userEmail,
      };
      await setDoc(docRef, status);
    } else {
      // メンテナンスモードOFFの場合はisMaintenanceModeのみ
      const status: MaintenanceStatus = {
        isMaintenanceMode: false,
      };
      await setDoc(docRef, status);
    }
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

/**
 * ユーザーが開発者かどうかをチェック
 */
export const isDeveloper = async (uid: string): Promise<boolean> => {
  try {
    const docRef = doc(db, DEVELOPERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking developer status:', error);
    return false;
  }
};

/**
 * 開発者を追加
 */
export const addDeveloper = async (uid: string, email: string): Promise<void> => {
  try {
    const docRef = doc(db, DEVELOPERS_COLLECTION, uid);
    const developer: Developer = {
      uid,
      email,
      addedAt: new Date().toISOString(),
    };
    await setDoc(docRef, developer);
  } catch (error) {
    console.error('Error adding developer:', error);
    throw error;
  }
};

/**
 * 開発者を削除
 */
export const removeDeveloper = async (uid: string): Promise<void> => {
  try {
    const docRef = doc(db, DEVELOPERS_COLLECTION, uid);
    await setDoc(docRef, { deleted: true, deletedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error removing developer:', error);
    throw error;
  }
};

/**
 * すべての開発者を取得
 */
export const getDevelopers = async (): Promise<Developer[]> => {
  try {
    const q = query(collection(db, DEVELOPERS_COLLECTION));
    const querySnapshot = await getDocs(q);
    const developers: Developer[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // deletedフラグがないものだけを返す
      if (!data.deleted) {
        developers.push(data as Developer);
      }
    });

    return developers;
  } catch (error) {
    console.error('Error fetching developers:', error);
    return [];
  }
};
