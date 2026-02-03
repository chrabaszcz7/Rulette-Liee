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
                    showToast((d.fromNickname || 'Ktoś') + ' zaprosił Cię do znajomych!', 'info');
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
                var host = d.hostNickname || 'Ktoś';
                if (typeof showToastWithActions !== 'function') return;
                showToastWithActions(host + ' zaprosił Cię do lobby!', 'info', [
                    { label: 'Dołącz', primary: true, onClick: function() { acceptRoomInvite(inviteId, rid); } },
                    { label: 'Odrzuć', primary: false, onClick: function() { declineRoomInvite(inviteId); } }
                ]);
            });
            _notifFirstInvite = false;
        });
}

function acceptRoomInvite(inviteId, roomId) {
    var u = window.__currentUser;
    if (!u) return;
    db.collection('rooms').doc(roomId).get().then(function(roomSnap) {
        if (!roomSnap.exists) { showToast('Pokój nie istnieje', 'error'); throw new Error('stop'); }
        var r = roomSnap.data();
        if (r.status !== 'waiting') { showToast('Gra już się rozpoczęła', 'error'); throw new Error('stop'); }
        if (r.players.length >= r.maxPlayers) { showToast('Pokój pełny', 'error'); throw new Error('stop'); }
        if (r.players.some(function(p) { return p.id === u.id; })) {
            db.collection('roomInvites').doc(inviteId).delete().catch(function() {});
            window.location.href = 'room.html?id=' + roomId;
            throw new Error('stop');
        }
        var pl = { id: u.id, nickname: u.nickname, suffix: u.suffix, avatarUrl: u.avatarUrl || null, isHost: false, isAlive: true, isReady: false };
        return db.collection('rooms').doc(roomId).update({
            players: firebase.firestore.FieldValue.arrayUnion(pl),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }).then(function() {
        return db.collection('roomInvites').doc(inviteId).delete();
    }).then(function() {
        showToast('Dołączono do pokoju!', 'success');
        window.location.href = 'room.html?id=' + roomId;
    }).catch(function(e) {
        if (e && e.message === 'stop') return;
        showToast('Błąd: ' + (e && e.message ? e.message : 'Błąd'), 'error');
    });
}

function declineRoomInvite(inviteId) {
    db.collection('roomInvites').doc(inviteId).delete().catch(function() {});
}
