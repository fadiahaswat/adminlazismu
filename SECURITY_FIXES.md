# 🔐 Panduan Keamanan - Admin Lazismu

## ⚠️ MASALAH KEAMANAN YANG DIPERBAIKI

Dokumen ini menjelaskan masalah keamanan yang telah diidentifikasi dan langkah-langkah yang diambil untuk memperbaikinya.

---

## 🛡️ MASALAH KEAMANAN

### 1. API Keys dan Database Terekspos ❌

**Masalah:**
- Firebase API key, ReCAPTCHA site key, dan Google Apps Script URL di-hardcode di dalam `admin.js`
- Kredensial ini dapat dilihat oleh siapa saja yang membuka DevTools browser
- Dapat disalahgunakan untuk mengakses Firebase project atau spam API endpoint

**Solusi yang Diimplementasikan:**
- ✅ Memindahkan semua kredensial ke file `config.js` yang terpisah
- ✅ Menambahkan `config.js` ke `.gitignore` agar tidak ter-commit ke repository
- ✅ Menyediakan `config.example.js` sebagai template untuk deployment
- ✅ Dokumentasi cara mengkonfigurasi Firebase API restrictions

**Catatan Penting:**
> ⚠️ **Firebase API keys memang HARUS ada di client-side** untuk web apps. Yang penting adalah:
> 1. **Restrict API key di Firebase Console** (batasi ke domain tertentu)
> 2. **Gunakan Firebase Security Rules** untuk mengontrol akses database
> 3. **Aktifkan App Check** untuk memverifikasi request dari aplikasi yang sah

---

### 2. Aplikasi Bisa Diutak-atik Melalui Inspect Element ❌

**Masalah:**
- Validasi form hanya dilakukan di client-side (JavaScript/HTML5)
- User bisa:
  - Menonaktifkan validasi melalui DevTools
  - Mengubah nilai input sebelum submit
  - Mengirim request langsung ke Google Apps Script endpoint

**Solusi yang Diimplementasikan:**
- ✅ Dokumentasi untuk implementasi server-side validation di Google Apps Script
- ✅ Menambahkan instruksi untuk validasi data di backend
- ✅ Rekomendasi untuk menambahkan checksum/signature pada data yang dikirim

**Yang Harus Dilakukan di Google Apps Script:**
```javascript
function doPost(e) {
  // VALIDASI SERVER-SIDE
  const data = JSON.parse(e.postData.contents);
  
  // 1. Validasi format email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Format email tidak valid'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 2. Validasi nominal (harus > 0)
  if (isNaN(data.nominal) || data.nominal <= 0) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Nominal tidak valid'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 3. Validasi required fields
  const requiredFields = ['nama', 'email', 'telepon', 'nominal'];
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: `Field ${field} wajib diisi`
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // Lanjutkan dengan menyimpan data...
}
```

---

### 3. Bot Bisa Mengirim Donasi ❌

**Masalah:**
- ReCAPTCHA v3 hanya diimplementasikan di admin panel
- Form donasi publik (jika ada) tidak dilindungi dari bot
- Tidak ada rate limiting untuk mencegah spam submissions

**Solusi yang Diimplementasikan:**
- ✅ App Check dengan ReCAPTCHA v3 sudah aktif di admin panel
- ✅ Dokumentasi untuk menambahkan ReCAPTCHA di form donasi publik
- ✅ Rekomendasi untuk rate limiting di Google Apps Script

**Yang Harus Dilakukan:**

#### A. Tambahkan ReCAPTCHA v3 di Form Donasi (jika ada form publik)
```html
<!-- Di HTML form donasi -->
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_RECAPTCHA_SITE_KEY"></script>

<script>
function submitDonation() {
  grecaptcha.ready(function() {
    grecaptcha.execute('YOUR_RECAPTCHA_SITE_KEY', {action: 'submit_donation'})
    .then(function(token) {
      // Kirim token bersama data donasi
      const formData = {
        ...yourDonationData,
        recaptchaToken: token
      };
      
      fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
    });
  });
}
</script>
```

#### B. Verifikasi ReCAPTCHA Token di Google Apps Script
```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  // Verifikasi ReCAPTCHA token
  const recaptchaSecret = 'YOUR_RECAPTCHA_SECRET_KEY';
  const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  
  const response = UrlFetchApp.fetch(verifyUrl, {
    method: 'post',
    payload: {
      secret: recaptchaSecret,
      response: data.recaptchaToken
    }
  });
  
  const result = JSON.parse(response.getContentText());
  
  // ReCAPTCHA v3 memberikan score 0.0 - 1.0
  // Score > 0.5 = kemungkinan besar manusia
  if (!result.success || result.score < 0.5) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Verifikasi keamanan gagal'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Lanjutkan menyimpan donasi...
}
```

#### C. Implementasi Rate Limiting
```javascript
// Di Google Apps Script
const RATE_LIMIT_CACHE = CacheService.getScriptCache();
const MAX_REQUESTS_PER_IP = 10; // Max 10 donasi per IP per jam
const TIME_WINDOW = 3600; // 1 jam dalam detik

function doPost(e) {
  const clientIp = e.parameter.userip || 'unknown';
  const cacheKey = `rate_limit_${clientIp}`;
  
  // Cek berapa kali IP ini sudah submit
  const requestCount = parseInt(RATE_LIMIT_CACHE.get(cacheKey) || '0');
  
  if (requestCount >= MAX_REQUESTS_PER_IP) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Increment counter
  RATE_LIMIT_CACHE.put(cacheKey, (requestCount + 1).toString(), TIME_WINDOW);
  
  // Lanjutkan proses...
}
```

---

### 4. Database Terekspos ❌

