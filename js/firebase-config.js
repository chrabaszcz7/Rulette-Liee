// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDENPSEHJG4EzJRnWTbGPY39-WFGgOx4QA",
  authDomain: "ruletka-lie.firebaseapp.com",
  projectId: "ruletka-lie",
  storageBucket: "ruletka-lie.firebasestorage.app",
  messagingSenderId: "705502883692",
  appId: "1:705502883692:web:08ed5b5b4794c6869a4d49",
  measurementId: "G-2GGJ8DE2ND"
};

// Initialize Firebase (avoid duplicate init across pages)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// App Check (fix auth/firebase-app-check-token-is-invalid)
// Set your App Check reCAPTCHA v3 site key here (Firebase Console -> App Check -> Web app)
const appCheckSiteKey = "6LfXr18sAAAAAC0y7SVNxo1qRep1nc6KDlvWcc0_";

try {
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (appCheckSiteKey && appCheckSiteKey !== "YOUR_APPCHECK_SITE_KEY" && firebase.appCheck) {
    if (!isLocalhost) {
      const appCheck = firebase.appCheck();
      appCheck.activate(new firebase.appCheck.ReCaptchaV3Provider(appCheckSiteKey), true);
    } else {
      console.warn("App Check is disabled on localhost. Use a real domain to test App Check without debug tokens.");
    }
  } else if (firebase.appCheck) {
    console.warn("App Check is enabled in Firebase. Add your reCAPTCHA v3 site key to appCheckSiteKey or disable App Check enforcement for Auth in the Firebase Console.");
  }
} catch (e) {
  console.warn("App Check initialization failed:", e);
}

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Helper functions
function generateSuffix() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';
    for (let i = 0; i < 5; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return suffix;
}

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'ROOM-';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function formatNickname(nickname, suffix) {
    return `${nickname}#${suffix}`;
}

function calculateWinrate(wins, losses) {
    const total = wins + losses;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const d = date.toLocaleDateString('pl-PL');
    const t = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    return `${d} ${t}`;
}

