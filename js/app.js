// Firebase v9 Compat SDK
// Firebase設定
const firebaseConfig = {
    apiKey: "AIzaSyBll0ydrEznuFn2E1ghHl-59fU5_h8uAHI",
    authDomain: "wansmart-16538.firebaseapp.com",
    projectId: "wansmart-16538",
    storageBucket: "wansmart-16538.firebasestorage.app",
    messagingSenderId: "402202482459",
    appId: "1:402202482459:web:fc01c3293686566e56a5be",
    measurementId: "G-L6MYJPKSNK"
};

// Firebase初期化
let app, auth, db, analytics;

try {
    console.log('🐕 DogLife Firebase初期化開始...');
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    
    try {
        analytics = firebase.analytics();
        console.log('📊 Analytics初期化完了');
    } catch (analyticsError) {
        console.warn('Analytics初期化スキップ:', analyticsError.message);
    }
    
    console.log('✅ Firebase初期化完了');
} catch (error) {
    console.error('❌ Firebase初期化エラー:', error);
    alert('Firebase初期化に失敗しました: ' + error.message);
}

// 50犬種データ
const DOG_BREEDS = [
    { id: 'toy-poodle', name: 'トイプードル', emoji: '🐩', size: 'small' },
    { id: 'chihuahua', name: 'チワワ', emoji: '🐕', size: 'small' },
    { id: 'shiba-inu', name: '柴犬', emoji: '🐕', size: 'medium' },
    { id: 'dachshund', name: 'ダックスフンド', emoji: '🐕', size: 'small' },
    { id: 'pomeranian', name: 'ポメラニアン', emoji: '🐕', size: 'small' },
    { id: 'yorkshire-terrier', name: 'ヨークシャーテリア', emoji: '🐕', size: 'small' },
    { id: 'maltese', name: 'マルチーズ', emoji: '🐕', size: 'small' },
    { id: 'shih-tzu', name: 'シーズー', emoji: '🐕', size: 'small' },
    { id: 'pug', name: 'パグ', emoji: '🐕', size: 'small' },
    { id: 'french-bulldog', name: 'フレンチブルドッグ', emoji: '🐕', size: 'medium' },
    { id: 'bulldog', name: 'ブルドッグ', emoji: '🐕', size: 'medium' },
    { id: 'beagle', name: 'ビーグル', emoji: '🐕', size: 'medium' },
    { id: 'corgi', name: 'コーギー', emoji: '🐕', size: 'medium' },
    { id: 'border-collie', name: 'ボーダーコリー', emoji: '🐕', size: 'large' },
    { id: 'golden-retriever', name: 'ゴールデンレトリバー', emoji: '🐕‍🦺', size: 'large' },
    { id: 'labrador', name: 'ラブラドール', emoji: '🐕‍🦺', size: 'large' },
    { id: 'husky', name: 'シベリアンハスキー', emoji: '🐺', size: 'large' },
    { id: 'german-shepherd', name: 'ジャーマンシェパード', emoji: '🐕‍🦺', size: 'large' },
    { id: 'akita', name: '秋田犬', emoji: '🐕', size: 'large' },
    { id: 'japanese-spitz', name: '日本スピッツ', emoji: '🐕', size: 'medium' },
    { id: 'cavalier', name: 'キャバリア', emoji: '🐕', size: 'small' },
    { id: 'cocker-spaniel', name: 'アメリカンコッカースパニエル', emoji: '🐕', size: 'medium' },
    { id: 'miniature-schnauzer', name: 'ミニチュアシュナウザー', emoji: '🐕', size: 'small' },
    { id: 'boston-terrier', name: 'ボストンテリア', emoji: '🐕', size: 'small' },
    { id: 'jack-russell', name: 'ジャックラッセルテリア', emoji: '🐕', size: 'small' },
    { id: 'italian-greyhound', name: 'イタリアングレーハウンド', emoji: '🐕', size: 'small' },
    { id: 'papillon', name: 'パピヨン', emoji: '🐕', size: 'small' },
    { id: 'bichon-frise', name: 'ビション・フリーゼ', emoji: '🐕', size: 'small' },
    { id: 'min-pin', name: 'ミニチュア・ピンシャー', emoji: '🐕', size: 'small' },
    { id: 'whippet', name: 'ウィペット', emoji: '🐕', size: 'medium' },
    { id: 'mixed', name: 'ミックス・その他', emoji: '🐕', size: 'medium' }
];

