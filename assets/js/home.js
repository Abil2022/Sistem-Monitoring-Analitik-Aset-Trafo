// assets/js/home.js

// Variabel untuk rotasi alert
let currentAlertIndex = 0;
let alertRotationInterval = null;
let allAlerts = []; // Menyimpan semua alert yang diambil dari localStorage

// --- Kode Asli Halaman Home ---
document.addEventListener('DOMContentLoaded', function() {
    animateStats();
    setupSmoothScrolling();
    setupCardEffects();
    updateStats();

    // Mulai rotasi alert saat halaman dimuat
    startAlertRotation();

    // Jika dashboard di tab lain memperbarui data, mulai ulang rotasi dari awal
    window.addEventListener('storage', (event) => {
        if (event.key === 'plnDashboardAlerts') {
            console.log("🔵 [Index] Mendeteksi perubahan alert dari tab lain. Memulai ulang rotasi...");
            startAlertRotation();
        }
    });
});

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target;
                const originalText = statNumber.textContent;
                
                let targetValue;
                if (originalText.includes(',')) {
                    targetValue = parseInt(originalText.replace(/,/g, ''));
                } else if (originalText.includes('%')) {
                    targetValue = parseFloat(originalText.replace('%', ''));
                } else {
                    targetValue = parseInt(originalText) || 0;
                }
                
                let currentValue = 0;
                const increment = targetValue / 50;
                
                const timer = setInterval(() => {
                    currentValue += increment;
                    if (currentValue >= targetValue) {
                        if (originalText.includes('%')) {
                            statNumber.textContent = targetValue.toFixed(1) + '%';
                        } else if (originalText.includes(',')) {
                            statNumber.textContent = targetValue.toLocaleString('id-ID');
                        } else {
                            statNumber.textContent = Math.round(targetValue);
                        }
                        clearInterval(timer);
                    } else {
                        if (originalText.includes('%')) {
                            statNumber.textContent = currentValue.toFixed(1) + '%';
                        } else {
                            statNumber.textContent = Math.round(currentValue);
                        }
                    }
                }, 30);
                
                observer.unobserve(statNumber);
            }
        });
    }, observerOptions);

    statNumbers.forEach(stat => {
        observer.observe(stat);
    });
}

function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function setupCardEffects() {
    document.querySelectorAll('.access-card, .feature-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

function updateStats() {
    const statElements = {
        totalGardu: document.getElementById('totalGardu'),
        activeGardu: document.getElementById('activeGardu'),
        dataSync: document.getElementById('dataSync'),
        monitoringStatus: document.getElementById('monitoringStatus')
    };
    
    if (statElements.monitoringStatus) {
        statElements.monitoringStatus.textContent = '24/7';
    }
}

/**
 * Fungsi utama untuk memulai atau memulai ulang rotasi alert.
 */
function startAlertRotation() {
    // Hentikan rotasi yang sedang berjalan
    if (alertRotationInterval) {
        clearInterval(alertRotationInterval);
    }

    const alertBanner = document.querySelector('.alert-banner');
    if (!alertBanner) return;

    // Baca seluruh daftar alert dari localStorage
    const storedAlerts = localStorage.getItem('plnDashboardAlerts');
    
    if (!storedAlerts) {
        alertBanner.style.display = 'none';
        allAlerts = [];
        return;
    }

    try {
        allAlerts = JSON.parse(storedAlerts);
        currentAlertIndex = 0; // Reset indeks ke awal

        if (!allAlerts || allAlerts.length === 0) {
            alertBanner.style.display = 'none';
            return;
        }

        // Jika hanya ada satu alert, tampilkan saja tanpa rotasi
        if (allAlerts.length === 1) {
            displayAlertAtIndex(0);
            return;
        }

        // Jika ada lebih dari satu alert, mulai rotasi
        console.log(`🔵 [Index] Memulai rotasi ${allAlerts.length} alert.`);
        displayAlertAtIndex(currentAlertIndex); // Tampilkan alert pertama

        // Atur interval untuk berganti alert setiap 5 detik
        alertRotationInterval = setInterval(() => {
            currentAlertIndex = (currentAlertIndex + 1) % allAlerts.length;
            displayAlertAtIndex(currentAlertIndex);
        }, 5000); // 5000 ms = 5 detik

    } catch (e) {
        console.error('Gagal mem-parsing alert dari localStorage:', e);
        alertBanner.style.display = 'none';
    }
}

/**
 * Fungsi untuk menampilkan alert pada indeks tertentu dengan animasi.
 * @param {number} index - Indeks alert di array `allAlerts` yang akan ditampilkan.
 */
function displayAlertAtIndex(index) {
    const alertBanner = document.querySelector('.alert-banner');
    if (!alertBanner || !allAlerts || allAlerts.length === 0) {
        return;
    }

    const alert = allAlerts[index];
    if (!alert) return;

    // Langkah 1: Animasi fade-out
    alertBanner.classList.add('updating');

    // Langkah 2: Tunggu animasi selesai, lalu ganti konten
    setTimeout(() => {
        let iconClass = 'fas fa-info-circle';
        if (alert.type === 'critical') {
            iconClass = 'fas fa-exclamation-triangle';
        } else if (alert.type === 'warning') {
            iconClass = 'fas fa-exclamation-circle';
        }
        
        alertBanner.querySelector('span').innerHTML = `<strong>${alert.title}:</strong> ${alert.message}`;
        alertBanner.querySelector('i').className = iconClass;
        
        // Langkah 3: Hapus kelas 'updating' untuk memicu animasi fade-in
        alertBanner.classList.remove('updating');
        alertBanner.className = 'alert-banner ' + alert.type;
        alertBanner.style.display = 'flex';

    }, 400); // Waktu tunggu harus sama dengan durasi CSS transition
}

window.syncStatsWithAlert = function(alertData) {
    if (!alertData) return;
    
    const statElements = {
        totalGardu: document.getElementById('totalGardu'),
        activeGardu: document.getElementById('activeGardu'),
        dataSync: document.getElementById('dataSync')
    };
    
    if (statElements.totalGardu && alertData.totalGardu) {
        statElements.totalGardu.textContent = utils.formatNumber(alertData.totalGardu);
    }
    
    if (statElements.activeGardu) {
        statElements.activeGardu.textContent = '11';
    }
    
    if (statElements.dataSync) {
        const syncPercentage = 98.5 + (Math.random() * 1.0);
        statElements.dataSync.textContent = syncPercentage.toFixed(1) + '%';
    }
};