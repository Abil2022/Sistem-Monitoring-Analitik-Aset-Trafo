// ===== KONFIGURASI API =====
const API_KOORDINAT = "https://script.google.com/macros/s/AKfycbxoLLis3zdSQdm-4eDYgA9cvYY_uca-AwGeZNPYheb8YlSAl_M-nXWqrBScuJqTLKM/exec";
const API_PEMAKAIAN = "https://script.google.com/macros/s/AKfycbz7uCO8ZBz36ps_U-I4AJDz50V3IE3u5JlCAnVBfepAO_atAiWfe-b8mBgIAC0zp90/exec";
const SPREADSHEET_PEMAKAIAN = "11ZqsQ5YRNHRVrlLDHsP2OXbFzix6Lwh0JiTJZE5pgJI";

// ===== VARIABEL GLOBAL =====
let allDataKoordinat = [];
let currentDataKoordinat = [];
let dataToDelete = null;
let deleteMode = null; // 'koordinat' atau 'pemakaian'

// Pemakaian variables
let currentGid = '1549551008';
let currentSheetName = 'LSM';
let currentDataPemakaian = [];

// Konfigurasi Sheet Pemakaian
const SHEET_CONFIGS = {
    'LSM': {
        columns: ['NO. KODE GARDU', 'DATA GARDU - JENIS', 'DATA GARDU - ALAMAT', 'PENYULANG', 'DATA TRAFO - DAYA KVA', 'DATA TRAFO - MERK', 'DATA TRAFO - KONDISI', 'DATA TRAFO - NO. SERI', 'DATA TRAFO - TAHUN', 'DATA TRAFO - ARUS (A) - HV', 'DATA TRAFO - ARUS (A) - LV', 'DATA TRAFO - TEGANGAN - HV (KV)', 'DATA TRAFO - TEGANGAN - LV (V)', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - KABEL INDUK', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - OUT GOING', 'JENIS PENAMPANG (mm²) - SAL.JTR', 'PANJ. SAL. (Mtr)', 'JURUSAN', 'ARUS (A) - R', 'ARUS (A) - S', 'ARUS (A) - T', 'ARUS (A) - N', 'TEGANGAN (VOLT) - R-S', 'TEGANGAN (VOLT) - R-T', 'TEGANGAN (VOLT) - S-T', 'TEGANGAN (VOLT) - R-N', 'TEGANGAN (VOLT) - S-N', 'TEGANGAN (VOLT) - T-N', 'TEGANGAN UJUNG (VOLT) - R-S', 'TEGANGAN UJUNG (VOLT) - R-T', 'TEGANGAN UJUNG (VOLT) - S-T', 'TEGANGAN UJUNG (VOLT) - R-N', 'TEGANGAN UJUNG (VOLT) - S-N', 'TEGANGAN UJUNG (VOLT) - T-N', 'DAYA (kVA)', 'Pemakaian (%)', 'I rata-rata (A)', 'Unbalanced (%)', 'KET']
    },
    'KRG': {
        columns: ['NO. KODE GARDU', 'DATA GARDU - JENIS', 'DATA GARDU - ALAMAT', 'PENYULANG', 'DATA TRAFO - DAYA KVA', 'DATA TRAFO - MERK', 'DATA TRAFO - KONDISI', 'DATA TRAFO - NO. SERI', 'DATA TRAFO - TAHUN', 'DATA TRAFO - ARUS (A) - HV', 'DATA TRAFO - ARUS (A) - LV', 'DATA TRAFO - TEGANGAN - HV (KV)', 'DATA TRAFO - TEGANGAN - LV (V)', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - KABEL INDUK', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - OUT GOING', 'JENIS PENAMPANG (mm²) - SAL.JTR', 'JURUSAN', 'PANJ. SAL. (Mtr)', 'ARUS (A) - R', 'ARUS (A) - S', 'ARUS (A) - T', 'ARUS (A) - N', 'TEGANGAN (VOLT) - R-S', 'TEGANGAN (VOLT) - R-T', 'TEGANGAN (VOLT) - S-T', 'TEGANGAN (VOLT) - R-N', 'TEGANGAN (VOLT) - S-N', 'TEGANGAN (VOLT) - T-N', 'TEGANGAN UJUNG (VOLT) - R-S', 'TEGANGAN UJUNG (VOLT) - R-T', 'TEGANGAN UJUNG (VOLT) - S-T', 'TEGANGAN UJUNG (VOLT) - R-N', 'TEGANGAN UJUNG (VOLT) - S-N', 'TEGANGAN UJUNG (VOLT) - T-N', 'DAYA (kVA)', 'Pemakaian (%)', 'I rata-rata (A)', 'Unbalanced (%)', 'KET']
    },
    'GDG': {
        columns: ['KODE GARDU', 'DATA GARDU - JENIS', 'DATA GARDU - ALAMAT', 'DATA GARDU - PENYULANG', 'DATA GARDU - DAYA KVA', 'DATA GARDU - MERK', 'DATA GARDU - KONDISI', 'DATA GARDU - NO. SERI', 'DATA GARDU - TAHUN', 'DATA GARDU - ARUS (A) HV - HV', 'DATA GARDU - ARUS (A) HV - LV', 'DATA GARDU - TEGANGAN - HV (KV)', 'DATA GARDU - TEGANGAN - LV (V)', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - KABEL INDUK', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - OUT GOING', 'SAL.JTR', 'JURUSAN', 'ARUS (A) - R', 'ARUS (A) - S', 'ARUS (A) - T', 'ARUS (A) - N', 'TEGANGAN (VOLT) - R-S', 'TEGANGAN (VOLT) - R-T', 'TEGANGAN (VOLT) - S-T', 'TEGANGAN (VOLT) - R-N', 'TEGANGAN (VOLT) - S-N', 'TEGANGAN (VOLT) - T-N', 'TEGANGAN UJUNG (VOLT) - R-S', 'TEGANGAN UJUNG (VOLT) - R-T', 'TEGANGAN UJUNG (VOLT) - S-T', 'TEGANGAN UJUNG (VOLT) - R-N', 'TEGANGAN UJUNG (VOLT) - S-N', 'TEGANGAN UJUNG (VOLT) - T-N', 'DAYA (kVA)', 'Pemakaian (%)', 'I rata-rata (A)', 'Unbalanced (%)', 'KET']
    },
    'PLB': {
        columns: ['NO. KODE GARDU', 'DATA GARDU - JENIS', 'DATA GARDU - ALAMAT', 'PENYULANG', 'DATA TRAFO - DAYA KVA', 'DATA TRAFO - MERK', 'DATA TRAFO - KONDISI', 'DATA TRAFO - NO. SERI', 'DATA TRAFO - TAHUN', 'DATA TRAFO - ARUS (A) - HV', 'DATA TRAFO - ARUS (A) - LV', 'DATA TRAFO - TEGANGAN - HV (KV)', 'DATA TRAFO - TEGANGAN - LV (V)', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - KABEL INDUK', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - OUT GOING', 'JENIS PENAMPANG (mm²) - SAL.JTR', 'JURUSAN', 'PANJ. SAL. (Mtr)', 'ARUS (A) - R', 'ARUS (A) - S', 'ARUS (A) - T', 'ARUS (A) - N', 'TEGANGAN (VOLT) - R-S', 'TEGANGAN (VOLT) - R-T', 'TEGANGAN (VOLT) - S-T', 'TEGANGAN (VOLT) - R-N', 'TEGANGAN (VOLT) - S-N', 'TEGANGAN (VOLT) - T-N', 'TEGANGAN UJUNG (VOLT) - R-S', 'TEGANGAN UJUNG (VOLT) - R-T', 'TEGANGAN UJUNG (VOLT) - S-T', 'TEGANGAN UJUNG (VOLT) - R-N', 'TEGANGAN UJUNG (VOLT) - S-N', 'TEGANGAN UJUNG (VOLT) - T-N', 'DAYA (kVA)', 'Pemakaian (%)', 'I rata-rata (A)', 'Unbalanced (%)', 'KET']
    },
    'BRN': {
        columns: ['NO. KODE GARDU', 'DATA GARDU - JENIS', 'DATA GARDU - ALAMAT', 'PENYULANG', 'DATA TRAFO - DAYA KVA', 'DATA TRAFO - MERK', 'DATA TRAFO - KONDISI', 'DATA TRAFO - NO. SERI', 'DATA TRAFO - TAHUN', 'DATA TRAFO - ARUS (A) - HV', 'DATA TRAFO - ARUS (A) - LV', 'DATA TRAFO - TEGANGAN - HV (KV)', 'DATA TRAFO - TEGANGAN - LV (V)', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - KABEL INDUK', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - OUT GOING', 'JENIS PENAMPANG (mm²) - SAL.JTR', 'JURUSAN', 'PANJ. SAL. (Mtr)', 'ARUS (A) - R', 'ARUS (A) - S', 'ARUS (A) - T', 'ARUS (A) - N', 'TEGANGAN (VOLT) - R-S', 'TEGANGAN (VOLT) - R-T', 'TEGANGAN (VOLT) - S-T', 'TEGANGAN (VOLT) - R-N', 'TEGANGAN (VOLT) - S-N', 'TEGANGAN (VOLT) - T-N', 'TEGANGAN UJUNG (VOLT) - R-S', 'TEGANGAN UJUNG (VOLT) - R-T', 'TEGANGAN UJUNG (VOLT) - S-T', 'TEGANGAN UJUNG (VOLT) - R-N', 'TEGANGAN UJUNG (VOLT) - S-N', 'TEGANGAN UJUNG (VOLT) - T-N', 'DAYA (kVA)', 'Pemakaian (%)', 'I rata-rata (A)', 'Unbalanced (%)', 'KET']
    },
    'MTG': {
        columns: ['NO. KODE GARDU', 'DATA GARDU - ALAMAT', 'PENYULANG', 'DATA TRAFO - DAYA KVA', 'DATA TRAFO - TAHUN', 'JURUSAN', 'ARUS (A) - R', 'ARUS (A) - S', 'ARUS (A) - T', 'ARUS (A) - N', 'TEGANGAN (VOLT) - R-S', 'TEGANGAN (VOLT) - R-T', 'TEGANGAN (VOLT) - S-T', 'TEGANGAN (VOLT) - R-N', 'TEGANGAN (VOLT) - S-N', 'TEGANGAN (VOLT) - T-N', 'TEGANGAN UJUNG (VOLT) - R-S', 'TEGANGAN UJUNG (VOLT) - R-T', 'TEGANGAN UJUNG (VOLT) - S-T', 'TEGANGAN UJUNG (VOLT) - R-N', 'TEGANGAN UJUNG (VOLT) - S-N', 'TEGANGAN UJUNG (VOLT) - T-N', 'DAYA (kVA)', 'Pemakaian (%)', 'I rata-rata (A)', 'Unbalanced (%)', 'KET']
    },
    'TKN': {
        columns: ['KODE GARDU', 'DATA GARDU - ALAMAT', 'PENYULANG', 'DATA TRAFO - DAYA KVA', 'DATA TRAFO - MERK', 'DATA TRAFO - KONDISI', 'DATA TRAFO - NO. SERI', 'DATA TRAFO - TAHUN', 'DATA TRAFO - ARUS (A) - HV', 'DATA TRAFO - ARUS (A) - LV', 'DATA TRAFO - TEGANGAN - HV (KV)', 'DATA TRAFO - TEGANGAN - LV (V)', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - KABEL INDUK', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - OUT GOING', 'JENIS PENAMPANG (mm²) - SAL.JTR', 'JURUSAN', 'PANJ. SAL. (Mtr)', 'ARUS (A) - R', 'ARUS (A) - S', 'ARUS (A) - T', 'ARUS (A) - N', 'TEGANGAN (VOLT) - R-S', 'TEGANGAN (VOLT) - R-T', 'TEGANGAN (VOLT) - S-T', 'TEGANGAN (VOLT) - R-N', 'TEGANGAN (VOLT) - S-N', 'TEGANGAN (VOLT) - T-N', 'TEGANGAN UJUNG (VOLT) - R-S', 'TEGANGAN UJUNG (VOLT) - R-T', 'TEGANGAN UJUNG (VOLT) - S-T', 'TEGANGAN UJUNG (VOLT) - R-N', 'TEGANGAN UJUNG (VOLT) - S-N', 'TEGANGAN UJUNG (VOLT) - T-N', 'DAYA (kVA)', 'Pemakaian (%)', 'I rata-rata (A)', 'Unbalanced (%)', 'KET']
    },
    'LSK': {
        columns: ['NO. KODE GARDU', 'DATA GARDU - JENIS', 'DATA GARDU - ALAMAT', 'PENYULANG', 'DATA TRAFO - DAYA KVA', 'DATA TRAFO - MERK', 'DATA TRAFO - KONDISI', 'DATA TRAFO - NO. SERI', 'DATA TRAFO - TAHUN', 'DATA TRAFO - ARUS (A) - HV', 'DATA TRAFO - ARUS (A) - LV', 'DATA TRAFO - TEGANGAN - HV (KV)', 'DATA TRAFO - TEGANGAN - LV (V)', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - KABEL INDUK', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - OUT GOING', 'JENIS PENAMPANG (mm²) - SAL.JTR', 'JURUSAN', 'PANJ. SAL. (Mtr)', 'ARUS (A) - R', 'ARUS (A) - S', 'ARUS (A) - T', 'ARUS (A) - N', 'TEGANGAN (VOLT) - R-S', 'TEGANGAN (VOLT) - R-T', 'TEGANGAN (VOLT) - S-T', 'TEGANGAN (VOLT) - R-N', 'TEGANGAN (VOLT) - S-N', 'TEGANGAN (VOLT) - T-N', 'TEGANGAN UJUNG (VOLT) - R-S', 'TEGANGAN UJUNG (VOLT) - R-T', 'TEGANGAN UJUNG (VOLT) - S-T', 'TEGANGAN UJUNG (VOLT) - R-N', 'TEGANGAN UJUNG (VOLT) - S-N', 'TEGANGAN UJUNG (VOLT) - T-N', 'DAYA (kVA)', 'Pemakaian (%)', 'I rata-rata (A)', 'Unbalanced (%)', 'KET']
    },
    'JNT': {
        columns: ['NO. KODE GARDU', 'DATA GARDU - JENIS', 'DATA GARDU - ALAMAT', 'PENYULANG', 'DATA TRAFO - DAYA KVA', 'DATA TRAFO - MERK', 'DATA TRAFO - KONDISI', 'DATA TRAFO - NO. SERI', 'DATA TRAFO - TAHUN', 'DATA TRAFO - ARUS (A) - HV', 'DATA TRAFO - ARUS (A) - LV', 'DATA TRAFO - TEGANGAN - HV (KV)', 'DATA TRAFO - TEGANGAN - LV (V)', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - KABEL INDUK', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - OUT GOING', 'JENIS PENAMPANG (mm²) - SAL.JTR', 'JURUSAN', 'PANJ. SAL. (Mtr)', 'ARUS (A) - R', 'ARUS (A) - S', 'ARUS (A) - T', 'ARUS (A) - N', 'TEGANGAN (VOLT) - R-S', 'TEGANGAN (VOLT) - R-T', 'TEGANGAN (VOLT) - S-T', 'TEGANGAN (VOLT) - R-N', 'TEGANGAN (VOLT) - S-N', 'TEGANGAN (VOLT) - T-N', 'TEGANGAN UJUNG (VOLT) - R-S', 'TEGANGAN UJUNG (VOLT) - R-T', 'TEGANGAN UJUNG (VOLT) - S-T', 'TEGANGAN UJUNG (VOLT) - R-N', 'TEGANGAN UJUNG (VOLT) - S-N', 'TEGANGAN UJUNG (VOLT) - T-N', 'DAYA (kVA)', 'Pemakaian (%)', 'I rata-rata (A)', 'Unbalanced (%)', 'KET']
    },
    'GDP': {
        columns: ['NO. KODE GARDU', 'DATA GARDU - JENIS', 'DATA GARDU - ALAMAT', 'PENYULANG', 'DATA TRAFO - DAYA KVA', 'DATA TRAFO - KOORDINAT - LONG', 'DATA TRAFO - KOORDINAT - LAT', 'DATA TRAFO - MERK', 'DATA TRAFO - KONDISI', 'DATA TRAFO - NO. SERI', 'DATA TRAFO - TAHUN', 'DATA TRAFO - ARUS (A) - HV', 'DATA TRAFO - ARUS (A) - LV', 'DATA TRAFO - TEGANGAN - HV (KV)', 'DATA TRAFO - TEGANGAN - LV (V)', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - KABEL INDUK', 'JENIS PENAMPANG (mm²) - OPSTIQ KABEL - OUT GOING', 'JENIS PENAMPANG (mm²) - SAL.JTR', 'JURUSAN', 'PANJ. SAL. (Mtr)', 'ARUS (A) - R', 'ARUS (A) - S', 'ARUS (A) - T', 'ARUS (A) - N', 'TEGANGAN (VOLT) - R-S', 'TEGANGAN (VOLT) - R-T', 'TEGANGAN (VOLT) - S-T', 'TEGANGAN (VOLT) - R-N', 'TEGANGAN (VOLT) - S-N', 'TEGANGAN (VOLT) - T-N', 'TEGANGAN UJUNG (VOLT) - R-S', 'TEGANGAN UJUNG (VOLT) - R-T', 'TEGANGAN UJUNG (VOLT) - S-T', 'TEGANGAN UJUNG (VOLT) - R-N', 'TEGANGAN UJUNG (VOLT) - S-N', 'TEGANGAN UJUNG (VOLT) - T-N', 'DAYA (kVA)', 'Pemakaian (%)', 'I rata-rata (A)', 'Unbalanced (%)', 'KET']
    },
    'SML': {
        columns: ['KODE GARDU', 'DATA GARDU - JENIS', 'DATA GARDU - ALAMAT', 'PENYULANG', 'DATA TRAFO - DAYA KVA', 'DATA TRAFO - PHS (Ø)', 'DATA TRAFO - MERK', 'DATA TRAFO - NO. SERI', 'DATA TRAFO - THN', 'DATA TRAFO - KONDISI', 'DATA TRAFO - ARUS (A) - HV', 'DATA TRAFO - ARUS (A) - LV', 'DATA TRAFO - TEGANGAN - HV (KV)', 'DATA TRAFO - TEGANGAN - LV (V)', 'JENIS PENAMPANG (MM²) - OPSTIQ KABEL - KABEL INDUK', 'JENIS PENAMPANG (MM²) - OPSTIQ KABEL - OUT GOING', 'JENIS PENAMPANG (MM²) - SAL.JTR', 'JURUSAN', 'PANJ. SAL. (Mtr)', 'DATA HASIL PENGUKURAN ARUS (A) - R', 'DATA HASIL PENGUKURAN ARUS (A) - S', 'DATA HASIL PENGUKURAN ARUS (A) - T', 'DATA HASIL PENGUKURAN ARUS (A) - N', 'DATA HASIL PENGUKURAN - TEGANGAN (VOLT) - R-S', 'DATA HASIL PENGUKURAN - TEGANGAN (VOLT) - R-T', 'DATA HASIL PENGUKURAN - TEGANGAN (VOLT) - S-T', 'DATA HASIL PENGUKURAN - TEGANGAN (VOLT) - R-N', 'DATA HASIL PENGUKURAN - TEGANGAN (VOLT) - S-N', 'DATA HASIL PENGUKURAN - TEGANGAN (VOLT) - T-N', 'TEGANGAN UJUNG TR (VOLT) - R-S', 'TEGANGAN UJUNG TR (VOLT) - R-T', 'TEGANGAN UJUNG TR (VOLT) - S-T', 'TEGANGAN UJUNG TR (VOLT) - R-N', 'TEGANGAN UJUNG TR (VOLT) - S-N', 'TEGANGAN UJUNG TR (VOLT) - T-N', 'DAYA (kVA)', 'Pemakaian (%)', 'I rata-rata (A)', 'Unbalanced (%)', 'KET']
    }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    initTabNavigation();
    initKoordinatHandlers();
    initPemakaianHandlers();
    initModalHandlers();
    
    // Load data awal
    loadDataKoordinat();
});

