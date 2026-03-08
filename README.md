# FocusDock

FocusDock は、個人利用を前提にしたタスク管理アプリです。  
Next.js（App Router）で実装されており、データはブラウザの `localStorage` に保存されます。

## このシステムでできること

- タスクの登録（タイトル / 期限 / 優先度）
- タスクの自動分類
- `Today` / `今週` / `今後` / `Inbox` での管理
- ドラッグ&ドロップでの移動
- 完了 / 復帰 / 削除 / 削除取り消し（短時間）
- 完了履歴の検索・期間絞り込み
- 直近14日の完了推移分析
- 表示設定（完了表示日数、週次目標）
- JSON エクスポート / インポート（ローカルバックアップ）

## 画面構成

- `/` メイン画面
  - 日次運用の中心画面
  - タスク追加、ドラッグ移動、完了・削除操作
  - 週次目標の表示
- `/history` 履歴画面
  - 完了済みタスクを検索・期間フィルタで参照
- `/analytics` 分析画面
  - 総タスク数、完了数、達成率
  - 直近14日の日次完了件数と累積達成率
- `/settings` 設定画面
  - メイン画面の完了表示日数（今日のみ / 今日+昨日）
  - 今週の主要目標

## データ保存仕様

本システムはサーバーDBを利用せず、ブラウザに保存します。

- タスク本体: `focus-task-system-v1`
- 表示設定: `focus-task-settings-v1`

注意点:

- ブラウザ・端末・ユーザーが変わるとデータは共有されません。
- キャッシュ削除やブラウザ初期化でデータが失われる可能性があります。
- 長期運用時は定期的な JSON バックアップを推奨します。

## ローカル起動

```bash
npm install
npm run dev
```

`http://localhost:3000` を開いて動作確認します。

## スクリプト

```bash
npm run dev    # 開発サーバー起動
npm run build  # 本番ビルド
npm run start  # 本番サーバー起動
npm run lint   # ESLint 実行
```

## ディレクトリ概要

```text
src/
  app/
    page.tsx              # メイン画面
    analytics/page.tsx    # 分析画面
    history/page.tsx      # 履歴画面
    settings/page.tsx     # 設定画面
  lib/
    task-store.ts         # 型・分類・保存・日付ユーティリティ
public/                   # 静的アセット
```

## バックアップと復元

メイン画面の `JSON出力 / JSON読込` を使用します。

1. `JSON出力` でバックアップファイルを保存
2. 必要な環境で `JSON読込` を実行
3. 読み込み後に画面状態を確認

## 公開（Vercel）

### Web UI で公開

1. GitHub に push
2. Vercel の `New Project` で対象リポジトリを選択
3. `Deploy` 実行

### CLI で公開

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```
