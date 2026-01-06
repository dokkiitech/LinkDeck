'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  const isFirebaseConfigError = error.message.includes('auth/invalid-api-key');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-red-600 mb-2">エラーが発生しました</h1>
          <p className="text-gray-600">アプリケーションの実行中にエラーが発生しました</p>
        </div>

        {isFirebaseConfigError ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-3">
              🔧 Firebase設定エラー
            </h2>
            <p className="text-yellow-700 mb-4">
              環境変数が正しく設定されていません。以下の手順で設定してください：
            </p>

            <div className="bg-white rounded p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">セットアップ手順:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>
                  プロジェクトルートの <code className="bg-gray-100 px-1 py-0.5 rounded">.env</code> ファイルを開く
                </li>
                <li>
                  Firebase Consoleから取得した設定値を入力
                </li>
                <li>
                  <code className="bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_FIREBASE_API_KEY</code> など、
                  すべての <code className="bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_*</code> 変数を設定
                </li>
                <li>
                  開発サーバーを再起動: <code className="bg-gray-100 px-1 py-0.5 rounded">pnpm dev</code>
                </li>
              </ol>
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-semibold mb-1">参考:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <code className="bg-gray-100 px-1 py-0.5 rounded">.env.example</code> にテンプレートがあります
                </li>
                <li>
                  詳細は <code className="bg-gray-100 px-1 py-0.5 rounded">docs/ENV_VARIABLES.md</code> を参照
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">エラー詳細:</h2>
            <pre className="text-sm text-red-700 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            再試行
          </button>
          <a
            href="/"
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-center"
          >
            ホームに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