// ===== TAB NAVIGATION =====
function initTabNavigation() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab button
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById('tab-' + tabName).classList.add('active');
            
            // Load data if needed
            if (tabName === 'pemakaian' && currentDataPemakaian.length === 0) {
                loadDataPemakaian();
            }
        });
    });
}

// ===== KOORDINAT FUNCTIONS =====
function initKoordinatHandlers() {
    document.getElementById('btnRefreshKoordinat').addEventListener('click', loadDataKoordinat);
    document.getElementById('btnExportKoordinat').addEventListener('click', exportKoordinat);
    document.getElementById('btnTambahKoordinat').addEventListener('click', () => openModalKoordinat('add'));
    document.getElementById('search-koordinat').addEventListener('input', function() {
        filterKoordinat(this.value);
    });
    document.getElementById('formKoordinat').addEventListener('submit', function(e) {
        e.preventDefault();
        saveKoordinat();
    });
}

function loadDataKoordinat() {
    const tbody = document.getElementById('tbody-koordinat');
    tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>';
    
    fetch(`${API_KOORDINAT}?action=read`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                allDataKoordinat = data.data || [];
                currentDataKoordinat = [...allDataKoordinat];
                renderTableKoordinat();
                updateStatsKoordinat();
                showNotification('Data koordinat berhasil dimuat', 'success');
            } else {
                showNotification('Gagal memuat data: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Terjadi kesalahan: ' + error.message, 'error');
            tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px; color: var(--pln-red);"><i class="fas fa-exclamation-triangle"></i> Gagal memuat data</td></tr>';
        });
}

