


// --- Global State & Configuration ---
let timeOffset = 0;
let timelineData = [];
let swRunning = false, swStart = 0, swElapsed = 0, swInterval = null, swLaps = [];
let cdInterval = null, cdEndTime = 0;

const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

const cities = [
    { name: 'กรุงเทพฯ', nameEn: 'Bangkok', flag: '🇹🇭', tz: 'Asia/Bangkok' },
    { name: 'กัวลาลัมเปอร์', nameEn: 'Kuala Lumpur', flag: '🇲🇾', tz: 'Asia/Kuala_Lumpur' },
    { name: 'สิงคโปร์', nameEn: 'Singapore', flag: '🇸🇬', tz: 'Asia/Singapore' },
    { name: 'จาการ์ตา', nameEn: 'Jakarta', flag: '🇮🇩', tz: 'Asia/Jakarta' },
    { name: 'โตเกียว', nameEn: 'Tokyo', flag: '🇯🇵', tz: 'Asia/Tokyo' },
    { name: 'เซี่ยงไฮ้', nameEn: 'Shanghai', flag: '🇨🇳', tz: 'Asia/Shanghai' },
    { name: 'ฮ่องกง', nameEn: 'Hong Kong', flag: '🇭🇰', tz: 'Asia/Hong_Kong' },
    { name: 'นิวยอร์ก', nameEn: 'New York', flag: '🇺🇸', tz: 'America/New_York' },
    { name: 'ลอนดอน', nameEn: 'London', flag: '🇬🇧', tz: 'Europe/London' },
    { name: 'เยอรมนี', nameEn: 'Frankfurt', flag: '🇩🇪', tz: 'Europe/Berlin' },
    { name: 'UTC', nameEn: 'UTC', flag: '🌐', tz: 'UTC' }
];

const defaultConfig = {
    app_title: 'CCTV Time Calculator',
    app_subtitle: 'เครื่องมือสืบสวนและคำนวณเวลาแบบครบวงจร'
};

// --- Initialization ---
async function initApp() {
    // Setup Element SDK
    if (window.elementSdk) {
        window.elementSdk.init({
            defaultConfig,
            onConfigChange: async (config) => {
                document.getElementById('app-title').innerHTML = `<span class="text-3xl">⏱️</span> ${config.app_title || defaultConfig.app_title}`;
                document.getElementById('app-subtitle').textContent = config.app_subtitle || defaultConfig.app_subtitle;
            },
            mapToCapabilities: (config) => ({ recolorables: [], borderables: [], fontEditable: undefined, fontSizeable: undefined }),
            mapToEditPanelValues: (config) => new Map([
                ['app_title', config.app_title || defaultConfig.app_title],
                ['app_subtitle', config.app_subtitle || defaultConfig.app_subtitle]
            ])
        });
    }

    // Setup Data SDK for Timeline
    if (window.dataSdk) {
        await window.dataSdk.init({
            onDataChanged: (data) => {
                timelineData = data;
                renderTimeline();
            }
        });
    }

    // Start Clock
    updateLiveClock();
    setInterval(updateLiveClock, 1000);

    // Pre-fill Dates
    const today = new Date().toISOString().split('T')[0];
    ['cctvDate', 'realDate', 'convertDate', 'calcBaseDate', 'tl-date', 'convert-tz-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = today;
    });

    // Bind Listeners
    setupTabNavigation();
    setupTimezoneOptions();

    document.getElementById('calculator-form').addEventListener('submit', (e) => {
        e.preventDefault();
        calculateOffset();
    });

    document.getElementById('btn-sw-start').addEventListener('click', toggleStopwatch);
    document.getElementById('btn-sw-lap').addEventListener('click', recordLap);
    document.getElementById('btn-sw-reset').addEventListener('click', resetStopwatch);

    document.getElementById('btn-cd-start').addEventListener('click', startCountdown);
    document.getElementById('btn-cd-stop').addEventListener('click', stopCountdown);
}

