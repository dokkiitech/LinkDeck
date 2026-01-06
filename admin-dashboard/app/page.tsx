import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            LinksDeck
          </h1>
          <p className="text-xl text-gray-600">管理画面</p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/login"
            className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ログイン
          </Link>

          <Link
            href="/service-mode"
            className="block w-full text-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            サービスモード管理へ
          </Link>
        </div>
      </div>
    </div>
  );
}
