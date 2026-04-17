// 1. إعدادات Firebase (مشروعك الجديد medical-novix)
const firebaseConfig = {
  apiKey: "AIzaSyDArjn0nr-qG9XxH3UHI5UDu-6cLs6jM_M",
  authDomain: "medical-novix.firebaseapp.com",
  projectId: "medical-novix",
  storageBucket: "medical-novix.firebasestorage.app",
  messagingSenderId: "320783525166",
  appId: "1:320783525166:web:3f0c11e59f03b01b8046bf",
  measurementId: "G-LNV3SVPJWL"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const ADMIN_EMAIL = "musen.almajidi.alallaf@gmail.com";

// 2. مفتاح Gemini API (الذي أرسلته دكتور)
const GEN_AI_KEY = "AQ.Ab8RN6JqqfprCS0UwSvRNckttAJxQuhm06huJMMqabVxnTiw5w"; 

// 3. قائمة الأذكار
const dhikrs = [
    "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
    "اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي ، وَعَلِّمْنِي مَا يَنْفَعُنِي",
    "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    "رَبِّ زِدْنِي عِلْمًا ، وَارْزُقْنِي فَهْمًا"
];

// --- نظام تسجيل الدخول (Redirect) ---
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.onclick = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithRedirect(provider);
    };
}

// مراقبة حالة المستخدم بعد العودة من Redirect
auth.onAuthStateChanged(async (user) => {
    if (user) {
        document.getElementById('auth-overlay').style.display = 'none';
        
        // تسجيل بيانات الطالب في Firestore
        await db.collection('users').doc(user.uid).set({
            name: user.displayName,
            email: user.email,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        if (user.email === ADMIN_EMAIL) {
            document.getElementById('admin-panel').style.display = 'block';
        }
    } else {
        document.getElementById('auth-overlay').style.display = 'flex';
    }
});

// --- معالجة المحاضرة الطبية ---
const fileInput = document.getElementById('fileInput');
if (fileInput) {
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // تجهيز الواجهة للرفع
        document.getElementById('loading-area').style.display = 'block';
        document.getElementById('main-content').style.display = 'none';
        
        let dIdx = 0;
        const interval = setInterval(() => {
            document.getElementById('dhikr-text').innerText = dhikrs[dIdx];
            dIdx = (dIdx + 1) % dhikrs.length;
        }, 4000);

        try {
            const base64Data = await toBase64(file);
            
            // استدعاء Gemini API
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEN_AI_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: `أنت بروفيسور طبي تشرح لطلابك بأسلوب ممتع. 
                            حلل الملف المرفق وقدم الآتي:
                            1. قسم "الشرح": شرح مفصل وملون لكل فقرة مع ذكر الأدوية العراقية.
                            2. قسم "المصطلحات": قائمة بالمصطلحات الطبية الجديدة وترجمتها.
                            3. قسم "الاختبار": 5 أسئلة MCQ صعبة بنمط Case scenario.
                            افصل بين كل قسم باستخدام العلامة ###.` },
                            { inlineData: { data: base64Data, mimeType: file.type } }
                        ]
                    }]
                })
            });

            const data = await response.json();
            if (!data.candidates) throw new Error("API Error");
            
            const fullText = data.candidates[0].content.parts[0].text;
            processAndDisplayContent(fullText);

        } catch (error) {
            console.error(error);
            alert("فشل في معالجة الملف. تأكد من إعدادات الـ API أو حجم الملف.");
        } finally {
            clearInterval(interval);
            document.getElementById('loading-area').style.display = 'none';
        }
    };
}

// وظيفة توزيع المحتوى على التبويبات (Tabs)
function processAndDisplayContent(text) {
    const sections = text.split('###');
    
    // التبويب الأول: الشرح
    document.getElementById('dynamic-content').innerHTML = marked.parse(sections[0] || "لم يتم توليد الشرح");
    
    // التبويب الثاني: المصطلحات
    document.getElementById('terms-tab').innerHTML = marked.parse(sections[1] || "لا توجد مصطلحات مستخرجة");
    
    // التبويب الثالث: الكويز
    document.getElementById('quiz-tab').innerHTML = marked.parse(sections[2] || "لا يوجد اختبار متوفر");
    
    document.getElementById('main-content').style.display = 'block';
}

// وظائف مساعدة
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});

window.switchTab = (tab) => {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${tab}-tab`).classList.add('active');
    event.currentTarget.classList.add('active');
};
