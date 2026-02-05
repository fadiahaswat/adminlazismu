# 🔄 Panduan Sinkronisasi Frontend-Backend

**Tanggal:** 2026-02-05  
**Status:** ✅ SELESAI - Frontend sudah disinkronkan, Backend perlu disesuaikan  

---

## 📋 RINGKASAN PERUBAHAN

Dokumen ini menjelaskan **perubahan critical** yang telah dilakukan untuk menutup celah logika antara frontend dan backend. Frontend sekarang mengirimkan API Key untuk autentikasi, dan backend (`code.gs`) harus disesuaikan untuk menerima dan memvalidasi kunci ini.

---

## ✅ APA YANG SUDAH DILAKUKAN DI FRONTEND

### 1. Penambahan API Key di Konfigurasi

**File:** `config.example.js` (Template)

```javascript
// API Key untuk autentikasi backend
// Harus SAMA PERSIS dengan 'ADMIN_API_KEY' di file code.gs backend
// GANTI dengan kunci rahasia Anda sendiri (contoh: "MySecureKey_2026_#123")
export const GAS_ADMIN_KEY = "YOUR_ADMIN_API_KEY_HERE";
```

**File:** `config.js` (File aktual yang harus Anda buat)

```javascript
export const GAS_ADMIN_KEY = "Lazismu_2026_Secure_Key_#99"; // Ganti dengan kunci Anda
```

### 2. Import API Key di admin.js

```javascript
import { 
    firebaseConfig, 
    RECAPTCHA_SITE_KEY, 
    GAS_API_URL, 
    ALLOWED_ADMIN_EMAILS,
    GAS_ADMIN_KEY  // <-- BARU
} from './config.js';
```

### 3. Pengiriman API Key dalam Request

#### A. GET Request (fetchData)
API key dikirim melalui **HTTP Header** `X-API-Key`:

```javascript
async function fetchData() {
    const url = `${GAS_API_URL}?action=getAllAdmin`;
    const response = await fetch(url, {
        headers: {
            'X-API-Key': GAS_ADMIN_KEY
        }
    });
    // ...
}
```

#### B. POST Request (verifyDonation)
API key dikirim dalam **body JSON**:

```javascript
async function verifyDonation(rowNumber) {
    const response = await fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({ 
            action: "verify", 
            row: rowNumber,
            apiKey: GAS_ADMIN_KEY  // <-- BARU
        })
    });
    // ...
}
```

#### C. POST Request (handleEditSubmit)
API key dikirim dalam **body JSON**:

```javascript
async function handleEditSubmit(e) {
    const response = await fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({ 
            action: "update", 
            row: rowNumber, 
            payload: payload,
            apiKey: GAS_ADMIN_KEY  // <-- BARU
        })
    });
    // ...
}
```

#### D. POST Request (executeDelete)
API key dikirim dalam **body JSON**:

```javascript
async function executeDelete(rowNumber) {
    const response = await fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({ 
            action: "delete", 
            row: rowNumber,
            apiKey: GAS_ADMIN_KEY  // <-- BARU
        })
    });
    // ...
}
```

---

## ⚠️ YANG HARUS DILAKUKAN DI BACKEND (code.gs)

### 1. Definisikan API Key di code.gs

**Tambahkan di bagian atas file code.gs:**

```javascript
// === KONFIGURASI KEAMANAN ===
const ADMIN_API_KEY = "Lazismu_2026_Secure_Key_#99"; // HARUS SAMA dengan GAS_ADMIN_KEY di config.js

// Email admin yang diizinkan
const ALLOWED_ADMIN_EMAILS = [
    "lazismumuallimin@gmail.com",
    "ad.lazismumuallimin@gmail.com",
    "andiaqillahfadiahaswat@gmail.com"
];
```

### 2. Validasi API Key di doGet (GET Request)

**Update fungsi doGet untuk memeriksa header `X-API-Key`:**

