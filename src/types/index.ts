import { Timestamp } from 'firebase/firestore';

/**
 * ユーザーロールの型定義
 */
export type UserRole = 'admin' | 'user';

/**
 * ユーザー情報の型定義
 */
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date;
  role?: UserRole; // ユーザーロール (デフォルト: 'user')
  geminiApiKey?: string; // 暗号化されたAPIキー
}

/**
 * Firestoreに保存されるユーザーデータの型
 */
export interface UserDocument {
  email: string | null;
  displayName: string | null;
  createdAt: Timestamp;
  role?: UserRole;
  geminiApiKey?: string;
}

/**
 * タイムラインエントリの型定義（メモや要約）
 */
export interface TimelineEntry {
  id: string;
  content: string;
  createdAt: Date;
  type: 'note' | 'summary';
}

/**
 * Firestoreに保存されるタイムラインエントリデータの型
 */
export interface TimelineEntryDocument {
  content: string;
  createdAt: Timestamp;
  type: 'note' | 'summary';
}

/**
 * 保存されたリンク情報の型定義
 */
export interface Link {
  id: string;
  userId: string;
  url: string;
  title: string;
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  summary?: string;
  timeline?: TimelineEntry[];
}

/**
 * Firestoreに保存されるリンクデータの型
 */
export interface LinkDocument {
  userId: string;
  url: string;
  title: string;
  tags: string[];
  isArchived: boolean;
  createdAt: Timestamp;
  summary?: string;
  timeline?: TimelineEntryDocument[];
}

/**
 * タグ情報の型定義
 */
export interface Tag {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
}

/**
 * Firestoreに保存されるタグデータの型
 */
export interface TagDocument {
  userId: string;
  name: string;
  createdAt: Timestamp;
}

/**
 * ナビゲーションパラメータの型定義
 */
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Links: undefined;
  Tags: undefined;
  Agent: undefined;
  Settings: undefined;
};

export type LinksStackParamList = {
  LinksList: undefined;
  AddLink: { initialUrl?: string } | undefined;
  LinkDetail: { linkId: string };
  ArchivedLinks: undefined;
};

export type TagsStackParamList = {
  TagsList: undefined;
  TagLinks: { tagName: string };
};

export type AgentStackParamList = {
  AgentSearch: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  UpgradeAccount: undefined;
};

/**
 * サービスモード設定の型定義
 */
export interface ServiceModeConfig {
  enabled: boolean;
  message: string;
  disabledFeatures: string[];
  updatedAt: Date;
  updatedBy: string; // ユーザーUID
  updatedByEmail: string; // 設定した人のメールアドレス
  reason: string; // 設定理由
}

/**
 * Firestoreに保存されるサービスモード設定の型
 */
export interface ServiceModeConfigDocument {
  enabled: boolean;
  message: string;
  disabledFeatures: string[];
  updatedAt: Timestamp;
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
  changedBy: string; // ユーザーUID
  changedByEmail: string; // 変更した人のメールアドレス
  reason: string; // 変更理由
}

/**
 * Firestoreに保存されるサービスモード変更履歴の型
 */
export interface ServiceModeHistoryDocument {
  enabled: boolean;
  message: string;
  disabledFeatures: string[];
  changedAt: Timestamp;
  changedBy: string;
  changedByEmail: string;
  reason: string;
}
