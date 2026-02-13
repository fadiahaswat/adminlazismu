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

        if(contentEl) contentEl.classList.remove('hidden'); // <-- TAMBAHKAN BARIS INI
        
        // Panggil fungsi ambil data Anda yang lama
        fetchData(); 
    } else {
        // JIKA TIDAK LOGIN / BELUM LOGIN
        console.log("Belum login");
        overlay.classList.remove('hidden'); // Tutup gerbang (munculkan login)
        if(contentEl) contentEl.classList.add('hidden'); // <-- TAMBAHKAN BARIS INI
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
const loadingEl = document.getElementById('admin-loading');
const tableWrapperEl = document.getElementById('admin-table-wrapper');
const tableBodyEl = document.getElementById('table-body');
const refreshButton = document.getElementById('refresh-button');
const refreshIcon = document.getElementById('refresh-icon');
const contentEl = document.getElementById('admin-content'); // <-- TAMBAHKAN INI

// Statistik Elements
const statTotalEl = document.getElementById('admin-stat-total');
const statDonaturEl = document.getElementById('admin-stat-donatur');
const statHariIniEl = document.getElementById('admin-stat-hari-ini');
const statTertinggiEl = document.getElementById('admin-stat-tertinggi');
const statRataEl = document.getElementById('admin-stat-rata');
const statTipeEl = document.getElementById('admin-stat-tipe');

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
        
        // Fetch data dengan GET request (UUID-based backend)
        const response = await fetch(GAS_API_URL); 
        
        const result = await response.json();
        if (result.status !== "success") throw new Error(result.message);
        
        // Sort berdasarkan Timestamp (terbaru di atas)
        allDonationData = result.data.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
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

async function verifyDonation(row) {
    showAppConfirm("Verifikasi donasi ini? Pastikan dana sudah masuk.", async () => {
        try {
            // Kirim ke Backend dengan row number
            const response = await fetch(GAS_API_URL, {
                method: 'POST',
                body: JSON.stringify({ 
                    action: "verify", 
                    row: parseInt(row)  // Gunakan 'row' untuk row number
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
    const todayStr = new Date().toDateString();
    
    const typeCounts = {};

    data.forEach(row => {
        const val = parseFloat(row.nominal) || 0;  // Gunakan 'nominal' bukan 'Nominal'
        total += val;
        if (val > maxVal) maxVal = val;
        
        if (new Date(row.Timestamp).toDateString() === todayStr) {
            todayTotal += val;
        }

        const type = row.type || 'Lainnya';  // Gunakan 'type' bukan 'JenisDonasi'
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

    statTotalEl.textContent = formatter.format(total);
    statDonaturEl.textContent = count;
    statHariIniEl.textContent = formatter.format(todayTotal);
    statTertinggiEl.textContent = formatter.format(maxVal);
    statRataEl.textContent = formatter.format(avgVal);
    statTipeEl.textContent = topType;
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
        
        if (row.donaturTipe === 'santri') {
            badgeTipe = 'bg-orange-100 text-orange-600';
            detailInfo = `<div class="text-xs text-slate-500 mt-0.5"><i class="fas fa-child"></i> ${escapeHtml(row.namaSantri) || '-'}</div>`;
        } else if (row.donaturTipe === 'alumni') {
            badgeTipe = 'bg-blue-100 text-blue-600';
            detailInfo = `<div class="text-xs text-slate-500 mt-0.5"><i class="fas fa-graduation-cap"></i> Angkatan ${escapeHtml(row.DetailAlumni) || '-'}</div>`;
        } else {
            detailInfo = `<div class="text-xs text-slate-500 mt-0.5">Umum</div>`;
        }

        let methodColor = 'bg-slate-100 text-slate-500';
        if(row.metode === 'QRIS') methodColor = 'bg-blue-50 text-blue-600 border-blue-100';
        if(row.metode === 'Transfer') methodColor = 'bg-purple-50 text-purple-600 border-purple-100';
        if(row.metode === 'Tunai') methodColor = 'bg-green-50 text-green-600 border-green-100';

        // Highlight Kode Unik
        const nominalVal = parseFloat(row.nominal) || 0;
        let nominalHTML = formatter.format(nominalVal);
        if (nominalVal % 1000 !== 0 && row.metode !== 'Tunai') {
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
            verifyBtnHTML = `<button class="verify-btn w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition flex items-center justify-center shadow-sm border border-green-100 mr-2" data-row="${row.row}" title="Verifikasi"><i class="fas fa-check text-xs"></i></button>`;
        }

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="block font-bold text-slate-700">${dateStr}</span>
                <span class="text-xs text-slate-400">${timeStr}</span>
            </td>
            <td class="px-6 py-4">
                <span class="font-bold text-slate-800 block">${escapeHtml(row.nama) || 'Hamba Allah'}</span>
                <span class="text-xs text-slate-400 block">${escapeHtml(row.hp) || '-'}</span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${badgeTipe}">${escapeHtml(row.donaturTipe) || 'Umum'}</span>
                <div class="text-xs font-semibold text-slate-600">${escapeHtml(row.type)}</div>
                ${detailInfo}
            </td>
            <td class="px-6 py-4 text-right">
                <span class="font-black text-slate-800 text-sm">${nominalHTML}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="px-2 py-1 rounded border text-[10px] font-bold uppercase ${methodColor}">${escapeHtml(row.metode) || '-'}</span>
            </td>
            <td class="px-6 py-4 text-center">
                ${statusBadge}
            </td>
            <td class="px-6 py-4 text-right whitespace-nowrap">
                <div class="flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="print-btn w-8 h-8 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-500 hover:text-white transition flex items-center justify-center mr-2 shadow-sm border border-purple-100" data-row="${row.row}" title="Cetak Kuitansi"><i class="fas fa-print text-xs"></i></button>

                    ${verifyBtnHTML}
                    <button class="edit-btn w-8 h-8 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition flex items-center justify-center mr-2" data-row="${row.row}" title="Edit"><i class="fas fa-pencil-alt text-xs"></i></button>
                    <button class="delete-btn w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition flex items-center justify-center" data-row="${row.row}" title="Hapus"><i class="fas fa-trash-alt text-xs"></i></button>
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
        if (row.type) jenisSet.add(row.type);  // Gunakan 'type' bukan 'JenisDonasi'
        if (row.metode) metodeSet.add(row.metode);  // Gunakan 'metode' bukan 'MetodePembayaran'
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
        if (jenis && row.type !== jenis) return false;  // Gunakan 'type' bukan 'JenisDonasi'
        if (metode && row.metode !== metode) return false;  // Gunakan 'metode' bukan 'MetodePembayaran'
        
        // Filter Status Logic
        if (status && rowStatus !== status) return false;

        if (search) {
            const str = `${row.nama || ''} ${row.nisSantri || ''} ${row.hp || ''} ${row.email || ''} ${row.namaSantri || ''}`.toLowerCase();
            if (!str.includes(search)) return false;
        }
        return true;
    });

    calculateStatistics(filteredData);
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
    document.getElementById('edit-row-number').value = data.row;  // Store row number
    
    // Map new field names to old form field IDs for backward compatibility
    const fieldMapping = {
        'JenisDonasi': data.type,
        'Nominal': data.nominal,
        'MetodePembayaran': data.metode,
        'NamaDonatur': data.nama,
        'NoHP': data.hp,
        'Email': data.email,
        'NoKTP': data.NoKTP,
        'Alamat': data.alamat,
        'TipeDonatur': data.donaturTipe,
        'DetailAlumni': data.DetailAlumni,
        'NamaSantri': data.namaSantri,
        'NISSantri': data.nisSantri,
        'KelasSantri': data.rombelSantri,
        'PesanDoa': data.doa
    };
    
    Object.keys(fieldMapping).forEach(formFieldId => {
        const el = document.getElementById(`edit-${formFieldId}`);
        if(el) el.value = fieldMapping[formFieldId] || '';
    });
    
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

    const rowNumber = document.getElementById('edit-row-number').value;  // Row number instead of UUID
    const formData = {};
    const inputs = editForm.querySelectorAll('input, select, textarea');
    
    // Mengumpulkan data dari form modal edit
    inputs.forEach(input => {
        const key = input.id.replace('edit-', '');
        if (key && key !== 'row-number') formData[key] = input.value;
    });
    
    // Transform form data to new field names
    const payload = {
        type: formData.JenisDonasi,
        nominal: parseFloat(formData.Nominal) || 0,
        metode: formData.MetodePembayaran,
        nama: formData.NamaDonatur,
        hp: formData.NoHP,
        alamat: formData.Alamat,
        email: formData.Email,
        NoKTP: formData.NoKTP,
        doa: formData.PesanDoa,
        donaturTipe: formData.TipeDonatur,
        DetailAlumni: formData.DetailAlumni,
        namaSantri: formData.NamaSantri,
        nisSantri: formData.NISSantri,
        rombelSantri: formData.KelasSantri
    };

    try {
        // Kirim data ke Google Apps Script API dengan row number
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: "update", 
                row: parseInt(rowNumber),  // Gunakan 'row' untuk row number
                payload: payload
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
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: "delete", 
                row: parseInt(rowNumber)  // Gunakan 'row' untuk row number
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
    const keys = ['Timestamp', 'type', 'nominal', 'metode', 'nama', 'donaturTipe', 'namaSantri', 'rombelSantri', 'hp', 'doa', 'Status'];
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
    const data = allDonationData.find(r => r.row === rowNumber);  // Gunakan row number
    if (!data) return;

    showAppAlert("Sedang membuat PDF...", false);
    
    // 1. ISI DATA KE TEMPLATE (Mapping Data)
    const dateObj = new Date(data.Timestamp);
    const nominal = parseFloat(data.nominal) || 0;  // Gunakan 'nominal' bukan 'Nominal'
    
    // Format Tanggal (Pecah per digit untuk kotak-kotak)
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = String(dateObj.getFullYear());

    const terbilangEl = document.getElementById('rcpt-terbilang-1');
    const terbilang2El = document.getElementById('rcpt-terbilang-2');

    document.getElementById('rcpt-no').innerText = `KL-${String(rowNumber).padStart(5, '0')}`; // Gunakan row number dengan padding
    document.getElementById('rcpt-d1').innerText = d[0]; document.getElementById('rcpt-d2').innerText = d[1];
    document.getElementById('rcpt-m1').innerText = m[0]; document.getElementById('rcpt-m2').innerText = m[1];
    document.getElementById('rcpt-y1').innerText = y[2]; document.getElementById('rcpt-y2').innerText = y[3];

    document.getElementById('rcpt-nama').innerText = data.nama || 'Hamba Allah';  // Gunakan 'nama'
    document.getElementById('rcpt-alamat').innerText = data.alamat || '-';
    document.getElementById('rcpt-hp').innerText = data.hp || '-';  // Gunakan 'hp'
    document.getElementById('rcpt-penyetor').innerText = data.nama || '';

    // Clear All Nominal Fields
    const nominalFields = ['zakat', 'infaq', 'lain'];
    nominalFields.forEach(k => {
        document.getElementById(`rcpt-jenis-${k}`).innerText = '';
        document.getElementById(`rcpt-nom-${k}`).innerText = '';
    });

    // Logic Penempatan Nominal
    const fmtNominal = formatter.format(nominal);
    const jenis = (data.type || '').toLowerCase();  // Gunakan 'type' bukan 'JenisDonasi'
    
    // Cek Nominal (Hanya Rp 1.000.249)
    // Nominal dicetak sekali saja di kolom yang relevan.
    if(jenis.includes('zakat')) {
        document.getElementById('rcpt-jenis-zakat').innerText = data.type;
        document.getElementById('rcpt-nom-zakat').innerText = fmtNominal;
    } else if(jenis.includes('infaq') || jenis.includes('shodaqoh') || jenis.includes('pendidikan')) {
        document.getElementById('rcpt-jenis-infaq').innerText = data.type;
        document.getElementById('rcpt-nom-infaq').innerText = fmtNominal;
    } else {
        document.getElementById('rcpt-jenis-lain').innerText = data.type;
        document.getElementById('rcpt-nom-lain').innerText = fmtNominal;
    }
    
    // Nominal Total
    document.getElementById('rcpt-total').innerText = fmtNominal;
    
    // Checkbox Logic
    document.getElementById('rcpt-chk-kas').innerText = data.metode === 'Tunai' ? 'V' : '';  // Gunakan 'metode'
    document.getElementById('rcpt-chk-bank').innerText = data.metode !== 'Tunai' ? 'V' : '';
    document.getElementById('rcpt-nama-bank').innerText = data.metode !== 'Tunai' ? data.metode : '';
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
    const opt = {
        margin: 0,
        filename: `Kuitansi_Lazismu_${String(rowNumber).padStart(5, '0')}_${data.nama.replace(/\s/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        // >>> OPTIMASI PENTING UNTUK MENGATASI MISALIGNMENT FIX (SCALE: 3)
        html2canvas: { scale: 2, useCORS: true }, // Scale 2 sudah cukup tajam & lebih ringan
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'landscape' }
    };

    try {
        await html2pdf().set(opt).from(element).save();
        
        // Panggil server untuk notifikasi (optional)
        await fetch(GAS_API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: "sendReceipt"
            })
        });
        
        showAppAlert(`Kuitansi PDF berhasil dibuat dan diunduh! Silakan cek folder Download Anda.`, false);

    } catch (err) {
        showAppAlert("Gagal Generate PDF: " + err.message, true);
    } finally {
        // Reset font size setelah selesai
        terbilangEl.style.fontSize = '14pt';
    }
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

// Delegate Click Actions
tableWrapperEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const rowNumber = parseInt(btn.dataset.row);  // Gunakan data-row untuk row number
    if (isNaN(rowNumber) || rowNumber < 1) return;
    
    if (btn.classList.contains('verify-btn')) verifyDonation(rowNumber);
    if (btn.classList.contains('edit-btn')) openEditModal(rowNumber);
    if (btn.classList.contains('delete-btn')) showAppConfirm("Hapus data ini secara permanen?", () => executeDelete(rowNumber));
    if (btn.classList.contains('print-btn')) handlePrintReceipt(rowNumber);
});