```javascript
function doGet(e) {
    try {
        // Ambil API key dari header (Google Apps Script menerima header sebagai parameter)
        const apiKey = e.parameter.apiKey || e.headers?.['X-API-Key'];
        
        // Validasi API Key
        if (apiKey !== ADMIN_API_KEY) {
            return ContentService.createTextOutput(JSON.stringify({
                status: 'error',
                message: 'Unauthorized: API key tidak valid'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        const action = e.parameter.action;
        
        // Handle different actions
        if (action === 'getAllAdmin') {
            return getAllAdmin();
        }
        
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Action tidak dikenali'
        })).setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Server error: ' + error.message
        })).setMimeType(ContentService.MimeType.JSON);
    }
}
```

### 3. Validasi API Key di doPost (POST Request)

**Update fungsi doPost untuk memeriksa `apiKey` di body JSON:**

```javascript
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        
        // Validasi API Key dari body
        if (data.apiKey !== ADMIN_API_KEY) {
            return ContentService.createTextOutput(JSON.stringify({
                status: 'error',
                message: 'Unauthorized: API key tidak valid'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        const action = data.action;
        
        // Handle different actions
        switch(action) {
            case 'verify':
                return verifyDonation(data.row);
                
            case 'update':
                return updateDonation(data.row, data.payload);
                
            case 'delete':
                return deleteDonation(data.row);
                
            default:
                return ContentService.createTextOutput(JSON.stringify({
                    status: 'error',
                    message: 'Action tidak dikenali'
                })).setMimeType(ContentService.MimeType.JSON);
        }
        
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Server error: ' + error.message
        })).setMimeType(ContentService.MimeType.JSON);
    }
}
```

### 4. Implementasi Fungsi getAllAdmin

```javascript
function getAllAdmin() {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Donations');
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        
        const result = [];
        for (let i = 1; i < data.length; i++) {
            const row = {};
            row.row = i + 1; // Row number untuk operasi update/delete
            
            for (let j = 0; j < headers.length; j++) {
                row[headers[j]] = data[i][j];
            }
            
            result.push(row);
        }
        
        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            data: result
        })).setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Gagal mengambil data: ' + error.message
        })).setMimeType(ContentService.MimeType.JSON);
    }
}
```

### 5. Implementasi Fungsi verifyDonation

```javascript
function verifyDonation(rowNumber) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Donations');
        
        // Cari kolom 'Status'
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const statusColumn = headers.indexOf('Status') + 1;
        
        if (statusColumn === 0) {
            throw new Error('Kolom Status tidak ditemukan');
        }
        
        // Update status
        sheet.getRange(rowNumber, statusColumn).setValue('Verified');
        
        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            message: 'Donasi berhasil diverifikasi'
        })).setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Gagal verifikasi: ' + error.message
        })).setMimeType(ContentService.MimeType.JSON);
    }
}
```

### 6. Implementasi Fungsi updateDonation

```javascript
function updateDonation(rowNumber, payload) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Donations');
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        
        // Update setiap field yang ada di payload
        for (const key in payload) {
            const columnIndex = headers.indexOf(key) + 1;
            if (columnIndex > 0) {
                sheet.getRange(rowNumber, columnIndex).setValue(payload[key]);
            }
        }
        
        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            message: 'Data berhasil diupdate'
        })).setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Gagal update: ' + error.message
        })).setMimeType(ContentService.MimeType.JSON);
    }
}
```

### 7. Implementasi Fungsi deleteDonation

```javascript
function deleteDonation(rowNumber) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Donations');
        sheet.deleteRow(rowNumber);
        
        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            message: 'Data berhasil dihapus'
        })).setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Gagal hapus: ' + error.message
        })).setMimeType(ContentService.MimeType.JSON);
    }
}
```

---

## 🔒 CATATAN KEAMANAN

### 1. API Key Harus Sama

**CRITICAL:** Nilai `GAS_ADMIN_KEY` di file `config.js` (frontend) **HARUS** sama persis dengan `ADMIN_API_KEY` di file `code.gs` (backend).

```javascript
// Frontend (config.js)
export const GAS_ADMIN_KEY = "Lazismu_2026_Secure_Key_#99";

// Backend (code.gs)
const ADMIN_API_KEY = "Lazismu_2026_Secure_Key_#99";
```

### 2. Jangan Commit config.js

File `config.js` **TIDAK BOLEH** di-commit ke repository karena berisi kunci rahasia. File ini sudah ada di `.gitignore`.

