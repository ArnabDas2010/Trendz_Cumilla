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
    return db.collection('users').doc(uid).get().then(doc => {
        return doc.exists ? doc.data().role : 'user';
    });
}

// ── Google Redirect Sign-In ───────────────────────────────
function signInWithGoogle() {
    sessionStorage.setItem('googleAuthPending', '1');
    return auth.signInWithRedirect(googleProvider);
}

// ── Process redirect result (call on every page load) ─────
function handleGoogleRedirectResult() {
    return auth.getRedirectResult().then(function(result) {
        // No redirect happened (normal page load) — resolve cleanly
        if (!result || !result.user) {
            sessionStorage.removeItem('googleAuthPending');
            return null;
        }

        var user    = result.user;
        var userRef = db.collection('users').doc(user.uid);

        return userRef.get().then(function(doc) {
            if (!doc.exists) {
                // First time Google login — create profile
                return userRef.set({
                    name:      user.displayName  || 'Fashion Lover',
                    email:     user.email        || '',
                    photoURL:  user.photoURL     || '',
                    role:      'user',
                    status:    'active',
                    provider:  'google',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Returning Google user — sync name/photo
                return userRef.update({
                    name:     user.displayName || doc.data().name,
                    photoURL: user.photoURL    || doc.data().photoURL || ''
                });
            }
        }).then(function() {
            return getUserRole(user.uid);
        }).then(function(role) {
            sessionStorage.removeItem('googleAuthPending');
            // Small delay to ensure Firestore write is settled before redirect
            setTimeout(function() {
                if (role === 'owner')      window.location.href = 'owner.html';
                else if (role === 'admin') window.location.href = 'admin.html';
                else                       window.location.href = 'index.html';
            }, 300);
        });

    }).catch(function(err) {
        sessionStorage.removeItem('googleAuthPending');
        return Promise.reject(err);
    });
}
