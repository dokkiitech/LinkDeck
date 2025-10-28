# コードスタイルと規約

## TypeScript設定

### tsconfig.json
- **Target**: ES2020
- **Module**: ESNext
- **Strict Mode**: 有効
- **JSX**: react-native
- **Module Resolution**: node
- **Extends**: expo/tsconfig.base

### 重要な設定
- `strict: true` - 厳格な型チェック
- `noEmit: true` - コンパイル不要（Expoが処理）
- `isolatedModules: true` - Babel互換性
- `allowSyntheticDefaultImports: true` - デフォルトインポート許可
- `esModuleInterop: true` - CommonJSモジュール互換性
- `skipLibCheck: true` - 型定義ファイルのチェックスキップ
- `resolveJsonModule: true` - JSON インポート許可

## 命名規則

### ファイル命名
- **コンポーネント**: PascalCase（例: `LoginScreen.tsx`, `AuthContext.tsx`）
- **ユーティリティ**: camelCase（例: `firestore.ts`, `storage.ts`）
- **型定義**: PascalCase（例: `User`, `Link`, `Tag`）

### コード命名
- **インターフェース**: PascalCase（例: `User`, `Link`, `AuthContextType`）
- **関数**: camelCase（例: `createLink`, `getUserLinks`, `useAuth`）
- **定数**: camelCase（例: `linksCollection`, `tagsCollection`）
- **コンポーネント**: PascalCase（例: `AuthProvider`, `SharedURLHandler`）

## コードスタイル

### TypeScript
- **型定義**: 明示的なインターフェース定義を使用
- **非同期処理**: async/awaitパターンを使用
- **null/undefined**: TypeScriptの厳格なnullチェックを活用
- **JSDoc**: 主要なインターフェースと関数にはJSDocコメントを記述

### React/React Native
- **関数コンポーネント**: すべてのコンポーネントは関数コンポーネント
- **Hooks**: React Hooksを活用（useState, useEffect, useContext等）
- **Context**: グローバル状態管理にはReact Contextを使用
- **型安全性**: propsとstateは必ず型定義

### Firestore関連
- **型の二重定義**: アプリ用（Date）とFirestore用（Timestamp）の型を分離
  - 例: `User`と`UserDocument`, `Link`と`LinkDocument`
- **日付変換**: Firestore TimestampとJavaScript Dateの相互変換を適切に処理

## プロジェクト構造の規約

### ディレクトリ構成
```
src/
├── config/          # 設定ファイル（Firebase等）
├── contexts/        # React Context
├── navigation/      # ナビゲーション定義
├── screens/         # 画面コンポーネント
│   ├── auth/        # 認証関連画面
│   ├── links/       # リンク管理画面
│   ├── tags/        # タグ管理画面
│   └── settings/    # 設定画面
├── services/        # ビジネスロジック層
├── types/           # TypeScript型定義
├── components/      # 再利用可能なコンポーネント
├── hooks/           # カスタムフック
└── utils/           # ユーティリティ関数
```

### インポート順序（暗黙的な規約）
1. React/React Native関連
2. サードパーティライブラリ
3. プロジェクト内の型定義
4. プロジェクト内のコンポーネント/サービス

## UI/UXガイドライン

### デザイン規約
- **iOS Human Interface Guidelines**に準拠
- **カラースキーム**:
  - プライマリ: #007AFF（iOS Blue）
  - 背景: #F2F2F7（Light Gray）
  - カード: #FFFFFF（White）
- **UI パターン**: モダンなカード型UI

## コミットメッセージ規約

以下のプレフィックスを使用：
- `feat:` - 新機能
- `fix:` - バグ修正
- `docs:` - ドキュメント更新
- `style:` - コードスタイルの変更
- `refactor:` - リファクタリング
- `test:` - テスト追加

## 注意点

### リンター・フォーマッター
現在、ESLintやPrettierは設定されていません。コードスタイルは手動で統一する必要があります。

### テスト
現在、テストフレームワークは導入されていません。
