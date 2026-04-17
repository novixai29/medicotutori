// 1. إعدادات Firebase المحدثة لمشروعك (medical-novix)
const firebaseConfig = {
  apiKey: "AIzaSyDArjn0nr-qG9XxH3UHI5UDu-6cLs6jM_M",
  authDomain: "medical-novix.firebaseapp.com",
  projectId: "medical-novix",
  storageBucket: "medical-novix.firebasestorage.app",
  messagingSenderId: "320783525166",
  appId: "1:320783525166:web:3f0c11e59f03b01b8046bf",
  measurementId: "G-LNV3SVPJWL"
};

// تهيئة Firebase (باستخدام النسخة المتوافقة مع المتصفح مباشرة)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const ADMIN_EMAIL = "musen.almajidi.alallaf@gmail.com";

// 2. مفتاح Gemini (الذي أرسلته دكتور)
const GEN_AI_KEY = "AQ.Ab8RN6JqqfprCS0UwSvRNckttAJxQuhm06huJMMqabVxnTiw5w"; 

// 3. قائمة الأذكار
const dhikrs = [
    "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
    "اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي ، وَعَلِّمْنِي مَا يَنْفَعُنِي",
    "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    "رَبِّ زِدْنِي عِلْمًا"
];

// --- نظام تسجيل الدخول ---
const loginBtn = document.getElementById('login-btn');

if (loginBtn) {
    loginBtn.onclick = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        // نستخدم Popup هنا لتجربة الاستجابة السريعة
        auth.signInWithPopup(provider).catch(err => {
            console.error("خطأ في تسجيل الدخول:", err);
            // إذا فشل الـ Popup (بسبب حظر الآيباد)، نستخدم الـ Redirect
            auth.signInWithRedirect(provider);
        });
    };
}

auth.onAuthStateChanged(async (user) => {
    if (user) {
        document.getElementById('auth-overlay').style.display = 'none';
        
        // حفظ بيانات الطالب
        await db.collection('users').doc(user.uid).set({
            name: user.displayName,
            email: user.email,
            lastLogin: Date.now()
        }, { merge: true });

        if (user.email === ADMIN_EMAIL) {
            document.getElementById('admin-panel').style.display = 'block';
        }
    } else {
        document.getElementById('auth-overlay').style.display = 'flex';
    }
});

// --- معالجة المحاضرة ---
const fileInput = document.getElementById('fileInput');

if (fileInput) {
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        document.getElementById('loading-area').style.display = 'block';
        document.getElementById('main-content').style.display = 'none';
        
        let dhikrIdx = 0;
        const dhikrInterval = setInterval(() => {
            document.getElementById('dhikr-text').innerText = dhikrs[dhikrIdx];
            dhikrIdx = (dhikrIdx + 1) % dhikrs.length;
        }, 4000);

        try {
            // استدعاء مكتبة Gemini بطريقة مباشرة للمتصفح
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEN_AI_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "أنت دكتور طبي تشرح لصديقك بأسلوب ممتع. اشرح الملف المرفق: تذكير (7 أسطر)، شرح الفقرات، أدوية بأسماء تجارية عراقية، فحوصات، مصطلحات، وكويز MCQ." },
                            { inlineData: { data: await toBase64(file), mimeType: file.type } }
                        ]
                    }]
                })
            });

            const data = await response.json();
            const responseText = data.candidates[0].content.parts[0].text;
            
            document.getElementById('main-content').style.display = 'block';
            const sections = responseText.split('###');
            document.getElementById('dynamic-content').innerHTML = sections.map((s, i) => `
                <div class="explanation-block block-${i % 3}">
                    ${marked.parse(s)}
                </div>
            `).join('');

        } catch (error) {
            alert("حدث خطأ في معالجة الملف، يرجى المحاولة لاحقاً.");
        } finally {
            clearInterval(dhikrInterval);
            document.getElementById('loading-area').style.display = 'none';
        }
    };
}

// وظيفة تحويل الملف
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});

// تبديل التبويبات
window.switchTab = (tab) => {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.getElementById(`${tab}-tab`).classList.add('active');
};
