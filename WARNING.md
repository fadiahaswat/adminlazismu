# ⚠️ PERINGATAN KEAMANAN - PENTING!

## UNTUK DEVELOPER / MAINTAINER

File `config.js` berisi kredensial aktual dan **SUDAH ADA** di repository lokal ini, tetapi **TIDAK AKAN** di-commit karena ada di `.gitignore`.

### ✅ Status Saat Ini:
- `config.js` → File aktual dengan kredensial (GIT IGNORED)
- `config.example.js` → Template tanpa kredensial (COMMITTED)
- `.gitignore` → Mengandung `config.js` (COMMITTED)

### 🔒 Yang Sudah Diperbaiki:

#### 1. API Keys & Database Protection
- ✅ Kredensial dipindahkan dari `admin.js` ke `config.js`
- ✅ `config.js` ditambahkan ke `.gitignore`
- ✅ `config.example.js` dibuat sebagai template
- ✅ `admin.js` sekarang import dari `config.js`

#### 2. Inspect Element Protection
- ✅ `security.js` ditambahkan dengan:
  - Right-click disabled
  - DevTools shortcuts blocked (F12, Ctrl+Shift+I, dll)
  - DevTools detection
  - Anti-debugging measures
  - Frame injection prevention
- ✅ Security headers ditambahkan di HTML

#### 3. Bot Protection
- ✅ ReCAPTCHA v3 sudah ada (App Check)
- ✅ Dokumentasi untuk menambahkan ReCAPTCHA di form donasi
- ✅ Panduan rate limiting di Google Apps Script

#### 4. Database Security
- ✅ Dokumentasi server-side validation
- ✅ Panduan API authentication
- ✅ Firestore security rules examples
- ✅ Instruksi Firebase API restrictions

### 📋 YANG HARUS DILAKUKAN SETELAH DEPLOY:

**CRITICAL - Harus dilakukan untuk production:**

1. **Firebase Console** - Restrict API Key:
   - Google Cloud Console > APIs & Services > Credentials
   - Restrict ke domain: `https://fadiahaswat.github.io/*`

2. **Google Apps Script** - Server-Side Validation:
   - Tambahkan validasi di `doPost()` function
   - Verifikasi ReCAPTCHA token
   - Implementasi rate limiting
   - Tambahkan API key authentication

3. **Firebase Firestore** - Security Rules:
   - Set rules agar hanya authenticated admin yang bisa read/write

4. **Email Security** - Enable 2FA:
   - lazismumuallimin@gmail.com
   - ad.lazismumuallimin@gmail.com  
   - andiaqillahfadiahaswat@gmail.com

### ⚠️ CATATAN PENTING:

#### Tentang Client-Side Protection:
`security.js` menambahkan lapisan proteksi DevTools, tapi **TIDAK 100% foolproof**. Users yang determined masih bisa membuka DevTools dengan cara lain. Ini adalah "defense in depth" layer.

**Keamanan sesungguhnya** ada di backend:
- Server-side validation di Google Apps Script
- Firebase API restrictions
- Firestore security rules
- App Check enforcement

#### Tentang config.js:
File ini **HARUS** ada untuk aplikasi berjalan. Saat clone repository baru:
```bash
cp config.example.js config.js
# Edit config.js dengan kredensial aktual
```

### 🧪 Testing:

```bash
# 1. Verify config.js tidak ter-commit
git status config.js
# Output: "nothing to commit" atau "Untracked files" (OK)

# 2. Test aplikasi lokal
python3 -m http.server 8000
# Buka http://localhost:8000

# 3. Test DevTools protection
# - Klik kanan → Disabled
# - F12 → Blocked
# - Ctrl+Shift+I → Blocked

# 4. Test authentication
# - Login dengan email whitelist → Success
# - Login dengan email lain → Auto logout
```

### 📁 Files Changed:

```
Modified:
  .gitignore          → Added config.js, .env, dll
  admin.js            → Import from config.js instead of hardcoded
  index.html          → Added security headers & security.js

Created:
  config.js           → Actual credentials (GIT IGNORED)
  config.example.js   → Template
  security.js         → DevTools protection
  SECURITY_FIXES.md   → Detailed security documentation
  DEPLOYMENT.md       → Deployment guide
  README.md           → Project readme
  WARNING.md          → This file
```

### 🚀 Next Steps:

1. **Review** semua changes
2. **Test** aplikasi lokal
3. **Commit & Push** (config.js akan auto-ignored)
4. **Deploy** ke GitHub Pages
5. **Configure** Firebase restrictions (CRITICAL!)
6. **Implement** server-side validation di Google Apps Script
7. **Monitor** Firebase logs untuk aktivitas mencurigakan

### 📞 Jika Ada Masalah:

**Jika config.js ter-commit:**
```bash
git rm --cached config.js
git commit -m "Remove config.js from repository"
git push
```

**Jika API key ter-expose:**
1. Revoke key di Firebase Console
2. Generate key baru
3. Update config.js
4. Re-deploy

---

**Dibuat:** 2026-02-05  
**Priority:** 🔴 CRITICAL  
**Action Required:** Follow deployment checklist ASAP
