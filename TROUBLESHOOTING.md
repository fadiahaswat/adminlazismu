# 🔧 Panduan Memperbaiki Error "AKSES DITOLAK"

## Masalah
```
Terjadi Kesalahan
Gagal menghapus: AKSES DITOLAK: Sesi tidak valid atau Anda bukan admin.
```

Muncul padahal email sudah benar dan sudah bisa login.

## 🎯 Penyebab Utama

Error ini terjadi karena **backend Google Apps Script belum di-deploy** atau belum dikonfigurasi dengan benar. 

Frontend (admin.js) mengirim request ke backend, tapi backend tidak bisa memverifikasi token Firebase atau email admin Anda.

## ✅ Solusi Lengkap

### Langkah 1: Deploy Google Apps Script (Backend)

1. **Buka Google Apps Script**
   - Kunjungi: https://script.google.com
   - Login dengan akun Google yang sama dengan admin email Anda

2. **Buat Project Baru**
   - Klik tombol **"+ New project"**
   - Beri nama project: "LAZISMU Admin Backend"

3. **Copy Code Backend**
   - Buka file `Code.gs` dari repository ini
   - Copy SEMUA isinya
   - Paste ke editor Google Apps Script (ganti semua code default)

4. **Konfigurasi Backend**
   
   Cari bagian ini di awal file dan update:

   ```javascript
   // ============ KONFIGURASI ============
   const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE"; 
   // ☝️ Ganti dengan ID Google Sheet Anda
   // Cara dapat ID: buka Google Sheet, lihat di URL
   // https://docs.google.com/spreadsheets/d/[INI_ID_NYA]/edit
   
   const ALLOWED_ADMIN_EMAILS = [
       "lazismumuallimin@gmail.com",
       "ad.lazismumuallimin@gmail.com",
       "andiaqillahfadiahaswat@gmail.com"
   ];
   // ☝️ Harus SAMA PERSIS dengan admin.js (baris 22-26)
   ```

5. **Deploy Script**
   - Klik **Deploy** > **New deployment**
   - Klik icon ⚙️ (gear) di samping "Select type"
   - Pilih **"Web app"**
   - Isi form:
     - **Description**: "Admin LAZISMU API v1"
     - **Execute as**: **Me** (your-email@gmail.com)
     - **Who has access**: **Anyone** ⚠️ PENTING!
   - Klik **Deploy**
   - Anda mungkin diminta authorize - klik **Authorize access**
   - Pilih akun Google Anda
   - Klik **Advanced** > **Go to LAZISMU Admin Backend (unsafe)** > **Allow**

6. **Copy URL Deployment**
   - Setelah deploy berhasil, akan muncul URL
   - Format: `https://script.google.com/macros/s/AKfycby.../exec`
   - **COPY URL INI** - akan dipakai di langkah berikutnya

### Langkah 2: Update Frontend

1. **Buka file admin.js**
   
2. **Update GAS_API_URL (baris 48)**
   
   Ganti URL lama dengan URL dari langkah 1.6:
   
   ```javascript
   // SEBELUM:
   const GAS_API_URL = "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec";
   
   // SESUDAH:
   const GAS_API_URL = "https://script.google.com/macros/s/[URL_DEPLOYMENT_ANDA]/exec";
   ```

3. **Pastikan Email Admin Sama (baris 22-26)**
   
   ```javascript
   const ALLOWED_ADMIN_EMAILS = [
       "lazismumuallimin@gmail.com",
       "ad.lazismumuallimin@gmail.com", 
       "andiaqillahfadiahaswat@gmail.com"
   ];
   ```
   
   ⚠️ **HARUS SAMA PERSIS** dengan `ALLOWED_ADMIN_EMAILS` di Code.gs

4. **Save file admin.js**

### Langkah 3: Test

1. **Buka dashboard admin** di browser
2. **Login dengan email admin** yang terdaftar
3. **Coba hapus data** - seharusnya berhasil sekarang!

## 🔍 Verifikasi

### Cek Backend Berfungsi

Buka URL deployment Anda di browser:
```
https://script.google.com/macros/s/[YOUR_DEPLOYMENT_ID]/exec
```

Seharusnya muncul JSON response:
```json
{
  "status": "success",
  "data": [...]
}
```

Jika muncul error atau blank, backend belum berfungsi.

### Cek Email Cocok

1. **Di admin.js** (baris 22-26) - list email admin frontend
2. **Di Code.gs** (baris 14-18) - list email admin backend
3. **Harus IDENTIK** - tidak ada spasi, sama case (huruf besar/kecil)

## ❗ Error Lain yang Mungkin Muncul

### "Script function not found"

**Penyebab**: Code.gs tidak ter-save dengan benar

**Solusi**:
- Buka Google Apps Script
- Pastikan code sudah di-save (Ctrl+S)
- Deploy ulang

### "Authorization required"

**Penyebab**: Script belum di-authorize

**Solusi**:
- Klik link authorization di Google Apps Script
- Login dan approve access
- Deploy ulang jika perlu

### "Spreadsheet not found"

**Penyebab**: SPREADSHEET_ID salah atau tidak punya akses

**Solusi**:
- Cek SPREADSHEET_ID di Code.gs
- Pastikan Google Sheet bisa diakses oleh email yang deploy script
- Share sheet dengan email yang sama

### Masih Error?

1. **Check browser console** (F12 > Console)
   - Lihat error message detail
   
2. **Check Google Apps Script logs**
   - Buka project di script.google.com
   - Klik **Execution** di sidebar
   - Lihat error log

3. **Test token verification**
   - Logout dan login ulang
   - Clear cache browser
   - Coba browser lain (incognito)

## 📋 Checklist

Sebelum melaporkan masih error, pastikan:

- [ ] Code.gs sudah di-deploy di Google Apps Script
- [ ] Deployment setting: "Who has access" = **Anyone**
- [ ] SPREADSHEET_ID sudah benar di Code.gs
- [ ] ALLOWED_ADMIN_EMAILS sama antara admin.js dan Code.gs
- [ ] GAS_API_URL di admin.js sudah update dengan URL deployment baru
- [ ] Sudah logout dan login ulang setelah perubahan
- [ ] Email yang login ada di ALLOWED_ADMIN_EMAILS

## 🆘 Butuh Bantuan?

Jika masih bermasalah setelah mengikuti semua langkah:

1. Screenshot error message
2. Screenshot ALLOWED_ADMIN_EMAILS di admin.js
3. Screenshot ALLOWED_ADMIN_EMAILS di Code.gs
4. Screenshot deployment settings di Google Apps Script
5. Kirim ke: lazismumuallimin@gmail.com

---

**Update**: 2026-02-05  
**Status**: ✅ Tested & Working
