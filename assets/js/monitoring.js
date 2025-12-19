// assets/js/monitoring.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize map and data
    initializeMap();
    initializeEventListeners();
    loadApplicationData();
});

// Global variables
let map;
let markersLayer;
let ALL_COORD_ROWS = [];
let BEBAN_MAP = {};
let currentStatusFilter = "all";
let currentULPFilter = "all";

// Map initialization
function initializeMap() {
    try {
        // Create map
        map = L.map('map', {
            zoomControl: true,
            preferCanvas: true
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Set initial view
        map.setView([-2.6, 118], 5);

        // Create markers layer
        markersLayer = L.featureGroup().addTo(map);

        // Add map controls
        addMapControls();
        
        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
        utils.showNotification('Gagal memuat peta', 'error');
    }
}

function addMapControls() {
    try {
        // Custom fullscreen control
        const mapControls = L.control({position: 'topright'});
        mapControls.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            div.innerHTML = `
                <a href="#" title="Fullscreen" style="background: white; color: var(--pln-blue-primary); font-size: 18px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; text-decoration: none;">🔍</a>
            `;
            div.onclick = function(e) {
                e.preventDefault();
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.documentElement.requestFullscreen();
                }
            };
            return div;
        };
        mapControls.addTo(map);

        // Zoom-based marker sizing
        map.on('zoomend moveend', () => {
            const zoom = map.getZoom();
            const layers = markersLayer.getLayers();
            
            layers.forEach(layer => {
                if (layer.setRadius) {
                    const radius = Math.max(6, Math.min(14, zoom * 0.8));
                    layer.setRadius(radius);
                }
            });
        });
    } catch (error) {
        console.error('Error adding map controls:', error);
    }
}

// Event listeners
function initializeEventListeners() {
    try {
        // Search functionality
        const searchInput = document.getElementById('search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', function(e) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    applyFilters();
                }, 300);
            });
        }

        // Filter controls
        const ulpFilter = document.getElementById('ulpFilter');
        if (ulpFilter) {
            ulpFilter.addEventListener('change', function() {
                currentULPFilter = this.value;
                console.log('ULP Filter changed to:', currentULPFilter);
                applyFilters();
            });
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                currentStatusFilter = this.value;
                console.log('Status Filter changed to:', currentStatusFilter);
                applyFilters();
            });
        }

        // Reset button
        const btnReset = document.getElementById('btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', function() {
                resetFilters();
            });
        }

        // Export functionality
        const btnExport = document.getElementById('btnExport');
        if (btnExport) {
            btnExport.addEventListener('click', showExportModal);
        }

        const exportCSV = document.getElementById('exportCSV');
        if (exportCSV) {
            exportCSV.addEventListener('click', exportToCSV);
        }

        const exportExcel = document.getElementById('exportExcel');
        if (exportExcel) {
            exportExcel.addEventListener('click', exportToExcel);
        }

        const exportCancel = document.getElementById('exportCancel');
        if (exportCancel) {
            exportCancel.addEventListener('click', hideExportModal);
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                if (searchInput) searchInput.focus();
            }
            if (e.key === 'Escape') {
                if (searchInput) {
                    searchInput.blur();
                    if (searchInput.value) {
                        searchInput.value = '';
                        applyFilters();
                    }
                }
                hideExportModal();
            }
            // Debug shortcut
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                debugFilter();
            }
        });

        // Close modal on outside click
        const exportModal = document.getElementById('exportModal');
        if (exportModal) {
            exportModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    hideExportModal();
                }
            });
        }
        
        console.log('Event listeners initialized successfully');
    } catch (error) {
        console.error('Error initializing event listeners:', error);
        utils.showNotification('Terjadi kesalahan saat menginisialisasi', 'error');
    }
}

// Load application data
async function loadApplicationData() {
    showLoadingScreen();
    
    try {
        // Setup ULP filter terlebih dahulu
        setupULPFilter();
        
        // Load data sequentially
        await loadBebanAll();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await loadKoordinat();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Apply URL parameters if present
        const hasUrlParams = applyUrlParams();
        
        if (!hasUrlParams) {
            applyFilters();
        }
        
        hideLoadingScreen();
        
    } catch (error) {
        console.error('Application Error:', error);
        showErrorScreen(error);
    }
}

