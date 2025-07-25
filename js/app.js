// Firebase v9 SDK imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithCredential, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
// Firebase Storage は Base64 を使用するため不要
// import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
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
// const storage = getStorage(app); // Base64使用により不要
const analytics = getAnalytics(app);

// グローバル変数
let currentUser = null;
let map = null;
let userLocation = null;
let walkData = null; // 散歩中のデータ

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
    
    // 履歴フィルター
    document.getElementById('filter-all').addEventListener('click', () => loadWalkHistory('all'));
    document.getElementById('filter-week').addEventListener('click', () => loadWalkHistory('week'));
    document.getElementById('filter-month').addEventListener('click', () => loadWalkHistory('month'));
    
    // プロフィール画像アップロード
    document.getElementById('upload-avatar-btn').addEventListener('click', () => {
        document.getElementById('avatar-input').click();
    });
    document.getElementById('avatar-input').addEventListener('change', handleAvatarUpload);
    document.getElementById('remove-avatar-btn').addEventListener('click', removeAvatar);
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
        
        // プロフィール画像の表示（保存された画像またはGoogleアカウント画像）
        loadUserProfile().then(() => {
            // プロフィール読み込み完了後、Googleアカウント画像をフォールバックとして使用
            const avatarImage = document.getElementById('avatar-image');
            if (avatarImage.style.display === 'none' && currentUser.photoURL) {
                displayAvatar(currentUser.photoURL);
            }
        });
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
    
    // 履歴タブの場合、履歴を読み込み
    if (tabName === 'history') {
        loadWalkHistory('all');
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
            document.getElementById('dog-birthday-input').value = data.dogBirthday || '';
            document.getElementById('dog-age-input').value = data.dogAge || '';
            document.getElementById('dog-personality-input').value = data.dogPersonality || '';
            
            // プロフィール画像を表示（Base64優先、URLはフォールバック）
            if (data.avatarBase64) {
                displayAvatar(data.avatarBase64);
            } else if (data.avatarURL) {
                displayAvatar(data.avatarURL);
            } else {
                showDefaultAvatar();
            }
            
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
        dogBirthday: document.getElementById('dog-birthday-input').value,
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
    
    if (walkData && walkData.status === 'active') {
        // 散歩中の場合は終了処理
        await endWalk();
        return;
    }
    
    // 散歩記録をFirestoreに保存
    walkData = {
        userId: currentUser.uid,
        startTime: new Date(),
        startLocation: userLocation,
        status: 'active',
        distance: 0,
        path: [userLocation], // 散歩ルートを記録
        lastLocation: userLocation
    };
    
    try {
        const docRef = await addDoc(collection(db, 'walks'), {
            userId: currentUser.uid,
            startTime: serverTimestamp(),
            startLocation: userLocation,
            status: 'active'
        });
        walkData.docId = docRef.id;
        
        // ボタンのテキストを変更
        document.getElementById('start-walk-btn').textContent = '散歩を終了 ⏰';
        document.getElementById('start-walk-btn').style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
        
        alert('散歩を開始しました！楽しい散歩をお楽しみください 🐕');
        console.log('散歩記録ID:', docRef.id);
        
        // 位置情報の定期追跡を開始
        startLocationTracking();
        
        // 散歩統計表示を開始
        startWalkStatsDisplay();
        
        // 散歩回数を更新
        updateWalkCount();
    } catch (error) {
        console.error('散歩開始エラー:', error);
        alert('散歩の記録に失敗しました');
    }
}

// 散歩終了
async function endWalk() {
    if (!walkData || walkData.status !== 'active') return;
    
    walkData.endTime = new Date();
    walkData.status = 'completed';
    
    // 散歩時間を計算（分）
    const duration = Math.round((walkData.endTime - walkData.startTime) / 1000 / 60);
    
    try {
        // Firestoreに最終データを保存
        const docRef = doc(db, 'walks', walkData.docId);
        await setDoc(docRef, {
            endTime: serverTimestamp(),
            endLocation: userLocation,
            status: 'completed',
            distance: Math.round(walkData.distance * 100) / 100, // 小数点2桁
            duration: duration,
            path: walkData.path
        }, { merge: true });
        
        // ボタンを元に戻す
        document.getElementById('start-walk-btn').textContent = '散歩を始める 🚶‍♂️';
        document.getElementById('start-walk-btn').style.background = 'linear-gradient(135deg, #28a745, #20c997)';
        
        // 位置情報追跡を停止
        stopLocationTracking();
        
        // 散歩統計表示を停止
        stopWalkStatsDisplay();
        
        // 結果を表示
        alert(`散歩完了！\n\n📏 距離: ${walkData.distance.toFixed(2)}km\n⏰ 時間: ${duration}分\n\nお疲れさまでした！🐕`);
        
        walkData = null;
        
        console.log('散歩完了:', { distance: walkData?.distance, duration });
    } catch (error) {
        console.error('散歩終了エラー:', error);
        alert('散歩記録の保存に失敗しました');
    }
}

