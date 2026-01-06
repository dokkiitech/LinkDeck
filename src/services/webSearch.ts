/**
 * Web検索サービス - DuckDuckGo HTML検索
 */

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * DuckDuckGo HTML検索を実行
 * @param query 検索クエリ
 * @param maxResults 最大結果数（デフォルト: 5）
 * @returns 検索結果の配列
 */
export const searchWeb = async (
  query: string,
  maxResults: number = 5
): Promise<WebSearchResult[]> => {
  try {
    if (!query || query.trim() === '') {
      return [];
    }

    // DuckDuckGo HTML検索のURL
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    // HTTPリクエストを送信
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[WebSearch] HTTP error: ${response.status}`);
      return [];
    }

    // HTMLを取得
    const html = await response.text();

    // 検索結果を抽出
    const results = parseSearchResults(html, maxResults);

    return results;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('[WebSearch] Request timeout');
      } else {
        console.warn('[WebSearch] Error:', error.message);
      }
    }
    return [];
  }
};

/**
 * DuckDuckGo HTMLから検索結果を抽出
 * @param html HTML文字列
 * @param maxResults 最大結果数
 * @returns 検索結果の配列
 */
const parseSearchResults = (html: string, maxResults: number): WebSearchResult[] => {
  const results: WebSearchResult[] = [];

  try {
    // DuckDuckGo HTMLの結果は <div class="result"> 内に含まれる
    // タイトル: <a class="result__a">
    // URL: <a class="result__url">
    // スニペット: <a class="result__snippet">

    // 結果ブロックを抽出（簡易的な正規表現）
    const resultBlockRegex = /<div class="result[^"]*">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
    const resultBlocks = html.match(resultBlockRegex) || [];

    for (let i = 0; i < Math.min(resultBlocks.length, maxResults); i++) {
      const block = resultBlocks[i];

      // タイトルを抽出
      const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>/);
      const title = titleMatch ? cleanHtml(titleMatch[1]) : '';

      // URLを抽出（result__url から）
      const urlMatch = block.match(/<a[^>]*class="result__url"[^>]*href="([^"]+)"/);
      let url = urlMatch ? urlMatch[1] : '';

      // DuckDuckGoのリダイレクトURLの場合、実際のURLを抽出
      if (url.includes('//duckduckgo.com/l/?uddg=')) {
        const uddgMatch = url.match(/uddg=([^&]+)/);
        if (uddgMatch) {
          url = decodeURIComponent(uddgMatch[1]);
        }
      }

      // スニペットを抽出
      const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      const snippet = snippetMatch ? cleanHtml(snippetMatch[1]) : '';

      // 有効な結果のみ追加
      if (title && url && isValidUrl(url)) {
        results.push({
          title: title.trim(),
          url: url.trim(),
          snippet: snippet.trim(),
        });
      }
    }
  } catch (error) {
    console.warn('[WebSearch] Error parsing results:', error);
  }

  return results;
};

/**
 * HTMLタグとエンティティをクリーンアップ
 */
const cleanHtml = (text: string): string => {
  return text
    .replace(/<[^>]+>/g, '') // HTMLタグを削除
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // 複数の空白を1つに
    .trim();
};

/**
 * URLが有効かチェック
 */
const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};
