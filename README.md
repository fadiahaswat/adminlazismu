# 🔐 Admin Lazismu - Security Hardened Version

> **Admin Dashboard untuk Lazismu Mu'allimin dengan Keamanan Tingkat Lanjut**

---

## ⚠️ PEMBERITAHUAN KEAMANAN

Aplikasi ini telah diperkuat dengan berbagai lapisan keamanan untuk melindungi dari:
- ✅ Manipulasi melalui inspect element
- ✅ Bot spam donasi
- ✅ Eksposur database dan API keys
- ✅ Akses tidak terotorisasi

**PENTING:** Untuk deployment production, Anda **HARUS** mengikuti langkah-langkah di `DEPLOYMENT.md`

---

## 🚀 Quick Start

### 1. Setup Configuration

```bash
# Copy template konfigurasi
cp config.example.js config.js
```

Edit `config.js` dengan kredensial Firebase Anda:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... dst
};
```

### 2. Verifikasi Security

Pastikan file sensitif tidak ter-commit:

```bash
git status
# config.js TIDAK boleh muncul
```

### 3. Test Lokal

```bash
# Jalankan local server
python3 -m http.server 8000

# Buka browser
open http://localhost:8000
```

### 4. Deploy

Lihat instruksi lengkap di `DEPLOYMENT.md`

---

## 🛡️ Fitur Keamanan

### 1. **Credential Protection**
- ✅ API keys dipindahkan ke `config.js` (tidak di-commit)
- ✅ Environment-based configuration
- ✅ Separate example config untuk developer

### 2. **Client-Side Protection**
- ✅ Content Security Policy (CSP) headers
- ✅ DevTools detection dan prevention
- ✅ Right-click disabled
- ✅ Keyboard shortcut protection (F12, Ctrl+Shift+I, dll)
- ✅ Anti-debugging measures
- ✅ Frame injection prevention

### 3. **Authentication & Authorization**
- ✅ Google OAuth 2.0
- ✅ Email whitelist (hanya 3 admin)
- ✅ Multi-layer email validation
- ✅ Auto-logout untuk unauthorized users

### 4. **Bot Protection**
- ✅ Firebase App Check dengan ReCAPTCHA v3
- ✅ Dokumentasi untuk rate limiting
- ✅ Server-side validation guidelines

### 5. **Data Protection**
- ✅ Secure HTTP headers
- ✅ XSS protection
- ✅ CSRF prevention
- ✅ API endpoint authentication (documented)

---

## 📁 Struktur File

```
adminlazismu/
├── index.html              # Main HTML (dengan security headers)
├── admin.js                # Main JavaScript (import dari config.js)
├── admin.css               # Styling
├── security.js             # 🆕 Security layer (DevTools protection)
├── config.example.js       # 🆕 Template konfigurasi
├── config.js               # 🆕 Actual credentials (GIT-IGNORED)
├── .gitignore              # 🆕 Updated (ignore config.js)
├── SECURITY_FIXES.md       # 🆕 Penjelasan security fixes
├── DEPLOYMENT.md           # 🆕 Deployment guide
├── SECURITY.md             # Security documentation
└── README.md               # This file
```

---

## 🔒 Lapisan Keamanan

### Layer 1: Configuration Security
File `config.js` berisi semua kredensial dan **TIDAK** di-commit ke repository.

### Layer 2: HTTP Headers
```html
<!-- Security Headers di index.html -->
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="X-XSS-Protection" content="1; mode=block">
```

### Layer 3: Content Security Policy
CSP mencegah XSS attacks dengan membatasi sumber yang diizinkan.

### Layer 4: DevTools Protection
`security.js` mendeteksi dan mencegah:
- Right-click / Inspect Element
- Keyboard shortcuts (F12, Ctrl+Shift+I, dll)
- DevTools opening detection
- Debugging attempts
- Frame injection

### Layer 5: Firebase Authentication
- Google OAuth 2.0
- Email whitelist validation
- Session management

### Layer 6: App Check
ReCAPTCHA v3 untuk memverifikasi request dari aplikasi yang sah.

### Layer 7: Server-Side Validation
Dokumentasi untuk validasi di Google Apps Script (backend).

---

## ⚙️ Konfigurasi Firebase

### API Key Restrictions

**WAJIB** untuk production:

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services > Credentials
3. Klik API key Anda
4. Application restrictions > HTTP referrers:
   ```
   https://fadiahaswat.github.io/*
   https://your-domain.com/*
   ```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.token.email in [
          'admin1@gmail.com',
          'admin2@gmail.com'
        ];
    }
  }
}
```

