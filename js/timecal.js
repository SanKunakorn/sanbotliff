
// Global state
let timeOffset = 0;
const defaultConfig = {
    app_title: 'CCTV Time Calculator',
    app_subtitle: 'คำนวณและแปลงเวลาระหว่างกล้องวงจรปิดกับเวลาจริง'
};

// Initialize SDKs
async function initApp() {
    if (window.elementSdk) {
        window.elementSdk.init({
            defaultConfig,
            onConfigChange: async (config) => {
                document.getElementById('app-title').innerHTML = `<span class="text-3xl">⏱️</span> ${config.app_title || defaultConfig.app_title}`;
                document.getElementById('app-subtitle').textContent = config.app_subtitle || defaultConfig.app_subtitle;
            },
            mapToCapabilities: (config) => ({
                recolorables: [],
                borderables: [],
                fontEditable: undefined,
                fontSizeable: undefined
            }),
            mapToEditPanelValues: (config) => new Map([
                ['app_title', config.app_title || defaultConfig.app_title],
                ['app_subtitle', config.app_subtitle || defaultConfig.app_subtitle]
            ])
        });
    }

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('cctvDate').value = today;
    document.getElementById('realDate').value = today;
    document.getElementById('convertDate').value = today;

    // Set up form listeners
    document.getElementById('calculator-form').addEventListener('submit', (e) => {
        e.preventDefault();
        calculateOffset();
    });
}

// Live clock
window.updateLiveClock = function () {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH', { hour12: false });
    const dateStr = now.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const clockEl = document.getElementById('live-clock');
    const dateEl = document.getElementById('live-date');

    if (clockEl && dateEl) {
        clockEl.textContent = timeStr;
        dateEl.textContent = dateStr;
    }
}

// Toast notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

    toast.className = `toast ${bgColor} px-4 py-3 rounded-xl text-white font-medium shadow-lg flex items-center gap-2`;
    toast.innerHTML = `<span>${icon}</span> ${message}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Capture current time
function captureCurrentTime() {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    const dateStr = now.toISOString().split('T')[0];

    document.getElementById('realTime').value = timeStr;
    document.getElementById('realDate').value = dateStr;

    showToast('จับเวลาปัจจุบันแล้ว', 'info');
}

// Calculate offset
function calculateOffset() {
    const cctvDate = document.getElementById('cctvDate').value;
    const cctvTime = document.getElementById('cctvTime').value;
    const realDate = document.getElementById('realDate').value;
    const realTime = document.getElementById('realTime').value;

    if (!cctvDate || !cctvTime || !realDate || !realTime) {
        showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
        return;
    }

    const cctvDateTime = new Date(`${cctvDate}T${cctvTime}`);
    const realDateTime = new Date(`${realDate}T${realTime}`);

    timeOffset = Math.floor((realDateTime - cctvDateTime) / 1000);

    const offsetDays = Math.floor(Math.abs(timeOffset) / 86400);
    const remainingSeconds = Math.abs(timeOffset) % 86400;
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    document.getElementById('offset-days').textContent = `${offsetDays} วัน`;
    document.getElementById('offset-time').textContent = timeStr;

    const totalEl = document.getElementById('offset-total');
    const sign = timeOffset >= 0 ? '+' : '';
    totalEl.textContent = `${sign}${timeOffset.toLocaleString()} วินาที`;

    if (timeOffset > 0) {
        totalEl.className = 'mono text-lg font-semibold result-positive';
        document.getElementById('offset-description').textContent = '🔴 กล้องช้ากว่าเวลาจริง (ต้องบวก Offset)';
    } else if (timeOffset < 0) {
        totalEl.className = 'mono text-lg font-semibold result-negative';
        document.getElementById('offset-description').textContent = '🟢 กล้องเร็วกว่าเวลาจริง (ต้องลบ Offset)';
    } else {
        totalEl.className = 'mono text-lg font-semibold result-neutral';
        document.getElementById('offset-description').textContent = '🟡 กล้องตรงกับเวลาจริง';
    }

    document.getElementById('offsetResult').classList.remove('hidden');
    showToast('คำนวณความต่างเวลาเรียบร้อยแล้ว', 'success');
}

// Update conversion
function updateConversion() {
    const convertDate = document.getElementById('convertDate').value;
    const convertTime = document.getElementById('convertTime').value;
    const convertType = document.getElementById('convertType').value;
    const resultDiv = document.getElementById('convertResult');
    const copyBtn = document.getElementById('copy-btn');

    if (!convertDate || !convertTime || !convertType) {
        resultDiv.classList.add('hidden');
        copyBtn.classList.add('hidden');
        return;
    }

    const dateTime = new Date(`${convertDate}T${convertTime}`);
    const resultDateTime = new Date(
        dateTime.getTime() + (convertType === 'toReal' ? timeOffset : -timeOffset) * 1000
    );

    const resultDateStr = formatDate(resultDateTime.toISOString().split('T')[0]);
    const resultTimeStr = resultDateTime.toTimeString().slice(0, 8);

    document.getElementById('result-date').textContent = resultDateStr;
    document.getElementById('result-time').textContent = resultTimeStr;

    resultDiv.classList.remove('hidden');
    copyBtn.classList.remove('hidden');
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '--/--/----';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Copy result
function copyResult() {
    const date = document.getElementById('result-date').textContent;
    const time = document.getElementById('result-time').textContent;
    const text = `${date} ${time}`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('คัดลอกผลลัพธ์แล้ว', 'success');
    }).catch(() => {
        showToast('ไม่สามารถคัดลอกได้', 'error');
    });
}

// Reset calculator
function resetCalculator() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('cctvDate').value = today;
    document.getElementById('realDate').value = today;
    document.getElementById('cctvTime').value = '';
    document.getElementById('realTime').value = '';
    document.getElementById('offsetResult').classList.add('hidden');
}

// Reset converter
function resetConverter() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('convertDate').value = today;
    document.getElementById('convertTime').value = '';
    document.getElementById('convertType').value = '';
    document.getElementById('convertResult').classList.add('hidden');
    document.getElementById('copy-btn').classList.add('hidden');
}

function startClock() {
    updateLiveClock();
    setInterval(updateLiveClock, 1000);
}

// Initialize
initApp();
startClock();



//(function () { function c() { var b = a.contentDocument || a.contentWindow.document; if (b) { var d = b.createElement('script'); d.innerHTML = "window.__CF$cv$params={r:'9cf5fa64914e70b5',t:'MTc3MTMzODU3OC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);"; b.getElementsByTagName('head')[0].appendChild(d) } } if (document.body) { var a = document.createElement('iframe'); a.height = 1; a.width = 1; a.style.position = 'absolute'; a.style.top = 0; a.style.left = 0; a.style.border = 'none'; a.style.visibility = 'hidden'; document.body.appendChild(a); if ('loading' !== document.readyState) c(); else if (window.addEventListener) document.addEventListener('DOMContentLoaded', c); else { var e = document.onreadystatechange || function () { }; document.onreadystatechange = function (b) { e(b); 'loading' !== document.readyState && (document.onreadystatechange = e, c()) } } } })();