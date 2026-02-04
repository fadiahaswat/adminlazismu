// --- IMPORT PERALATAN FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// [BARU] Import App Check
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";

// --- KONFIGURASI KUNCI RAHASIA (PASTE CONFIG ANDA DI SINI) ---
// PERINGATAN KEAMANAN: API Key ini bersifat publik dan seharusnya dibatasi melalui 
// Firebase Console > Project Settings > API restrictions untuk domain yang diizinkan
const firebaseConfig = {
  apiKey: "AIzaSyAWPIcS8h3kE6kJYBxjeVFdSprgrMzOFo8",
  authDomain: "lazismu-auth.firebaseapp.com",
  projectId: "lazismu-auth",
  storageBucket: "lazismu-auth.firebasestorage.app",
  messagingSenderId: "398570239500",
  appId: "1:398570239500:web:0b3e96109a4bf304ebe029"
};

// --- KONFIGURASI KEAMANAN ---
// Email yang diizinkan untuk login ke admin dashboard
const ALLOWED_ADMIN_EMAILS = [
    "lazismumuallimin@gmail.com",
    "ad.lazismumuallimin@gmail.com",
    "andiaqillahfadiahaswat@gmail.com"
];
const ALLOWED_ADMIN_EMAILS_LOWER = ALLOWED_ADMIN_EMAILS.map(email => email.toLowerCase());

// --- NYALAKAN APLIKASI ---
const app = initializeApp(firebaseConfig);

// [BARU] NYALAKAN APP CHECK (SATPAM RECAPTCHA)
let appCheck;
try {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LeXJmAsAAAAAJzjGF8E3oVbviXI_5BeEZYjy_hP'),
    isTokenAutoRefreshEnabled: true
  });
} catch (error) {
  console.warn("App Check initialization failed - continuing without App Check");
  // App Check gagal, tapi aplikasi tetap bisa jalan (optional security layer)
}

// --- NYALAKAN AUTH ---
const auth = getAuth(app);

// URL API GOOGLE SHEET (TETAP SAMA)
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec";

// Konstanta untuk button HTML (untuk konsistensi)
const BTN_LOGIN_GOOGLE_HTML = '<i class="fab fa-google"></i><span>Masuk dengan Google</span>';

// --- FUNGSI LOGIN (PINTU MASUK) ---
// Google Sign-In untuk admin yang terotorisasi
document.getElementById('btn-login-google').addEventListener('click', async () => {
    const errorMsg = document.getElementById('login-error');
    const btn = document.getElementById('btn-login-google');

    // Ubah tombol jadi loading
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;
    errorMsg.classList.add('hidden');
    errorMsg.classList.remove('flex');

    try {
        // Buat provider Google
        const provider = new GoogleAuthProvider();
        
        // Login dengan popup Google
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // VALIDASI KEAMANAN: Cek apakah email yang login adalah email admin yang diizinkan
        if (!ALLOWED_ADMIN_EMAILS_LOWER.includes(user.email.toLowerCase().trim())) {
            // Logout otomatis jika bukan admin yang diizinkan
            await signOut(auth);
            errorMsg.textContent = "Akses Ditolak! Hanya admin yang berwenang dapat login.";
            errorMsg.classList.remove('hidden');
            errorMsg.classList.add('flex');
            btn.innerHTML = BTN_LOGIN_GOOGLE_HTML;
            btn.disabled = false;
            return;
        }
        
        // Jika berhasil dan email diizinkan, nanti 'Pengamat' di bawah yang bekerja otomatis.
    } catch (error) {
        // Kalau gagal - Log error tanpa detail sensitif
        console.error("Login gagal");
        
        // Handle error yang lebih spesifik
        let errorMessage = "Gagal login dengan Google!";
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = "Login dibatalkan. Silakan coba lagi.";
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = "Popup diblokir browser. Izinkan popup untuk login.";
        }
        
        errorMsg.textContent = errorMessage;
        errorMsg.classList.remove('hidden');
        errorMsg.classList.add('flex');
        btn.innerHTML = BTN_LOGIN_GOOGLE_HTML;
        btn.disabled = false;
    }
});

// --- FUNGSI LOGOUT (KELUAR) ---
// Kita ganti fungsi logout lama Anda
window.logout = function() {
    signOut(auth).then(() => {
        location.reload();
    }).catch((error) => {
        console.error("Gagal logout", error);
    });
}

// --- SANG PENGAMAT (YANG BEKERJA OTOMATIS) ---
// Ini pengganti sessionStorage. Kode ini akan jalan sendiri ngecek status login.
onAuthStateChanged(auth, (user) => {
    const overlay = document.getElementById('login-overlay');
    const errorMsg = document.getElementById('login-error');
    
    if (user) {
        // VALIDASI KEAMANAN GANDA: Pastikan email user yang login adalah email admin yang diizinkan
        if (!ALLOWED_ADMIN_EMAILS_LOWER.includes(user.email.toLowerCase().trim())) {
            console.warn("Akses ditolak - email tidak sah");
            // Logout otomatis jika bukan admin yang diizinkan
            signOut(auth).then(() => {
                errorMsg.textContent = "Akses Ditolak! Hanya admin yang berwenang dapat mengakses dashboard ini.";
                errorMsg.classList.remove('hidden');
                errorMsg.classList.add('flex');
                overlay.classList.remove('hidden');
            }).catch((error) => {
                console.error("Gagal logout");
                // Tetap tampilkan pesan error meskipun logout gagal
                errorMsg.textContent = "Akses Ditolak! Hanya admin yang berwenang dapat mengakses dashboard ini.";
                errorMsg.classList.remove('hidden');
                errorMsg.classList.add('flex');
                overlay.classList.remove('hidden');
            });
            return;
        }
        
        // JIKA USER LOGIN (KUNCI COCOK) DAN EMAIL SESUAI
        console.log("Admin terautentikasi");
        overlay.classList.add('hidden'); // Buka gerbang (sembunyikan login)
        
        // Panggil fungsi ambil data Anda yang lama
        fetchData(); 
    } else {
        // JIKA TIDAK LOGIN / BELUM LOGIN
        console.log("Belum login");
        overlay.classList.remove('hidden'); // Tutup gerbang (munculkan login)
    }
});

// ================================================================
// BATAS SUCI: KODE DI BAWAH INI ADALAH KODE LAMA ANDA (VARIABLES, DST)
// JANGAN DIHAPUS, BIARKAN SAJA MENYAMBUNG DI BAWAH SINI
// ================================================================

// === SECURITY UTILITIES ===
/**
 * Fungsi untuk escape HTML special characters mencegah XSS attacks
 * @param {string} text - Text yang akan di-escape
 * @returns {string} - Text yang sudah aman dari XSS
 */
