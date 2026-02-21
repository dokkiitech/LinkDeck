import { apiRequest } from './apiClient';

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

/**
 * メンテナンスログ
 */
export interface MaintenanceLog {
  id: string;
  action: 'enabled' | 'disabled';
  reason?: string;
  performedBy: string;
  performedByUid: string;
  timestamp: string;
  previousStatus: boolean;
}

/**
 * メンテナンスモードの状態を取得
 */
export const getMaintenanceStatus = async (): Promise<MaintenanceStatus> => {
  try {
    const status = await apiRequest<MaintenanceStatus>('/v1/maintenance/status', {
      authRequired: false,
    });
    return status;
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
  _userEmail?: string,
  _userUid?: string
): Promise<void> => {
  await apiRequest<MaintenanceStatus>('/v1/admin/maintenance', {
    method: 'PUT',
    body: {
      isMaintenanceMode,
      reason,
    },
  });
};

/**
 * メンテナンスモードの状態を定期監視（15秒）
 */
export const subscribeToMaintenanceStatus = (
  callback: (status: MaintenanceStatus) => void
): (() => void) => {
  let timer: ReturnType<typeof setInterval> | null = null;
  let stopped = false;

  const fetchStatus = async () => {
    if (stopped) return;

    try {
      const status = await getMaintenanceStatus();
      callback(status);
    } catch (error) {
      console.error('Error polling maintenance status:', error);
      callback({ isMaintenanceMode: false });
    }
  };

  void fetchStatus();
  timer = setInterval(fetchStatus, 15000);

  return () => {
    stopped = true;
    if (timer) {
      clearInterval(timer);
    }
  };
};

/**
 * ユーザーが開発者かどうかをチェック
 */
export const isDeveloper = async (_uid: string): Promise<boolean> => {
  try {
    const response = await apiRequest<{ isDeveloper: boolean }>('/v1/me/developer');
    return Boolean(response.isDeveloper);
  } catch (error) {
    console.error('Error checking developer status:', error);
    return false;
  }
};

/**
 * 開発者を追加
 */
export const addDeveloper = async (uid: string, email: string): Promise<void> => {
  await apiRequest<Developer>('/v1/admin/developers', {
    method: 'POST',
    body: { uid, email },
  });
};

/**
 * 開発者を削除
 */
export const removeDeveloper = async (uid: string): Promise<void> => {
  await apiRequest<void>(`/v1/admin/developers/${encodeURIComponent(uid)}`, {
    method: 'DELETE',
  });
};

/**
 * すべての開発者を取得
 */
export const getDevelopers = async (): Promise<Developer[]> => {
  try {
    const response = await apiRequest<{ developers: Developer[] }>('/v1/admin/developers');
    return response.developers || [];
  } catch (error) {
    console.error('Error fetching developers:', error);
    return [];
  }
};

/**
 * メンテナンスログを取得（最新順）
 */
export const getMaintenanceLogs = async (limit: number = 50): Promise<MaintenanceLog[]> => {
  try {
    const query = new URLSearchParams();
    query.set('limit', String(limit));

    const response = await apiRequest<{ logs: MaintenanceLog[] }>(`/v1/admin/maintenance-logs?${query.toString()}`);
    return response.logs || [];
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    return [];
  }
};
