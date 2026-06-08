# Theme Studio 設計書

## 1. プロダクト概要

### 1.1 目的

スマートフォンアプリのデザイントークン（色、タイポグラフィ、余白など）をブラウザ上でリアルタイムに調整し、スマホフレーム内でプレビューするツール。既存アプリの調整と新規画面の構築の両方に対応する。

### 1.2 対象ユーザー

- Web アプリのデザインを調整するフロントエンド開発者
- デザイナーと協業しながらテーマを策定するチーム

### 1.3 スコープ

| 対象                                  | 対象外                                                    |
| ------------------------------------- | --------------------------------------------------------- |
| ブラウザベースのテーマエディタ        | ネイティブアプリのビルド                                  |
| CSS カスタムプロパティの編集          | バックエンド API の設計                                   |
| デバイスフレーム内プレビュー          | アプリストアへの配信                                      |
| テーマの保存・エクスポート            | ユーザー認証・マルチテナント                              |
| ダーク/ライトモードのテーマバリアント | Canvas 画面の JSX/HTML エクスポート（Phase 4 以降で検討） |

---

## 2. 機能要件（MECE ロジックツリー）

機能要件を「何をするか」で分類し、システム基盤（どう作るか）は第 5 章で扱う。

```
Theme Studio
├── A. プレビュー機能
│   ├── A1. デバイスフレーム表示（共通基盤）
│   ├── A2. リアルタイム反映（共通基盤）
│   └── A3. プレビューモード
│       ├── A3a. iframe モード（既存アプリ読み込み）
│       └── A3b. Canvas モード（新規画面構築）
├── B. 編集機能
│   ├── B1. カラー設定
│   ├── B2. テキスト設定
│   ├── B3. 形状・シャドウ設定
│   ├── B4. 間隔・レイアウト設定
│   └── B5. アクセシビリティ・テーマバリアント設定
├── C. データ管理
│   ├── C1. テーマ保存・読み込み
│   ├── C2. エクスポート
│   └── C3. 履歴管理（Undo/Redo）
└── D. エラーハンドリング
    ├── D1. 接続エラー
    ├── D2. 保存エラー
    └── D3. インポートエラー
```

---

### A. プレビュー機能

#### A1. デバイスフレーム表示（共通基盤）

iframe モード・Canvas モードの両方で共有される表示基盤。

| 項目         | 仕様                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| 対応デバイス | iPhone 15 Pro (393×852), Pixel 8 (412×924), iPad Air (820×1180), Desktop (1280×800) |
| フレーム描画 | CSS によるデバイスベゼル再現（ノッチ、Dynamic Island 含む）                         |
| 拡縮         | ビューポートに合わせた自動スケーリング（transform: scale）                          |
| 切り替え     | ドロップダウンで即座にデバイスを変更                                                |

#### A2. リアルタイム反映（共通基盤）

トークン編集の結果をプレビューに即時反映する仕組み。iframe モード・Canvas モードの両方に適用される。

| トリガー           | 反映方法                             | 遅延目標                                     |
| ------------------ | ------------------------------------ | -------------------------------------------- |
| カラーピッカー操作 | CSS 変数即時注入                     | 同一オリジン: < 16ms、クロスオリジン: < 50ms |
| スライダー操作     | `requestAnimationFrame` でバッチ更新 | 同一オリジン: < 16ms、クロスオリジン: < 50ms |
| テキスト入力       | 300ms debounce 後に反映              | < 350ms                                      |

遅延目標の注記: クロスオリジン iframe はブラウザが別プロセスで描画するため、`postMessage` の IPC コスト（2-10ms）が加わる。同一オリジンの場合は `contentDocument.documentElement.style.setProperty` による直接注入で 1 フレーム以内を達成できる。

#### A3. プレビューモード

##### A3a. iframe モード（既存アプリ読み込み）

対象の Web アプリを iframe で読み込み、CSS カスタムプロパティを注入することでリアルタイムにテーマを反映する。

```
Studio (親ウィンドウ)
  │
  │ postMessage({ type: 'theme-update', tokens: {...} })
  ▼
iframe (既存アプリ)
  │
  └─ theme-bridge.js がメッセージを受信し CSS 変数を :root に適用
```

**前提条件**: 対象アプリが以下のいずれかを満たすこと。

