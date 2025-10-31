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
        
        if (docSnap.exists) {
            const data = docSnap.data();
            
            document.getElementById('welcome-message').textContent = `こんにちは、${data.dogName || currentUser.displayName || 'ワンちゃん'}！`;
            
            if (data.dogName && data.dogBreed) {
                const breed = DOG_BREEDS.find(b => b.id === data.dogBreed);
                const breedName = breed ? breed.name : data.dogBreed;
                const emoji = breed ? breed.emoji : '🐕';
                
                document.getElementById('dog-info').textContent = `${data.dogName} (${breedName})`;
                document.getElementById('dog-breed-icon').textContent = emoji;
            } else {
                document.getElementById('dog-info').textContent = 'プロフィールを設定してください';
            }
            
            if (document.getElementById('dog-name')) {
                document.getElementById('dog-name').value = data.dogName || '';
                document.getElementById('dog-breed').value = data.dogBreed || '';
                document.getElementById('dog-birthday').value = data.dogBirthday || '';
                document.getElementById('dog-gender').value = data.dogGender || '';
                document.getElementById('dog-current-weight').value = data.dogWeight || '';
            }
        }
    } catch (error) {
        console.error('❌ プロフィール読み込みエラー:', error);
    }
}

async function saveProfile() {
    if (!currentUser) return;
    
    const dogName = document.getElementById('dog-name').value.trim();
    const dogBreed = document.getElementById('dog-breed').value;
    const dogBirthday = document.getElementById('dog-birthday').value;
    const dogGender = document.getElementById('dog-gender').value;
    const dogWeight = parseFloat(document.getElementById('dog-current-weight').value) || 0;
    
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
function loadFoodRanking(category = 'premium') {
    const rankingList = document.getElementById('food-ranking-list');
    const foods = DOG_FOOD_RANKING[category] || [];
    
    rankingList.innerHTML = '';
    foods.forEach((food, index) => {
        const foodCard = createFoodCard(food, index + 1);
        rankingList.appendChild(foodCard);
    });
}

function createFoodCard(food, rank) {
    const card = document.createElement('div');
    card.className = 'food-card';
    card.innerHTML = `
        <div class="food-rank">${food.image}</div>
        <div class="food-info">
            <h4>${food.name}</h4>
            <div class="food-rating">
                ${'⭐'.repeat(Math.floor(food.rating))} ${food.rating}
            </div>
            <div class="food-price">${food.price}</div>
            <div class="food-features">
                ${food.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
            </div>
        </div>
        <div class="food-actions">
            <button onclick="window.open('${food.affiliate_url}', '_blank')" class="primary-btn">
                🛒 購入する
            </button>
        </div>
    `;
    return card;
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
    
    console.log('✅ イベントリスナー設定完了');
}

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