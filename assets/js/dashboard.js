// assets/js/dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
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
    // Setup event listeners
    setupEventListeners();
    
    // Load data
    loadData();
}

// Setup event listeners
function setupEventListeners() {
    // ULP filter
    document.getElementById('ulpFilter').addEventListener('change', function() {
        currentULPFilter = this.value;
        applyFilters();
    });

    // Retry button
    document.getElementById('retryButton').addEventListener('click', loadData);

    // Add click handlers to stat cards
    setTimeout(() => {
        const normalCard = document.getElementById('normalCard');
        const mediumCard = document.getElementById('mediumCard');
        const highCard = document.getElementById('highCard');
        const nodataCard = document.getElementById('nodataCard');
        
        if (normalCard) {
            normalCard.addEventListener('click', function(e) {
                if (!e.target.classList.contains('action-btn')) {
                    redirectToMonitoring('normal');
                }
            });
        }
        
        if (mediumCard) {
            mediumCard.addEventListener('click', function(e) {
                if (!e.target.classList.contains('action-btn')) {
                    redirectToMonitoring('medium');
                }
            });
        }
        
        if (highCard) {
            highCard.addEventListener('click', function(e) {
                if (!e.target.classList.contains('action-btn')) {
                    redirectToMonitoring('high');
                }
            });
        }
        
        if (nodataCard) {
            nodataCard.addEventListener('click', function(e) {
                if (!e.target.classList.contains('action-btn')) {
                    redirectToMonitoring('nodata');
                }
            });
        }
    }, 1000);
}

