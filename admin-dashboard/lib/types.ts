/**
 * サービスモード設定の型定義
 */
export interface ServiceModeConfig {
  enabled: boolean;
  message: string;
  disabledFeatures: string[];
  updatedAt: Date;
  updatedBy: string;
  updatedByEmail: string;
  reason: string;
}

/**
 * サービスモード変更履歴の型定義
 */
export interface ServiceModeHistory {
  id: string;
  enabled: boolean;
  message: string;
  disabledFeatures: string[];
  changedAt: Date;
  changedBy: string;
  changedByEmail: string;
  reason: string;
}

/**
 * ユーザー型定義
 */
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: 'admin' | 'user';
}
