# Ringkasan Perubahan - Fix Access Denied Error

## Masalah
```
Gagal verifikasi: AKSES DITOLAK: Sesi tidak valid atau Anda bukan admin.
```
Padahal email sudah benar dan terdaftar di `ALLOWED_EMAILS`.

## Akar Masalah
Fungsi `fetchData()` di frontend menggunakan GET request tanpa token autentikasi, namun backend Google Apps Script tidak memiliki handler untuk operasi fetch yang terautentikasi.

## Solusi

### Frontend: admin.js

**SEBELUM:**
```javascript
async function fetchData() {
    // ...
    try {
        const response = await fetch(GAS_API_URL);  // GET request tanpa auth
        const result = await response.json();
        // ...
    }
}
```

**SESUDAH:**
```javascript
async function fetchData() {
    // ...
    try {
        // Ambil user dan token untuk autentikasi
        const user = auth.currentUser;
        if (!user) throw new Error("Sesi login berakhir. Silakan login ulang.");
        
        const token = await user.getIdToken();
        
        // Kirim request dengan token autentikasi
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: "fetch",
                authToken: token
            })
        });
        const result = await response.json();
        // ...
    }
}
```

### Backend: Code.gs (Google Apps Script)

**PERUBAHAN 1: Protected Actions**
```javascript
// SEBELUM
const protectedActions = ["verify", "delete", "update", "kuitansi", "sendReceipt"];

// SESUDAH  
const protectedActions = ["fetch", "verify", "delete", "update", "kuitansi", "sendReceipt"];
```

**PERUBAHAN 2: Handler Action**
```javascript
// DITAMBAHKAN di doPost function
if (action == "fetch") {
   // Ambil data untuk admin yang sudah terautentikasi
   result = readData();
}
```

## Hasil

### Sebelum Fix
1. User login dengan email yang benar ✅
2. fetchData() dipanggil dengan GET request (tanpa token) ❌
3. Backend tidak bisa verifikasi admin ❌
4. Error: "AKSES DITOLAK" ❌

### Setelah Fix
1. User login dengan email yang benar ✅
2. fetchData() dipanggil dengan POST + token autentikasi ✅
3. Backend verifikasi token dan email ✅
4. Data berhasil dimuat ✅

## Keamanan

Semua operasi admin sekarang memerlukan autentikasi Firebase:

| Action | Deskripsi | Auth Required |
|--------|-----------|---------------|
| fetch | Ambil data donasi | ✅ YA (BARU) |
| verify | Verifikasi donasi | ✅ YA |
| update | Update donasi | ✅ YA |
| delete | Hapus donasi | ✅ YA |
| kuitansi | Simpan kuitansi | ✅ YA |
| sendReceipt | Kirim kuitansi | ✅ YA |
| create | Buat donasi baru (form publik) | ❌ TIDAK |

## File yang Diubah
1. ✅ `admin.js` - Update fetchData() untuk kirim token
2. ✅ `Code.gs` - Backend GAS script dengan handler fetch
3. ✅ `DEPLOYMENT.md` - Panduan deployment
4. ✅ `CHANGES_SUMMARY.md` - Dokumen ini