// ドッグフードランキングデータ（アフィリエイト用）
const DOG_FOOD_RANKING = {
    premium: [
        { 
            name: 'ロイヤルカナン プレミアム', 
            price: '¥3,980', 
            rating: 4.8, 
            features: ['高品質タンパク質', '消化サポート', '獣医師推奨'],
            affiliate_url: 'https://amzn.to/example1',
            image: '🏆'
        },
        { 
            name: 'ヒルズ サイエンス・ダイエット', 
            price: '¥3,200', 
            rating: 4.6, 
            features: ['科学的栄養', '免疫サポート', '毛艶改善'],
            affiliate_url: 'https://amzn.to/example2',
            image: '🥈'
        },
        { 
            name: 'ユーカヌバ プレミアム', 
            price: '¥2,890', 
            rating: 4.5, 
            features: ['オメガ3配合', '関節サポート', '抗酸化'],
            affiliate_url: 'https://amzn.to/example3',
            image: '🥉'
        }
    ],
    puppy: [
        { 
            name: 'ロイヤルカナン パピー', 
            price: '¥2,980', 
            rating: 4.9, 
            features: ['成長サポート', 'DHA配合', '小粒設計'],
            affiliate_url: 'https://amzn.to/example4',
            image: '🍼'
        }
    ],
    senior: [
        { 
            name: 'ヒルズ シニア', 
            price: '¥3,480', 
            rating: 4.7, 
            features: ['関節ケア', '消化配慮', '認知サポート'],
            affiliate_url: 'https://amzn.to/example5',
            image: '👴'
        }
    ],
    diet: [
        { 
            name: 'ロイヤルカナン ライト', 
            price: '¥3,180', 
            rating: 4.4, 
            features: ['低カロリー', '満腹感', '体重管理'],
            affiliate_url: 'https://amzn.to/example6',
            image: '⚖️'
        }
    ]
};

// グローバル変数
let currentUser = null;
let currentScreen = 'login';

// 画面管理
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        currentScreen = screenId;
    }
}

function showMainScreen(screenId = 'dashboard') {
    showScreen('main-app');
    
    document.querySelectorAll('#main-app > div').forEach(div => {
        div.classList.add('hidden');
    });
    
    const targetDiv = document.getElementById(screenId);
    if (targetDiv) {
        targetDiv.classList.remove('hidden');
    }
}

// 認証関連
async function signInWithGoogle() {
    if (!auth) {
        alert('認証システムの初期化に失敗しました。ページを再読み込みしてください。');
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
        console.log('🔐 Googleログイン開始');
        const result = await auth.signInWithPopup(provider);
        console.log('✅ ログイン成功:', result.user.displayName);
    } catch (error) {
        console.error('❌ ログインエラー:', error);
        
        let errorMessage = 'ログインに失敗しました。';
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = 'ログインがキャンセルされました。';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'ポップアップがブロックされました。ブラウザの設定を確認してください。';
                break;
            case 'auth/unauthorized-domain':
                errorMessage = `このドメインは認証が許可されていません。`;
                break;
            default:
                errorMessage = `ログインエラー: ${error.message}`;
                break;
        }
        alert(errorMessage);
    }
}

async function logout() {
    try {
        await auth.signOut();
        console.log('👋 ログアウトしました');
        showScreen('login-screen');
    } catch (error) {
        console.error('❌ ログアウトエラー:', error);
    }
}

