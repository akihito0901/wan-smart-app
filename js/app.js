// Firebase v9 SDK imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, onSnapshot, updateDoc, arrayUnion, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
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
let currentChatUser = null; // 現在チャット中のユーザー
let messagesListener = null; // メッセージリアルタイム監視
let currentGroups = ['close-friends', 'walking-buddies', 'park-friends']; // デフォルトグループ
let selectedFriend = null; // 選択された友達（グループ変更用）
let currentFilter = 'all'; // 現在のフィルター

// DOM要素
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const logoutBtn = document.getElementById('logout-btn');

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeAppAuth();
    setupEventListeners();
    initializeAvatar();
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
    // Googleログインボタン
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', signInWithGoogle);
    }

    // タブ切り替え
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // ログアウト
    logoutBtn.addEventListener('click', logout);

    // プロフィール保存
    document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
    
    // 誕生日変更時の年齢自動計算
    document.getElementById('dog-birthday-input').addEventListener('change', calculateAge);

    // 散歩開始
    document.getElementById('start-walk-btn').addEventListener('click', startWalk);
    
    // 履歴フィルター
    document.getElementById('filter-all').addEventListener('click', () => loadWalkHistory('all'));
    document.getElementById('filter-week').addEventListener('click', () => loadWalkHistory('week'));
    document.getElementById('filter-month').addEventListener('click', () => loadWalkHistory('month'));
    
    // メッセージ機能のイベントリスナー
    document.getElementById('back-to-messages').addEventListener('click', backToMessagesList);
    document.getElementById('send-message').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 友達グループ管理のイベントリスナー
    document.getElementById('add-group-btn').addEventListener('click', showGroupManagementModal);
    document.getElementById('manage-groups-btn').addEventListener('click', showGroupManagementModal);
    document.getElementById('close-group-modal').addEventListener('click', hideGroupManagementModal);
    document.getElementById('close-friend-group-modal').addEventListener('click', hideFriendGroupModal);
    document.getElementById('save-friend-groups').addEventListener('click', saveFriendGroups);
    document.getElementById('cancel-friend-groups').addEventListener('click', hideFriendGroupModal);
    document.querySelector('.add-new-group-btn').addEventListener('click', addNewGroup);
    
    // グループフィルターのイベントリスナー
    document.querySelectorAll('.group-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const group = e.target.dataset.group;
            filterFriendsByGroup(group);
        });
    });
    
    // プロフィール画像アップロード（インスタグラム風）
    const userAvatar = document.getElementById('user-avatar');
    const avatarInput = document.getElementById('avatar-input');
    if (userAvatar && avatarInput) {
        userAvatar.addEventListener('click', handleAvatarClick);
        avatarInput.addEventListener('change', handleAvatarUpload);
    } else {
        console.error('Avatar elements not found during setup');
    }
    
    // オーバーレイボタン
    const changePhotoBtn = document.getElementById('change-photo-btn');
    const removePhotoBtn = document.getElementById('remove-photo-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const photoOverlay = document.getElementById('photo-overlay');
    
    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', () => {
            hidePhotoOverlay();
            const avatarInput = document.getElementById('avatar-input');
            if (avatarInput) {
                avatarInput.click();
            }
        });
    }
    
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', () => {
            hidePhotoOverlay();
            removeAvatar();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hidePhotoOverlay);
    }
    
    // オーバーレイの背景クリックで閉じる
    if (photoOverlay) {
        photoOverlay.addEventListener('click', (e) => {
            if (e.target.id === 'photo-overlay') {
                hidePhotoOverlay();
            }
        });
    }
}

// Firebase Authを使ったGoogleログイン
async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    
    try {
        console.log('Googleログイン開始');
        const result = await signInWithPopup(auth, provider);
        console.log('ログイン成功:', result.user);
        console.log('ユーザー情報:', result.user.displayName, result.user.email);
    } catch (error) {
        console.error('ログインエラー:', error);
        alert('ログインに失敗しました。もう一度お試しください。');
    }
}

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
    if (tabName === 'map' && map && typeof google !== 'undefined' && google.maps) {
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
    
    // メッセージタブの場合、会話リストを読み込み
    if (tabName === 'messages') {
        loadConversations();
        showMessagesList();
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
    if (!userLocation || typeof google === 'undefined' || !google.maps) {
        console.log('Google Maps API not loaded or user location not available');
        return;
    }
    
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
    if (!map || !userLocation || typeof google === 'undefined' || !google.maps) return;
    
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
    if (!map || !userLocation || typeof google === 'undefined' || !google.maps) return;
    
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
            document.getElementById('dog-gender-select').value = data.dogGender || '';
            document.getElementById('dog-personality-input').value = data.dogPersonality || '';
            
            // 誕生日が設定されている場合は年齢を自動計算
            if (data.dogBirthday) {
                calculateAge();
            }
            
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
            
            // 表示名を愛犬の名前に更新
            document.getElementById('user-name').textContent = data.dogName || data.userName || currentUser.displayName;
        }
    } catch (error) {
        console.error('プロフィール読み込みエラー:', error);
    }
}