function renderTableKoordinat() {
    const tbody = document.getElementById('tbody-koordinat');
    tbody.innerHTML = '';
    
    if (currentDataKoordinat.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px;">Tidak ada data</td></tr>';
        return;
    }
    
    currentDataKoordinat.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${row.nama_gardu || ''}</td>
            <td>${row.fasa_trafo || ''}</td>
            <td>${row.jenis_traf || ''}</td>
            <td>${row.kapasitas || ''}</td>
            <td>${row.tap_change || ''}</td>
            <td>${row.th_buat || ''}</td>
            <td>${row.penyulang || ''}</td>
            <td>${row.latitudey || ''}</td>
            <td>${row.longitudex || ''}</td>
            <td class="action-buttons">
                <button class="btn btn-outline btn-small" onclick="editKoordinat('${row.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="showDeleteModal('koordinat', '${row.id}')" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterKoordinat(searchTerm) {
    if (!searchTerm) {
        currentDataKoordinat = [...allDataKoordinat];
    } else {
        const term = searchTerm.toLowerCase();
        currentDataKoordinat = allDataKoordinat.filter(item => 
            (item.nama_gardu && item.nama_gardu.toLowerCase().includes(term)) ||
            (item.penyulang && item.penyulang.toLowerCase().includes(term)) ||
            (item.kapasitas && item.kapasitas.toString().includes(term))
        );
    }
    renderTableKoordinat();
}

