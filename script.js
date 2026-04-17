import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. إعدادات Firebase للمشروع الجديد (المحدثة من صورتك الأخيرة)
const firebaseConfig = {
  apiKey: "AIzaSyBvD3-p8D9KqL_P8u_l1Oq8r3U9L2k7cE",
  authDomain: "medical-tutorial-3652c.firebaseapp.com",
  projectId: "medical-tutorial-3652c",
  storageBucket: "medical-tutorial-3652c.firebasestorage.app",
  messagingSenderId: "109876543210", // سيقوم Firebase بتحديثه تلقائياً عند الربط
  appId: "1:109876543210:web:abcdef1234567890",
  measurementId: "G-XXXXXXXXXX"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const ADMIN_EMAIL = "musen.almajidi.alallaf@gmail.com";

// 2. إعداد Gemini API (ضع مفتاحك هنا دكتور)
const GEN_AI_KEY = "AQ.Ab8RN6JqqfprCS0UwSvRNckttAJxQuhm06huJMMqabVxnTiw5w"; 
const genAI = new GoogleGenerativeAI(GEN_AI_KEY);

// 3. قائمة الأذكار
const dhikrs = [
    "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
    "اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي ، وَعَلِّمْنِي مَا يَنْفَعُنِي",
    "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    "رَبِّ زِدْنِي عِلْمًا"
];

// --- نظام تسجيل الدخول (استخدام Redirect لتجاوز مشاكل الآيباد) ---
const loginBtn = document.getElementById('login-btn');

loginBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    // استخدمنا signInWithRedirect لأنها أضمن في متصفحات الآيباد والـ Safari
    auth.signInWithRedirect(provider);
};

// التأكد من حالة تسجيل الدخول بعد التحويل
auth.getRedirectResult().catch(error => console.error("خطأ في تسجيل الدخول:", error));

auth.onAuthStateChanged(async (user) => {
    if (user) {
        document.getElementById('auth-overlay').style.display = 'none';
        
        // تسجيل بيانات المستخدم في Firestore كقاعدة بيانات
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

// --- معالجة المحاضرات والذكاء الاصطناعي ---
document.getElementById('fileInput').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('loading-area').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
    
    let dhikrIdx = 0;
    const dhikrInterval = setInterval(() => {
        document.getElementById('dhikr-text').innerText = dhikrs[dhikrIdx];
        dhikrIdx = (dhikrIdx + 1) % dhikrs.length;
    }, 4500);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const filePart = await fileToGenerativePart(file);

        const prompt = `
        أنت دكتور وبروفيسور طبي تشرح لصديقك بأسلوب ممتع وودي. 
        المطلوب: شرح الملف المرفق مع تذكير (7-10 أسطر)، شرح الفقرات بألوان مريحة، 
        ذكر الأدوية بأسماء تجارية عراقية، شرح الفحوصات الطبية، استخراج المصطلحات، 
        ووضع 5 أسئلة MCQ صعبة جداً بنظام كيس سيناريو.
        `;

        const result = await model.generateContent([prompt, filePart]);
        const responseText = result.response.text();

        renderContent(responseText);
    } catch (error) {
        alert("حدث خطأ في الاتصال بالذكاء الاصطناعي، تأكد من مفتاح الـ API.");
    } finally {
        clearInterval(dhikrInterval);
        document.getElementById('loading-area').style.display = 'none';
    }
};

function renderContent(markdownText) {
    document.getElementById('main-content').style.display = 'block';
    const sections = markdownText.split('###');
    document.getElementById('dynamic-content').innerHTML = sections.map((s, i) => `
        <div class="explanation-block block-${i % 3}">
            ${marked.parse(s)}
        </div>
    `).join('');
}

async function fileToGenerativePart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({
            inlineData: { data: reader.result.split(',')[1], mimeType: file.type }
        });
        reader.readAsDataURL(file);
    });
}

// تبديل التبويبات
window.switchTab = (tab) => {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.getElementById(`${tab}-tab`).classList.add('active');
};
