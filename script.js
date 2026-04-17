// إعدادات Firebase
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

// الـ API Key الخاص بك (تم التحديث)
const GEN_AI_KEY = "AQ.Ab8RN6L16z_vTgevV3WwjKyscALSUUA-Qkcc5o5ojbgqnmOcQg"; 

// --- نظام الوضع الليلي الذكي ---
function toggleDarkMode() {
    const body = document.body;
    const modeIcon = document.getElementById('mode-icon');
    const modeText = document.getElementById('mode-text');

    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        modeIcon.innerText = "🌙";
        modeText.innerText = "الوضع الليلي";
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-mode');
        modeIcon.innerText = "☀️";
        modeText.innerText = "الوضع المضيء";
        localStorage.setItem('theme', 'dark');
    }
}

// استعادة الوضع المفضل للمستخدم عند فتح الصفحة
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.remove('dark-mode');
    if(document.getElementById('mode-icon')) document.getElementById('mode-icon').innerText = "🌙";
}

// --- إدارة قائمة المستخدم ---
function toggleMenu() {
    const menu = document.getElementById('drop-menu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function switchAccount() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    auth.signInWithPopup(provider).catch(() => auth.signInWithRedirect(provider));
}

function signOut() {
    auth.signOut().then(() => location.reload());
}

// مراقبة حالة تسجيل الدخول
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('user-profile-menu').style.display = 'block';
        document.getElementById('user-initials').innerText = user.displayName ? user.displayName.charAt(0) : 'D';
        document.getElementById('user-display-name').innerText = user.email;
    } else {
        document.getElementById('auth-overlay').style.display = 'flex';
        document.getElementById('user-profile-menu').style.display = 'none';
    }
});

// تفعيل زر الدخول
document.getElementById('login-btn').onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(() => auth.signInWithRedirect(provider));
};

// --- معالجة الملفات والذكاء الاصطناعي ---
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
                    { text: "أنت بروفيسور طبي خبير. اشرح المحاضرة المرفقة بالتفصيل باللغة العربية، اذكر الأدوية المتوفرة في العراق المرتبطة بالموضوع، قائمة بالمصطلحات الطبية الهامة، ثم كويز MCQ مع الحلول. افصل الأقسام بكلمة ###" },
                    { inlineData: { data: base64, mimeType: file.type } }
                ]}]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        const text = data.candidates[0].content.parts[0].text;
        const sections = text.split('###');

        // توزيع النتائج على التبويبات
        document.getElementById('dynamic-tab').innerHTML = marked.parse(sections[0] || "لم يتم العثور على شرح.");
        document.getElementById('terms-tab').innerHTML = marked.parse(sections[1] || "لا توجد مصطلحات مستخرجة.");
        document.getElementById('quiz-tab').innerHTML = marked.parse(sections[2] || "لا يوجد اختبار متوفر.");
        
        document.getElementById('main-content').style.display = 'block';
    } catch (err) {
        console.error(err);
        alert("تنبيه: تعذر تحليل الملف. تأكد من أن الملف واضح ومن صلاحية الـ API Key.");
    } finally {
        document.getElementById('loading-area').style.display = 'none';
    }
};

// تحويل الملف إلى Base64
const toBase64 = f => new Promise((res, rej) => {
    const r = new FileReader(); r.readAsDataURL(f);
    r.onload = () => res(r.result.split(',')[1]); r.onerror = rej;
});

// التبديل بين التبويبات (Tabs)
window.switchTab = (t) => {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(t + '-tab').classList.add('active');
    event.currentTarget.classList.add('active');
};
