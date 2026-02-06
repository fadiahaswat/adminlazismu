// =====================================================================
// 1. IMPORT LIBRARY FIREBASE
// =====================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";

// =====================================================================
// 2. KONFIGURASI
// =====================================================================

// Konfigurasi Firebase Anda
const firebaseConfig = {
    apiKey: "AIzaSyAWPIcS8h3kE6kJYBxjeVFdSprgrMzOFo8",
    authDomain: "lazismu-auth.firebaseapp.com",
    projectId: "lazismu-auth",
    storageBucket: "lazismu-auth.firebasestorage.app",
    messagingSenderId: "398570239500",
    appId: "1:398570239500:web:0b3e96109a4bf304ebe029"
};

// Daftar Email Admin yang Diizinkan
const ALLOWED_ADMIN_EMAILS = [
    "lazismumuallimin@gmail.com",
    "ad.lazismumuallimin@gmail.com",
    "andiaqillahfadiahaswat@gmail.com"
];
const ALLOWED_ADMIN_EMAILS_LOWER = ALLOWED_ADMIN_EMAILS.map(email => email.toLowerCase());

// URL Google Apps Script (Backend)
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec";

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Inisialisasi App Check (Keamanan Tambahan)
try {
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6LeXJmAsAAAAAJzjGF8E3oVbviXI_5BeEZYjy_hP'),
        isTokenAutoRefreshEnabled: true
    });
} catch (e) { console.warn("App Check init skipped"); }

// =====================================================================
// 3. VARIABEL GLOBAL
// =====================================================================
let allDonationData = [];
let filteredData = [];
let currentPage = 1;
let rowsPerPage = 50;
let selectedRows = new Set(); // Menyimpan baris yang dicentang (Bulk Action)

// Formatter Rupiah
const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

// =====================================================================
// 4. FUNGSI UTAMA (AUTH & FETCH)
// =====================================================================

// --- LOGIN GOOGLE ---
document.getElementById('btn-login-google').addEventListener('click', async () => {
    const btn = document.getElementById('btn-login-google');
    const errorMsg = document.getElementById('login-error');
    
    // UI Loading
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;
    errorMsg.classList.add('hidden');
    errorMsg.classList.remove('flex');

    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Cek apakah email terdaftar sebagai admin
        if (!ALLOWED_ADMIN_EMAILS_LOWER.includes(user.email.toLowerCase().trim())) {
            await signOut(auth); // Tendang keluar jika bukan admin
            throw new Error("Akses Ditolak! Email Anda tidak terdaftar sebagai admin.");
        }

    } catch (error) {
        console.error("Login Error:", error);
        errorMsg.textContent = error.message;
        errorMsg.classList.remove('hidden');
        errorMsg.classList.add('flex');
        btn.innerHTML = '<i class="fab fa-google text-xl text-red-500"></i><span>Masuk dengan Google</span>';
        btn.disabled = false;
    }
});

// --- LOGOUT ---
window.logout = function() {
    signOut(auth).then(() => location.reload());
};

// --- OBSERVER STATUS LOGIN (Anti-Inspect Element) ---
onAuthStateChanged(auth, (user) => {
    const overlay = document.getElementById('login-overlay');
    const adminContent = document.getElementById('admin-content');
    
    if (user && ALLOWED_ADMIN_EMAILS_LOWER.includes(user.email.toLowerCase().trim())) {
        // LOGIN SUKSES: Buka konten
        overlay.classList.add('hidden');
        adminContent.classList.remove('hidden');
        adminContent.classList.add('animate-enter');
        
        // Ambil data
        fetchData();
    } else {
        // BELUM LOGIN / LOGOUT: Tutup konten
        if(user) signOut(auth); // Paksa logout jika email nyasar
        overlay.classList.remove('hidden');
        adminContent.classList.add('hidden');
        adminContent.classList.remove('animate-enter');
    }
});

