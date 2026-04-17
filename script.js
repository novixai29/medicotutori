// 1. إعدادات Firebase
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
const db = firebase.firestore();
const ADMIN_EMAIL = "musen.almajidi.alallaf@gmail.com";

// --- نظام الدخول الجديد (حل مشكلة الآيباد) ---
document.getElementById('login-btn').onclick = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // إعدادات لضمان عملها على الآيباد
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(async () => {
        try {
            // سنحاول الـ Popup أولاً، إذا فشل ننتقل للـ Redirect
            const result = await auth.signInWithPopup(provider);
            handleUser(result.user);
        } catch (error) {
            console.log("الآيباد حظر النافذة، ننتقل للـ Redirect التلقائي...");
            auth.signInWithRedirect(provider);
        }
    });
};

// مراقبة حالة المستخدم (هذا السطر هو الذي سيخفي الواجهة فور الدخول)
auth.onAuthStateChanged((user) => {
    if (user) {
        handleUser(user);
    } else {
        document.getElementById('auth-overlay').style.display = 'flex';
    }
});

function handleUser(user) {
    console.log("تم تسجيل الدخول بنجاح!");
    document.getElementById('auth-overlay').style.display = 'none';
    
    if (user.email === ADMIN_EMAIL) {
        document.getElementById('admin-panel').style.display = 'block';
    }
    
    // تسجيل الدخول في قاعدة البيانات
    db.collection('users').doc(user.uid).set({
        name: user.displayName,
        email: user.email,
        lastLogin: new Date()
    }, { merge: true });
}

// --- بقية كود معالجة الملف (Gemini) ---
const GEN_AI_KEY = "AQ.Ab8RN6JqqfprCS0UwSvRNckttAJxQuhm06huJMMqabVxnTiw5w"; 

document.getElementById('fileInput').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('loading-area').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';

    try {
        const base64 = await toBase64(file);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEN_AI_KEY}`, {
            method: 'POST',
            body: JSON.stringify({
                contents: [{ parts: [
                    { text: "أنت بروفيسور طبي. اشرح المحاضرة بأسلوب ممتع مع ذكر الأدوية العراقية والمصطلحات وكويز MCQ. افصل الأقسام بـ ###" },
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
    } catch (err) {
        alert("خطأ، تأكد من اتصال الإنترنت.");
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