// ユーザー初期化
async function initializeNewUser() {
    if (!currentUser) return;
    
    try {
        const docRef = db.collection('users').doc(currentUser.uid);
        const docSnap = await docRef.get();
        
        if (!docSnap.exists) {
            console.log('🐕 新規ユーザーを検出、初期文書を作成します');
            
            const newUserData = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || '',
                dogName: '',
                dogBreed: '',
                dogBirthday: '',
                dogGender: '',
                dogWeight: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await docRef.set(newUserData);
            console.log('✅ 新規ユーザー文書作成完了');
        } else {
            await docRef.update({
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('🔄 既存ユーザーのログイン時刻を更新');
        }
    } catch (error) {
        console.error('❌ 新規ユーザー初期化エラー:', error);
    }
}

// プロフィール管理
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const docRef = db.collection('users').doc(currentUser.uid);
        const docSnap = await docRef.get();
        
        const dashboardHero = document.querySelector('.dashboard-hero');
        const setupBtn = document.getElementById('setup-profile-btn');
        const profileAvatar = document.getElementById('profile-avatar');
        const emojiPlaceholder = document.querySelector('.emoji-placeholder');
        
        if (docSnap.exists) {
            const data = docSnap.data();
            
            document.getElementById('welcome-message').textContent = `こんにちは、${data.dogName || currentUser.displayName || 'ワンちゃん'}！`;
            
            if (data.dogName && data.dogBreed) {
                // プロフィール完了状態
                const breed = DOG_BREEDS.find(b => b.id === data.dogBreed);
                const breedName = breed ? breed.name : data.dogBreed;
                const emoji = breed ? breed.emoji : '🐕';
                
                document.getElementById('dog-info').textContent = `${data.dogName} (${breedName})`;
                
                // プロフィール画像またはemoji表示
                if (data.profileImage) {
                    profileAvatar.src = data.profileImage;
                    profileAvatar.classList.remove('hidden');
                    emojiPlaceholder.style.display = 'none';
                } else {
                    emojiPlaceholder.textContent = emoji;
                    profileAvatar.classList.add('hidden');
                    emojiPlaceholder.style.display = 'block';
                }
                
                // ヒーロー部分にプロフィール完了クラスを追加
                if (dashboardHero) {
                    dashboardHero.classList.add('profile-complete');
                }
            } else {
                // プロフィール未完了状態
                document.getElementById('dog-info').textContent = 'プロフィールを設定してください';
                emojiPlaceholder.textContent = '🐕';
                profileAvatar.classList.add('hidden');
                emojiPlaceholder.style.display = 'block';
                
                if (dashboardHero) {
                    dashboardHero.classList.remove('profile-complete');
                }
            }
            
            // フォーム入力値の設定
            if (document.getElementById('dog-name')) {
                document.getElementById('dog-name').value = data.dogName || '';
                document.getElementById('dog-breed').value = data.dogBreed || '';
                document.getElementById('dog-birthday').value = data.dogBirthday || '';
                document.getElementById('dog-gender').value = data.dogGender || '';
                document.getElementById('dog-current-weight').value = data.dogWeight || '';
                
                // プロフィール画像の設定
                const previewImg = document.getElementById('preview-img');
                const uploadPlaceholder = document.querySelector('.upload-placeholder');
                if (data.profileImage && previewImg && uploadPlaceholder) {
                    previewImg.src = data.profileImage;
                    previewImg.classList.remove('hidden');
                    uploadPlaceholder.style.display = 'none';
                } else if (previewImg && uploadPlaceholder) {
                    previewImg.classList.add('hidden');
                    uploadPlaceholder.style.display = 'block';
                }
            }
        } else {
            // 新規ユーザー
            document.getElementById('dog-info').textContent = 'プロフィールを設定してください';
            emojiPlaceholder.textContent = '🐕';
            profileAvatar.classList.add('hidden');
            emojiPlaceholder.style.display = 'block';
            
            if (dashboardHero) {
                dashboardHero.classList.remove('profile-complete');
            }
        }
    } catch (error) {
        console.error('❌ プロフィール読み込みエラー:', error);
    }
}

