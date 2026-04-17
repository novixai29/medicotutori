import { GoogleGenerativeAI } from "@google/generative-ai";

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

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const ADMIN_EMAIL = "musen.almajidi.alallaf@gmail.com";

// 2. إعداد Gemini API باستخدام المفتاح الذي أرسلته
const GEN_AI_KEY = "AQ.Ab8RN6JqqfprCS0UwSvRNckttAJxQuhm06huJMMqabVxnTiw5w"; 
const genAI = new GoogleGenerativeAI(GEN_AI_KEY);

// 3. قائمة الأذكار الإسلامية المرافقة للرفع
const dhikrs = [
    "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
    "اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي ، وَعَلِّمْنِي مَا يَنْفَعُنِي",
    "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    "رَبِّ زِدْنِي عِلْمًا ، وَارْزُقْنِي فَهْمًا",
    "اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا"
];

// --- نظام تسجيل الدخول (استخدام التحويل لضمان التوافق مع المتصفحات) ---
const loginBtn = document.getElementById('login-btn');

if (loginBtn) {
    loginBtn.onclick = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithRedirect(provider);
    };
}

// مراقبة حالة المستخدم بعد تسجيل الدخول
auth.onAuthStateChanged(async (user) => {
    if (user) {
        document.getElementById('auth-overlay').style.display = 'none';
        
        // تسجيل بيانات الطالب في قاعدة البيانات (صدقة جارية)
        await db.collection('users').doc(user.uid).set({
            name: user.displayName,
            email: user.email,
            lastLogin: Date.now()
        }, { merge: true });

        // تفعيل لوحة الإدارة لإيميل الدكتور محسن فقط
        if (user.email === ADMIN_EMAIL) {
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) adminPanel.style.display = 'block';
        }
    } else {
        document.getElementById('auth-overlay').style.display = 'flex';
    }
});

// --- معالجة المحاضرة الطبية عبر الذكاء الاصطناعي ---
const fileInput = document.getElementById('fileInput');

if (fileInput) {
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // إظهار واجهة التحميل والأذكار
        document.getElementById('loading-area').style.display = 'block';
        document.getElementById('main-content').style.display = 'none';
        
        let dhikrIdx = 0;
        const dhikrInterval = setInterval(() => {
            document.getElementById('dhikr-text').innerText = dhikrs[dhikrIdx];
            dhikrIdx = (dhikrIdx + 1) % dhikrs.length;
        }, 4500);

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const reader = new FileReader();
            
            reader.onloadend = async () => {
                const base64Data = reader.result.split(',')[1];
                
                // البرومبت الطبي الاحترافي بلهجة صديق
                const prompt = `
                أنت دكتور طبي تشرح لصديقك الطالب بأسلوب "صديق لصديقه".
                حلل واشرح الملف المرفق مع الالتزام بالآتي:
                1. ابدأ بفقرة تذكير بالموضوع السابق (7-10 أسطر).
                2. قسم الشرح لفقرات ملونة ومنظمة.
                3. اذكر الأسماء التجارية للأدوية المشهورة في الصيدليات العراقية.
                4. اشرح الفحوصات الطبية وكيفية إجرائها بوضوح.
                5. استخرج المصطلحات الصعبة في تبويب منفصل.
                6. أنشئ 5 أسئلة MCQ صعبة جداً بنمط Case Scenario.
                اللغة: عربية فصحى بسيطة بلمسة عراقية ودية.
                `;

                const result = await model.generateContent([
                    prompt, 
                    { inlineData: { data: base64Data, mimeType: file.type } }
                ]);
                
                const fullResponse = result.response.text();
                displayMedicalContent(fullResponse);
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error(error);
            alert("حدث خطأ دكتور، يرجى التأكد من اتصال الإنترنت أو مفتاح الـ API.");
        } finally {
            clearInterval(dhikrInterval);
            document.getElementById('loading-area').style.display = 'none';
        }
    };
}

function displayMedicalContent(text) {
    const mainContent = document.getElementById('main-content');
    const dynamicContent = document.getElementById('dynamic-content');
    
    mainContent.style.display = 'block';
    
    // تقسيم النص لتلوين الفقرات بشكل جذاب
    const sections = text.split('###');
    dynamicContent.innerHTML = sections.map((s, i) => `
        <div class="explanation-block block-${i % 3}">
            ${marked.parse(s)}
        </div>
    `).join('');
}

// نظام التبويبات (Tabs)
window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`${tabId}-tab`).classList.add('active');
    event.target.classList.add('active');
};