// 位置情報追跡開始
let locationWatchId = null;

function startLocationTracking() {
    if (!navigator.geolocation) return;
    
    locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            if (walkData && walkData.status === 'active') {
                // 前回の位置からの距離を計算
                const distance = calculateDistance(walkData.lastLocation, newLocation);
                walkData.distance += distance;
                walkData.path.push(newLocation);
                walkData.lastLocation = newLocation;
                
                console.log(`散歩中: ${walkData.distance.toFixed(2)}km`);
            }
            
            userLocation = newLocation;
        },
        (error) => {
            console.error('位置情報追跡エラー:', error);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000
        }
    );
}

// 位置情報追跡停止
function stopLocationTracking() {
    if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
    }
}

// 2点間の距離を計算（km）
function calculateDistance(pos1, pos2) {
    const R = 6371; // 地球の半径（km）
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// 散歩統計のリアルタイム表示
let walkStatsInterval = null;

function startWalkStatsDisplay() {
    // 散歩統計エリアを表示
    document.getElementById('walk-stats').classList.remove('hidden');
    
    // 1秒ごとに統計を更新
    walkStatsInterval = setInterval(() => {
        if (walkData && walkData.status === 'active') {
            // 経過時間を計算（分）
            const duration = Math.round((new Date() - walkData.startTime) / 1000 / 60);
            
            // 画面に表示
            document.getElementById('current-distance').textContent = walkData.distance.toFixed(2);
            document.getElementById('current-duration').textContent = duration;
        }
    }, 1000);
}

function stopWalkStatsDisplay() {
    // 散歩統計エリアを非表示
    document.getElementById('walk-stats').classList.add('hidden');
    
    // 間隔タイマーを停止
    if (walkStatsInterval) {
        clearInterval(walkStatsInterval);
        walkStatsInterval = null;
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

// 散歩履歴読み込み
async function loadWalkHistory(filter = 'all') {
    if (!currentUser) return;
    
    console.log('散歩履歴を読み込み:', filter);
    
    // フィルターボタンの状態更新
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filter-${filter}`).classList.add('active');
    
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '<div class="loading-message">履歴を読み込み中...</div>';
    
    try {
        // Firestoreから散歩履歴を取得
        const walks = [];
        const walksRef = collection(db, 'walks');
        const q = query(
            walksRef,
            where('userId', '==', currentUser.uid),
            where('status', '==', 'completed'),
            orderBy('startTime', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.startTime && data.endTime) {
                walks.push({
                    id: doc.id,
                    ...data,
                    startTime: data.startTime.toDate(),
                    endTime: data.endTime.toDate()
                });
            }
        });
        
        // フィルター適用
        const filteredWalks = filterWalks(walks, filter);
        
        // 履歴表示
        displayWalkHistory(filteredWalks);
        
        // 統計情報更新
        updateHistorySummary(filteredWalks);
        
    } catch (error) {
        console.error('履歴読み込みエラー:', error);
        historyList.innerHTML = '<div class="no-history"><h4>履歴の読み込みに失敗しました</h4><p>もう一度お試しください</p></div>';
    }
}

// 履歴フィルター
function filterWalks(walks, filter) {
    const now = new Date();
    
    switch (filter) {
        case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return walks.filter(walk => walk.startTime >= weekAgo);
        case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return walks.filter(walk => walk.startTime >= monthAgo);
        default:
            return walks;
    }
}

// 履歴表示
function displayWalkHistory(walks) {
    const historyList = document.getElementById('history-list');
    
    if (walks.length === 0) {
        historyList.innerHTML = `
            <div class="no-history">
                <h4>散歩履歴がありません</h4>
                <p>散歩を始めて記録を作りましょう！🐕</p>
            </div>
        `;
        return;
    }
    
    const historyHTML = walks.map(walk => {
        const date = formatDate(walk.startTime);
        const time = formatTime(walk.startTime);
        const distance = walk.distance ? walk.distance.toFixed(2) : '0.00';
        const duration = walk.duration || 0;
        
        return `
            <div class="history-item">
                <div class="history-header">
                    <div>
                        <div class="history-date">${date}</div>
                        <div class="history-time">${time}</div>
                    </div>
                </div>
                <div class="history-stats">
                    <div class="history-stat">
                        <span class="history-stat-value">${distance}</span>
                        <span class="history-stat-label">km</span>
                    </div>
                    <div class="history-stat">
                        <span class="history-stat-value">${duration}</span>
                        <span class="history-stat-label">分</span>
                    </div>
                    <div class="history-stat">
                        <span class="history-stat-value">${distance > 0 && duration > 0 ? (distance / duration * 60).toFixed(1) : '0.0'}</span>
                        <span class="history-stat-label">km/h</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    historyList.innerHTML = historyHTML;
}

// 履歴統計更新
function updateHistorySummary(walks) {
    const totalDistance = walks.reduce((sum, walk) => sum + (walk.distance || 0), 0);
    const totalDuration = walks.reduce((sum, walk) => sum + (walk.duration || 0), 0);
    const avgDistance = walks.length > 0 ? totalDistance / walks.length : 0;
    
    document.getElementById('total-distance').textContent = totalDistance.toFixed(1);
    document.getElementById('total-duration').textContent = totalDuration;
    document.getElementById('avg-distance').textContent = avgDistance.toFixed(1);
}

// 日付フォーマット
function formatDate(date) {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
        return '今日';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return '昨日';
    } else {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
}

// 時刻フォーマット
function formatTime(date) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// プロフィール画像関連の関数（Base64版 - 無料）
async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file || !currentUser) return;
    
    // ファイルサイズチェック（500KB以下に制限）
    if (file.size > 500 * 1024) {
        alert('ファイルサイズは500KB以下にしてください（Firestoreの制限のため）');
        return;
    }
    
    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
    }
    
    try {
        // ローディング表示
        document.getElementById('upload-avatar-btn').textContent = '📤 処理中...';
        document.getElementById('upload-avatar-btn').disabled = true;
        
        // ファイルをBase64に変換
        const base64String = await convertToBase64(file);
        
        // Firestoreにプロフィール画像（Base64）を保存
        const docRef = doc(db, 'users', currentUser.uid);
        await setDoc(docRef, { 
            avatarBase64: base64String,
            avatarURL: null // Storageは使わないのでクリア
        }, { merge: true });
        
        // 画像を表示
        displayAvatar(base64String);
        
        alert('プロフィール画像を更新しました！');
        
    } catch (error) {
        console.error('画像処理エラー:', error);
        alert('画像の処理に失敗しました');
    } finally {
        // ボタンを元に戻す
        document.getElementById('upload-avatar-btn').textContent = '📷 写真を選択';
        document.getElementById('upload-avatar-btn').disabled = false;
        // ファイル入力をリセット
        event.target.value = '';
    }
}

