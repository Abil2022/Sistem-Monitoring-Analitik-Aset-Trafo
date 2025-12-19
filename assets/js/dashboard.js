// assets/js/dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

// Global variables
let analyticsData = {
    total: 0,
    normal: 0,
    medium: 0,
    high: 0,
    nodata: 0,
    ulpStats: {},
    alerts: []
};

let currentULPFilter = "all";
let statusDistributionChart = null;
let ulpDistributionChart = null;

// Initialize dashboard
function initializeDashboard() {
    setupEventListeners();
    loadData();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('ulpFilter').addEventListener('change', function() {
        currentULPFilter = this.value;
        applyFilters();
    });

    document.getElementById('retryButton').addEventListener('click', loadData);

    setTimeout(() => {
        const normalCard = document.getElementById('normalCard');
        const mediumCard = document.getElementById('mediumCard');
        const highCard = document.getElementById('highCard');
        const nodataCard = document.getElementById('nodataCard');
        
        if (normalCard) normalCard.addEventListener('click', () => redirectToMonitoring('normal'));
        if (mediumCard) mediumCard.addEventListener('click', () => redirectToMonitoring('medium'));
        if (highCard) highCard.addEventListener('click', () => redirectToMonitoring('high'));
        if (nodataCard) nodataCard.addEventListener('click', () => redirectToMonitoring('nodata'));
    }, 1000);
}

// Load data
async function loadData() {
    try {
        showLoading();
        hideContentSections();
        
        await loadBebanAll();
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadKoordinat();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setupULPFilter();
        analyzeData();
        updateUI();
        
        showContentSections();
        hideLoading();
        
    } catch (error) {
        showError(error.message);
    }
}

// Load beban data
async function loadBebanAll() {
    BEBAN_MAP = {};
    for (const ulp of ULP_CONFIG) {
        try {
            const resp = await api.gvizFetch(API_CONFIG.SPREADSHEET_PEMAKAIAN, ulp.gid);
            const rows = api.gvizToRows(resp);
            rows.forEach(row => {
                const kodeRaw = getKodeHeuristic(row);
                const kode = utils.normalizeKode(kodeRaw);
                if (!kode) return;
                let b = null;
                if (row["pemakaian (%)"] != null && String(row["pemakaian (%)"]).trim() !== "") {
                    b = utils.numComma(row["pemakaian (%)"]);
                }
                if (!isFinite(b)) return;
                BEBAN_MAP[kode] = { beban: b, ulp: ulp.name };
            });
        } catch (e) {
            console.warn(`❌ Gagal load ${ulp.name} gid=${ulp.gid}`, e);
        }
    }
}

// Load koordinat data
async function loadKoordinat() {
    try {
        const resp = await api.gvizFetch('1_VlE78JhUjRCdpoGHm31ewPpvMde8bAL3lz7-toMCYA', '2055798396');
        ALL_COORD_ROWS = api.gvizToRows(resp);
    } catch (error) {
        throw new Error('Gagal memuat data koordinat: ' + error.message);
    }
}

function getKodeHeuristic(row) {
    const KODE_KEYS = ["nama gardu", "nama_gardu", "kode gardu", "kode_gardu", "kode gardu relasi", "kode_gardu_relasi", "assetnum", "kode_peral", "nama gardu relasi", "nama_gardu_relasi"];
    for (const k of KODE_KEYS) if (row[k] != null && String(row[k]).trim() !== "") return String(row[k]).trim();
    let hit = Object.keys(row).find(h => h.includes("kode") && h.includes("gardu"));
    if (hit && row[hit]) return String(row[hit]).trim();
    hit = Object.keys(row).find(h => h.includes("relasi") && h.includes("gardu"));
    if (hit && row[hit]) return String(row[hit]).trim();
    hit = Object.keys(row).find(h => h.includes("kode"));
    if (hit && row[hit]) return String(row[hit]).trim();
    return "";
}

function setupULPFilter() {
    const ulpFilter = document.getElementById('ulpFilter');
    ulpFilter.innerHTML = '<option value="all">Semua ULP</option>';
    ULP_CONFIG.forEach(ulp => {
        const option = document.createElement('option');
        option.value = ulp.name;
        option.textContent = ulp.name;
        ulpFilter.appendChild(option);
    });
}

