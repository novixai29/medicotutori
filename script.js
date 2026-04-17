const firebaseConfig = {
  apiKey: "AIzaSyDArjn0nr-qG9XxH3UHI5UDu-6cLs6jM_M",
  authDomain: "medical-novix.firebaseapp.com",
  projectId: "medical-novix",
  storageBucket: "medical-novix.firebasestorage.app",
  messagingSenderId: "320783525166",
  appId: "1:320783525166:web:3f0c11e59f03b01b8046bf"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const GEN_AI_KEY = "AQ.Ab8RN6JqqfprCS0UwSvRNckttAJxQuhm06huJMMqabVxnTiw5w"; 

// --- منطق الوضع الليلي ---
function toggleDarkMode() {
    const body = document.body;
    const icon = document.getElementById('mode-icon');
    const btnText = icon.parentElement;

    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        icon.innerText = "🌙";
        btnText.innerHTML = "🌙 الوضع الليلي";
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-mode');
        icon.innerText = "☀️";
        btnText.innerHTML = "☀️ الوضع المضيء";
        localStorage.setItem('theme', 'dark-mode');
    }
}

// تطبيق الثيم المحفوظ عند التحميل
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.remove('dark-mode');
    document.getElementById('mode-icon').innerText = "🌙";
}

// --- واجهة المستخدم ---
function toggleMenu() {
    const m = document.getElementById('drop-menu');
    m.style.display = m.style.display === 'none' ? 'block' : 'none';
}

function switchAccount() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    auth.signInWithPopup(provider);
}

function signOut() { auth.signOut().then(() => location.reload()); }

auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('user-profile-menu').style.display = 'block';
        document.getElementById('user-initials').innerText = user.displayName ? user.displayName.charAt(0) : 'U';
        document.getElementById('user-display-name').innerText = user.email;
    } else {
        document.getElementById('auth-overlay').style.display = 'flex';
    }
});

document.getElementById('login-btn').onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(() => auth.signInWithRedirect(provider));
};

// --- الرفع والذكاء الاصطناعي ---
document.getElementById('fileInput').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('loading-area').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';

    try {
        const base64 = await toBase64(file);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEN_AI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [
                    { text: "أنت بروفيسور طبي خبير. اشرح الملف بأسلوب ممتع مع ذكر الأدوية العراقية والمصطلحات وكويز MCQ. افصل الأقسام بكلمة ###" },
                    { inlineData: { data: base64, mimeType: file.type } }
                ]}]
            })
        });
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const sections = text.split('###');
        document.getElementById('dynamic-content').innerHTML = marked.parse(sections[0] || "");
        document.getElementById('terms-tab').innerHTML = marked.parse(sections[1] || "");
        document.getElementById('quiz-tab').innerHTML = marked.parse(sections[2] || "");
        document.getElementById('main-content').style.display = 'block';
    } catch (err) { alert("تأكد من الـ API Key."); }
    finally { document.getElementById('loading-area').style.display = 'none'; }
};

const toBase64 = f => new Promise((res, rej) => {
    const r = new FileReader(); r.readAsDataURL(f);
    r.onload = () => res(r.result.split(',')[1]); r.onerror = rej;
});

window.switchTab = (t) => {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(t + '-tab').classList.add('active');
    event.currentTarget.classList.add('active');
};