// 画像アップロード処理
function handleImageUpload(file) {
    if (file.size > 2 * 1024 * 1024) { // 2MB制限
        alert('画像サイズは2MB以下にしてください');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewImg = document.getElementById('preview-img');
        const uploadPlaceholder = document.querySelector('.upload-placeholder');
        
        if (previewImg && uploadPlaceholder) {
            previewImg.src = e.target.result;
            previewImg.classList.remove('hidden');
            uploadPlaceholder.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
}

async function saveProfile() {
    if (!currentUser) return;
    
    const dogName = document.getElementById('dog-name').value.trim();
    const dogBreed = document.getElementById('dog-breed').value;
    const dogBirthday = document.getElementById('dog-birthday').value;
    const dogGender = document.getElementById('dog-gender').value;
    const dogWeight = parseFloat(document.getElementById('dog-current-weight').value) || 0;
    const previewImg = document.getElementById('preview-img');
    
    if (!dogName) {
        alert('愛犬の名前を入力してください');
        return;
    }
    
    if (!dogBreed) {
        alert('犬種を選択してください');
        return;
    }
    
    try {
        const docRef = db.collection('users').doc(currentUser.uid);
        
        // ドキュメントの存在確認
        const docSnap = await docRef.get();
        
        const profileData = {
            dogName: dogName,
            dogBreed: dogBreed,
            dogBirthday: dogBirthday,
            dogGender: dogGender,
            dogWeight: dogWeight,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // プロフィール画像がある場合は追加
        if (previewImg && !previewImg.classList.contains('hidden')) {
            profileData.profileImage = previewImg.src;
        }
        
        if (docSnap.exists) {
            // 既存ドキュメントを更新
            await docRef.update(profileData);
            console.log('✅ プロフィール更新完了');
        } else {
            // 新規ドキュメントを作成
            const newUserData = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || '',
                ...profileData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await docRef.set(newUserData);
            console.log('✅ プロフィール新規作成完了');
        }
        
        alert('愛犬のプロフィールを保存しました！🐕');
        
        // プロフィールを再読み込みしてダッシュボードを更新
        await loadUserProfile();
        showMainScreen('dashboard');
    } catch (error) {
        console.error('❌ プロフィール保存エラー:', error);
        console.error('エラー詳細:', error.code, error.message);
        alert(`プロフィールの保存に失敗しました。\nエラー: ${error.message}`);
    }
}

// 餌量計算
function calculateFoodAmount() {
    const weight = parseFloat(document.getElementById('dog-weight').value);
    const ageCategory = document.getElementById('dog-age-category').value;
    const activityLevel = document.getElementById('activity-level').value;
    
    if (!weight || weight <= 0) {
        alert('正しい体重を入力してください');
        return;
    }
    
    let rer = 70 * Math.pow(weight, 0.75);
    let multiplier = 1.8;
    
    if (ageCategory === 'puppy') {
        multiplier = 3.0;
    } else if (ageCategory === 'senior') {
        multiplier = 1.4;
    }
    
    if (activityLevel === 'low') {
        multiplier *= 0.8;
    } else if (activityLevel === 'high') {
        multiplier *= 1.3;
    }
    
    const dailyCalories = rer * multiplier;
    const dailyAmount = Math.round((dailyCalories / 350) * 100);
    const morningAmount = Math.round(dailyAmount * 0.5);
    const eveningAmount = dailyAmount - morningAmount;
    
    document.getElementById('daily-amount').textContent = dailyAmount;
    document.getElementById('morning-amount').textContent = morningAmount + 'g';
    document.getElementById('evening-amount').textContent = eveningAmount + 'g';
    document.getElementById('food-result').classList.remove('hidden');
    
    console.log(`🥘 餌量計算結果: ${dailyAmount}g/日`);
}

// 犬種選択肢を生成
function populateDogBreedOptions() {
    const select = document.getElementById('dog-breed');
    if (!select) return;
    
    select.innerHTML = '<option value="">犬種を選択してください</option>';
    DOG_BREEDS.forEach(breed => {
        const option = document.createElement('option');
        option.value = breed.id;
        option.textContent = `${breed.emoji} ${breed.name}`;
        select.appendChild(option);
    });
}

// フードランキング
function loadFoodRanking() {
    console.log('🍖 フードランキング読み込み開始');
    
    // アフィリエイトボタンのイベントリスナーを設定
    setupAffiliateButtons();
}

// アフィリエイトリンク設定
const AFFILIATE_LINKS = {
    'mogwan': 'https://px.a8.net/svt/ejp?a8mat=3NGVLD+2NUUPU+3J8+1BP19U',
    'umaka': 'https://t.felmat.net/fmcl?ak=O4993P.1.A121367Z.J102441Q',
    'canagan': 'https://px.a8.net/svt/ejp?a8mat=3NGVLD+2TT6RM+3J8+HWPVL',
    'essential': 'https://px.a8.net/svt/ejp?a8mat=45GGT8+BDMAIQ+3J8+3H2YHD',
    'konokonogohan-large': 'https://konokototomoni.com/shop/products/this_is_gohan_large',
    'mishone': 'https://px.a8.net/svt/ejp?a8mat=45GGT8+C1FMPU+4PA6+BWVTE',
    'cocogourmet': 'https://coco-gourmet.com/shopping/lp.php?p=cp_coco_1&adid=coco_a8',
    'obremo': 'https://obremo.jp/',
    'pelthia': 'https://pelthia.jp/',
    'naturol': 'https://reason-why.jp/naturol/ad1/'
};

function setupAffiliateButtons() {
    console.log('🔗 アフィリエイトボタン設定開始');
    
    // 全てのアフィリエイトボタンにイベントリスナーを追加
    const affiliateButtons = document.querySelectorAll('.affiliate-btn');
    
    affiliateButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const productId = this.getAttribute('data-product');
            const affiliateUrl = AFFILIATE_LINKS[productId];
            
            if (affiliateUrl) {
                // Firestore Analytics (アフィリエイトクリック記録)
                if (analytics) {
                    analytics.logEvent('affiliate_click', {
                        product_id: productId,
                        product_name: this.closest('.ranking-item, .ranking-item-compact')?.querySelector('.product-name, h5')?.textContent || 'Unknown',
                        timestamp: new Date().toISOString()
                    });
                }
                
                // コンバージョン追跡
                trackAffiliateClick(productId);
                
                console.log(`🛒 アフィリエイトリンククリック: ${productId}`);
                
                // 新しいタブでアフィリエイトリンクを開く
                window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
            } else {
                console.error(`❌ アフィリエイトリンクが見つかりません: ${productId}`);
                alert('申し訳ございません。リンクの準備中です。');
            }
        });
    });
    
    console.log(`✅ ${affiliateButtons.length}個のアフィリエイトボタンを設定しました`);
}