function escapeHtml(text) {
    if (text == null) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// === VARIABLES ===
// Safe DOM element retrieval with null checks
function safeGetElement(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`Element not found: ${id}`);
    return el;
}

const loadingEl = safeGetElement('admin-loading');
const tableWrapperEl = safeGetElement('admin-table-wrapper');
const tableBodyEl = safeGetElement('table-body');
const refreshButton = safeGetElement('refresh-button');
const refreshIcon = safeGetElement('refresh-icon');

// Statistik Elements
const statTotalEl = safeGetElement('admin-stat-total');
const statDonaturEl = safeGetElement('admin-stat-donatur');
const statHariIniEl = safeGetElement('admin-stat-hari-ini');
const statTertinggiEl = safeGetElement('admin-stat-tertinggi');
const statRataEl = safeGetElement('admin-stat-rata');
const statTipeEl = safeGetElement('admin-stat-tipe');

// Modal Elements
const alertModal = safeGetElement('alert-modal');
const confirmModal = safeGetElement('confirm-modal');
const editModal = safeGetElement('edit-modal');
const editForm = safeGetElement('edit-form');

// Filter & Paging Elements
const filterSearchEl = safeGetElement('filter-search');
const filterStatusEl = safeGetElement('filter-status'); 
const filterDateFromEl = safeGetElement('filter-date-from');
const filterDateToEl = safeGetElement('filter-date-to');
const filterJenisEl = safeGetElement('filter-jenis');
const filterMetodeEl = safeGetElement('filter-metode');
const filterApplyBtn = safeGetElement('filter-apply-button');
const filterResetBtn = safeGetElement('filter-reset-button');
const exportCsvBtn = safeGetElement('export-csv-button');
const paginationRowsEl = safeGetElement('pagination-rows');
const paginationInfoEl = safeGetElement('pagination-info');
const paginationPrevBtn = safeGetElement('pagination-prev');
const paginationNextBtn = safeGetElement('pagination-next');

// Data State
let allDonationData = [];
let filteredData = [];
let currentPage = 1;
let rowsPerPage = 50;
let confirmCallback = null;

// Chart instances
let trendChart = null;
let paymentChart = null;
let donationTypeChart = null;

const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

// === MODAL FUNCTIONS ===
function showModal(el) {
    if (!el) return;
    el.classList.remove('hidden');
    // Add accessibility
    el.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
        el.classList.remove('opacity-0');
        const content = el.querySelector('.modal-content');
        if (content) {
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }
    }, 10);
    // Focus trap for accessibility
    const firstFocusable = el.querySelector('button, input, select, textarea');
    if (firstFocusable) firstFocusable.focus();
}

function hideModal(el) {
    if (!el) return;
    el.classList.add('opacity-0');
    el.setAttribute('aria-hidden', 'true');
    const content = el.querySelector('.modal-content');
    if (content) {
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
    }
    setTimeout(() => el.classList.add('hidden'), 250);
}

function showAppAlert(msg, isError = false) {
    const title = safeGetElement('alert-modal-title');
    const message = safeGetElement('alert-modal-message');
    const iconContainer = safeGetElement('alert-icon-container');
    
    if (!title || !message || !iconContainer) return;
    
    title.textContent = isError ? "Terjadi Kesalahan" : "Berhasil";
    title.className = isError ? "text-xl font-black text-red-600 mb-2" : "text-xl font-black text-green-600 mb-2";
    message.textContent = msg;
    
    iconContainer.innerHTML = isError 
        ? `<div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto animate-bounce"><i class="fas fa-times"></i></div>`
        : `<div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto animate-bounce"><i class="fas fa-check"></i></div>`;
    
    showModal(alertModal);
    
    // Auto-close success messages after 3 seconds
    if (!isError) {
        setTimeout(() => hideModal(alertModal), 3000);
    }
}

function showAppConfirm(msg, callback) {
    const msgEl = safeGetElement('confirm-modal-message');
    if (!msgEl) return;
    msgEl.textContent = msg;
    confirmCallback = callback;
    showModal(confirmModal);
}

// Close Modal Listeners with null checks
const alertCloseBtn = safeGetElement('alert-modal-close');
const confirmCancelBtn = safeGetElement('confirm-modal-cancel');
const editDrawerCloseBtn = safeGetElement('edit-drawer-close');
const editDrawerCancelBtn = safeGetElement('edit-drawer-cancel');
const confirmOkBtn = safeGetElement('confirm-modal-ok');

if (alertCloseBtn) alertCloseBtn.onclick = () => hideModal(alertModal);
if (confirmCancelBtn) confirmCancelBtn.onclick = () => hideModal(confirmModal);
if (editDrawerCloseBtn) editDrawerCloseBtn.onclick = () => hideEditDrawer();
if (editDrawerCancelBtn) editDrawerCancelBtn.onclick = () => hideEditDrawer();
if (confirmOkBtn) confirmOkBtn.onclick = () => { 
    if (confirmCallback) confirmCallback(); 
    hideModal(confirmModal); 
};

// === EDIT DRAWER FUNCTIONS ===
function showEditDrawer() {
    const drawer = safeGetElement('edit-drawer');
    const backdrop = safeGetElement('edit-drawer-backdrop');
    
    if (!drawer) return;
    
    // Show backdrop
    if (backdrop) {
        backdrop.classList.remove('hidden');
        setTimeout(() => backdrop.classList.remove('opacity-0'), 10);
    }
    
    // Slide in drawer
    drawer.classList.remove('translate-x-full');
    drawer.setAttribute('aria-hidden', 'false');
    
    // Focus first input
    setTimeout(() => {
        const firstInput = drawer.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput) firstInput.focus();
    }, 300);
}

function hideEditDrawer() {
    const drawer = safeGetElement('edit-drawer');
    const backdrop = safeGetElement('edit-drawer-backdrop');
    
    if (!drawer) return;
    
    // Slide out drawer
    drawer.classList.add('translate-x-full');
    drawer.setAttribute('aria-hidden', 'true');
    
    // Hide backdrop
    if (backdrop) {
        backdrop.classList.add('opacity-0');
        setTimeout(() => backdrop.classList.add('hidden'), 300);
    }
}

// Close drawer when clicking backdrop
const editDrawerBackdrop = safeGetElement('edit-drawer-backdrop');
if (editDrawerBackdrop) {
    editDrawerBackdrop.addEventListener('click', hideEditDrawer);
}