// --- AMBIL DATA (GET) ---
async function fetchData() {
    // Tampilkan Skeleton Loading
    const skeleton = document.getElementById('skeleton-loader');
    const tableWrapper = document.getElementById('admin-table-wrapper');
    const mobileCards = document.getElementById('mobile-card-view');
    const refreshIcon = document.getElementById('refresh-icon');

    if(skeleton) skeleton.classList.remove('hidden');
    if(tableWrapper) tableWrapper.classList.add('hidden');
    if(mobileCards) mobileCards.classList.add('hidden');
    if(refreshIcon) refreshIcon.classList.add('fa-spin');

    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Sesi login berakhir.");

        // Request GET ke Google Apps Script
        const response = await fetch(GAS_API_URL);
        const result = await response.json();

        if (result.status !== "success") throw new Error(result.message);

        // Simpan & Urutkan Data (Terbaru di atas)
        allDonationData = result.data.sort((a, b) => b.row - a.row);
        
        // Setup Filter & Tampilkan
        populateFilterDropdowns(allDonationData);
        applyFilters();

    } catch (error) {
        console.error("Fetch Error:", error);
        showToast(error.message || "Gagal memuat data", 'error');
    } finally {
        // Sembunyikan Loading
        if(skeleton) skeleton.classList.add('hidden');
        if(tableWrapper) tableWrapper.classList.remove('hidden');
        if(mobileCards) mobileCards.classList.remove('hidden');
        if(refreshIcon) refreshIcon.classList.remove('fa-spin');
    }
}

// --- KIRIM DATA (POST Helper) ---
async function sendData(payload) {
    const user = auth.currentUser;
    if (!user) throw new Error("Silakan login kembali.");

    // Ambil Token Keamanan
    const token = await user.getIdToken();
    payload.authToken = token; 

    const response = await fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    const res = await response.json();
    if (res.status !== 'success') throw new Error(res.message);
    return res;
}

// =====================================================================
// 5. RENDERING UI (Tabel Desktop & Kartu Mobile)
// =====================================================================

function renderTable() {
    const tableBodyEl = document.getElementById('table-body');
    const mobileCardContainer = document.getElementById('mobile-card-view');
    
    // Reset Konten
    tableBodyEl.innerHTML = '';
    mobileCardContainer.innerHTML = '';

    // Hitung Pagination
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Tampilan Kosong
    if (paginatedData.length === 0) {
        const emptyHTML = `<tr><td colspan="8" class="text-center py-10 text-slate-400">Tidak ada data ditemukan</td></tr>`;
        tableBodyEl.innerHTML = emptyHTML;
        mobileCardContainer.innerHTML = `<div class="text-center py-10 text-slate-400">Tidak ada data</div>`;
        renderPagination();
        return;
    }

    paginatedData.forEach(row => {
        // Tentukan Warna Status
        const statusClass = row.Status === "Terverifikasi" 
            ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
            : "bg-amber-100 text-amber-700 border-amber-200";
        
        const isChecked = selectedRows.has(row.row) ? 'checked' : '';

        // --- 1. RENDER DESKTOP (TABLE ROW) ---
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 group";
        
        tr.innerHTML = `
            <td class="px-6 py-4 text-center">
                <input type="checkbox" class="row-checkbox w-4 h-4 text-orange-500 rounded focus:ring-orange-500 cursor-pointer" 
                    value="${row.row}" onchange="toggleRowSelection(${row.row}, this)" ${isChecked}>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-bold text-slate-700 text-xs">${formatDate(row.Timestamp)}</div>
                <div class="text-[10px] text-slate-400">${formatTime(row.Timestamp)}</div>
            </td>
            <td class="px-6 py-4">
                <div class="font-bold text-slate-800">${row.NamaDonatur}</div>
                <div class="text-xs text-slate-500">${row.NoHP || '-'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg inline-block border border-orange-100">
                    ${formatter.format(row.Nominal)}
                </div>
            </td>
            <td class="px-6 py-4"><span class="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">${row.MetodePembayaran}</span></td>
            <td class="px-6 py-4 text-xs text-slate-500 truncate max-w-[150px]">${row.JenisDonasi}</td>
            <td class="px-6 py-4 text-center">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${statusClass}">${row.Status}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    ${row.Status !== 'Terverifikasi' ? `<button onclick="verifyAction(${row.row})" class="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-200" title="Verif"><i class="fas fa-check"></i></button>` : ''}
                    <button onclick="editAction(${row.row})" class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                    <button onclick="deleteAction(${row.row})" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200" title="Hapus"><i class="fas fa-trash-alt"></i></button>
                    <button onclick="handlePrintReceipt(${row.row})" class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white border border-purple-200" title="Kuitansi"><i class="fas fa-file-invoice"></i></button>
                </div>
            </td>
        `;
        tableBodyEl.appendChild(tr);

        // --- 2. RENDER MOBILE (CARD VIEW) ---
        const cardHTML = `
            <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div class="absolute left-0 top-0 bottom-0 w-1.5 ${row.Status === 'Terverifikasi' ? 'bg-green-500' : 'bg-yellow-500'}"></div>
                <div class="pl-3">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="text-[10px] text-slate-400 font-bold uppercase">${formatDate(row.Timestamp)}</span>
                            <h4 class="font-bold text-slate-800">${row.NamaDonatur}</h4>
                        </div>
                        <span class="text-[10px] font-bold px-2 py-1 rounded uppercase ${statusClass}">${row.Status}</span>
                    </div>
                    <div class="flex justify-between items-center bg-slate-50 p-3 rounded-lg mb-3 border border-slate-100">
                        <span class="font-black text-slate-800">${formatter.format(row.Nominal)}</span>
                        <span class="text-xs font-bold text-slate-500">${row.MetodePembayaran}</span>
                    </div>
                    <div class="grid grid-cols-4 gap-2">
                        ${row.Status !== 'Terverifikasi' ? `<button onclick="verifyAction(${row.row})" class="bg-green-50 text-green-700 py-2 rounded font-bold text-xs">Verif</button>` : ''}
                        <button onclick="editAction(${row.row})" class="bg-blue-50 text-blue-700 py-2 rounded font-bold text-xs">Edit</button>
                        <button onclick="handlePrintReceipt(${row.row})" class="bg-purple-50 text-purple-700 py-2 rounded font-bold text-xs">Kuitansi</button>
                        <button onclick="deleteAction(${row.row})" class="bg-red-50 text-red-700 py-2 rounded font-bold text-xs">Hapus</button>
                    </div>
                </div>
            </div>
        `;
        mobileCardContainer.innerHTML += cardHTML;
    });

    renderPagination();
    updateBulkActionBar();
}

