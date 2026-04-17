// حالة المستخدم (مبنية على ملف useUserStore.ts الذي أرسلته)
let userStats = JSON.parse(localStorage.getItem('med_student_stats')) || {
    totalQuizzes: 0,
    averageScore: 0,
    level: 'Beginner',
    pastLectures: [],
    dialect: 'Iraqi'
};

// تحديث الواجهة عند البداية
function init() {
    updateUI();
    setupUploader();
}

function updateUI() {
    document.getElementById('avg-score').innerText = `${Math.round(userStats.averageScore)}%`;
    document.getElementById('total-quizzes').innerText = userStats.totalQuizzes;
    document.getElementById('current-dialect').innerText = userStats.dialect === 'Iraqi' ? 'العراقية' : 'المصلاوية';
    document.getElementById('user-level').innerText = userStats.level === 'Beginner' ? 'مبتدئ' : 'متقدم';
    
    const list = document.getElementById('lecture-list');
    if (userStats.pastLectures.length > 0) {
        list.innerHTML = userStats.pastLectures.map(l => `<li>✅ ${l.title}</li>`).join('');
    }
}

function setupUploader() {
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFileUpload(file);
    });
}

function handleFileUpload(file) {
    // محاكاة معالجة الملف
    document.getElementById('uploader-section').style.display = 'none';
    document.getElementById('interaction-section').style.display = 'block';
    
    addMessage('bot', `أهلاً دكتور، قمت بتحليل ملف "${file.name}". شتريد أشرحلك منه بلهجتنا؟`);
    
    // حفظ في السجل
    userStats.pastLectures.unshift({ title: file.name, date: Date.now() });
    saveData();
}

function addMessage(sender, text) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerText = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function askGemini() {
    const input = document.getElementById('userQuery');
    const query = input.value.trim();
    if (!query) return;

    addMessage('user', query);
    input.value = '';

    // هنا يتم الاتصال بـ API في المستقبل، حالياً محاكاة:
    setTimeout(() => {
        addMessage('bot', "هذا الجزء من المحاضرة جداً مهم، ويتلخص بـ...");
    }, 1000);
}

function resetUploader() {
    document.getElementById('uploader-section').style.display = 'block';
    document.getElementById('interaction-section').style.display = 'none';
}

function saveData() {
    localStorage.setItem('med_student_stats', JSON.stringify(userStats));
    updateUI();
}

init();
