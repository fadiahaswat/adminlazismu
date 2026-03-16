// --- IMPORT PERALATAN FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// [BARU] Import App Check
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";

// --- IMPORT UTILITIES ---
import { escapeHtml } from './src/utils/format.js';

// --- IMPORT CONSTANTS ---
import { 
    FIREBASE_CONFIG, 
    RECAPTCHA_SITE_KEY, 
    ALLOWED_ADMIN_EMAILS, 
    GAS_API_URL,
    GAS_SANTRI_API_URL,
    CACHE,
    BTN_LOGIN_GOOGLE_HTML 
} from './src/constants.js';

// --- KONFIGURASI KUNCI RAHASIA ---
// PERINGATAN KEAMANAN: API Key ini bersifat publik dan seharusnya dibatasi melalui 
// Firebase Console > Project Settings > API restrictions untuk domain yang diizinkan
const firebaseConfig = FIREBASE_CONFIG;

// --- KONFIGURASI KEAMANAN ---
// Email yang diizinkan untuk login ke admin dashboard
const ALLOWED_ADMIN_EMAILS_LOWER = ALLOWED_ADMIN_EMAILS.map(email => email.toLowerCase());

// --- NYALAKAN APLIKASI ---
const app = initializeApp(firebaseConfig);

// [BARU] NYALAKAN APP CHECK (SATPAM RECAPTCHA)
let appCheck;
try {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
} catch (error) {
  console.warn("App Check initialization failed - continuing without App Check");
  // App Check gagal, tapi aplikasi tetap bisa jalan (optional security layer)
}

// --- NYALAKAN AUTH ---
const auth = getAuth(app);

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
    const contentEl = document.getElementById('admin-content');
    
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
        overlay.classList.add('hidden'); // Buka gerbang (sembunyikan login)

        if(contentEl) contentEl.classList.remove('hidden');
        const analyticsEl = document.getElementById('analytics-section');
        if(analyticsEl) analyticsEl.classList.remove('hidden');
        
        // Panggil fungsi ambil data Anda yang lama
        fetchData();
        fetchSantriData();
        fetchClassData();
    } else {
        // JIKA TIDAK LOGIN / BELUM LOGIN
        overlay.classList.remove('hidden'); // Tutup gerbang (munculkan login)
        if(contentEl) contentEl.classList.add('hidden');
        const analyticsEl = document.getElementById('analytics-section');
        if(analyticsEl) analyticsEl.classList.add('hidden');
    }
});

// ================================================================
// BATAS SUCI: KODE DI BAWAH INI ADALAH KODE LAMA ANDA (VARIABLES, DST)
// JANGAN DIHAPUS, BIARKAN SAJA MENYAMBUNG DI BAWAH SINI
// ================================================================

// === VARIABLES ===
const loadingEl = document.getElementById('admin-loading');
const tableWrapperEl = document.getElementById('admin-table-wrapper');
const tableBodyEl = document.getElementById('table-body');
const refreshButton = document.getElementById('refresh-button');
const refreshIcon = document.getElementById('refresh-icon');

// Statistik Elements
const statTotalEl = document.getElementById('admin-stat-total');
const statDonaturEl = document.getElementById('admin-stat-donatur');
const statHariIniEl = document.getElementById('admin-stat-hari-ini');
const statTertinggiEl = document.getElementById('admin-stat-tertinggi');
const statRataEl = document.getElementById('admin-stat-rata');
const statTipeEl = document.getElementById('admin-stat-tipe');
const statVerifiedTotalEl = document.getElementById('admin-stat-verified-total');
const statVerifiedCountEl = document.getElementById('admin-stat-verified-count');
const statUnverifiedTotalEl = document.getElementById('admin-stat-unverified-total');
const statUnverifiedCountEl = document.getElementById('admin-stat-unverified-count');

// Modal Elements
const alertModal = document.getElementById('alert-modal');
const confirmModal = document.getElementById('confirm-modal');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');

// Filter & Paging Elements
const filterSearchEl = document.getElementById('filter-search');
const filterStatusEl = document.getElementById('filter-status'); 
const filterDateFromEl = document.getElementById('filter-date-from');
const filterDateToEl = document.getElementById('filter-date-to');
const filterJenisEl = document.getElementById('filter-jenis');
const filterMetodeEl = document.getElementById('filter-metode');
const filterApplyBtn = document.getElementById('filter-apply-button');
const filterResetBtn = document.getElementById('filter-reset-button');
const exportCsvBtn = document.getElementById('export-csv-button');
const paginationRowsEl = document.getElementById('pagination-rows');
const paginationInfoEl = document.getElementById('pagination-info');
const paginationPrevBtn = document.getElementById('pagination-prev');
const paginationNextBtn = document.getElementById('pagination-next');

// Data State
let allDonationData = [];
let filteredData = [];
let currentPage = 1;
let rowsPerPage = 50;
let confirmCallback = null;
let allSantriData = [];
let classMetaData = {};

const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

// === MODAL FUNCTIONS ===
function showModal(el) {
    el.classList.remove('hidden');
    setTimeout(() => {
        el.classList.remove('opacity-0');
        el.querySelector('.modal-content').classList.remove('scale-95');
        el.querySelector('.modal-content').classList.add('scale-100');
    }, 10);
}