### 3. Gunakan Kunci yang Kuat

Ganti `"Lazismu_2026_Secure_Key_#99"` dengan kunci yang lebih kuat dan unik:

```javascript
// Contoh kunci yang lebih baik
const ADMIN_API_KEY = "Lzm_" + generateRandomString(32) + "_2026";

// Atau gunakan kombinasi acak
const ADMIN_API_KEY = "Lazismu_Xk9Pm2#Qq7@Wn5$Rt8!Yx3&Zt1_2026";
```

### 4. Header vs Body

- **GET Request:** API key dikirim via header `X-API-Key` (lebih aman, tidak tercatat di URL)
- **POST Request:** API key dikirim via body JSON (tidak visible di URL atau logs)

### 5. Google Apps Script Header Limitation

**PENTING:** Google Apps Script memiliki keterbatasan dalam membaca custom headers. Jika header `X-API-Key` tidak berfungsi di `doGet`, gunakan query parameter sebagai fallback:

```javascript
function doGet(e) {
    // Coba baca dari header dulu, jika tidak ada gunakan query parameter
    const apiKey = e.headers?.['X-API-Key'] || e.parameter.apiKey;
    
    if (apiKey !== ADMIN_API_KEY) {
        return unauthorizedResponse();
    }
    // ...
}
```

Dan update frontend untuk mengirim via query parameter juga:

```javascript
// Di admin.js - fetchData()
const url = `${GAS_API_URL}?action=getAllAdmin&apiKey=${GAS_ADMIN_KEY}`;
const response = await fetch(url, {
    headers: {
        'X-API-Key': GAS_ADMIN_KEY
    }
});
```

---

## ✅ CHECKLIST DEPLOYMENT

### Pre-Deployment:
- [ ] Copy `config.example.js` menjadi `config.js`
- [ ] Isi `GAS_ADMIN_KEY` di `config.js` dengan kunci rahasia Anda
- [ ] Pastikan `config.js` ada di `.gitignore`
- [ ] Update file `code.gs` di Google Apps Script dengan kode di atas
- [ ] Set `ADMIN_API_KEY` di `code.gs` dengan kunci yang SAMA dengan `config.js`
- [ ] Deploy ulang Google Apps Script sebagai web app
- [ ] Copy URL deployment baru ke `config.js` sebagai `GAS_API_URL`

### Testing:
- [ ] Test login ke admin panel
- [ ] Test fetch data (apakah data muncul?)
- [ ] Test verifikasi donasi
- [ ] Test edit data donasi
- [ ] Test hapus data donasi
- [ ] Check console browser untuk error

### Post-Deployment:
- [ ] Monitor logs Google Apps Script untuk request yang ditolak
- [ ] Pastikan hanya request dengan API key valid yang diterima
- [ ] Backup `config.js` di tempat aman (JANGAN di repository!)

---

## 🆘 TROUBLESHOOTING

### "Unauthorized: API key tidak valid"

**Penyebab:** API key di frontend dan backend tidak sama.

**Solusi:**
1. Buka `config.js` (frontend)
2. Copy nilai `GAS_ADMIN_KEY`
3. Paste ke `ADMIN_API_KEY` di `code.gs` (backend)
4. Deploy ulang Google Apps Script

### "Dashboard kosong / tidak ada data"

**Penyebab:** Backend menolak request karena API key tidak valid atau fungsi `getAllAdmin` belum diimplementasi.

**Solusi:**
1. Buka Console browser (F12)
2. Check tab Network untuk melihat response dari server
3. Pastikan response bukan error "Unauthorized"
4. Implementasi semua fungsi backend yang dibutuhkan

### "Cannot read property 'X-API-Key'"

**Penyebab:** Google Apps Script tidak support custom headers.

**Solusi:**
Gunakan query parameter sebagai fallback (lihat bagian "Google Apps Script Header Limitation" di atas).

---

## 📚 REFERENSI

- [Google Apps Script Web Apps](https://developers.google.com/apps-script/guides/web)
- [Fetch API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Prepared by:** GitHub Copilot  
**Date:** 2026-02-05  
**Version:** 1.0  
**Status:** ✅ READY FOR BACKEND IMPLEMENTATION