**Masalah:**
- Google Apps Script endpoint bersifat publik
- Tidak ada autentikasi untuk mengakses data donasi
- Semua orang bisa membaca data jika tahu URL endpoint

**Solusi yang Diimplementasikan:**
- ✅ Dokumentasi untuk menambahkan autentikasi token di Google Apps Script
- ✅ Rekomendasi untuk menyembunyikan data sensitif dari response publik

**Yang Harus Dilakukan di Google Apps Script:**

#### A. Tambahkan API Key/Token Authentication
```javascript
const VALID_API_KEYS = [
  'your-secret-api-key-1',
  'your-secret-api-key-2' // Untuk admin panel
];

function doGet(e) {
  // Require API key untuk GET request (membaca data)
  const apiKey = e.parameter.apiKey || e.parameter.api_key;
  
  if (!VALID_API_KEYS.includes(apiKey)) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Unauthorized: API key tidak valid'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Lanjutkan membaca data...
}

function doPost(e) {
  // Verifikasi ReCAPTCHA untuk POST (sudah dibahas di atas)
  // + API key jika diperlukan
}
```

#### B. Update Admin Panel untuk Mengirim API Key
```javascript
// Di admin.js
const GAS_API_KEY = 'your-secret-api-key-2'; // Simpan di config.js

async function fetchData() {
  try {
    // Kirim API key sebagai query parameter
    const response = await fetch(`${GAS_API_URL}?apiKey=${GAS_API_KEY}`);
    const result = await response.json();
    // ...
  } catch (error) {
    // ...
  }
}
```

#### C. Sembunyikan Data Sensitif di Response
```javascript
function doGet(e) {
  // Jangan return semua field data sensitif
  const data = sheet.getDataRange().getValues();
  
  // Filter/sanitize data
  const publicData = data.map(row => ({
    tanggal: row[0],
    nama: row[1], // Mungkin anonymize: "A***" 
    jenis_donasi: row[2],
    nominal: row[3]
    // JANGAN kirim: alamat lengkap, no telepon, email
  }));
  
  return ContentService.createTextOutput(
    JSON.stringify({status: 'success', data: publicData})
  ).setMimeType(ContentService.MimeType.JSON);
}
```

---

## 🎯 CHECKLIST KEAMANAN UNTUK DEPLOYMENT

### Firebase Console Settings

- [ ] **Restrict Firebase API Key:**
  1. Buka Firebase Console > Project Settings > General
  2. Scroll ke "Your apps" > Web app
  3. Klik ikon settings (⚙️) > "App settings"
  4. Klik "API restrictions" atau buka Google Cloud Console
  5. Restrict API key ke domain yang diizinkan:
     - `https://fadiahaswat.github.io`
     - `https://your-custom-domain.com`

- [ ] **Firestore Security Rules** (jika menggunakan Firestore):
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        // Hanya admin yang ter-autentikasi yang bisa read/write
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

- [ ] **Enable App Check** untuk semua services:
  1. Firebase Console > App Check
  2. Register app dengan reCAPTCHA v3
  3. Enforce App Check untuk Firestore, Storage, dll

### Google Apps Script

- [ ] **Implementasi Server-Side Validation** (lihat contoh di atas)
- [ ] **Tambahkan ReCAPTCHA Verification** untuk form donasi
- [ ] **Implementasi Rate Limiting** untuk mencegah spam
- [ ] **Tambahkan API Key Authentication** untuk endpoint read
- [ ] **Filter/Sanitize data sensitif** di response

### Code Security

- [ ] **Jangan commit `config.js`** ke repository
- [ ] **Gunakan `config.example.js`** sebagai template
- [ ] **Review `.gitignore`** pastikan config files ter-exclude
- [ ] **Rotate API keys** secara berkala
- [ ] **Monitor Firebase Usage** untuk aktivitas mencurigakan

### Email Account Security

- [ ] **Aktifkan 2-Factor Authentication** di semua admin email:
  - lazismumuallimin@gmail.com
  - ad.lazismumuallimin@gmail.com
  - andiaqillahfadiahaswat@gmail.com

- [ ] **Gunakan App Passwords** jika diperlukan untuk integration

### Monitoring

- [ ] **Setup Firebase Alerts** untuk:
  - Unusual authentication attempts
  - High API usage
  - Quota exceeded

- [ ] **Review Logs Bulanan**:
  - Firebase Authentication logs
  - Google Apps Script execution logs
  - Failed login attempts

---

## 📚 RESOURCES

### Firebase Security
- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [API Key Restrictions](https://cloud.google.com/docs/authentication/api-keys)
- [Firebase App Check](https://firebase.google.com/docs/app-check)

### Google Apps Script Security
- [Best Practices for Apps Script](https://developers.google.com/apps-script/guides/best-practices)
- [ReCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)

### Web Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## 🆘 TROUBLESHOOTING

### "Firebase API key not found"
- Pastikan file `config.js` sudah dibuat dari `config.example.js`
- Isi semua values di `config.js` dengan kredensial yang benar

### "CORS Error"
- Pastikan domain sudah di-whitelist di Firebase Console
- Check CSP headers di `index.html`

### "App Check failed"
- Pastikan ReCAPTCHA site key valid
- Domain harus match dengan yang terdaftar di Firebase Console

---

## 📞 SUPPORT

Jika menemukan masalah keamanan:

1. **JANGAN** commit atau push perubahan yang mengekspos kredensial
2. **Segera** revoke API keys yang ter-exposed
3. **Generate** API keys baru di Firebase/Google Cloud Console
4. **Update** `config.js` dengan kredensial baru
5. **Review** logs untuk aktivitas mencurigakan

---

**Dibuat:** 2026-02-05  
**Status:** 🔒 CRITICAL - Segera Implementasikan  
**Version:** 2.0