// アフィリエイトクリック追跡
async function trackAffiliateClick(productId) {
    try {
        if (!currentUser) return;
        
        const clickData = {
            userId: currentUser.uid,
            productId: productId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
        };
        
        // Firestore にクリックデータを保存
        await db.collection('affiliate_clicks').add(clickData);
        
        console.log('📊 アフィリエイトクリック記録完了:', productId);
    } catch (error) {
        console.error('❌ アフィリエイトクリック記録エラー:', error);
    }
}

// イベントリスナー設定
function setupEventListeners() {
    console.log('📱 イベントリスナー設定開始');
    
    // Googleログイン
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        console.log('✅ Googleログインボタン見つかりました');
        googleLoginBtn.addEventListener('click', (e) => {
            console.log('🔐 ログインボタンがクリックされました');
            e.preventDefault();
            signInWithGoogle();
        });
    } else {
        console.error('❌ Googleログインボタンが見つかりません');
    }
    
    // ログアウト
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // プロフィール画面表示
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => showMainScreen('profile-screen'));
    }
    
    // プロフィール設定ボタン
    const setupProfileBtn = document.getElementById('setup-profile-btn');
    if (setupProfileBtn) {
        setupProfileBtn.addEventListener('click', () => showMainScreen('profile-screen'));
    }
    
    // プロフィール画像アップロード
    const imagePreview = document.getElementById('image-preview');
    const imageInput = document.getElementById('profile-image-input');
    const previewImg = document.getElementById('preview-img');
    
    if (imagePreview && imageInput) {
        imagePreview.addEventListener('click', () => {
            imageInput.click();
        });
        
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(file);
            }
        });
    }
    
    // 通知ボタン
    const notificationsBtn = document.getElementById('notifications-btn');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', () => {
            showMainScreen('vaccine-record');
            loadVaccineRecords();
            checkVaccineNotifications();
        });
    }
    
    // プロフィール保存
    const saveProfileBtn = document.getElementById('save-profile');
    if (saveProfileBtn) {
        console.log('✅ プロフィール保存ボタン見つかりました');
        saveProfileBtn.addEventListener('click', (e) => {
            console.log('🐕 プロフィール保存ボタンがクリックされました');
            e.preventDefault();
            saveProfile();
        });
    } else {
        console.error('❌ プロフィール保存ボタンが見つかりません');
    }
    
    // アクションカード & フィーチャーカード
    document.querySelectorAll('.action-card, .feature-card').forEach(card => {
        card.addEventListener('click', () => {
            const action = card.dataset.action;
            showMainScreen(action);
            
            if (action === 'food-ranking') {
                loadFoodRanking();
            }
            
            if (action === 'vaccine-record') {
                loadVaccineRecords();
                checkVaccineNotifications();
            }
        });
    });
    
    // 戻るボタン
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => showMainScreen('dashboard'));
    });
    
    // 餌量計算
    const calculateBtn = document.getElementById('calculate-food');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateFoodAmount);
    }
    
    // フードランキングカテゴリ
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const category = tab.dataset.category;
            loadFoodRanking(category);
        });
    });
    
    // ワクチン関連イベント
    setupVaccineEventListeners();
    
    console.log('✅ イベントリスナー設定完了');
}