1. CSS カスタムプロパティでテーマが定義されている
2. Studio が提供するブリッジスクリプト（`theme-bridge.js`）を読み込んでいる

**iframe サンドボックス**: sandbox 属性はロードする URL のオリジンに応じて動的に設定する。

- **同一オリジン URL**: `<iframe sandbox="allow-scripts allow-same-origin allow-forms">`（`contentDocument` 直接アクセスを許可）
- **クロスオリジン URL**: `<iframe sandbox="allow-scripts allow-forms">`（`allow-same-origin` を付与しない。`allow-scripts` + `allow-same-origin` の組み合わせはサンドボックスエスケープのリスクがあるため、クロスオリジンでは使用しない）

判定ロジック: 入力された URL の `new URL(input).origin` と `window.location.origin` を比較し、一致する場合のみ同一オリジンとして扱う。

**URL バリデーション**: ユーザーが入力する URL は `http://` または `https://` スキームのみ許可する。`javascript:` や `data:` スキームは拒否し、エラーメッセージを表示する。保存済み URL の復元時にも同じバリデーションを適用する。

**接続フロー**:

1. URL 入力欄に対象アプリのアドレスを入力（スキームバリデーション実施）
2. iframe に読み込み、`postMessage` で ping を送信
3. ブリッジ応答を 3000ms 以内に受信したら接続確立 → **状態 A: ブリッジ接続**
4. 3000ms タイムアウト後、同一オリジンなら `contentDocument` へ直接アクセスを試行 → **状態 B: 同一オリジン直接注入**（ページ内遷移時にスタイルがリセットされる旨を警告表示）
5. 上記いずれも失敗 → **状態 C: 接続失敗**（「ブリッジスクリプトの追加手順」へのリンクを含むエラー UI を表示）

##### A3b. Canvas モード（新規画面構築）

コンポーネントパレットからドラッグ&ドロップで画面を構築する。コンポーネントは React コンポーネントとしてレンダリングされ、CSS カスタムプロパティを通じてテーマトークンを消費する。

**レンダリング方式**: React コンポーネントツリーとして描画。`ScreenNode` を再帰的に走査し、対応する React コンポーネントを生成する。Canvas 要素ではなく DOM ベースのため、CSS カスタムプロパティがそのまま適用される。

**コンポーネントパレット**:

| カテゴリ       | コンポーネント                      |
| -------------- | ----------------------------------- |
| レイアウト     | Stack, Grid, Spacer, Divider        |
| テキスト       | Heading, Paragraph, Label, Badge    |
| 入力           | TextField, Checkbox, Toggle, Select |
| ナビゲーション | AppBar, TabBar, BottomNav, FAB      |
| フィードバック | Toast, Dialog, ProgressBar          |
| データ表示     | Card, List, ListItem, Avatar, Icon  |

**制約**: `ListItem` は `List` の子要素としてのみ配置可能。`BottomNav` は `Screen.root` の直下にのみ配置可能。

**操作**:

- ドラッグ&ドロップで配置（パレットからキャンバスへのドロップ）
- クリックでプロパティパネルを表示（テキスト内容、色、サイズ）
- 右クリックコンテキストメニュー: 複製、削除、前面/背面移動
- コンポーネントツリーペインで階層構造を編集（react-arborist による表示）

**前面/背面移動の仕組み**: `children` 配列のインデックス順が DOM の描画順序を決定する。「前面へ移動」は配列末尾への移動、「背面へ移動」は配列先頭への移動として実装する。絶対配置の要素間では `z-index` は使用しない（フローレイアウトを前提）。

**DnD 実装の注記**: @dnd-kit/core の `DndContext` をネストして使用し、ツリー構造内への深い階層ドロップに対応する。コンポーネントツリーペインには react-arborist を使用し、パレットからキャンバスへのドロップには @dnd-kit を使用する。

**データモデル**:

```typescript
type ScreenNodeType =
  | 'Stack'
  | 'Grid'
  | 'Spacer'
  | 'Divider'
  | 'Heading'
  | 'Paragraph'
  | 'Label'
  | 'Badge'
  | 'TextField'
  | 'Checkbox'
  | 'Toggle'
  | 'Select'
  | 'AppBar'
  | 'TabBar'
  | 'BottomNav'
  | 'FAB'
  | 'Toast'
  | 'Dialog'
  | 'ProgressBar'
  | 'Card'
  | 'List'
  | 'ListItem'
  | 'Avatar'
  | 'Icon';

type ScreenNode = {
  id: string;
  type: ScreenNodeType;
  props: Record<string, unknown>;
  children: ScreenNode[];
  style: Record<string, string>;
};

type Screen = {
  id: string;
  name: string;
  root: ScreenNode;
};
```

---

### B. 編集機能

#### B1. カラー設定

| トークン名               | 用途                         | デフォルト値（Light） | デフォルト値（Dark） |
| ------------------------ | ---------------------------- | --------------------- | -------------------- |
| `--color-primary`        | アクセントカラー             | `#4F46E5`             | `#818CF8`            |
| `--color-primary-light`  | プライマリの明るいバリアント | `#818CF8`             | `#A5B4FC`            |
| `--color-secondary`      | セカンダリアクセント         | `#EC4899`             | `#F472B6`            |
| `--color-surface`        | カード・モーダル背景         | `#FFFFFF`             | `#1F2937`            |
| `--color-background`     | 画面全体の背景               | `#F9FAFB`             | `#111827`            |
| `--color-text-primary`   | メインテキスト               | `#111827`             | `#F9FAFB`            |
| `--color-text-secondary` | サブテキスト                 | `#6B7280`             | `#9CA3AF`            |
| `--color-text-accent`    | アクセントテキスト           | `#4F46E5`             | `#818CF8`            |
| `--color-border`         | ボーダー                     | `#E5E7EB`             | `#374151`            |
| `--color-error`          | エラー表示                   | `#EF4444`             | `#FCA5A5`            |
| `--color-success`        | 成功表示                     | `#10B981`             | `#6EE7B7`            |
| `--color-warning`        | 警告表示                     | `#F59E0B`             | `#FCD34D`            |

**UI**: カラーピッカー（HSL モード対応）+ Hex 直接入力 + 透過度スライダー。カラー形式は Hex/HSL を使用し、OKLCH は将来対応として Phase 4 以降で検討する。

#### B2. テキスト設定

| トークン名              | 用途           | デフォルト値          |
| ----------------------- | -------------- | --------------------- |
| `--font-family-base`    | 本文フォント   | `"Inter", sans-serif` |
| `--font-family-heading` | 見出しフォント | `"Inter", sans-serif` |
| `--font-size-xs`        | 極小テキスト   | `0.75rem`             |
| `--font-size-sm`        | 小テキスト     | `0.875rem`            |
| `--font-size-base`      | 本文           | `1rem`                |
| `--font-size-lg`        | 大テキスト     | `1.125rem`            |
| `--font-size-xl`        | 見出し         | `1.25rem`             |
| `--font-size-2xl`       | 大見出し       | `1.5rem`              |
| `--font-weight-normal`  | 通常           | `400`                 |
| `--font-weight-medium`  | 中太           | `500`                 |
| `--font-weight-bold`    | 太字           | `700`                 |
| `--line-height-tight`   | 詰め           | `1.25`                |
| `--line-height-normal`  | 通常           | `1.5`                 |
| `--line-height-relaxed` | ゆったり       | `1.75`                |

**UI**: フォントファミリーは定義済みリスト（Inter, Noto Sans JP, Roboto, SF Pro Text, System UI）からドロップダウンで選択。選択時に `<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">` タグを動的に挿入してロードする（`fetch()` は使用しない）。自由入力は不可（未ロードフォントの表示崩れを防止）。サイズスライダー + ウェイトセレクター。

#### B3. 形状・シャドウ設定

| トークン名        | 用途             | デフォルト値                  |
| ----------------- | ---------------- | ----------------------------- |
| `--radius-sm`     | 小要素の角丸     | `4px`                         |
| `--radius-md`     | カードの角丸     | `8px`                         |
| `--radius-lg`     | モーダルの角丸   | `16px`                        |
| `--radius-full`   | ピルボタンの角丸 | `9999px`                      |
| `--shadow-sm`     | 軽い影           | `0 1px 2px rgba(0,0,0,0.05)`  |
| `--shadow-md`     | カードの影       | `0 4px 6px rgba(0,0,0,0.07)`  |
| `--shadow-lg`     | モーダルの影     | `0 10px 15px rgba(0,0,0,0.1)` |
| `--shape-opacity` | サーフェス透過度 | `1`                           |

