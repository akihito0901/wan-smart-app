# わんスマート (Wan Smart) 🐕

愛犬の基本的な健康管理と情報提供をシンプルに行えるWebサービス

## 🚀 主な機能

### ✅ 実装済み機能
- **ユーザー認証** - メールアドレスとパスワードによる登録・ログイン
- **給餌量チェッカー** - 科学的根拠に基づいた1日の推奨給餌量の自動計算
- **フードランキング** - 人気フードTOP表示とカテゴリー別フィルター
- **ワクチン記録** - 接種履歴の管理と次回予定日の自動表示
- **イベント情報** - 全国の犬関連イベント一覧と都道府県別フィルター

## 🛠 技術スタック

- **フロントエンド**: React 19, Next.js 15 (App Router), TypeScript
- **スタイリング**: Tailwind CSS 4
- **認証**: NextAuth.js 4
- **データベース**: PostgreSQL + Prisma ORM
- **フォーム**: React Hook Form + Zod
- **アイコン**: Lucide React
- **デプロイ**: Vercel

## 📋 セットアップ手順

1. **依存関係のインストール**
```bash
npm install
```

2. **環境変数の設定**
`.env`ファイルを作成し、以下を設定:
```bash
DATABASE_URL="your-postgresql-connection-string"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

3. **データベースの初期化**
```bash
npx prisma generate
npx prisma db push
```

4. **開発サーバーの起動**
```bash
npm run dev
```

5. **ブラウザでアクセス**
[http://localhost:3000](http://localhost:3000) を開く

## 📁 プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # APIエンドポイント
│   ├── auth/              # 認証関連ページ
│   ├── dashboard/         # ダッシュボード
│   ├── feeding-calculator/ # 給餌量チェッカー
│   ├── food-ranking/      # フードランキング
│   ├── vaccine-records/   # ワクチン記録
│   └── events/           # イベント情報
├── components/           # 再利用可能コンポーネント
└── lib/                 # ユーティリティ関数
```

## 🔧 スクリプト

- `npm run dev` - 開発サーバー起動
- `npm run build` - 本番ビルド
- `npm run start` - 本番サーバー起動
- `npm run lint` - ESLint実行

## 📊 データベーススキーマ

主要なテーブル:
- `users` - ユーザー情報
- `dogs` - 犬の基本情報
- `feeding_records` - 給餌記録
- `foods` - フード情報
- `vaccine_records` - ワクチン記録
- `events` - イベント情報

## 🎯 今後の拡張予定

- 健康記録の詳細機能
- 施設検索機能
- コミュニティ機能
- プッシュ通知
- 多言語対応

## 📝 ライセンス

MIT License

---

**このプロジェクトは Claude Code で開発されました** 🤖
