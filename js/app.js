// Firebase v9 SDK imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

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
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    try {
        analytics = getAnalytics(app);
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
    { id: 'basenji', name: 'バセンジー', emoji: '🐕', size: 'medium' },
    { id: 'australian-shepherd', name: 'オーストラリアンシェパード', emoji: '🐕', size: 'large' },
    { id: 'bernese', name: 'バーニーズマウンテンドッグ', emoji: '🐕', size: 'large' },
    { id: 'saint-bernard', name: 'セントバーナード', emoji: '🐕', size: 'large' },
    { id: 'great-dane', name: 'グレートデーン', emoji: '🐕', size: 'large' },
    { id: 'doberman', name: 'ドーベルマン', emoji: '🐕', size: 'large' },
    { id: 'rottweiler', name: 'ロットワイラー', emoji: '🐕', size: 'large' },
    { id: 'mastiff', name: 'マスティフ', emoji: '🐕', size: 'large' },
    { id: 'newfoundland', name: 'ニューファンドランド', emoji: '🐕', size: 'large' },
    { id: 'great-pyrenees', name: 'グレートピレニーズ', emoji: '🐕', size: 'large' },
    { id: 'afghan-hound', name: 'アフガンハウンド', emoji: '🐕', size: 'large' },
    { id: 'saluki', name: 'サルーキ', emoji: '🐕', size: 'large' },
    { id: 'greyhound', name: 'グレーハウンド', emoji: '🐕', size: 'large' },
    { id: 'irish-setter', name: 'アイリッシュセッター', emoji: '🐕', size: 'large' },
    { id: 'weimaraner', name: 'ワイマラナー', emoji: '🐕', size: 'large' },
    { id: 'vizsla', name: 'ビズラ', emoji: '🐕', size: 'large' },
    { id: 'pointer', name: 'ポインター', emoji: '🐕', size: 'large' },
    { id: 'setter', name: 'セッター', emoji: '🐕', size: 'large' },
    { id: 'spaniel', name: 'スパニエル', emoji: '🐕', size: 'medium' },
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

// DOM要素
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const modal = document.getElementById('modal-overlay');

// 画面管理
function showScreen(screenId) {
    // 全ての画面を非表示
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // 指定された画面を表示
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        currentScreen = screenId;
    }
}

function showMainScreen(screenId = 'dashboard') {
    showScreen('main-app');
    
    // メインアプリ内の画面切り替え
    document.querySelectorAll('#main-app .screen').forEach(screen => {
        if (screen.id !== 'main-app') {
            screen.classList.add('hidden');
        }
    });
    
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
        console.error('Firebase Authが初期化されていません');
        alert('認証システムの初期化に失敗しました。ページを再読み込みしてください。');
        return;
    }

    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
        console.log('🔐 Googleログイン開始');
        console.log('現在のURL:', window.location.href);
        
        const result = await signInWithPopup(auth, provider);
        console.log('✅ ログイン成功:', result.user.displayName);
    } catch (error) {
        console.error('❌ ログインエラー:', error);
        
        let errorMessage = 'ログインに失敗しました。';
        let shouldRetry = false;
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = 'ログインがキャンセルされました。';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'ポップアップがブロックされました。ブラウザの設定を確認してください。';
                break;
            case 'auth/unauthorized-domain':
                errorMessage = `このドメイン（${window.location.hostname}）は認証が許可されていません。`;
                break;
            case 'auth/network-request-failed':
                errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
                shouldRetry = true;
                break;
            case 'auth/internal-error':
                errorMessage = 'サーバー内部エラーが発生しました。しばらく待ってから再試行してください。';
                shouldRetry = true;
                break;
            default:
                if (error.message && error.message.includes('500')) {
                    errorMessage = 'サーバーエラー（500）が発生しました。しばらく待ってから再試行してください。';
                    shouldRetry = true;
                } else {
                    errorMessage = `ログインエラー: ${error.message}`;
                }
                break;
        }
        
        if (shouldRetry) {
            const retryMessage = '\n\n自動で再試行しますか？';
            if (confirm(errorMessage + retryMessage)) {
                setTimeout(() => signInWithGoogle(), 2000);
                return;
            }
        }
        
        alert(errorMessage + ' もう一度お試しください。');
    }
}