**UI**: 角丸スライダー + シャドウプリセット選択 + 透過度スライダー

#### B4. 間隔・レイアウト設定

| トークン名      | 用途         | デフォルト値 |
| --------------- | ------------ | ------------ |
| `--spacing-xs`  | 極小余白     | `4px`        |
| `--spacing-sm`  | 小余白       | `8px`        |
| `--spacing-md`  | 中余白       | `16px`       |
| `--spacing-lg`  | 大余白       | `24px`       |
| `--spacing-xl`  | 極大余白     | `32px`       |
| `--spacing-2xl` | セクション間 | `48px`       |

**UI**: スペーシングスケールのビジュアルプレビュー + 個別スライダー

#### B5. アクセシビリティ・テーマバリアント設定

**ダーク/ライトモード切り替え**:

テーマは Light/Dark の 2 バリアントを持つ。エディタ上部にトグルスイッチを配置し、プレビュー内のテーマバリアントを切り替える。各カラートークンは Light/Dark の両方の値を保持する。

**コントラストチェック**:

カラーピッカーの横に WCAG コントラスト比を表示する。

| 表示     | 条件                                                          |
| -------- | ------------------------------------------------------------- |
| AA Pass  | コントラスト比 >= 4.5:1（通常テキスト）、>= 3:1（大テキスト） |
| AAA Pass | コントラスト比 >= 7:1（通常テキスト）、>= 4.5:1（大テキスト） |
| Fail     | 基準未達                                                      |

テキスト色 (`--color-text-*`) を編集する際、背景色 (`--color-background`, `--color-surface`) との組み合わせでコントラスト比を自動計算し、結果をカラーピッカー横にバッジで表示する。

---

### C. データ管理

#### C1. テーマ保存・読み込み

**保存先**: ブラウザの `localStorage` をプライマリとし、JSON ファイルへのエクスポートも可能にする。

**容量制限**: `localStorage` 使用量が 4MB を超えた場合に警告を表示し、JSON エクスポートによるバックアップを促す。保存可能テーマ数の上限は設けないが、合計サイズで制御する。

**テーマデータ構造**:

```typescript
type Theme = {
  id: string;
  name: string;
  schemaVersion: number; // 現在: 1。スキーマ変更時にインクリメント
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  activeVariant: 'light' | 'dark';
  tokens: {
    light: {
      colors: Record<string, string>;
      typography: Record<string, string>;
      shapes: Record<string, string>;
      spacing: Record<string, string>;
    };
    dark: {
      colors: Record<string, string>;
      typography: Record<string, string>;
      shapes: Record<string, string>;
      spacing: Record<string, string>;
    };
  };
  screens: Screen[]; // Canvas モードで作成した画面
};
```

**スキーママイグレーション**: `localStorage` からの読み込み時に `schemaVersion` を確認し、現在のバージョンより古い場合はマイグレーション関数を適用する。不足するトークンはデフォルト値で補完する。

```typescript
function migrateTheme(saved: unknown): Theme {
  // schemaVersion が無い or 古い場合、段階的にマイグレーション
  // v0 → v1: schemaVersion フィールド追加、tokens を light/dark に分割
}
```

**操作**:

- 保存: Ctrl+S / Cmd+S で即座に `localStorage` へ永続化
- 読み込み: テーマ一覧パネルから選択
- 複製: 既存テーマをベースに新しいテーマを作成
- 削除: 確認ダイアログ付き

#### C2. エクスポート

**トークンエクスポート**:

| 形式     | 内容                              | 用途                                     |
| -------- | --------------------------------- | ---------------------------------------- |
| CSS      | `:root { --color-primary: ...; }` | そのまま CSS に貼り付け                  |
| JSON     | トークンの key-value              | アプリのテーマ設定ファイルとして読み込み |
| Tailwind | `theme.extend.colors` 形式        | tailwind.config に統合                   |

**Canvas 画面エクスポート**: Canvas モードで作成した画面の JSX/HTML エクスポートは Phase 4 以降のスコープとする。現時点では JSON 形式の `ScreenNode` ツリーとしてのみエクスポート可能。