function updateStatsKoordinat() {
    document.getElementById('total-koordinat').textContent = allDataKoordinat.length;
    const now = new Date();
    document.getElementById('last-updated-koordinat').textContent = 
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function openModalKoordinat(mode, id = null) {
    const modal = document.getElementById('modalKoordinat');
    const title = document.getElementById('modalTitleKoordinat');
    const form = document.getElementById('formKoordinat');
    
    form.reset();
    
    if (mode === 'add') {
        title.textContent = 'Tambah Data Gardu';
        document.getElementById('edit-id-koordinat').value = '';
    } else {
        title.textContent = 'Edit Data Gardu';
        const data = allDataKoordinat.find(item => item.id == id);
        if (data) {
            document.getElementById('edit-id-koordinat').value = data.id;
            document.getElementById('nama_gardu').value = data.nama_gardu || '';
            document.getElementById('fasa_trafo').value = data.fasa_trafo || '';
            document.getElementById('jenis_traf').value = data.jenis_traf || '';
            document.getElementById('kapasitas').value = data.kapasitas || '';
            document.getElementById('tap_change').value = data.tap_change || '';
            document.getElementById('th_buat').value = data.th_buat || '';
            document.getElementById('penyulang').value = data.penyulang || '';
            document.getElementById('latitudey').value = data.latitudey || '';
            document.getElementById('longitudex').value = data.longitudex || '';
        }
    }
    
    modal.style.display = 'flex';
}

async function saveKoordinat() {
    const id = document.getElementById('edit-id-koordinat').value;
    const isEdit = !!id;
    
    const formData = {
        action: isEdit ? 'update' : 'create',
        nama_gardu: document.getElementById('nama_gardu').value,
        fasa_trafo: document.getElementById('fasa_trafo').value,
        jenis_traf: document.getElementById('jenis_traf').value,
        kapasitas: document.getElementById('kapasitas').value,
        tap_change: document.getElementById('tap_change').value,
        th_buat: document.getElementById('th_buat').value,
        penyulang: document.getElementById('penyulang').value,
        latitudey: document.getElementById('latitudey').value,
        longitudex: document.getElementById('longitudex').value
    };
    
    if (isEdit) formData.id = id;
    
    console.log('Sending data koordinat:', formData);
    
    try {
        const response = await fetch(API_KOORDINAT, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.log('Response bukan JSON, assuming success');
            data = { success: true };
        }
        
        if (data.success !== false) {
            showNotification(isEdit ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan', 'success');
            document.getElementById('modalKoordinat').style.display = 'none';
            setTimeout(() => loadDataKoordinat(), 500);
        } else {
            showNotification('Gagal menyimpan: ' + (data.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan saat menyimpan: ' + error.message, 'error');
    }
}

function exportKoordinat() {
    if (allDataKoordinat.length === 0) {
        showNotification('Tidak ada data untuk diekspor', 'warning');
        return;
    }
    
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Nama Gardu,Fasa Trafo,Jenis Trafo,Kapasitas,Tap Change,Tahun Buat,Penyulang,Latitude,Longitude\n";
    
    allDataKoordinat.forEach(item => {
        csv += `"${item.nama_gardu || ''}","${item.fasa_trafo || ''}","${item.jenis_traf || ''}","${item.kapasitas || ''}","${item.tap_change || ''}","${item.th_buat || ''}","${item.penyulang || ''}","${item.latitudey || ''}","${item.longitudex || ''}"\n`;
    });
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "data_koordinat_gardu.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Data berhasil diekspor', 'success');
}

window.editKoordinat = function(id) {
    openModalKoordinat('edit', id);
};

// ===== PEMAKAIAN FUNCTIONS =====
function initPemakaianHandlers() {
    document.getElementById('btnRefreshPemakaian').addEventListener('click', loadDataPemakaian);
    document.getElementById('btnExportPemakaian').addEventListener('click', exportPemakaian);
    document.getElementById('btnTambahPemakaian').addEventListener('click', () => openModalPemakaian('add'));
    
    document.querySelectorAll('.sheet-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sheet-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            currentGid = this.getAttribute('data-gid');
            currentSheetName = this.getAttribute('data-name');
            document.getElementById('current-ulp').textContent = currentSheetName;
            loadDataPemakaian();
        });
    });
    
    document.getElementById('formPemakaian').addEventListener('submit', function(e) {
        e.preventDefault();
        savePemakaian();
    });
}

async function loadDataPemakaian() {
    const tbody = document.getElementById('tbody-pemakaian');
    const thead = document.getElementById('thead-pemakaian');
    
    tbody.innerHTML = '<tr><td colspan="50" style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>';

    try {
        const data = await gvizFetch(SPREADSHEET_PEMAKAIAN, currentGid);
        const rows = data.table.rows;
        
        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="50" style="text-align: center; padding: 20px;">Tidak ada data</td></tr>';
            return;
        }

        const sheetConfig = SHEET_CONFIGS[currentSheetName];
        const headers = sheetConfig.columns;
        
        let headerHtml = '<tr><th>No</th>';
        headers.forEach(header => {
            headerHtml += `<th>${header}</th>`;
        });
        headerHtml += '<th>Aksi</th></tr>';
        thead.innerHTML = headerHtml;

        let bodyHtml = '';
        currentDataPemakaian = [];
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.c;
            const rowData = {};
            
            bodyHtml += `<tr><td>${i + 1}</td>`;
            
            for (let j = 0; j < headers.length; j++) {
                const cellIndex = j + 2;
                const value = cells[cellIndex]?.v || '';
                rowData[`col_${j}`] = value;
                
                if (headers[j].includes('Pemakaian (%)')) {
                    const pemakaian = parseFloat(value) || 0;
                    let statusClass = 'status-normal';
                    let statusText = 'Normal';
                    
                    if (pemakaian > 80) {
                        statusClass = 'status-high';
                        statusText = 'Tinggi';
                    } else if (pemakaian > 50) {
                        statusClass = 'status-medium';
                        statusText = 'Sedang';
                    }
                    
                    bodyHtml += `<td><span class="status-badge ${statusClass}">${value}% ${statusText}</span></td>`;
                } else {
                    bodyHtml += `<td>${value}</td>`;
                }
            }
            
            rowData.rowIndex = i + 1;
            currentDataPemakaian.push(rowData);
            
            bodyHtml += `
                <td class="action-buttons">
                    <button class="btn btn-outline btn-small" onclick="editPemakaian(${i})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-small" onclick="showDeleteModal('pemakaian', ${i})" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }
        
        tbody.innerHTML = bodyHtml;
        document.getElementById('total-pemakaian').textContent = currentDataPemakaian.length;
        document.getElementById('current-ulp').textContent = currentSheetName;
        showNotification('Data pemakaian berhasil dimuat', 'success');
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="50" style="text-align: center; padding: 20px; color: var(--pln-red);"><i class="fas fa-exclamation-triangle"></i> Gagal memuat data</td></tr>';
        showNotification('Gagal memuat data pemakaian', 'error');
    }
}

function openModalPemakaian(mode, dataIndex = null) {
    const modal = document.getElementById('modalPemakaian');
    const title = document.getElementById('modalTitlePemakaian');
    const formFields = document.getElementById('formFieldsPemakaian');
    
    const headers = SHEET_CONFIGS[currentSheetName].columns;
    
    if (mode === 'add') {
        title.textContent = `Tambah Data ${currentSheetName}`;
        document.getElementById('editRowIndex').value = '';
        document.getElementById('editGid').value = '';
        document.getElementById('originalKodeGardu').value = '';
    } else {
        title.textContent = `Edit Data ${currentSheetName}`;
        const rowData = currentDataPemakaian[dataIndex];
        document.getElementById('editRowIndex').value = rowData.rowIndex;
        document.getElementById('editGid').value = currentGid;
        document.getElementById('originalKodeGardu').value = rowData.col_0;
    }
    
    let fieldsHtml = '';
    headers.forEach((header, index) => {
        const fieldId = `field_${index}`;
        const value = mode === 'edit' ? (currentDataPemakaian[dataIndex][`col_${index}`] || '') : '';
        
        fieldsHtml += `
            <div class="form-group">
                <label for="${fieldId}">${header}</label>
                <input type="text" id="${fieldId}" name="${fieldId}" value="${value}">
            </div>
        `;
    });
    
    formFields.innerHTML = fieldsHtml;
    modal.style.display = 'flex';
}

async function savePemakaian() {
    const form = document.getElementById('formPemakaian');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    submitBtn.disabled = true;

    try {
        const headers = SHEET_CONFIGS[currentSheetName].columns;
        const values = {};
        
        headers.forEach((header, index) => {
            const fieldId = `field_${index}`;
            const fieldValue = document.getElementById(fieldId).value;
            values[`col_${index}`] = fieldValue;
        });

        const rowIndex = document.getElementById('editRowIndex').value;
        const action = rowIndex ? 'update' : 'create';
        
        const requestData = {
            action: action,
            spreadsheetId: SPREADSHEET_PEMAKAIAN,
            gid: currentGid,
            sheetName: currentSheetName,
            values: values
        };
        
        if (rowIndex) {
            requestData.rowIndex = parseInt(rowIndex);
            requestData.originalKodeGardu = document.getElementById('originalKodeGardu').value;
        }

        console.log('=== SAVE PEMAKAIAN ===');
        console.log('Action:', action);
        console.log('Row Index:', rowIndex);
        console.log('GID:', currentGid);
        console.log('Sheet Name:', currentSheetName);
        console.log('Original Kode Gardu:', requestData.originalKodeGardu);
        console.log('Values (first 3):', {
            col_0: values.col_0,
            col_1: values.col_1,
            col_2: values.col_2
        });
        console.log('Request data:', JSON.stringify(requestData, null, 2));

        const response = await fetch(API_PEMAKAIAN, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(requestData)
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
            console.log('Parsed result:', result);
        } catch (e) {
            console.log('Response bukan JSON, assuming success');
            result = { success: true };
        }

        if (result.success !== false) {
            showNotification(action === 'create' ? 'Data berhasil ditambahkan' : 'Data berhasil diperbarui', 'success');
            document.getElementById('modalPemakaian').style.display = 'none';
            
            // Tambahkan delay lebih lama untuk memastikan Google Sheets sudah update
            console.log('Waiting 2 seconds before reload...');
            setTimeout(() => {
                console.log('Reloading data...');
                loadDataPemakaian();
            }, 2000);
        } else {
            showNotification('Gagal menyimpan: ' + (result.message || 'Unknown error'), 'error');
        }

    } catch (error) {
        console.error('Error saving pemakaian:', error);
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function exportPemakaian() {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_PEMAKAIAN}/export?format=xlsx&gid=${currentGid}`;
    window.open(url, '_blank');
    showNotification('Mengunduh file Excel...', 'success');
}

window.editPemakaian = function(dataIndex) {
    openModalPemakaian('edit', dataIndex);
};

// ===== DELETE FUNCTIONS =====
function showDeleteModal(mode, id) {
    deleteMode = mode;
    dataToDelete = id;
    document.getElementById('modalHapus').style.display = 'flex';
}

window.showDeleteModal = showDeleteModal;

document.getElementById('confirm-delete').addEventListener('click', async function() {
    if (!dataToDelete || !deleteMode) return;
    
    try {
        if (deleteMode === 'koordinat') {
            const response = await fetch(API_KOORDINAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    id: dataToDelete
                })
            });
            
            const data = await response.json();
            if (data.success) {
                showNotification('Data berhasil dihapus', 'success');
                loadDataKoordinat();
            } else {
                showNotification('Gagal menghapus: ' + data.message, 'error');
            }
        } else if (deleteMode === 'pemakaian') {
            const rowIndex = currentDataPemakaian[dataToDelete].rowIndex;
            
            const response = await fetch(API_PEMAKAIAN, {
                method: 'POST',
                redirect: 'follow',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'delete',
                    spreadsheetId: SPREADSHEET_PEMAKAIAN,
                    gid: currentGid,
                    sheetName: currentSheetName,
                    rowIndex: rowIndex
                })
            });

            showNotification('Data berhasil dihapus', 'success');
            setTimeout(() => loadDataPemakaian(), 500);
        }
        
        document.getElementById('modalHapus').style.display = 'none';
        dataToDelete = null;
        deleteMode = null;
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan saat menghapus', 'error');
    }
});

// ===== MODAL HANDLERS =====
function initModalHandlers() {
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            document.getElementById(modalId).style.display = 'none';
        });
    });

    document.querySelectorAll('.btn-outline').forEach(btn => {
        if (btn.getAttribute('data-modal')) {
            btn.addEventListener('click', function() {
                const modalId = this.getAttribute('data-modal');
                document.getElementById(modalId).style.display = 'none';
            });
        }
    });

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// ===== UTILITY FUNCTIONS =====
function gvizFetch(sheetId, gid) {
    return new Promise((resolve, reject) => {
        const prev = window.google?.visualization?.Query?.setResponse;
        window.google = window.google || {};
        window.google.visualization = window.google.visualization || {};
        window.google.visualization.Query = window.google.visualization.Query || {};
        window.google.visualization.Query.setResponse = function(resp) {
            if (prev) window.google.visualization.Query.setResponse = prev;
            else delete window.google.visualization.Query.setResponse;
            resolve(resp);
        };
        const src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?gid=${gid}&tqx=out:json`;
        const s = document.createElement('script');
        s.src = src;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    notificationText.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}