// プロフィール保存
async function saveProfile() {
    if (!currentUser) return;
    
    // 基本的なバリデーション
    const userName = document.getElementById('user-name-input').value.trim();
    const dogName = document.getElementById('dog-name-input').value.trim();
    
    if (!userName) {
        alert('お名前を入力してください');
        return;
    }
    
    if (!dogName) {
        alert('愛犬の名前を入力してください');
        return;
    }
    
    const profileData = {
        userName: userName,
        dogName: dogName,
        dogBreed: document.getElementById('dog-breed-select').value,
        dogBirthday: document.getElementById('dog-birthday-input').value,
        dogGender: document.getElementById('dog-gender-select').value,
        dogPersonality: document.getElementById('dog-personality-input').value.trim(),
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        updatedAt: serverTimestamp()
    };
    
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        await setDoc(docRef, profileData, { merge: true });
        
        alert('プロフィールを保存しました！');
        // 表示名を愛犬の名前に更新
        document.getElementById('user-name').textContent = profileData.dogName || profileData.userName || currentUser.displayName;
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
        
        // ログを記録（walkDataをnullにする前に）
        console.log('散歩完了:', { distance: walkData.distance, duration });
        
        // 結果を表示
        alert(`散歩完了！\n\n📏 距離: ${walkData.distance.toFixed(2)}km\n⏰ 時間: ${duration}分\n\nお疲れさまでした！🐕`);
        
        walkData = null;
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

// 友達リスト読み込み（グループ分け対応）
function loadFriends() {
    if (!currentUser) return;
    
    // サンプルデータ（実際はFirestoreから取得）
    const sampleFriends = [
        {
            id: 1,
            ownerName: '田中さん',
            dogName: 'ポチ',
            lastMet: '昨日一緒に散歩しました',
            avatar: '🐕',
            groups: ['close-friends', 'walking-buddies']
        },
        {
            id: 2,
            ownerName: '佐藤さん',
            dogName: 'モコ',
            lastMet: '3日前に公園で会いました',
            avatar: '🐩',
            groups: ['walking-buddies']
        },
        {
            id: 3,
            ownerName: '鈴木さん',
            dogName: 'ラブ',
            lastMet: '1週間前に公園で会いました',
            avatar: '🦮',
            groups: ['park-friends']
        },
        {
            id: 4,
            ownerName: '山田さん',
            dogName: 'チョコ',
            lastMet: '2週間前に散歩で会いました',
            avatar: '🐕‍🦺',
            groups: ['close-friends', 'park-friends']
        }
    ];
    
    displayFriendsGrouped(sampleFriends);
}

// 友達をグループ分けして表示
function displayFriendsGrouped(friends) {
    const friendsContainer = document.getElementById('friends-list');
    friendsContainer.innerHTML = '';
    
    if (friends.length === 0) {
        friendsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">まだ友達がいません<br>散歩で新しい友達を見つけましょう！</div>';
        return;
    }
    
    // フィルター適用
    const filteredFriends = filterFriends(friends, currentFilter);
    
    if (currentFilter === 'all') {
        // すべて表示の場合、グループ別に表示
        const groupNames = {
            'close-friends': '親しい友達',
            'walking-buddies': '散歩仲間',
            'park-friends': '公園友達',
            'ungrouped': 'その他'
        };
        
        const groupedFriends = {};
        
        // グループ別に分類
        filteredFriends.forEach(friend => {
            if (!friend.groups || friend.groups.length === 0) {
                if (!groupedFriends['ungrouped']) groupedFriends['ungrouped'] = [];
                groupedFriends['ungrouped'].push(friend);
            } else {
                friend.groups.forEach(group => {
                    if (!groupedFriends[group]) groupedFriends[group] = [];
                    if (!groupedFriends[group].includes(friend)) {
                        groupedFriends[group].push(friend);
                    }
                });
            }
        });
        
        // グループごとに表示
        Object.keys(groupedFriends).forEach(groupKey => {
            const groupFriends = groupedFriends[groupKey];
            if (groupFriends.length > 0) {
                const groupSection = createGroupSection(groupNames[groupKey] || groupKey, groupFriends);
                friendsContainer.appendChild(groupSection);
            }
        });
    } else {
        // 特定のグループの場合、そのまま表示
        const groupName = getGroupDisplayName(currentFilter);
        const groupSection = createGroupSection(groupName, filteredFriends);
        friendsContainer.appendChild(groupSection);
    }
}

// グループセクションを作成
function createGroupSection(groupName, friends) {
    const section = document.createElement('div');
    section.className = 'group-section';
    
    section.innerHTML = `
        <div class="group-header">
            <div class="group-title">${groupName}</div>
            <div class="group-count">${friends.length}</div>
        </div>
        <div class="group-friends"></div>
    `;
    
    const groupFriendsContainer = section.querySelector('.group-friends');
    
    friends.forEach(friend => {
        const friendElement = createFriendElement(friend);
        groupFriendsContainer.appendChild(friendElement);
    });
    
    return section;
}

// 友達要素を作成（グループ管理ボタン付き）
function createFriendElement(friend) {
    const friendElement = document.createElement('div');
    friendElement.className = 'dog-item';
    friendElement.innerHTML = `
        <div class="dog-avatar">${friend.avatar}</div>
        <div class="dog-info">
            <h4>${friend.ownerName} & ${friend.dogName}</h4>
            <p>${friend.lastMet}</p>
        </div>
        <div class="friend-actions">
            <button class="group-change-btn" onclick="showFriendGroupModal(${friend.id})">グループ</button>
        </div>
    `;
    
    // クリックでチャット開始（ボタン以外の部分）
    friendElement.addEventListener('click', (e) => {
        if (!e.target.classList.contains('group-change-btn')) {
            openChatWithFriend(friend);
        }
    });
    
    return friendElement;
}

// 友達をフィルター
function filterFriends(friends, filter) {
    if (filter === 'all') {
        return friends;
    }
    
    return friends.filter(friend => 
        friend.groups && friend.groups.includes(filter)
    );
}

// グループ表示名を取得
function getGroupDisplayName(groupKey) {
    const groupNames = {
        'close-friends': '親しい友達',
        'walking-buddies': '散歩仲間',
        'park-friends': '公園友達'
    };
    return groupNames[groupKey] || groupKey;
}

// グループでフィルター
function filterFriendsByGroup(group) {
    currentFilter = group;
    
    // フィルターボタンの状態更新
    document.querySelectorAll('.group-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-group="${group}"]`).classList.add('active');
    
    // 友達リストを再読み込み
    loadFriends();
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
    if (!file || !currentUser) {
        console.log('No file selected or user not authenticated');
        return;
    }
    
    console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
    }
    
    // より大きなファイルサイズを許可（2MB以下）
    if (file.size > 2 * 1024 * 1024) {
        alert('ファイルサイズは2MB以下にしてください');
        return;
    }
    
    try {
        // ローディング表示（プロフィール画像全体をローディング状態に）
        const avatar = document.getElementById('user-avatar');
        if (avatar) {
            avatar.style.opacity = '0.6';
            avatar.style.pointerEvents = 'none';
        }
        
        console.log('Starting image processing...');
        
        // 画像を圧縮してからBase64に変換
        const compressedFile = await compressImage(file, 0.7, 400, 400); // 70% quality, max 400x400px
        console.log('Compressed file size:', compressedFile.size);
        
        // ファイルをBase64に変換
        const base64String = await convertToBase64(compressedFile);
        console.log('Base64 string length:', base64String.length);
        
        // Firestoreにプロフィール画像（Base64）を保存
        const docRef = doc(db, 'users', currentUser.uid);
        await setDoc(docRef, { 
            avatarBase64: base64String,
            avatarURL: null // Storageは使わないのでクリア
        }, { merge: true });
        
        console.log('Image saved to Firestore successfully');
        
        // 画像を表示
        displayAvatar(base64String);
        
        alert('プロフィール画像を更新しました！');
        
    } catch (error) {
        console.error('画像処理エラー:', error);
        alert('画像の処理に失敗しました: ' + error.message);
    } finally {
        // ローディング状態を元に戻す
        const avatar = document.getElementById('user-avatar');
        if (avatar) {
            avatar.style.opacity = '1';
            avatar.style.pointerEvents = 'auto';
        }
        // ファイル入力をリセット
        event.target.value = '';
    }
}

// 画像を圧縮する関数
function compressImage(file, quality = 0.7, maxWidth = 400, maxHeight = 400) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // アスペクト比を保持してリサイズ
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 画像を描画
            ctx.drawImage(img, 0, 0, width, height);
            
            // Blobとして出力
            canvas.toBlob(resolve, file.type, quality);
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
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

// インスタグラム風のアバタークリック処理
function handleAvatarClick() {
    const avatarImage = document.getElementById('avatar-image');
    const defaultAvatar = document.getElementById('default-avatar');
    
    if (!avatarImage || !defaultAvatar) {
        console.error('Avatar elements not found');
        return;
    }
    
    // シンプルで確実な写真有無の判定
    const hasPhoto = avatarImage.style.display === 'block' && 
                    avatarImage.src && 
                    avatarImage.src.length > 0 &&
                    !avatarImage.src.endsWith('index.html');
    
    console.log('Avatar click detected, hasPhoto:', hasPhoto, 'src:', avatarImage.src);
    
    // 暫定的にすべてのクリックでファイル選択ダイアログを開く（デバッグ用）
    const fileInput = document.getElementById('avatar-input');
    if (fileInput) {
        console.log('Opening file dialog');
        fileInput.click();
    } else {
        console.error('File input not found');
    }
}

// グローバルな ESC キーハンドラーの参照を保持
let escKeyHandler = null;

// フォトオーバーレイを表示
function showPhotoOverlay() {
    document.getElementById('photo-overlay').classList.remove('hidden');
    // ESCキーでも閉じられるように（前回のハンドラーがあれば削除）
    if (escKeyHandler) {
        document.removeEventListener('keydown', escKeyHandler);
    }
    escKeyHandler = handleEscKey;
    document.addEventListener('keydown', escKeyHandler);
}

// フォトオーバーレイを隠す
function hidePhotoOverlay() {
    document.getElementById('photo-overlay').classList.add('hidden');
    if (escKeyHandler) {
        document.removeEventListener('keydown', escKeyHandler);
        escKeyHandler = null;
    }
}

// ESCキーでオーバーレイを閉じる
function handleEscKey(e) {
    if (e.key === 'Escape') {
        hidePhotoOverlay();
    }
}

function displayAvatar(url) {
    const avatarImage = document.getElementById('avatar-image');
    const defaultAvatar = document.getElementById('default-avatar');
    
    if (!avatarImage || !defaultAvatar) {
        console.error('Avatar display elements not found');
        return;
    }
    
    console.log('Displaying avatar with URL:', url);
    avatarImage.src = url;
    avatarImage.style.display = 'block';
    defaultAvatar.style.display = 'none';
}

function showDefaultAvatar() {
    const avatarImage = document.getElementById('avatar-image');
    const defaultAvatar = document.getElementById('default-avatar');
    
    if (!avatarImage || !defaultAvatar) {
        console.error('Avatar display elements not found');
        return;
    }
    
    console.log('Showing default avatar');
    avatarImage.style.display = 'none';
    defaultAvatar.style.display = 'flex';
}

// 誕生日から年齢を自動計算する関数
function calculateAge() {
    const birthdayInput = document.getElementById('dog-birthday-input');
    const ageDisplay = document.getElementById('dog-age-display');
    
    if (!birthdayInput.value) {
        ageDisplay.value = '';
        return;
    }
    
    const birthday = new Date(birthdayInput.value);
    const today = new Date();
    
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    
    // まだ誕生日が来ていない場合は1歳引く
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
        age--;
    }
    
    // 年齢が負の場合は0にする
    if (age < 0) {
        age = 0;
    }
    
    ageDisplay.value = `${age}歳`;
}