function analyzeData() {
    analyticsData = { total: 0, normal: 0, medium: 0, high: 0, nodata: 0, ulpStats: {}, alerts: [] };
    ULP_CONFIG.forEach(ulp => {
        analyticsData.ulpStats[ulp.name] = { total: 0, normal: 0, medium: 0, high: 0, nodata: 0 };
    });
    ALL_COORD_ROWS.forEach(row => {
        const kodeRaw = getKodeHeuristic(row);
        const kodeNorm = utils.normalizeKode(kodeRaw);
        const bebanData = BEBAN_MAP[kodeNorm];
        const beban = bebanData ? bebanData.beban : null;
        const ulp = bebanData ? bebanData.ulp : null;
        let status;
        if (!isFinite(beban)) { status = "nodata"; analyticsData.nodata++; }
        else if (beban < 40) { status = "normal"; analyticsData.normal++; }
        else if (beban >= 40 && beban <= 85) { status = "medium"; analyticsData.medium++; }
        else { status = "high"; analyticsData.high++; }
        analyticsData.total++;
        if (ulp && analyticsData.ulpStats[ulp]) {
            analyticsData.ulpStats[ulp][status]++;
            analyticsData.ulpStats[ulp].total++;
        }
    });
    generateAlerts();
    
    // PERUBAHAN: Simpan alert untuk "Semua ULP" ke localStorage
    saveAlertsToStorage();
}

function generateAlerts() {
    analyticsData.alerts = [];
    Object.entries(analyticsData.ulpStats).forEach(([ulpName, stats]) => {
        if (stats.high > 10) {
            analyticsData.alerts.push({ type: 'critical', title: 'Beban Tinggi Terdeteksi', message: `${stats.high} gardu di ${ulpName} mengalami beban di atas 85%. Perlu tindakan segera.` });
        }
    });
    Object.entries(analyticsData.ulpStats).forEach(([ulpName, stats]) => {
        const nodataPercentage = stats.total > 0 ? (stats.nodata / stats.total) * 100 : 0;
        if (nodataPercentage > 30) {
            analyticsData.alerts.push({ type: 'warning', title: 'Data Tidak Lengkap', message: `${Math.round(nodataPercentage)}% gardu di ${ulpName} tidak memiliki data beban.` });
        }
    });
    if (analyticsData.high > 50) {
        analyticsData.alerts.push({ type: 'critical', title: 'Beban Sistem Tinggi', message: `${analyticsData.high} gardu mengalami beban tinggi. Perlu evaluasi sistem distribusi.` });
    }
    if (analyticsData.alerts.length === 0) {
        analyticsData.alerts.push({ type: 'info', title: 'Sistem Berjalan Normal', message: 'Semua gardu beroperasi dalam kondisi normal.' });
    }
}

// PERUBAHAN: Fungsi baru untuk menyimpan alert ke localStorage
function saveAlertsToStorage() {
    localStorage.setItem('plnDashboardAlerts', JSON.stringify(analyticsData.alerts));
    console.log("✅ [Dashboard] Alert untuk 'Semua ULP' telah disimpan ke localStorage.");
}

function applyFilters() {
    if (currentULPFilter === "all") {
        updateUI();
        document.getElementById('filterInfo').innerHTML = 'Menampilkan data dari <strong>Semua ULP</strong>';
        // PERUBAHAN: Saat kembali ke "Semua ULP", pastikan alert global diperbarui
        saveAlertsToStorage();
    } else {
        const filteredData = { total: 0, normal: 0, medium: 0, high: 0, nodata: 0, ulpStats: {}, alerts: [] };
        filteredData.ulpStats[currentULPFilter] = { total: 0, normal: 0, medium: 0, high: 0, nodata: 0 };
        ALL_COORD_ROWS.forEach(row => {
            const kodeRaw = getKodeHeuristic(row);
            const kodeNorm = utils.normalizeKode(kodeRaw);
            const bebanData = BEBAN_MAP[kodeNorm];
            const beban = bebanData ? bebanData.beban : null;
            const ulp = bebanData ? bebanData.ulp : null;
            if (ulp !== currentULPFilter) return;
            let status;
            if (!isFinite(beban)) { status = "nodata"; filteredData.nodata++; }
            else if (beban < 40) { status = "normal"; filteredData.normal++; }
            else if (beban >= 40 && beban <= 85) { status = "medium"; filteredData.medium++; }
            else { status = "high"; filteredData.high++; }
            filteredData.total++;
            if (filteredData.ulpStats[currentULPFilter]) {
                filteredData.ulpStats[currentULPFilter][status]++;
                filteredData.ulpStats[currentULPFilter].total++;
            }
        });
        updateFilteredUI(filteredData);
        document.getElementById('filterInfo').innerHTML = `Menampilkan data dari <strong>${currentULPFilter}</strong>`;
    }
}

// ... (fungsi updateUI, updateFilteredUI, updateULPPerformanceGrid, updateAlerts, updateFilteredAlerts, updateCharts, updateFilteredCharts, redirectToMonitoring, dan fungsi helper tidak berubah) ...

