# Theme Studio

ブラウザ上でデザイントークン(色、タイポグラフィ、余白)をリアルタイムに編集し、スマホフレーム内でプレビューするツール。toDoneアプリのテーマ調整を主な用途として開発している。

## 技術スタック

| カテゴリ       | ツール                   |
| -------------- | ------------------------ |
| フレームワーク | React 19 + TypeScript    |
| ビルド         | Vite 6                   |
| 状態管理       | Zustand 5                |
| カラーピッカー | react-colorful           |
| テスト         | Vitest + Testing Library |
| E2Eテスト      | Playwright               |
| リンター       | ESLint + Prettier        |

## セットアップ

```bash
npm install
npm run dev         # http://localhost:7777
```

## コマンド一覧

| コマンド                | 内容                         |
| ----------------------- | ---------------------------- |
| `npm run dev`           | 開発サーバー起動             |
| `npm run build`         | プロダクションビルド         |
| `npm run lint`          | ESLintチェック               |
| `npm run format:check`  | Prettierフォーマットチェック |
| `npm run typecheck`     | TypeScript型チェック         |
| `npm test`              | ユニットテスト実行           |
| `npm run test:coverage` | カバレッジ付きテスト         |
| `npm run e2e`           | Playwright E2Eテスト         |

## 品質ゲート

### pre-commitフック

コミット時に自動実行される検査:

- Prettierフォーマットチェック
- ESLintリント
- TypeScript型チェック
- ユニットテスト
- gitleaksシークレットスキャン

### CI (GitHub Actions)

`main`ブランチへのpush/PRで実行:

- 上記すべて
- プロダクションビルド
- Playwright E2Eテスト
- gitleaksシークレットスキャン

## 設計書

詳細な設計はdocs/design.mdを参照。
