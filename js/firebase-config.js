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

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Role checking
function getUserRole(uid) {
    return db.collection('users').doc(uid).get().then(doc => {
        return doc.exists ? doc.data().role : 'user';
    });
}

// Google Sign-In — auto create user doc if first time
function signInWithGoogle() {
    return auth.signInWithPopup(googleProvider).then(result => {
        const user    = result.user;
        const userRef = db.collection('users').doc(user.uid);
        return userRef.get().then(doc => {
            if (!doc.exists) {
                return userRef.set({
                    name:      user.displayName || 'Fashion Lover',
                    email:     user.email,
                    photoURL:  user.photoURL || '',
                    role:      'user',
                    status:    'active',
                    provider:  'google',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });
    }).then(() => getUserRole(auth.currentUser.uid))
      .then(role => {
        if (role === 'owner')      window.location.href = 'owner.html';
        else if (role === 'admin') window.location.href = 'admin.html';
        else                       window.location.href = 'index.html';
    });
}