async function logout() {
    try {
        await signOut(auth);
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
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
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
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp()
            };
            
            await setDoc(docRef, newUserData);
            console.log('✅ 新規ユーザー文書作成完了');
        } else {
            await updateDoc(docRef, {
                lastLoginAt: serverTimestamp()
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
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // ダッシュボード表示更新
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
            
            // プロフィールフォームに値を設定
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
        const docRef = doc(db, 'users', currentUser.uid);
        await updateDoc(docRef, {
            dogName: dogName,
            dogBreed: dogBreed,
            dogBirthday: dogBirthday,
            dogGender: dogGender,
            dogWeight: dogWeight,
            updatedAt: serverTimestamp()
        });
        
        console.log('✅ プロフィール保存完了');
        alert('プロフィールを保存しました！');
        
        // ダッシュボードを更新
        await loadUserProfile();
        showMainScreen('dashboard');
    } catch (error) {
        console.error('❌ プロフィール保存エラー:', error);
        alert('プロフィールの保存に失敗しました。');
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
    
    // 基本カロリー計算（RER: Resting Energy Requirement）
    let rer = 70 * Math.pow(weight, 0.75);
    
    // 年齢・活動レベル係数
    let multiplier = 1.8; // 成犬・普通の活動レベル
    
    if (ageCategory === 'puppy') {
        multiplier = 3.0; // 子犬
    } else if (ageCategory === 'senior') {
        multiplier = 1.4; // シニア犬
    }
    
    if (activityLevel === 'low') {
        multiplier *= 0.8;
    } else if (activityLevel === 'high') {
        multiplier *= 1.3;
    }
    
    const dailyCalories = rer * multiplier;
    
    // ドライフードの平均カロリー密度（350kcal/100g）で計算
    const dailyAmount = Math.round((dailyCalories / 350) * 100);
    const morningAmount = Math.round(dailyAmount * 0.5);
    const eveningAmount = dailyAmount - morningAmount;
    
    // 結果表示
    document.getElementById('daily-amount').textContent = dailyAmount;
    document.getElementById('morning-amount').textContent = morningAmount + 'g';
    document.getElementById('evening-amount').textContent = eveningAmount + 'g';
    document.getElementById('food-result').classList.remove('hidden');
    
    console.log(`🥘 餌量計算結果: ${dailyAmount}g/日 (体重${weight}kg, ${ageCategory}, ${activityLevel})`);
}

// ワクチン記録
async function loadVaccineRecords() {
    if (!currentUser) return;
    
    try {
        const q = query(
            collection(db, 'vaccines'),
            where('userId', '==', currentUser.uid),
            orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const vaccineList = document.getElementById('vaccine-list');
        
        if (querySnapshot.empty) {
            vaccineList.innerHTML = '<div class="empty-state">ワクチン記録がありません。追加ボタンから記録を開始しましょう。</div>';
            return;
        }
        
        vaccineList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const vaccineCard = createVaccineCard(doc.id, data);
            vaccineList.appendChild(vaccineCard);
        });
        
    } catch (error) {
        console.error('❌ ワクチン記録読み込みエラー:', error);
    }
}

function createVaccineCard(id, data) {
    const card = document.createElement('div');
    card.className = 'vaccine-card';
    card.innerHTML = `
        <div class="vaccine-info">
            <h4>${data.vaccineName}</h4>
            <p>接種日: ${data.date}</p>
            <p>次回予定: ${data.nextDate || '未設定'}</p>
            ${data.notes ? `<p class="notes">${data.notes}</p>` : ''}
        </div>
        <div class="vaccine-actions">
            <button onclick="editVaccine('${id}')" class="edit-btn">編集</button>
            <button onclick="deleteVaccine('${id}')" class="delete-btn">削除</button>
        </div>
    `;
    return card;
}

async function addVaccine() {
    const vaccineName = prompt('ワクチン名を入力してください:');
    if (!vaccineName) return;
    
    const date = prompt('接種日を入力してください (YYYY-MM-DD):');
    if (!date) return;
    
    const nextDate = prompt('次回予定日を入力してください (YYYY-MM-DD, 任意):');
    const notes = prompt('メモ (任意):');
    
    try {
        await addDoc(collection(db, 'vaccines'), {
            userId: currentUser.uid,
            vaccineName: vaccineName,
            date: date,
            nextDate: nextDate || '',
            notes: notes || '',
            createdAt: serverTimestamp()
        });
        
        console.log('✅ ワクチン記録追加完了');
        loadVaccineRecords();
    } catch (error) {
        console.error('❌ ワクチン記録追加エラー:', error);
        alert('ワクチン記録の追加に失敗しました。');
    }
}

// イベント情報（サンプルデータ）
const DOG_EVENTS = [
    {
        id: 1,
        title: '東京ドッグショー 2024',
        date: '2024-12-15',
        location: '東京ビッグサイト',
        category: 'show',
        description: '日本最大級のドッグショー。様々な犬種が集まります。',
        url: 'https://example.com/dog-show'
    },
    {
        id: 2,
        title: 'パピートレーニング教室',
        date: '2024-12-08',
        location: '渋谷ペットスクール',
        category: 'training',
        description: '子犬向けの基本的なしつけ教室です。',
        url: 'https://example.com/puppy-training'
    },
    {
        id: 3,
        title: '代々木公園ドッグオフ会',
        date: '2024-12-10',
        location: '代々木公園',
        category: 'meet',
        description: '同じ犬種の飼い主同士の交流会です。',
        url: 'https://example.com/dog-meetup'
    }
];

function loadEvents(filter = 'all') {
    const eventsList = document.getElementById('events-list');
    const filteredEvents = filter === 'all' ? DOG_EVENTS : DOG_EVENTS.filter(event => event.category === filter);
    
    eventsList.innerHTML = '';
    filteredEvents.forEach(event => {
        const eventCard = createEventCard(event);
        eventsList.appendChild(eventCard);
    });
}

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
        <div class="event-info">
            <h4>${event.title}</h4>
            <p class="event-date">📅 ${event.date}</p>
            <p class="event-location">📍 ${event.location}</p>
            <p class="event-description">${event.description}</p>
        </div>
        <div class="event-actions">
            <button onclick="window.open('${event.url}', '_blank')" class="primary-btn">詳細を見る</button>
        </div>
    `;
    return card;
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

// 今日のタスク生成
function generateTodayTasks() {
    const tasksList = document.getElementById('today-tasks-list');
    const tasks = [];
    
    // ユーザーの犬の情報に基づいてタスクを生成
    if (currentUser) {
        tasks.push('💧 新鮮な水を用意する');
        tasks.push('🥘 朝食をあげる');
        tasks.push('🚶‍♂️ 散歩に行く');
        tasks.push('🧸 一緒に遊ぶ');
    }
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<div class="empty-state">今日のタスクはありません</div>';
        return;
    }
    
    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item">
            <input type="checkbox" class="task-checkbox">
            <span class="task-text">${task}</span>
        </div>
    `).join('');
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

