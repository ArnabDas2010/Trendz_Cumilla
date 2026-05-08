// Auth & Session — TRENDZ COMILLA
let currentUser = null;
let userRole = 'user';

auth.onAuthStateChanged(function(user) {
    // auth.js is not loaded on login.html, but guard anyway
    if (window.location.pathname.includes('login.html')) return;

    currentUser = user;
    const authLinks = document.getElementById('authLinks');
    const userMenu  = document.getElementById('userMenu');

    if (user) {
        if (authLinks) authLinks.style.display = 'none';
        if (userMenu)  userMenu.style.display = 'flex';

        const userRef = db.collection('users').doc(user.uid);
        userRef.get().then(doc => {
            // Create doc if missing (edge case)
            if (!doc.exists) {
                return userRef.set({
                    name:      user.displayName || 'Fashion Lover',
                    email:     user.email || '',
                    photoURL:  user.photoURL || '',
                    role:      'user',
                    status:    'active',
                    provider:  user.providerData[0] ? user.providerData[0].providerId : 'email',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => userRef.get());
            }
            return doc;
        }).then(doc => {
            const u = doc.data ? doc.data() : doc;

            // Show profile photo in header if available
            const profileBtn = document.getElementById('profileBtn');
            const photo = (u && u.photoURL) || user.photoURL;
            if (profileBtn && photo) {
                profileBtn.innerHTML = `<img src="${photo}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);">`;
            }

            return getUserRole(user.uid);
        }).then(role => {
            userRole = role;
            updateRoleSpecificUI();
            syncCartWithFirestore();
        });

    } else {
        if (authLinks) authLinks.style.display = 'flex';
        if (userMenu)  userMenu.style.display = 'none';
        userRole = 'user';
    }
});

function logout() {
    auth.signOut().then(() => { window.location.href = 'index.html'; });
}

function updateRoleSpecificUI() {
    const adminLink = document.getElementById('adminLink');
    const ownerLink = document.getElementById('ownerLink');
    if (adminLink) adminLink.style.display = (userRole === 'admin' || userRole === 'owner') ? 'flex' : 'none';
    if (ownerLink) ownerLink.style.display = (userRole === 'owner') ? 'flex' : 'none';
}

// ─── Cart ─────────────────────────────────────
function getLocalCart() {
    try { return JSON.parse(localStorage.getItem('cart')) || []; }
    catch(e) { return []; }
}

function setLocalCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const count = getLocalCart().reduce((t, i) => t + i.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(b => {
        b.textContent = count;
        b.style.display = count > 0 ? 'flex' : 'none';
    });
}

function syncCartWithFirestore() {
    if (!currentUser) return;
    const local = getLocalCart();
    if (local.length > 0) {
        db.collection('carts').doc(currentUser.uid).set({
            items: local,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } else {
        db.collection('carts').doc(currentUser.uid).get().then(doc => {
            if (doc.exists) setLocalCart(doc.data().items);
        });
    }
}

// ─── Theme ────────────────────────────────────
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');

updateCartBadge();