// アプリ初期化時にデフォルトアバターを表示
function initializeAvatar() {
    showDefaultAvatar();
}

// デバッグ用関数（コンソールから呼び出し可能）
window.debugPhotoUpload = function() {
    console.log('=== Photo Upload Debug ===');
    const userAvatar = document.getElementById('user-avatar');
    const avatarInput = document.getElementById('avatar-input');
    const avatarImage = document.getElementById('avatar-image');
    const defaultAvatar = document.getElementById('default-avatar');
    
    console.log('Elements found:');
    console.log('- userAvatar:', !!userAvatar);
    console.log('- avatarInput:', !!avatarInput);
    console.log('- avatarImage:', !!avatarImage);
    console.log('- defaultAvatar:', !!defaultAvatar);
    
    if (avatarImage) {
        console.log('Avatar image display:', avatarImage.style.display);
        console.log('Avatar image src:', avatarImage.src);
    }
    
    if (avatarInput) {
        console.log('File input accepts:', avatarInput.accept);
        console.log('Event listeners attached to input:', getEventListeners ? getEventListeners(avatarInput) : 'Cannot check');
    }
};

// 強制的にファイル選択ダイアログを開く関数
window.forceFileDialog = function() {
    const avatarInput = document.getElementById('avatar-input');
    if (avatarInput) {
        avatarInput.click();
        console.log('File dialog opened');
    } else {
        console.error('Avatar input not found');
    }
};