// ワクチン関連イベントリスナー設定
function setupVaccineEventListeners() {
    // ワクチン追加ボタン
    const addVaccineBtn = document.getElementById('add-vaccine');
    if (addVaccineBtn) {
        addVaccineBtn.addEventListener('click', () => {
            document.getElementById('vaccine-modal').classList.remove('hidden');
            resetVaccineForm();
        });
    }
    
    // モーダル関連
    const vaccineModal = document.getElementById('vaccine-modal');
    const vaccineModalClose = document.getElementById('vaccine-modal-close');
    const cancelVaccine = document.getElementById('cancel-vaccine');
    
    if (vaccineModalClose) {
        vaccineModalClose.addEventListener('click', closeVaccineModal);
    }
    
    if (cancelVaccine) {
        cancelVaccine.addEventListener('click', closeVaccineModal);
    }
    
    if (vaccineModal) {
        vaccineModal.addEventListener('click', (e) => {
            if (e.target === vaccineModal) {
                closeVaccineModal();
            }
        });
    }
    
    // ワクチン種類変更
    const vaccineType = document.getElementById('vaccine-type');
    if (vaccineType) {
        vaccineType.addEventListener('change', toggleMixedVaccineOptions);
    }
    
    // フォーム送信
    const vaccineForm = document.getElementById('vaccine-form');
    if (vaccineForm) {
        vaccineForm.addEventListener('submit', handleVaccineSubmit);
    }
    
    // ワクチンタブ
    document.querySelectorAll('.vaccine-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.vaccine-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filterType = tab.dataset.type;
            loadVaccineRecords(filterType);
        });
    });
}

// ワクチンモーダル関連関数
function closeVaccineModal() {
    document.getElementById('vaccine-modal').classList.add('hidden');
    resetVaccineForm();
}

function resetVaccineForm() {
    document.getElementById('vaccine-form').reset();
    document.getElementById('mixed-vaccine-options').classList.add('hidden');
}

function toggleMixedVaccineOptions() {
    const vaccineType = document.getElementById('vaccine-type').value;
    const mixedOptions = document.getElementById('mixed-vaccine-options');
    
    if (vaccineType === 'mixed') {
        mixedOptions.classList.remove('hidden');
    } else {
        mixedOptions.classList.add('hidden');
    }
}

