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

// extractURLFromText は urlValidation.ts に移動しました
// import { extractURLFromText } from '../utils/urlValidation'; を使用してください