function hideModal(el) {
    el.classList.add('opacity-0');
    el.querySelector('.modal-content').classList.remove('scale-100');
    el.querySelector('.modal-content').classList.add('scale-95');
    setTimeout(() => el.classList.add('hidden'), 250);
}

function showAppAlert(msg, isError = false) {
    const title = document.getElementById('alert-modal-title');
    const message = document.getElementById('alert-modal-message');
    const iconContainer = document.getElementById('alert-icon-container');
    
    title.textContent = isError ? "Terjadi Kesalahan" : "Berhasil";
    title.className = isError ? "text-xl font-black text-red-600 mb-2" : "text-xl font-black text-green-600 mb-2";
    message.textContent = msg;
    
    iconContainer.innerHTML = isError 
        ? `<div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto"><i class="fas fa-times"></i></div>`
        : `<div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto"><i class="fas fa-check"></i></div>`;
    
    showModal(alertModal);
}

function showAppConfirm(msg, callback) {
    document.getElementById('confirm-modal-message').textContent = msg;
    confirmCallback = callback;
    showModal(confirmModal);
}

// Close Modal Listeners
document.getElementById('alert-modal-close').onclick = () => hideModal(alertModal);
document.getElementById('confirm-modal-cancel').onclick = () => hideModal(confirmModal);
document.getElementById('edit-modal-close').onclick = () => hideModal(editModal);
document.getElementById('edit-modal-cancel').onclick = () => hideModal(editModal);
document.getElementById('confirm-modal-ok').onclick = () => { if (confirmCallback) confirmCallback(); hideModal(confirmModal); };


// === CORE FUNCTIONS ===

async function fetchData() {
    loadingEl.classList.remove('hidden');
    tableWrapperEl.classList.add('hidden');
    refreshIcon.classList.add('fa-spin');

    try {
        // Cek login di sisi Frontend (User Interface)
        const user = auth.currentUser;
        if (!user) throw new Error("Sesi login berakhir. Silakan login ulang.");
        
        // --- PERBAIKAN DI SINI ---
        // Kembali menggunakan GET Request karena Code.gs belum support POST "fetch"
        // Kita tidak mengirim token ke backend untuk aksi ini agar tidak error "Invalid action"
        const response = await fetch(GAS_API_URL); 
        
        const result = await response.json();
        if (result.status !== "success") throw new Error(result.message);
        
        allDonationData = result.data.sort((a, b) => b.row - a.row);
        populateFilterDropdowns(allDonationData);
        applyFilters();

    } catch (error) {
        console.error("Fetch error:", error);
        
        let errorMessage = "Tidak dapat memuat data. Periksa koneksi internet Anda.";
        
        if (error.message && 
            !error.message.includes("6Le") && 
            !error.message.includes("://") && 
            error.message.length < 100) { 
            errorMessage = "Gagal memuat data: " + error.message;
        }
        showAppAlert(errorMessage, true);
    } finally {
        loadingEl.classList.add('hidden');
        refreshIcon.classList.remove('fa-spin');
    }
}

async function verifyDonation(rowNumber) {
    showAppConfirm("Verifikasi donasi ini? Pastikan dana sudah masuk.", async () => {
        try {
            // 1. Ambil User & Token
            const user = auth.currentUser;
            if (!user) throw new Error("Sesi habis, silakan login ulang.");
            const token = await user.getIdToken(); // <--- INI KUNCINYA

            // 2. Kirim ke Backend dengan Token
            const response = await fetch(GAS_API_URL, {
                method: 'POST',
                body: JSON.stringify({ 
                    action: "verify", 
                    row: rowNumber,
                    authToken: token // <--- Token diselipkan di sini
                })
            });
            
            const res = await response.json();
            if(res.status !== 'success') throw new Error(res.message);
            
            showAppAlert("Donasi berhasil diverifikasi!");
            fetchData(); 
        } catch (error) {
            console.error("Verification error:", error);
            showAppAlert("Gagal verifikasi: " + error.message, true);
        }
    });
}

function calculateStatistics(data) {
    let total = 0;
    let count = data.length;
    let maxVal = 0;
    let todayTotal = 0;
    let verifiedTotal = 0;
    let verifiedCount = 0;
    let unverifiedTotal = 0;
    let unverifiedCount = 0;
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

        if ((row.Status || 'Belum Verifikasi') === 'Terverifikasi') {
            verifiedTotal += val;
            verifiedCount++;
        } else {
            unverifiedTotal += val;
            unverifiedCount++;
        }
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

    statTotalEl.textContent = formatter.format(total);
    statDonaturEl.textContent = count;
    statHariIniEl.textContent = formatter.format(todayTotal);
    statTertinggiEl.textContent = formatter.format(maxVal);
    statRataEl.textContent = formatter.format(avgVal);
    statTipeEl.textContent = topType;
    statVerifiedTotalEl.textContent = formatter.format(verifiedTotal);
    statVerifiedCountEl.textContent = verifiedCount;
    statUnverifiedTotalEl.textContent = formatter.format(unverifiedTotal);
    statUnverifiedCountEl.textContent = unverifiedCount;
}

