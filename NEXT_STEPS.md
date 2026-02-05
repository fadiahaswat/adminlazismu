# 🚀 LANGKAH SELANJUTNYA - Deployment

## ⚠️ PENTING: Backend Harus Diupdate!

Perubahan di repository ini mencakup frontend DAN backend. 
Anda HARUS mengupdate Google Apps Script untuk memperbaiki error "AKSES DITOLAK".

## 📋 Langkah-langkah (5 menit)

### 1️⃣ Buka Google Apps Script
```
1. Buka Google Spreadsheet: "1EhFeSGfar1mqzEQo5CgncmDr8nflFqcSyAaXAFmWFqE"
2. Klik menu: Extensions → Apps Script
```

### 2️⃣ Update Script
```
1. Di repository GitHub ini, buka file: Code.gs
2. Copy SEMUA isi file Code.gs (Ctrl+A, Ctrl+C)
3. Kembali ke Apps Script editor
4. Hapus semua kode yang ada
5. Paste kode baru (Ctrl+V)
6. Klik Save (💾)
```

### 3️⃣ Deploy Version Baru
```
1. Klik tombol "Deploy" di kanan atas
2. Pilih "Manage deployments"
3. Klik icon ⚙️ (gear) di sebelah deployment yang aktif
4. Pilih "New version"
5. Klik "Deploy"
6. Copy URL deployment (jika berubah)
```

### 4️⃣ Update URL di Frontend (jika diperlukan)
```
Jika URL deployment berubah:
1. Buka file: admin.js
2. Cari baris 48: const GAS_API_URL = "..."
3. Update dengan URL deployment baru
4. Commit dan push perubahan
```

### 5️⃣ Test
```
1. Buka admin dashboard di browser
2. Login dengan email admin
3. Pastikan data donasi muncul (tidak ada error)
4. Test operasi: verify, edit, delete, cetak kuitansi
```

## ✅ Checklist

- [ ] Google Apps Script sudah diupdate dengan Code.gs baru
- [ ] Deployment version baru sudah dibuat
- [ ] URL deployment dicatat (jika berubah)
- [ ] Frontend sudah di-deploy (automatic jika pakai GitHub Pages)
- [ ] Test login berhasil
- [ ] Test data muncul tanpa error "AKSES DITOLAK"
- [ ] Test verifikasi donasi
- [ ] Test edit donasi
- [ ] Test hapus donasi

## 📞 Bantuan

Jika masih ada error setelah deployment:

1. **Clear browser cache:** Ctrl+Shift+Delete
2. **Logout dan login kembali**
3. **Check browser console:** F12 → Console tab
4. **Check network tab:** F12 → Network tab
5. **Verifikasi email ada di ALLOWED_EMAILS:**
   - lazismumuallimin@gmail.com
   - ad.lazismumuallimin@gmail.com
   - andiaqillahfadiahaswat@gmail.com

## 📚 Dokumentasi

- `README_FIX.md` - Penjelasan lengkap masalah & solusi
- `DEPLOYMENT.md` - Panduan deployment detail
- `CHANGES_SUMMARY.md` - Detail perubahan kode
- `Code.gs` - Backend script yang sudah diperbaiki

---

## 🎯 Hasil Akhir

Setelah deployment selesai:
- ✅ Admin dapat login dengan email yang terdaftar
- ✅ Data donasi muncul otomatis setelah login
- ✅ Tidak ada lagi error "AKSES DITOLAK"
- ✅ Semua operasi admin terproteksi dengan autentikasi Firebase
- ✅ Keamanan data lebih terjamin
