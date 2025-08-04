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
let app, auth, db, analytics;

try {
    console.log('Firebase初期化を開始...');
    console.log('Firebase設定:', firebaseConfig);
    
    app = initializeApp(firebaseConfig);
    console.log('Firebase App初期化完了');
    
    auth = getAuth(app);
    console.log('Firebase Auth初期化完了');
    
    db = getFirestore(app);
    console.log('Firestore初期化完了');
    
    try {
        analytics = getAnalytics(app);
        console.log('Analytics初期化完了');
    } catch (analyticsError) {
        console.warn('Analytics初期化スキップ:', analyticsError.message);
    }
    
    console.log('Firebase初期化完了');
} catch (error) {
    console.error('Firebase初期化エラー:', error);
    console.error('エラー詳細:', error.message);
    alert('Firebase初期化に失敗しました: ' + error.message);
}

// グローバル変数
let currentUser = null;
let map = null; // Google Maps（無効）
let leafletMap = null; // Leaflet Map（OpenStreetMap）
let userLocation = null;
let walkData = null; // 散歩中のデータ
let currentChatUser = null; // 現在チャット中のユーザー
let messagesListener = null; // メッセージリアルタイム監視
let currentGroups = ['close-friends', 'walking-buddies', 'park-friends']; // デフォルトグループ
let selectedFriend = null; // 選択された友達（グループ変更用）
let currentFilter = 'all'; // 現在のフィルター
let mapToggled = false; // マップ表示切替状態
let walkPathLayer = null; // 散歩ルート表示用レイヤー
let currentWalkPolyline = null; // 現在の散歩ルート
let lastLoadedWalks = []; // 最後に読み込んだ散歩履歴（ルート表示用）

// DOM要素
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const logoutBtn = document.getElementById('logout-btn');

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded発火');
    
    // DOM要素の存在確認
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    const googleLoginBtn = document.getElementById('google-login-btn');
    
    console.log('DOM要素チェック:');
    console.log('- login-screen:', loginScreen ? '見つかりました' : '見つかりません');
    console.log('- main-app:', mainApp ? '見つかりました' : '見つかりません');
    console.log('- google-login-btn:', googleLoginBtn ? '見つかりました' : '見つかりません');
    
    if (!loginScreen || !mainApp) {
        console.error('必要なDOM要素が見つかりません');
        alert('アプリの初期化に失敗しました。ページを再読み込みしてください。');
        return;
    }
    
    try {
        initializeAppAuth();
        setupEventListeners();
        initializeAvatar();
    } catch (error) {
        console.error('初期化エラー:', error);
        alert('アプリの初期化中にエラーが発生しました: ' + error.message);
    }
});

// アプリ初期化
function initializeAppAuth() {
    console.log('アプリ初期化開始');
    console.log('Firebase Auth:', auth ? 'OK' : 'エラー');
    console.log('Firebase DB:', db ? 'OK' : 'エラー');
    
    if (!auth) {
        console.error('Firebase Authが初期化されていません');
        alert('Firebase認証の初期化に失敗しました。ページを再読み込みしてください。');
        showLoginScreen();
        return;
    }
    
    console.log('認証状態監視を開始します');
    console.log('Firebase設定 - AuthDomain:', auth.config?.authDomain);
    
    try {
        // 認証状態の監視
        onAuthStateChanged(auth, (user) => {
            console.log('認証状態変更:', user ? 'ログイン中' : 'ログアウト中');
            if (user) {
                console.log('ユーザー情報:', user.displayName, user.email);
                console.log('ユーザーUID:', user.uid);
                currentUser = user;
                showMainApp();
                loadUserProfile();
                loadFriends();
            } else {
                console.log('ログアウト状態のため、ログイン画面を表示');
                currentUser = null;
                showLoginScreen();
            }
        });
    } catch (error) {
        console.error('認証状態監視エラー:', error);
        alert('認証状態の監視でエラーが発生しました: ' + error.message);
        showLoginScreen();
    }
}