// ファイルをBase64に変換する関数
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function removeAvatar() {
    if (!currentUser) return;
    
    try {
        // FirestoreからBase64アバター情報を削除
        const docRef = doc(db, 'users', currentUser.uid);
        await setDoc(docRef, { 
            avatarBase64: null,
            avatarURL: null // 古いデータもクリア
        }, { merge: true });
        
        // デフォルトアバターを表示
        showDefaultAvatar();
        
        alert('プロフィール画像を削除しました');
        
    } catch (error) {
        console.error('画像削除エラー:', error);
        alert('画像の削除に失敗しました');
    }
}

function displayAvatar(url) {
    const avatarImage = document.getElementById('avatar-image');
    const defaultAvatar = document.getElementById('default-avatar');
    const removeBtn = document.getElementById('remove-avatar-btn');
    
    avatarImage.src = url;
    avatarImage.style.display = 'block';
    defaultAvatar.style.display = 'none';
    removeBtn.classList.remove('hidden');
}

function showDefaultAvatar() {
    const avatarImage = document.getElementById('avatar-image');
    const defaultAvatar = document.getElementById('default-avatar');
    const removeBtn = document.getElementById('remove-avatar-btn');
    
    avatarImage.style.display = 'none';
    defaultAvatar.style.display = 'block';
    removeBtn.classList.add('hidden');
}

// アプリ初期化時にデフォルトアバターを表示
function initializeAvatar() {
    showDefaultAvatar();
}

// アプリ初期化を実行
initializeAppAuth();
initializeAvatar();