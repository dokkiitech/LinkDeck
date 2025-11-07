# LinkDeck デザインシステム実装概要

## 1. UI コンポーネント構造と組織

### ファイル構成
```
src/
├── screens/              # 画面コンポーネント（ユーザーが見る画面）
│   ├── auth/            # 認証画面（LoginScreen, SignUpScreen）
│   ├── links/           # リンク管理画面（LinksListScreen, AddLinkScreen等）
│   ├── tags/            # タグ管理画面（TagLinksScreen）
│   └── settings/        # 設定画面（SettingsScreen, UpgradeAccountScreen）
├── components/          # 再利用可能な部品コンポーネント
│   ├── links/
│   │   ├── URLInput.tsx         # URL入力フィールド
│   │   ├── TitleInput.tsx       # タイトル入力フィールド
│   │   ├── TagSelector.tsx      # タグ選択UI
│   │   └── QRCodeScanner.tsx    # QRコードスキャナー
│   └── SharedURLHandler.tsx     # URL共有処理
└── navigation/          # ナビゲーション定義（画面遷移）
```

### コンポーネント層の特徴
- **Screen Components**: 各画面の完全なUI実装。StyleSheetを内部に含む
- **Reusable Components**: URLInput、TitleInput、TagSelectorなど、複数の画面で使用される部品
- **シンプルなコンポーネント設計**: TypeScriptインターフェースでpropsを定義し、型安全性を確保

## 2. 現在のスタイリングアプローチ

### 使用技術
- **React Native StyleSheet**: すべてのスタイリングに使用
- **インラインスタイル配列**: 条件付きスタイルはスタイルの配列を使用
- **Ionicons**: @expo/vector-icons (Ionicon アイコンセット)

### スタイリング方法の特徴
1. **スクリーン内でのスタイル定義**: 各スクリーンファイルの最後に`StyleSheet.create()`で定義
2. **コンポーネント内でのスタイル定義**: 再利用可能なコンポーネントもそれぞれ独立したStyleSheetを持つ
3. **条件付きスタイル適用**:
   ```javascript
   style={[styles.button, loading && styles.buttonDisabled]}
   // または
   style={[
     styles.existingTag,
     isSelected && styles.existingTagSelected,
   ]}
   ```

### スタイル統一性の課題
- **中央集約的なテーマ/定数がない**: 各ファイルでカラー値が直接ハードコードされている
- **カラー値の重複**: 同じカラー（例: #007AFF）が複数のファイルで繰り返し定義されている
- **スペーシングやパディングのばらつき**: 統一されたデザイントークンが不在

## 3. カラースキームと設計

### プライマリカラーパレット
```
iOS Blue（プライマリ）: #007AFF
- 使用場面: ボタン、アクティブタブ、選択状態、リンク色

グレースケール:
- ダークグレー（テキスト）: #000000
- 中程度グレー（サブテキスト）: #8E8E93
- ライトグレー（背景）: #E5E5EA
- 白（カード背景）: #FFFFFF
- 背景色: #F2F2F7 / #F9F9F9

セマンティックカラー:
- 成功（グリーン）: #34C759
- 警告（オレンジ）: #FF9500
- エラー（レッド）: #FF3B30
- 無効（グレー）: #B0B0B0
```

### スクリーンごとのカラー使用例
- **LoginScreen**: ホワイト背景、プライマリブルーボタン、グレーゲストボタン
- **SettingsScreen**: ライトグレー背景、ホワイトセクション、マルチカラーボタン
- **AddLinkScreen**: ホワイト背景のセクション

## 4. タイポグラフィ設定

### フォントサイズ規約
```
見出し（大）: 32px - タイトル（LoginScreen）
見出し（中）: 24px - サブタイトル（LoginScreen）
見出し（小）: 20px - セクションタイトル（SettingsScreen）
標準テキスト: 16px - ボタン、入力フィールド
小テキスト: 14px - ラベル、説明文
極小テキスト: 12px - ヒント、補足

fontWeight:
- 'bold' / '700': 32pxタイトル
- '600': 見出し、ボタンテキスト、強調テキスト
- '500': 値テキスト
- デフォルト: 標準テキスト
```

### テキストの色使用
- メインテキスト: #000000（黒）
- サブテキスト/ラベル: #8E8E93（グレー）
- エラーテキスト: #FF3B30（赤）
- ボタンテキスト: #FFFFFF（白）

## 5. スペーシングとレイアウトパターン

### パディング・マージン規約（ハードコード）
```
セクション内パディング: 20px（水平）
フォームフィールド高さ: 50px
フォームフィールドパディング: 15px（水平）
ボタン高さ: 50px
最上部マージン: 20px（セクション間）
マージンボトム: 10~25px
```

### レイアウトパターン
1. **フォーム画面**: KeyboardAvoidingView + ScrollView + 垂直フレックス
2. **リスト画面**: SectionList（グループ化されたリスト）
3. **設定画面**: ScrollView + 複数セクション（padding: 20）
4. **カード型**: ホワイト背景、ボーダーラウンド（borderRadius: 10）

