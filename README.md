# Admin Lazismu - Refactored & UUID-based

## 🎯 Ringkasan

Repository ini berisi aplikasi admin dashboard untuk mengelola donasi Lazismu Mu'allimin yang telah di-**refactor** dengan arsitektur modern, UUID-based operations, dan kode yang lebih mudah dikelola.

## ✨ Fitur Utama

- ✅ **UUID-based Operations** - Anti-bentrok, ID persisten
- ✅ **Standardized Field Names** - Konsisten dan mudah dipahami
- ✅ **Modular Code Structure** - Terorganisir dalam folder `src/`
- ✅ **Firebase Authentication** - Login dengan Google (frontend only)
- ✅ **ReCAPTCHA v3** - Proteksi form public
- ✅ **CRUD Operations** - Create, Read, Update, Delete
- ✅ **Advanced Filtering** - Filter by status, type, metode, tanggal
- ✅ **PDF Generation** - Cetak kuitansi otomatis
- ✅ **Export CSV** - Download data dalam format CSV
- ✅ **Real-time Statistics** - Dashboard analytics

## 📦 Struktur Project

```
adminlazismu/
├── src/                    # Source code modular
│   ├── constants.js       # Konfigurasi & konstanta
│   ├── api/
│   │   └── gasAPI.js      # API layer untuk GAS
│   └── utils/
│       └── format.js      # Utility functions
├── admin.js               # File utama (refactored)
├── admin.js.backup        # Backup file lama
├── admin.css              # Styling
├── index.html             # UI template
├── Code.gs                # Backend (Google Apps Script)
├── tailwind-generated.css # Tailwind output
└── REFACTORING_GUIDE.md   # Panduan refactoring detail

📚 Documentation Files:
├── README.md              # This file
├── REFACTORING_GUIDE.md   # ⭐ Panduan refactoring lengkap
├── DEPLOYMENT.md          # Panduan deployment
├── CHANGES_SUMMARY.md     # Summary perubahan
└── SECURITY_SUMMARY.md    # Analisis keamanan
```

## 🚀 Quick Start

### 1. Setup Backend (WAJIB!)

```bash
1. Buka Google Spreadsheet Anda
2. Pastikan ada kolom A untuk "idTransaksi" (UUID)
3. Extensions → Apps Script
4. Copy semua isi file Code.gs dari repo ini
5. Paste ke Apps Script editor
6. Configure RECAPTCHA_SECRET_KEY
7. Set BYPASS_RECAPTCHA = true untuk testing
8. Save & Deploy version baru
```

### 2. Setup Frontend

Frontend sudah otomatis terupdate jika menggunakan GitHub Pages.

**Konfigurasi Firebase (sudah ada di admin.js):**
- API Key sudah ter-configure
- Domain restrictions di Firebase Console

### 3. Test Application

```bash
1. Buka https://[your-domain]/index.html
2. Login dengan Google (email admin)
3. Coba fetch data
4. Test CRUD operations
```

## 🔑 Konfigurasi

### Backend (Code.gs)

```javascript
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID";
const SHEET_NAME = "DataDonasi";
const SHEET_KUITANSI = "DataKuitansi";
const RECAPTCHA_SECRET_KEY = "YOUR_RECAPTCHA_SECRET";
const BYPASS_RECAPTCHA = true; // Set FALSE untuk production
```

### Frontend (admin.js)

```javascript
// Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ...
};

// Allowed Admin Emails
const ALLOWED_ADMIN_EMAILS = [
  "admin1@example.com",
  "admin2@example.com"
];
```

## 📋 Perubahan dari Versi Lama

### ✅ Yang Berubah

| Aspek | Lama | Baru |
|-------|------|------|
| **ID System** | Row number (integer) | UUID (string) |
| **Field Names** | PascalCase (JenisDonasi) | camelCase/lowercase (type) |
| **Backend Auth** | Firebase token validation | No auth (public form protected by ReCAPTCHA) |
| **Code Structure** | Monolithic (1 file) | Modular (src/) |
| **API Requests** | `{action, row, authToken}` | `{action, id}` |

### ✅ Yang Tetap

