// 🌙 Dark Mode
darkModeToggle.onclick = () => {
  document.body.classList.toggle("dark");
};

// Firebase
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Login
loginBtn.onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
};

auth.onAuthStateChanged(user => {
  if(user) userInfo.innerText = user.email;
});

// Tabs
function showTab(tab){
  document.querySelectorAll(".tabContent").forEach(e=>e.classList.add("hidden"));
  document.getElementById(tab).classList.remove("hidden");
}

// Upload + AI
uploadBtn.onclick = async () => {
  const file = fileInput.files[0];
  if(!file) return alert("اختر ملف");

  loading.classList.remove("hidden");

  const text = await file.text();

  const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer YOUR_API_KEY"
    },
    body: JSON.stringify({
      model:"gpt-4o-mini",
      messages:[
        {
          role:"system",
          content:"اشرح محاضرة طبية بالتفصيل مع تقسيم: تذكير، شرح، ادوية، فحوصات، مصطلحات، MCQ"
        },
        {
          role:"user",
          content:text
        }
      ]
    })
  });

  const data = await aiResponse.json();
  const output = data.choices[0].message.content;

  displayResult(output);

  loading.classList.add("hidden");
};

// عرض النتائج
function displayResult(text){
  tabs.classList.remove("hidden");

  explain.innerHTML = text;
  terms.innerHTML = "يتم استخراج المصطلحات هنا...";
  mcq.innerHTML = "أسئلة MCQ تظهر هنا...";
}
