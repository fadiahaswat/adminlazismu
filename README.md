# Admin Lazismu - Access Denied Fix

## 🎯 Ringkasan

Repository ini berisi fix untuk error **"AKSES DITOLAK: Sesi tidak valid atau Anda bukan admin"** yang dialami oleh admin dengan email yang valid.

## 🔴 Masalah yang Diperbaiki

Admin yang sudah login dengan email yang benar (`lazismumuallimin@gmail.com`, `ad.lazismumuallimin@gmail.com`, atau `andiaqillahfadiahaswat@gmail.com`) mendapat error saat mencoba mengakses data donasi.

## ✅ Solusi

Menambahkan autentikasi Firebase token ke semua operasi admin, termasuk operasi `fetch` yang sebelumnya tidak terproteksi.

## 📦 Perubahan yang Dilakukan

### Frontend
- **File:** `admin.js`
- **Perubahan:** Fungsi `fetchData()` sekarang mengirim Firebase authentication token

### Backend  
- **File:** `Code.gs` (Google Apps Script)
- **Perubahan:** 
  - Menambah "fetch" ke daftar protected actions
  - Implementasi handler untuk action "fetch" dengan autentikasi

## 📚 Dokumentasi

| File | Deskripsi |
|------|-----------|
| [NEXT_STEPS.md](NEXT_STEPS.md) | ⭐ **MULAI DI SINI** - Panduan deployment cepat (5 menit) |
| [README_FIX.md](README_FIX.md) | Penjelasan detail dengan diagram visual |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Panduan deployment lengkap |
| [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md) | Detail perubahan kode before/after |
| [SECURITY_SUMMARY.md](SECURITY_SUMMARY.md) | Analisis keamanan |
| [Code.gs](Code.gs) | Backend script yang sudah diperbaiki |

## 🚀 Quick Start

### 1. Update Backend (WAJIB!)
```bash
1. Buka Google Spreadsheet Anda
2. Extensions → Apps Script
3. Copy semua isi file Code.gs dari repo ini
4. Paste ke Apps Script editor (replace semua)
5. Save & Deploy version baru
```

### 2. Frontend (Otomatis)
Frontend sudah otomatis terupdate jika Anda menggunakan GitHub Pages.

### 3. Test
```bash
1. Buka admin dashboard
2. Login dengan email admin
3. Pastikan data muncul tanpa error
```

## 🔐 Keamanan

Semua operasi admin sekarang memerlukan autentikasi Firebase:

- ✅ **fetch** - Ambil data donasi (BARU!)
- ✅ **verify** - Verifikasi donasi
- ✅ **update** - Update donasi  
- ✅ **delete** - Hapus donasi
- ✅ **kuitansi** - Simpan kuitansi
- ✅ **sendReceipt** - Kirim kuitansi

**CodeQL Scan:** ✅ Passed - No vulnerabilities

## 📋 Checklist Deployment

- [ ] Backend (Code.gs) sudah diupdate di Google Apps Script
- [ ] Deploy version baru sudah dibuat
- [ ] Test login berhasil
- [ ] Data muncul tanpa error "AKSES DITOLAK"
- [ ] Test operasi admin (verify, edit, delete)

## 🆘 Troubleshooting

### Error: "Aksi tidak dikenal: fetch"
➜ Backend belum diupdate. Deploy Code.gs ke Google Apps Script.

### Error: "AKSES DITOLAK" masih muncul
➜ Clear cache browser, logout, dan login kembali.

### Data tidak muncul
➜ Check browser console (F12) untuk error detail.

## 👥 Admin Email yang Diizinkan

```
lazismumuallimin@gmail.com
ad.lazismumuallimin@gmail.com
andiaqillahfadiahaswat@gmail.com
```

## 📞 Support

Baca dokumentasi di folder ini, terutama:
1. **NEXT_STEPS.md** - Untuk deployment
2. **README_FIX.md** - Untuk pemahaman teknis
3. **DEPLOYMENT.md** - Untuk troubleshooting

---

**Status:** ✅ Fix Complete - Siap untuk Deployment  
**Last Updated:** 2026-02-05  
**Version:** 1.0