// イベントリスナー設定
function setupEventListeners() {
    // Googleログインボタン
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        console.log('Googleログインボタン見つかりました');
        googleLoginBtn.addEventListener('click', (e) => {
            console.log('ログインボタンがクリックされました');
            e.preventDefault();
            signInWithGoogle();
        });
    } else {
        console.error('Googleログインボタンが見つかりません');
    }

    // タブ切り替え
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // ログアウト
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // プロフィール保存
    const saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
    }
    
    // 誕生日変更時の年齢自動計算
    const dogBirthdayInput = document.getElementById('dog-birthday-input');
    if (dogBirthdayInput) {
        dogBirthdayInput.addEventListener('change', calculateAge);
    }

    // 散歩開始
    const startWalkBtn = document.getElementById('start-walk-btn');
    if (startWalkBtn) {
        startWalkBtn.addEventListener('click', startWalk);
    }
    
    // 散歩一時停止
    const pauseWalkBtn = document.getElementById('pause-walk-btn');
    if (pauseWalkBtn) {
        pauseWalkBtn.addEventListener('click', pauseWalk);
    }
    
    // 散歩終了
    const stopWalkBtn = document.getElementById('stop-walk-btn');
    if (stopWalkBtn) {
        stopWalkBtn.addEventListener('click', stopWalk);
    }
    
    // 履歴フィルター
    const filterAllBtn = document.getElementById('filter-all');
    if (filterAllBtn) {
        filterAllBtn.addEventListener('click', () => loadWalkHistory('all'));
    }
    
    const filterWeekBtn = document.getElementById('filter-week');
    if (filterWeekBtn) {
        filterWeekBtn.addEventListener('click', () => loadWalkHistory('week'));
    }
    
    const filterMonthBtn = document.getElementById('filter-month');
    if (filterMonthBtn) {
        filterMonthBtn.addEventListener('click', () => loadWalkHistory('month'));
    }
    
    // メッセージ機能のイベントリスナー
    const backToMessagesBtn = document.getElementById('back-to-messages');
    if (backToMessagesBtn) {
        backToMessagesBtn.addEventListener('click', backToMessagesList);
    }
    
    const sendMessageBtn = document.getElementById('send-message');
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }
    
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // 友達グループ管理のイベントリスナー
    const addGroupBtn = document.getElementById('add-group-btn');
    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', showGroupManagementModal);
    }
    
    const manageGroupsBtn = document.getElementById('manage-groups-btn');
    if (manageGroupsBtn) {
        manageGroupsBtn.addEventListener('click', showGroupManagementModal);
    }
    
    const closeGroupModalBtn = document.getElementById('close-group-modal');
    if (closeGroupModalBtn) {
        closeGroupModalBtn.addEventListener('click', hideGroupManagementModal);
    }
    
    const closeFriendGroupModalBtn = document.getElementById('close-friend-group-modal');
    if (closeFriendGroupModalBtn) {
        closeFriendGroupModalBtn.addEventListener('click', hideFriendGroupModal);
    }
    
    const saveFriendGroupsBtn = document.getElementById('save-friend-groups');
    if (saveFriendGroupsBtn) {
        saveFriendGroupsBtn.addEventListener('click', saveFriendGroups);
    }
    
    const cancelFriendGroupsBtn = document.getElementById('cancel-friend-groups');
    if (cancelFriendGroupsBtn) {
        cancelFriendGroupsBtn.addEventListener('click', hideFriendGroupModal);
    }
    
    const addNewGroupBtn = document.querySelector('.add-new-group-btn');
    if (addNewGroupBtn) {
        addNewGroupBtn.addEventListener('click', addNewGroup);
    }
    
    // グループフィルターのイベントリスナー
    const groupFilterBtns = document.querySelectorAll('.group-filter-btn');
    groupFilterBtns.forEach(btn => {
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
    
    // QRコード友達追加機能のイベントリスナー
    const closeAddFriendModalBtn = document.getElementById('close-add-friend-modal');
    if (closeAddFriendModalBtn) {
        closeAddFriendModalBtn.addEventListener('click', closeAddFriendModal);
    }
    
    const showQRTab = document.getElementById('show-qr-tab');
    const scanQRTab = document.getElementById('scan-qr-tab');
    if (showQRTab && scanQRTab) {
        showQRTab.addEventListener('click', () => {
            showQRTab.classList.add('active');
            scanQRTab.classList.remove('active');
            document.getElementById('show-qr-section').classList.remove('hidden');
            document.getElementById('scan-qr-section').classList.add('hidden');
            stopCamera(); // カメラを停止
        });
        
        scanQRTab.addEventListener('click', () => {
            scanQRTab.classList.add('active');
            showQRTab.classList.remove('active');
            document.getElementById('scan-qr-section').classList.remove('hidden');
            document.getElementById('show-qr-section').classList.add('hidden');
        });
    }
    
    const startCameraBtn = document.getElementById('start-camera-btn');
    const stopCameraBtn = document.getElementById('stop-camera-btn');
    if (startCameraBtn) {
        startCameraBtn.addEventListener('click', startCamera);
    }
    if (stopCameraBtn) {
        stopCameraBtn.addEventListener('click', stopCamera);
    }
}

// Firebase Authを使ったGoogleログイン
async function signInWithGoogle() {
    if (!auth) {
        console.error('Firebase Authが初期化されていません');
        alert('認証システムの初期化に失敗しました。ページを再読み込みしてください。');
        return;
    }

    const provider = new GoogleAuthProvider();
    // カスタムパラメータを追加してより確実な認証を試行
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
        console.log('Googleログイン開始');
        console.log('現在のURL:', window.location.href);
        console.log('Auth domain:', auth.config.authDomain);
        
        const result = await signInWithPopup(auth, provider);
        console.log('ログイン成功:', result.user);
        console.log('ユーザー情報:', result.user.displayName, result.user.email);
    } catch (error) {
        console.error('ログインエラー詳細:', error);
        console.error('エラーコード:', error.code);
        console.error('エラーメッセージ:', error.message);
        
        // より詳細なエラーメッセージを表示
        let errorMessage = 'ログインに失敗しました。';
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'ログインがキャンセルされました。';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'ポップアップがブロックされました。ブラウザの設定を確認してください。';
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorMessage = 'ログイン処理がキャンセルされました。';
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMessage = 'このドメインは認証が許可されていません。Firebase Consoleで承認済みドメインに追加してください。';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = 'Googleログインが有効になっていません。Firebase Consoleで設定を確認してください。';
        } else if (error.code === 'auth/configuration-not-found') {
            errorMessage = 'Firebase設定が見つかりません。設定を確認してください。';
        } else {
            errorMessage = `ログインエラー: ${error.message}`;
        }
        
        alert(errorMessage + ' もう一度お試しください。');
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
    if (loginScreen && mainApp) {
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
        console.log('ログイン画面表示完了');
    } else {
        console.error('DOM要素が見つかりません - loginScreen:', !!loginScreen, 'mainApp:', !!mainApp);
    }
}

function showMainApp() {
    console.log('メインアプリ画面を表示');
    if (loginScreen && mainApp) {
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        console.log('メインアプリ表示完了');
    } else {
        console.error('DOM要素が見つかりません - loginScreen:', !!loginScreen, 'mainApp:', !!mainApp);
    }
    
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
    
    // ロケーションマッチング機能初期化
    initializeLocationMatching();
}

