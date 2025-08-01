# 🔄 Stripe Webhook + 自動メール送信システム

## 🎯 システム概要

決済完了 → Stripe Webhook → 自動メール送信 → YouTube動画URL配信

## 🛠️ 技術構成

### 1. Vercel Functions（推奨）

```javascript
// api/stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body, 
            sig, 
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }

    // 決済成功時の処理
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details.email;
        
        // メール送信
        await sendCourseEmail(customerEmail);
    }

    res.json({received: true});
}

async function sendCourseEmail(email) {
    const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '🎉【バイブコーディング革命】動画講座のアクセス情報',
        html: getEmailTemplate()
    };

    await transporter.sendMail(mailOptions);
}
```

### 2. メールテンプレート

```javascript
function getEmailTemplate() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .video-section { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; border-left: 5px solid #28a745; }
            .cta-button { background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; margin: 10px 0; }
            .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 0.9rem; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 バイブコーディング革命</h1>
                <p>動画講座へようこそ！</p>
            </div>
            
            <div class="content">
                <h2>🚀 今すぐ学習を開始できます</h2>
                <p>この度は「バイブコーディング革命」にご参加いただき、ありがとうございます！</p>
                <p>月額9,800円の固定費から解放される旅が始まります。</p>
                
                <div class="video-section">
                    <h3>📹 第1章：基礎編</h3>
                    <p><strong>動画URL：</strong> <a href="https://youtu.be/XXXXXX">https://youtu.be/XXXXXX</a></p>
                    <p><strong>パスワード：</strong> vibe2024basic</p>
                    <a href="https://youtu.be/XXXXXX" class="cta-button">今すぐ視聴する</a>
                </div>
                
                <div class="video-section">
                    <h3>📹 第2章：実践編</h3>
                    <p><strong>動画URL：</strong> <a href="https://youtu.be/YYYYYY">https://youtu.be/YYYYYY</a></p>
                    <p><strong>パスワード：</strong> vibe2024practice</p>
                    <a href="https://youtu.be/YYYYYY" class="cta-button">今すぐ視聴する</a>
                </div>
                
                <div class="video-section">
                    <h3>📹 第3章：応用編</h3>
                    <p><strong>動画URL：</strong> <a href="https://youtu.be/ZZZZZZ">https://youtu.be/ZZZZZZ</a></p>
                    <p><strong>パスワード：</strong> vibe2024advanced</p>
                    <a href="https://youtu.be/ZZZZZZ" class="cta-button">今すぐ視聴する</a>
                </div>
                
                <div class="video-section">
                    <h3>🎁 特典：整骨院特化テンプレート</h3>
                    <p><strong>ダウンロード：</strong> <a href="https://drive.google.com/XXXXXX">Google Drive</a></p>
                    <p>すぐに使える整骨院向けテンプレート集です。</p>
                </div>
                
                <h3>📋 学習の進め方</h3>
                <ol>
                    <li><strong>第1章</strong>から順番に視聴してください</li>
                    <li>実際に手を動かしながら学習することをお勧めします</li>
                    <li>わからないことがあれば、遠慮なくサポートメールまでご連絡ください</li>
                </ol>
                
                <h3>🛠️ サポート情報</h3>
                <p><strong>サポート期間：</strong> 3ヶ月間（無制限）</p>
                <p><strong>サポートメール：</strong> support@example.com</p>
                <p><strong>グループコンサル：</strong> 毎月第2土曜日 20:00-21:00（Zoom）</p>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4>⚠️ 重要なお知らせ</h4>
                    <p>このメールは大切に保管してください。動画URL・パスワードの再発行は原則として行っておりません。</p>
                </div>
            </div>
            
            <div class="footer">
                <p>バイブコーディング革命 | 月額9,800円を0円にするAI活用術</p>
                <p>何かご不明な点がございましたら、お気軽にお問い合わせください。</p>
                <p>あなたの成功を心から応援しています！</p>
            </div>
        </div>
    </body>
    </html>
    `;
}
```

## 🔧 環境変数設定

### Vercel環境変数
```bash
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 📝 セットアップ手順

### 1. Stripeダッシュボード設定

1. **商品作成**
   ```
   商品名: バイブコーディング革命講座
   価格: ¥19,800（一回払い）
   ```

2. **Webhook エンドポイント追加**
   ```
   URL: https://your-domain.vercel.app/api/stripe-webhook
   イベント: checkout.session.completed
   ```

### 2. YouTube動画準備

```
第1章（基礎編）:
- AI活用の基本概念
- Claude Codeアカウント作成
- 基本操作方法
- 時間: 約30分

第2章（実践編）:
- 整骨院HP実際制作
- テンプレートカスタマイズ
- レスポンシブ対応
- 時間: 約45分

第3章（応用編）:
- 予約システム連携
- SEO対策設定
- アクセス解析設置
- 時間: 約40分

第4章（運用編）:
- 保守・更新方法
- トラブルシューティング
- さらなる売上アップ施策
- 時間: 約35分
```

### 3. 特典ファイル準備

```
Google Drive フォルダ構成:
├── 整骨院テンプレート集/
│   ├── template-basic.html
│   ├── template-modern.html
│   └── template-professional.html
├── 予約システム連携マニュアル.pdf
├── SEO対策チェックリスト.pdf
└── サポート用資料/
```

## 🚀 デプロイ手順

### 1. Vercel デプロイ

```bash
# GitHubにプッシュ
git add .
git commit -m "Add Stripe webhook system"
git push origin main

# Vercel連携で自動デプロイ
# 環境変数を Vercel Dashboard で設定
```

### 2. テスト実行

```bash
# Stripe CLI でローカルテスト
stripe listen --forward-to localhost:3000/api/stripe-webhook
stripe trigger checkout.session.completed
```

## 📊 運用・分析

### 1. コンバージョン追跡

```javascript
// Google Analytics 4 設定
gtag('event', 'purchase', {
    transaction_id: session.id,
    value: 19800,
    currency: 'JPY',
    items: [{
        item_id: 'vibe-coding-course',
        item_name: 'バイブコーディング革命講座',
        category: 'online-course',
        quantity: 1,
        price: 19800
    }]
});
```

### 2. 顧客管理

```javascript
// Airtable or Notion での顧客管理
const customerData = {
    email: session.customer_details.email,
    purchaseDate: new Date().toISOString(),
    amount: 19800,
    status: 'active',
    supportEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
};
```

## 🔒 セキュリティ対策

1. **Webhook 署名検証**: 必須
2. **環境変数管理**: Vercel Secrets使用
3. **メール送信制限**: レート制限実装
4. **動画URL保護**: 限定公開 + パスワード

## 📈 改善・最適化案

1. **A/Bテスト**: LP の複数パターンテスト
2. **リターゲティング**: Facebook Pixel 設置
3. **アップセル**: 個別コンサル販売
4. **自動化拡張**: Zapier連携

---

**💡 このシステムで、完全自動化された販売フローが構築できます！**