function updateUI() {
    document.getElementById('totalGardu').textContent = analyticsData.total;
    document.getElementById('normalGardu').textContent = analyticsData.normal;
    document.getElementById('mediumGardu').textContent = analyticsData.medium;
    document.getElementById('highGardu').textContent = analyticsData.high;
    document.getElementById('nodataGardu').textContent = analyticsData.nodata;
    updateULPPerformanceGrid();
    updateAlerts();
    updateCharts();
}

function updateFilteredUI(filteredData) {
    document.getElementById('totalGardu').textContent = filteredData.total;
    document.getElementById('normalGardu').textContent = filteredData.normal;
    document.getElementById('mediumGardu').textContent = filteredData.medium;
    document.getElementById('highGardu').textContent = filteredData.high;
    document.getElementById('nodataGardu').textContent = filteredData.nodata;
    const ulpGrid = document.getElementById('ulpPerformanceGrid');
    ulpGrid.innerHTML = '';
    if (filteredData.ulpStats[currentULPFilter]) {
        const stats = filteredData.ulpStats[currentULPFilter];
        const normalPercentage = stats.total > 0 ? Math.round((stats.normal / stats.total) * 100) : 0;
        const ulpCard = document.createElement('div');
        ulpCard.className = 'ulp-card';
        ulpCard.innerHTML = `<div class="ulp-name">${currentULPFilter}</div><div class="ulp-stats"><div class="ulp-stat"><div class="ulp-value">${stats.total}</div><div class="ulp-label">Gardu</div></div><div class="ulp-stat"><div class="ulp-value">${normalPercentage}%</div><div class="ulp-label">Normal</div></div></div>`;
        ulpGrid.appendChild(ulpCard);
    }
    updateFilteredAlerts(filteredData);
    updateFilteredCharts(filteredData);
}

function updateULPPerformanceGrid() {
    const ulpGrid = document.getElementById('ulpPerformanceGrid');
    ulpGrid.innerHTML = '';
    Object.entries(analyticsData.ulpStats).forEach(([ulpName, stats]) => {
        const normalPercentage = stats.total > 0 ? Math.round((stats.normal / stats.total) * 100) : 0;
        const ulpCard = document.createElement('div');
        ulpCard.className = 'ulp-card';
        ulpCard.innerHTML = `<div class="ulp-name">${ulpName}</div><div class="ulp-stats"><div class="ulp-stat"><div class="ulp-value">${stats.total}</div><div class="ulp-label">Gardu</div></div><div class="ulp-stat"><div class="ulp-value">${normalPercentage}%</div><div class="ulp-label">Normal</div></div></div>`;
        ulpGrid.appendChild(ulpCard);
    });
}

function updateAlerts() {
    const alertList = document.getElementById('alertList');
    alertList.innerHTML = '';
    analyticsData.alerts.forEach(alert => {
        let iconClass = 'fas fa-info-circle'; let alertClass = 'info';
        if (alert.type === 'critical') { iconClass = 'fas fa-radiation-alt'; alertClass = ''; }
        else if (alert.type === 'warning') { iconClass = 'fas fa-exclamation-triangle'; alertClass = 'warning'; }
        const alertItem = document.createElement('div');
        alertItem.className = `alert-item ${alertClass}`;
        alertItem.innerHTML = `<div class="alert-icon ${alert.type}"><i class="${iconClass}"></i></div><div class="alert-content"><h4>${alert.title}</h4><p>${alert.message}</p></div>`;
        alertList.appendChild(alertItem);
    });
}

function updateFilteredAlerts(filteredData) {
    const alertList = document.getElementById('alertList');
    alertList.innerHTML = '';
    const filteredAlerts = [];
    if (filteredData.high > 10) { filteredAlerts.push({ type: 'critical', title: 'Beban Tinggi Terdeteksi', message: `${filteredData.high} gardu di ${currentULPFilter} mengalami beban di atas 85%. Perlu tindakan segera.` }); }
    const nodataPercentage = filteredData.total > 0 ? (filteredData.nodata / filteredData.total) * 100 : 0;
    if (nodataPercentage > 30) { filteredAlerts.push({ type: 'warning', title: 'Data Tidak Lengkap', message: `${Math.round(nodataPercentage)}% gardu di ${currentULPFilter} tidak memiliki data beban.` }); }
    if (filteredAlerts.length === 0) { filteredAlerts.push({ type: 'info', title: 'ULP Berjalan Normal', message: `Semua gardu di ${currentULPFilter} beroperasi dalam kondisi normal.` }); }
    filteredAlerts.forEach(alert => {
        let iconClass = 'fas fa-info-circle'; let alertClass = 'info';
        if (alert.type === 'critical') { iconClass = 'fas fa-radiation-alt'; alertClass = ''; }
        else if (alert.type === 'warning') { iconClass = 'fas fa-exclamation-triangle'; alertClass = 'warning'; }
        const alertItem = document.createElement('div');
        alertItem.className = `alert-item ${alertClass}`;
        alertItem.innerHTML = `<div class="alert-icon ${alert.type}"><i class="${iconClass}"></i></div><div class="alert-content"><h4>${alert.title}</h4><p>${alert.message}</p></div>`;
        alertList.appendChild(alertItem);
    });
}

