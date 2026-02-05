# Panduan Deployment - Google Apps Script Backend

## Masalah yang Diperbaiki
Error "AKSES DITOLAK: Sesi tidak valid atau Anda bukan admin" terjadi karena fungsi `fetchData()` di frontend tidak mengirimkan token autentikasi Firebase ke backend.

## Solusi

### 1. Update Frontend (Sudah Selesai)
File `admin.js` sudah diperbarui untuk mengirim token autentikasi saat mengambil data.

### 2. Update Backend Google Apps Script (PENTING!)

Anda perlu memperbarui script di Google Apps Script dengan kode yang ada di file `Code.gs`:

#### Langkah-langkah:

1. **Buka Google Apps Script**
   - Buka Google Spreadsheet Anda
   - Klik **Extensions** > **Apps Script**

2. **Replace Kode**
   - Hapus semua kode yang ada di editor
   - Copy seluruh isi file `Code.gs` dari repository ini
   - Paste ke editor Apps Script

3. **Deploy Ulang**
   - Klik **Deploy** > **Manage deployments**
   - Klik ikon ⚙️ (gear) di deployment yang aktif
   - Pilih **New version** untuk membuat versi baru
   - Klik **Deploy**

4. **Test**
   - Buka aplikasi admin dashboard
   - Login dengan email admin yang terdaftar
   - Pastikan data muncul tanpa error "AKSES DITOLAK"

## Perubahan di Backend

File `Code.gs` memiliki 2 perubahan penting:

### Perubahan 1: Tambah "fetch" ke Protected Actions (Baris 86)
```javascript
// SEBELUM
const protectedActions = ["verify", "delete", "update", "kuitansi", "sendReceipt"];

// SESUDAH
const protectedActions = ["fetch", "verify", "delete", "update", "kuitansi", "sendReceipt"];
```

### Perubahan 2: Tambah Handler untuk Action "fetch" (Baris 105-108)
```javascript
if (action == "fetch") {
   // Ambil data untuk admin yang sudah terautentikasi
   result = readData();
}
```

## Keamanan
Sekarang semua operasi admin memerlukan autentikasi:
- ✅ **fetch** - Mengambil data donasi (BARU)
- ✅ **verify** - Verifikasi donasi
- ✅ **update** - Update data donasi
- ✅ **delete** - Hapus data donasi
- ✅ **kuitansi** - Simpan kuitansi
- ✅ **sendReceipt** - Kirim kuitansi

Hanya email yang terdaftar di `ALLOWED_EMAILS` yang dapat mengakses fungsi-fungsi tersebut.

## Troubleshooting

### Masih muncul error "AKSES DITOLAK"
1. Pastikan Anda sudah deploy ulang Apps Script dengan versi baru
2. Clear cache browser (Ctrl+Shift+Del)
3. Logout dan login kembali
4. Periksa apakah email Anda ada di daftar `ALLOWED_EMAILS` di Apps Script

### Error "Aksi tidak dikenal: fetch"
Ini berarti backend belum diupdate. Ikuti langkah deployment di atas.

### Token tidak valid
1. Pastikan `FIREBASE_API_KEY` di Apps Script sama dengan API key di `admin.js`
2. Cek koneksi internet
3. Logout dan login kembali untuk mendapatkan token baru
