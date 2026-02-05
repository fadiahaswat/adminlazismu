# Fix: Access Denied Error untuk Admin yang Valid

## 🔴 Masalah
Admin yang sudah login dengan email yang benar mendapat error:
```
Gagal verifikasi: AKSES DITOLAK: Sesi tidak valid atau Anda bukan admin.
```

## 🔍 Analisis

### Alur SEBELUM Fix (❌ ERROR)
```
┌─────────────┐
│   Browser   │
│  (Admin)    │
└──────┬──────┘
       │ 1. Login berhasil ✅
       │    Email: lazismumuallimin@gmail.com
       │
       │ 2. fetchData() dipanggil
       │    GET /exec (TANPA TOKEN) ❌
       ▼
┌─────────────────────┐
│  Google Apps Script │
│   doGet() function  │
│                     │
│  ⚠️  Tidak ada      │
│     autentikasi!    │
└─────────────────────┘
       │
       │ 3. Return data ATAU error
       │    "AKSES DITOLAK" ❌
       ▼
┌─────────────┐
│   Browser   │
│  ❌ ERROR   │
└─────────────┘
```

### Alur SESUDAH Fix (✅ SUCCESS)
```
┌─────────────┐
│   Browser   │
│  (Admin)    │
└──────┬──────┘
       │ 1. Login berhasil ✅
       │    Email: lazismumuallimin@gmail.com
       │    Token: eyJhbGciOiJSUzI1...
       │
       │ 2. fetchData() dipanggil
       │    POST /exec
       │    Body: {
       │      action: "fetch",
       │      authToken: "eyJhbGciOiJSUzI1..." ✅
       │    }
       ▼
┌─────────────────────────────────────┐
│      Google Apps Script             │
│       doPost() function             │
│                                     │
│  1. Parse request ✅                │
│  2. Check protected actions ✅      │
│  3. Verify token via Firebase ✅    │
│  4. Check email in ALLOWED_EMAILS ✅│
│  5. Execute readData() ✅           │
└─────────────────────────────────────┘
       │
       │ 3. Return data
       │    { status: "success", data: [...] } ✅
       ▼
┌─────────────┐
│   Browser   │
│  ✅ SUCCESS │
│  Data muncul│
└─────────────┘
```

## 🔧 Perbaikan

### 1. Frontend: admin.js (Line 277-320)

**Perubahan:** Tambah autentikasi di fetchData()

```diff
async function fetchData() {
    loadingEl.classList.remove('hidden');
    tableWrapperEl.classList.add('hidden');
    refreshIcon.classList.add('fa-spin');

    try {
-       const response = await fetch(GAS_API_URL);
+       // Ambil user dan token untuk autentikasi
+       const user = auth.currentUser;
+       if (!user) throw new Error("Sesi login berakhir. Silakan login ulang.");
+       
+       const token = await user.getIdToken();
+       
+       // Kirim request dengan token autentikasi
+       const response = await fetch(GAS_API_URL, {
+           method: 'POST',
+           body: JSON.stringify({ 
+               action: "fetch",
+               authToken: token
+           })
+       });
        const result = await response.json();
```

### 2. Backend: Code.gs (Line 86 & 105-108)

**Perubahan 1:** Tambah "fetch" ke daftar protected actions
```diff
- const protectedActions = ["verify", "delete", "update", "kuitansi", "sendReceipt"];
+ const protectedActions = ["fetch", "verify", "delete", "update", "kuitansi", "sendReceipt"];
```

**Perubahan 2:** Tambah handler untuk action "fetch"
```javascript
if (action == "fetch") {
   // Ambil data untuk admin yang sudah terautentikasi
   result = readData();
}
```

## 📋 Checklist Deployment

### Untuk Developer:
- [x] Update `admin.js` di repository ✅
- [x] Buat file `Code.gs` dengan backend yang sudah diperbaiki ✅
- [x] Buat dokumentasi `DEPLOYMENT.md` ✅
- [x] Push ke GitHub ✅

### Untuk Admin/Deployer:
- [ ] Buka Google Apps Script di Google Spreadsheet
- [ ] Copy isi `Code.gs` dari repository
- [ ] Paste ke Apps Script editor (replace semua kode lama)
- [ ] Deploy dengan version baru
- [ ] Test login di admin dashboard
- [ ] Pastikan data muncul tanpa error

## 🔐 Keamanan

Sekarang SEMUA operasi admin dilindungi:

| Operation | Protected | Description |
|-----------|-----------|-------------|
| 🔍 fetch | ✅ | Ambil semua data donasi |
| ✔️ verify | ✅ | Verifikasi donasi |
| ✏️ update | ✅ | Update data donasi |
| 🗑️ delete | ✅ | Hapus data donasi |
| 🧾 kuitansi | ✅ | Simpan kuitansi |
| 📧 sendReceipt | ✅ | Kirim kuitansi |
| ➕ create | ❌ | Buat donasi (form publik) |

## 📚 Dokumentasi Lengkap

- `DEPLOYMENT.md` - Panduan deploy backend
- `CHANGES_SUMMARY.md` - Detail perubahan
- `README_FIX.md` - Dokumen ini

## ✅ Testing

Setelah deployment, test dengan:

1. **Test Login:**
   - Buka admin dashboard
   - Login dengan email yang terdaftar
   - Pastikan tidak ada error

2. **Test Fetch Data:**
   - Setelah login, data donasi harus muncul
   - Tidak ada error "AKSES DITOLAK"

3. **Test Operations:**
   - Test verifikasi donasi ✅
   - Test edit donasi ✅
   - Test hapus donasi ✅
   - Test cetak kuitansi ✅

## 🆘 Troubleshooting

**Error: "Aksi tidak dikenal: fetch"**
- Backend belum diupdate
- Deploy ulang Code.gs ke Apps Script

**Error: "AKSES DITOLAK" masih muncul**
- Clear browser cache
- Logout dan login kembali
- Periksa email di ALLOWED_EMAILS

**Data tidak muncul setelah login**
- Check console browser (F12)
- Periksa network tab untuk melihat response dari server
- Pastikan Apps Script sudah deployed dengan version baru