function updateCharts() {
    const statusDistributionCtx = document.getElementById('statusDistributionChart').getContext('2d');
    if (statusDistributionChart) statusDistributionChart.destroy();
    statusDistributionChart = new Chart(statusDistributionCtx, {
        type: 'doughnut', data: { labels: ['Normal', 'Sedang', 'Tinggi', 'Tidak Ada Data'], datasets: [{ data: [analyticsData.normal, analyticsData.medium, analyticsData.high, analyticsData.nodata], backgroundColor: ['#28a745', '#ffd700', '#dc3545', '#6c757d'], borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
    const ulpDistributionCtx = document.getElementById('ulpDistributionChart').getContext('2d');
    if (ulpDistributionChart) ulpDistributionChart.destroy();
    const ulpNames = Object.keys(analyticsData.ulpStats);
    const ulpNormalData = ulpNames.map(ulp => analyticsData.ulpStats[ulp].normal);
    const ulpMediumData = ulpNames.map(ulp => analyticsData.ulpStats[ulp].medium);
    const ulpHighData = ulpNames.map(ulp => analyticsData.ulpStats[ulp].high);
    ulpDistributionChart = new Chart(ulpDistributionCtx, {
        type: 'bar', data: { labels: ulpNames, datasets: [{ label: 'Normal', data: ulpNormalData, backgroundColor: '#28a745' }, { label: 'Sedang', data: ulpMediumData, backgroundColor: '#ffd700' }, { label: 'Tinggi', data: ulpHighData, backgroundColor: '#dc3545' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Jumlah Gardu' } } } }
    });
}

function updateFilteredCharts(filteredData) {
    const statusDistributionCtx = document.getElementById('statusDistributionChart').getContext('2d');
    if (statusDistributionChart) statusDistributionChart.destroy();
    statusDistributionChart = new Chart(statusDistributionCtx, {
        type: 'doughnut', data: { labels: ['Normal', 'Sedang', 'Tinggi', 'Tidak Ada Data'], datasets: [{ data: [filteredData.normal, filteredData.medium, filteredData.high, filteredData.nodata], backgroundColor: ['#28a745', '#ffd700', '#dc3545', '#6c757d'], borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, title: { display: true, text: `Status Beban - ${currentULPFilter}` } } }
    });
    const ulpDistributionCtx = document.getElementById('ulpDistributionChart').getContext('2d');
    if (ulpDistributionChart) ulpDistributionChart.destroy();
    ulpDistributionChart = new Chart(ulpDistributionCtx, {
        type: 'bar', data: { labels: [currentULPFilter], datasets: [{ label: 'Normal', data: [filteredData.normal], backgroundColor: '#28a745' }, { label: 'Sedang', data: [filteredData.medium], backgroundColor: '#ffd700' }, { label: 'Tinggi', data: [filteredData.high], backgroundColor: '#dc3545' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Jumlah Gardu' } } } }
    });
}

function redirectToMonitoring(status) {
    const selectedULP = currentULPFilter === "all" ? "" : currentULPFilter;
    let url = 'monitoring.html'; let params = [];
    if (selectedULP) params.push(`ulp=${encodeURIComponent(selectedULP)}`);
    if (status && status !== 'all') params.push(`status=${encodeURIComponent(status)}`);
    if (params.length > 0) url += '?' + params.join('&');
    window.location.href = url;
}

function showLoading() { document.getElementById('loadingIndicator').style.display = 'flex'; document.getElementById('errorMessage').style.display = 'none'; }
function hideLoading() { document.getElementById('loadingIndicator').style.display = 'none'; }
function showError(message) { hideLoading(); document.getElementById('errorMessage').style.display = 'block'; console.error('Dashboard Error:', message); }
function hideContentSections() { document.getElementById('filterSection').style.display = 'none'; document.getElementById('statsOverview').style.display = 'none'; document.getElementById('chartsSection').style.display = 'none'; document.getElementById('ulpPerformance').style.display = 'none'; document.getElementById('alertSection').style.display = 'none'; }
function showContentSections() { document.getElementById('filterSection').style.display = 'flex'; document.getElementById('statsOverview').style.display = 'grid'; document.getElementById('chartsSection').style.display = 'grid'; document.getElementById('ulpPerformance').style.display = 'block'; document.getElementById('alertSection').style.display = 'block'; }