// メッセージ機能の実装

// 会話リストを読み込み
async function loadConversations() {
    if (!currentUser) return;
    
    const conversationsContainer = document.getElementById('conversations-list');
    conversationsContainer.innerHTML = '<div class="loading-message">会話を読み込み中...</div>';
    
    try {
        // サンプルデータ（実際はFirestoreから取得）
        const sampleConversations = [
            {
                id: 'user1',
                name: '田中さん & ポチ',
                avatar: '🐕',
                lastMessage: 'また今度一緒に散歩しましょう！',
                lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30分前
                unread: true
            },
            {
                id: 'user2', 
                name: '佐藤さん & モコ',
                avatar: '🐩',
                lastMessage: 'ありがとうございました',
                lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2時間前
                unread: false
            }
        ];
        
        if (sampleConversations.length === 0) {
            conversationsContainer.innerHTML = `
                <div class="no-conversations">
                    <h4>まだメッセージがありません</h4>
                    <p>友達リストから新しい会話を始めましょう！</p>
                </div>
            `;
            return;
        }
        
        conversationsContainer.innerHTML = '';
        sampleConversations.forEach(conversation => {
            const conversationElement = createConversationElement(conversation);
            conversationsContainer.appendChild(conversationElement);
        });
        
    } catch (error) {
        console.error('会話リスト読み込みエラー:', error);
        conversationsContainer.innerHTML = '<div class="no-conversations"><h4>会話の読み込みに失敗しました</h4></div>';
    }
}

