# LinkDeck Design System

LinkDeckのデザインシステムは、Atlassian Design Systemの原則に基づいており、一貫性のあるUIとメンテナンス性の高いコードを実現します。

## 概要

このデザインシステムは、以下の要素で構成されています：

- **カラートークン**: ブランドカラー、セマンティックカラー、テキストカラー等
- **スペーシングトークン**: 8pxベースのスケールと意味的なスペーシング
- **タイポグラフィトークン**: フォントサイズ、ウェイト、行高
- **共通UIコンポーネント**: Button、Input、Card、Text等の再利用可能なコンポーネント

## 構造

```
src/theme/
├── colors.ts       - カラートークン定義
├── spacing.ts      - スペーシングトークン定義
├── typography.ts   - タイポグラフィトークン定義
└── tokens.ts       - すべてのトークンを一元エクスポート

src/components/ui/
├── Button.tsx      - ボタンコンポーネント
├── Input.tsx       - 入力フィールドコンポーネント
├── Card.tsx        - カードコンポーネント
└── Text.tsx        - テキストコンポーネント
```

## 使用方法

### トークンのインポート

```typescript
import { colors, spacing, semanticSpacing, textStyles } from '../../theme/tokens';
```

### カラートークン

```typescript
// プライマリカラー
backgroundColor: colors.primary,           // #007AFF

// サーフェスカラー
backgroundColor: colors.surface.default,   // #FFFFFF
backgroundColor: colors.surface.raised,    // #F9F9F9

// テキストカラー
color: colors.text.default,               // #000000
color: colors.text.subtle,                // #8E8E93

// セマンティックカラー
backgroundColor: colors.semantic.success, // #34C759
backgroundColor: colors.semantic.danger,  // #FF3B30
backgroundColor: colors.semantic.warning, // #FF9500
```

### スペーシングトークン

```typescript
// 基本スペーシング（8pxベース）
padding: spacing.space100,        // 8px
padding: spacing.space150,        // 12px
padding: spacing.space200,        // 16px
padding: spacing.space250,        // 20px

// セマンティックスペーシング
padding: semanticSpacing.screenPadding,    // 20px
marginBottom: semanticSpacing.sectionGap,  // 20px
borderRadius: semanticSpacing.radiusMedium, // 12px
height: semanticSpacing.inputHeight,        // 50px
```

### タイポグラフィトークン

```typescript
// 見出し
fontSize: textStyles.h1.fontSize,        // 32px
fontWeight: textStyles.h1.fontWeight,    // 'bold'

// 本文
fontSize: textStyles.body.fontSize,      // 16px
fontWeight: textStyles.body.fontWeight,  // '400'

// ラベル
fontSize: textStyles.label.fontSize,     // 14px
```

### 共通UIコンポーネント

#### Button

```typescript
import { Button } from '../../components/ui/Button';

<Button
  title="保存"
  onPress={handleSave}
  variant="primary"      // primary | secondary | success | danger | warning
  disabled={loading}
  loading={loading}
/>
```

#### Input

```typescript
import { Input } from '../../components/ui/Input';

<Input
  label="タイトル"
  value={title}
  onChangeText={setTitle}
  placeholder="タイトルを入力..."
  error={errorMessage}
/>
```

#### Card

```typescript
import { Card } from '../../components/ui/Card';

<Card raised padding="space250">
  <Text>カードコンテンツ</Text>
</Card>
```

#### Text

```typescript
import { Text } from '../../components/ui/Text';

<Text variant="h1" color="default">見出し</Text>
<Text variant="body" color="subtle">本文</Text>
<Text variant="caption" color="subtlest">キャプション</Text>
```

## デザイントークン一覧

### カラー

| トークン | 値 | 用途 |
|---------|-----|------|
| `colors.primary` | #007AFF | プライマリアクション、リンク |
| `colors.surface.default` | #FFFFFF | カード、入力フィールドの背景 |
| `colors.surface.raised` | #F9F9F9 | 浮き上がったサーフェス |
| `colors.background.default` | #F2F2F7 | 画面の背景 |
| `colors.text.default` | #000000 | メインテキスト |
| `colors.text.subtle` | #8E8E93 | 補助テキスト |
| `colors.border.default` | #E5E5EA | ボーダー |
| `colors.semantic.success` | #34C759 | 成功状態 |
| `colors.semantic.danger` | #FF3B30 | エラー、削除 |
| `colors.semantic.warning` | #FF9500 | 警告 |

### スペーシング

| トークン | 値 | 用途 |
|---------|-----|------|
| `spacing.space100` | 8px | 最小スペーシング |
| `spacing.space150` | 12px | 小さな要素間隔 |
| `spacing.space200` | 16px | 標準的な要素間隔 |
| `spacing.space250` | 20px | セクション間隔 |
| `semanticSpacing.screenPadding` | 20px | 画面の余白 |
| `semanticSpacing.sectionGap` | 20px | セクション間隔 |
| `semanticSpacing.inputHeight` | 50px | 入力フィールドの高さ |
| `semanticSpacing.radiusMedium` | 12px | 標準的なボーダー半径 |

### タイポグラフィ

| トークン | フォントサイズ | フォントウェイト | 用途 |
|---------|--------------|----------------|------|
| `textStyles.h1` | 32px | bold | メインタイトル |
| `textStyles.h2` | 24px | 600 | サブタイトル |
| `textStyles.h3` | 20px | 600 | セクションタイトル |
| `textStyles.body` | 16px | 400 | 本文 |
| `textStyles.label` | 14px | 400 | ラベル |
| `textStyles.caption` | 12px | 400 | キャプション |

## ベストプラクティス

1. **ハードコードされた値を避ける**: 常にデザイントークンを使用
2. **セマンティックトークンを優先**: `semanticSpacing.screenPadding`などの意味的なトークンを使用
3. **共通UIコンポーネントを活用**: 独自のボタンやインプットを作る前に、既存のコンポーネントを確認
4. **一貫性を保つ**: 同じ目的には常に同じトークンを使用

## ダークモード対応

現在、デザイントークンの構造はダークモードに対応可能な設計になっています。将来的にダークモードを実装する際は、`colors.ts`にダークモード用のカラーセットを追加し、テーマプロバイダーを実装することで簡単に対応できます。

## 参考資料

- [Atlassian Design System](https://atlassian.design/components)
- デザイントークンの詳細は各ファイルのコメントを参照してください
