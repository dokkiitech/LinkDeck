import { URLMetadata } from '../types';

/**
 * URLからメタデータ（OGP情報）を取得する
 * @param url 対象のURL
 * @returns URLメタデータ（タイトル、説明、画像URL）
 */
export const fetchURLMetadata = async (url: string): Promise<URLMetadata> => {
  try {
    // URLの正規化
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    // HTMLを取得
    const response = await fetch(normalizedUrl);
    const html = await response.text();

    // OGPメタタグを抽出
    const metadata: URLMetadata = {
      title: extractMetaTag(html, 'og:title') || extractTitle(html) || new URL(normalizedUrl).hostname,
      description: extractMetaTag(html, 'og:description') || extractMetaTag(html, 'description'),
      imageUrl: extractMetaTag(html, 'og:image'),
    };

    return metadata;
  } catch (error) {
    console.error('Error fetching URL metadata:', error);

    // エラー時はURLのホスト名をタイトルとして返す
    try {
      const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return {
        title: hostname,
        description: undefined,
        imageUrl: undefined,
      };
    } catch {
      return {
        title: url,
        description: undefined,
        imageUrl: undefined,
      };
    }
  }
};

/**
 * HTMLからOGPメタタグの内容を抽出
 */
const extractMetaTag = (html: string, property: string): string | undefined => {
  // og:プロパティ
  const ogRegex = new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, 'i');
  const ogMatch = html.match(ogRegex);
  if (ogMatch && ogMatch[1]) return ogMatch[1];

  // name属性
  const nameRegex = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
  const nameMatch = html.match(nameRegex);
  if (nameMatch && nameMatch[1]) return nameMatch[1];

  // content属性が先に来るパターン
  const reverseOgRegex = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, 'i');
  const reverseOgMatch = html.match(reverseOgRegex);
  if (reverseOgMatch && reverseOgMatch[1]) return reverseOgMatch[1];

  const reverseNameRegex = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, 'i');
  const reverseNameMatch = html.match(reverseNameRegex);
  if (reverseNameMatch && reverseNameMatch[1]) return reverseNameMatch[1];

  return undefined;
};

/**
 * HTMLから<title>タグの内容を抽出
 */
const extractTitle = (html: string): string | undefined => {
  const titleRegex = /<title[^>]*>([^<]*)<\/title>/i;
  const match = html.match(titleRegex);
  return match ? match[1].trim() : undefined;
};

/**
 * URLからHTMLのtitleタグを取得する（シンプル版）
 * @param url 取得対象のURL
 * @returns titleタグの内容、取得できない場合はnull
 */
export const fetchUrlTitle = async (url: string): Promise<string | null> => {
  try {
    // URLが有効かチェック
    if (!url || typeof url !== 'string') {
      return null;
    }

    // URLの正規化
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    // HTTPリクエストを送信
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

    const response = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[fetchUrlTitle] HTTP error: ${response.status}`);
      return null;
    }

    // HTMLを取得
    const html = await response.text();

    // OG:titleを優先的にチェック
    const ogTitle = extractMetaTag(html, 'title');
    if (ogTitle) {
      return decodeHtmlEntities(ogTitle);
    }

    // titleタグを抽出
    const title = extractTitle(html);
    if (title) {
      return decodeHtmlEntities(title);
    }

    return null;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('[fetchUrlTitle] Request timeout');
      } else {
        console.warn('[fetchUrlTitle] Error fetching title:', error.message);
      }
    }
    return null;
  }
};

/**
 * HTMLエンティティをデコード
 */
const decodeHtmlEntities = (text: string): string => {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
};

// extractURLFromText は urlValidation.ts に移動しました
// import { extractURLFromText } from '../utils/urlValidation'; を使用してください