// 会話要素を作成
function createConversationElement(conversation) {
    const conversationDiv = document.createElement('div');
    conversationDiv.className = 'conversation-item';
    
    const timeString = formatConversationTime(conversation.lastMessageTime);
    
    conversationDiv.innerHTML = `
        <div class="conversation-avatar">${conversation.avatar}</div>
        <div class="conversation-info">
            <div class="conversation-name">${conversation.name}</div>
            <div class="conversation-last-message">${conversation.lastMessage}</div>
        </div>
        <div class="conversation-time">${timeString}</div>
        ${conversation.unread ? '<div class="conversation-unread"></div>' : ''}
    `;
    
    conversationDiv.addEventListener('click', () => {
        openChat(conversation);
    });
    
    return conversationDiv;
}

// 会話時刻をフォーマット
function formatConversationTime(date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) {
        return '今';
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes}分前`;
    } else if (diffInMinutes < 60 * 24) {
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours}時間前`;
    } else {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
}

// チャット画面を開く
function openChat(conversation) {
    currentChatUser = conversation;
    
    // チャット情報を設定
    document.getElementById('chat-name').textContent = conversation.name;
    document.getElementById('chat-avatar').src = conversation.avatar;
    document.getElementById('chat-status').textContent = 'オンライン';
    
    // メッセージを読み込み
    loadMessages(conversation.id);
    
    // チャット画面を表示
    showChatView();
}

// 友達からチャットを開く
function openChatWithFriend(friend) {
    // メッセージタブに切り替え
    switchTab('messages');
    
    // 友達の情報でチャットを開く
    const conversation = {
        id: friend.id,
        name: `${friend.ownerName} & ${friend.dogName}`,
        avatar: friend.avatar
    };
    
    openChat(conversation);
}

// メッセージを読み込み
async function loadMessages(conversationId) {
    if (!currentUser) return;
    
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '<div class="loading-message">メッセージを読み込み中...</div>';
    
    try {
        // サンプルメッセージ（実際はFirestoreから取得）
        const sampleMessages = [
            {
                id: '1',
                text: 'こんにちは！今日は散歩日和ですね',
                senderId: conversationId,
                timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1時間前
                isOwn: false
            },
            {
                id: '2', 
                text: 'そうですね！近くの公園で一緒に散歩しませんか？',
                senderId: currentUser.uid,
                timestamp: new Date(Date.now() - 1000 * 60 * 50), // 50分前
                isOwn: true
            },
            {
                id: '3',
                text: 'いいですね！2時頃はいかがですか？',
                senderId: conversationId,
                timestamp: new Date(Date.now() - 1000 * 60 * 40), // 40分前
                isOwn: false
            },
            {
                id: '4',
                text: 'OKです！お待ちしています',
                senderId: currentUser.uid,
                timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30分前
                isOwn: true
            }
        ];
        
        displayMessages(sampleMessages);
        
    } catch (error) {
        console.error('メッセージ読み込みエラー:', error);
        chatMessages.innerHTML = '<div class="no-messages">メッセージの読み込みに失敗しました</div>';
    }
}

