// 1. إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDArjn0nr-qG9XxH3UHI5UDu-6cLs6jM_M",
  authDomain: "medical-novix.firebaseapp.com",
  projectId: "medical-novix",
  storageBucket: "medical-novix.firebasestorage.app",
  messagingSenderId: "320783525166",
  appId: "1:320783525166:web:3f0c11e59f03b01b8046bf"
};

// تهيئة التطبيق
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const ADMIN_EMAIL = "musen.almajidi.alallaf@gmail.com";
const GEN_AI_KEY = "AQ.Ab8RN6JqqfprCS0UwSvRNckttAJxQuhm06huJMMqabVxnTiw5w"; 

const dhikrs = ["سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", "اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي", "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", "رَبِّ زِدْنِي عِلْمًا"];

// --- نظام تسجيل الدخول المطور ---
document.getElementById('login-btn').onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // تحديد "الثبات" لضمان بقاء المستخدم مسجلاً حتى بعد غلق الصفحة أو تحديثها
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            return auth.signInWithRedirect(provider);
        })
        .catch((error) => {
            console.error("خطأ في تحديد الثبات:", error.message);
        });
};

// معالجة النتيجة بعد العودة من صفحة جوجل
auth.getRedirectResult().then((result) => {
    if (result.user) {
        console.log("تم الدخول بنجاح كـ:", result.user.displayName);
        checkUserStatus(result.user);
    }
}).catch((error) => {
    console.error("خطأ في الـ Redirect:", error.code, error.message);
});

// مراقبة حالة المستخدم بشكل مستمر
auth.onAuthStateChanged((user) => {
    if (user) {
        checkUserStatus(user);
    } else {
        document.getElementById('auth-overlay').style.display = 'flex';
    }
});

function checkUserStatus(user) {
    document.getElementById('auth-overlay').style.display = 'none';
    
    // إظهار لوحة الإدارة إذا كنت أنت الداخل
    if (user.email === ADMIN_EMAIL) {
        document.getElementById('admin-panel').style.display = 'block';
    }

    // حفظ بيانات المستخدم في Firestore كإحصائية للدكتور محسن
    db.collection('users').doc(user.uid).set({
        name: user.displayName,
        email: user.email,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

// --- معالجة الملف واستدعاء Gemini ---
document.getElementById('fileInput').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('loading-area').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';

    let dIdx = 0;
    const interval = setInterval(() => {
        document.getElementById('dhikr-text').innerText = dhikrs[dIdx];
        dIdx = (dIdx + 1) % dhikrs.length;
    }, 4000);

    try {
        const base64 = await toBase64(file);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEN_AI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [
                    { text: "أنت بروفيسور طبي. اشرح الملف المرفق: شرح مفصل، أدوية عراقية، مصطلحات، ثم اختبار MCQ. افصل بين كل قسم بعلامة ###" },
                    { inlineData: { data: base64, mimeType: file.type } }
                ]}]
            })
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const sections = text.split('###');

        document.getElementById('dynamic-content').innerHTML = marked.parse(sections[0] || "");
        document.getElementById('terms-tab').innerHTML = marked.parse(sections[1] || "لا توجد مصطلحات");
        document.getElementById('quiz-tab').innerHTML = marked.parse(sections[2] || "لا يوجد اختبار");

        document.getElementById('main-content').style.display = 'block';
    } catch (err) {
        alert("حدث خطأ في معالجة الملف، جرب مرة أخرى.");
    } finally {
        clearInterval(interval);
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