#### C3. 履歴管理（Undo/Redo）

**方式**: コマンドパターンによるイミュータブルな状態スナップショット

**スコープ**: 統一履歴。トークン編集と Canvas 操作の両方が同一の履歴スタックに記録される。各スナップショットは `tokens`（Light/Dark 両バリアント）と `screens` の完全な状態を含む。バリアント切り替え後の Undo でも、切り替え前に行った変更が正しく復元される。

```
[State_0] → [State_1] → [State_2] → [State_3]
                          ↑ current
                          Undo → State_1
                          Redo → State_3
```

| 項目           | 仕様                                                     |
| -------------- | -------------------------------------------------------- |
| 最大履歴数     | 50 ステップ（超過時は最古のスナップショットを破棄）      |
| ショートカット | Ctrl+Z / Cmd+Z (Undo), Ctrl+Shift+Z / Cmd+Shift+Z (Redo) |
| 初期値リセット | 「初期値」ボタンで State_0 に戻す                        |

---

### D. エラーハンドリング

#### D1. 接続エラー（iframe モード）

| 状況                                  | 検出方法                   | ユーザーへの表示                                                           | 回復アクション                 |
| ------------------------------------- | -------------------------- | -------------------------------------------------------------------------- | ------------------------------ |
| URL が不正（javascript:, data: 等）   | スキームバリデーション     | 「http:// または https:// の URL を入力してください」                      | 入力欄をフォーカス             |
| ネットワークエラー / 404              | iframe の `error` イベント | 「指定した URL に接続できません」                                          | リトライボタン表示             |
| ブリッジ未応答（3000ms タイムアウト） | ping 応答待ちタイムアウト  | 「ブリッジスクリプトが検出されません。セットアップ手順を確認してください」 | セットアップガイドへのリンク   |
| CORS / X-Frame-Options でブロック     | iframe 読み込み失敗        | 「このアプリは iframe 内での表示を許可していません」                       | 対象アプリの設定変更手順を表示 |

#### D2. 保存エラー

| 状況                           | 検出方法                                   | ユーザーへの表示                                                                                    | 回復アクション                            |
| ------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `localStorage` 容量超過        | `try/catch` で `QuotaExceededError` を補足 | 「保存容量が不足しています。不要なテーマを削除するか、JSON エクスポートでバックアップしてください」 | テーマ一覧 + エクスポートダイアログを開く |
| `localStorage` 使用量 4MB 超過 | 保存前にサイズチェック                     | 「保存容量が残りわずかです」（警告バナー）                                                          | エクスポート促進                          |

#### D3. インポートエラー

| 状況                           | 検出方法                               | ユーザーへの表示                                                   | 回復アクション                     |
| ------------------------------ | -------------------------------------- | ------------------------------------------------------------------ | ---------------------------------- |
| JSON パース失敗                | `JSON.parse` の例外                    | 「ファイルの形式が正しくありません」                               | ファイル再選択                     |
| スキーマ不一致                 | `schemaVersion` と必須フィールドの検証 | 「テーマファイルの形式が古いか不完全です。互換変換を試みますか？」 | マイグレーション適用 or キャンセル |
| URL フィールドに不正なスキーム | スキームバリデーション                 | 「インポートされた URL が安全でないため除外しました」              | URL フィールドを空にして読み込み   |

---

## 3. 非機能要件

| 区分             | 要件                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| パフォーマンス   | 同一オリジン: < 16ms（1 フレーム）、クロスオリジン: < 50ms             |
| ブラウザ対応     | Chrome, Firefox, Safari の最新 2 バージョン                            |
| アクセシビリティ | キーボード操作でのトークン編集、ARIA ラベル、WCAG コントラストチェック |
| レスポンシブ     | Studio 自体は 1280px 以上のデスクトップ向け                            |
| データ永続性     | localStorage ベース、JSON エクスポートによるバックアップ               |

---

## 4. 画面構成

### 4.1 メイン画面