// メッセージを表示
function displayMessages(messages) {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    
    if (messages.length === 0) {
        chatMessages.innerHTML = '<div class="no-messages">まだメッセージがありません<br>最初のメッセージを送ってみましょう！</div>';
        return;
    }
    
    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        chatMessages.appendChild(messageElement);
    });
    
    // 最新メッセージまでスクロール
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// メッセージ要素を作成
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-item ${message.isOwn ? 'own' : ''}`;
    
    const timeString = formatTime(message.timestamp);
    
    messageDiv.innerHTML = `
        <div class="message-bubble">
            ${message.text}
            <div class="message-time">${timeString}</div>
        </div>
    `;
    
    return messageDiv;
}

// メッセージを送信
async function sendMessage() {
    if (!currentUser || !currentChatUser) return;
    
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();
    
    if (!messageText) return;
    
    try {
        // 送信ボタンを無効化
        const sendBtn = document.getElementById('send-message');
        sendBtn.disabled = true;
        
        // 入力欄をクリア
        messageInput.value = '';
        
        // 新しいメッセージを画面に表示
        const newMessage = {
            id: Date.now().toString(),
            text: messageText,
            senderId: currentUser.uid,
            timestamp: new Date(),
            isOwn: true
        };
        
        const messageElement = createMessageElement(newMessage);
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Firestoreにメッセージを保存
        await saveMessageToFirestore(currentChatUser.id, messageText);
        
        // 自動返信のシミュレーション（実際は相手が送信）
        setTimeout(() => {
            const replyMessage = {
                id: (Date.now() + 1).toString(),
                text: 'メッセージを受け取りました！',
                senderId: currentChatUser.id,
                timestamp: new Date(),
                isOwn: false
            };
            
            const replyElement = createMessageElement(replyMessage);
            chatMessages.appendChild(replyElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
        
    } catch (error) {
        console.error('メッセージ送信エラー:', error);
        alert('メッセージの送信に失敗しました');
    } finally {
        // 送信ボタンを有効化
        document.getElementById('send-message').disabled = false;
    }
}

// メッセージリスト画面を表示
function showMessagesList() {
    document.getElementById('message-list-view').classList.remove('hidden');
    document.getElementById('message-chat-view').classList.add('hidden');
}

// チャット画面を表示
function showChatView() {
    document.getElementById('message-list-view').classList.add('hidden');
    document.getElementById('message-chat-view').classList.remove('hidden');
}

// メッセージリストに戻る
function backToMessagesList() {
    showMessagesList();
    currentChatUser = null;
    
    // メッセージリアルタイム監視を停止
    if (messagesListener) {
        messagesListener();
        messagesListener = null;
    }
}

// Firestore メッセージデータ構造の実装

// メッセージをFirestoreに保存
async function saveMessageToFirestore(receiverId, messageText) {
    if (!currentUser) return;
    
    try {
        const messageData = {
            senderId: currentUser.uid,
            receiverId: receiverId,
            text: messageText,
            timestamp: serverTimestamp(),
            read: false
        };
        
        // メッセージをmessagesコレクションに保存
        const messagesRef = collection(db, 'messages');
        await addDoc(messagesRef, messageData);
        
        // 会話を更新または作成
        await updateConversation(receiverId, messageText);
        
        console.log('メッセージがFirestoreに保存されました');
        
    } catch (error) {
        console.error('メッセージ保存エラー:', error);
        throw error;
    }
}

// 会話情報を更新
async function updateConversation(receiverId, lastMessage) {
    if (!currentUser) return;
    
    try {
        // 会話IDを生成（送信者と受信者のUIDを組み合わせて一意のIDを作成）
        const conversationId = [currentUser.uid, receiverId].sort().join('_');
        
        const conversationData = {
            participants: [currentUser.uid, receiverId],
            lastMessage: lastMessage,
            lastMessageTime: serverTimestamp(),
            lastMessageSender: currentUser.uid,
            updatedAt: serverTimestamp()
        };
        
        // conversationsコレクションに保存（存在しない場合は作成）
        const conversationRef = doc(db, 'conversations', conversationId);
        await setDoc(conversationRef, conversationData, { merge: true });
        
    } catch (error) {
        console.error('会話更新エラー:', error);
    }
}

// Firestoreからメッセージを読み込み（リアルタイム）
async function loadMessagesFromFirestore(conversationId) {
    if (!currentUser) return;
    
    try {
        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            where('senderId', 'in', [currentUser.uid, conversationId]),
            where('receiverId', 'in', [currentUser.uid, conversationId]),
            orderBy('timestamp', 'asc'),
            limit(100)
        );
        
        // リアルタイム監視を設定
        messagesListener = onSnapshot(q, (snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                // 送信者と受信者が現在のユーザーまたは対話相手である場合のみ追加
                if ((data.senderId === currentUser.uid && data.receiverId === conversationId) ||
                    (data.senderId === conversationId && data.receiverId === currentUser.uid)) {
                    messages.push({
                        id: doc.id,
                        text: data.text,
                        senderId: data.senderId,
                        timestamp: data.timestamp?.toDate() || new Date(),
                        isOwn: data.senderId === currentUser.uid
                    });
                }
            });
            
            displayMessages(messages);
        });
        
    } catch (error) {
        console.error('Firestoreメッセージ読み込みエラー:', error);
        // エラーの場合はサンプルデータを表示
        loadMessages(conversationId);
    }
}

// Firestoreから会話リストを読み込み
async function loadConversationsFromFirestore() {
    if (!currentUser) return;
    
    try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('participants', 'array-contains', currentUser.uid),
            orderBy('lastMessageTime', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const conversations = [];
        
        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            const otherUserId = data.participants.find(id => id !== currentUser.uid);
            
            // 相手のユーザー情報を取得
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            if (otherUserDoc.exists()) {
                const otherUserData = otherUserDoc.data();
                conversations.push({
                    id: otherUserId,
                    name: `${otherUserData.userName || 'ユーザー'} & ${otherUserData.dogName || '愛犬'}`,
                    avatar: otherUserData.avatarBase64 || '🐕',
                    lastMessage: data.lastMessage,
                    lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
                    unread: data.lastMessageSender !== currentUser.uid // 相手が最後に送信した場合は未読
                });
            }
        }
        
        return conversations;
        
    } catch (error) {
        console.error('Firestore会話リスト読み込みエラー:', error);
        return [];
    }
}

// 会話リストを読み込み（Firestoreとサンプルデータの統合版）
async function loadConversations() {
    if (!currentUser) return;
    
    const conversationsContainer = document.getElementById('conversations-list');
    conversationsContainer.innerHTML = '<div class="loading-message">会話を読み込み中...</div>';
    
    try {
        // まずFirestoreから読み込みを試行
        let conversations = await loadConversationsFromFirestore();
        
        // Firestoreにデータがない場合はサンプルデータを表示
        if (conversations.length === 0) {
            conversations = [
                {
                    id: 'user1',
                    name: '田中さん & ポチ',
                    avatar: '🐕',
                    lastMessage: 'また今度一緒に散歩しましょう！',
                    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
                    unread: true
                },
                {
                    id: 'user2', 
                    name: '佐藤さん & モコ',
                    avatar: '🐩',
                    lastMessage: 'ありがとうございました',
                    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    unread: false
                }
            ];
        }
        
        if (conversations.length === 0) {
            conversationsContainer.innerHTML = `
                <div class="no-conversations">
                    <h4>まだメッセージがありません</h4>
                    <p>友達リストから新しい会話を始めましょう！</p>
                </div>
            `;
            return;
        }
        
        conversationsContainer.innerHTML = '';
        conversations.forEach(conversation => {
            const conversationElement = createConversationElement(conversation);
            conversationsContainer.appendChild(conversationElement);
        });
        
    } catch (error) {
        console.error('会話リスト読み込みエラー:', error);
        conversationsContainer.innerHTML = '<div class="no-conversations"><h4>会話の読み込みに失敗しました</h4></div>';
    }
}

// メッセージを読み込み（Firestoreとサンプルデータの統合版）
async function loadMessages(conversationId) {
    if (!currentUser) return;
    
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '<div class="loading-message">メッセージを読み込み中...</div>';
    
    try {
        // Firestoreからリアルタイム読み込みを試行
        await loadMessagesFromFirestore(conversationId);
        
    } catch (error) {
        console.error('メッセージ読み込みエラー:', error);
        
        // エラーの場合はサンプルデータを表示
        const sampleMessages = [
            {
                id: '1',
                text: 'こんにちは！今日は散歩日和ですね',
                senderId: conversationId,
                timestamp: new Date(Date.now() - 1000 * 60 * 60),
                isOwn: false
            },
            {
                id: '2', 
                text: 'そうですね！近くの公園で一緒に散歩しませんか？',
                senderId: currentUser.uid,
                timestamp: new Date(Date.now() - 1000 * 60 * 50),
                isOwn: true
            }
        ];
        
        displayMessages(sampleMessages);
    }
}

// 友達グループ管理機能

// グループ管理モーダルを表示
function showGroupManagementModal() {
    document.getElementById('group-management-modal').classList.remove('hidden');
    loadExistingGroups();
}

// グループ管理モーダルを非表示
function hideGroupManagementModal() {
    document.getElementById('group-management-modal').classList.add('hidden');
}

// 既存のグループを読み込み
function loadExistingGroups() {
    const existingGroupsContainer = document.getElementById('existing-groups');
    existingGroupsContainer.innerHTML = '';
    
    const groupNames = {
        'close-friends': '親しい友達',
        'walking-buddies': '散歩仲間',
        'park-friends': '公園友達'
    };
    
    currentGroups.forEach(groupKey => {
        const groupItem = document.createElement('div');
        groupItem.className = 'group-item';
        groupItem.innerHTML = `
            <div class="existing-group-item">
                <span class="existing-group-name">${groupNames[groupKey] || groupKey}</span>
                <button class="delete-group-btn" onclick="deleteGroup('${groupKey}')">削除</button>
            </div>
        `;
        existingGroupsContainer.appendChild(groupItem);
    });
}

// 新しいグループを追加
function addNewGroup() {
    const input = document.querySelector('.group-name-input');
    const groupName = input.value.trim();
    
    if (!groupName) {
        alert('グループ名を入力してください');
        return;
    }
    
    // グループIDを生成（日本語名から英語キーを作成）
    const groupKey = 'custom-' + Date.now();
    
    // グループを追加
    currentGroups.push(groupKey);
    
    // フィルターボタンを追加
    addGroupFilterButton(groupKey, groupName);
    
    // 入力欄をクリア
    input.value = '';
    
    // 既存グループリストを更新
    loadExistingGroups();
    
    // Firestoreに保存（実装予定）
    console.log('新しいグループを追加:', groupName, groupKey);
}

// グループを削除
function deleteGroup(groupKey) {
    if (confirm('このグループを削除しますか？\n（友達の関連付けも解除されます）')) {
        // グループを削除
        currentGroups = currentGroups.filter(g => g !== groupKey);
        
        // フィルターボタンを削除
        const filterBtn = document.querySelector(`[data-group="${groupKey}"]`);
        if (filterBtn) {
            filterBtn.remove();
        }
        
        // 現在のフィルターが削除されたグループの場合、「すべて」に戻す
        if (currentFilter === groupKey) {
            filterFriendsByGroup('all');
        }
        
        // 既存グループリストを更新
        loadExistingGroups();
        
        // 友達リストを再読み込み
        loadFriends();
        
        console.log('グループを削除:', groupKey);
    }
}

// グループフィルターボタンを追加
function addGroupFilterButton(groupKey, groupName) {
    const filtersContainer = document.querySelector('.group-filters');
    const button = document.createElement('button');
    button.className = 'group-filter-btn';
    button.dataset.group = groupKey;
    button.textContent = groupName;
    
    button.addEventListener('click', (e) => {
        const group = e.target.dataset.group;
        filterFriendsByGroup(group);
    });
    
    filtersContainer.appendChild(button);
}

// 友達のグループ変更モーダルを表示
function showFriendGroupModal(friendId) {
    // 友達データを取得（サンプルデータから）
    const sampleFriends = [
        { id: 1, ownerName: '田中さん', dogName: 'ポチ', avatar: '🐕', groups: ['close-friends', 'walking-buddies'] },
        { id: 2, ownerName: '佐藤さん', dogName: 'モコ', avatar: '🐩', groups: ['walking-buddies'] },
        { id: 3, ownerName: '鈴木さん', dogName: 'ラブ', avatar: '🦮', groups: ['park-friends'] },
        { id: 4, ownerName: '山田さん', dogName: 'チョコ', avatar: '🐕‍🦺', groups: ['close-friends', 'park-friends'] }
    ];
    
    selectedFriend = sampleFriends.find(f => f.id === friendId);
    if (!selectedFriend) return;
    
    // モーダル情報を設定
    document.getElementById('selected-friend-avatar').textContent = selectedFriend.avatar;
    document.getElementById('selected-friend-name').textContent = `${selectedFriend.ownerName} & ${selectedFriend.dogName}`;
    
    // グループチェックボックスを生成
    const checkboxContainer = document.getElementById('group-checkboxes');
    checkboxContainer.innerHTML = '';
    
    const groupNames = {
        'close-friends': '親しい友達',
        'walking-buddies': '散歩仲間',
        'park-friends': '公園友達'
    };
    
    currentGroups.forEach(groupKey => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'group-checkbox-item';
        
        const isChecked = selectedFriend.groups && selectedFriend.groups.includes(groupKey);
        
        checkboxItem.innerHTML = `
            <input type="checkbox" id="group-${groupKey}" ${isChecked ? 'checked' : ''}>
            <label for="group-${groupKey}" class="group-checkbox-label">${groupNames[groupKey] || groupKey}</label>
        `;
        
        checkboxContainer.appendChild(checkboxItem);
    });
    
    // モーダルを表示
    document.getElementById('friend-group-modal').classList.remove('hidden');
}

// 友達のグループ変更モーダルを非表示
function hideFriendGroupModal() {
    document.getElementById('friend-group-modal').classList.add('hidden');
    selectedFriend = null;
}

// 友達のグループ設定を保存
function saveFriendGroups() {
    if (!selectedFriend) return;
    
    // チェックされたグループを取得
    const checkedGroups = [];
    currentGroups.forEach(groupKey => {
        const checkbox = document.getElementById(`group-${groupKey}`);
        if (checkbox && checkbox.checked) {
            checkedGroups.push(groupKey);
        }
    });
    
    // 友達のグループを更新（実際はFirestoreに保存）
    selectedFriend.groups = checkedGroups;
    
    console.log('友達のグループを更新:', selectedFriend.ownerName, checkedGroups);
    
    // モーダルを閉じる
    hideFriendGroupModal();
    
    // 友達リストを再読み込み
    loadFriends();
    
    alert('グループ設定を保存しました！');
}

// Firestoreでグループデータ構造を実装（実装予定）
async function saveGroupsToFirestore() {
    // TODO: Firestoreにグループ設定を保存
}

async function loadGroupsFromFirestore() {
    // TODO: Firestoreからグループ設定を読み込み
}

async function saveFriendGroupsToFirestore(friendId, groups) {
    // TODO: Firestoreに友達のグループ設定を保存
}

// グローバル関数として定義（onclick属性から呼び出し可能にする）
window.showFriendGroupModal = showFriendGroupModal;
window.deleteGroup = deleteGroup;

// アプリ初期化を実行（DOMContentLoadedで既に実行されるため削除）
// initializeAppAuth(); // 重複削除
// initializeAvatar(); // 重複削除