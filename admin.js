// URL API SAMA DENGAN WEBAPP UTAMA (Pastikan URL ini sudah benar dari deploy terbaru Code.gs)
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec";

// === AUTHENTICATION ===
const PIN = "1918";

function checkLogin() {
    const input = document.getElementById('admin-pin').value;
    if (input === PIN) {
        sessionStorage.setItem('lazismu_admin_auth', 'true');
        document.getElementById('login-overlay').classList.add('hidden');
        fetchData();
    } else {
        alert("PIN Salah!");
        document.getElementById('admin-pin').value = '';
    }
}

function logout() {
    sessionStorage.removeItem('lazismu_admin_auth');
    location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('lazismu_admin_auth') === 'true') {
        document.getElementById('login-overlay').classList.add('hidden');
        fetchData();
    }
});

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

// Modal Elements
const alertModal = document.getElementById('alert-modal');
const confirmModal = document.getElementById('confirm-modal');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');

// Filter & Paging Elements
const filterSearchEl = document.getElementById('filter-search');
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
        const response = await fetch(GAS_API_URL);
        const result = await response.json();
        if (result.status !== "success") throw new Error(result.message);
        
        allDonationData = result.data.sort((a, b) => b.row - a.row);
        populateFilterDropdowns(allDonationData);
        applyFilters();

    } catch (error) {
        console.error(error);
        showAppAlert("Gagal memuat data: " + error.message, true);
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
        
        if (row.TipeDonatur === 'santri') {
            badgeTipe = 'bg-orange-100 text-orange-600';
            detailInfo = `<div class="text-xs text-slate-500 mt-0.5"><i class="fas fa-child"></i> ${row.NamaSantri || '-'}</div>`;
        } else if (row.TipeDonatur === 'alumni') {
            badgeTipe = 'bg-blue-100 text-blue-600';
            detailInfo = `<div class="text-xs text-slate-500 mt-0.5"><i class="fas fa-graduation-cap"></i> Angkatan ${row.DetailAlumni || '-'}</div>`;
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
            verifyBtnHTML = `<button class="verify-btn w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition flex items-center justify-center shadow-sm border border-green-100 mr-2" data-row="${row.row}" title="Verifikasi"><i class="fas fa-check text-xs"></i></button>`;
        }

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="block font-bold text-slate-700">${dateStr}</span>
                <span class="text-xs text-slate-400">${timeStr}</span>
            </td>
            <td class="px-6 py-4">
                <span class="font-bold text-slate-800 block">${row.NamaDonatur || 'Hamba Allah'}</span>
                <span class="text-xs text-slate-400 block">${row.NoHP || '-'}</span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${badgeTipe}">${row.TipeDonatur || 'Umum'}</span>
                <div class="text-xs font-semibold text-slate-600">${row.JenisDonasi}</div>
                ${detailInfo}
            </td>
            <td class="px-6 py-4 text-right">
                <span class="font-black text-slate-800 text-sm">${nominalHTML}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="px-2 py-1 rounded border text-[10px] font-bold uppercase ${methodColor}">${row.MetodePembayaran || '-'}</span>
            </td>
            <td class="px-6 py-4 text-center">
                ${statusBadge}
            </td>
            <td class="px-6 py-4 text-right whitespace-nowrap">
                <div class="flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
    const jenis = filterJenisEl.value;
    const metode = filterMetodeEl.value;
    let from = filterDateFromEl.valueAsDate;
    let to = filterDateToEl.valueAsDate;
    if(from) from.setHours(0,0,0,0);
    if(to) to.setHours(23,59,59,999);

    filteredData = allDonationData.filter(row => {
        const time = new Date(row.Timestamp);
        if (from && time < from) return false;
        if (to && time > to) return false;
        if (jenis && row.JenisDonasi !== jenis) return false;
        if (metode && row.MetodePembayaran !== metode) return false;
        if (search) {
            const str = `${row.NamaDonatur} ${row.NISSantri} ${row.NoHP} ${row.Email} ${row.NamaSantri}`.toLowerCase();
            if (!str.includes(search)) return false;
        }
        return true;
    });

    calculateStatistics(filteredData);
    currentPage = 1;
    renderTable();
}

function resetFilters() {
    filterSearchEl.value = ''; filterJenisEl.value = ''; filterMetodeEl.value = '';
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
    btn.disabled = true; txt.classList.add('hidden'); load.classList.remove('hidden');

    const rowNumber = document.getElementById('edit-row-number').value;
    const payload = {};
    const inputs = editForm.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        const key = input.id.replace('edit-', '');
        if (key && key !== 'row-number') payload[key] = input.value;
    });

    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: "update", row: rowNumber, payload: payload })
        });
        const res = await response.json();
        if(res.status !== 'success') throw new Error(res.message);
        hideModal(editModal); showAppAlert("Data berhasil diperbarui!"); fetchData();
    } catch (err) {
        showAppAlert("Gagal menyimpan: " + err.message, true);
    } finally {
        btn.disabled = false; txt.classList.remove('hidden'); load.classList.add('hidden');
    }
}

async function executeDelete(rowNumber) {
    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: "delete", row: rowNumber })
        });
        const res = await response.json();
        if(res.status !== 'success') throw new Error(res.message);
        showAppAlert("Data berhasil dihapus."); fetchData();
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
    const row = parseInt(btn.dataset.row);
    if (btn.classList.contains('verify-btn')) verifyDonation(row);
    if (btn.classList.contains('edit-btn')) openEditModal(row);
    if (btn.classList.contains('delete-btn')) showAppConfirm("Hapus data ini secara permanen?", () => executeDelete(row));
});
