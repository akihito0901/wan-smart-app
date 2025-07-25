// Firebase v9 SDK imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithCredential, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// Firebase設定
const firebaseConfig = {
    apiKey: "AIzaSyBu63l8Orqplq2EnLTkigilHQBeBpVvXLc",
    authDomain: "gokinjosanpo.firebaseapp.com",
    projectId: "gokinjosanpo",
    storageBucket: "gokinjosanpo.firebasestorage.app",
    messagingSenderId: "633353535199",
    appId: "1:633353535199:web:8ed585c859d6bba57ab36a",
    measurementId: "G-D14P7YT035"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// グローバル変数
let currentUser = null;
let map = null;
let userLocation = null;

// DOM要素
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const logoutBtn = document.getElementById('logout-btn');

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeAppAuth();
    setupEventListeners();
});

// アプリ初期化
function initializeAppAuth() {
    console.log('認証状態監視を開始します');
    // 認証状態の監視
    onAuthStateChanged(auth, (user) => {
        console.log('認証状態変更:', user ? 'ログイン中' : 'ログアウト中');
        if (user) {
            console.log('ユーザー情報:', user.displayName, user.email);
            currentUser = user;
            showMainApp();
            loadUserProfile();
            loadFriends();
        } else {
            console.log('ログアウト状態のため、ログイン画面を表示');
            showLoginScreen();
        }
    });
}

// イベントリスナー設定
function setupEventListeners() {
    // タブ切り替え
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // ログアウト
    logoutBtn.addEventListener('click', logout);

    // プロフィール保存
    document.getElementById('save-profile-btn').addEventListener('click', saveProfile);

    // 散歩開始
    document.getElementById('start-walk-btn').addEventListener('click', startWalk);
}

// Googleログイン処理
window.handleCredentialResponse = function(response) {
    console.log('Googleログイン開始:', response);
    const credential = GoogleAuthProvider.credential(response.credential);
    
    signInWithCredential(auth, credential)
        .then((result) => {
            console.log('ログイン成功:', result.user);
            console.log('ユーザー情報:', result.user.displayName, result.user.email);
        })
        .catch((error) => {
            console.error('ログインエラー:', error);
            alert('ログインに失敗しました。もう一度お試しください。');
        });
};

// ログアウト
function logout() {
    signOut(auth).then(() => {
        console.log('ログアウトしました');
    }).catch((error) => {
        console.error('ログアウトエラー:', error);
    });
}

