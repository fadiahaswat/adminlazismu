# 📋 Deployment Checklist

Gunakan checklist ini untuk memastikan setup yang benar dan menghindari error "AKSES DITOLAK".

## Pre-Deployment

- [ ] Punya akun Google
- [ ] Punya Google Sheet untuk data donasi
- [ ] Punya Firebase project dengan Authentication enabled
- [ ] Email admin sudah terdaftar di Firebase Authentication

## Backend Deployment (Google Apps Script)

- [ ] Login ke https://script.google.com
- [ ] Buat project baru
- [ ] Copy seluruh isi `Code.gs` ke editor
- [ ] **Update `SPREADSHEET_ID`** dengan ID Google Sheet
  - Cara: buka Google Sheet, copy ID dari URL
  - Format: `https://docs.google.com/spreadsheets/d/[ID_NYA]/edit`
- [ ] **Update `ALLOWED_ADMIN_EMAILS`** dengan email admin yang sama seperti di admin.js
- [ ] Pastikan tidak ada typo di email (case sensitive!)
- [ ] Save script (Ctrl+S atau Cmd+S)
- [ ] Deploy > New deployment
- [ ] Pilih type: **Web app**
- [ ] Execute as: **Me (your email)**
- [ ] Who has access: **Anyone** ⚠️
- [ ] Klik Deploy
- [ ] Authorize access jika diminta
- [ ] **Copy deployment URL**
- [ ] Test URL di browser - harus muncul JSON response

## Frontend Configuration

- [ ] Buka file `admin.js`
- [ ] **Update line 48**: `GAS_API_URL` dengan URL deployment dari backend
- [ ] **Verify line 22-26**: `ALLOWED_ADMIN_EMAILS` sama persis dengan Code.gs
  - ⚠️ Email harus identik (huruf besar/kecil sama)
  - ⚠️ Tidak ada spasi di awal/akhir
  - ⚠️ Jumlah email sama
- [ ] Save file

## Google Sheet Setup

- [ ] Sheet sudah dibuat
- [ ] Nama sheet adalah "Data" (atau update `SHEET_NAME` di Code.gs)
- [ ] Header row sudah ada di baris 1
- [ ] Minimal ada kolom: Nama, Email, Nominal, Terverifikasi
- [ ] Google Sheet bisa diakses oleh email yang deploy script

## Verification Steps

- [ ] Buka dashboard admin di browser
- [ ] Buka Developer Console (F12)
- [ ] Login dengan email admin yang terdaftar
- [ ] Check console - tidak ada error
- [ ] Dashboard muncul dengan data dari Google Sheet
- [ ] Coba fitur view/read - harus berhasil
- [ ] **Coba fitur delete** - harus berhasil tanpa error "AKSES DITOLAK"
- [ ] Coba fitur verify - harus berhasil
- [ ] Coba fitur edit/update - harus berhasil

## Troubleshooting Checklist

Jika masih error "AKSES DITOLAK":

- [ ] ALLOWED_ADMIN_EMAILS di admin.js sama persis dengan Code.gs?
- [ ] GAS_API_URL di admin.js benar?
- [ ] Email yang login ada di ALLOWED_ADMIN_EMAILS?
- [ ] Sudah logout dan login ulang?
- [ ] Browser cache sudah di-clear?
- [ ] Deployment setting "Who has access" = Anyone?
- [ ] SPREADSHEET_ID di Code.gs benar?
- [ ] Google Sheet bisa diakses?

## Common Mistakes ⚠️

❌ **Email typo**
```javascript
// SALAH - typo
"lazismumuallimin@gmail.com"  // di admin.js
"lazismualimin@gmail.com"     // di Code.gs (missing 'mu')

// BENAR - sama persis
"lazismumuallimin@gmail.com"  // di admin.js
"lazismumuallimin@gmail.com"  // di Code.gs
```

❌ **Case sensitive**
```javascript
// SALAH - case berbeda
"Admin@Gmail.com"    // di admin.js
"admin@gmail.com"    // di Code.gs

// BENAR - normalize ke lowercase
"admin@gmail.com"    // di admin.js
"admin@gmail.com"    // di Code.gs
```

❌ **URL deployment salah**
```javascript
// SALAH - URL lama atau salah
const GAS_API_URL = "https://script.google.com/.../old-deployment";

// BENAR - URL dari deployment terbaru
const GAS_API_URL = "https://script.google.com/macros/s/AKfycby.../exec";
```

❌ **Deployment access setting**
```
// SALAH
Who has access: Only myself

// BENAR
Who has access: Anyone ✓
```

## Post-Deployment

- [ ] Commit changes: `git add .` dan `git commit`
- [ ] Push ke repository: `git push`
- [ ] Dokumentasikan URL deployment untuk referensi
- [ ] Backup SPREADSHEET_ID
- [ ] Test semua fungsi sekali lagi
- [ ] Inform admin users bahwa sistem sudah siap

## Success Indicators ✅

Jika setup benar, Anda bisa:
- ✅ Login dengan email admin
- ✅ Melihat data dari Google Sheet
- ✅ Verify donasi
- ✅ Edit data donasi
- ✅ **Delete data donasi tanpa error "AKSES DITOLAK"**
- ✅ Generate kwitansi
- ✅ Export CSV

## Need Help?

Jika masih bermasalah setelah mengikuti checklist:

1. Baca **TROUBLESHOOTING.md** untuk panduan detail
2. Baca **QUICKFIX.md** untuk solusi cepat
3. Check browser console untuk error detail
4. Check Google Apps Script execution logs
5. Email: lazismumuallimin@gmail.com dengan screenshot error

---
**Version**: 1.0  
**Last Updated**: 2026-02-05