function renderTable() {
    rowsPerPage = parseInt(paginationRowsEl.value, 10);
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = filteredData.slice(start, end);

    tableBodyEl.innerHTML = '';
    
    if (filteredData.length === 0) {
        tableBodyEl.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-slate-400 font-bold">Tidak ada data ditemukan</td></tr>';
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
                    <button class="whatsapp-btn w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition flex items-center justify-center mr-2 shadow-sm border border-green-100" data-row="${escapeHtml(row.row)}" title="Salin Pesan WhatsApp"><i class="fab fa-whatsapp text-xs"></i></button>
                    <button class="print-btn w-8 h-8 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-500 hover:text-white transition flex items-center justify-center mr-2 shadow-sm border border-purple-100" data-row="${escapeHtml(row.row)}" title="Cetak Kuitansi"><i class="fas fa-print text-xs"></i></button>

                    ${verifyBtnHTML}
                    <button class="edit-btn w-8 h-8 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition flex items-center justify-center mr-2" data-row="${escapeHtml(row.row)}" title="Edit"><i class="fas fa-pencil-alt text-xs"></i></button>
                    <button class="delete-btn w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition flex items-center justify-center" data-row="${escapeHtml(row.row)}" title="Hapus"><i class="fas fa-trash-alt text-xs"></i></button>
                </div>
            </td>
        `;
        tableBodyEl.appendChild(tr);
    });

    // Update Pagination Info
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    paginationInfoEl.textContent = `Halaman ${currentPage} / ${totalPages || 1}`;
    paginationPrevBtn.disabled = currentPage === 1;
    paginationNextBtn.disabled = currentPage === totalPages || totalPages === 0;
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
    const search = filterSearchEl.value.toLowerCase();
    const status = filterStatusEl.value; // NEW
    const jenis = filterJenisEl.value;
    const metode = filterMetodeEl.value;
    let from = filterDateFromEl.valueAsDate;
    let to = filterDateToEl.valueAsDate;
    if(from) from.setHours(0,0,0,0);
    if(to) to.setHours(23,59,59,999);

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
            const str = `${row.NamaDonatur || ''} ${row.NISSantri || ''} ${row.NoHP || ''} ${row.Email || ''} ${row.NamaSantri || ''}`.toLowerCase();
            if (!str.includes(search)) return false;
        }
        return true;
    });

    calculateStatistics(filteredData);
    renderClassReport(filteredData);
    renderSantriChecker();
    currentPage = 1;
    renderTable();
}

function resetFilters() {
    filterSearchEl.value = ''; filterStatusEl.value = ''; filterJenisEl.value = ''; filterMetodeEl.value = '';
    filterDateFromEl.value = ''; filterDateToEl.value = '';
    applyFilters();
}

function openEditModal(rowNumber) {
    const data = allDonationData.find(r => r.row === rowNumber);
    if (!data) return;
    document.getElementById('edit-row-number').value = data.row;
    const fields = ['JenisDonasi', 'Nominal', 'MetodePembayaran', 'NamaDonatur', 'NoHP', 'Email', 'NoKTP', 'Alamat', 'TipeDonatur', 'DetailAlumni', 'NamaSantri', 'NISSantri', 'KelasSantri', 'PesanDoa'];
    fields.forEach(f => { const el = document.getElementById(`edit-${f}`); if(el) el.value = data[f] || ''; });
    showModal(editModal);
}

async function handleEditSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('edit-modal-save');
    const txt = document.getElementById('edit-save-text');
    const load = document.getElementById('edit-save-loading');
    
    // Aktifkan status loading pada tombol
    btn.disabled = true; 
    txt.classList.add('hidden'); 
    load.classList.remove('hidden');

    const rowNumber = document.getElementById('edit-row-number').value;
    const payload = {};
    const inputs = editForm.querySelectorAll('input, select, textarea');
    
    // Mengumpulkan data dari form modal edit
    inputs.forEach(input => {
        const key = input.id.replace('edit-', '');
        if (key && key !== 'row-number') payload[key] = input.value;
    });

    try {
        // --- PERBAIKAN UTAMA: AMBIL TOKEN DARI FIREBASE ---
        const user = auth.currentUser;
        if (!user) throw new Error("Sesi login berakhir. Silakan login ulang.");
        
        // Mengambil Token ID (KTP Digital) untuk dikirim ke GAS
        const token = await user.getIdToken();

        // Kirim data ke Google Apps Script API
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: "update", 
                row: rowNumber, 
                payload: payload,
                authToken: token // WAJIB disertakan agar tidak ditolak oleh GAS
            })
        });

        const res = await response.json();
        
        if(res.status !== 'success') {
            throw new Error(res.message);
        }
        
        // Jika berhasil
        hideModal(editModal);
        showAppAlert("Data berhasil diperbarui!");
        fetchData(); // Refresh tabel agar data terbaru muncul

    } catch (err) {
        console.error("Edit error:", err);
        showAppAlert("Gagal menyimpan: " + err.message, true);
    } finally {
        // Kembalikan status tombol ke normal
        btn.disabled = false; 
        txt.classList.remove('hidden'); 
        load.classList.add('hidden');
    }
}

async function executeDelete(rowNumber) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Silakan login kembali.");

        // Ambil token terbaru
        const token = await user.getIdToken(true); 

        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: "delete", 
                row: rowNumber,
                authToken: token 
            })
        });

        const res = await response.json();
        if (res.status !== 'success') throw new Error(res.message);
        
        showAppAlert("Data berhasil dihapus."); 
        fetchData();
    } catch (err) {
        showAppAlert("Gagal menghapus: " + err.message, true);
    }
}

function exportToCSV() {
    if (filteredData.length === 0) return showAppAlert("Tidak ada data untuk diekspor", true);
    const keys = ['Timestamp', 'JenisDonasi', 'Nominal', 'MetodePembayaran', 'NamaDonatur', 'TipeDonatur', 'NamaSantri', 'KelasSantri', 'NoHP', 'PesanDoa', 'Status'];
    const csvRows = [keys.join(',')];
    filteredData.forEach(row => {
        const values = keys.map(key => {
            let val = row[key] || ''; val = String(val).replace(/"/g, '""'); return `"${val}"`;
        });
        csvRows.push(values.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.setAttribute('hidden', ''); a.setAttribute('href', url);
    a.setAttribute('download', `rekap_donasi_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
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
    if (!data) return;

    showAppAlert("Sedang membuat PDF...", false);
    
    // 1. ISI DATA KE TEMPLATE (Mapping Data)
    const dateObj = new Date(data.Timestamp);
    const nominal = parseFloat(data.Nominal) || 0;
    
    // Format Tanggal (Pecah per digit untuk kotak-kotak)
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = String(dateObj.getFullYear());

    const terbilangEl = document.getElementById('rcpt-terbilang-1');
    const terbilang2El = document.getElementById('rcpt-terbilang-2');

    document.getElementById('rcpt-no').innerText = `KL-${data.row}`; // Contoh No Kuitansi
    document.getElementById('rcpt-d1').innerText = d[0]; document.getElementById('rcpt-d2').innerText = d[1];
    document.getElementById('rcpt-m1').innerText = m[0]; document.getElementById('rcpt-m2').innerText = m[1];
    document.getElementById('rcpt-y1').innerText = y[2]; document.getElementById('rcpt-y2').innerText = y[3];

    document.getElementById('rcpt-nama').innerText = data.NamaDonatur || 'Hamba Allah';
    document.getElementById('rcpt-alamat').innerText = data.Alamat || '-';
    document.getElementById('rcpt-hp').innerText = data.NoHP || '-';
    document.getElementById('rcpt-penyetor').innerText = data.NamaDonatur || '';

    // Clear All Nominal Fields
    const nominalFields = ['zakat', 'infaq', 'lain'];
    nominalFields.forEach(k => {
        document.getElementById(`rcpt-jenis-${k}`).innerText = '';
        document.getElementById(`rcpt-nom-${k}`).innerText = '';
    });

    // Logic Penempatan Nominal
    const fmtNominal = formatter.format(nominal);
    const jenis = (data.JenisDonasi || '').toLowerCase();
    
    // Cek Nominal (Hanya Rp 1.000.249)
    // Nominal dicetak sekali saja di kolom yang relevan.
    if(jenis.includes('zakat')) {
        document.getElementById('rcpt-jenis-zakat').innerText = data.JenisDonasi;
        document.getElementById('rcpt-nom-zakat').innerText = fmtNominal;
    } else if(jenis.includes('infaq') || jenis.includes('shodaqoh') || jenis.includes('pendidikan')) { // Menangkap 'Infaq/Shadaqah'ndidikan'
        document.getElementById('rcpt-jenis-infaq').innerText = data.JenisDonasi;
        document.getElementById('rcpt-nom-infaq').innerText = fmtNominal;
    } else {
        document.getElementById('rcpt-jenis-lain').innerText = data.JenisDonasi;
        document.getElementById('rcpt-nom-lain').innerText = fmtNominal;
    }
    
    // Nominal Total
    document.getElementById('rcpt-total').innerText = fmtNominal;
    
    // Checkbox Logic
    document.getElementById('rcpt-chk-kas').innerText = data.MetodePembayaran === 'Tunai' ? 'V' : '';
    document.getElementById('rcpt-chk-bank').innerText = data.MetodePembayaran !== 'Tunai' ? 'V' : '';
    document.getElementById('rcpt-nama-bank').innerText = data.MetodePembayaran !== 'Tunai' ? data.MetodePembayaran : '';
    document.getElementById('rcpt-chk-wesel').innerText = ''; // Clear Wesel

    // Set Terbilang
    const textTerbilang = terbilang(nominal) + " Rupiah";
    terbilangEl.innerText = textTerbilang;
    terbilang2El.innerText = ''; // Pastikan baris kedua kosong secara default
    
    // Penyesuaian Font Size jika Terlalu Panjang (Pencegahan Overflow)
    // Jika lebih dari 50 karakter, kecilkan font
    terbilangEl.style.fontSize = '14pt'; 
    if (textTerbilang.length > 50) {
        terbilangEl.style.fontSize = '12pt';
    }
    if (textTerbilang.length > 65) {
        terbilangEl.style.fontSize = '10pt';
    }


    // 2. GENERATE PDF & DOWNLOAD LOKAL
    const element = document.getElementById('receipt-content');
    const filenameSafeName = (data.NamaDonatur || 'Donatur').replace(/\s/g, '_');
    const opt = {
        margin: 0,
        filename: `Kuitansi_Lazismu_${data.row}_${filenameSafeName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        // >>> OPTIMASI PENTING UNTUK MENGATASI MISALIGNMENT FIX (SCALE: 3)
        html2canvas: { scale: 2, useCORS: true }, // Scale 2 sudah cukup tajam & lebih ringan
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'landscape' }
    };

    try {
        await html2pdf().set(opt).from(element).save();
        
        // --- PERBAIKAN: Ambil Token sebelum lapor ke server ---
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken(); // Ambil token
            
            // Panggil server dengan membawa Token
            await fetch(GAS_API_URL, {
                method: 'POST',
                body: JSON.stringify({ 
                    action: "sendReceipt",
                    authToken: token // <--- Token wajib disertakan!
                })
            });
        }
        
        showAppAlert(`Kuitansi PDF berhasil dibuat dan diunduh! Silakan cek folder Download Anda.`, false);

    } catch (err) {
        showAppAlert("Gagal Generate PDF: " + err.message, true);
    } finally {
        // Reset font size setelah selesai
        terbilangEl.style.fontSize = '14pt';
    }
}


// === FUNGSI SALIN PESAN WHATSAPP ===

function generateWhatsAppMessage(data) {
    const dateObj = new Date(data.Timestamp);
    const tgl = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' });
    const nama = data.NamaDonatur || 'Hamba Allah';
    const noHP = data.NoHP || '-';
    const jenis = data.JenisDonasi || '-';
    const nominal = parseFloat(data.Nominal) || 0;
    const fmtNominal = formatter.format(nominal).replace('Rp\u00a0', 'Rp ').replace(/\u00a0/g, ' ');
    const metode = data.MetodePembayaran || '-';
    const status = data.Status || 'Belum Verifikasi';

    const isSantri = data.TipeDonatur === 'santri' && data.NamaSantri;
    const santriName = isSantri ? data.NamaSantri : null;

    // Baris santri dalam blok kuitansi (hanya muncul jika via santri)
    const santriReceiptLine = isSantri
        ? `\n🎓 *Melalui santri* : *${santriName}*` : '';

    // Paragraf doa: versi santri vs umum
    const doaParagraph = isSantri
        ? `Ya Allah, berikanlah pahala yang berlipat atas harta yang telah dikeluarkan oleh keluarga ${nama} melalui ananda ${santriName}.\nJadikanlah ${jenis} ini sebagai pembersih lahir dan batin, penjaga dari segala penyakit, serta pelindung dari marabahaya maupun kezaliman.\nJadikanlah mereka insan yang suci, dan jadikanlah Ramadhan ini sebagai bulan penuh ampunan atas segala khilaf.\nSemoga ibadah keluarga senantiasa dilancarkan dan diberkahi.`
        : `Ya Allah, berikanlah pahala yang berlipat atas harta yang telah dikeluarkan oleh ${nama}.\nJadikanlah ${jenis} ini sebagai pembersih lahir dan batin, penjaga dari segala penyakit, serta pelindung dari marabahaya maupun kezaliman.\nJadikanlah mereka insan yang suci, dan jadikanlah Ramadhan ini sebagai bulan penuh ampunan atas segala khilaf.\nSemoga ibadah keluarga senantiasa dilancarkan dan diberkahi.`;

    // Paragraf konfirmasi: berbeda untuk Tunai vs metode lainnya
    const isTunai = metode === 'Tunai';
    const konfirmasiParagraph = isTunai
        ? `Alhamdulillah, terima kasih atas kepercayaan Bapak/Ibu dalam menunaikan *${jenis}*. Dana tunai Bapak/Ibu akan kami terima ketika santri telah kembali ke asrama dan menyerahkan kepada musyrif, yang selanjutnya akan dikumpulkan kepada Lazismu Mu'allimin. Berikut rincian donasi Bapak/Ibu:`
        : `Alhamdulillah, terima kasih atas kepercayaan Bapak/Ibu dalam menunaikan *${jenis}*. Kami mengonfirmasi bahwa dana tersebut telah kami terima dengan rincian sebagai berikut:`;

    const pesan =
`_Assalamualaikum Warahmatullahi Wabarakatuh._

Kepada Yth. *${nama},*

${konfirmasiParagraph}

*🧾 E-KUITANSI LAZISMU MU'ALLIMIN*
🗓 Tanggal : ${tgl}
👤 Nama Donatur : ${nama}${santriReceiptLine}
📱 No. HP : ${noHP}
💰 *Nominal* : *${fmtNominal}*
📋 Program : ${jenis}
💳 Metode : ${metode}
✅ Status : ${status}

بسم الله الرحمن الرحيم اللهم صل على محمد

${doaParagraph}

آجَرَكَ اللهُ فِيْمَا اَعْطَيْتَ، وَبَارَكَ فِيْمَا اَبْقَيْتَ وَجَعَلَهُ لَكَ طَهُوْرًا

_"Semoga Allah memberikan pahala atas apa yang engkau berikan, memberikan keberkahan atas harta yang kau simpan, dan menjadikannya pembersih dosa bagimu." Aamiin Ya Rabbal Alamin._ 🙏

Insya Allah, *Lazismu Mu'allimin* akan mengelola dan menyampaikan amanah ini kepada para mustahiq yang membutuhkan dengan sebaik-baiknya.

_Jazakumullah Khairan Katsiran._
_Wassalamu'alaikum Warahmatullahi Wabarakatuh._`;

    return pesan;
}

async function copyWhatsAppMessage(rowNumber) {
    const data = allDonationData.find(r => r.row === rowNumber);
    if (!data) return;
    const pesan = generateWhatsAppMessage(data);
    try {
        await navigator.clipboard.writeText(pesan);
        showAppAlert('Pesan WhatsApp berhasil disalin ke clipboard! Silakan tempel ke chat WhatsApp.', false);
    } catch (err) {
        showAppAlert('Gagal menyalin: ' + err.message, true);
    }
}

// ================================================================
// ANALYTICS: Santri & Kelas Data
// ================================================================

/** Normalize a raw santri object from the API into a consistent shape */
function normalizeSantriItem(item) {
    return {
        nama:  String(item.nama  || item.NamaSantri  || item.Nama  || item.name  || '').trim(),
        nis:   String(item.nis   || item.NISSantri   || item.NIS   || item.id    || '').trim(),
        kelas: String(item.kelas || item.KelasSantri || item.Kelas || item.rombel || item.Rombel || '').trim(),
    };
}

/**
 * Fetch all santri data from the API with localStorage caching.
 * Mirrors the pattern from data-santri.js provided by the admin.
 */
async function fetchSantriData() {
    const statusEl    = document.getElementById('santri-api-status');
    const loadingEl   = document.getElementById('santri-not-donated-loading');
    const contentEl   = document.getElementById('santri-not-donated-content');
    const errorEl     = document.getElementById('santri-not-donated-error');
    const refreshIcon = document.getElementById('refresh-santri-icon');

    if (statusEl)    statusEl.textContent = 'Memuat data santri...';
    if (loadingEl)   { loadingEl.classList.remove('hidden'); }
    if (contentEl)   contentEl.classList.add('hidden');
    if (errorEl)     errorEl.classList.add('hidden');
    if (refreshIcon) refreshIcon.classList.add('fa-spin');

    const cachedData = localStorage.getItem(CACHE.KEY);
    const cachedTime = localStorage.getItem(CACHE.TIME_KEY);
    const now = new Date().getTime();

    if (cachedData && cachedTime && (now - cachedTime < CACHE.EXPIRY_HOURS * 3600 * 1000)) {
        try {
            allSantriData = JSON.parse(cachedData).map(normalizeSantriItem);
            if (statusEl) statusEl.textContent = `${allSantriData.length} santri terdaftar (cache)`;
            if (refreshIcon) refreshIcon.classList.remove('fa-spin');
            renderClassReport(filteredData);
            renderSantriChecker();
            return;
        } catch (e) {
            console.warn('Cache rusak, mengunduh ulang...');
        }
    }

    try {
        const response = await fetch(GAS_SANTRI_API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        allSantriData = data.map(normalizeSantriItem);

        try {
            localStorage.setItem(CACHE.KEY, JSON.stringify(data));
            localStorage.setItem(CACHE.TIME_KEY, now.toString());
        } catch (e) {
            console.warn('Penyimpanan penuh, gagal caching data.');
        }

        if (statusEl) statusEl.textContent = `${allSantriData.length} santri terdaftar`;
        renderClassReport(filteredData);
        renderSantriChecker();

    } catch (error) {
        console.error('Gagal mengambil data santri:', error);

        if (cachedData) {
            try {
                allSantriData = JSON.parse(cachedData).map(normalizeSantriItem);
                if (statusEl) statusEl.textContent = `${allSantriData.length} santri (data lama)`;
                renderClassReport(filteredData);
                renderSantriChecker();
                return;
            } catch (e) {
                localStorage.removeItem(CACHE.KEY);
                localStorage.removeItem(CACHE.TIME_KEY);
            }
        }

        allSantriData = [];
        if (statusEl) statusEl.textContent = 'Gagal memuat data santri';
        if (loadingEl) loadingEl.classList.add('hidden');
        if (errorEl) {
            errorEl.classList.remove('hidden');
            const errMsg = document.getElementById('santri-error-msg');
            if (errMsg) errMsg.textContent = error.message || 'Periksa koneksi internet.';
        }
    } finally {
        if (refreshIcon) refreshIcon.classList.remove('fa-spin');
    }
}

/**
 * Fetch class metadata (wali kelas & musyrif) from the API.
 * Mirrors the pattern from data-kelas.js provided by the admin.
 */
async function fetchClassData() {
    try {
        const response = await fetch(GAS_SANTRI_API_URL + '?type=kelas');
        if (!response.ok) throw new Error('Gagal koneksi ke data kelas');
        const data = await response.json();
        classMetaData = {};
        data.forEach(item => {
            if (item.kelas) {
                classMetaData[item.kelas] = {
                    wali:    item.wali    || '',
                    musyrif: item.musyrif || '',
                };
            }
        });
        renderClassReport(filteredData);
    } catch (error) {
        console.error('Gagal load data kelas:', error);
    }
}

/** Render the class-based report table based on currently filtered donation data */
function renderClassReport(data) {
    const tbody = document.getElementById('class-report-tbody');
    if (!tbody) return;

    // Only santri donations that carry a class
    const santriDonations = (data || []).filter(row => row.TipeDonatur === 'santri' && row.KelasSantri);

    // Aggregate by class from donations
    const classMap = {};
    santriDonations.forEach(row => {
        const kelas = String(row.KelasSantri).trim();
        if (!classMap[kelas]) {
            classMap[kelas] = { totalAmount: 0, verifiedAmount: 0, unverifiedAmount: 0, donatedKeys: new Set() };
        }
        const val = parseFloat(row.Nominal) || 0;
        classMap[kelas].totalAmount += val;
        const key = String(row.NISSantri || row.NamaSantri || '').trim().toLowerCase();
        if (key) classMap[kelas].donatedKeys.add(key);
        if ((row.Status || 'Belum Verifikasi') === 'Terverifikasi') {
            classMap[kelas].verifiedAmount += val;
        } else {
            classMap[kelas].unverifiedAmount += val;
        }
    });

    // Build master count per class from loaded santri list
    const masterCount = {};
    allSantriData.forEach(s => {
        if (s.kelas) masterCount[s.kelas] = (masterCount[s.kelas] || 0) + 1;
    });

    const allClasses = new Set([...Object.keys(classMap), ...Object.keys(masterCount)]);

    if (allClasses.size === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400"><i class="fas fa-inbox text-2xl mb-2 block opacity-40"></i><span class="block mt-2">Tidak ada data santri dengan informasi kelas</span></td></tr>';
        return;
    }

    tbody.innerHTML = '';
    [...allClasses].sort((a, b) => a.localeCompare(b, 'id')).forEach(kelas => {
        const stats = classMap[kelas] || { totalAmount: 0, verifiedAmount: 0, unverifiedAmount: 0, donatedKeys: new Set() };
        const total   = masterCount[kelas] || 0;
        const donated = stats.donatedKeys.size;
        const meta    = classMetaData[kelas] || {};

        let participationHTML;
        if (total > 0) {
            const pct      = Math.min(100, Math.round((donated / total) * 100));
            const barColor = pct >= 75 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400';
            participationHTML = `
                <div class="flex items-center gap-2">
                    <div class="flex-1 bg-slate-100 rounded-full h-2 min-w-[60px]">
                        <div class="${barColor} h-2 rounded-full" style="width:${pct}%"></div>
                    </div>
                    <span class="text-xs font-black text-slate-700 shrink-0">${pct}%</span>
                </div>
                <div class="text-xs text-slate-400 mt-0.5">${donated} / ${total} santri</div>`;
        } else {
            participationHTML = `<span class="text-sm font-bold text-slate-700">${donated} menghimpun</span>`;
        }

        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 hover:bg-slate-50/80 transition-colors';
        tr.innerHTML = `
            <td class="px-4 py-3.5">
                <span class="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-black">
                    <i class="fas fa-door-open text-[10px]"></i>${escapeHtml(kelas)}
                </span>
                ${meta.wali    ? `<div class="text-xs text-slate-400 mt-1"><i class="fas fa-chalkboard-teacher mr-1 text-indigo-300"></i>${escapeHtml(meta.wali)}</div>`    : ''}
                ${meta.musyrif ? `<div class="text-xs text-slate-400 mt-0.5"><i class="fas fa-user-tie mr-1 text-indigo-300"></i>${escapeHtml(meta.musyrif)}</div>` : ''}
            </td>
            <td class="px-4 py-3.5 min-w-[160px]">${participationHTML}</td>
            <td class="px-4 py-3.5 font-black text-slate-800">${formatter.format(stats.totalAmount)}</td>
            <td class="px-4 py-3.5 font-bold text-green-700">${formatter.format(stats.verifiedAmount)}</td>
            <td class="px-4 py-3.5 font-bold text-yellow-600">${formatter.format(stats.unverifiedAmount)}</td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Render the "Santri Belum Menghimpun" tab.
 * Uses allDonationData (not filtered) so it shows students who have NEVER donated.
 */
function renderSantriChecker() {
    const loadingEl = document.getElementById('santri-not-donated-loading');
    const contentEl = document.getElementById('santri-not-donated-content');
    const summaryBar = document.getElementById('santri-summary-bar');
    const listEl     = document.getElementById('santri-not-donated-list');

    if (!loadingEl || !contentEl) return;
    if (allSantriData.length === 0) return;

    loadingEl.classList.add('hidden');
    contentEl.classList.remove('hidden');

    // Build a set of all NIS/names that appear in any donation (unfiltered)
    const donatedKeys = new Set();
    allDonationData.forEach(row => {
        if (row.TipeDonatur === 'santri') {
            if (row.NISSantri) donatedKeys.add(String(row.NISSantri).trim().toLowerCase());
            if (row.NamaSantri) donatedKeys.add(String(row.NamaSantri).trim().toLowerCase());
        }
    });

    const notDonated = [];
    const donated    = [];
    allSantriData.forEach(s => {
        if (!s.nama) return;
        const hasDonated = (s.nis && donatedKeys.has(s.nis.toLowerCase())) || donatedKeys.has(s.nama.toLowerCase());
        (hasDonated ? donated : notDonated).push(s);
    });

    const total = allSantriData.length;
    const pct   = total > 0 ? Math.round(donated.length / total * 100) : 0;

    if (summaryBar) {
        summaryBar.innerHTML = `
            <div class="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
                <div class="text-3xl font-black text-green-600">${donated.length}</div>
                <div class="text-xs font-bold text-green-500 mt-1">Sudah Menghimpun</div>
            </div>
            <div class="bg-red-50 rounded-2xl p-4 text-center border border-red-100">
                <div class="text-3xl font-black text-red-500">${notDonated.length}</div>
                <div class="text-xs font-bold text-red-400 mt-1">Belum Menghimpun</div>
            </div>
            <div class="bg-indigo-50 rounded-2xl p-4 text-center border border-indigo-100">
                <div class="text-3xl font-black text-indigo-600">${pct}%</div>
                <div class="text-xs font-bold text-indigo-400 mt-1">Tingkat Keaktifan</div>
            </div>`;
    }

    if (!listEl) return;

    if (notDonated.length === 0) {
        listEl.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-100">
                    <i class="fas fa-check-double text-green-500 text-2xl"></i>
                </div>
                <h4 class="font-black text-green-600 text-lg">Semua Santri Sudah Menghimpun!</h4>
                <p class="text-xs text-slate-400 mt-1">Tidak ada santri yang belum berdonasi.</p>
            </div>`;
        return;
    }

    // Group not-donated by class
    const byKelas = {};
    notDonated.forEach(s => {
        const k = s.kelas || 'Tanpa Kelas';
        if (!byKelas[k]) byKelas[k] = [];
        byKelas[k].push(s);
    });

    let html = `<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
        <i class="fas fa-exclamation-circle text-red-400 mr-1.5"></i>Santri Belum Menghimpun per Kelas
    </h4>`;

    Object.keys(byKelas).sort((a, b) => a.localeCompare(b, 'id')).forEach(kelas => {
        const students = byKelas[kelas];
        html += `
            <div class="mb-4 rounded-2xl overflow-hidden border border-slate-100">
                <div class="px-4 py-3 bg-slate-50 flex items-center justify-between">
                    <span class="text-xs font-black text-slate-700">
                        <i class="fas fa-door-open mr-1.5 text-indigo-400"></i>${escapeHtml(kelas)}
                    </span>
                    <span class="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">${students.length} santri</span>
                </div>
                <div class="divide-y divide-slate-50">
                    ${students.map(s => `
                        <div class="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                            <span class="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <i class="fas fa-times-circle text-red-300 text-xs"></i>${escapeHtml(s.nama)}
                            </span>
                            ${s.nis ? `<span class="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded">${escapeHtml(s.nis)}</span>` : ''}
                        </div>`).join('')}
                </div>
            </div>`;
    });

    listEl.innerHTML = html;
}

// Event Listeners
refreshButton.addEventListener('click', fetchData);
filterApplyBtn.addEventListener('click', applyFilters);
filterResetBtn.addEventListener('click', resetFilters);
exportCsvBtn.addEventListener('click', exportToCSV);
editForm.addEventListener('submit', handleEditSubmit);
paginationRowsEl.addEventListener('change', () => { currentPage = 1; renderTable(); });
paginationPrevBtn.addEventListener('click', () => { if(currentPage > 1) { currentPage--; renderTable(); }});
paginationNextBtn.addEventListener('click', () => { const max = Math.ceil(filteredData.length/rowsPerPage); if(currentPage < max) { currentPage++; renderTable(); }});

// Analytics Tab Switching
document.querySelectorAll('.analytics-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.analytics-tab-btn').forEach(b => {
            b.classList.remove('text-indigo-600', 'bg-indigo-50', 'border-b-2', 'border-indigo-500');
            b.classList.add('text-slate-400');
        });
        btn.classList.add('text-indigo-600', 'bg-indigo-50', 'border-b-2', 'border-indigo-500');
        btn.classList.remove('text-slate-400');
        const tab = btn.dataset.tab;
        document.getElementById('analytics-tab-kelas').classList.toggle('hidden', tab !== 'kelas');
        document.getElementById('analytics-tab-santri').classList.toggle('hidden', tab !== 'santri');
    });
});