// --- Utility Functions ---
function pad(n) { return String(n).padStart(2, '0'); }
function formatThaiDateShort(d) { return `${d.getDate()} ${thaiMonths[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`; }
function formatTime(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
function formatDateStandard(dateStr) {
    if (!dateStr) return '--/--/----';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function updateLiveClock() {
    const now = new Date();
    document.getElementById('live-clock').textContent = now.toLocaleTimeString('th-TH', { hour12: false });
    document.getElementById('live-date').textContent = now.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.className = `toast ${bgColor} px-4 py-3 rounded-xl text-white font-medium shadow-lg flex items-center gap-2`;
    toast.innerHTML = `<span>${icon}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function setNowToInputs(dateId, timeId) {
    const now = new Date();
    document.getElementById(dateId).value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    document.getElementById(timeId).value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// --- Tab Navigation ---
function setupTabNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.nav-tab').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            document.getElementById(tab.dataset.tab).style.display = 'block';
        });
    });
}

// --- Tab 1: CCTV Calculator & Converter ---
function captureCurrentTime() {
    setNowToInputs('realDate', 'realTime');
    showToast('จับเวลาปัจจุบันแล้ว', 'info');
}

function calculateOffset() {
    const cctvDate = document.getElementById('cctvDate').value;
    const cctvTime = document.getElementById('cctvTime').value;
    const realDate = document.getElementById('realDate').value;
    const realTime = document.getElementById('realTime').value;

    if (!cctvDate || !cctvTime || !realDate || !realTime) {
        showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error'); return;
    }

    const cctvDateTime = new Date(`${cctvDate}T${cctvTime}`);
    const realDateTime = new Date(`${realDate}T${realTime}`);
    timeOffset = Math.floor((realDateTime - cctvDateTime) / 1000);

    const offsetDays = Math.floor(Math.abs(timeOffset) / 86400);
    const remainingSeconds = Math.abs(timeOffset) % 86400;
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    document.getElementById('offset-days').textContent = `${offsetDays} วัน`;
    document.getElementById('offset-time').textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    const totalEl = document.getElementById('offset-total');
    totalEl.textContent = `${timeOffset >= 0 ? '+' : ''}${timeOffset.toLocaleString()} วินาที`;

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
    updateConversion(); // Update converter if it has values
    showToast('คำนวณความต่างเวลาเรียบร้อย', 'success');
}

function resetCalculator() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('cctvDate').value = today;
    document.getElementById('realDate').value = today;
    document.getElementById('cctvTime').value = '';
    document.getElementById('realTime').value = '';
    document.getElementById('offsetResult').classList.add('hidden');
    timeOffset = 0;
}

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
    const resultDateTime = new Date(dateTime.getTime() + (convertType === 'toReal' ? timeOffset : -timeOffset) * 1000);

    document.getElementById('result-date').textContent = formatDateStandard(resultDateTime.toISOString().split('T')[0]);
    document.getElementById('result-time').textContent = resultDateTime.toTimeString().slice(0, 8);

    resultDiv.classList.remove('hidden');
    copyBtn.classList.remove('hidden');
}

function resetConverter() {
    document.getElementById('convertDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('convertTime').value = '';
    document.getElementById('convertType').value = '';
    document.getElementById('convertResult').classList.add('hidden');
    document.getElementById('copy-btn').classList.add('hidden');
}

function copyResult() {
    const text = `${document.getElementById('result-date').textContent} ${document.getElementById('result-time').textContent}`;
    navigator.clipboard.writeText(text).then(() => showToast('คัดลอกผลลัพธ์แล้ว', 'success'));
}

// --- Tab 2: Time Calculator ---
function calculateTime() {
    const bd = document.getElementById('calcBaseDate').value;
    const bt = document.getElementById('calcBaseTime').value;
    if (!bd || !bt) { showToast('กรุณากรอกวันที่และเวลา', 'error'); return; }

    const op = document.getElementById('calcOperation').value;
    const totalMs = (((parseInt(document.getElementById('calcDays').value) || 0) * 86400) +
        ((parseInt(document.getElementById('calcHours').value) || 0) * 3600) +
        ((parseInt(document.getElementById('calcMinutes').value) || 0) * 60) +
        (parseInt(document.getElementById('calcSeconds').value) || 0)) * 1000;

    const resultDT = op === 'add' ? new Date(new Date(`${bd}T${bt}`).getTime() + totalMs) : new Date(new Date(`${bd}T${bt}`).getTime() - totalMs);

    document.getElementById('calc-result-time').textContent = formatTime(resultDT);
    document.getElementById('calc-result-date').textContent = formatThaiDateShort(resultDT);
    document.getElementById('calcResult').classList.remove('hidden');
    showToast('คำนวณเรียบร้อย', 'success');
}

function setCalcNow() { setNowToInputs('calcBaseDate', 'calcBaseTime'); }
function resetCalcForm() {
    document.getElementById('calcBaseDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('calcBaseTime').value = '';
    ['calcDays', 'calcHours', 'calcMinutes', 'calcSeconds'].forEach(id => document.getElementById(id).value = '0');
    document.getElementById('calcResult').classList.add('hidden');
}

// --- Tab 3: Stopwatch ---
function formatSW(ms) {
    const h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1e3), ml = ms % 1e3;
    return `${pad(h)}:${pad(m)}:${pad(s)}<span class="stopwatch-ms">.${String(ml).padStart(3, '0')}</span>`;
}

function updateSW() { document.getElementById('stopwatch-display').innerHTML = formatSW(swElapsed + (Date.now() - swStart)); }

function toggleStopwatch() {
    const btn = document.getElementById('btn-sw-start');
    if (!swRunning) {
        swRunning = true; swStart = Date.now(); swInterval = setInterval(updateSW, 50);
        btn.textContent = '⏸ หยุด';
        btn.className = 'btn-secondary px-8 py-3 rounded-xl text-white font-medium flex items-center gap-2';
        document.getElementById('btn-sw-lap').disabled = false;
    } else {
        swRunning = false; swElapsed += Date.now() - swStart; clearInterval(swInterval);
        btn.textContent = '▶ เริ่ม';
        btn.className = 'btn-primary px-8 py-3 rounded-xl text-white font-medium flex items-center gap-2';
        document.getElementById('btn-sw-lap').disabled = true;
        updateSW();
    }
}

function recordLap() {
    if (!swRunning) return;
    const total = swElapsed + (Date.now() - swStart);
    const prevTotal = swLaps.length > 0 ? swLaps[swLaps.length - 1].total : 0;
    swLaps.push({ total, diff: total - prevTotal });
    renderLaps();
}

function resetStopwatch() {
    swRunning = false; swElapsed = 0; swLaps = []; clearInterval(swInterval);
    document.getElementById('stopwatch-display').innerHTML = formatSW(0);
    document.getElementById('btn-sw-start').textContent = '▶ เริ่ม';
    document.getElementById('btn-sw-start').className = 'btn-primary px-8 py-3 rounded-xl text-white font-medium flex items-center gap-2';
    document.getElementById('btn-sw-lap').disabled = true;
    document.getElementById('lap-list').innerHTML = '';
}

function renderLaps() {
    const list = document.getElementById('lap-list'); list.innerHTML = '';
    swLaps.slice().reverse().forEach((lap, i) => {
        const div = document.createElement('div'); div.className = 'lap-item';
        const dH = Math.floor(lap.diff / 36e5), dM = Math.floor((lap.diff % 36e5) / 6e4), dS = Math.floor((lap.diff % 6e4) / 1e3), dMs = lap.diff % 1e3;
        const tH = Math.floor(lap.total / 36e5), tM = Math.floor((lap.total % 36e5) / 6e4), tS = Math.floor((lap.total % 6e4) / 1e3), tMs = lap.total % 1e3;
        div.innerHTML = `<span class="lap-num">รอบ ${swLaps.length - i}</span><span class="lap-diff">+${pad(dH)}:${pad(dM)}:${pad(dS)}.${String(dMs).padStart(3, '0')}</span><span class="lap-time">${pad(tH)}:${pad(tM)}:${pad(tS)}.${String(tMs).padStart(3, '0')}</span>`;
        list.appendChild(div);
    });
}

// --- Tab 4: Countdown ---
function startCountdown() {
    const totalMs = (((parseInt(document.getElementById('cd-days').value) || 0) * 86400) +
        ((parseInt(document.getElementById('cd-hours').value) || 0) * 3600) +
        ((parseInt(document.getElementById('cd-minutes').value) || 0) * 60) +
        (parseInt(document.getElementById('cd-seconds').value) || 0)) * 1000;
    if (totalMs <= 0) { showToast('กรุณาระบุเวลา', 'error'); return; }

    cdEndTime = Date.now() + totalMs;
    document.getElementById('btn-cd-start').disabled = true;
    document.getElementById('btn-cd-stop').disabled = false;
    document.getElementById('countdown-display').classList.remove('expired');

    cdInterval = setInterval(() => {
        const rem = cdEndTime - Date.now();
        if (rem <= 0) {
            clearInterval(cdInterval);
            document.getElementById('countdown-display').innerHTML = '00:00:00 <br><span class="text-2xl mt-2 block text-red-400 font-prompt">หมดเวลา!</span>';
            document.getElementById('countdown-display').classList.add('expired');
            document.getElementById('btn-cd-start').disabled = false;
            document.getElementById('btn-cd-stop').disabled = true;
            showToast('นับถอยหลังจบแล้ว!', 'success');
            return;
        }
        const rd = Math.floor(rem / 864e5), rh = Math.floor(rem / 36e5), rm = Math.floor((rem % 36e5) / 6e4), rs = Math.floor((rem % 6e4) / 1e3);
        document.getElementById('countdown-display').textContent = rd > 0 ? `${rd} วัน ${pad(rh % 24)}:${pad(rm)}:${pad(rs)}` : `${pad(rh)}:${pad(rm)}:${pad(rs)}`;
    }, 200);
}

function stopCountdown() {
    clearInterval(cdInterval);
    document.getElementById('btn-cd-start').disabled = false;
    document.getElementById('btn-cd-stop').disabled = true;
    document.getElementById('countdown-display').classList.remove('expired');
}

// --- Tab 5: Timeline ---
async function addTimelineItem() {
    const d = document.getElementById('tl-date').value, t = document.getElementById('tl-time').value, desc = document.getElementById('tl-desc').value.trim();
    if (!d || !t || !desc) { showToast('กรุณากรอกข้อมูลให้ครบ', 'error'); return; }
    if (window.dataSdk) {
        if ((await window.dataSdk.create({ id: Date.now().toString(), date: d, time: t, desc: desc })).isOk) {
            document.getElementById('tl-desc').value = '';
            showToast('เพิ่มเหตุการณ์เรียบร้อย', 'success');
        } else showToast('ไม่สามารถเพิ่มเหตุการณ์ได้', 'error');
    }
}

function setTimelineNow() { setNowToInputs('tl-date', 'tl-time'); }

function renderTimeline() {
    const list = document.getElementById('timeline-list'), copyBtn = document.getElementById('btn-tl-copy'), clearBtn = document.getElementById('btn-tl-clear');
    list.innerHTML = '';
    if (timelineData.length === 0) { copyBtn.style.display = 'none'; clearBtn.style.display = 'none'; return; }
    copyBtn.style.display = 'inline-block'; clearBtn.style.display = 'inline-block';

    [...timelineData].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)).forEach(item => {
        const dt = new Date(`${item.date}T${item.time}`), div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `<div><div class="timeline-time">${formatTime(dt)}</div><div class="timeline-date">${formatDateStandard(dt.toISOString().split('T')[0])}</div></div><div class="timeline-desc">${item.desc.replace(/</g, '&lt;')}</div><div class="timeline-actions"><button type="button" title="ลบ" onclick="deleteTimelineItem('${item.__backendId}')">🗑</button></div>`;
        list.appendChild(div);
    });
}

async function deleteTimelineItem(id) {
    const item = timelineData.find(x => x.__backendId === id);
    if (item && window.dataSdk && (await window.dataSdk.delete(item)).isOk) showToast('ลบเหตุการณ์เรียบร้อย', 'success');
}

async function clearAllTimeline() {
    if (!confirm('ต้องการล้าง Timeline ทั้งหมดหรือไม่?')) return;
    if (window.dataSdk) {
        for (const item of timelineData) await window.dataSdk.delete(item);
        showToast('ล้าง Timeline เรียบร้อย', 'success');
    }
}

function copyTimeline() {
    const text = [...timelineData].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
        .map(e => `${formatTime(new Date(`${e.date}T${e.time}`))} ${formatDateStandard(e.date)} — ${e.desc}`).join('\n');
    navigator.clipboard.writeText(text).then(() => showToast('คัดลอก Timeline แล้ว', 'success'));
}

// --- Tab 6: Time Zone Converter ---
function setupTimezoneOptions() {
    const select = document.getElementById('convert-tz-from');
    cities.forEach(city => {
        const opt = document.createElement('option');
        opt.value = city.tz; opt.textContent = `${city.flag} ${city.name}`;
        if (city.tz === 'Asia/Bangkok') opt.selected = true;
        select.appendChild(opt);
    });
}

function convertTimezone() {
    const dv = document.getElementById('convert-tz-date').value, tv = document.getElementById('convert-tz-time').value, fromTZ = document.getElementById('convert-tz-from').value;
    if (!dv || !tv) { showToast('กรุณาระบุวันที่และเวลา', 'error'); return; }

    const dts = `${dv}T${tv}`;
    const srcUTC = new Date(new Date(dts).toLocaleString('en-US', { timeZone: 'UTC' }));
    const srcLocal = new Date(new Date(dts).toLocaleString('en-US', { timeZone: fromTZ }));
    const utcTs = new Date(dts).getTime() - (srcLocal.getTime() - srcUTC.getTime());

    const grid = document.getElementById('result-grid'); grid.innerHTML = '';
    cities.forEach(city => {
        const conv = new Date(new Date(utcTs).toLocaleString('en-US', { timeZone: city.tz }));
        const item = document.createElement('div'); item.className = 'result-item';
        item.innerHTML = `<div class="city">${city.flag} ${city.name}</div><div class="time">${formatTime(conv)}</div><div class="date">${formatDateStandard(conv.toISOString().split('T')[0])}</div>`;
        grid.appendChild(item);
    });
    document.getElementById('convert-tz-result').classList.remove('hidden');
    showToast('แปลงเวลาเรียบร้อย', 'success');
}

// Init
window.addEventListener('DOMContentLoaded', initApp);


// Initialize
initApp();
startClock();