// Load data
async function loadData() {
    try {
        showLoading();
        
        // Hide content sections during loading
        hideContentSections();
        
        // Load data sequentially
        await loadBebanAll();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await loadKoordinat();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Setup ULP filter
        setupULPFilter();
        
        // Analyze data
        analyzeData();
        
        // Update UI
        updateUI();
        
        // Show content sections
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
                BEBAN_MAP[kode] = {
                    beban: b,
                    ulp: ulp.name
                };
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

// Get kode gardu from row
function getKodeHeuristic(row) {
    const KODE_KEYS = [
        "nama gardu", "nama_gardu", "kode gardu", "kode_gardu",
        "kode gardu relasi", "kode_gardu_relasi", "assetnum", "kode_peral",
        "nama gardu relasi", "nama_gardu_relasi"
    ];
    
    for (const k of KODE_KEYS) {
        if (row[k] != null && String(row[k]).trim() !== "") return String(row[k]).trim();
    }
    
    let hit = Object.keys(row).find(h => h.includes("kode") && h.includes("gardu"));
    if (hit && row[hit]) return String(row[hit]).trim();
    
    hit = Object.keys(row).find(h => h.includes("relasi") && h.includes("gardu"));
    if (hit && row[hit]) return String(row[hit]).trim();
    
    hit = Object.keys(row).find(h => h.includes("kode"));
    if (hit && row[hit]) return String(row[hit]).trim();
    
    return "";
}

// Setup ULP filter
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

// Analyze data
function analyzeData() {
    // Reset analytics data
    analyticsData = {
        total: 0,
        normal: 0,
        medium: 0,
        high: 0,
        nodata: 0,
        ulpStats: {},
        alerts: []
    };

    // Initialize stats per ULP
    ULP_CONFIG.forEach(ulp => {
        analyticsData.ulpStats[ulp.name] = {
            total: 0,
            normal: 0,
            medium: 0,
            high: 0,
            nodata: 0
        };
    });

    // Analyze each gardu
    ALL_COORD_ROWS.forEach(row => {
        const kodeRaw = getKodeHeuristic(row);
        const kodeNorm = utils.normalizeKode(kodeRaw);
        const bebanData = BEBAN_MAP[kodeNorm];
        const beban = bebanData ? bebanData.beban : null;
        const ulp = bebanData ? bebanData.ulp : null;

        // Classify status beban
        let status;
        if (!isFinite(beban)) {
            status = "nodata";
            analyticsData.nodata++;
        } else if (beban < 40) {
            status = "normal";
            analyticsData.normal++;
        } else if (beban >= 40 && beban <= 85) {
            status = "medium";
            analyticsData.medium++;
        } else {
            status = "high";
            analyticsData.high++;
        }

        analyticsData.total++;

        // Update stats per ULP
        if (ulp && analyticsData.ulpStats[ulp]) {
            analyticsData.ulpStats[ulp][status]++;
            analyticsData.ulpStats[ulp].total++;
        }
    });

    // Generate alerts
    generateAlerts();
}

// Generate alerts
function generateAlerts() {
    analyticsData.alerts = [];

    // Alert for ULP with many high load gardu
    Object.entries(analyticsData.ulpStats).forEach(([ulpName, stats]) => {
        if (stats.high > 10) {
            analyticsData.alerts.push({
                type: 'critical',
                title: 'Beban Tinggi Terdeteksi',
                message: `${stats.high} gardu di ${ulpName} mengalami beban di atas 85%. Perlu tindakan segera.`
            });
        }
    });

    // Alert for ULP with incomplete data
    Object.entries(analyticsData.ulpStats).forEach(([ulpName, stats]) => {
        const nodataPercentage = stats.total > 0 ? (stats.nodata / stats.total) * 100 : 0;
        if (nodataPercentage > 30) {
            analyticsData.alerts.push({
                type: 'warning',
                title: 'Data Tidak Lengkap',
                message: `${Math.round(nodataPercentage)}% gardu di ${ulpName} tidak memiliki data beban.`
            });
        }
    });

    // General alert if many high load gardu
    if (analyticsData.high > 50) {
        analyticsData.alerts.push({
            type: 'critical',
            title: 'Beban Sistem Tinggi',
            message: `${analyticsData.high} gardu mengalami beban tinggi. Perlu evaluasi sistem distribusi.`
        });
    }

    // If no alerts, add normal message
    if (analyticsData.alerts.length === 0) {
        analyticsData.alerts.push({
            type: 'info',
            title: 'Sistem Berjalan Normal',
            message: 'Semua gardu beroperasi dalam kondisi normal.'
        });
    }
}

// Apply filters
function applyFilters() {
    if (currentULPFilter === "all") {
        updateUI();
        document.getElementById('filterInfo').innerHTML = 
            'Menampilkan data dari <strong>Semua ULP</strong>';
    } else {
        const filteredData = {
            total: 0,
            normal: 0,
            medium: 0,
            high: 0,
            nodata: 0,
            ulpStats: {},
            alerts: []
        };

        // Initialize stats for selected ULP
        filteredData.ulpStats[currentULPFilter] = {
            total: 0,
            normal: 0,
            medium: 0,
            high: 0,
            nodata: 0
        };

        // Analyze each gardu with ULP filter
        ALL_COORD_ROWS.forEach(row => {
            const kodeRaw = getKodeHeuristic(row);
            const kodeNorm = utils.normalizeKode(kodeRaw);
            const bebanData = BEBAN_MAP[kodeNorm];
            const beban = bebanData ? bebanData.beban : null;
            const ulp = bebanData ? bebanData.ulp : null;

            // Skip if ULP doesn't match filter
            if (ulp !== currentULPFilter) return;

            // Classify status beban
            let status;
            if (!isFinite(beban)) {
                status = "nodata";
                filteredData.nodata++;
            } else if (beban < 40) {
                status = "normal";
                filteredData.normal++;
            } else if (beban >= 40 && beban <= 85) {
                status = "medium";
                filteredData.medium++;
            } else {
                status = "high";
                filteredData.high++;
            }

            filteredData.total++;

            // Update stats for selected ULP
            if (filteredData.ulpStats[currentULPFilter]) {
                filteredData.ulpStats[currentULPFilter][status]++;
                filteredData.ulpStats[currentULPFilter].total++;
            }
        });

        updateFilteredUI(filteredData);
        document.getElementById('filterInfo').innerHTML = 
            `Menampilkan data dari <strong>${currentULPFilter}</strong>`;
    }
}

// Update UI with all data
function updateUI() {
    // Update stat cards
    document.getElementById('totalGardu').textContent = analyticsData.total;
    document.getElementById('normalGardu').textContent = analyticsData.normal;
    document.getElementById('mediumGardu').textContent = analyticsData.medium;
    document.getElementById('highGardu').textContent = analyticsData.high;
    document.getElementById('nodataGardu').textContent = analyticsData.nodata;

    // Update ULP performance grid
    updateULPPerformanceGrid();

    // Update alerts
    updateAlerts();

    // Update charts
    updateCharts();
}

// Update UI with filtered data
function updateFilteredUI(filteredData) {
    // Update stat cards
    document.getElementById('totalGardu').textContent = filteredData.total;
    document.getElementById('normalGardu').textContent = filteredData.normal;
    document.getElementById('mediumGardu').textContent = filteredData.medium;
    document.getElementById('highGardu').textContent = filteredData.high;
    document.getElementById('nodataGardu').textContent = filteredData.nodata;

    // Update ULP performance grid for selected ULP
    const ulpGrid = document.getElementById('ulpPerformanceGrid');
    ulpGrid.innerHTML = '';

    if (filteredData.ulpStats[currentULPFilter]) {
        const stats = filteredData.ulpStats[currentULPFilter];
        const normalPercentage = stats.total > 0 ? Math.round((stats.normal / stats.total) * 100) : 0;
        
        const ulpCard = document.createElement('div');
        ulpCard.className = 'ulp-card';
        ulpCard.innerHTML = `
            <div class="ulp-name">${currentULPFilter}</div>
            <div class="ulp-stats">
                <div class="ulp-stat">
                    <div class="ulp-value">${stats.total}</div>
                    <div class="ulp-label">Gardu</div>
                </div>
                <div class="ulp-stat">
                    <div class="ulp-value">${normalPercentage}%</div>
                    <div class="ulp-label">Normal</div>
                </div>
            </div>
        `;
        ulpGrid.appendChild(ulpCard);
    }

    // Update alerts for filtered data
    updateFilteredAlerts(filteredData);

    // Update charts with filtered data
    updateFilteredCharts(filteredData);
}

// Update ULP performance grid
function updateULPPerformanceGrid() {
    const ulpGrid = document.getElementById('ulpPerformanceGrid');
    ulpGrid.innerHTML = '';

    Object.entries(analyticsData.ulpStats).forEach(([ulpName, stats]) => {
        const normalPercentage = stats.total > 0 ? Math.round((stats.normal / stats.total) * 100) : 0;
        
        const ulpCard = document.createElement('div');
        ulpCard.className = 'ulp-card';
        ulpCard.innerHTML = `
            <div class="ulp-name">${ulpName}</div>
            <div class="ulp-stats">
                <div class="ulp-stat">
                    <div class="ulp-value">${stats.total}</div>
                    <div class="ulp-label">Gardu</div>
                </div>
                <div class="ulp-stat">
                    <div class="ulp-value">${normalPercentage}%</div>
                    <div class="ulp-label">Normal</div>
                </div>
            </div>
        `;
        ulpGrid.appendChild(ulpCard);
    });
}

// Update alerts
function updateAlerts() {
    const alertList = document.getElementById('alertList');
    alertList.innerHTML = '';

    analyticsData.alerts.forEach(alert => {
        let iconClass = 'fas fa-info-circle';
        let alertClass = 'info';
        if (alert.type === 'critical') {
            iconClass = 'fas fa-radiation-alt';
            alertClass = '';
        } else if (alert.type === 'warning') {
            iconClass = 'fas fa-exclamation-triangle';
            alertClass = 'warning';
        }

        const alertItem = document.createElement('div');
        alertItem.className = `alert-item ${alertClass}`;
        alertItem.innerHTML = `
            <div class="alert-icon ${alert.type}">
                <i class="${iconClass}"></i>
            </div>
            <div class="alert-content">
                <h4>${alert.title}</h4>
                <p>${alert.message}</p>
            </div>
        `;
        alertList.appendChild(alertItem);
    });
}

// Update alerts for filtered data
function updateFilteredAlerts(filteredData) {
    const alertList = document.getElementById('alertList');
    alertList.innerHTML = '';

    // Generate alerts specific to selected ULP
    const filteredAlerts = [];

    if (filteredData.high > 10) {
        filteredAlerts.push({
            type: 'critical',
            title: 'Beban Tinggi Terdeteksi',
            message: `${filteredData.high} gardu di ${currentULPFilter} mengalami beban di atas 85%. Perlu tindakan segera.`
        });
    }

    const nodataPercentage = filteredData.total > 0 ? (filteredData.nodata / filteredData.total) * 100 : 0;
    if (nodataPercentage > 30) {
        filteredAlerts.push({
            type: 'warning',
            title: 'Data Tidak Lengkap',
            message: `${Math.round(nodataPercentage)}% gardu di ${currentULPFilter} tidak memiliki data beban.`
        });
    }

    if (filteredAlerts.length === 0) {
        filteredAlerts.push({
            type: 'info',
            title: 'ULP Berjalan Normal',
            message: `Semua gardu di ${currentULPFilter} beroperasi dalam kondisi normal.`
        });
    }

    filteredAlerts.forEach(alert => {
        let iconClass = 'fas fa-info-circle';
        let alertClass = 'info';
        if (alert.type === 'critical') {
            iconClass = 'fas fa-radiation-alt';
            alertClass = '';
        } else if (alert.type === 'warning') {
            iconClass = 'fas fa-exclamation-triangle';
            alertClass = 'warning';
        }

        const alertItem = document.createElement('div');
        alertItem.className = `alert-item ${alertClass}`;
        alertItem.innerHTML = `
            <div class="alert-icon ${alert.type}">
                <i class="${iconClass}"></i>
            </div>
            <div class="alert-content">
                <h4>${alert.title}</h4>
                <p>${alert.message}</p>
            </div>
        `;
        alertList.appendChild(alertItem);
    });
}

// Update charts
function updateCharts() {
    // Status Distribution Chart
    const statusDistributionCtx = document.getElementById('statusDistributionChart').getContext('2d');
    
    if (statusDistributionChart) {
        statusDistributionChart.destroy();
    }
    
    statusDistributionChart = new Chart(statusDistributionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Normal', 'Sedang', 'Tinggi', 'Tidak Ada Data'],
            datasets: [{
                data: [analyticsData.normal, analyticsData.medium, analyticsData.high, analyticsData.nodata],
                backgroundColor: [
                    '#28a745',
                    '#ffd700',
                    '#dc3545',
                    '#6c757d'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });

    // ULP Distribution Chart
    const ulpDistributionCtx = document.getElementById('ulpDistributionChart').getContext('2d');
    
    if (ulpDistributionChart) {
        ulpDistributionChart.destroy();
    }

    const ulpNames = Object.keys(analyticsData.ulpStats);
    const ulpNormalData = ulpNames.map(ulp => analyticsData.ulpStats[ulp].normal);
    const ulpMediumData = ulpNames.map(ulp => analyticsData.ulpStats[ulp].medium);
    const ulpHighData = ulpNames.map(ulp => analyticsData.ulpStats[ulp].high);

    ulpDistributionChart = new Chart(ulpDistributionCtx, {
        type: 'bar',
        data: {
            labels: ulpNames,
            datasets: [
                {
                    label: 'Normal',
                    data: ulpNormalData,
                    backgroundColor: '#28a745'
                },
                {
                    label: 'Sedang',
                    data: ulpMediumData,
                    backgroundColor: '#ffd700'
                },
                {
                    label: 'Tinggi',
                    data: ulpHighData,
                    backgroundColor: '#dc3545'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Jumlah Gardu'
                    }
                }
            }
        }
    });
}

// Update charts with filtered data
function updateFilteredCharts(filteredData) {
    // Status Distribution Chart for filtered data
    const statusDistributionCtx = document.getElementById('statusDistributionChart').getContext('2d');
    
    if (statusDistributionChart) {
        statusDistributionChart.destroy();
    }
    
    statusDistributionChart = new Chart(statusDistributionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Normal', 'Sedang', 'Tinggi', 'Tidak Ada Data'],
            datasets: [{
                data: [filteredData.normal, filteredData.medium, filteredData.high, filteredData.nodata],
                backgroundColor: [
                    '#28a745',
                    '#ffd700',
                    '#dc3545',
                    '#6c757d'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: `Status Beban - ${currentULPFilter}`
                }
            }
        }
    });

    // ULP Distribution Chart - for filtered data, show only selected ULP
    const ulpDistributionCtx = document.getElementById('ulpDistributionChart').getContext('2d');
    
    if (ulpDistributionChart) {
        ulpDistributionChart.destroy();
    }

    ulpDistributionChart = new Chart(ulpDistributionCtx, {
        type: 'bar',
        data: {
            labels: [currentULPFilter],
            datasets: [
                {
                    label: 'Normal',
                    data: [filteredData.normal],
                    backgroundColor: '#28a745'
                },
                {
                    label: 'Sedang',
                    data: [filteredData.medium],
                    backgroundColor: '#ffd700'
                },
                {
                    label: 'Tinggi',
                    data: [filteredData.high],
                    backgroundColor: '#dc3545'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Jumlah Gardu'
                    }
                }
            }
        }
    });
}

// Redirect to monitoring with filters
function redirectToMonitoring(status) {
    const selectedULP = currentULPFilter === "all" ? "" : currentULPFilter;
    
    let url = 'monitoring.html';
    let params = [];
    
    if (selectedULP) {
        params.push(`ulp=${encodeURIComponent(selectedULP)}`);
    }
    
    if (status && status !== 'all') {
        params.push(`status=${encodeURIComponent(status)}`);
    }
    
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    
    window.location.href = url;
}

// UI Helper functions
function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'flex';
    document.getElementById('errorMessage').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

function showError(message) {
    hideLoading();
    document.getElementById('errorMessage').style.display = 'block';
    console.error('Dashboard Error:', message);
}

function hideContentSections() {
    document.getElementById('filterSection').style.display = 'none';
    document.getElementById('statsOverview').style.display = 'none';
    document.getElementById('chartsSection').style.display = 'none';
    document.getElementById('ulpPerformance').style.display = 'none';
    document.getElementById('alertSection').style.display = 'none';
}

function showContentSections() {
    document.getElementById('filterSection').style.display = 'flex';
    document.getElementById('statsOverview').style.display = 'grid';
    document.getElementById('chartsSection').style.display = 'grid';
    document.getElementById('ulpPerformance').style.display = 'block';
    document.getElementById('alertSection').style.display = 'block';
}