```
┌─────────────────────────────────────────────────────────────────┐
│ ヘッダー: [Theme Studio]  [テーマ名]  [Light/Dark ◐]  [Save]   │
├──────────────────────┬──────────────────────────────────────────┤
│                      │                                          │
│   編集パネル          │   プレビューパネル                         │
│   (幅: 320px 固定)    │   (残り幅)                               │
│                      │                                          │
│   ┌────────────────┐ │   ┌──────────────────────────┐           │
│   │ デバイス選択    │ │   │                          │           │
│   ├────────────────┤ │   │   ┌──────────────────┐   │           │
│   │ 画面ナビ       │ │   │   │                  │   │           │
│   │ (iframe: 参照   │ │   │   │  デバイスフレーム  │   │           │
│   │  画面切替タブ   │ │   │   │                  │   │           │
│   │  Canvas: 画面   │ │   │   │  iframe / Canvas │   │           │
│   │  リストと追加)  │ │   │   │                  │   │           │
│   ├────────────────┤ │   │   │                  │   │           │
│   │ アクセント      │ │   │   └──────────────────┘   │           │
│   │  [■] #4F46E5   │ │   │                          │           │
│   │  AA ✓ 8.1:1    │ │   └──────────────────────────┘           │
│   │  [■] #EC4899   │ │                                          │
│   │  透過度 ───●── │ │   [デバイス: iPhone 15 Pro ▼]            │
│   ├────────────────┤ │                                          │
│   │ テキスト        │ │                                          │
│   │  主テキスト     │ │                                          │
│   │  副テキスト     │ │                                          │
│   ├────────────────┤ │                                          │
│   │ 形状・シャドウ   │ │                                          │
│   │  角丸 ───●──   │ │                                          │
│   │  シャドウ [▼]   │ │                                          │
│   ├────────────────┤ │                                          │
│   │ 背景           │ │                                          │
│   │  画面バック     │ │                                          │
│   │  ヘッダ背景     │ │                                          │
│   └────────────────┘ │                                          │
│                      │                                          │
│  [戻す] [初期値] [Save]│                                         │
└──────────────────────┴──────────────────────────────────────────┘
```

**画面ナビの説明**:

- **iframe モード時**: 対象アプリ内のページを切り替えるタブ（デイリー、月、追加シート、メニュー等）。各タブは iframe 内の URL パスに対応する
- **Canvas モード時**: 作成した画面のリストと「+ 新規画面」ボタン。選択した画面がプレビューに表示される

### 4.2 画面遷移

```
メイン画面
├── iframe モード（既存アプリ調整）
│   ├── URL 入力 → スキームバリデーション → 接続確立 or エラー表示
│   ├── トークン編集 → リアルタイム反映
│   └── Save → localStorage + アプリへ通知
├── Canvas モード（新規画面構築）
│   ├── コンポーネントパレットから DnD
│   ├── プロパティ編集
│   └── Save → localStorage
├── テーマ一覧ダイアログ
│   ├── テーマ選択 → 読み込み（マイグレーション適用）
│   ├── テーマ複製
│   └── テーマ削除（確認ダイアログ）
└── エクスポートダイアログ
    ├── CSS 出力
    ├── JSON 出力
    └── Tailwind 設定出力
```

---

## 5. アーキテクチャ・技術スタック

### 5.1 全体構成

