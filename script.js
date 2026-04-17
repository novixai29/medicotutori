// الإعدادات الافتراضية المأخوذة من ملفك الأصلي
const DEFAULT_STATS = {
    totalQuizzes: 0,
    averageScore: 0,
    level: 'Beginner',
    pastLectures: [],
    dialect: 'Iraqi',
    freeUploadsUsed: 0
};

let stats = JSON.parse(localStorage.getItem('med_student_stats')) || DEFAULT_STATS;

// وظيفة تحديث الواجهة
function updateUI() {
    document.getElementById('avg-score').innerText = `${Math.round(stats.averageScore)}%`;
    document.getElementById('total-quizzes').innerText = stats.totalQuizzes;
    document.getElementById('current-dialect').innerText = stats.dialect === 'Moslawi' ? 'المصلاوية' : 'العراقية';
    document.getElementById('user-level').innerText = stats.level === 'Beginner' ? 'مبتدئ' : 'متقدم';
    
    const list = document.getElementById('lecture-list');
    list.innerHTML = stats.pastLectures.map(l => `<li>${l.title} - ${new Date(l.date).toLocaleDateString('ar-IQ')}</li>`).join('');
}

// وظيفة تغيير اللهجة (مثل ما موجود بملفك)
function changeDialect(newDialect) {
    stats.dialect = newDialect;
    saveAndRefresh();
}

// وظيفة محاكاة رفع ملف
function simulateUpload() {
    const newLecture = {
        id: Date.now().toString(),
        title: "محاضرة طبية جديدة",
        date: Date.now(),
        summary: "ملخص المحاضرة..."
    };
    stats.pastLectures.unshift(newLecture);
    stats.freeUploadsUsed++;
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem('med_student_stats', JSON.stringify(stats));
    updateUI();
}

// تشغيل الواجهة عند التحميل
updateUI();
