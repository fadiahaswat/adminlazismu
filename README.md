# Admin Dashboard LAZISMU

Dashboard administrasi untuk mengelola data donasi LAZISMU dengan autentikasi Firebase dan integrasi Google Sheets.

## 🚀 Fitur

- ✅ Autentikasi Google dengan Firebase
- ✅ Validasi admin berdasarkan email
- ✅ CRUD data donasi
- ✅ Verifikasi donasi
- ✅ Generate kwitansi
- ✅ Export data ke CSV
- ✅ Keamanan dengan Firebase ID Token
- ✅ ReCAPTCHA v3 untuk perlindungan bot

## 📋 Prasyarat

1. Akun Google (untuk Firebase dan Google Apps Script)
2. Google Sheet untuk menyimpan data donasi
3. Firebase Project dengan Authentication enabled
4. ReCAPTCHA v3 Site Key (opsional)

## 🔧 Instalasi

### 1. Setup Firebase

1. Buat project baru di [Firebase Console](https://console.firebase.google.com/)
2. Aktifkan **Authentication** > **Sign-in method** > **Google**
3. Tambahkan domain yang diotorisasi (contoh: `your-domain.com`)
4. Copy konfigurasi Firebase dari **Project Settings** > **General** > **Your apps** > **Web**

### 2. Setup Google Apps Script (Backend)

1. Buka [Google Apps Script](https://script.google.com)
2. Klik **New Project**
3. Copy seluruh isi file `Code.gs` dari repository ini
4. Paste ke editor Google Apps Script
5. **PENTING: Update konfigurasi di bagian atas:**
   ```javascript
   const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE"; // Ganti dengan ID Google Sheet
   const ALLOWED_ADMIN_EMAILS = [
       "admin1@example.com",  // Email admin pertama
       "admin2@example.com"   // Email admin kedua
   ];
   ```
6. Klik **Deploy** > **New deployment**
7. Pilih type: **Web app**
8. Settings:
   - Description: "Admin LAZISMU API"
   - Execute as: **Me**
   - Who has access: **Anyone**
9. Klik **Deploy**
10. **Copy URL deployment** (akan digunakan di langkah selanjutnya)

### 3. Setup Frontend

1. Clone repository ini:
   ```bash
   git clone https://github.com/fadiahaswat/adminlazismu.git
   cd adminlazismu
   ```

2. Copy file konfigurasi:
   ```bash
   cp config.example.js config.js
   ```

3. Edit `admin.js` dan update:
   - **Baris 11-18**: Firebase Configuration (dari langkah 1)
   - **Baris 22-26**: `ALLOWED_ADMIN_EMAILS` (harus SAMA dengan Google Apps Script)
   - **Baris 36**: ReCAPTCHA Site Key (jika menggunakan)
   - **Baris 48**: `GAS_API_URL` (URL deployment dari langkah 2)

4. **PENTING**: Pastikan `ALLOWED_ADMIN_EMAILS` di `admin.js` dan `Code.gs` identik!

### 4. Setup Google Sheet

1. Buat Google Sheet baru
2. Pastikan sheet memiliki nama "Data" (atau sesuaikan `SHEET_NAME` di Code.gs)
3. Buat header kolom di baris pertama, contoh:
   ```
   | No | Nama | Email | Nominal | Tanggal | Metode Pembayaran | Terverifikasi | Waktu Verifikasi |
   ```
4. Copy ID Google Sheet dari URL (bagian antara `/d/` dan `/edit`)
5. Paste ID tersebut ke `SPREADSHEET_ID` di Code.gs

### 5. Deploy

**Untuk GitHub Pages:**
```bash
# Push ke repository
git add .
git commit -m "Setup configuration"
git push origin main

# Aktifkan GitHub Pages di Settings > Pages
# Pilih branch: main
# Pilih folder: / (root)
```

**Atau host di server web Anda sendiri** (Apache, Nginx, dll.)

## 🔐 Keamanan

### Penting!

1. **Jangan commit `config.js`** - File ini sudah ada di `.gitignore`
2. **Batasi Firebase API Key** di Firebase Console:
   - Project Settings > API restrictions
   - Tambahkan domain yang diizinkan
3. **Email admin harus sama** antara frontend dan backend
4. **Gunakan HTTPS** untuk production

### Firebase ID Token

Sistem ini menggunakan Firebase ID Token untuk autentikasi:
- Frontend mendapatkan token dari Firebase Authentication
- Token dikirim ke backend untuk setiap operasi (verify, update, delete)
- Backend memverifikasi token menggunakan Google's OAuth2 API
- Hanya email yang terdaftar di `ALLOWED_ADMIN_EMAILS` yang dapat melakukan operasi

## 🐛 Troubleshooting

### Error: "AKSES DITOLAK: Sesi tidak valid atau Anda bukan admin"

**Penyebab dan Solusi:**

1. **Email tidak sama antara frontend dan backend**
   - ✅ Pastikan `ALLOWED_ADMIN_EMAILS` di `admin.js` dan `Code.gs` identik
   - ✅ Perhatikan case-sensitive (gunakan lowercase)
   - ✅ Pastikan tidak ada spasi di awal/akhir email

2. **Token Firebase tidak valid**
   - ✅ Logout dan login ulang
   - ✅ Clear browser cache dan cookies
   - ✅ Periksa Firebase Console apakah user sudah ter-authenticate

3. **URL Google Apps Script salah**
   - ✅ Pastikan `GAS_API_URL` di admin.js sesuai dengan URL deployment
   - ✅ Pastikan deployment sudah di-approve dan public

4. **Script tidak punya akses ke Spreadsheet**
   - ✅ Periksa `SPREADSHEET_ID` di Code.gs
   - ✅ Pastikan Google Apps Script punya akses ke spreadsheet
   - ✅ Coba share spreadsheet dengan email yang sama dengan yang deploy script

### Error: "Popup diblokir browser"

- Izinkan popup untuk domain Anda di browser settings

### Error: "Gagal mengambil data"

- Periksa `SPREADSHEET_ID` dan `SHEET_NAME` di Code.gs
- Pastikan sheet sudah ada dan bisa diakses

## 📝 Struktur File

```
adminlazismu/
├── admin.js              # Frontend logic & Firebase auth
├── admin.css            # Custom styling
├── index.html           # Dashboard UI
├── Code.gs              # Backend Google Apps Script
├── config.example.js    # Example configuration
├── package.json         # TailwindCSS dependency
├── tailwind.config.js   # TailwindCSS config
├── MasterTemplate.png   # Receipt template
├── stempel.png         # Stamp image
├── ttd.png             # Signature image
├── logo.png            # Logo
└── README.md           # This file
```

## 🤝 Kontribusi

1. Fork repository
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 Lisensi

Project ini untuk internal LAZISMU Muallimin.

## 📧 Kontak

Untuk pertanyaan atau masalah, hubungi:
- Email: lazismumuallimin@gmail.com
- Email: ad.lazismumuallimin@gmail.com

## 🔄 Update Log

### v1.1.0 (2026-02-05)
- ✅ Fix: Error "AKSES DITOLAK" dengan menambahkan Code.gs
- ✅ Add: Dokumentasi lengkap deployment
- ✅ Add: Token verification di backend
- ✅ Improve: Security dengan Firebase ID Token

### v1.0.0
- Initial release dengan Firebase Authentication
- Google Sheets integration
- Basic CRUD operations
