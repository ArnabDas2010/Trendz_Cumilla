// TRENDZ COMILLA — Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA5kJsA7w8vYHk0jwRJUnzt2oLM4L80ilw",
  authDomain: "trendz-cumilla.firebaseapp.com",
  projectId: "trendz-cumilla",
  storageBucket: "trendz-cumilla.firebasestorage.app",
  messagingSenderId: "655431549863",
  appId: "1:655431549863:web:d5657190a164f1f16eec82",
  measurementId: "G-2KJCRES6QB"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db   = firebase.firestore();

const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ── Role fetch ────────────────────────────────────────────
function getUserRole(uid) {
    return db.collection('users').doc(uid).get().then(function(doc) {
        return doc.exists ? doc.data().role : 'user';
    });
}

// ── Save/update Google user profile in Firestore ─────────
function saveGoogleUser(user) {
    var userRef = db.collection('users').doc(user.uid);
    return userRef.get().then(function(doc) {
        if (!doc.exists) {
            return userRef.set({
                name:      user.displayName || 'Fashion Lover',
                email:     user.email       || '',
                photoURL:  user.photoURL    || '',
                role:      'user',
                status:    'active',
                provider:  'google',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            return userRef.update({
                name:     user.displayName || doc.data().name,
                photoURL: user.photoURL    || doc.data().photoURL || ''
            });
        }
    });
}

// ── Google Popup Sign-In (replaces redirect — more reliable on mobile) ───
function signInWithGoogle(onSuccess, onError) {
    auth.signInWithPopup(googleProvider)
        .then(function(result) {
            return saveGoogleUser(result.user).then(function() {
                return getUserRole(result.user.uid);
            });
        })
        .then(function(role) {
            if (typeof onSuccess === 'function') onSuccess(role);
        })
        .catch(function(err) {
            if (typeof onError === 'function') onError(err);
        });
}
