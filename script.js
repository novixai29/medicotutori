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

// دكتور: استبدل هذا بالمفتاح الفعال من Google AI Studio
const GEN_AI_KEY = "AQ.Ab8RN6LxuTogXc4uFltYsMEAOU7W4dmL3tNvgPifzth3BwhXCw"; 

function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');
    document.getElementById('mode-icon').innerText = isDark ? "☀️" : "🌙";
    document.getElementById('mode-text').innerText = isDark ? "الوضع المضيء" : "الوضع الليلي";
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

if (localStorage.getItem('theme') === 'light') {
    document.body.classList.remove('dark-mode');
    document.getElementById('mode-icon').innerText = "🌙";
}

function toggleMenu() {
    const menu = document.getElementById('drop-menu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function switchAccount() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(() => auth.signInWithRedirect(provider));
}

function signOut() { auth.signOut().then(() => location.reload()); }

auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('user-profile-menu').style.display = 'block';
        document.getElementById('user-initials').innerText = user.displayName ? user.displayName.charAt(0) : 'D';
        document.getElementById('user-display-name').innerText = user.email;
    } else {
        document.getElementById('auth-overlay').style.display = 'flex';
    }
});

document.getElementById('login-btn').onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(() => auth.signInWithRedirect(provider));
};

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
                    { text: "أنت بروفيسور طبي خبير. اشرح المحاضرة المرفقة بالتفصيل، اذكر الأدوية العراقية المتاحة، قائمة المصطلحات، وكويز MCQ. افصل الأقسام بكلمة ###" },
                    { inlineData: { data: base64, mimeType: file.type } }
                ]}]
            })
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const sections = text.split('###');

        document.getElementById('dynamic-tab').innerHTML = marked.parse(sections[0] || "");
        document.getElementById('terms-tab').innerHTML = marked.parse(sections[1] || "");
        document.getElementById('quiz-tab').innerHTML = marked.parse(sections[2] || "");
        document.getElementById('main-content').style.display = 'block';
    } catch (err) {
        alert("تنبيه: تأكد من مفتاح الـ API Key في الكود.");
    } finally {
        document.getElementById('loading-area').style.display = 'none';
    }
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