// ESC key to close modals and keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC to close modals and drawer
    if (e.key === 'Escape') {
        if (alertModal && !alertModal.classList.contains('hidden')) hideModal(alertModal);
        if (confirmModal && !confirmModal.classList.contains('hidden')) hideModal(confirmModal);
        
        // Close drawer if open
        const drawer = safeGetElement('edit-drawer');
        if (drawer && !drawer.classList.contains('translate-x-full')) hideEditDrawer();
    }
    
    // Keyboard shortcuts (with Alt key to avoid browser conflicts)
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'r': // Alt+R to refresh
                e.preventDefault();
                if (refreshButton) refreshButton.click();
                break;
            case 'e': // Alt+E to export CSV
                e.preventDefault();
                if (exportCsvBtn) exportCsvBtn.click();
                break;
        }
    }
    
    // Ctrl/Cmd+F for search focus (override browser search)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (filterSearchEl) {
            filterSearchEl.focus();
            filterSearchEl.select();
        }
    }
});


// === CORE FUNCTIONS ===

async function fetchData() {
    if (!loadingEl || !tableWrapperEl || !refreshIcon) return;
    
    loadingEl.classList.remove('hidden');
    tableWrapperEl.classList.add('hidden');
    refreshIcon.classList.add('fa-spin');

    try {
        const response = await fetch(GAS_API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        if (result.status !== "success") throw new Error(result.message);
        
        allDonationData = result.data.sort((a, b) => b.row - a.row);
        populateFilterDropdowns(allDonationData);
        applyFilters();

    } catch (error) {
        console.error("Fetch error:", error);
        // Gunakan pesan error yang user-friendly, jangan expose raw error
        let errorMessage = "Tidak dapat memuat data. Periksa koneksi internet Anda.";
        
        // Hanya tampilkan error.message jika aman (tidak mengandung info sensitif)
        if (error.message && 
            !error.message.includes("6Le") && // ReCaptcha sitekey
            !error.message.includes("://") && // URLs/endpoints (protocol separator)
            error.message.length < 100) { // Hindari pesan error yang terlalu panjang
            errorMessage = "Gagal memuat data: " + error.message;
        }
        showAppAlert(errorMessage, true);
    } finally {
        loadingEl.classList.add('hidden');
        refreshIcon.classList.remove('fa-spin');
    }
}

async function verifyDonation(rowNumber) {
    // Tampilkan modal konfirmasi custom
    showAppConfirm("Verifikasi donasi ini? Pastikan dana sudah masuk.", async () => {
        try {
            const response = await fetch(GAS_API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: "verify", row: rowNumber })
            });
            const res = await response.json();
            if(res.status !== 'success') throw new Error(res.message);
            
            showAppAlert("Donasi berhasil diverifikasi!");
            fetchData(); // Reload data
        } catch (error) {
            console.error("Verification error:", error);
            // Gunakan pesan error yang user-friendly, jangan expose raw error
            let errorMessage = "Gagal memverifikasi. Coba lagi nanti.";
            
            // Hanya tampilkan error.message jika aman (tidak mengandung info sensitif)
            if (error.message && 
                !error.message.includes("6Le") && // ReCaptcha sitekey
                !error.message.includes("://") && // URLs/endpoints (protocol separator)
                error.message.length < 100) { // Hindari pesan error yang terlalu panjang
                errorMessage = "Gagal verifikasi: " + error.message;
            }
            showAppAlert(errorMessage, true);
        }
    });
}

function calculateStatistics(data) {
    if (!statTotalEl || !statDonaturEl || !statHariIniEl || !statTertinggiEl || !statRataEl || !statTipeEl) return;
    
    let total = 0;
    let count = data.length;
    let maxVal = 0;
    let todayTotal = 0;
    const todayStr = new Date().toDateString();
    
    const typeCounts = {};

    data.forEach(row => {
        const val = parseFloat(row.Nominal) || 0;
        total += val;
        if (val > maxVal) maxVal = val;
        
        if (new Date(row.Timestamp).toDateString() === todayStr) {
            todayTotal += val;
        }

        const type = row.JenisDonasi || 'Lainnya';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    let topType = '-';
    let topCount = 0;
    for (const [key, val] of Object.entries(typeCounts)) {
        if (val > topCount) {
            topCount = val;
            topType = key;
        }
    }

    const avgVal = count > 0 ? total / count : 0;

    // Animate number changes
    animateValue(statTotalEl, statTotalEl.textContent, formatter.format(total), 500);
    animateValue(statDonaturEl, statDonaturEl.textContent, count, 500);
    animateValue(statHariIniEl, statHariIniEl.textContent, formatter.format(todayTotal), 500);
    animateValue(statTertinggiEl, statTertinggiEl.textContent, formatter.format(maxVal), 500);
    animateValue(statRataEl, statRataEl.textContent, formatter.format(avgVal), 500);
    statTipeEl.textContent = topType;
}

// Helper function to animate number changes
function animateValue(element, start, end, duration) {
    if (!element) return;
    
    // If the values are the same, just set it
    if (start === end) {
        element.textContent = end;
        return;
    }
    
    // Simple animation for better UX
    element.style.transition = 'transform 0.3s ease';
    element.style.transform = 'scale(1.1)';
    setTimeout(() => {
        element.textContent = end;
        element.style.transform = 'scale(1)';
    }, 150);
}

// === CHARTS RENDERING ===

function renderTrendChart(data) {
    // Prepare data for last 30 days
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        last30Days.push({
            date: date,
            dateStr: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            total: 0
        });
    }
    
    // Aggregate data by date
    data.forEach(row => {
        const rowDate = new Date(row.Timestamp);
        rowDate.setHours(0, 0, 0, 0);
        
        const dayData = last30Days.find(d => d.date.getTime() === rowDate.getTime());
        if (dayData) {
            dayData.total += parseFloat(row.Nominal) || 0;
        }
    });
    
    const categories = last30Days.map(d => d.dateStr);
    const series = last30Days.map(d => d.total);
    
    const options = {
        series: [{
            name: 'Total Donasi',
            data: series
        }],
        chart: {
            type: 'area',
            height: 280,
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'Plus Jakarta Sans, sans-serif'
        },
        colors: ['#f97316'],
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        xaxis: {
            categories: categories,
            labels: {
                rotate: -45,
                rotateAlways: true,
                style: {
                    fontSize: '10px',
                    colors: '#94a3b8'
                }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return 'Rp ' + (value / 1000).toFixed(0) + 'k';
                },
                style: {
                    colors: '#94a3b8',
                    fontSize: '11px'
                }
            }
        },
        grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 4
        },
        tooltip: {
            y: {
                formatter: function (value) {
                    return formatter.format(value);
                }
            }
        }
    };
    
    if (trendChart) {
        trendChart.updateOptions(options);
    } else {
        trendChart = new ApexCharts(document.getElementById('trend-chart'), options);
        trendChart.render();
    }
}