### フレックスレイアウト標準値
```
フルウィドス入力: width: '100%'
水平レイアウト: flexDirection: 'row'
中央配置: justifyContent: 'center', alignItems: 'center'
スペース配置: justifyContent: 'space-between'
```

## 6. ボーダー・シャドウ設定

### ボーダー設定
```
入力フィールド：
  borderWidth: 1
  borderColor: '#E5E5EA'
  borderRadius: 10

タグ（既存）：
  borderRadius: 20（丸いタグ）
  borderWidth: 1
  borderColor: '#E5E5EA'

タグ（選択中）：
  borderRadius: 12（やや丸め）
```

### シャドウ/エレベーション
- 現在、明示的なシャドウ設定なし
- iOS/Androidの標準のエレベーションに依存

## 7. 入力フィールド設定

### TextInput標準スタイル
```typescript
{
  height: 50,
  borderWidth: 1,
  borderColor: '#E5E5EA',
  borderRadius: 10,
  paddingHorizontal: 15,
  fontSize: 16,
  backgroundColor: '#F9F9F9'
}
```

### キーボード設定（プラットフォーム固有）
- EmailAddress入力: keyboardType="email-address"
- URL入力: keyboardType="url"
- パスワード: secureTextEntry={true}
- KeyboardAvoidingView: iOS使用時に"padding"動作

## 8. ボタンパターン

### プライマリボタン
```
backgroundColor: '#007AFF'
height: 50
borderRadius: 10
justifyContent: 'center'
alignItems: 'center'
```

### セカンダリ/バリエーションボタン
- ゲストボタン: #8E8E93（グレー）
- アップグレードボタン: #34C759（グリーン）
- 削除/危険ボタン: #FF3B30（レッド）
- ショートカットボタン: #5856D6（紫）

### ボタン無効状態
```
backgroundColor: '#B0B0B0'（全ボタン共通）
```

### テキストリンク
```
color: '#007AFF'
fontSize: 14
```

## 9. コンポーネント別スタイル仕様

### URLInput / TitleInput
```
section: marginBottom: 25
label: fontSize: 16, fontWeight: '600'
input: backgroundColor: '#FFFFFF'
```

### TagSelector
```
既存タグ（未選択）:
  backgroundColor: '#FFFFFF'
  borderRadius: 20
  paddingHorizontal: 16, paddingVertical: 8

既存タグ（選択）:
  backgroundColor: '#007AFF'
  
選択中タグ:
  backgroundColor: '#007AFF'
  borderRadius: 12
  paddingHorizontal: 12, paddingVertical: 6
```

## 10. ナビゲーション スタイル

### ボトムタブナビゲーター（MainNavigator）
```
tabBarActiveTintColor: '#007AFF'（アクティブタブの色）
tabBarInactiveTintColor: '#8E8E93'（非アクティブタブの色）
Ionicons使用（link, pricetags, settings）
```

### スタック型ナビゲーション
- デフォルトヘッダー使用
- headerShown設定で制御

## 11. レスポンシブ対応

### プラットフォーム固有処理
```typescript
Platform.OS === 'ios' ? 'padding' : 'height'（KeyboardAvoidingView）
Platform.OS === 'ios'（ショートカット機能）
Platform.OS === 'web'（確認ダイアログ）
```

### 画面サイズへの対応
- width: '100%'による自動スケーリング
- flexを使用した比率ベースのレイアウト
- 明示的なメディアクエリはなし

## 12. アニメーション

### Animated APIの使用
```typescript
- Animated.spring()（FABメニューのスプリングアニメーション）
- Animated.timing()（アニメーション終了時のタイミング制御）
- useNativeDriver: true（パフォーマンス最適化）
```

## 13. デザインパターンのギャップと改善機会

### 現在の課題
1. **カラー値のハードコード**: 各ファイルでカラーが重複定義
2. **スペーシング規約の未確立**: marginとpaddingがファイルごとに異なる
3. **フォントサイズの統一性**: 見出しサイズにばらつき
4. **デザイントークンの不在**: 一元管理される定数ファイルなし
5. **ダークモード未対応**: ライトモード固定
6. **再利用可能なスタイルコンポーネント不足**: 共通ボタン、入力フィールドなど

### 推奨される改善方向
1. `src/theme/colors.ts`, `src/theme/spacing.ts`などの統一定数ファイル作成
2. 共通のスタイルコンポーネント化（Button, Input, Card等）
3. TypeScript型で色とスペーシングの値の安全性を確保
4. ダークモード対応の準備（useColorSchemeフック活用）

## 14. 現在のUI要件と制約

### 必須フレームワーク・ライブラリ
- React Native 0.81.4
- React Navigation 7.x
- Ionicons（@expo/vector-icons 15.0.2）
- expo-status-bar

### 非使用ライブラリ
- styled-components （未導入）
- NativeWind / Tailwind CSS （未導入）
- UI コンポーネントライブラリ （Native Base等未導入）

### 採用決定の背景
- シンプルなアーキテクチャ維持
- React Nativeの標準API（StyleSheet）の活用
- 外部依存関係の最小化
