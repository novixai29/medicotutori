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

// login
document.getElementById('login-btn').onclick = ()=>{
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
};

// auth state
auth.onAuthStateChanged(async user=>{
    document.getElementById('auth-overlay').style.display = user ? 'none':'flex';

    if(user){
        const snapshot = await db.collection("lectures")
        .where("uid","==",user.uid)
        .get();

        snapshot.forEach(doc=>{
            console.log("محفوظ:", doc.data());
        });
    }
});

// file upload
document.getElementById('fileInput').onchange = handleFile;

async function handleFile(e){
    const file = e.target.files[0];
    if(!file) return;

    document.getElementById('loading-area').style.display='block';

    const base64 = await toBase64(file);

    const res = await fetch(API_URL+"/analyze",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ base64, type:file.type })
    });

    const data = await res.json();

    const text = data.text || "";
    lastLecture = text;

    const sections = text.split("###");

    document.getElementById('dynamic-tab').innerHTML = marked.parse(sections[0]||"");
    document.getElementById('terms-tab').innerHTML = marked.parse(sections[1]||"");
    document.getElementById('quiz-tab').innerHTML = marked.parse(sections[2]||"");

    document.getElementById('main-content').style.display='block';
    document.getElementById('loading-area').style.display='none';

    const user = auth.currentUser;

    if(user){
        await db.collection("lectures").add({
            uid:user.uid,
            text,
            created:new Date()
        });
    }
}

// chat
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

// base64
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