function renderPaymentChart(data) {
    const paymentCounts = {};
    
    data.forEach(row => {
        const method = row.MetodePembayaran || 'Lainnya';
        paymentCounts[method] = (paymentCounts[method] || 0) + 1;
    });
    
    const labels = Object.keys(paymentCounts);
    const series = Object.values(paymentCounts);
    
    const options = {
        series: series,
        chart: {
            type: 'donut',
            height: 200,
            fontFamily: 'Plus Jakarta Sans, sans-serif'
        },
        labels: labels,
        colors: ['#10b981', '#3b82f6', '#f59e0b'],
        legend: {
            position: 'bottom',
            fontSize: '11px',
            labels: {
                colors: '#64748b'
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val.toFixed(0) + '%';
            },
            style: {
                fontSize: '11px',
                fontWeight: 'bold'
            }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#1e293b'
                        },
                        value: {
                            show: true,
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: '#f97316',
                            formatter: function (val) {
                                return val;
                            }
                        },
                        total: {
                            show: true,
                            label: 'Total',
                            fontSize: '12px',
                            color: '#64748b',
                            formatter: function (w) {
                                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                            }
                        }
                    }
                }
            }
        }
    };
    
    if (paymentChart) {
        paymentChart.updateOptions(options);
    } else {
        paymentChart = new ApexCharts(document.getElementById('payment-chart'), options);
        paymentChart.render();
    }
}

function renderDonationTypeChart(data) {
    const typeCounts = {};
    
    data.forEach(row => {
        const type = row.JenisDonasi || 'Lainnya';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const labels = Object.keys(typeCounts);
    const series = Object.values(typeCounts);
    
    const options = {
        series: series,
        chart: {
            type: 'donut',
            height: 200,
            fontFamily: 'Plus Jakarta Sans, sans-serif'
        },
        labels: labels,
        colors: ['#f97316', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'],
        legend: {
            position: 'bottom',
            fontSize: '11px',
            labels: {
                colors: '#64748b'
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val.toFixed(0) + '%';
            },
            style: {
                fontSize: '11px',
                fontWeight: 'bold'
            }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#1e293b'
                        },
                        value: {
                            show: true,
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: '#f97316',
                            formatter: function (val) {
                                return val;
                            }
                        },
                        total: {
                            show: true,
                            label: 'Total',
                            fontSize: '12px',
                            color: '#64748b',
                            formatter: function (w) {
                                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                            }
                        }
                    }
                }
            }
        }
    };
    
    if (donationTypeChart) {
        donationTypeChart.updateOptions(options);
    } else {
        donationTypeChart = new ApexCharts(document.getElementById('donation-type-chart'), options);
        donationTypeChart.render();
    }
}

function renderAllCharts(data) {
    renderTrendChart(data);
    renderPaymentChart(data);
    renderDonationTypeChart(data);
}