```
┌─────────────────────────────────────────────────────────────┐
│ Theme Studio (localhost:7777)                                │
│                                                             │
│  ┌──────────────┐    ┌──────────────────────────────┐       │
│  │ EditorPanel  │    │ PreviewPanel                 │       │
│  │              │    │  ┌──────────────────────┐    │       │
│  │  TokenEditor ├────►  │ DeviceFrame          │    │       │
│  │  ScreenTree  │    │  │  ┌────────────────┐  │    │       │
│  │  ThemeList   │    │  │  │ iframe (モードA)│  │    │       │
│  │              │    │  │  │ Canvas (モードB)│  │    │       │
│  └──────────────┘    │  │  └────────────────┘  │    │       │
│                      │  └──────────────────────┘    │       │
│  ┌──────────────┐    └──────────────────────────────┘       │
│  │ ThemeStore   │                                           │
│  │ (Zustand)    │                                           │
│  │ - tokens     │                                           │
│  │ - history    │                                           │
│  │ - screens    │                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
         │ postMessage
         ▼
┌─────────────────────────────────────────────────────────────┐
│ 対象アプリ (localhost:6001)                                   │
│  theme-bridge.js がメッセージを受信し CSS 変数を :root に適用    │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 コンポーネント構成

```
src/
├── components/
│   ├── editor/
│   │   ├── EditorPanel.tsx        # 編集パネル全体
│   │   ├── ColorTokenEditor.tsx   # カラートークン編集 + コントラストバッジ
│   │   ├── TypographyEditor.tsx   # テキスト設定編集
│   │   ├── ShapeEditor.tsx        # 形状・シャドウ編集
│   │   ├── SpacingEditor.tsx      # 間隔設定編集
│   │   └── ScreenTreeEditor.tsx   # 画面コンポーネントツリー（react-arborist）
│   ├── preview/
│   │   ├── PreviewPanel.tsx       # プレビューパネル全体
│   │   ├── DeviceFrame.tsx        # デバイスフレーム
│   │   ├── IframePreview.tsx      # iframe モード
│   │   └── CanvasPreview.tsx      # Canvas モード（React レンダリング）
│   ├── theme/
│   │   ├── ThemeList.tsx          # テーマ一覧
│   │   └── ExportDialog.tsx       # エクスポートダイアログ
│   └── ui/
│       ├── ColorPicker.tsx        # カラーピッカー + コントラスト表示
│       ├── Slider.tsx             # スライダー
│       └── DeviceSelector.tsx     # デバイス選択
├── stores/
│   └── themeStore.ts              # Zustand ストア（トークン + 履歴 + 画面）
├── lib/
│   ├── tokens.ts                  # デフォルトトークン定義 + flatten/unflatten
│   ├── export.ts                  # エクスポートロジック
│   ├── bridge.ts                  # postMessage 通信
│   ├── contrast.ts               # WCAG コントラスト比計算
│   ├── migrate.ts                 # テーマスキーママイグレーション
│   └── validate.ts               # URL・インポートバリデーション
├── hooks/
│   ├── useThemeHistory.ts         # Undo/Redo
│   └── useDeviceScale.ts          # フレームスケーリング
└── App.tsx
```

### 5.3 技術スタック

| レイヤー             | 技術                | 選定理由                                 |
| -------------------- | ------------------- | ---------------------------------------- |
| フレームワーク       | React 19 + Vite     | 高速 HMR、軽量                           |
| 状態管理             | Zustand             | シンプル、イミュータブル履歴と相性が良い |
| スタイリング         | Tailwind CSS v4     | ユーティリティクラスで高速開発           |
| カラーピッカー       | react-colorful      | 軽量（2KB gzip）、HSL 対応               |
| DnD（Canvas モード） | @dnd-kit/core       | React 専用、アクセシブル、ネスト対応     |
| ツリー表示           | react-arborist      | Canvas コンポーネントツリーの表示・操作  |
| ビルド               | Vite                | 開発サーバー＋本番ビルド                 |
| テスト               | Vitest + Playwright | ユニット＋E2E                            |

**Tailwind CSS スコープ分離**: Studio の UI に適用される Tailwind CSS は `@layer studio { }` でスコープし、iframe プレビューへの漏れ出しを防止する。テーマトークンの CSS 変数名前空間（`--color-*`, `--font-*`, `--radius-*`, `--shadow-*`, `--spacing-*`）は Tailwind が生成する変数と衝突しない命名規則を採用している。

### 5.4 Studio ↔ プレビュー間通信

**プロトコル**: `window.postMessage` による双方向メッセージング

**メッセージ型**:

```typescript
// Studio → プレビュー
type ThemeUpdateMessage = {
  type: 'theme-update';
  tokens: Record<string, string>; // フラット形式: CSS 変数名 → 値
};

type PingMessage = {
  type: 'theme-studio-ping';
};

// プレビュー → Studio
type PongMessage = {
  type: 'theme-studio-pong';
  appName: string;
  supportedTokens: string[];
};

type TokenListMessage = {
  type: 'theme-studio-tokens';
  currentTokens: Record<string, string>;
};
```

**トークンのシリアライゼーション**: `Theme.tokens` はカテゴリ別のネスト構造で保存されるが、通信時には `lib/tokens.ts` の `flattenTokens()` でフラット化する。ブリッジからの受信時には `unflattenTokens()` でネスト構造に復元する。

```typescript
// flattenTokens({ colors: { '--color-primary': '#4F46E5' }, ... })
// → { '--color-primary': '#4F46E5', ... }