// Load beban data from all ULP
async function loadBebanAll() {
    setFilterInfo("Memuat data beban", "Mengambil data dari semua ULP...");
    BEBAN_MAP = {};
    
    for (const ulp of ULP_CONFIG) {
        try {
            setFilterInfo("Memuat data beban", `Memproses ${ulp.name}...`);
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
                    beban: Math.round(b),
                    ulp: ulp.name
                };
            });
        } catch (e) {
            console.warn(`❌ Gagal load ${ulp.name} gid=${ulp.gid}`, e);
        }
    }
    
    console.log("📈 Loaded BEBAN_MAP samples:", Object.entries(BEBAN_MAP).slice(0, 10));
}

// assets/js/monitoring.js
// Load koordinat data
async function loadKoordinat() {
    setFilterInfo("Memuat data koordinat", "Mengambil data lokasi gardu...");
    
    try {
        console.log('Loading koordinat data...'); // Debug
        
        // Gunakan URL yang benar
        const url = `${API_CONFIG.KOORDINAT}?action=read`;
        console.log('Fetching from URL:', url); // Debug
        
        const data = await api.get(url);
        
        console.log('Koordinat response:', data); // Debug
        
        if (data.success) {
            ALL_COORD_ROWS = data.data || [];
            
            let validCoords = 0;
            ALL_COORD_ROWS.forEach(row => {
                const {lat, lon} = getLatLon(row);
                if (isFinite(lat) && isFinite(lon)) {
                    validCoords++;
                }
            });
            
            console.log(`Valid coordinates: ${validCoords}/${ALL_COORD_ROWS.length}`);
            setFilterInfo("Data koordinat dimuat", `${validCoords} valid dari ${ALL_COORD_ROWS.length} total`);
        } else {
            throw new Error('Gagal memuat data koordinat: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error in loadKoordinat:', error);
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

// Get latitude and longitude from row
function getLatLon(row) {
    const LAT_KEYS = ["latitudey", "latitude", "lat", "y", "lintang"];
    const LON_KEYS = ["longitudex", "longitude", "lon", "x", "bujur"];
    const COORD_KEYS = ["koordinat", "coord", "coords"];
    
    let lat, lon;
    
    // Find latitude
    for (const k of LAT_KEYS) { 
        if (row[k] != null && row[k] !== "") { 
            lat = utils.numComma(row[k]); 
            if (isFinite(lat)) break; 
        } 
    }
    
    // Find longitude
    for (const k of LON_KEYS) { 
        if (row[k] != null && row[k] !== "") { 
            lon = utils.numComma(row[k]); 
            if (isFinite(lon)) break; 
        } 
    }
    
    // Try to parse from coordinate column if not found
    if (!isFinite(lat) || !isFinite(lon)) {
        for (const k of COORD_KEYS) {
            if (row[k]) {
                const coordStr = String(row[k]).trim();
                const formats = [
                    coordStr.split(/[;, \t]+/).filter(Boolean),
                    coordStr.replace(',', '.').split(/[;, \t]+/).filter(Boolean),
                    parseDMS(coordStr)
                ];
                
                for (const p of formats) {
                    if (p && p.length >= 2) { 
                        lat = utils.numComma(p[0]); 
                        lon = utils.numComma(p[1]); 
                        if (isFinite(lat) && isFinite(lon)) break; 
                    }
                }
                if (isFinite(lat) && isFinite(lon)) break;
            }
        }
    }
    
    // Validate Indonesian coordinates
    if (isFinite(lat) && isFinite(lon)) {
        if (lat < -11 || lat > 6 || lon < 95 || lon > 141) {
            console.warn("Koordinat di luar Indonesia:", lat, lon);
            return {lat: NaN, lon: NaN};
        }
    }
    
    return {lat, lon};
}

// Parse DMS format
function parseDMS(str) {
    const dmsRegex = /([NS])\s*(\d+)°\s*(\d+)'\s*(\d+)"?\s*([EW])\s*(\d+)°\s*(\d+)'\s*(\d+)"/i;
    const match = str.match(dmsRegex);
    
    if (match) {
        const latDir = match[1].toUpperCase();
        const latDeg = parseInt(match[2]);
        const latMin = parseInt(match[3]);
        const latSec = parseInt(match[4]);
        
        const lonDir = match[5].toUpperCase();
        const lonDeg = parseInt(match[6]);
        const lonMin = parseInt(match[7]);
        const lonSec = parseInt(match[8]);
        
        let lat = latDeg + latMin/60 + latSec/3600;
        let lon = lonDeg + lonMin/60 + lonSec/3600;
        
        if (latDir === 'S') lat = -lat;
        if (lonDir === 'W') lon = -lon;
        
        return [lat, lon];
    }
    
    return null;
}

// Get beban status
function getBebanStatus(beban) {
    if (!isFinite(beban)) return "nodata";
    if (beban < 40) return "normal";
    if (beban >= 40 && beban <= 85) return "medium";
    if (beban > 85) return "high";
    return "nodata";
}

// Get beban color
function bebanToColor(b) {
    if (!isFinite(b)) return "#94a3b8";
    if (b < 40) return "#28a745";
    if (b >= 40 && b <= 85) return "#ffd700";
    return "#dc3545";
}

// Create popup content
function makePopup(row, title, beban, kodeRaw, kodeNorm, matched, ulp) {
    const HIDE = new Set([...["latitudey","latitude","lat","y","lintang"], ...["longitudex","longitude","lon","x","bujur"], ...["koordinat","coord","coords"]]);
    const prefer = ["nama gardu","nama_gardu","kode gardu","kode_gardu","assetnum","penyulang","kapasitas","jenis_traf","fasa_trafo","tegangan_t","status","owner_peme","peruntukan","location","installdat","serialnum","manufactur","tujdnumber"];
    const lines = [];
    
    if (ulp) lines.push(["🏢 ULP", ulp]);
    
    if (isFinite(beban)) {
        lines.push(["⚡ Beban", `${Math.round(beban)}%`]);
    }

    for (const k of prefer) { 
        if (row[k] != null && String(row[k]).length) lines.push([k, row[k]]); 
    }
    
    for (const k in row) {
        if (HIDE.has(k) || prefer.includes(k)) continue;
        const v = row[k]; 
        if (v == null || String(v).length === 0) continue;
        lines.push([k, v]);
    }
    
    const rowsHtml = lines.map(([k, v]) => `<tr><td><strong>${utils.escapeHtml(k)}</strong></td><td>${utils.escapeHtml(v)}</td></tr>`).join("");
    const debug = `<div style="margin-top:12px;padding:12px;background:rgba(0,61,130,0.05);border-radius:8px;font-size:11px;opacity:.8">
        <div><strong>🔧 Debug Info:</strong></div>
        <div><strong>Kode Raw:</strong> ${utils.escapeHtml(kodeRaw || "-")}</div>
        <div><strong>Kode Normalized:</strong> <code class="small">${utils.escapeHtml(kodeNorm)}</code></div>
        <div><strong>ULP:</strong> ${ulp || "-"}</div>
        <div><strong>Match Status:</strong> ${matched ? "✅ Data Tersinkron" : "❌ Tidak Ada Data Beban"}</div>
    </div>`;
    
    return `<div class="popup"><h3>🏢 ${utils.escapeHtml(title)}</h3><table>${rowsHtml}</table>${debug}</div>`;
}

// Draw markers on map
function drawMarkers(rows) {
    try {
        markersLayer.clearLayers();
        const bounds = []; 
        let ok = 0, bad = 0, matched = 0, highLoad = 0;

        rows.forEach((row, i) => {
            const {lat, lon} = getLatLon(row);
            if (!isFinite(lat) || !isFinite(lon)) { 
                bad++; 
                return; 
            }

            const kodeRaw = getKodeHeuristic(row);
            const kodeNorm = utils.normalizeKode(kodeRaw);
            const bebanData = BEBAN_MAP[kodeNorm];
            const beban = bebanData ? bebanData.beban : null;
            const ulp = bebanData ? bebanData.ulp : null;
            const status = getBebanStatus(beban);

            // Apply filters
            if (currentULPFilter !== "all" && ulp !== currentULPFilter) return;
            if (currentStatusFilter !== "all" && status !== currentStatusFilter) return;

            const color = bebanToColor(beban);
            const title = row["nama gardu"] || row["nama_gardu"] || row["nama gardu "] || row["kode gardu"] || kodeRaw || `Gardu #${i+1}`;
            const pop = makePopup(row, title, beban, kodeRaw, kodeNorm, isFinite(beban), ulp);

            const marker = L.circleMarker([lat, lon], {
                radius: 10,
                color: '#ffffff',
                weight: 3,
                fillColor: color,
                fillOpacity: 0.9,
                className: 'custom-marker',
                bubblingMouseEvents: false,
                interactive: true
            }).bindPopup(pop, {
                maxWidth: 400,
                className: 'custom-popup',
                autoPan: true,
                autoPanPadding: [20, 20]
            });
            
            // Add hover effects
            marker.on('mouseover', function(e) {
                this.setStyle({
                    radius: 14,
                    weight: 4,
                    fillOpacity: 1
                });
            });
            
            marker.on('mouseout', function(e) {
                this.setStyle({
                    radius: 10,
                    weight: 3,
                    fillOpacity: 0.9
                });
            });
            
            marker.on('click', function(e) {
                markersLayer.eachLayer(function(layer) {
                    if (layer !== marker && layer.isPopupOpen()) {
                        layer.closePopup();
                    }
                });
                this.setLatLng([lat, lon]);
            });
            
            marker.addTo(markersLayer);
            bounds.push([lat, lon]); 
            ok++;
            
            if (isFinite(beban)) {
                matched++;
                if (beban > 85) highLoad++;
            }
        });

        // Fit bounds
        if (bounds.length > 0) {
            const padding = bounds.length > 10 ? [20, 20] : [50, 50];
            map.fitBounds(bounds, {padding: padding});
        }
        
        // Update statistics
        updateStats(rows.length, ok, bad, matched, Object.keys(BEBAN_MAP).length, highLoad);
        
        // Update filter info
        updateFilterInfo();
        
        console.log(`Drawn ${ok} markers successfully`);
    } catch (error) {
        console.error('Error drawing markers:', error);
        utils.showNotification('Gagal menggambar marker', 'error');
    }
}

// Update statistics
function updateStats(total, displayed, noCoord, matched, uniqueBeban, highLoad) {
    try {
        const totalGardu = document.getElementById('totalGardu');
        const activeGardu = document.getElementById('activeGardu');
        const highLoadGardu = document.getElementById('highLoadGardu');
        const matchedData = document.getElementById('matchedData');
        
        if (totalGardu) totalGardu.textContent = total.toLocaleString();
        if (activeGardu) activeGardu.textContent = displayed.toLocaleString();
        if (highLoadGardu) highLoadGardu.textContent = highLoad.toLocaleString();
        if (matchedData) matchedData.textContent = matched.toLocaleString();
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Update filter info
function updateFilterInfo() {
    try {
        const $filterInfo = document.getElementById('filterInfo');
        if (!$filterInfo) return;
        
        let filterInfo = "";
        
        if (currentULPFilter !== "all") {
            filterInfo += `ULP: ${currentULPFilter}`;
        }
        if (currentStatusFilter !== "all") {
            if (filterInfo) filterInfo += " | ";
            filterInfo += `Status: ${getBebanStatusText(currentStatusFilter)}`;
        }
        
        const total = ALL_COORD_ROWS.length;
        const displayed = markersLayer.getLayers().length;
        const matched = Array.from(BEBAN_MAP.values()).filter(data => {
            const kode = Object.keys(BEBAN_MAP).find(k => BEBAN_MAP[k] === data);
            return ALL_COORD_ROWS.some(row => {
                const kodeNorm = utils.normalizeKode(getKodeHeuristic(row));
                return kodeNorm === kode;
            });
        }).length;
        const highLoad = Array.from(BEBAN_MAP.values()).filter(data => data.beban > 85).length;
        
        const details = `Gardu: ${total.toLocaleString()} | Ditampilkan: ${displayed.toLocaleString()} | Match beban: ${matched.toLocaleString()} | Beban tinggi: ${highLoad.toLocaleString()}`;
        
        if (filterInfo) {
            setFilterInfoComplete(`Filter aktif: ${filterInfo}`, details);
        } else {
            setFilterInfoComplete("Sistem siap", details);
        }
    } catch (error) {
        console.error('Error updating filter info:', error);
    }
}

// Get beban status text
function getBebanStatusText(status) {
    const statusMap = {
        'normal': 'Normal',
        'medium': 'Sedang', 
        'high': 'Tinggi',
        'nodata': 'Tidak Ada Data'
    };
    return statusMap[status] || 'Tidak Diketahui';
}

// Apply filters
function applyFilters() {
    try {
        const searchInput = document.getElementById('search');
        const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
        let filtered = ALL_COORD_ROWS;
        
        if (q) {
            filtered = ALL_COORD_ROWS.filter(r => 
                Object.values(r).some(v => String(v).toLowerCase().includes(q))
            );
        }
        
        drawMarkers(filtered);
    } catch (error) {
        console.error('Error applying filters:', error);
        utils.showNotification('Gagal menerapkan filter', 'error');
    }
}

// Reset filters
function resetFilters() {
    try {
        const searchInput = document.getElementById('search');
        const ulpFilter = document.getElementById('ulpFilter');
        const statusFilter = document.getElementById('statusFilter');
        const btnReset = document.getElementById('btnReset');
        
        if (searchInput) searchInput.value = '';
        if (ulpFilter) ulpFilter.value = 'all';
        if (statusFilter) statusFilter.value = 'all';
        currentULPFilter = 'all';
        currentStatusFilter = 'all';
        
        if (btnReset) {
            btnReset.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btnReset.style.transform = '';
                applyFilters();
            }, 150);
        }
    } catch (error) {
        console.error('Error resetting filters:', error);
    }
}

// URL parameters handling
function getUrlParams() {
    try {
        const params = new URLSearchParams(window.location.search);
        return {
            ulp: params.get('ulp'),
            status: params.get('status')
        };
    } catch (error) {
        console.error('Error getting URL params:', error);
        return { ulp: null, status: null };
    }
}

function applyUrlParams() {
    try {
        const urlParams = getUrlParams();
        
        console.log("URL Parameters:", urlParams); // Debug
        
        if (urlParams.ulp) {
            // Set filter ULP
            const ulpFilter = document.getElementById('ulpFilter');
            if (ulpFilter) {
                ulpFilter.value = urlParams.ulp;
                currentULPFilter = urlParams.ulp;
                console.log("Applied ULP filter:", urlParams.ulp); // Debug
            }
        }
        
        if (urlParams.status) {
            // Set filter status
            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter) {
                statusFilter.value = urlParams.status;
                currentStatusFilter = urlParams.status;
                console.log("Applied Status filter:", urlParams.status); // Debug
            }
        }
        
        // Terapkan filter jika ada parameter
        if (urlParams.ulp || urlParams.status) {
            console.log("Applying filters from URL..."); // Debug
            applyFilters();
            return true; // Return true jika ada parameter
        }
        
        return false; // Return false jika tidak ada parameter
    } catch (error) {
        console.error('Error applying URL params:', error);
        return false;
    }
}

// Export functionality
function showExportModal() {
    try {
        const exportModal = document.getElementById('exportModal');
        if (exportModal) {
            exportModal.classList.add('active');
        }
    } catch (error) {
        console.error('Error showing export modal:', error);
    }
}

function hideExportModal() {
    try {
        const exportModal = document.getElementById('exportModal');
        if (exportModal) {
            exportModal.classList.remove('active');
        }
    } catch (error) {
        console.error('Error hiding export modal:', error);
    }
}

function getFilteredData() {
    try {
        const searchInput = document.getElementById('search');
        const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
        let filtered = ALL_COORD_ROWS;
        
        if (q) {
            filtered = ALL_COORD_ROWS.filter(r => 
                Object.values(r).some(v => String(v).toLowerCase().includes(q))
            );
        }
        
        return filtered.filter(row => {
            const {lat, lon} = getLatLon(row);
            if (!isFinite(lat) || !isFinite(lon)) return false;

            const kodeRaw = getKodeHeuristic(row);
            const kodeNorm = utils.normalizeKode(kodeRaw);
            const bebanData = BEBAN_MAP[kodeNorm];
            const beban = bebanData ? bebanData.beban : null;
            const ulp = bebanData ? bebanData.ulp : null;
            const status = getBebanStatus(beban);

            if (currentULPFilter !== "all" && ulp !== currentULPFilter) return false;
            if (currentStatusFilter !== "all" && status !== currentStatusFilter) return false;
            
            return true;
        });
    } catch (error) {
        console.error('Error getting filtered data:', error);
        return [];
    }
}

function exportToCSV() {
    try {
        const filteredData = getFilteredData();
        
        if (filteredData.length === 0) {
            utils.showNotification("Tidak ada data untuk diexport!", 'warning');
            return;
        }
        
        const standardizedData = getStandardizedData(filteredData);
        const allColumns = new Set();
        standardizedData.forEach(row => {
            Object.keys(row).forEach(key => allColumns.add(key));
        });
        
        const columns = Array.from(allColumns);
        let csvContent = columns.map(col => `"${col}"`).join(',') + '\n';
        
        standardizedData.forEach(row => {
            const rowData = columns.map(col => {
                const value = row[col] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvContent += rowData.join(',') + '\n';
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        let fileName = 'Data_Gardu_Listrik';
        if (currentULPFilter !== 'all') fileName += `_${currentULPFilter}`;
        if (currentStatusFilter !== 'all') fileName += `_${getBebanStatusText(currentStatusFilter)}`;
        fileName += '.csv';
        
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        utils.showNotification('Data berhasil diekspor ke CSV', 'success');
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        utils.showNotification('Gagal mengekspor ke CSV', 'error');
    }
}

function exportToExcel() {
    try {
        utils.showNotification('Export Excel akan segera tersedia', 'info');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        utils.showNotification('Gagal mengekspor ke Excel', 'error');
    }
}

function getStandardizedData(filteredData) {
    try {
        const standardizedData = [];
        
        filteredData.forEach(row => {
            const kodeRaw = getKodeHeuristic(row);
            const kodeNorm = utils.normalizeKode(kodeRaw);
            const bebanData = BEBAN_MAP[kodeNorm];
            const beban = bebanData ? bebanData.beban : '';
            const ulp = bebanData ? bebanData.ulp : '';
            const statusBeban = getBebanStatus(beban);
            const {lat, lon} = getLatLon(row);
            
            const standardizedRow = {
                'Kode Gardu': kodeRaw || '',
                'Nama Gardu': row['nama gardu'] || row['nama_gardu'] || '',
                'Penyulang': row['penyulang'] || '',
                'Kapasitas (kVA)': row['kapasitas'] || '',
                'Jenis Trafo': row['jenis_traf'] || '',
                'Fasa Trafo': row['fasa_trafo'] || '',
                'Tegangan (V)': row['tegangan_t'] || '',
                'Status': row['status'] || '',
                'Latitude': isFinite(lat) ? lat : '',
                'Longitude': isFinite(lon) ? lon : '',
                'Beban (%)': beban,
                'ULP': ulp,
                'Status Beban': getBebanStatusText(statusBeban)
            };
            
            // Add additional columns
            Object.keys(row).forEach(key => {
                if (!standardizedRow[key] && row[key]) {
                    standardizedRow[key] = row[key];
                }
            });
            
            standardizedData.push(standardizedRow);
        });
        
        return standardizedData;
    } catch (error) {
        console.error('Error standardizing data:', error);
        return [];
    }
}

// Setup ULP Filter
function setupULPFilter() {
    try {
        const ulpFilter = document.getElementById('ulpFilter');
        if (!ulpFilter) {
            console.error('ULP filter element not found');
            return;
        }
        
        ulpFilter.innerHTML = '<option value="all">Semua ULP</option>';
        
        ULP_CONFIG.forEach(ulp => {
            const option = document.createElement('option');
            option.value = ulp.name;
            option.textContent = ulp.name;
            ulpFilter.appendChild(option);
        });
        
        console.log('ULP Filter setup completed with', ULP_CONFIG.length, 'options');
    } catch (error) {
        console.error('Error setting up ULP filter:', error);
    }
}

// UI Helper functions
function setFilterInfo(title, details = "") {
    try {
        const $filterInfo = document.getElementById('filterInfo');
        if (!$filterInfo) return;
        
        $filterInfo.innerHTML = `
            <div class="filter-info-content">
                <div class="filter-info-icon">⏳</div>
                <div class="filter-info-text">
                    <div class="filter-info-title">${title}</div>
                    <div class="filter-info-details">${details}</div>
                </div>
            </div>
        `;
        $filterInfo.classList.add('loading');
    } catch (error) {
        console.error('Error setting filter info:', error);
    }
}

function setFilterInfoComplete(title, details = "") {
    try {
        const $filterInfo = document.getElementById('filterInfo');
        if (!$filterInfo) return;
        
        $filterInfo.innerHTML = `
            <div class="filter-info-content">
                <div class="filter-info-icon">✅</div>
                <div class="filter-info-text">
                    <div class="filter-info-title">${title}</div>
                    <div class="filter-info-details">${details}</div>
                </div>
            </div>
        `;
        $filterInfo.classList.remove('loading');
    } catch (error) {
        console.error('Error setting filter info complete:', error);
    }
}

function showLoadingScreen() {
    try {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-spinner';
        loadingDiv.id = 'loadingScreen';
        loadingDiv.innerHTML = `
            <div class="spinner"></div>
            <div style="color: var(--pln-dark); font-weight: 600; font-size: 16px;">PLN Monitoring System</div>
            <div style="color: var(--pln-gray); font-size: 14px; margin-top: 8px;">Menginisialisasi sistem...</div>
        `;
        document.body.appendChild(loadingDiv);
    } catch (error) {
        console.error('Error showing loading screen:', error);
    }
}

function hideLoadingScreen() {
    try {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transform = 'scale(0.9)';
            setTimeout(() => {
                if (loadingScreen.parentNode) {
                    loadingScreen.parentNode.removeChild(loadingScreen);
                }
            }, 300);
        }
    } catch (error) {
        console.error('Error hiding loading screen:', error);
    }
}

function showErrorScreen(error) {
    try {
        hideLoadingScreen();
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #fff; padding: 30px; border-radius:16px; box-shadow: var(--shadow-heavy);
            text-align: center; z-index: 10000; max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <div style="font-size: 48px; margin-bottom:16px;">⚠️</div>
            <h3 style="color: var(--pln-red); margin-bottom:16px;">Gagal Memuat Data</h3>
            <p style="color: var(--pln-gray); margin-bottom:20px;">Pastikan sheet Google dapat diakses publik dan koneksi internet stabil.</p>
            <button onclick="location.reload()" style="padding: 12px 24px; background: var(--gradient-primary); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">🔄 Coba Lagi</button>
        `;
        document.body.appendChild(errorDiv);
    } catch (error) {
        console.error('Error showing error screen:', error);
    }
}

// Debug function untuk memeriksa filter
function debugFilter() {
    console.log('=== DEBUG FILTER ===');
    console.log('currentULPFilter:', currentULPFilter);
    console.log('currentStatusFilter:', currentStatusFilter);
    console.log('ALL_COORD_ROWS length:', ALL_COORD_ROWS.length);
    console.log('BEBAN_MAP keys:', Object.keys(BEBAN_MAP).length);
    
    // Test beberapa data
    const testRows = ALL_COORD_ROWS.slice(0, 3);
    testRows.forEach((row, index) => {
        const kodeRaw = getKodeHeuristic(row);
        const kodeNorm = utils.normalizeKode(kodeRaw);
        const bebanData = BEBAN_MAP[kodeNorm];
        console.log(`Row ${index}:`, {
            kodeRaw,
            kodeNorm,
            hasBeban: !!bebanData,
            beban: bebanData ? bebanData.beban : null,
            ulp: bebanData ? bebanData.ulp : null
        });
    });
}

