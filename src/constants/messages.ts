/**
 * アプリケーション全体で使用されるメッセージ定数
 * エラーメッセージ、成功メッセージ、確認メッセージなどを一元管理
 */

export const ERROR_MESSAGES = {
  // 認証関連
  AUTH: {
    SIGN_UP_FAILED: 'サインアップに失敗しました',
    LOGIN_FAILED: 'ログインに失敗しました',
    GUEST_LOGIN_FAILED: 'ゲストログインに失敗しました',
    LOGOUT_FAILED: 'ログアウトに失敗しました',
    NOT_GUEST_USER: 'ゲストユーザーではありません',
    ACCOUNT_UPGRADE_FAILED: 'アカウントの作成に失敗しました',
    EMAIL_ALREADY_IN_USE: 'このメールアドレスは既に使用されています',
    LOGIN_REQUIRED: 'ログインしてください',
  },

  // リンク関連
  LINKS: {
    LOAD_FAILED: 'リンクの読み込みに失敗しました',
    SAVE_FAILED: 'リンクの保存に失敗しました',
    DELETE_FAILED: 'リンクの削除に失敗しました',
    URL_REQUIRED: 'URLを入力してください',
    NO_VALID_URL: '有効なURLを入力してください（http://またはhttps://で始まるURL）',
    ARCHIVED_LOAD_FAILED: 'アーカイブリンクの読み込みに失敗しました',
  },

  // タグ関連
  TAGS: {
    LOAD_FAILED: 'タグの読み込みに失敗しました',
    CREATE_FAILED: 'タグの作成に失敗しました',
    DELETE_FAILED: 'タグの削除に失敗しました',
    ALREADY_ADDED: 'このタグは既に追加されています',
  },

  // API関連
  API: {
    KEY_SAVE_FAILED: 'APIキーの保存に失敗しました',
    KEY_LOAD_FAILED: 'APIキーの読み込みに失敗しました',
    KEY_DELETE_FAILED: 'APIキーの削除に失敗しました',
  },

  // Gemini API関連
  GEMINI: {
    SUMMARY_FAILED: '要約の生成中にエラーが発生しました',
    INSUFFICIENT_CONTENT: 'ページの内容が取得できないか、要約するのに十分なテキストがありません',
    QUOTA_EXCEEDED: 'APIの無料枠が上限に達しました。Google AI Studioで使用状況を確認するか、しばらく時間を置いてから再度お試しください。',
    INVALID_API_KEY: 'APIキーが無効です。設定画面で正しいAPIキーを入力してください。',
    NETWORK_ERROR: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
    GENERIC_ERROR: 'AI処理中にエラーが発生しました。しばらく時間を置いてから再度お試しください。',
  },

  // 共有機能関連
  SHARED: {
    PROCESS_FAILED: '共有URLの処理に失敗しました',
  },

  // 一般的なエラー
  GENERAL: {
    UNEXPECTED_ERROR: '予期しないエラーが発生しました',
  },
} as const;

export const SUCCESS_MESSAGES = {
  // リンク関連
  LINKS: {
    SAVED: 'リンクを保存しました',
    DELETED: 'リンクを削除しました',
  },

  // タグ関連
  TAGS: {
    CREATED: 'タグを作成しました',
    DELETED: 'タグを削除しました',
  },

  // API関連
  API: {
    KEY_SAVED: 'APIキーを保存しました',
  },

  // 共有機能関連
  SHARED: {
    URL_PROCESSED: '共有されたURLを追加しました',
  },
} as const;

export const CONFIRMATION_MESSAGES = {
  // リンク関連
  LINKS: {
    DELETE: 'このリンクを削除しますか？',
  },

  // タグ関連
  TAGS: {
    DELETE: 'このタグを削除しますか？',
  },
} as const;

export const INFO_MESSAGES = {
  // 共有機能関連
  SHARED: {
    MULTIPLE_URLS_ADDED: (successCount: number, failCount: number) =>
      `${successCount}個のURLを追加しました${failCount > 0 ? `\n${failCount}個のURLの追加に失敗しました` : ''}`,
  },
} as const;
