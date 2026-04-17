import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSy...", // ضع مفتاح Firebase الخاص بك
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-app",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "12345",
    appId: "1:12345:web:abc"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const ADMIN_EMAIL = "musen.almajidi.alallaf@gmail.com";

// 2. إعداد Gemini
const genAI = new GoogleGenerativeAI("ضع_مفتاح_GEMINI_هنا");

// عناصر الواجهة
const loginBtn = document.getElementById('login-btn');
const fileInput = document.getElementById('fileInput');
const loadingArea = document.getElementById('loading-area');
const dhikrText = document.getElementById('dhikr-text');
const mainContent = document.getElementById('main-content');

// الأذكار
const dhikrs = [
    "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
    "اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي ، وَعَلِّمْنِي مَا يَنْفَعُنِي",
    "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    "رَبِّ زِدْنِي عِلْمًا"
];

// المصادقة
loginBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
};

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('auth-overlay').style.display = 'none';
        if (user.email === ADMIN_EMAIL) document.getElementById('admin-panel').style.display = 'block';
        updateUserRecord(user);
    }
});

async function updateUserRecord(user) {
    await db.collection('users').doc(user.uid).set({
        name: user.displayName,
        email: user.email,
        lastLogin: Date.now()
    }, { merge: true });
}

// معالجة الملف
fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    loadingArea.style.display = 'block';
    let dhikrIdx = 0;
    const interval = setInterval(() => {
        dhikrText.innerText = dhikrs[dhikrIdx];
        dhikrIdx = (dhikrIdx + 1) % dhikrs.length;
    }, 4000);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const filePart = await fileToGenerativePart(file);
        
        const prompt = `أنت دكتور وبروفيسور طبي تشرح لصديقك بأسلوب ممتع. اشرح الملف المرفق بالتفصيل:
        1. ابدأ بتذكير شامل (8 أسطر) عن الموضوع السابق المرتبط.
        2. شرح مرتب لكل فقرة على حدة.
        3. اذكر الأسماء التجارية للأدوية المشهورة بالعراق.
        4. اشرح الفحوصات الطبية المذكورة وكيفية إجرائها علمياً.
        5. استخرج المصطلحات الصعبة في قسم منفصل.
        6. أنشئ 5 أسئلة MCQ كيس سيناريو صعبة جداً.
        التزم بلغة عربية فصحى مبسطة وودية.`;

        const result = await model.generateContent([prompt, filePart]);
        const response = result.response.text();
        
        processAndDisplay(response);
    } catch (err) {
        console.error(err);
        alert("حدث خطأ في المعالجة");
    } finally {
        clearInterval(interval);
        loadingArea.style.display = 'none';
    }
};

function processAndDisplay(text) {
    mainContent.style.display = 'block';
    // تقسيم النص بناءً على الرموز (افتراضياً نقسم حسب العناوين)
    const sections = text.split('###');
    
    const container = document.getElementById('dynamic-content');
    container.innerHTML = sections.map((s, i) => `
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

// نظام التبويبات
window.switchTab = (tab) => {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`${tab}-tab`).classList.add('active');
    event.target.classList.add('active');
};