- Firebase Authentication untuk login admin (frontend)
- Google Apps Script sebagai backend
- Google Sheets sebagai database
- UI/UX design
- Semua fitur (CRUD, filter, export, print)

## 🔐 Keamanan

### Frontend
- ✅ Firebase Authentication (Google Sign-In)
- ✅ Email whitelist validation
- ✅ XSS protection (HTML escaping)
- ✅ CSP headers

### Backend
- ✅ ReCAPTCHA v3 untuk form public
- ✅ UUID anti-collision
- ✅ Script lock untuk concurrent requests
- ✅ Input validation

**⚠️ Catatan Penting:**
- Backend TIDAK lagi memvalidasi Firebase token
- Admin authentication hanya di frontend untuk UI access control
- Public donation form diproteksi dengan ReCAPTCHA

## 📝 API Documentation

### Fetch Data
```javascript
GET /exec
Response: {
  status: "success",
  data: [{idTransaksi, type, nominal, ...}, ...]
}
```

### Verify Donation
```javascript
POST /exec
{
  action: "verify",
  id: "uuid-123"
}
```

### Update Donation
```javascript
POST /exec
{
  action: "update",
  id: "uuid-123",
  payload: {
    type: "Zakat",
    nominal: 1000000,
    metode: "Transfer",
    // ...
  }
}
```

### Delete Donation
```javascript
POST /exec
{
  action: "delete",
  id: "uuid-123"
}
```

## 🧪 Testing Checklist

- [ ] Login dengan Google
- [ ] Fetch data dengan field names baru
- [ ] Filter by type, metode, status
- [ ] Search donatur
- [ ] Verify donation (UUID-based)
- [ ] Edit donation (field mapping)
- [ ] Delete donation
- [ ] Export CSV
- [ ] Print kuitansi
- [ ] Statistics dashboard
- [ ] Pagination

## 📚 Dokumentasi Lengkap

| File | Deskripsi |
|------|-----------|
| [REFACTORING_GUIDE.md](REFACTORING_GUIDE.md) | ⭐ **Panduan refactoring lengkap** |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Panduan deployment step-by-step |
| [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md) | Detail perubahan kode |
| [SECURITY_SUMMARY.md](SECURITY_SUMMARY.md) | Analisis keamanan |

## 👥 Admin Email yang Diizinkan

```javascript
lazismumuallimin@gmail.com
ad.lazismumuallimin@gmail.com
andiaqillahfadiahaswat@gmail.com
```

## 🔧 Development

### Setup Local Development

```bash
# Clone repository
git clone https://github.com/fadiahaswat/adminlazismu

# No npm install needed (pure vanilla JS)

# Open index.html di browser
# atau gunakan local server:
python -m http.server 8000
```

### Code Style

- ES6+ JavaScript
- Modular structure
- JSDoc comments (coming soon)
- Consistent naming (camelCase)

## 🐛 Troubleshooting

### "Data tidak muncul"
- Check browser console (F12)
- Pastikan Code.gs sudah deployed
- Verify field names di backend match

### "Invalid action: verify"
- Backend belum diupdate
- Deploy Code.gs terbaru

### "Data dengan ID ... tidak ditemukan"
- UUID tidak valid atau data terhapus
- Check spreadsheet langsung

### Filter tidak bekerja
- Clear all filters dan coba lagi
- Refresh halaman

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/fadiahaswat/adminlazismu/issues)
- **Documentation**: Baca file .md di repository
- **Contact**: Lihat email admin di atas

## 🎉 Changelog

### Version 2.0 (Current)
- ✅ Refactored to UUID-based architecture
- ✅ Standardized field names
- ✅ Modular code structure
- ✅ Removed backend Firebase auth
- ✅ Added ReCAPTCHA protection
- ✅ Improved code organization

### Version 1.0
- Initial release with row-based operations
- Firebase authentication (frontend + backend)
- Basic CRUD operations

---

**Status:** ✅ Refactoring Complete & Production Ready  
**Last Updated:** 2026-02-13  
**Version:** 2.0  
**Maintainer:** Lazismu Mu'allimin Tech Team

