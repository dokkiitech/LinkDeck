/**
 * URL検証ユーティリティ
 * URLの厳格なバリデーションを提供
 */

/**
 * URLが有効かどうかをチェック
 * - http/https プロトコル必須
 * - 有効なドメイン形式
 * - URL形式のみを許可（テキストは不可）
 */
export const isValidURL = (text: string): boolean => {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const trimmedText = text.trim();

  // 空文字列チェック
  if (trimmedText.length === 0) {
    return false;
  }

  // URL形式の厳格なチェック
  try {
    const url = new URL(trimmedText);

    // http または https のみ許可
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    // ホスト名が存在するかチェック
    if (!url.hostname || url.hostname.length === 0) {
      return false;
    }

    // ホスト名が有効なドメイン形式かチェック
    // 少なくともドット(.)を含むか、localhostである必要がある
    const isLocalhost = url.hostname === 'localhost';
    const hasValidDomain = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(url.hostname);

    if (!isLocalhost && !hasValidDomain) {
      return false;
    }

    return true;
  } catch (error) {
    // URL コンストラクタがエラーをスローした場合は無効なURL
    return false;
  }
};

/**
 * URLを正規化（先頭・末尾の空白削除）
 */
export const normalizeURL = (url: string): string => {
  return url.trim();
};

/**
 * URLにプロトコルを自動追加
 * プロトコルがない場合はhttps://を追加
 */
export const addProtocolIfNeeded = (url: string): string => {
  const trimmedUrl = url.trim();

  // 既にプロトコルがある場合はそのまま返す
  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  // プロトコルがない場合はhttps://を追加
  return `https://${trimmedUrl}`;
};

/**
 * テキストからURLを抽出（自動補完版）
 * - http/https で始まるURLを抽出
 * - プロトコルがない場合は自動的にhttps://を追加して検証
 * - 最初に見つかった有効なURLを返す
 * - 有効なURLが見つからない場合はnullを返す
 */
export const extractURLFromText = (text: string): string | null => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const trimmedText = text.trim();

  // まず、入力テキスト全体が有効なURLかチェック
  if (isValidURL(trimmedText)) {
    return normalizeURL(trimmedText);
  }

  // プロトコルがない場合は追加して再チェック
  const urlWithProtocol = addProtocolIfNeeded(trimmedText);
  if (isValidURL(urlWithProtocol)) {
    return normalizeURL(urlWithProtocol);
  }

  // URLパターンで抽出を試みる（http/https で始まるもののみ）
  const urlPattern = /(https?:\/\/[^\s]+)/gi;
  const matches = trimmedText.match(urlPattern);

  if (matches && matches.length > 0) {
    // 最初にマッチしたURLを検証
    for (const match of matches) {
      // 末尾の句読点を削除
      const cleanedURL = match.replace(/[.,;:!?)]+$/, '');

      if (isValidURL(cleanedURL)) {
        return normalizeURL(cleanedURL);
      }
    }
  }

  // 有効なURLが見つからなかった
  return null;
};
