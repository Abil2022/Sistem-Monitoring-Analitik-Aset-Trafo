// assets/js/api.js
// API Configuration dan Utility Functions

// API Configuration
const API_CONFIG = {
    KOORDINAT: "https://script.google.com/macros/s/AKfycbxoLLis3zdSQdm-4eDYgA9cvYY_uca-AwGeZNPYheb8YlSAl_M-nXWqrBScuJqTLKM/exec",
    PEMAKAIAN: "https://script.google.com/macros/s/AKfycbz7uCO8ZBz36ps_U-I4AJDz50V3IE3u5JlCAnVBfepAO_atAiWfe-b8mBgIAC0zp90/exec",
    SPREADSHEET_PEMAKAIAN: "11ZqsQ5YRNHRVrlLDHsP2OXbFzix6Lwh0JiTJZE5pgJI"
};

// ULP Configuration
const ULP_CONFIG = [
    { gid: "1549551008", name: "ULP LSM" },
    { gid: "1060726527", name: "ULP KRG" },
    { gid: "204082539",  name: "ULP GDG" },
    { gid: "1914134643", name: "ULP PLB" },
    { gid: "1417089420", name: "ULP BRN" },
    { gid: "558756175",  name: "ULP MTG" },
    { gid: "1145959992", name: "ULP TKN" },
    { gid: "1910307016", name: "ULP LSK" },
    { gid: "1749872034", name: "ULP JNT" },
    { gid: "310383650",  name: "ULP GDP" },
    { gid: "51144397",   name: "ULP SML" }
];

// Utility Functions
class Utils {
    static showNotification(message, type = 'success') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto hide
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static formatNumber(num) {
        return new Intl.NumberFormat('id-ID').format(num);
    }

    static formatPercentage(num) {
        return `${parseFloat(num).toFixed(1)}%`;
    }

    static normalizeKode(s) {
        return String(s || "")
            .normalize("NFKD")
            .toUpperCase()
            .replace(/-\d+$/, '')
            .replace(/[\s._-]+/g, "")
            .replace(/[^\w]/g, "");
    }

    static numComma(x) {
        if (x == null || x === "") return NaN;
        let s = String(x).trim()
            .replace(/\.(?=\d{3}\b)/g, '')
            .replace(/[^\d,.\-]/g, '')
            .replace(',', '.');
        return parseFloat(s);
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Session Management
class SessionManager {
    static set(key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
    }
    
    static get(key) {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }
    
    static remove(key) {
        sessionStorage.removeItem(key);
    }
    
    static clear() {
        sessionStorage.clear();
    }
    
    static isLoggedIn() {
        const session = this.get('plnSession');
        return session && session.isLoggedIn;
    }
    
    static requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    static logout() {
        this.clear();
        localStorage.removeItem('plnSession');
        window.location.href = 'login.html';
    }
}

// API Manager
class APIManager {
    constructor() {
        this.baseURL = window.location.origin;
    }

    async request(url, options = {}) {
        try {
            console.log('API Request:', url, options); // Debug
            
            // Tambahkan mode no-cors untuk Google Apps Script
            const requestOptions = {
                method: options.method || 'GET',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers
                },
                ...options
            };

            // Untuk Google Apps Script, gunakan method yang berbeda
            if (url.includes('script.google.com')) {
                requestOptions.method = 'POST';
                requestOptions.body = options.body || JSON.stringify(options.data || {});
                delete requestOptions.headers['Content-Type']; // Browser akan set otomatis
            }

            const response = await fetch(url, requestOptions);
            
            console.log('API Response status:', response.status); // Debug
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            console.log('API Response text:', text.substring(0, 200)); // Debug
            
            try {
                return JSON.parse(text);
            } catch {
                return { success: true, data: text };
            }
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    async get(url) {
        return this.request(url, { method: 'GET' });
    }
    
    async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async put(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }

    // Google Sheets specific methods
    async gvizFetch(sheetId, gid) {
        return new Promise((resolve, reject) => {
            console.log('Fetching from sheet:', sheetId, 'gid:', gid); // Debug
            
            const prev = window.google?.visualization?.Query?.setResponse;
            window.google = window.google || {};
            window.google.visualization = window.google.visualization || {};
            window.google.visualization.Query = window.google.visualization.Query || {};
            window.google.visualization.Query.setResponse = function(resp) {
                console.log('GViz Response received:', resp); // Debug
                if (prev) window.google.visualization.Query.setResponse = prev;
                else delete window.google.visualization.Query.setResponse;
                resolve(resp);
            };
            
            const src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?gid=${gid}&tqx=out:json`;
            console.log('GViz URL:', src); // Debug
            
            const s = document.createElement('script');
            s.src = src;
            s.onerror = () => {
                console.error('Script loading failed'); // Debug
                if (prev) window.google.visualization.Query.setResponse = prev;
                else delete window.google.visualization.Query.setResponse;
                reject(new Error("GViz load error"));
            };
            document.head.appendChild(s);
            
            // Timeout untuk mencegah infinite loading
            setTimeout(() => {
                if (!window.google.visualization.Query.setResponse) {
                    reject(new Error("GViz load timeout"));
                }
            }, 10000);
        });
    }

    gvizToRows(resp) {
        if (!resp || !resp.table) {
            console.warn('Invalid GViz response:', resp); // Debug
            return [];
        }
        
        const cols = (resp.table.cols || []).map(c => (c.label || c.id || "").trim().toLowerCase());
        const rows = resp.table.rows || [];
        
        console.log('GViz columns:', cols); // Debug
        console.log('GViz rows count:', rows.length); // Debug
        
        return rows.map(r => {
            const o = {};
            (r.c || []).forEach((cell, i) => {
                const key = cols[i] || `col_${i}`;
                let val = (cell && cell.v != null) ? cell.v : "";
                if (typeof val === "object" && cell && cell.f) val = cell.f;
                o[key] = (typeof val === "string") ? val.trim() : val;
            });
            return o;
        });
    }
}

// Modal Manager
class ModalManager {
    static show(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    static hide(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    static init() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });

        // Close modal with close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        });
    }
}

// Global instances
window.utils = Utils;
window.session = SessionManager;
window.api = new APIManager();
window.modal = ModalManager;
window.API_CONFIG = API_CONFIG;
window.ULP_CONFIG = ULP_CONFIG;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_CONFIG,
        ULP_CONFIG,
        Utils,
        SessionManager,
        APIManager,
        ModalManager
    };
}