// ワクチンフォーム送信処理
async function handleVaccineSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('ログインが必要です');
        return;
    }
    
    const vaccineType = document.getElementById('vaccine-type').value;
    const vaccineDate = document.getElementById('vaccine-date').value;
    const clinicName = document.getElementById('clinic-name').value.trim();
    const vaccineMemo = document.getElementById('vaccine-memo').value.trim();
    
    if (!vaccineType || !vaccineDate) {
        alert('ワクチン種類と接種日を入力してください');
        return;
    }
    
    let mixedCount = null;
    if (vaccineType === 'mixed') {
        mixedCount = document.getElementById('mixed-vaccine-count').value;
        if (!mixedCount) {
            alert('混合ワクチンの種類を選択してください');
            return;
        }
    }
    
    try {
        const vaccineData = {
            userId: currentUser.uid,
            type: vaccineType,
            date: vaccineDate,
            mixedCount: mixedCount,
            clinicName: clinicName,
            memo: vaccineMemo,
            nextDue: calculateNextVaccineDate(vaccineDate, vaccineType),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('vaccines').add(vaccineData);
        
        alert('ワクチン記録を保存しました！');
        closeVaccineModal();
        loadVaccineRecords();
        checkVaccineNotifications();
        
    } catch (error) {
        console.error('❌ ワクチン記録保存エラー:', error);
        alert('ワクチン記録の保存に失敗しました');
    }
}

// 次回ワクチン日計算
function calculateNextVaccineDate(vaccineDate, vaccineType) {
    const date = new Date(vaccineDate);
    const interval = VACCINE_TYPES[vaccineType]?.interval || 365;
    date.setDate(date.getDate() + interval);
    return date.toISOString().split('T')[0];
}

// ワクチン記録読み込み
async function loadVaccineRecords(filterType = 'all') {
    if (!currentUser) return;
    
    try {
        let query = db.collection('vaccines')
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc');
            
        if (filterType !== 'all') {
            query = query.where('type', '==', filterType);
        }
        
        const snapshot = await query.get();
        const vaccineList = document.getElementById('vaccine-list');
        
        if (snapshot.empty) {
            vaccineList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💉</div>
                    <h3>ワクチン記録がありません</h3>
                    <p>右上の+ボタンからワクチン接種記録を追加してください</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const vaccine = doc.data();
            html += createVaccineItemHTML(vaccine, doc.id);
        });
        
        vaccineList.innerHTML = html;
        
    } catch (error) {
        console.error('❌ ワクチン記録読み込みエラー:', error);
    }
}

// ワクチンアイテムHTML生成
function createVaccineItemHTML(vaccine, docId) {
    const vaccineInfo = VACCINE_TYPES[vaccine.type];
    const vaccineDate = new Date(vaccine.date);
    const nextDueDate = new Date(vaccine.nextDue);
    const today = new Date();
    const daysUntilDue = Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24));
    
    let daysRemainingClass = '';
    let daysText = '';
    
    if (daysUntilDue < 0) {
        daysText = `${Math.abs(daysUntilDue)}日過ぎ`;
        daysRemainingClass = 'urgent';
    } else if (daysUntilDue <= 30) {
        daysText = `あと${daysUntilDue}日`;
        daysRemainingClass = 'urgent';
    } else {
        daysText = `あと${daysUntilDue}日`;
    }
    
    const mixedInfo = vaccine.type === 'mixed' ? `${vaccine.mixedCount}種混合` : '';
    
    return `
        <div class="vaccine-item ${vaccine.type}" data-id="${docId}">
            <div class="vaccine-header">
                <div>
                    <div class="vaccine-type-badge ${vaccine.type}">
                        <span>${vaccineInfo.icon}</span>
                        <span>${vaccineInfo.name} ${mixedInfo}</span>
                    </div>
                </div>
                <div class="vaccine-date">
                    ${vaccineDate.toLocaleDateString('ja-JP')}
                </div>
            </div>
            
            <div class="vaccine-details">
                ${vaccine.clinicName ? `
                    <div class="detail-item">
                        <div class="detail-label">動物病院</div>
                        <div class="detail-value">${vaccine.clinicName}</div>
                    </div>
                ` : ''}
                
                ${vaccine.memo ? `
                    <div class="detail-item">
                        <div class="detail-label">メモ</div>
                        <div class="detail-value">${vaccine.memo}</div>
                    </div>
                ` : ''}
            </div>
            
            <div class="next-due">
                <div class="next-due-text">次回予定日:</div>
                <div>
                    <div class="next-due-date">${nextDueDate.toLocaleDateString('ja-JP')}</div>
                    <div class="days-remaining ${daysRemainingClass}">${daysText}</div>
                </div>
            </div>
        </div>
    `;
}