// 画面表示切り替え
function showLoginScreen() {
    console.log('ログイン画面を表示');
    loginScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

function showMainApp() {
    console.log('メインアプリ画面を表示');
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    
    // ユーザー情報表示
    if (currentUser) {
        console.log('ユーザー情報を画面に表示:', currentUser.displayName);
        document.getElementById('user-name').textContent = currentUser.displayName || 'ユーザー';
        if (currentUser.photoURL) {
            document.getElementById('user-avatar').innerHTML = `<img src="${currentUser.photoURL}" alt="アバター" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }
    }
    
    // 位置情報取得とマップ初期化
    getCurrentLocation();
}

// タブ切り替え
function switchTab(tabName) {
    // すべてのタブとコンテンツを非アクティブに
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // 選択されたタブとコンテンツをアクティブに
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // マップタブの場合、マップを再初期化
    if (tabName === 'map' && map) {
        setTimeout(() => {
            google.maps.event.trigger(map, 'resize');
            if (userLocation) {
                map.setCenter(userLocation);
            }
        }, 100);
    }
}

// 位置情報取得
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                initMap();
                loadNearbyDogs();
            },
            (error) => {
                console.error('位置情報取得エラー:', error);
                // デフォルト位置（東京駅）
                userLocation = { lat: 35.6812, lng: 139.7671 };
                initMap();
                loadNearbyDogs();
            }
        );
    } else {
        console.error('位置情報がサポートされていません');
        userLocation = { lat: 35.6812, lng: 139.7671 };
        initMap();
        loadNearbyDogs();
    }
}

// Googleマップ初期化
window.initMap = function() {
    if (!userLocation) return;
    
    const mapOptions = {
        zoom: 15,
        center: userLocation,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{ color: '#a5d6a7' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#2e7d32' }]
            }
        ]
    };
    
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    
    // 現在位置マーカー
    new google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'あなたの現在位置',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#4A90E2',
            fillOpacity: 1,
            strokeWeight: 3,
            strokeColor: '#ffffff',
            scale: 12
        }
    });
    
    // 散歩コースの例を表示
    addSampleWalkingRoutes();
    
    // 近くの公園にマーカーを追加
    addParkMarkers();
};

// サンプル散歩コース追加
function addSampleWalkingRoutes() {
    if (!map || !userLocation) return;
    
    const walkingPaths = [
        {
            path: [
                userLocation,
                { lat: userLocation.lat + 0.005, lng: userLocation.lng + 0.005 },
                { lat: userLocation.lat + 0.01, lng: userLocation.lng },
                { lat: userLocation.lat + 0.005, lng: userLocation.lng - 0.005 },
                userLocation
            ],
            color: '#28a745',
            title: '近所コース (約1.2km)'
        },
        {
            path: [
                userLocation,
                { lat: userLocation.lat - 0.003, lng: userLocation.lng + 0.008 },
                { lat: userLocation.lat + 0.003, lng: userLocation.lng + 0.008 },
                userLocation
            ],
            color: '#17a2b8',
            title: '公園コース (約0.8km)'
        }
    ];
    
    walkingPaths.forEach((route, index) => {
        const polyline = new google.maps.Polyline({
            path: route.path,
            geodesic: true,
            strokeColor: route.color,
            strokeOpacity: 1.0,
            strokeWeight: 3,
            map: map
        });
        
        // コース情報ウィンドウ
        const infoWindow = new google.maps.InfoWindow({
            content: `<div style="padding: 5px;"><strong>${route.title}</strong><br>クリックして詳細を見る</div>`
        });
        
        polyline.addListener('click', (event) => {
            infoWindow.setPosition(event.latLng);
            infoWindow.open(map);
        });
    });
}

// 公園マーカー追加
function addParkMarkers() {
    if (!map || !userLocation) return;
    
    const parks = [
        {
            position: { lat: userLocation.lat + 0.008, lng: userLocation.lng + 0.003 },
            title: '近隣公園',
            description: '犬の散歩に人気のスポット'
        },
        {
            position: { lat: userLocation.lat - 0.005, lng: userLocation.lng + 0.007 },
            title: 'ドッグラン付き公園',
            description: '広いドッグランがあります'
        }
    ];
    
    parks.forEach(park => {
        const marker = new google.maps.Marker({
            position: park.position,
            map: map,
            title: park.title,
            icon: {
                url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNENBRjUwIi8+Cjwvc3ZnPgo=',
                scaledSize: new google.maps.Size(30, 30)
            }
        });
        
        const infoWindow = new google.maps.InfoWindow({
            content: `<div style="padding: 10px;"><h4>${park.title}</h4><p>${park.description}</p></div>`
        });
        
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
    });
}

// 近くの犬データ読み込み
function loadNearbyDogs() {
    // サンプルデータ（実際はFirestoreから取得）
    const sampleDogs = [
        {
            id: 1,
            ownerName: '田中さん',
            dogName: 'ポチ',
            breed: '柴犬',
            age: 3,
            distance: '300m',
            avatar: '🐕',
            personality: '人懐っこくて元気いっぱい'
        },
        {
            id: 2,
            ownerName: '佐藤さん',
            dogName: 'モコ',
            breed: 'トイプードル',
            age: 2,
            distance: '500m',
            avatar: '🐩',
            personality: 'おしとやかで賢い'
        },
        {
            id: 3,
            ownerName: '鈴木さん',
            dogName: 'ラブ',
            breed: 'ラブラドール',
            age: 5,
            distance: '800m',
            avatar: '🦮',
            personality: '穏やかで子供好き'
        }
    ];
    
    const nearbyDogsContainer = document.getElementById('nearby-dogs');
    nearbyDogsContainer.innerHTML = '';
    
    sampleDogs.forEach(dog => {
        const dogElement = createDogElement(dog);
        nearbyDogsContainer.appendChild(dogElement);
    });
}

// 犬要素作成
function createDogElement(dog) {
    const dogDiv = document.createElement('div');
    dogDiv.className = 'dog-item';
    dogDiv.innerHTML = `
        <div class="dog-avatar">${dog.avatar}</div>
        <div class="dog-info">
            <h4>${dog.dogName} (${dog.ownerName})</h4>
            <p>${dog.breed} • ${dog.age}歳 • ${dog.distance}先</p>
            <p style="font-size: 11px; color: #888;">${dog.personality}</p>
        </div>
    `;
    
    dogDiv.addEventListener('click', () => {
        showDogProfile(dog);
    });
    
    return dogDiv;
}

// 犬のプロフィール表示
function showDogProfile(dog) {
    const message = `🐕 ${dog.dogName}のプロフィール\\n\\n飼い主: ${dog.ownerName}\\n犬種: ${dog.breed}\\n年齢: ${dog.age}歳\\n距離: ${dog.distance}先\\n性格: ${dog.personality}\\n\\n散歩仲間になりませんか？`;
    alert(message);
}

// ユーザープロフィール読み込み
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('user-name-input').value = data.userName || '';
            document.getElementById('dog-name-input').value = data.dogName || '';
            document.getElementById('dog-breed-select').value = data.dogBreed || '';
            document.getElementById('dog-age-input').value = data.dogAge || '';
            document.getElementById('dog-personality-input').value = data.dogPersonality || '';
            
            // 統計情報更新
            document.getElementById('total-walks').textContent = data.totalWalks || 0;
            document.getElementById('friends-count').textContent = data.friendsCount || 0;
        }
    } catch (error) {
        console.error('プロフィール読み込みエラー:', error);
    }
}

// プロフィール保存
async function saveProfile() {
    if (!currentUser) return;
    
    const profileData = {
        userName: document.getElementById('user-name-input').value,
        dogName: document.getElementById('dog-name-input').value,
        dogBreed: document.getElementById('dog-breed-select').value,
        dogAge: parseInt(document.getElementById('dog-age-input').value) || 0,
        dogPersonality: document.getElementById('dog-personality-input').value,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        updatedAt: serverTimestamp()
    };
    
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        await setDoc(docRef, profileData, { merge: true });
        
        alert('プロフィールを保存しました！');
        // 表示名更新
        document.getElementById('user-name').textContent = profileData.userName || currentUser.displayName;
    } catch (error) {
        console.error('プロフィール保存エラー:', error);
        alert('保存に失敗しました。もう一度お試しください。');
    }
}

// 散歩開始
async function startWalk() {
    if (!currentUser) return;
    
    // 散歩記録をFirestoreに保存
    const walkData = {
        userId: currentUser.uid,
        startTime: serverTimestamp(),
        location: userLocation,
        status: 'active'
    };
    
    try {
        const docRef = await addDoc(collection(db, 'walks'), walkData);
        alert('散歩を開始しました！楽しい散歩をお楽しみください 🐕');
        console.log('散歩記録ID:', docRef.id);
        
        // 散歩回数を更新
        updateWalkCount();
    } catch (error) {
        console.error('散歩開始エラー:', error);
        alert('散歩の記録に失敗しました');
    }
}

// 散歩回数更新
async function updateWalkCount() {
    if (!currentUser) return;
    
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            const newCount = (data.totalWalks || 0) + 1;
            
            await setDoc(docRef, { totalWalks: newCount }, { merge: true });
            document.getElementById('total-walks').textContent = newCount;
        }
    } catch (error) {
        console.error('散歩回数更新エラー:', error);
    }
}

// 友達リスト読み込み
function loadFriends() {
    if (!currentUser) return;
    
    // サンプルデータ（実際はFirestoreから取得）
    const sampleFriends = [
        {
            id: 1,
            ownerName: '田中さん',
            dogName: 'ポチ',
            lastMet: '昨日一緒に散歩しました',
            avatar: '🐕'
        },
        {
            id: 2,
            ownerName: '佐藤さん',
            dogName: 'モコ',
            lastMet: '3日前に公園で会いました',
            avatar: '🐩'
        }
    ];
    
    const friendsContainer = document.getElementById('friends-list');
    friendsContainer.innerHTML = '';
    
    if (sampleFriends.length === 0) {
        friendsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">まだ友達がいません<br>散歩で新しい友達を見つけましょう！</div>';
        return;
    }
    
    sampleFriends.forEach(friend => {
        const friendElement = document.createElement('div');
        friendElement.className = 'dog-item';
        friendElement.innerHTML = `
            <div class="dog-avatar">${friend.avatar}</div>
            <div class="dog-info">
                <h4>${friend.ownerName} & ${friend.dogName}</h4>
                <p>${friend.lastMet}</p>
            </div>
        `;
        
        friendElement.addEventListener('click', () => {
            alert(`${friend.ownerName}さんとのメッセージ機能は準備中です`);
        });
        
        friendsContainer.appendChild(friendElement);
    });
}

// アプリ初期化を実行
initializeAppAuth();