function renderTable() {
    if (!paginationRowsEl || !tableBodyEl || !tableWrapperEl || !paginationInfoEl || !paginationPrevBtn || !paginationNextBtn) return;
    
    rowsPerPage = parseInt(paginationRowsEl.value, 10) || 50;
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = filteredData.slice(start, end);

    tableBodyEl.innerHTML = '';
    
    if (filteredData.length === 0) {
        tableBodyEl.innerHTML = '<tr><td colspan="7" class="text-center py-16 text-slate-400"><div class="flex flex-col items-center gap-3"><i class="fas fa-inbox text-4xl opacity-20"></i><p class="font-bold">Tidak ada data ditemukan</p><p class="text-xs">Coba ubah filter pencarian Anda</p></div></td></tr>';
        tableWrapperEl.classList.remove('hidden');
        return;
    }
    
    tableWrapperEl.classList.remove('hidden');

    paginatedData.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition-colors group border-b border-slate-100";
        
        const dateObj = new Date(row.Timestamp);
        const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
        const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        // Logic Detail Donatur
        let detailInfo = '';
        let badgeTipe = 'bg-slate-100 text-slate-500';
        
        if (row.TipeDonatur === 'santri') {
            badgeTipe = 'bg-orange-100 text-orange-600';
            detailInfo = `<div class="text-xs text-slate-500 mt-0.5"><i class="fas fa-child"></i> ${escapeHtml(row.NamaSantri) || '-'}</div>`;
        } else if (row.TipeDonatur === 'alumni') {
            badgeTipe = 'bg-blue-100 text-blue-600';
            detailInfo = `<div class="text-xs text-slate-500 mt-0.5"><i class="fas fa-graduation-cap"></i> Angkatan ${escapeHtml(row.DetailAlumni) || '-'}</div>`;
        } else {
            detailInfo = `<div class="text-xs text-slate-500 mt-0.5">Umum</div>`;
        }

        let methodColor = 'bg-slate-100 text-slate-500';
        if(row.MetodePembayaran === 'QRIS') methodColor = 'bg-blue-50 text-blue-600 border-blue-100';
        if(row.MetodePembayaran === 'Transfer') methodColor = 'bg-purple-50 text-purple-600 border-purple-100';
        if(row.MetodePembayaran === 'Tunai') methodColor = 'bg-green-50 text-green-600 border-green-100';

        // Highlight Kode Unik
        const nominalVal = parseFloat(row.Nominal) || 0;
        let nominalHTML = formatter.format(nominalVal);
        if (nominalVal % 1000 !== 0 && row.MetodePembayaran !== 'Tunai') {
            nominalHTML = nominalHTML.replace(/(\d{3})(?=\D*$)/, '<span class="text-orange-500 border-b-2 border-orange-200 font-extrabold">$1</span>');
        }

        // Logic Status & Tombol Verifikasi
        const status = row.Status || "Belum Verifikasi";
        let statusBadge = '';
        let verifyBtnHTML = '';

        if (status === 'Terverifikasi') {
            statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200"><i class="fas fa-check-circle"></i> Verified</span>`;
        } else {
            statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200"><i class="fas fa-clock"></i> Pending</span>`;
            verifyBtnHTML = `<button class="verify-btn w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition flex items-center justify-center shadow-sm border border-green-100 mr-2" data-row="${escapeHtml(row.row)}" title="Verifikasi"><i class="fas fa-check text-xs"></i></button>`;
        }

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="block font-bold text-slate-700">${dateStr}</span>
                <span class="text-xs text-slate-400">${timeStr}</span>
            </td>
            <td class="px-6 py-4">
                <span class="font-bold text-slate-800 block">${escapeHtml(row.NamaDonatur) || 'Hamba Allah'}</span>
                <span class="text-xs text-slate-400 block">${escapeHtml(row.NoHP) || '-'}</span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${badgeTipe}">${escapeHtml(row.TipeDonatur) || 'Umum'}</span>
                <div class="text-xs font-semibold text-slate-600">${escapeHtml(row.JenisDonasi)}</div>
                ${detailInfo}
            </td>
            <td class="px-6 py-4 text-right">
                <span class="font-black text-slate-800 text-sm">${nominalHTML}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="px-2 py-1 rounded border text-[10px] font-bold uppercase ${methodColor}">${escapeHtml(row.MetodePembayaran) || '-'}</span>
            </td>
            <td class="px-6 py-4 text-center">
                ${statusBadge}
            </td>
            <td class="px-6 py-4 text-right whitespace-nowrap">
                <div class="flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="print-btn w-8 h-8 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-500 hover:text-white transition flex items-center justify-center mr-2 shadow-sm border border-purple-100" data-row="${escapeHtml(row.row)}" title="Cetak Kuitansi"><i class="fas fa-print text-xs"></i></button>

                    ${verifyBtnHTML}
                    <button class="edit-btn w-8 h-8 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition flex items-center justify-center mr-2" data-row="${escapeHtml(row.row)}" title="Edit"><i class="fas fa-pencil-alt text-xs"></i></button>
                    <button class="delete-btn w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition flex items-center justify-center" data-row="${escapeHtml(row.row)}" title="Hapus"><i class="fas fa-trash-alt text-xs"></i></button>
                </div>
            </td>
        `;
        tableBodyEl.appendChild(tr);
    });

    // Update Pagination Info with better formatting
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const showingStart = filteredData.length > 0 ? start + 1 : 0;
    const showingEnd = Math.min(end, filteredData.length);
    paginationInfoEl.textContent = `Menampilkan ${showingStart}-${showingEnd} dari ${filteredData.length} data`;
    paginationPrevBtn.disabled = currentPage === 1;
    paginationNextBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    // Add visual feedback for disabled buttons
    if (paginationPrevBtn.disabled) {
        paginationPrevBtn.classList.add('opacity-40', 'cursor-not-allowed');
    } else {
        paginationPrevBtn.classList.remove('opacity-40', 'cursor-not-allowed');
    }
    if (paginationNextBtn.disabled) {
        paginationNextBtn.classList.add('opacity-40', 'cursor-not-allowed');
    } else {
        paginationNextBtn.classList.remove('opacity-40', 'cursor-not-allowed');
    }
}

function populateFilterDropdowns(data) {
    const jenisSet = new Set();
    const metodeSet = new Set();
    data.forEach(row => {
        if (row.JenisDonasi) jenisSet.add(row.JenisDonasi);
        if (row.MetodePembayaran) metodeSet.add(row.MetodePembayaran);
    });
    filterJenisEl.innerHTML = '<option value="">Semua Jenis</option>';
    filterMetodeEl.innerHTML = '<option value="">Semua Metode</option>';
    jenisSet.forEach(val => filterJenisEl.add(new Option(val, val)));
    metodeSet.forEach(val => filterMetodeEl.add(new Option(val, val)));
}

function applyFilters() {
    if (!filterSearchEl || !filterStatusEl || !filterJenisEl || !filterMetodeEl || !filterDateFromEl || !filterDateToEl) return;
    
    const search = filterSearchEl.value.toLowerCase().trim();
    const status = filterStatusEl.value; 
    const jenis = filterJenisEl.value;
    const metode = filterMetodeEl.value;
    let from = filterDateFromEl.valueAsDate;
    let to = filterDateToEl.valueAsDate;
    
    // Proper date handling with timezone consideration
    if(from) {
        from = new Date(from);
        from.setHours(0,0,0,0);
    }
    if(to) {
        to = new Date(to);
        to.setHours(23,59,59,999);
    }

    filteredData = allDonationData.filter(row => {
        const time = new Date(row.Timestamp);
        const rowStatus = row.Status || "Belum Verifikasi"; // Default status

        if (from && time < from) return false;
        if (to && time > to) return false;
        if (jenis && row.JenisDonasi !== jenis) return false;
        if (metode && row.MetodePembayaran !== metode) return false;
        
        // Filter Status Logic
        if (status && rowStatus !== status) return false;

        if (search) {
            const str = [
                row.NamaDonatur, 
                row.NISSantri, 
                row.NoHP, 
                row.Email, 
                row.NamaSantri
            ].filter(Boolean).join(' ').toLowerCase();
            if (!str.includes(search)) return false;
        }
        return true;
    });

    calculateStatistics(filteredData);
    renderAllCharts(filteredData); // Update charts with filtered data
    currentPage = 1; // Reset to first page when filters change
    renderTable();
}

function resetFilters() {
    if (!filterSearchEl || !filterStatusEl || !filterJenisEl || !filterMetodeEl || !filterDateFromEl || !filterDateToEl) return;
    
    filterSearchEl.value = ''; 
    filterStatusEl.value = ''; 
    filterJenisEl.value = ''; 
    filterMetodeEl.value = '';
    filterDateFromEl.value = ''; 
    filterDateToEl.value = '';
    
    // Visual feedback with null check
    if (filterResetBtn) {
        filterResetBtn.classList.add('rotate-180');
        setTimeout(() => filterResetBtn.classList.remove('rotate-180'), 500);
    }
    
    applyFilters();
}

function openEditModal(rowNumber) {
    const data = allDonationData.find(r => r.row === rowNumber);
    if (!data) {
        showAppAlert("Data tidak ditemukan", true);
        return;
    }
    
    const rowNumEl = safeGetElement('edit-row-number');
    if (!rowNumEl) return;
    
    rowNumEl.value = data.row;
    const fields = ['JenisDonasi', 'Nominal', 'MetodePembayaran', 'NamaDonatur', 'NoHP', 'Email', 'NoKTP', 'Alamat', 'TipeDonatur', 'DetailAlumni', 'NamaSantri', 'NISSantri', 'KelasSantri', 'PesanDoa'];
    fields.forEach(f => { 
        const el = safeGetElement(`edit-${f}`); 
        if(el) el.value = data[f] || ''; 
    });
    showEditDrawer();
}

async function handleEditSubmit(e) {
    e.preventDefault();
    const btn = safeGetElement('edit-drawer-save');
    const txt = safeGetElement('edit-save-text');
    const load = safeGetElement('edit-save-loading');
    const rowNumEl = safeGetElement('edit-row-number');
    
    if (!btn || !txt || !load || !rowNumEl || !editForm) return;
    
    btn.disabled = true; 
    txt.classList.add('hidden'); 
    load.classList.remove('hidden');

    const rowNumber = rowNumEl.value;
    const payload = {};
    const inputs = editForm.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        const key = input.id.replace('edit-', '');
        if (key && key !== 'row-number') {
            // Sanitize input to prevent XSS
            payload[key] = escapeHtml(input.value);
        }
    });

    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: "update", row: rowNumber, payload: payload })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const res = await response.json();
        if(res.status !== 'success') throw new Error(res.message);
        
        hideEditDrawer(); 
        showAppAlert("Data berhasil diperbarui!"); 
        fetchData();
    } catch (err) {
        showAppAlert("Gagal menyimpan: " + (err.message || "Unknown error"), true);
    } finally {
        btn.disabled = false; 
        txt.classList.remove('hidden'); 
        load.classList.add('hidden');
    }
}

async function executeDelete(rowNumber) {
    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: "delete", row: rowNumber })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const res = await response.json();
        if(res.status !== 'success') throw new Error(res.message);
        
        showAppAlert("Data berhasil dihapus."); 
        fetchData();
    } catch (err) {
        showAppAlert("Gagal menghapus: " + (err.message || "Unknown error"), true);
    }
}

function exportToCSV() {
    if (filteredData.length === 0) return showAppAlert("Tidak ada data untuk diekspor", true);
    
    // Add visual feedback
    if (exportCsvBtn) {
        const originalText = exportCsvBtn.innerHTML;
        exportCsvBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Mengekspor...</span>';
        exportCsvBtn.disabled = true;
        
        setTimeout(() => {
            const keys = ['Timestamp', 'JenisDonasi', 'Nominal', 'MetodePembayaran', 'NamaDonatur', 'TipeDonatur', 'NamaSantri', 'KelasSantri', 'NoHP', 'PesanDoa', 'Status'];
            const csvRows = [keys.join(',')];
            
            filteredData.forEach(row => {
                const values = keys.map(key => {
                    let val = row[key] || ''; 
                    val = String(val).replace(/"/g, '""'); 
                    return `"${val}"`;
                });
                csvRows.push(values.join(','));
            });
            
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); 
            a.setAttribute('hidden', ''); 
            a.setAttribute('href', url);
            a.setAttribute('download', `rekap_donasi_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(a); 
            a.click(); 
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url); // Clean up
            
            showAppAlert(`${filteredData.length} data berhasil diekspor!`);
            exportCsvBtn.innerHTML = originalText;
            exportCsvBtn.disabled = false;
        }, 500);
    }
}

