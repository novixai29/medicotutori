// Firebase
const firebaseConfig = {
  apiKey: "PUT_FIREBASE_KEY",
  authDomain: "medical-novix.firebaseapp.com",
  projectId: "medical-novix"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const API_URL = "http://localhost:3000";

let lastLecture = "";

// تسجيل الدخول
document.getElementById('login-btn').onclick = ()=>{
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
};

// 🔥 منع استخدام الموقع بدون تسجيل
auth.onAuthStateChanged(user => {
    const overlay = document.getElementById('auth-overlay');
    const app = document.querySelector('.container');

    if (user) {
        overlay.style.display = 'none';
        app.style.display = 'block';
    } else {
        overlay.style.display = 'flex';
        app.style.display = 'none';
    }
});

// 🕌 الأذكار
const adhkar = [
"سبحان الله",
"الحمد لله",
"الله أكبر",
"لا إله إلا الله",
"استغفر الله",
"لا حول ولا قوة إلا بالله"
];

let dhikrInterval;

function startDhikr(){
    const el = document.getElementById("dhikr-text");

    dhikrInterval = setInterval(()=>{
        el.innerText = adhkar[Math.floor(Math.random()*adhkar.length)];
    },2000);
}

function stopDhikr(){
    clearInterval(dhikrInterval);
}

// رفع الملف
document.getElementById('fileInput').onchange = handleFile;

async function handleFile(e){
    const file = e.target.files[0];
    if(!file) return;

    document.getElementById('loading-area').style.display='block';
    document.getElementById('main-content').style.display='none';

    startDhikr(); // 🔥 تشغيل الأذكار

    const base64 = await toBase64(file);

    try{
        const res = await fetch(API_URL+"/analyze",{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ base64, type:file.type })
        });

        const data = await res.json();

        const text = data.text || "";
        lastLecture = text;

        const sections = text.includes("###") ? text.split("###") : [text];

        document.getElementById('dynamic-tab').innerHTML = marked.parse(sections[0]||"");
        document.getElementById('terms-tab').innerHTML = marked.parse(sections[1]||"");
        document.getElementById('quiz-tab').innerHTML = marked.parse(sections[2]||"");

        document.getElementById('main-content').style.display='block';

        // حفظ في Firestore
        const user = auth.currentUser;
        if(user){
            await db.collection("lectures").add({
                uid:user.uid,
                text,
                created:new Date()
            });
        }

    }catch(err){
        alert("خطأ في التحليل");
        console.error(err);
    }

    stopDhikr(); // 🔥 إيقاف الأذكار
    document.getElementById('loading-area').style.display='none';
}

// Chat
async function askAI(){
    const question = document.getElementById("chatInput").value;

    const res = await fetch(API_URL+"/chat",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ question, context:lastLecture })
    });

    const data = await res.json();

    document.getElementById("chatOutput").innerHTML =
        marked.parse(data.reply);
}

// Base64
const toBase64 = f => new Promise((res,rej)=>{
    const r = new FileReader();
    r.readAsDataURL(f);
    r.onload = ()=>res(r.result.split(',')[1]);
    r.onerror = rej;
});

// PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}
