// اعدادات Firebase (يجب جلبها من console.firebase.google.com)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const adminEmail = "musen.almajidi.alallaf@gmail.com";

// الأذكار
const adhkars = [
    "اللهم انفعنا بما علمتنا وعلمنا ما ينفعنا",
    "ربِّ زدني علماً",
    "اللهم لا سهل إلا ما جعلته سهلاً",
    "من سلك طريقاً يلتمس فيه علماً سهل الله له به طريقاً إلى الجنة"
];

// تبديل الوضع الليلي
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('#theme-toggle i');
    icon.classList.toggle('fa-sun');
});

// تسجيل الدخول
document.getElementById('login-btn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(result => {
        handleUser(result.user);
    });
});

function handleUser(user) {
    if (user) {
        document.getElementById('login-btn').classList.add('hidden');
        document.getElementById('user-info').classList.remove('hidden');
        document.getElementById('user-name').innerText = user.displayName;
        
        // خزن البيانات محلياً
        localStorage.setItem('medUser', JSON.stringify(user));

        // التحقق من الأدمن
        if (user.email === adminEmail) {
            document.getElementById('admin-panel').classList.remove('hidden');
            loadAdminData();
        }
    }
}

// محاكاة معالجة الملف والذكاء الاصطناعي
document.getElementById('process-btn').addEventListener('click', () => {
    document.getElementById('loading-area').classList.remove('hidden');
    let dhikrIdx = 0;
    
    // تغيير الأذكار كل 10 ثواني
    const dhikrInterval = setInterval(() => {
        document.getElementById('dhikr-display').innerText = adhkars[dhikrIdx % adhkars.length];
        dhikrIdx++;
    }, 5000);

    setTimeout(() => {
        clearInterval(dhikrInterval);
        document.getElementById('loading-area').classList.add('hidden');
        document.getElementById('result-area').classList.remove('hidden');
        renderMockExplanation();
    }, 5000); // محاكاة لـ 5 ثواني
});

function renderMockExplanation() {
    const expDiv = document.getElementById('main-explanation');
    const reviewDiv = document.getElementById('previous-review');
    
    reviewDiv.innerHTML = "<strong>تذكير بالمحاضرة السابقة:</strong><br>تكلمنا في المرة الماضية عن فزيولوجيا القلب وكيفية انتقال الشارة الكهربائية من الـ SA Node وصولاً للبطينات.. (تكملة 5 أسطر)";
    
    expDiv.innerHTML = `
        <div class="explanation-segment">
            <h3>1. البداية والأساسيات</h3>
            <p>يا دكتور، الموضوع بسيط.. شوف هاي الصورة تشرح لك كيف الضغط يرتفع...</p>
        </div>
        <div class="explanation-segment">
            <h3>2. الأدوية المذكورة</h3>
            <p>الدواء المذكور هو <strong>Amlodipine</strong> واسمه التجاري المشهور (Norvasc).</p>
        </div>
    `;
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}
