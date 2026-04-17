import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. إعدادات Firebase (تم تحديثها ببياناتك الحقيقية)
const firebaseConfig = {
  apiKey: "AIzaSyDBfVlw_j6A5hqwheoP3UaPFAdY-K7UCcE",
  authDomain: "medical-toturial.firebaseapp.com",
  projectId: "medical-toturial",
  storageBucket: "medical-toturial.firebasestorage.app",
  messagingSenderId: "359175395041",
  appId: "1:359175395041:web:99793d8d5d4807d38309a0",
  measurementId: "G-97M57TVKXB"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const ADMIN_EMAIL = "musen.almajidi.alallaf@gmail.com";

// 2. إعداد Gemini API (ضع مفتاحك هنا)
const GEN_AI_KEY = "AQ.Ab8RN6Kb2gx-TqxNvbm1Jrmy57BbVqx4lT0b1Kawtznsrn0P2w"; 
const genAI = new GoogleGenerativeAI(GEN_AI_KEY);

// 3. قائمة الأذكار الإسلامية
const dhikrs = [
    "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
    "اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي ، وَعَلِّمْنِي مَا يَنْفَعُنِي",
    "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    "رَبِّ زِدْنِي عِلْمًا ، وَارْزُقْنِي فَهْمًا",
    "اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا"
];

// 4. عناصر الواجهة
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const authOverlay = document.getElementById('auth-overlay');
const adminPanel = document.getElementById('admin-panel');
const fileInput = document.getElementById('fileInput');
const loadingArea = document.getElementById('loading-area');
const dhikrText = document.getElementById('dhikr-text');
const mainContent = document.getElementById('main-content');
const dynamicContent = document.getElementById('dynamic-content');

// --- نظام المصادقة (Authentication) ---

loginBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
};

logoutBtn.onclick = () => auth.signOut().then(() => location.reload());

auth.onAuthStateChanged(async (user) => {
    if (user) {
        authOverlay.style.display = 'none';
        logoutBtn.style.display = 'block';
        
        // تسجيل بيانات المستخدم في Firestore
        await db.collection('users').doc(user.uid).set({
            name: user.displayName,
            email: user.email,
            photo: user.photoURL,
            lastLogin: Date.now()
        }, { merge: true });

        // التحقق من صلاحيات الإدارة
        if (user.email === ADMIN_EMAIL) {
            adminPanel.style.display = 'block';
            loadAdminStats();
        }
        
        loadUserHistory(user.uid);
    } else {
        authOverlay.style.display = 'flex';
    }
});

// --- معالجة المحاضرات والذكاء الاصطناعي ---

fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // بدء واجهة التحميل والأذكار
    loadingArea.style.display = 'block';
    mainContent.style.display = 'none';
    
    let dhikrIdx = 0;
    const dhikrInterval = setInterval(() => {
        dhikrText.innerText = dhikrs[dhikrIdx];
        dhikrIdx = (dhikrIdx + 1) % dhikrs.length;
    }, 4500);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const filePart = await fileToGenerativePart(file);

        const prompt = `
        أنت دكتور وبروفيسور طبي تشرح لصديقك الطالب بأسلوب "صديق لصديقه".
        المطلوب منك شرح الملف المرفق بدقة مع الالتزام بالآتي:
        1. ابدأ بفقرة (تذكير بالموضوع السابق المرتبط) لا تقل عن 7 أسطر.
        2. قسم الشرح لفقرات مرتبة، كل فقرة تتناول فكرة واحدة.
        3. أي دواء يذكر، اذكر اسمه العلمي واسمه التجاري المشهور في العراق.
        4. أي فحص طبي، اشرح "كيف يتم" وما هي "أساسياته" بفقرة مستقلة.
        5. اشرح أي صورة أو مخطط موجود في الملف.
        6. استخرج المصطلحات الصعبة في تبويب منفصل.
        7. أنشئ 5 أسئلة MCQ بنظام Case Scenario تتدرج من صعبة إلى شديدة الصعوبة.
        استخدم لغة عربية فصحى مبسطة وودية جداً.
        `;

        const result = await model.generateContent([prompt, filePart]);
        const responseText = result.response.text();

        // عرض المحتوى وحفظه
        renderContent(responseText);
        saveLectureToHistory(file.name, responseText);

    } catch (error) {
        console.error(error);
        alert("عذراً دكتور، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. تأكد من مفتاح الـ API.");
    } finally {
        clearInterval(dhikrInterval);
        loadingArea.style.display = 'none';
    }
};

function renderContent(markdownText) {
    mainContent.style.display = 'block';
    // تقسيم النص بناءً على العناوين لملون الفقرات
    const sections = markdownText.split('###');
    
    dynamicContent.innerHTML = sections.map((s, i) => `
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

// --- إدارة البيانات والسجلات ---

async function saveLectureToHistory(title, content) {
    const user = auth.currentUser;
    if (user) {
        await db.collection('users').doc(user.uid).collection('lectures').add({
            title: title,
            content: content,
            timestamp: Date.now()
        });
        loadUserHistory(user.uid);
    }
}

async function loadUserHistory(uid) {
    const snapshot = await db.collection('users').doc(uid).collection('lectures').orderBy('timestamp', 'desc').get();
    const list = document.getElementById('history-list');
    list.innerHTML = snapshot.docs.map(doc => `
        <li onclick="viewOldLecture('${doc.id}')">📄 ${doc.data().title}</li>
    `).join('');
}

async function loadAdminStats() {
    const snapshot = await db.collection('users').get();
    document.getElementById('users-count').innerText = `عدد الطلاب المسجلين حالياً: ${snapshot.size}`;
}

// نظام التبويبات (Tabs)
window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-pane').forEach(tp => tp.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(tb => tb.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
};

// تشغيل المود الليلي
document.getElementById('theme-toggle').onclick = () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('theme-toggle').innerText = isDark ? '☀️' : '🌙';
};
