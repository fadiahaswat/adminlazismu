# 🚀 Deployment Guide - Admin Lazismu

## Setup Awal

### 1. Konfigurasi Credentials

Sebelum deploy, Anda harus membuat file `config.js`:

```bash
# Copy template configuration
cp config.example.js config.js
```

Edit `config.js` dan isi dengan kredensial Anda:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxx"
};

export const RECAPTCHA_SITE_KEY = "6LeXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

export const GAS_API_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

export const ALLOWED_ADMIN_EMAILS = [
    "admin1@example.com",
    "admin2@example.com"
];
```

### 2. Verifikasi File Tidak Ter-commit

Pastikan `config.js` ada di `.gitignore`:

```bash
git status
# config.js TIDAK boleh muncul di list files to commit
```

### 3. Deploy ke GitHub Pages

```bash
git add .
git commit -m "Deploy secure version"
git push origin main
```

## Konfigurasi Firebase

### 1. API Key Restrictions

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project Anda
3. Menu: APIs & Services > Credentials
4. Klik API key Anda
5. Di "Application restrictions":
   - Pilih "HTTP referrers (web sites)"
   - Tambahkan:
     ```
     https://fadiahaswat.github.io/*
     https://your-domain.com/*
     ```
6. Save

### 2. Firestore Security Rules

Jika menggunakan Firestore, set security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.token.email in [
          'lazismumuallimin@gmail.com',
          'ad.lazismumuallimin@gmail.com',
          'andiaqillahfadiahaswat@gmail.com'
        ];
    }
  }
}
```

### 3. App Check Setup

1. Firebase Console > App Check
2. Klik "Register" untuk Web app
3. Pilih "reCAPTCHA v3"
4. Register domain Anda
5. Copy site key ke `config.js`

## Konfigurasi Google Apps Script

### 1. Server-Side Validation

Tambahkan validasi di `doPost()`:

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  // Validasi required fields
  if (!data.nama || !data.email || !data.nominal) {
    return errorResponse('Data tidak lengkap');
  }
  
  // Validasi format email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return errorResponse('Format email tidak valid');
  }
  
  // Validasi nominal
  if (isNaN(data.nominal) || data.nominal <= 0) {
    return errorResponse('Nominal tidak valid');
  }
  
  // Simpan ke spreadsheet...
}

function errorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}
```

### 2. ReCAPTCHA Verification

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  // Verifikasi ReCAPTCHA token
  if (data.recaptchaToken) {
    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const response = UrlFetchApp.fetch(verifyUrl, {
      method: 'post',
      payload: {
        secret: 'YOUR_RECAPTCHA_SECRET_KEY',
        response: data.recaptchaToken
      }
    });
    
    const result = JSON.parse(response.getContentText());
    if (!result.success || result.score < 0.5) {
      return errorResponse('Verifikasi keamanan gagal');
    }
  }
  
  // Lanjutkan...
}
```

### 3. Rate Limiting

```javascript
function doPost(e) {
  const cache = CacheService.getScriptCache();
  const clientIp = e.parameter.userip || 'unknown';
  const cacheKey = `rate_limit_${clientIp}`;
  
  const count = parseInt(cache.get(cacheKey) || '0');
  if (count >= 10) {
    return errorResponse('Terlalu banyak permintaan');
  }
  
  cache.put(cacheKey, (count + 1).toString(), 3600);
  
  // Lanjutkan...
}
```

## Testing

### 1. Test Lokal

Jalankan local server:

```bash
python3 -m http.server 8000
```

Buka: `http://localhost:8000`

### 2. Test Keamanan

- [ ] Coba login dengan email yang tidak di-whitelist → Harus ditolak
- [ ] Coba akses dashboard tanpa login → Harus redirect ke login
- [ ] Coba submit form dengan data invalid → Harus error
- [ ] Coba spam submission → Harus di-rate limit

### 3. Test API Restrictions

```bash
# Test dari domain yang tidak diizinkan
curl -X POST https://script.google.com/.../exec \
  -H "Origin: http://malicious-site.com" \
  -d '{"test": "data"}'

# Harus error: CORS/API restriction
```

## Monitoring

### Firebase Console

1. **Authentication**
   - Monitor login attempts
   - Check for unusual patterns

2. **Usage & Quotas**
   - Watch for unusual spikes
   - Set up budget alerts

3. **App Check**
   - Monitor verification failures
   - Check for bot attempts

### Google Apps Script

1. **Executions**
   - Check Apps Script > Executions
   - Look for errors or high volume

2. **Logs**
   - Review execution logs
   - Check for validation failures

## Rollback Plan

Jika ada masalah:

```bash
# Rollback ke versi sebelumnya
git log --oneline -10
git revert <commit-hash>
git push origin main
```

## Security Checklist

- [ ] `config.js` tidak ter-commit ke repository
- [ ] Firebase API key restricted ke domain yang benar
- [ ] Firestore security rules configured
- [ ] App Check enabled
- [ ] Google Apps Script validation implemented
- [ ] ReCAPTCHA added to donation form
- [ ] Rate limiting configured
- [ ] 2FA enabled pada semua admin email
- [ ] Monitoring alerts setup

## Troubleshooting

### Error: "config.js not found"

```bash
# Pastikan config.js ada
ls -la config.js

# Jika tidak ada, copy dari example
cp config.example.js config.js
```

### Error: "CORS blocked"

- Check API restrictions di Google Cloud Console
- Verify domain di Firebase Console > Authorized domains

### Error: "App Check failed"

- Verify ReCAPTCHA site key
- Check domain registration
- Clear browser cache

## Support

Untuk bantuan lebih lanjut:
- Lihat: `SECURITY_FIXES.md`
- Review: `SECURITY.md`

---

**Last Updated:** 2026-02-05