### App Check Enforcement

Firebase Console > App Check > Enforce untuk semua services

---

## 🧪 Testing Security

### Test 1: Credential Tidak Terekspos
```bash
git log --all --full-history -- config.js
# Harus kosong atau tidak ada history
```

### Test 2: DevTools Protection
1. Buka aplikasi
2. Coba klik kanan → Harus disabled
3. Tekan F12 → Harus blocked
4. Tekan Ctrl+Shift+I → Harus blocked

### Test 3: Unauthorized Access
1. Login dengan email non-whitelist
2. Harus auto-logout dengan error message

### Test 4: CSP
1. Buka browser console
2. Check untuk CSP violations
3. Tidak boleh ada errors

---

## 📋 Deployment Checklist

Sebelum deploy production:

- [ ] Copy `config.example.js` ke `config.js` 
- [ ] Isi `config.js` dengan kredensial aktual
- [ ] Verify `config.js` ada di `.gitignore`
- [ ] Test lokal untuk memastikan konfigurasi benar
- [ ] Setup Firebase API restrictions
- [ ] Configure Firestore security rules
- [ ] Enable Firebase App Check
- [ ] Add server-side validation di Google Apps Script
- [ ] Enable 2FA di semua admin emails
- [ ] Test semua fitur keamanan
- [ ] Monitor Firebase logs setelah deployment

---

## 🚨 Troubleshooting

### "config.js not found"
```bash
cp config.example.js config.js
# Edit config.js dengan kredensial Anda
```

### "Module not found" error
Pastikan `config.js` berada di root directory yang sama dengan `admin.js`

### "CORS Error"
- Check API restrictions di Google Cloud Console
- Verify domain di Firebase > Authorized domains

### DevTools masih bisa dibuka
Client-side protection **tidak 100% foolproof**. Itulah mengapa kita juga butuh:
- Server-side validation
- API restrictions
- Firestore security rules
- App Check

---

## 📚 Dokumentasi Lengkap

- **[SECURITY_FIXES.md](./SECURITY_FIXES.md)** - Penjelasan detail setiap security fix
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Step-by-step deployment guide
- **[SECURITY.md](./SECURITY.md)** - Security analysis & best practices

---

## ⚠️ CATATAN PENTING

### Tentang Client-Side Protection

DevTools protection di `security.js` **TIDAK** dapat 100% mencegah users yang determined untuk membuka DevTools. Ini adalah "defense in depth" layer yang membuat lebih sulit untuk manipulasi casual.

**Keamanan sesungguhnya** harus di backend:
- ✅ Server-side validation di Google Apps Script
- ✅ API restrictions di Firebase/Google Cloud
- ✅ Firestore security rules
- ✅ App Check enforcement
- ✅ Rate limiting

### Tentang Firebase API Keys

Firebase Web API keys **HARUS** ada di client-side code. Ini adalah behavior normal Firebase SDK. Yang penting:
- ✅ Restrict API key ke domain tertentu
- ✅ Gunakan Firestore security rules
- ✅ Enable App Check
- ✅ Monitor usage di Firebase Console

API key di `config.js` lebih untuk:
- Memudahkan management
- Menghindari accidental commit
- Memisahkan concern configuration

---

## 🔧 Development

### Struktur Kode

```javascript
// admin.js
import { firebaseConfig, ... } from './config.js';  // Import config
// ... rest of application code
```

```javascript
// config.js (git-ignored)
export const firebaseConfig = { ... };
export const RECAPTCHA_SITE_KEY = "...";
// dll
```

### Adding New Configuration

1. Tambahkan ke `config.example.js` (dengan placeholder)
2. Tambahkan ke `config.js` (dengan nilai aktual)
3. Import di `admin.js`

---

## 📞 Support

Jika menemukan masalah keamanan:

1. **JANGAN** commit atau expose credentials
2. **Segera** revoke API keys yang ter-expose
3. **Generate** API keys baru
4. **Update** `config.js`
5. **Review** logs untuk aktivitas mencurigakan

---

## 📄 License

[Sesuaikan dengan license project Anda]

---

**Dibuat dengan:** Firebase, Google Apps Script, Tailwind CSS  
**Keamanan Level:** 🔒 Hardened  
**Last Update:** 2026-02-05