function getSeasonKey(date) {
    const d = date || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

function getSeasonLabel(seasonKey) {
    if (!seasonKey) return '';
    const parts = seasonKey.split('-');
    if (parts.length !== 2) return '';
    const year = parts[0];
    const monthIdx = Number(parts[1]) - 1;
    const date = new Date(Number(year), monthIdx, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
    return `${monthName} sezon ${year}`;
}

function getEloLevel(elo) {
    if (elo >= 2001) return 10;
    if (elo >= 1751) return 9;
    if (elo >= 1531) return 8;
    if (elo >= 1351) return 7;
    if (elo >= 1201) return 6;
    if (elo >= 1051) return 5;
    if (elo >= 901) return 4;
    if (elo >= 751) return 3;
    if (elo >= 501) return 2;
    if (elo >= 100) return 1;
    return 0;
}

function ensureEloSeason(user) {
    if (!user || !user.id) return Promise.resolve(user);
    const currentKey = getSeasonKey();
    if (!user.eloSeasonKey) {
        const initialElo = 1000;
        const initialRank = getEloLevel(initialElo);
        const updates = {
            elo: initialElo,
            eloSeasonKey: currentKey,
            eloRankLevel: initialRank,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        return db.collection('users').doc(user.id).update(updates).then(() => {
            return { ...user, elo: initialElo, eloSeasonKey: currentKey, eloRankLevel: initialRank };
        }).catch(() => user);
    }
    if (user.eloSeasonKey === currentKey) {
        if (typeof user.elo !== 'number') {
            const fixedElo = 1000;
            const fixedRank = getEloLevel(fixedElo);
            return db.collection('users').doc(user.id).update({
                elo: fixedElo,
                eloRankLevel: fixedRank,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => ({ ...user, elo: fixedElo, eloRankLevel: fixedRank })).catch(() => user);
        }
        return Promise.resolve(user);
    }

    const preservedRank = getEloLevel(user.elo || 0);
    const updates = {
        elo: 0,
        eloSeasonKey: currentKey,
        eloRankLevel: preservedRank,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    return db.collection('users').doc(user.id).update(updates).then(() => {
        return { ...user, elo: 0, eloSeasonKey: currentKey, eloRankLevel: preservedRank };
    }).catch(() => user);
}

function getEloDelta(min = 25, max = 30) {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function getBaseEloForSeason(data, seasonKey) {
    if (!data || !data.eloSeasonKey) return 1000;
    if (data.eloSeasonKey !== seasonKey) return 0;
    if (typeof data.elo !== 'number') return 1000;
    return data.elo;
}

function renderNickHTML(nickname, nickEffect, badge) {
    const effectClass = nickEffect ? `nick ${nickEffect}` : 'nick';
    const badgeHtml = badge ? ` <span class="nick-badge">${badge}</span>` : '';
    return `<span class="${effectClass}">${nickname}</span>${badgeHtml}`;
}

const AVATAR_FRAME_CLASSES = ['avatar-frame-red', 'avatar-frame-green', 'avatar-frame-rainbow', 'avatar-frame-purple', 'avatar-frame-blue', 'avatar-frame-black', 'avatar-frame-white'];

function getAvatarFrameClass(frame) {
    if (!frame || frame === 'default') return '';
    return `avatar-frame-${frame}`;
}

function applyAvatarFrame(el, frame) {
    if (!el || !el.classList) return;
    el.classList.remove(...AVATAR_FRAME_CLASSES);
    const cls = getAvatarFrameClass(frame);
    if (cls) el.classList.add(cls);
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast { position: fixed; bottom: 20px; right: 20px; padding: 1rem 1.5rem; border-radius: 10px; color: white;
                display: flex; align-items: center; gap: 1rem; z-index: 9999; animation: slideIn 0.3s ease; flex-wrap: wrap; }
            .toast-success { background: #22c55e; }
            .toast-error { background: #ef4444; }
            .toast-info { background: #3b82f6; }
            .toast button { background: none; border: none; color: white; font-size: 1.25rem; cursor: pointer; }
            .toast .toast-act { padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.9rem; cursor: pointer; margin-left: 0.5rem; }
            .toast .toast-act.primary { background: rgba(255,255,255,0.3); }
            .toast .toast-act.secondary { background: rgba(0,0,0,0.2); }
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `;
        document.head.appendChild(style);
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showToastWithActions(message, type, actions) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let html = `<span>${message}</span>`;
    (actions || []).forEach(a => {
        const cls = a.primary ? 'toast-act primary' : 'toast-act secondary';
        html += `<button class="${cls}" data-action="${a.id || ''}">${a.label}</button>`;
    });
    html += `<button onclick="this.parentElement.remove()">&times;</button>`;
    toast.innerHTML = html;
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast { position: fixed; bottom: 20px; right: 20px; padding: 1rem 1.5rem; border-radius: 10px; color: white;
                display: flex; align-items: center; gap: 1rem; z-index: 9999; animation: slideIn 0.3s ease; flex-wrap: wrap; }
            .toast-success { background: #22c55e; }
            .toast-error { background: #ef4444; }
            .toast-info { background: #3b82f6; }
            .toast button { background: none; border: none; color: white; font-size: 1.25rem; cursor: pointer; }
            .toast .toast-act { padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.9rem; cursor: pointer; margin-left: 0.5rem; }
            .toast .toast-act.primary { background: rgba(255,255,255,0.3); }
            .toast .toast-act.secondary { background: rgba(0,0,0,0.2); }
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `;
        document.head.appendChild(style);
    }
    document.body.appendChild(toast);
    const btns = toast.querySelectorAll('.toast-act');
    actions.forEach((a, i) => {
        if (a.onClick) btns[i].addEventListener('click', () => { a.onClick(); toast.remove(); });
    });
    setTimeout(() => toast.remove(), 15000);
}

// Check if user is logged in
function requireAuth() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            if (user) {
                resolve(user);
            } else {
                window.location.href = 'login.html';
                reject('Not authenticated');
            }
        });
    });
}

// Get current user data from Firestore
async function getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) return null;
    
    const doc = await db.collection('users').doc(user.uid).get();
    if (doc.exists) {
        return { id: doc.id, ...doc.data() };
    }
    return null;
}

var _notifFirstFriend = true;
var _notifFirstInvite = true;

function subscribeNotifications() {
    const u = window.__currentUser;
    if (!u || !u.id) return;
    db.collection('friendRequests')
        .where('toUserId', '==', u.id)
        .where('status', '==', 'pending')
        .onSnapshot(function(snap) {
            snap.docChanges().forEach(function(ch) {
                if (ch.type !== 'added') return;
                if (_notifFirstFriend) return;
                var d = ch.doc.data();
                if (u.notificationsFriendRequests === false) return;
                if (typeof showToast === 'function')
                    showToast((d.fromNickname || 'Someone') + ' sent you a friend request!', 'info');
            });
            _notifFirstFriend = false;
        });
    db.collection('roomInvites')
        .where('toUserId', '==', u.id)
        .onSnapshot(function(snap) {
            snap.docChanges().forEach(function(ch) {
                if (ch.type !== 'added') return;
                if (_notifFirstInvite) return;
                var d = ch.doc.data();
                var inviteId = ch.doc.id;
                var rid = d.roomId;
                var host = d.hostNickname || 'Someone';
                if (typeof showToastWithActions !== 'function') return;
                showToastWithActions(host + ' invited you to the lobby!', 'info', [
                    { label: 'Join', primary: true, onClick: function() { acceptRoomInvite(inviteId, rid); } },
                    { label: 'Decline', primary: false, onClick: function() { declineRoomInvite(inviteId); } }
                ]);
            });
            _notifFirstInvite = false;
        });
}

function acceptRoomInvite(inviteId, roomId) {
    var u = window.__currentUser;
    if (!u) return;
    db.collection('rooms').doc(roomId).get().then(function(roomSnap) {
        if (!roomSnap.exists) { showToast('Room does not exist', 'error'); throw new Error('stop'); }
        var r = roomSnap.data();
        if (r.status !== 'waiting') { showToast('Game already started', 'error'); throw new Error('stop'); }
        if (r.players.length >= r.maxPlayers) { showToast('Room is full', 'error'); throw new Error('stop'); }
        if (r.players.some(function(p) { return p.id === u.id; })) {
            db.collection('roomInvites').doc(inviteId).delete().catch(function() {});
            window.location.href = 'room.html?id=' + roomId;
            throw new Error('stop');
        }
        var pl = { id: u.id, nickname: u.nickname, suffix: u.suffix, avatarUrl: u.avatarUrl || null, nickEffect: u.activeNickEffect || null, profileBadge: u.profileBadge || null, avatarFrame: u.avatarFrame || 'default', isHost: false, isAlive: true, isReady: false };
        return db.collection('rooms').doc(roomId).update({
            players: firebase.firestore.FieldValue.arrayUnion(pl),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }).then(function() {
        return db.collection('roomInvites').doc(inviteId).delete();
    }).then(function() {
        showToast('Joined room!', 'success');
        window.location.href = 'room.html?id=' + roomId;
    }).catch(function(e) {
        if (e && e.message === 'stop') return;
        showToast('Error: ' + (e && e.message ? e.message : 'Error'), 'error');
    });
}

function declineRoomInvite(inviteId) {
    db.collection('roomInvites').doc(inviteId).delete().catch(function() {});
}