// ワクチン通知チェック
async function checkVaccineNotifications() {
    if (!currentUser) return;
    
    try {
        const today = new Date();
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setDate(today.getDate() + 30);
        
        const snapshot = await db.collection('vaccines')
            .where('userId', '==', currentUser.uid)
            .where('nextDue', '<=', oneMonthFromNow.toISOString().split('T')[0])
            .where('nextDue', '>=', today.toISOString().split('T')[0])
            .get();
        
        const notificationArea = document.getElementById('vaccine-notifications');
        if (!notificationArea) return;
        
        if (snapshot.empty) {
            notificationArea.innerHTML = '';
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const vaccine = doc.data();
            html += createNotificationHTML(vaccine);
        });
        
        notificationArea.innerHTML = html;
        
        // 通知バッジ更新
        updateNotificationBadge(snapshot.size);
        
    } catch (error) {
        console.error('❌ ワクチン通知チェックエラー:', error);
    }
}

// 通知バッジ更新
function updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// 通知HTML生成
function createNotificationHTML(vaccine) {
    const vaccineInfo = VACCINE_TYPES[vaccine.type];
    const nextDueDate = new Date(vaccine.nextDue);
    const today = new Date();
    const daysUntilDue = Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24));
    
    let urgencyMessage = '';
    if (daysUntilDue <= 7) {
        urgencyMessage = '緊急！';
    } else if (daysUntilDue <= 14) {
        urgencyMessage = 'お早めに！';
    }
    
    const mixedInfo = vaccine.type === 'mixed' ? `${vaccine.mixedCount}種混合` : '';
    
    return `
        <div class="notification-card">
            <div class="notification-header">
                <i class="fas fa-bell"></i>
                <span class="notification-title">${urgencyMessage} ワクチン接種予定</span>
            </div>
            <div class="notification-message">
                ${vaccineInfo.name} ${mixedInfo} の接種予定日が近づいています。<br>
                予定日: ${nextDueDate.toLocaleDateString('ja-JP')} (あと${daysUntilDue}日)
            </div>
            <div class="notification-meta">
                <span>前回接種: ${new Date(vaccine.date).toLocaleDateString('ja-JP')}</span>
                <span>${vaccineInfo.icon}</span>
            </div>
        </div>
    `;
}

// ワクチンデータ管理
const VACCINE_TYPES = {
    rabies: {
        name: '狂犬病ワクチン',
        interval: 365, // 1年
        icon: '💕',
        color: '#e74c3c'
    },
    mixed: {
        name: '混合ワクチン',
        interval: 365, // 1年
        icon: '💉',
        color: '#3498db'
    }
};

// アプリ初期化
function initializeApp() {
    console.log('🐕 DogLife アプリ初期化開始');
    
    if (!auth) {
        console.error('❌ Firebase Authが初期化されていません');
        showScreen('login-screen');
        return;
    }
    
    // 認証状態の監視
    auth.onAuthStateChanged(async (user) => {
        console.log('🔄 認証状態変更:', user ? 'ログイン中' : 'ログアウト中');
        
        if (user) {
            console.log('👤 ユーザー:', user.displayName, user.email);
            currentUser = user;
            
            await initializeNewUser();
            await loadUserProfile();
            
            // ワクチン通知チェック
            await checkVaccineNotifications();
            
            showMainScreen('dashboard');
        } else {
            console.log('👋 ログアウト状態');
            currentUser = null;
            showScreen('login-screen');
        }
    });
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOMContentLoaded発火');
    
    try {
        populateDogBreedOptions();
        setupEventListeners();
        initializeApp();
        
        console.log('✅ DogLife初期化完了');
    } catch (error) {
        console.error('❌ 初期化エラー:', error);
        alert('アプリの初期化中にエラーが発生しました: ' + error.message);
    }
});