// unflattenTokens({ '--color-primary': '#4F46E5', '--font-size-base': '1rem', ... })
// → { colors: { '--color-primary': '#4F46E5' }, typography: { '--font-size-base': '1rem' }, ... }
```

### 5.5 ブリッジスクリプト（theme-bridge.js）

対象アプリが読み込むスクリプト。

**責務**:

1. Studio からの `postMessage` をリスンし CSS 変数を `:root` に適用
2. 初回接続時に現在のトークン値を Studio へ返送
3. アプリ内でのテーマ変更を Studio へ通知

**セキュリティ要件**:

- `event.origin` でメッセージ送信元を検証する。許可するオリジンは `data-studio-origin` 属性で指定する: `<script src="theme-bridge.js" data-studio-origin="http://localhost:7777"></script>`
- `event.origin === 'null'`（サンドボックス iframe のオリジン）は明示的に拒否する
- ブリッジスクリプトの責務を厳密に制限する: `:root` の CSS 変数の読み書きと `postMessage` の送受信のみ。Cookie へのアクセス、DOM の構造変更、ネットワークリクエストは行わない
- 本番デプロイ時には SRI（Subresource Integrity）ハッシュを付与して読み込む: `<script src="theme-bridge.js" integrity="sha384-..." crossorigin="anonymous"></script>`
- 対象アプリの CSP に Studio のオリジンを追加する必要がある

### 5.6 Studio アプリの CSP

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data:;
  frame-src *;
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
```

`frame-src *` は任意の URL を iframe で読み込むために必要。他のディレクティブは厳格に制限する。

---

## 6. 実装フェーズ

| フェーズ | 内容                                                                                                                                                           | 成果物                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Phase 1  | デバイスフレーム + カラートークン編集 + iframe プレビュー + コントラストチェック                                                                               | MVP: 既存アプリの色調整  |
| Phase 2  | テキスト・形状・間隔設定 + Undo/Redo + テーマ保存 + ダーク/ライト切替                                                                                          | 全トークン編集           |
| Phase 3a | Canvas モード: レイアウト・テキストコンポーネント（Stack, Grid, Spacer, Divider, Heading, Paragraph, Label, Badge）                                            | 基本画面構築             |
| Phase 3b | Canvas モード: 入力・ナビ・フィードバック・データ表示コンポーネント                                                                                            | 全コンポーネント対応     |
| Phase 4  | エクスポート + テーマ一覧 + 複数デバイス + OKLCH 対応検討 + Canvas 画面エクスポート                                                                            | 完成版                   |
| Phase 5  | コンポーネント個別調整（編集モード）: iframe 内要素のクリック選択 → 要素固有スタイルの GUI 編集（角丸、padding、色、シャドウ等）→ 要素単位のオーバーライド管理 | コンポーネントレベル調整 |

---

## 7. toDone サンプルアプリ仕様

Theme Studio の動作確認対象として、toDone（タスク管理アプリ）を別プロジェクトとして構築する。

### 7.1 機能

| 機能                 | 説明                                            |
| -------------------- | ----------------------------------------------- |
| タスク一覧           | 日付別にタスクを表示                            |
| タスク追加           | FAB ボタンからタスクを追加                      |
| タスク完了           | チェックボックスで完了状態を切り替え            |
| カテゴリタグ         | タスクにカテゴリ（仕事、買い物、勉強 等）を付与 |
| 優先度               | 高・中・低の3段階                               |
| ボトムナビゲーション | デイリー、カレンダー、設定                      |

### 7.2 テーマ対応

すべてのスタイルを CSS カスタムプロパティで定義し、`theme-bridge.js` を `data-studio-origin="http://localhost:7777"` 付きで読み込むことで Theme Studio からのリアルタイム調整に対応する。

### 7.3 技術スタック

| 項目           | 技術                                  |
| -------------- | ------------------------------------- |
| フレームワーク | React 19 + Vite                       |
| スタイリング   | CSS Modules + CSS カスタムプロパティ  |
| 状態管理       | useState / useReducer（小規模のため） |
| ポート         | localhost:6001                        |
