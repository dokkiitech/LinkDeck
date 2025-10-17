/**
 * URLメタデータ抽出サービス
 * URLからOGP情報（タイトル、説明文、画像）を取得します
 */

export interface URLMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
}

/**
 * URLからメタデータを抽出する
 * @param url - メタデータを取得するURL
 * @returns メタデータオブジェクト
 */
export const extractMetadata = async (url: string): Promise<URLMetadata> => {
  try {
    // URLの検証
    if (!isValidURL(url)) {
      throw new Error('Invalid URL format');
    }

    // HTMLを取得
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkDeck/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // メタデータを抽出
    const metadata: URLMetadata = {
      title: extractOGPTag(html, 'og:title') || extractTitle(html),
      description: extractOGPTag(html, 'og:description') || extractMetaDescription(html),
      image: extractOGPTag(html, 'og:image'),
    };

    return metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);

    // エラー時はURLをタイトルとして使用
    return {
      title: url,
      description: null,
      image: null,
    };
  }
};

/**
 * URLが有効かどうかを検証
 */
const isValidURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * HTMLからOGPタグの内容を抽出
 */
const extractOGPTag = (html: string, property: string): string | null => {
  const regex = new RegExp(
    `<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`,
    'i'
  );
  const match = html.match(regex);
  return match ? match[1] : null;
};

/**
 * HTMLから<title>タグの内容を抽出
 */
const extractTitle = (html: string): string | null => {
  const regex = /<title>([^<]+)<\/title>/i;
  const match = html.match(regex);
  return match ? match[1].trim() : null;
};

/**
 * HTMLからmeta descriptionを抽出
 */
const extractMetaDescription = (html: string): string | null => {
  const regex = /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i;
  const match = html.match(regex);
  return match ? match[1] : null;
};