// イベントリスナー設定
function setupEventListeners() {
    // Googleログイン
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', signInWithGoogle);
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
        saveProfileBtn.addEventListener('click', saveProfile);
    }
    
    // アクションカード
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', () => {
            const action = card.dataset.action;
            showMainScreen(action);
            
            // 各画面のデータロード
            if (action === 'vaccine-record') {
                loadVaccineRecords();
            } else if (action === 'events') {
                loadEvents();
            } else if (action === 'food-ranking') {
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
    
    // ワクチン追加
    const addVaccineBtn = document.getElementById('add-vaccine');
    if (addVaccineBtn) {
        addVaccineBtn.addEventListener('click', addVaccine);
    }
    
    // イベントフィルター
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.dataset.filter;
            loadEvents(filter);
        });
    });
    
    // フードランキングカテゴリ
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const category = tab.dataset.category;
            loadFoodRanking(category);
        });
    });
    
    // モーダル閉じる
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }
    
    // モーダル外クリックで閉じる
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
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
    onAuthStateChanged(auth, async (user) => {
        console.log('🔄 認証状態変更:', user ? 'ログイン中' : 'ログアウト中');
        
        if (user) {
            console.log('👤 ユーザー:', user.displayName, user.email);
            currentUser = user;
            
            // 新規ユーザー初期化
            await initializeNewUser();
            
            // プロフィール読み込み
            await loadUserProfile();
            
            // 今日のタスク生成
            generateTodayTasks();
            
            // メインアプリ表示
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
        // 犬種選択肢を生成
        populateDogBreedOptions();
        
        // イベントリスナー設定
        setupEventListeners();
        
        // アプリ初期化
        initializeApp();
        
        console.log('✅ DogLife初期化完了');
    } catch (error) {
        console.error('❌ 初期化エラー:', error);
        alert('アプリの初期化中にエラーが発生しました: ' + error.message);
    }
});

// グローバル関数（HTML内から呼び出し用）
window.editVaccine = async function(id) {
    // ワクチン編集機能（モーダルで実装予定）
    console.log('編集:', id);
    alert('編集機能は近日実装予定です');
};

window.deleteVaccine = async function(id) {
    if (!confirm('この記録を削除しますか？')) return;
    
    try {
        await deleteDoc(doc(db, 'vaccines', id));
        console.log('✅ ワクチン記録削除完了');
        loadVaccineRecords();
    } catch (error) {
        console.error('❌ ワクチン記録削除エラー:', error);
        alert('削除に失敗しました。');
    }
};