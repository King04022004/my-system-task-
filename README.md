# FocusDock

個人用タスク管理システム（Next.js）です。

## ローカル起動

```bash
npm install
npm run dev
```

`http://localhost:3000` を開いて確認できます。

## 他ユーザーに公開する（最短）

このアプリは Next.js なので、Vercel で最短公開できます。

1. GitHub にこのプロジェクトを push
2. Vercel にログインして `New Project`
3. 該当リポジトリを選択して `Deploy`
4. 発行された URL を共有

## CLI で Vercel 公開する場合

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

## 注意事項（重要）

- 現在のデータ保存は `localStorage` です。
- そのため、**ユーザーごと・ブラウザごとにデータは別管理**です。
- 同じタスクを複数人で共有したい場合は、DB と認証の実装が必要です。

## バックアップ

画面右上の `JSON出力 / JSON読込` でローカルデータのバックアップと復元ができます。
