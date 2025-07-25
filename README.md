# わんスマート - 犬の散歩・ソーシャルアプリ 🐕

愛犬と一緒に楽しい散歩を！

## 機能

- 🔐 **Googleログイン機能** - Firebase Authentication
- 🗺️ **Googleマップ連携** - 現在位置、散歩コース、公園マーカー（一時無効）
- 👤 **プロフィール作成・編集** - ユーザーと愛犬の詳細情報管理
- 🚶‍♂️ **散歩記録** - GPS追跡による距離・時間計測
- 📊 **散歩履歴** - フィルター機能付き履歴表示
- 📷 **プロフィール画像** - Base64エンコードによる無料画像保存
- 🎂 **愛犬情報管理** - 誕生日、年齢自動計算、性別、犬種（26種類）
- 🔥 **Firebase Firestore連携** - リアルタイムデータ保存・読み込み
- 📱 **レスポンシブデザイン** - モバイルファーストUI/UX

## 最新アップデート

### v2.0 (2024年7月)
- ✅ Instagram風プロフィール画像アップロード
- ✅ Base64画像保存でコスト削減（Firebase Storage不使用）
- ✅ 自動年齢計算機能
- ✅ 拡張犬種リスト（26種類）
- ✅ 散歩距離・時間追跡
- ✅ 散歩履歴フィルター
- ✅ バグ修正とパフォーマンス改善

## デプロイ

https://wansmart.vercel.app/

## 技術スタック

- HTML5 / CSS3 / JavaScript (ES6+)
- Firebase v9 SDK
- Google Maps JavaScript API
- Google Identity Services

## セットアップ

1. Google Cloud ConsoleでMaps APIを有効化
2. Firebase Consoleでプロジェクト作成
3. Googleログイン認証設定
4. Vercelにデプロイ