function renderPagination() {
    const totalData = filteredData.length;
    const totalPages = Math.ceil(totalData / rowsPerPage);
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, totalData);
    
    document.getElementById('pagination-info').textContent = totalData > 0 
        ? `Menampilkan ${start}-${end} dari ${totalData}`
        : 'Tidak ada data';
        
    document.getElementById('pagination-prev').disabled = currentPage === 1;
    document.getElementById('pagination-next').disabled = currentPage === totalPages || totalPages === 0;
}

// =====================================================================
// 6. ACTION LOGIC (VERIFY, EDIT, DELETE, PRINT)
// =====================================================================

window.verifyAction = function(row) {
    showAppConfirm("Verifikasi donasi ini? Pastikan dana sudah masuk.", async () => {
        try {
            await sendData({ action: 'verify', row: row });
            showToast("Data berhasil diverifikasi!");
            fetchData();
        } catch (e) { showAppAlert(e.message, true); }
    });
};

window.deleteAction = function(row) {
    showAppConfirm("Hapus data ini secara permanen?", async () => {
        try {
            await sendData({ action: 'delete', row: row });
            showToast("Data berhasil dihapus!");
            fetchData();
        } catch (e) { showAppAlert(e.message, true); }
    });
};

window.editAction = function(row) {
    const data = allDonationData.find(r => r.row === row);
    if (!data) return;
    
    document.getElementById('edit-row-number').value = data.row;
    
    // Auto-fill form
    const fields = ['JenisDonasi', 'Nominal', 'MetodePembayaran', 'NamaDonatur', 'NoHP', 'Email', 'NoKTP', 'Alamat', 'TipeDonatur', 'NamaSantri', 'KelasSantri', 'PesanDoa'];
    fields.forEach(f => {
        const el = document.getElementById(`edit-${f}`);
        if(el) el.value = data[f] || '';
    });
    
    showModal(document.getElementById('edit-modal'));
};

document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('edit-modal-save');
    const originalText = document.getElementById('edit-save-text').textContent;
    const loadIcon = document.getElementById('edit-save-loading');
    
    btn.disabled = true;
    loadIcon.classList.remove('hidden');

    try {
        const row = document.getElementById('edit-row-number').value;
        const payload = {};
        
        // Ambil data form
        document.querySelectorAll('#edit-form input, #edit-form select, #edit-form textarea').forEach(input => {
            const key = input.id.replace('edit-', '');
            if (key && key !== 'row-number') payload[key] = input.value;
        });

        await sendData({ action: 'update', row: row, payload: payload });
        
        hideModal(document.getElementById('edit-modal'));
        showToast("Data berhasil diperbarui!");
        fetchData();
    } catch (err) {
        showAppAlert(err.message, true);
    } finally {
        btn.disabled = false;
        loadIcon.classList.add('hidden');
    }
});