// Analytics Panel Toggle (Collapse/Expand)
document.getElementById('analytics-toggle-btn').addEventListener('click', () => {
    const body = document.getElementById('analytics-body');
    const icon = document.getElementById('analytics-toggle-icon');
    body.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
});

// Refresh Santri Button — clears cache and re-fetches
document.getElementById('refresh-santri-btn').addEventListener('click', () => {
    localStorage.removeItem(CACHE.KEY);
    localStorage.removeItem(CACHE.TIME_KEY);
    fetchSantriData();
    fetchClassData();
});

// Retry Button (shown on error state)
document.getElementById('retry-santri-btn').addEventListener('click', () => {
    fetchSantriData();
    fetchClassData();
});

// Delegate Click Actions
tableWrapperEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const row = parseInt(btn.dataset.row);
    if (btn.classList.contains('verify-btn')) verifyDonation(row);
    if (btn.classList.contains('edit-btn')) openEditModal(row);
    if (btn.classList.contains('delete-btn')) showAppConfirm("Hapus data ini secara permanen?", () => executeDelete(row));
    // Handle Print Button
    if (btn.classList.contains('print-btn')) handlePrintReceipt(row);
    // Handle WhatsApp Copy Button
    if (btn.classList.contains('whatsapp-btn')) copyWhatsAppMessage(row);
});