// === NEW: LOGIC CETAK KUITANSI ===

// Fungsi Konversi Angka ke Terbilang
function terbilang(nilai) {
    nilai = Math.abs(nilai);
    var huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    var temp = "";
    if (nilai < 12) { temp = " " + huruf[nilai]; }
    else if (nilai < 20) { temp = terbilang(nilai - 10) + " Belas"; }
    else if (nilai < 100) { temp = terbilang(Math.floor(nilai / 10)) + " Puluh" + terbilang(nilai % 10); }
    else if (nilai < 200) { temp = " Seratus" + terbilang(nilai - 100); }
    else if (nilai < 1000) { temp = terbilang(Math.floor(nilai / 100)) + " Ratus" + terbilang(nilai % 100); }
    else if (nilai < 2000) { temp = " Seribu" + terbilang(nilai - 1000); }
    else if (nilai < 1000000) { temp = terbilang(Math.floor(nilai / 1000)) + " Ribu" + terbilang(nilai % 1000); }
    else if (nilai < 1000000000) { temp = terbilang(Math.floor(nilai / 1000000)) + " Juta" + terbilang(nilai % 1000000); }
    return temp.trim();
}

// Fungsi Utama Cetak Kuitansi (Hanya Download Lokal)
async function handlePrintReceipt(rowNumber) {
    const data = allDonationData.find(r => r.row === rowNumber);
    if (!data) {
        showAppAlert("Data tidak ditemukan", true);
        return;
    }

    showAppAlert("Sedang membuat PDF...", false);
    
    try {
        // 1. ISI DATA KE TEMPLATE (Mapping Data)
        const dateObj = new Date(data.Timestamp);
        const nominal = parseFloat(data.Nominal) || 0;
        
        // Format Tanggal (Pecah per digit untuk kotak-kotak)
        const d = String(dateObj.getDate()).padStart(2, '0');
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const y = String(dateObj.getFullYear());

        const terbilangEl = safeGetElement('rcpt-terbilang-1');
        const terbilang2El = safeGetElement('rcpt-terbilang-2');
        const element = safeGetElement('receipt-content');
        
        if (!terbilangEl || !terbilang2El || !element) {
            throw new Error("Template kuitansi tidak ditemukan");
        }

        // Safe element updates with null checks
        const setElementText = (id, text) => {
            const el = safeGetElement(id);
            if (el) el.innerText = text || '';
        };

        setElementText('rcpt-no', `KL-${data.row}`);
        setElementText('rcpt-d1', d[0]);
        setElementText('rcpt-d2', d[1]);
        setElementText('rcpt-m1', m[0]);
        setElementText('rcpt-m2', m[1]);
        setElementText('rcpt-y1', y[2]);
        setElementText('rcpt-y2', y[3]);
        setElementText('rcpt-nama', data.NamaDonatur || 'Hamba Allah');
        setElementText('rcpt-alamat', data.Alamat || '-');
        setElementText('rcpt-hp', data.NoHP || '-');
        setElementText('rcpt-penyetor', data.NamaDonatur || '');

        // Clear All Nominal Fields
        const nominalFields = ['zakat', 'infaq', 'lain'];
        nominalFields.forEach(k => {
            setElementText(`rcpt-jenis-${k}`, '');
            setElementText(`rcpt-nom-${k}`, '');
        });

        // Logic Penempatan Nominal
        const fmtNominal = formatter.format(nominal);
        const jenis = (data.JenisDonasi || '').toLowerCase();
        
        // Nominal dicetak sekali saja di kolom yang relevan.
        if(jenis.includes('zakat')) {
            setElementText('rcpt-jenis-zakat', data.JenisDonasi);
            setElementText('rcpt-nom-zakat', fmtNominal);
        } else if(jenis.includes('infaq') || jenis.includes('shodaqoh') || jenis.includes('pendidikan')) {
            setElementText('rcpt-jenis-infaq', data.JenisDonasi);
            setElementText('rcpt-nom-infaq', fmtNominal);
        } else {
            setElementText('rcpt-jenis-lain', data.JenisDonasi);
            setElementText('rcpt-nom-lain', fmtNominal);
        }
        
        // Nominal Total
        setElementText('rcpt-total', fmtNominal);
        
        // Checkbox Logic
        setElementText('rcpt-chk-kas', data.MetodePembayaran === 'Tunai' ? 'V' : '');
        setElementText('rcpt-chk-bank', data.MetodePembayaran !== 'Tunai' ? 'V' : '');
        setElementText('rcpt-nama-bank', data.MetodePembayaran !== 'Tunai' ? data.MetodePembayaran : '');
        setElementText('rcpt-chk-wesel', '');

        // Set Terbilang
        const textTerbilang = terbilang(nominal) + " Rupiah";
        terbilangEl.innerText = textTerbilang;
        terbilang2El.innerText = '';
        
        // Penyesuaian Font Size jika Terlalu Panjang
        terbilangEl.style.fontSize = '14pt'; 
        if (textTerbilang.length > 50) {
            terbilangEl.style.fontSize = '12pt';
        }
        if (textTerbilang.length > 65) {
            terbilangEl.style.fontSize = '10pt';
        }

        // 2. GENERATE PDF & DOWNLOAD LOKAL
        // Use encodeURIComponent for better filename handling with special characters
        const safeName = encodeURIComponent(data.NamaDonatur || 'Donatur').substring(0, 50);
        const opt = {
            margin: 0,
            filename: `Kuitansi_Lazismu_${data.row}_${safeName}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true }, 
            jsPDF: { unit: 'mm', format: 'a5', orientation: 'landscape' }
        };

        await html2pdf().set(opt).from(element).save();
        
        // Panggil server (hanya untuk logging)
        await fetch(GAS_API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: "sendReceipt" })
        });
        
        showAppAlert(`Kuitansi PDF berhasil dibuat dan diunduh!`, false);

    } catch (err) {
        console.error("PDF generation error:", err);
        showAppAlert("Gagal Generate PDF: " + (err.message || "Unknown error"), true);
    } finally {
        // Reset font size
        const terbilangEl = safeGetElement('rcpt-terbilang-1');
        if (terbilangEl) terbilangEl.style.fontSize = '14pt';
    }
}


// Event Listeners with defensive checks
if (refreshButton) refreshButton.addEventListener('click', fetchData);
if (filterApplyBtn) filterApplyBtn.addEventListener('click', applyFilters);
if (filterResetBtn) filterResetBtn.addEventListener('click', resetFilters);
if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportToCSV);
if (editForm) editForm.addEventListener('submit', handleEditSubmit);
if (paginationRowsEl) paginationRowsEl.addEventListener('change', () => { currentPage = 1; renderTable(); });
if (paginationPrevBtn) paginationPrevBtn.addEventListener('click', () => { if(currentPage > 1) { currentPage--; renderTable(); }});
if (paginationNextBtn) paginationNextBtn.addEventListener('click', () => { const max = Math.ceil(filteredData.length/rowsPerPage); if(currentPage < max) { currentPage++; renderTable(); }});

// Add debounced search for better UX
let searchTimeout;
if (filterSearchEl) {
    filterSearchEl.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyFilters();
        }, 300); // Wait 300ms after user stops typing
    });
}

// Delegate Click Actions with better error handling
if (tableWrapperEl) {
    tableWrapperEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button'); 
        if (!btn || !btn.dataset.row) return;
        
        const row = parseInt(btn.dataset.row, 10);
        if (isNaN(row)) return;
        
        // Add visual feedback
        btn.classList.add('scale-95');
        setTimeout(() => btn.classList.remove('scale-95'), 100);
        
        if (btn.classList.contains('verify-btn')) verifyDonation(row);
        if (btn.classList.contains('edit-btn')) openEditModal(row);
        if (btn.classList.contains('delete-btn')) showAppConfirm("Hapus data ini secara permanen?", () => executeDelete(row));
        if (btn.classList.contains('print-btn')) handlePrintReceipt(row);
    });
}

// === NEW FEATURES ===

// === 1. PERSONALIZED GREETING ===
function updateGreeting() {
    const greetingTimeEl = safeGetElement('greeting-time');
    const greetingNameEl = safeGetElement('greeting-name');
    const greetingIconEl = safeGetElement('greeting-icon');
    const greetingMessageEl = safeGetElement('greeting-message');
    
    if (!greetingTimeEl || !greetingNameEl || !greetingIconEl) return;
    
    const hour = new Date().getHours();
    let greeting = "Selamat Datang";
    let icon = "👋";
    
    if (hour >= 5 && hour < 11) {
        greeting = "Selamat Pagi";
        icon = "☀️";
    } else if (hour >= 11 && hour < 15) {
        greeting = "Selamat Siang";
        icon = "🌤️";
    } else if (hour >= 15 && hour < 18) {
        greeting = "Selamat Sore";
        icon = "🌅";
    } else if (hour >= 18 && hour < 22) {
        greeting = "Selamat Malam";
        icon = "🌙";
    } else {
        greeting = "Selamat Lembur";
        icon = "🌙";
    }
    
    greetingTimeEl.textContent = greeting;
    greetingIconEl.textContent = icon;
    
    // Get user name from Firebase auth
    const user = auth.currentUser;
    if (user && user.displayName) {
        const firstName = user.displayName.split(' ')[0];
        greetingNameEl.textContent = firstName;
    } else if (user && user.email) {
        const name = user.email.split('@')[0];
        greetingNameEl.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    }
}

function updateGreetingStats() {
    const greetingMessageEl = safeGetElement('greeting-message');
    if (!greetingMessageEl) return;
    
    const unverifiedCount = allDonationData.filter(row => 
        (row.Status || "Belum Verifikasi") === "Belum Verifikasi"
    ).length;
    
    const todayCount = allDonationData.filter(row => {
        const rowDate = new Date(row.Timestamp);
        const today = new Date();
        return rowDate.toDateString() === today.toDateString();
    }).length;
    
    let message = "";
    if (unverifiedCount > 0) {
        message = `Ada ${unverifiedCount} donasi baru yang belum diverifikasi`;
        if (todayCount > 0) {
            message += ` (${todayCount} masuk hari ini)`;
        }
    } else if (todayCount > 0) {
        message = `${todayCount} donasi masuk hari ini, semua sudah terverifikasi! ✨`;
    } else {
        message = "Semua data sudah diverifikasi. Dashboard bersih! 🎉";
    }
    
    greetingMessageEl.textContent = message;
}

// === 2. SMART DATE PRESETS ===
function applyDatePreset(preset) {
    const today = new Date();
    let fromDate, toDate;
    
    switch(preset) {
        case 'today':
            fromDate = toDate = new Date(today);
            break;
        case 'yesterday':
            fromDate = toDate = new Date(today.setDate(today.getDate() - 1));
            break;
        case 'last7days':
            toDate = new Date();
            fromDate = new Date(today.setDate(today.getDate() - 6));
            break;
        case 'thismonth':
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
            toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'lastmonth':
            fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            toDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        default:
            return;
    }
    
    if (filterDateFromEl) {
        filterDateFromEl.valueAsDate = fromDate;
    }
    if (filterDateToEl) {
        filterDateToEl.valueAsDate = toDate;
    }
    
    // Highlight active preset
    document.querySelectorAll('.date-preset-btn').forEach(btn => {
        if (btn.dataset.preset === preset) {
            btn.classList.add('bg-orange-100', 'border-orange-400', 'text-orange-700', 'font-extrabold');
            btn.classList.remove('bg-slate-50', 'border-slate-200', 'text-slate-600');
        } else {
            btn.classList.remove('bg-orange-100', 'border-orange-400', 'text-orange-700', 'font-extrabold');
            btn.classList.add('bg-slate-50', 'border-slate-200', 'text-slate-600');
        }
    });
    
    applyFilters();
}

// === 3. COPY TABLE TO CLIPBOARD ===
function copyTableToClipboard() {
    const copyBtn = safeGetElement('copy-table-btn');
    if (!copyBtn) return;
    
    // Store original content
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Copying...';
    copyBtn.disabled = true;
    
    try {
        // Get headers
        const headers = ['Tanggal', 'Waktu', 'Nama Donatur', 'Jenis Donasi', 'Nominal', 'Metode', 'Status'];
        
        // Get data
        const rows = filteredData.map(row => {
            const date = new Date(row.Timestamp);
            return [
                date.toLocaleDateString('id-ID'),
                date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                row.NamaDonatur || 'Hamba Allah',
                row.JenisDonasi || '-',
                formatter.format(parseFloat(row.Nominal) || 0),
                row.MetodePembayaran || '-',
                row.Status || 'Belum Verifikasi'
            ];
        });
        
        // Create TSV (Tab-Separated Values) for better Excel compatibility
        const tsvContent = [
            headers.join('\t'),
            ...rows.map(row => row.join('\t'))
        ].join('\n');
        
        // Copy to clipboard
        navigator.clipboard.writeText(tsvContent).then(() => {
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyBtn.classList.add('bg-green-50', 'border-green-300', 'text-green-700');
            
            showAppAlert(`${filteredData.length} baris berhasil dicopy! Paste ke Excel/Sheets.`);
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.disabled = false;
                copyBtn.classList.remove('bg-green-50', 'border-green-300', 'text-green-700');
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
            copyBtn.innerHTML = originalHTML;
            copyBtn.disabled = false;
            showAppAlert('Gagal copy. Coba lagi.', true);
        });
    } catch (error) {
        copyBtn.innerHTML = originalHTML;
        copyBtn.disabled = false;
        showAppAlert('Gagal copy table.', true);
    }
}

// === 4. FOCUS MODE ===
let focusModeActive = false;

function toggleFocusMode() {
    focusModeActive = !focusModeActive;
    const focusBtn = safeGetElement('focus-mode-btn');
    
    if (focusModeActive) {
        // Hide elements
        const elementsToHide = [
            safeGetElement('greeting-container'),
            safeGetElement('admin-stats-container'),
            safeGetElement('charts-container'),
            document.querySelector('header')
        ];
        
        elementsToHide.forEach(el => {
            if (el) {
                el.style.display = 'none';
            }
        });
        
        // Add focus mode styling
        document.body.classList.add('focus-mode');
        if (focusBtn) {
            focusBtn.innerHTML = '<i class="fas fa-compress"></i> <span class="hidden sm:inline">Exit Focus</span>';
            focusBtn.classList.add('bg-orange-100', 'border-orange-300', 'text-orange-700');
        }
        
        // Scroll to table
        const adminContent = safeGetElement('admin-content');
        if (adminContent) {
            adminContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else {
        // Show elements
        const elementsToShow = [
            safeGetElement('greeting-container'),
            safeGetElement('admin-stats-container'),
            safeGetElement('charts-container'),
            document.querySelector('header')
        ];
        
        elementsToShow.forEach(el => {
            if (el) {
                el.style.display = '';
            }
        });
        
        // Remove focus mode styling
        document.body.classList.remove('focus-mode');
        if (focusBtn) {
            focusBtn.innerHTML = '<i class="fas fa-expand"></i> <span class="hidden sm:inline">Focus</span>';
            focusBtn.classList.remove('bg-orange-100', 'border-orange-300', 'text-orange-700');
        }
    }
}

// === 5. SESSION TIMEOUT WARNING ===
let sessionTimeoutWarning;
let sessionTimeout;
let lastActivityTime = Date.now();
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_TIME = 60 * 1000; // 60 seconds warning

function resetSessionTimer() {
    lastActivityTime = Date.now();
    clearTimeout(sessionTimeoutWarning);
    clearTimeout(sessionTimeout);
    
    // Set warning timer
    sessionTimeoutWarning = setTimeout(() => {
        showSessionWarning();
    }, INACTIVITY_TIMEOUT - WARNING_TIME);
}

function showSessionWarning() {
    let countdown = 60;
    const warningDiv = document.createElement('div');
    warningDiv.id = 'session-warning';
    warningDiv.className = 'fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
    warningDiv.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl animate-enter">
            <div class="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i class="fas fa-exclamation-triangle text-4xl text-yellow-600"></i>
            </div>
            <h3 class="text-2xl font-bold text-slate-800 mb-2">Sesi Akan Berakhir</h3>
            <p class="text-slate-600 mb-6">
                Tidak ada aktivitas terdeteksi. Anda akan otomatis logout dalam <strong id="countdown-text" class="text-orange-600">60</strong> detik.
            </p>
            <button id="stay-logged-in-btn" class="w-full bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg">
                <i class="fas fa-clock mr-2"></i> Tetap Masuk
            </button>
        </div>
    `;
    
    document.body.appendChild(warningDiv);
    
    const countdownEl = safeGetElement('countdown-text');
    const stayBtn = safeGetElement('stay-logged-in-btn');
    
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownEl) countdownEl.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            logout();
        }
    }, 1000);
    
    if (stayBtn) {
        stayBtn.onclick = () => {
            clearInterval(countdownInterval);
            warningDiv.remove();
            resetSessionTimer();
        };
    }
    
    // Auto-logout after warning time
    sessionTimeout = setTimeout(() => {
        clearInterval(countdownInterval);
        logout();
    }, WARNING_TIME);
}

// Track user activity
['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, () => {
        resetSessionTimer();
    }, { passive: true });
});

// Initialize session timer
resetSessionTimer();

// === EVENT LISTENERS FOR NEW FEATURES ===

// Date presets
document.querySelectorAll('.date-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        applyDatePreset(btn.dataset.preset);
    });
});

// Copy table button
const copyTableBtn = safeGetElement('copy-table-btn');
if (copyTableBtn) {
    copyTableBtn.addEventListener('click', copyTableToClipboard);
}

// Focus mode button
const focusModeBtn = safeGetElement('focus-mode-btn');
if (focusModeBtn) {
    focusModeBtn.addEventListener('click', toggleFocusMode);
}

// Update greeting on auth state change and after data loads
const originalFetchData = fetchData;
window.fetchData = async function() {
    await originalFetchData();
    updateGreeting();
    updateGreetingStats();
};