// --- PRINT KUITANSI ---
window.handlePrintReceipt = async function(rowNumber) {
    const data = allDonationData.find(r => r.row === rowNumber);
    if (!data) return;
    
    showToast("Menyiapkan PDF...", "info");
    
    // Mapping Data ke HTML Kuitansi
    document.getElementById('rcpt-no').textContent = `KWT-${data.row}`;
    document.getElementById('rcpt-nama').textContent = data.NamaDonatur;
    document.getElementById('rcpt-total').textContent = formatter.format(data.Nominal);
    document.getElementById('rcpt-terbilang-1').textContent = terbilang(data.Nominal) + " Rupiah";
    
    // Tgl
    const date = new Date(data.Timestamp);
    document.getElementById('rcpt-d1').innerText = String(date.getDate()).padStart(2, '0')[0];
    document.getElementById('rcpt-d2').innerText = String(date.getDate()).padStart(2, '0')[1];
    document.getElementById('rcpt-m1').innerText = String(date.getMonth()+1).padStart(2, '0')[0];
    document.getElementById('rcpt-m2').innerText = String(date.getMonth()+1).padStart(2, '0')[1];
    document.getElementById('rcpt-y1').innerText = String(date.getFullYear())[2];
    document.getElementById('rcpt-y2').innerText = String(date.getFullYear())[3];

    // Generate PDF
    const element = document.getElementById('receipt-content');
    const opt = {
        margin: 0,
        filename: `Kuitansi_${data.NamaDonatur}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'landscape' }
    };
    
    try {
        await html2pdf().set(opt).from(element).save();
        showToast("PDF Berhasil diunduh!");
    } catch (e) {
        showToast("Gagal buat PDF: " + e.message, 'error');
    }
};

// =====================================================================
// 7. BULK ACTION & FILTER
// =====================================================================

window.toggleRowSelection = function(rowId, checkbox) {
    if (checkbox.checked) selectedRows.add(rowId);
    else selectedRows.delete(rowId);
    updateBulkActionBar();
};

function updateBulkActionBar() {
    const bar = document.getElementById('bulk-action-bar');
    document.getElementById('selected-count').textContent = selectedRows.size;
    
    if (selectedRows.size > 0) bar.classList.remove('hidden');
    else {
        bar.classList.add('hidden');
        const selectAll = document.getElementById('select-all');
        if(selectAll) selectAll.checked = false;
    }
}

document.getElementById('select-all')?.addEventListener('change', (e) => {
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.checked = e.target.checked;
        const id = parseInt(cb.value);
        e.target.checked ? selectedRows.add(id) : selectedRows.delete(id);
    });
    updateBulkActionBar();
});

window.verifySelected = async function() {
    if(!confirm(`Verifikasi ${selectedRows.size} data sekaligus?`)) return;
    
    let successCount = 0;
    for (let rowId of selectedRows) {
        try {
            await sendData({ action: 'verify', row: rowId });
            successCount++;
        } catch(e) { console.error(e); }
    }
    
    selectedRows.clear();
    updateBulkActionBar();
    showToast(`${successCount} data berhasil diproses.`);
    fetchData();
};

// --- FILTERING ---
function applyFilters() {
    const search = document.getElementById('filter-search').value.toLowerCase();
    const status = document.getElementById('filter-status').value;
    const jenis = document.getElementById('filter-jenis').value;
    const metode = document.getElementById('filter-metode').value;
    
    filteredData = allDonationData.filter(row => {
        const matchesSearch = !search || (row.NamaDonatur && row.NamaDonatur.toLowerCase().includes(search));
        const matchesStatus = !status || row.Status === status;
        const matchesJenis = !jenis || row.JenisDonasi === jenis;
        const matchesMetode = !metode || row.MetodePembayaran === metode;
        return matchesSearch && matchesStatus && matchesJenis && matchesMetode;
    });

    calculateStatistics(filteredData);
    currentPage = 1;
    renderTable();
}

function populateFilterDropdowns(data) {
    const jenisSet = new Set(), metodeSet = new Set();
    data.forEach(row => {
        if(row.JenisDonasi) jenisSet.add(row.JenisDonasi);
        if(row.MetodePembayaran) metodeSet.add(row.MetodePembayaran);
    });
    
    const jenisSel = document.getElementById('filter-jenis');
    const metodeSel = document.getElementById('filter-metode');
    jenisSel.length = 1; metodeSel.length = 1;
    jenisSet.forEach(v => jenisSel.add(new Option(v, v)));
    metodeSet.forEach(v => metodeSel.add(new Option(v, v)));
}

function calculateStatistics(data) {
    let total = 0, count = data.length, todayTotal = 0;
    const todayStr = new Date().toDateString();
    
    data.forEach(row => {
        const val = parseFloat(row.Nominal) || 0;
        total += val;
        if(new Date(row.Timestamp).toDateString() === todayStr) todayTotal += val;
    });
    
    document.getElementById('admin-stat-total').textContent = formatter.format(total);
    document.getElementById('admin-stat-donatur').textContent = count;
    document.getElementById('admin-stat-hari-ini').textContent = formatter.format(todayTotal);
}

// =====================================================================
// 8. UTILITIES (HELPERS)
// =====================================================================

function showToast(msg, type='success') {
    const container = document.getElementById('toast-container');
    const div = document.createElement('div');
    const color = type === 'success' ? 'border-green-500' : 'border-red-500';
    const icon = type === 'success' ? 'fa-check' : 'fa-times';
    
    div.className = `bg-white border-l-4 ${color} px-4 py-3 rounded shadow-lg flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-300`;
    div.innerHTML = `<i class="fas ${icon}"></i> <div><div class="font-bold text-sm capitalize">${type}</div><div class="text-xs">${msg}</div></div>`;
    
    container.appendChild(div);
    requestAnimationFrame(() => div.classList.remove('translate-y-10', 'opacity-0'));
    setTimeout(() => {
        div.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date) ? dateString : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date) ? '' : new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function terbilang(nilai) {
    nilai = Math.abs(nilai);
    const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let temp = "";
    if (nilai < 12) temp = " " + huruf[nilai];
    else if (nilai < 20) temp = terbilang(nilai - 10) + " Belas";
    else if (nilai < 100) temp = terbilang(Math.floor(nilai / 10)) + " Puluh" + terbilang(nilai % 10);
    else if (nilai < 200) temp = " Seratus" + terbilang(nilai - 100);
    else if (nilai < 1000) temp = terbilang(Math.floor(nilai / 100)) + " Ratus" + terbilang(nilai % 100);
    else if (nilai < 2000) temp = " Seribu" + terbilang(nilai - 1000);
    else if (nilai < 1000000) temp = terbilang(Math.floor(nilai / 1000)) + " Ribu" + terbilang(nilai % 1000);
    else if (nilai < 1000000000) temp = terbilang(Math.floor(nilai / 1000000)) + " Juta" + terbilang(nilai % 1000000);
    return temp.trim();
}

function showModal(el) {
    el.classList.remove('hidden');
    setTimeout(() => {
        el.classList.remove('opacity-0');
        el.querySelector('.modal-content').classList.remove('scale-95');
    }, 10);
}

function hideModal(el) {
    el.classList.add('opacity-0');
    el.querySelector('.modal-content').classList.add('scale-95');
    setTimeout(() => el.classList.add('hidden'), 300);
}

function showAppConfirm(msg, callback) {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-modal-message').textContent = msg;
    const okBtn = document.getElementById('confirm-modal-ok');
    
    // Reset listener agar tidak double execution
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    
    newOkBtn.onclick = () => {
        callback();
        hideModal(modal);
    };
    showModal(modal);
}

function showAppAlert(msg, isError) {
    document.getElementById('alert-modal-title').textContent = isError ? "Kesalahan" : "Berhasil";
    document.getElementById('alert-modal-message').textContent = msg;
    showModal(document.getElementById('alert-modal'));
}

// =====================================================================
// 9. EVENT LISTENERS
// =====================================================================
document.getElementById('refresh-button').addEventListener('click', fetchData);
document.getElementById('filter-apply-button').addEventListener('click', applyFilters);
document.getElementById('filter-reset-button').addEventListener('click', () => {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-status').value = '';
    applyFilters();
});

// Modal Close Triggers
document.getElementById('alert-modal-close').onclick = () => hideModal(document.getElementById('alert-modal'));
document.getElementById('confirm-modal-cancel').onclick = () => hideModal(document.getElementById('confirm-modal'));
document.getElementById('edit-modal-cancel').onclick = () => hideModal(document.getElementById('edit-modal'));
document.getElementById('edit-modal-close').onclick = () => hideModal(document.getElementById('edit-modal'));

// Pagination Controls
document.getElementById('pagination-prev').addEventListener('click', () => {
    if(currentPage > 1) { currentPage--; renderTable(); }
});
document.getElementById('pagination-next').addEventListener('click', () => {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    if(currentPage < totalPages) { currentPage++; renderTable(); }
});
document.getElementById('pagination-rows').addEventListener('change', (e) => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderTable();
});

// Validasi Input Real-time
document.getElementById('edit-Nominal')?.addEventListener('input', function(e) {
    const val = parseFloat(e.target.value);
    const err = document.getElementById('err-nominal');
    if(val < 0 || isNaN(val)) err?.classList.remove('hidden');
    else err?.classList.add('hidden');
});