// タブ切り替え
function switchTab(tabName) {
    // すべてのタブとコンテンツを非アクティブに
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // 選択されたタブとコンテンツをアクティブに
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // マップタブの場合、Leafletマップサイズを再調整
    if (tabName === 'map' && leafletMap) {
        setTimeout(() => {
            leafletMap.invalidateSize();
            if (userLocation) {
                leafletMap.setView([userLocation.lat, userLocation.lng], 15);
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
    console.log('Getting current location...');
    
    // Google Maps APIが無効の場合はプレースホルダーを表示
    if (typeof google === 'undefined') {
        console.log('Google Maps API not loaded - showing placeholder');
        showMapPlaceholder();
        loadNearbyDogs();
        return;
    }
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log('Location obtained:', userLocation);
                
                // Google Maps APIが読み込まれているかチェック
                if (typeof google !== 'undefined' && google.maps) {
                    initializeMap();
                } else {
                    console.log('Google Maps API not available - showing placeholder');
                    showMapPlaceholder();
                }
                loadNearbyDogs();
            },
            (error) => {
                console.error('位置情報取得エラー:', error);
                // デフォルト位置（東京駅）
                userLocation = { lat: 35.6812, lng: 139.7671 };
                console.log('Using default location:', userLocation);
                
                // Google Maps APIが読み込まれているかチェック
                if (typeof google !== 'undefined' && google.maps) {
                    initializeMap();
                } else {
                    console.log('Google Maps API not available - showing placeholder');
                    showMapPlaceholder();
                }
                loadNearbyDogs();
            },
            {
                timeout: 10000, // 10秒でタイムアウト
                maximumAge: 300000, // 5分間はキャッシュを使用
                enableHighAccuracy: true
            }
        );
    } else {
        console.error('位置情報がサポートされていません');
        userLocation = { lat: 35.6812, lng: 139.7671 };
        
        if (typeof google !== 'undefined' && google.maps) {
            initializeMap();
        } else {
            console.log('Google Maps API not available - showing placeholder');
            showMapPlaceholder();
        }
        loadNearbyDogs();
    }
}

// マッププレースホルダーを表示
function showMapPlaceholder() {
    const placeholder = document.getElementById('map-placeholder');
    const loading = document.getElementById('map-loading');
    
    if (placeholder) {
        placeholder.style.display = 'flex';
    }
    if (loading) {
        loading.classList.add('hidden');
    }
}

// Googleマップ初期化
window.initMap = function() {
    console.log('initMap called by Google Maps API');
    
    if (!userLocation) {
        console.log('User location not available, using default location');
        userLocation = { lat: 35.6812, lng: 139.7671 }; // 東京駅
    }
    
    if (typeof google === 'undefined' || !google.maps) {
        console.error('Google Maps API not loaded');
        return;
    }
    
    initializeMap();
};

// マップを実際に初期化する関数
function initializeMap() {
    console.log('Initializing map with location:', userLocation);
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found');
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
    
    try {
        map = new google.maps.Map(mapContainer, mapOptions);
        console.log('Map created successfully');
        
        // ローディング表示を隠す
        const loadingElement = document.getElementById('map-loading');
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error creating map:', error);
        
        // エラー表示
        const loadingElement = document.getElementById('map-loading');
        if (loadingElement) {
            loadingElement.innerHTML = '<p style="color: #dc3545;">マップの読み込みに失敗しました</p>';
        }
        return;
    }
    
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
};



// 近くの犬データ読み込み（実際の友達のみ表示）
async function loadNearbyDogs() {
    if (!currentUser) return;
    
    const nearbyDogsContainer = document.getElementById('nearby-dogs');
    nearbyDogsContainer.innerHTML = '<div class="loading-message">近くの友達を読み込み中...</div>';
    
    try {
        // Firestoreから実際の友達データを取得
        const friends = await loadFriendsFromFirestore();
        
        if (friends.length === 0) {
            nearbyDogsContainer.innerHTML = `
                <div class="no-nearby-dogs">
                    <h4>まだ友達がいません</h4>
                    <p>QRコードで友達を追加しましょう！</p>
                    <button onclick="showAddFriendModal()" class="add-friend-btn">友達を追加 👥</button>
                </div>
            `;
            return;
        }
        
        nearbyDogsContainer.innerHTML = '';
        friends.forEach(friend => {
            const dogElement = createDogElement({
                id: friend.id,
                ownerName: friend.ownerName,
                dogName: friend.dogName,
                breed: friend.breed || '犬種不明',
                age: friend.age || 0,
                distance: '位置情報なし',
                avatar: friend.avatar || '🐕',
                personality: friend.personality || '詳細不明'
            });
            nearbyDogsContainer.appendChild(dogElement);
        });
        
    } catch (error) {
        console.error('近くの犬データ読み込みエラー:', error);
        nearbyDogsContainer.innerHTML = `
            <div class="no-nearby-dogs">
                <h4>友達を読み込めませんでした</h4>
                <p>もう一度お試しください</p>
                <button onclick="loadNearbyDogs()" class="retry-btn">再試行</button>
            </div>
        `;
    }
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
            
            // currentUserオブジェクトにFirestoreデータをマージ
            currentUser.userName = data.userName || '';
            currentUser.dogName = data.dogName || '';
            currentUser.dogBreed = data.dogBreed || '';
            currentUser.dogBirthday = data.dogBirthday || '';
            currentUser.dogGender = data.dogGender || '';
            currentUser.dogPersonality = data.dogPersonality || '';
            currentUser.avatarBase64 = data.avatarBase64 || '';
            currentUser.avatarURL = data.avatarURL || '';
            currentUser.totalWalks = data.totalWalks || 0;
            currentUser.friendsCount = data.friendsCount || 0;
            
            console.log('currentUserにプロフィールデータをマージ:', currentUser);
            
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
        
        // 散歩ルート表示をクリア
        clearWalkPathFromMap();
        
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
                
                // マップに散歩ルートを表示
                updateWalkPathOnMap();
                
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

// 散歩ルートをマップに表示
function updateWalkPathOnMap() {
    if (!leafletMap || !walkData || !walkData.path || walkData.path.length < 2) return;
    
    // 既存のルートがあれば削除
    if (currentWalkPolyline) {
        leafletMap.removeLayer(currentWalkPolyline);
    }
    
    // 新しいルートを描画
    const latLngs = walkData.path.map(point => [point.lat, point.lng]);
    currentWalkPolyline = L.polyline(latLngs, {
        color: '#ff6b6b',
        weight: 4,
        opacity: 0.8,
        dashArray: '5, 10'
    }).addTo(leafletMap);
    
    console.log('散歩ルート更新:', walkData.path.length, 'ポイント');
}

// 散歩ルートをマップからクリア
function clearWalkPathFromMap() {
    if (currentWalkPolyline && leafletMap) {
        leafletMap.removeLayer(currentWalkPolyline);
        currentWalkPolyline = null;
        console.log('散歩ルートをクリア');
    }
}

// 履歴の散歩ルートを表示
function showHistoryWalkPath(walkPath) {
    if (!leafletMap || !walkPath || walkPath.length < 2) return;
    
    // 既存のルートをクリア
    clearWalkPathFromMap();
    
    // 履歴ルートを表示
    const latLngs = walkPath.map(point => [point.lat, point.lng]);
    currentWalkPolyline = L.polyline(latLngs, {
        color: '#28a745',
        weight: 3,
        opacity: 0.7
    }).addTo(leafletMap);
    
    // ルート全体が見えるようにマップを調整
    const bounds = L.latLngBounds(latLngs);
    leafletMap.fitBounds(bounds, { padding: [20, 20] });
}

// 散歩統計のリアルタイム表示
let walkStatsInterval = null;

function startWalkStatsDisplay() {
    // 散歩統計エリアを表示
    document.getElementById('walk-stats').classList.remove('hidden');
    
    // 1秒ごとに統計を更新
    walkStatsInterval = setInterval(() => {
        if (walkData && (walkData.status === 'active' || walkData.status === 'paused')) {
            // 経過時間を計算（分）
            const currentTime = new Date();
            let totalDuration = walkData.duration || 0; // 累積時間（分）
            
            if (walkData.status === 'active' && walkData.resumeTime) {
                // アクティブ時の追加時間
                totalDuration += Math.round((currentTime - walkData.resumeTime) / 1000 / 60);
            } else if (walkData.status === 'active') {
                // 開始からの経過時間
                totalDuration = Math.round((currentTime - walkData.startTime) / 1000 / 60);
            }
            
            // 画面に表示
            document.getElementById('current-distance').textContent = walkData.distance.toFixed(2);
            document.getElementById('current-duration').textContent = totalDuration;
            
            // 状況に応じてボタン表示を切り替え
            updateWalkControls(walkData.status);
        }
    }, 1000);
}

function updateWalkControls(status) {
    const pauseBtn = document.getElementById('pause-walk-btn');
    const stopBtn = document.getElementById('stop-walk-btn');
    const startBtn = document.getElementById('start-walk-btn');
    
    if (status === 'active') {
        pauseBtn.textContent = '⏸️ 一時停止';
        pauseBtn.classList.remove('resume-btn');
        pauseBtn.classList.add('pause-btn');
    } else if (status === 'paused') {
        pauseBtn.textContent = '▶️ 再開';
        pauseBtn.classList.remove('pause-btn');
        pauseBtn.classList.add('resume-btn');
    }
}

// 散歩一時停止
function pauseWalk() {
    if (!walkData) return;
    
    if (walkData.status === 'active') {
        // 一時停止
        const currentTime = new Date();
        walkData.status = 'paused';
        walkData.duration = Math.round((currentTime - (walkData.resumeTime || walkData.startTime)) / 1000 / 60);
        walkData.pauseTime = currentTime;
        
        console.log('散歩を一時停止しました');
        alert('散歩を一時停止しました');
        
    } else if (walkData.status === 'paused') {
        // 再開
        walkData.status = 'active';
        walkData.resumeTime = new Date();
        
        console.log('散歩を再開しました');
        alert('散歩を再開しました');
    }
    
    updateWalkControls(walkData.status);
}

// 散歩終了
async function stopWalk() {
    if (!walkData) return;
    
    if (confirm('散歩を終了しますか？')) {
        try {
            // 最終統計を計算
            const endTime = new Date();
            let totalDuration = walkData.duration || 0;
            
            if (walkData.status === 'active' && walkData.resumeTime) {
                totalDuration += Math.round((endTime - walkData.resumeTime) / 1000 / 60);
            } else if (walkData.status === 'active') {
                totalDuration = Math.round((endTime - walkData.startTime) / 1000 / 60);
            }
            
            // Firestoreに散歩記録を保存
            const walkRecord = {
                userId: currentUser.uid,
                startTime: walkData.startTime,
                endTime: endTime,
                distance: walkData.distance,
                duration: totalDuration,
                status: 'completed'
            };
            
            await addDoc(collection(db, 'walk_records'), walkRecord);
            
            // 散歩データをリセット
            walkData = null;
            
            // UI更新
            stopWalkStatsDisplay();
            document.getElementById('start-walk-btn').textContent = '🚶‍♂️ 散歩開始';
            
            console.log('散歩を終了し、記録を保存しました');
            alert(`散歩お疲れさまでした！\n距離: ${walkRecord.distance.toFixed(2)}km\n時間: ${totalDuration}分`);
            
        } catch (error) {
            console.error('散歩記録の保存エラー:', error);
            alert('記録の保存に失敗しました');
        }
    }
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

// 友達リスト読み込み（実際の友達のみ表示）
async function loadFriends() {
    if (!currentUser) return;
    
    const friendsContainer = document.getElementById('friends-list');
    if (friendsContainer) {
        friendsContainer.innerHTML = '<div class="loading-message">友達リストを読み込み中...</div>';
    }
    
    try {
        // Firestoreから実際の友達データを取得
        const friends = await loadFriendsFromFirestore();
        
        if (friends.length === 0) {
            if (friendsContainer) {
                friendsContainer.innerHTML = `
                    <div class="no-friends">
                        <h4>まだ友達がいません</h4>
                        <p>QRコードで友達を追加してみましょう！</p>
                        <button onclick="showAddFriendModal()" class="add-friend-btn">友達を追加 👥</button>
                    </div>
                `;
            }
            return;
        }
        
        displayFriendsGrouped(friends);
        
    } catch (error) {
        console.error('友達リスト読み込みエラー:', error);
        if (friendsContainer) {
            friendsContainer.innerHTML = `
                <div class="no-friends">
                    <h4>友達リストの読み込みに失敗しました</h4>
                    <p>もう一度お試しください</p>
                    <button onclick="loadFriends()" class="retry-btn">再試行</button>
                </div>
            `;
        }
    }
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
        console.log(`散歩履歴取得: ${querySnapshot.size}件`);
        
        if (querySnapshot.size === 0) {
            console.log('散歩履歴がありません。Firestoreに散歩データが保存されているか確認してください。');
        }
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('散歩データ:', data);
            
            if (data.startTime && data.endTime) {
                walks.push({
                    id: doc.id,
                    ...data,
                    startTime: data.startTime.toDate(),
                    endTime: data.endTime.toDate()
                });
            } else if (data.startTime) {
                // 終了時間がない場合（未完了の散歩）もログ出力
                console.warn('未完了の散歩データ:', data);
            }
        });
        
        // フィルター適用
        const filteredWalks = filterWalks(walks, filter);
        
        // 散歩履歴を保存（ルート表示用）
        lastLoadedWalks = filteredWalks;
        
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
    
    const historyHTML = walks.map((walk, index) => {
        const date = formatDate(walk.startTime);
        const time = formatTime(walk.startTime);
        const distance = walk.distance ? walk.distance.toFixed(2) : '0.00';
        const duration = walk.duration || 0;
        const hasPath = walk.path && walk.path.length > 1;
        
        return `
            <div class="history-item">
                <div class="history-header">
                    <div>
                        <div class="history-date">${date}</div>
                        <div class="history-time">${time}</div>
                    </div>
                    ${hasPath ? `<button class="show-route-btn" onclick="showWalkRoute(${index})" title="散歩ルートを表示">🗺️</button>` : ''}
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

// 散歩ルートを表示（履歴から）
function showWalkRoute(walkIndex) {
    const walk = lastLoadedWalks[walkIndex];
    if (!walk || !walk.path || walk.path.length < 2) {
        alert('この散歩のルート情報がありません');
        return;
    }
    
    // マップタブに切り替え
    showTab('map');
    
    // ルートを表示
    showHistoryWalkPath(walk.path);
    
    // アラートで情報表示
    const date = formatDate(walk.startTime);
    const distance = walk.distance ? walk.distance.toFixed(2) : '0.00';
    const duration = walk.duration || 0;
    
    setTimeout(() => {
        alert(`📍 ${date}の散歩ルート\n📏 距離: ${distance}km\n⏰ 時間: ${duration}分\n\nマップに緑色の線で表示されています`);
    }, 500);
    
    console.log('散歩ルート表示:', walk);
}

// グローバルスコープに関数を追加
window.showWalkRoute = showWalkRoute;

// 現在地近くの公園でドロップダウンを更新
function updateLocationDropdown() {
    const locationSelect = document.getElementById('location-select');
    if (!locationSelect) return;
    
    // 公園データを取得（addParkMarkersと同じデータを使用）
    const allParks = [
        { name: '渋谷公園', lat: 35.6586, lng: 139.7016, value: 'shibuya-park' },
        { name: '代々木公園', lat: 35.6732, lng: 139.6940, value: 'yoyogi-park' },
        { name: '上野公園', lat: 35.7148, lng: 139.7734, value: 'ueno-park' },
        { name: '井の頭公園', lat: 35.7004, lng: 139.5802, value: 'inokashira-park' },
        { name: '駒沢オリンピック公園', lat: 35.6298, lng: 139.6566, value: 'komazawa-park' },
        { name: '新宿中央公園', lat: 35.6899, lng: 139.6935, value: 'shinjuku-central-park' },
        { name: '砧公園', lat: 35.6389, lng: 139.6289, value: 'kinuta-park' },
        { name: '林試の森公園', lat: 35.6241, lng: 139.7030, value: 'rinshi-park' },
        { name: '飛鳥山公園', lat: 35.7520, lng: 139.7385, value: 'asukayama-park' },
        { name: '舎人公園', lat: 35.7892, lng: 139.7920, value: 'toneri-park' },
        { name: '石神井公園', lat: 35.7356, lng: 139.5944, value: 'shakujii-park' },
        { name: '善福寺公園', lat: 35.7144, lng: 139.5889, value: 'zenpukuji-park' },
        { name: '水元公園', lat: 35.7744, lng: 139.8531, value: 'mizumoto-park' },
        { name: '葛西臨海公園', lat: 35.6455, lng: 139.8597, value: 'kasai-park' },
        { name: '夢の島公園', lat: 35.6553, lng: 139.8267, value: 'yumenoshima-park' },
        { name: 'お台場海浜公園', lat: 35.6281, lng: 139.7714, value: 'odaiba-park' }
    ];
    
    // 現在地から近い公園を取得
    const nearbyParks = userLocation ? 
        allParks.filter(park => {
            const distance = calculateDistance(userLocation, { lat: park.lat, lng: park.lng });
            return distance <= 10; // 10km以内に拡大
        }).sort((a, b) => {
            const distanceA = calculateDistance(userLocation, { lat: a.lat, lng: a.lng });
            const distanceB = calculateDistance(userLocation, { lat: b.lat, lng: b.lng });
            return distanceA - distanceB;
        }).slice(0, 10) : allParks.slice(0, 10);
    
    // ドロップダウンをクリアして更新
    locationSelect.innerHTML = '';
    
    nearbyParks.forEach((park, index) => {
        const option = document.createElement('option');
        option.value = park.value;
        option.textContent = userLocation ? 
            `${park.name} (${calculateDistance(userLocation, { lat: park.lat, lng: park.lng }).toFixed(1)}km)` : 
            park.name;
        locationSelect.appendChild(option);
        
        // 最初の公園を選択
        if (index === 0) {
            option.selected = true;
        }
    });
    
    console.log(`近くの公園 ${nearbyParks.length}箇所をドロップダウンに追加しました`);
}

// QRコード友達追加機能
let currentStream = null; // カメラストリーム
let qrScanner = null; // QRスキャナー

// 友達追加モーダルを表示
function showAddFriendModal() {
    const modal = document.getElementById('add-friend-modal');
    if (modal) {
        modal.classList.remove('hidden');
        // ユーザー情報を表示
        updateQRUserInfo();
        // QRコードを生成
        generateUserQRCode();
    }
}

// QRコードにユーザー情報を表示
function updateQRUserInfo() {
    if (!currentUser) return;
    
    const avatarElement = document.getElementById('qr-user-avatar');
    const nameElement = document.getElementById('qr-user-name');
    
    if (avatarElement && nameElement) {
        avatarElement.textContent = currentUser.avatarBase64 || '🐕';
        nameElement.textContent = `${currentUser.userName || 'ユーザー'} & ${currentUser.dogName || '愛犬'}`;
    }
}

// QRCodeライブラリの読み込み待機
function waitForQRCode() {
    return new Promise((resolve) => {
        if (typeof QRCode !== 'undefined') {
            resolve();
        } else {
            console.log('QRCodeライブラリの読み込み待機中...');
            const checkInterval = setInterval(() => {
                if (typeof QRCode !== 'undefined') {
                    clearInterval(checkInterval);
                    console.log('QRCodeライブラリ読み込み完了');
                    resolve();
                }
            }, 100);
            
            // 10秒でタイムアウト
            setTimeout(() => {
                clearInterval(checkInterval);
                console.error('QRCodeライブラリの読み込みタイムアウト');
                resolve();
            }, 10000);
        }
    });
}

// ユーザーのQRコードを生成
async function generateUserQRCode() {
    console.log('QRコード生成開始');
    
    if (!currentUser) {
        console.error('currentUserが存在しません');
        return;
    }
    
    const qrContainer = document.getElementById('qr-code-container');
    if (!qrContainer) {
        console.error('qr-code-containerが見つかりません');
        return;
    }
    
    // QRコードライブラリの読み込み待機
    qrContainer.innerHTML = '<p>QRコードライブラリを読み込み中...</p>';
    await waitForQRCode();
    
    // QRコードライブラリの存在確認
    if (typeof QRCode === 'undefined') {
        console.error('QRCodeライブラリが読み込まれていません');
        qrContainer.innerHTML = '<p style="color: red;">QRコードライブラリの読み込みに失敗しました</p>';
        return;
    }
    
    // QRコードのデータ（ユーザーID）
    const qrData = JSON.stringify({
        type: 'wansmart_friend',
        userId: currentUser.uid,
        userName: currentUser.userName || 'ユーザー',
        dogName: currentUser.dogName || '愛犬',
        avatar: currentUser.avatarBase64 || '🐕'
    });
    
    console.log('QRコードデータ:', qrData);
    
    // QRコードをクリア
    qrContainer.innerHTML = '<p>QRコードを生成中...</p>';
    
    // QRコードを生成
    try {
        QRCode.toCanvas(qrData, {
            width: 200,
            height: 200,
            colorDark: '#333333',
            colorLight: '#ffffff',
            margin: 2
        }, (error, canvas) => {
            if (error) {
                console.error('QRコード生成エラー:', error);
                qrContainer.innerHTML = '<p style="color: red;">QRコードの生成に失敗しました</p>';
            } else {
                console.log('QRコード生成成功');
                qrContainer.innerHTML = '';
                qrContainer.appendChild(canvas);
            }
        });
    } catch (error) {
        console.error('QRコード生成例外エラー:', error);
        qrContainer.innerHTML = '<p style="color: red;">QRコード生成中にエラーが発生しました</p>';
    }
}

// カメラを開始
async function startCamera() {
    try {
        const video = document.getElementById('camera-video');
        const startBtn = document.getElementById('start-camera-btn');
        const stopBtn = document.getElementById('stop-camera-btn');
        
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment', // 背面カメラを優先
                width: { ideal: 300 },
                height: { ideal: 300 }
            },
            audio: false
        });
        
        video.srcObject = currentStream;
        video.play();
        
        // ボタンの表示切り替え
        if (startBtn) startBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'inline-block';
        
        // QRスキャンを開始
        startQRScanning();
        
    } catch (error) {
        console.error('カメラアクセスエラー:', error);
        alert('カメラにアクセスできませんでした。ブラウザの設定を確認してください。');
    }
}

// カメラを停止
function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    const video = document.getElementById('camera-video');
    const startBtn = document.getElementById('start-camera-btn');
    const stopBtn = document.getElementById('stop-camera-btn');
    
    if (video) video.srcObject = null;
    if (startBtn) startBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'none';
    
    // QRスキャンを停止
    if (qrScanner) {
        clearInterval(qrScanner);
        qrScanner = null;
    }
}

// QRスキャンを開始
function startQRScanning() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const context = canvas.getContext('2d');
    
    qrScanner = setInterval(() => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                handleQRCodeDetected(code.data);
            }
        }
    }, 100);
}

// QRコードが検出された時の処理
async function handleQRCodeDetected(qrData) {
    console.log('QRコード検出:', qrData);
    
    try {
        const friendData = JSON.parse(qrData);
        
        if (friendData.type !== 'wansmart_friend') {
            alert('わんスマート用のQRコードではありません');
            return;
        }
        
        if (friendData.userId === currentUser.uid) {
            alert('自分のQRコードは追加できません');
            return;
        }
        
        // QRスキャンを停止
        stopCamera();
        
        // 友達追加処理
        await addFriendFromQR(friendData);
        
    } catch (error) {
        console.error('QRコード解析エラー:', error);
        alert('無効なQRコードです');
    }
}

// QRコードから友達を追加
async function addFriendFromQR(friendData) {
    try {
        // Firestoreに友達関係を保存
        await saveFriendToFirestore(friendData);
        
        // 成功メッセージ
        const scanResult = document.getElementById('scan-result');
        if (scanResult) {
            scanResult.innerHTML = `
                <div style="color: #28a745; text-align: center;">
                    <h4>✅ 友達追加完了！</h4>
                    <p>${friendData.userName} & ${friendData.dogName}さんを友達に追加しました</p>
                </div>
            `;
        }
        
        // 友達リストを更新
        setTimeout(() => {
            loadFriends();
            loadNearbyDogs();
        }, 1000);
        
        // 2秒後にモーダルを閉じる
        setTimeout(() => {
            closeAddFriendModal();
        }, 2000);
        
    } catch (error) {
        console.error('友達追加エラー:', error);
        alert('友達の追加に失敗しました');
    }
}

// 友達追加モーダルを閉じる
function closeAddFriendModal() {
    const modal = document.getElementById('add-friend-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // カメラを停止
    stopCamera();
}

// 友達をFirestoreに保存
async function saveFriendToFirestore(friendData) {
    if (!currentUser) throw new Error('ユーザーがログインしていません');
    
    try {
        // 自分の友達リストに追加
        const myFriendsRef = collection(db, 'users', currentUser.uid, 'friends');
        await addDoc(myFriendsRef, {
            userId: friendData.userId,
            ownerName: friendData.userName,
            dogName: friendData.dogName,
            avatar: friendData.avatar,
            addedAt: serverTimestamp(),
            groups: ['walking-buddies'] // デフォルトグループ
        });
        
        // 相手の友達リストにも追加
        const theirFriendsRef = collection(db, 'users', friendData.userId, 'friends');
        await addDoc(theirFriendsRef, {
            userId: currentUser.uid,
            ownerName: currentUser.userName || 'ユーザー',
            dogName: currentUser.dogName || '愛犬',
            avatar: currentUser.avatarBase64 || '🐕',
            addedAt: serverTimestamp(),
            groups: ['walking-buddies']
        });
        
        console.log('友達追加完了:', friendData.userName);
        
    } catch (error) {
        console.error('友達保存エラー:', error);
        throw error;
    }
}

// Firestoreから友達データを読み込み
async function loadFriendsFromFirestore() {
    if (!currentUser) return [];
    
    try {
        const friendsRef = collection(db, 'users', currentUser.uid, 'friends');
        const q = query(friendsRef, orderBy('addedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const friends = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            friends.push({
                id: doc.id,
                userId: data.userId,
                ownerName: data.ownerName,
                dogName: data.dogName,
                avatar: data.avatar,
                groups: data.groups || ['walking-buddies'],
                addedAt: data.addedAt?.toDate(),
                lastMet: '友達になりました'
            });
        });
        
        console.log(`友達データ読み込み完了: ${friends.length}人`);
        return friends;
        
    } catch (error) {
        console.error('友達データ読み込みエラー:', error);
        return [];
    }
}

// グローバルスコープに関数を追加
window.showAddFriendModal = showAddFriendModal;

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

// ロケーションマッチング機能初期化
function initializeLocationMatching() {
    console.log('Location matching system initialized');
    
    // Leafletマップ初期化
    initializeLeafletMap();
    
    // 現在地近くの公園でドロップダウンを更新
    updateLocationDropdown();
    
    // 位置選択のイベントリスナー
    const locationSelect = document.getElementById('location-select');
    if (locationSelect) {
        locationSelect.addEventListener('change', handleLocationChange);
    }
    
    // リフレッシュボタン
    const refreshLocationBtn = document.getElementById('refresh-location');
    if (refreshLocationBtn) {
        refreshLocationBtn.addEventListener('click', refreshLocationData);
    }
    
    // マップコントロールボタン
    const centerMapBtn = document.getElementById('center-map-btn');
    const toggleMapBtn = document.getElementById('toggle-map-btn');
    if (centerMapBtn) {
        centerMapBtn.addEventListener('click', centerMapToUser);
    }
    if (toggleMapBtn) {
        toggleMapBtn.addEventListener('click', toggleMapVisibility);
    }
    
    // ロケーションタブ切り替え
    const locationTabs = document.querySelectorAll('.location-tab');
    locationTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchLocationTab(e.target.dataset.type);
        });
    });
    
    // チェックイン・チェックアウトボタン
    const checkInBtn = document.getElementById('check-in-btn');
    const checkOutBtn = document.getElementById('check-out-btn');
    if (checkInBtn) {
        checkInBtn.addEventListener('click', handleCheckIn);
    }
    if (checkOutBtn) {
        checkOutBtn.addEventListener('click', handleCheckOut);
    }
    
    // 初期データ読み込み
    loadLocationData();
}

// 位置変更ハンドラー
function handleLocationChange() {
    const locationSelect = document.getElementById('location-select');
    const selectedLocation = locationSelect.value;
    const selectedText = locationSelect.options[locationSelect.selectedIndex].text;
    
    // 現在位置表示を更新
    document.getElementById('current-location-name').textContent = selectedText;
    
    console.log('Location changed to:', selectedLocation);
    loadLocationData(selectedLocation);
}

// 位置データリフレッシュ
function refreshLocationData() {
    const locationSelect = document.getElementById('location-select');
    const selectedLocation = locationSelect.value;
    
    // リフレッシュボタンにアニメーション追加
    const refreshBtn = document.getElementById('refresh-location');
    refreshBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        refreshBtn.style.transform = 'rotate(0deg)';
    }, 500);
    
    console.log('Refreshing location data for:', selectedLocation);
    loadLocationData(selectedLocation);
}

// ロケーションタブ切り替え
function switchLocationTab(type) {
    // タブのアクティブ状態を更新
    document.querySelectorAll('.location-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    console.log('Switched to location tab:', type);
    loadPeopleByType(type);
}

// タイプ別の人を読み込み
function loadPeopleByType(type) {
    const locationPeople = document.getElementById('location-people');
    
    // サンプルデータ
    const peopleData = {
        park: [
            { id: 1, name: '田中さん', dogName: 'ポチ', avatar: '🐕', status: '公園で休憩中', distance: '10m', checkInTime: '15分前' },
            { id: 2, name: '佐藤さん', dogName: 'モコ', avatar: '🐩', status: 'ベンチで待機', distance: '25m', checkInTime: '8分前' },
            { id: 3, name: '山田さん', dogName: 'チョコ', avatar: '🐕‍🦺', status: 'ドッグランにいます', distance: '50m', checkInTime: '3分前' }
        ],
        walking: [
            { id: 4, name: '鈴木さん', dogName: 'ラブ', avatar: '🦮', status: '散歩中', distance: '100m', checkInTime: '12分前', walkingRoute: '公園周回コース' },
            { id: 5, name: '高橋さん', dogName: 'ハチ', avatar: '🐕', status: '散歩中', distance: '200m', checkInTime: '20分前', walkingRoute: '川沿いコース' }
        ],
        nearby: [
            { id: 6, name: '伊藤さん', dogName: 'マル', avatar: '🐩', status: 'オンライン', distance: '300m', checkInTime: '5分前' },
            { id: 7, name: '渡辺さん', dogName: 'シロ', avatar: '🐕', status: 'オンライン', distance: '450m', checkInTime: '1分前' },
            { id: 8, name: '中村さん', dogName: 'クロ', avatar: '🦮', status: 'オンライン', distance: '500m', checkInTime: '7分前' }
        ]
    };
    
    const people = peopleData[type] || [];
    
    locationPeople.innerHTML = people.map(person => `
        <div class="person-item" data-person-id="${person.id}">
            <div class="person-avatar">${person.avatar}</div>
            <div class="person-info">
                <div class="person-name">${person.name} & ${person.dogName}</div>
                <div class="person-status">${person.status}</div>
                ${person.walkingRoute ? `<div class="walking-route">📍 ${person.walkingRoute}</div>` : ''}
            </div>
            <div class="person-meta">
                <div class="person-distance">${person.distance}</div>
                <div class="person-time">${person.checkInTime}</div>
                <button class="message-person-btn" onclick="startChatWithPerson(${person.id})">💬</button>
            </div>
        </div>
    `).join('');
    
    // 人数を更新
    document.getElementById('people-count').textContent = `${people.length}人`;
}

// 位置データ読み込み
function loadLocationData(location = 'shibuya-park') {
    console.log('Loading location data for:', location);
    
    // 現在のタブタイプを取得
    const activeTab = document.querySelector('.location-tab.active');
    const currentType = activeTab ? activeTab.dataset.type : 'park';
    
    // データを読み込み
    loadPeopleByType(currentType);
    
    // 最終更新時間を更新
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    document.getElementById('last-update').textContent = `${timeStr} 更新`;
}

// チェックイン処理
async function handleCheckIn() {
    if (!currentUser) {
        alert('ログインが必要です');
        return;
    }
    
    const locationSelect = document.getElementById('location-select');
    const selectedLocation = locationSelect.value;
    const locationName = locationSelect.options[locationSelect.selectedIndex].text;
    
    try {
        // Firestoreにチェックイン情報を保存
        const checkInData = {
            userId: currentUser.uid,
            userName: currentUser.displayName,
            location: selectedLocation,
            locationName: locationName,
            checkInTime: serverTimestamp(),
            status: 'checked-in'
        };
        
        await addDoc(collection(db, 'location_checkins'), checkInData);
        
        // UI更新
        document.getElementById('check-in-btn').classList.add('hidden');
        document.getElementById('check-out-btn').classList.remove('hidden');
        
        console.log('Checked in to:', locationName);
        alert(`${locationName}にチェックインしました！`);
        
        // データを再読み込み
        refreshLocationData();
        
    } catch (error) {
        console.error('Check-in error:', error);
        alert('チェックインに失敗しました');
    }
}

// チェックアウト処理
async function handleCheckOut() {
    if (!currentUser) {
        alert('ログインが必要です');
        return;
    }
    
    try {
        // 現在のチェックイン記録を検索してチェックアウト時間を追加
        const checkInsQuery = query(
            collection(db, 'location_checkins'),
            where('userId', '==', currentUser.uid),
            where('status', '==', 'checked-in'),
            orderBy('checkInTime', 'desc'),
            limit(1)
        );
        
        const querySnapshot = await getDocs(checkInsQuery);
        if (!querySnapshot.empty) {
            const checkInDoc = querySnapshot.docs[0];
            await updateDoc(checkInDoc.ref, {
                checkOutTime: serverTimestamp(),
                status: 'checked-out'
            });
        }
        
        // UI更新
        document.getElementById('check-out-btn').classList.add('hidden');
        document.getElementById('check-in-btn').classList.remove('hidden');
        
        console.log('Checked out successfully');
        alert('チェックアウトしました');
        
        // データを再読み込み
        refreshLocationData();
        
    } catch (error) {
        console.error('Check-out error:', error);
        alert('チェックアウトに失敗しました');
    }
}

// 人とのチャット開始
function startChatWithPerson(personId) {
    console.log('Starting chat with person:', personId);
    
    // メッセージタブに切り替え
    switchTab('messages');
    
    // 該当する人とのチャットを開始（実装は既存のメッセージ機能を使用）
    // TODO: 実際のユーザーIDでチャットを開始する処理を追加
    alert('この機能は開発中です。近日中に実装予定です！');
}

// Leafletマップ初期化（無料のOpenStreetMap）
function initializeLeafletMap() {
    console.log('Initializing Leaflet map...');
    
    try {
        // マップコンテナの存在確認
        const mapContainer = document.getElementById('leaflet-map');
        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }
        
        // 東京駅を中心とした初期表示
        const defaultLocation = [35.6812, 139.7671];
        
        // Leafletマップを初期化
        leafletMap = L.map('leaflet-map').setView(defaultLocation, 13);
        
        // OpenStreetMapタイルレイヤーを追加
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(leafletMap);
        
        // ユーザーの現在位置を取得してマップに表示
        getCurrentLocationForMap();
        
        // 主要な公園にマーカーを追加
        addParkMarkers();
        
        console.log('Leaflet map initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize Leaflet map:', error);
    }
}

// 現在位置取得（マップ用）
function getCurrentLocationForMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                userLocation = { lat, lng };
                
                console.log('User location obtained:', userLocation);
                
                // マップの中心を現在位置に移動
                if (leafletMap) {
                    leafletMap.setView([lat, lng], 15);
                    
                    // 現在位置にマーカーを追加
                    const userMarker = L.marker([lat, lng])
                        .addTo(leafletMap)
                        .bindPopup('🐕 あなたの現在位置')
                        .openPopup();
                    
                    // マーカーのアイコンをカスタマイズ
                    userMarker.setIcon(L.divIcon({
                        html: '🐕',
                        className: 'custom-marker',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    }));
                }
            },
            (error) => {
                console.error('位置情報取得エラー:', error);
                // エラー時はデフォルト位置を使用
                userLocation = { lat: 35.6812, lng: 139.7671 };
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    }
}

// 公園マーカーを追加
function addParkMarkers() {
    if (!leafletMap) return;
    
    // より多くの公園データ（東京都内の主要公園）
    const allParks = [
        { name: '渋谷公園', lat: 35.6586, lng: 139.7016, people: 4 },
        { name: '代々木公園', lat: 35.6732, lng: 139.6940, people: 8 },
        { name: '上野公園', lat: 35.7148, lng: 139.7734, people: 12 },
        { name: '井の頭公園', lat: 35.7004, lng: 139.5802, people: 6 },
        { name: '駒沢オリンピック公園', lat: 35.6298, lng: 139.6566, people: 3 },
        { name: '新宿中央公園', lat: 35.6899, lng: 139.6935, people: 7 },
        { name: '砧公園', lat: 35.6389, lng: 139.6289, people: 2 },
        { name: '林試の森公園', lat: 35.6241, lng: 139.7030, people: 5 },
        { name: '飛鳥山公園', lat: 35.7520, lng: 139.7385, people: 3 },
        { name: '舎人公園', lat: 35.7892, lng: 139.7920, people: 1 },
        { name: '石神井公園', lat: 35.7356, lng: 139.5944, people: 4 },
        { name: '善福寺公園', lat: 35.7144, lng: 139.5889, people: 2 },
        { name: '水元公園', lat: 35.7744, lng: 139.8531, people: 3 },
        { name: '葛西臨海公園', lat: 35.6455, lng: 139.8597, people: 6 },
        { name: '夢の島公園', lat: 35.6553, lng: 139.8267, people: 2 },
        { name: 'お台場海浜公園', lat: 35.6281, lng: 139.7714, people: 8 }
    ];
    
    // 現在地から近い公園のみを表示（5km以内）
    const nearbyParks = userLocation ? 
        allParks.filter(park => {
            const distance = calculateDistance(userLocation, { lat: park.lat, lng: park.lng });
            return distance <= 5; // 5km以内
        }).sort((a, b) => {
            const distanceA = calculateDistance(userLocation, { lat: a.lat, lng: a.lng });
            const distanceB = calculateDistance(userLocation, { lat: b.lat, lng: b.lng });
            return distanceA - distanceB;
        }).slice(0, 8) : allParks.slice(0, 8); // 現在地がない場合は最初の8つ
    
    const parks = nearbyParks;
    
    parks.forEach(park => {
        const marker = L.marker([park.lat, park.lng])
            .addTo(leafletMap)
            .bindPopup(`
                <div class="park-popup">
                    <h4>🏞️ ${park.name}</h4>
                    <p>👥 ${park.people}人がチェックイン中</p>
                    <button onclick="selectParkFromMap('${park.name}')" class="park-select-btn">
                        この公園を選択
                    </button>
                </div>
            `);
        
        // 公園マーカーのアイコンをカスタマイズ
        marker.setIcon(L.divIcon({
            html: '🏞️',
            className: 'park-marker',
            iconSize: [25, 25],
            iconAnchor: [12, 12]
        }));
    });
}

// マップから公園を選択
function selectParkFromMap(parkName) {
    const locationSelect = document.getElementById('location-select');
    const options = Array.from(locationSelect.options);
    const option = options.find(opt => opt.text === parkName);
    
    if (option) {
        locationSelect.value = option.value;
        handleLocationChange();
    }
}

// マップを現在位置に中央揃え
function centerMapToUser() {
    if (leafletMap && userLocation) {
        leafletMap.setView([userLocation.lat, userLocation.lng], 15);
        console.log('Map centered to user location');
    } else {
        // 現在位置を再取得
        getCurrentLocationForMap();
    }
}

// マップ表示切り替え
function toggleMapVisibility() {
    const mapTab = document.getElementById('map-tab');
    mapToggled = !mapToggled;
    
    if (mapToggled) {
        mapTab.classList.add('map-toggle-hidden');
        document.getElementById('toggle-map-btn').textContent = '🗺️ 表示';
    } else {
        mapTab.classList.remove('map-toggle-hidden');
        document.getElementById('toggle-map-btn').textContent = '🗺️ 非表示';
        
        // マップサイズを再調整
        setTimeout(() => {
            if (leafletMap) {
                leafletMap.invalidateSize();
            }
        }, 300);
    }
}

// グローバル関数として定義（onclick属性から呼び出し可能にする）
window.showFriendGroupModal = showFriendGroupModal;
window.deleteGroup = deleteGroup;
window.startChatWithPerson = startChatWithPerson;
window.selectParkFromMap = selectParkFromMap;

// アプリ初期化を実行（DOMContentLoadedで既に実行されるため削除）
// initializeAppAuth(); // 重複削除
// initializeAvatar(); // 重複削除