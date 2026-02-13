# Dokumentasi Refactoring - Lazismu Admin

## 📋 Ringkasan Perubahan

Aplikasi telah di-refactor untuk menggunakan arsitektur **UUID-based** yang lebih aman dan mudah dikelola, dengan standardisasi nama field dan struktur kode yang lebih modular.

## 🔄 Perubahan Utama

### 1. **Arsitektur Baru: UUID-based Operations**

**Sebelum:**
- Operasi menggunakan nomor baris (`row`) dari spreadsheet
- Risiko bentrok jika ada penghapusan data
- ID tidak konsisten

**Sesudah:**
- Setiap transaksi memiliki UUID unik (`idTransaksi`)
- Anti-bentrok (collision-resistant)
- ID persisten dan konsisten

```javascript
// Sebelum
verifyDonation(rowNumber)
deleteData(rowNumber)

// Sesudah
verifyDonation(idTransaksi)
deleteData(idTransaksi)
```

### 2. **Standardisasi Nama Field**

Field names distandarisasi menjadi lowercase/camelCase untuk konsistensi:

| Nama Lama | Nama Baru | Keterangan |
|-----------|-----------|------------|
| `JenisDonasi` | `type` | Jenis donasi (Zakat, Infaq, dll) |
| `Nominal` | `nominal` | Jumlah donasi |
| `MetodePembayaran` | `metode` | Metode pembayaran |
| `NamaDonatur` | `nama` | Nama donatur |
| `NoHP` | `hp` | Nomor HP |
| `PesanDoa` | `doa` | Pesan doa |
| `NISSantri` | `nisSantri` | NIS Santri |
| `NamaSantri` | `namaSantri` | Nama Santri |
| `KelasSantri` | `rombelSantri` | Kelas/Rombel Santri |
| `TipeDonatur` | `donaturTipe` | Tipe donatur (santri/alumni/umum) |

### 3. **Struktur Kode Modular**

Kode sekarang diorganisir dalam struktur modular:

```
adminlazismu/
├── src/
│   ├── constants.js        # Konfigurasi & konstanta
│   ├── utils/
│   │   └── format.js       # Utility functions (format rupiah, date, etc)
│   └── api/
│       └── gasAPI.js       # API layer untuk Google Apps Script
├── admin.js                # File utama (refactored)
├── admin.js.backup         # Backup file lama
└── Code.gs                 # Backend (UUID-based)
```

### 4. **Keamanan**

**Perubahan Keamanan:**
- ❌ **Dihapus**: Firebase authentication token dari backend requests
- ✅ **Tetap**: Firebase authentication untuk UI/frontend (login Google)
- ✅ **Baru**: Backend menggunakan ReCAPTCHA v3 untuk public form
- ✅ **Baru**: BYPASS_RECAPTCHA flag untuk testing mode

**Catatan Penting:**
- Backend (Code.gs) tidak lagi memvalidasi Firebase token
- Authentication hanya di frontend untuk kontrol akses UI
- Public donation form diproteksi dengan ReCAPTCHA

## 📝 Contoh Penggunaan

### Fetch Data
```javascript
// Data sekarang mengandung idTransaksi
const donations = await fetchDonations();
// [{idTransaksi: "uuid-123", type: "Zakat", nominal: 1000000, ...}, ...]
```

### Verify Donation
```javascript
// Gunakan UUID bukan row number
await verifyDonation("uuid-123");
```

### Update Donation
```javascript
// Payload menggunakan field names baru
const payload = {
  type: "Zakat Mal",
  nominal: 2000000,
  metode: "Transfer",
  nama: "Ahmad",
  hp: "08123456789"
};
await updateDonation("uuid-123", payload);
```

### Delete Donation
```javascript
await deleteDonation("uuid-123");
```

## 🔧 Perubahan Backend (Code.gs)

### Struktur Kolom Spreadsheet Baru

Spreadsheet sekarang memiliki struktur baru dengan kolom A untuk UUID:

| Col | Field | Deskripsi |
|-----|-------|-----------|
| A | idTransaksi | UUID unik (auto-generated) |
| B | Timestamp | Waktu transaksi |
| C | type | Jenis donasi |
| D | nominal | Jumlah donasi |
| E | metode | Metode pembayaran |
| F | nama | Nama donatur |
| G | donaturTipe | Tipe donatur |
| H | DetailAlumni | Detail alumni |
| I | namaSantri | Nama santri |
| J | nisSantri | NIS santri |
| K | rombelSantri | Kelas santri |
| L | hp | No HP |
| M | alamat | Alamat |
| N | email | Email |
| O | NoKTP | No KTP |
| P | doa | Pesan doa |
| Q | Status | Status verifikasi |

### ReCAPTCHA Configuration

```javascript
const RECAPTCHA_SECRET_KEY = "YOUR_SECRET_KEY";
const RECAPTCHA_THRESHOLD = 0.2;
const BYPASS_RECAPTCHA = true; // Set FALSE untuk production
```

## 🧪 Testing

### Test Checklist

- [ ] Login dengan Google (Firebase Auth)
- [ ] Fetch data - pastikan field names benar
- [ ] Filter berdasarkan type, metode, status
- [ ] Search donatur by nama, hp, email
- [ ] Verify donation
- [ ] Edit donation - test field mapping
- [ ] Delete donation
- [ ] Export CSV - check field names
- [ ] Print kuitansi PDF
- [ ] Pagination

## 🚀 Deployment

### 1. Update Backend (WAJIB!)

1. Buka Google Spreadsheet
2. Extensions → Apps Script
3. Copy isi `Code.gs` dari repository
4. Paste ke Apps Script editor
5. **Penting**: Tambahkan kolom A (idTransaksi) di spreadsheet jika belum ada
6. Save & Deploy version baru

### 2. Update Frontend

Frontend akan otomatis terupdate jika menggunakan GitHub Pages.

### 3. Migration Data Lama (Opsional)

Jika ada data lama tanpa UUID:

```javascript
// Script untuk generate UUID untuk data lama
function addUUIDToExistingData() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  
  for (let i = 2; i <= lastRow; i++) {
    const currentID = sheet.getRange(i, 1).getValue();
    if (!currentID || currentID === "") {
      const uuid = Utilities.getUuid();
      sheet.getRange(i, 1).setValue(uuid);
    }
  }
}
```

## 📚 Dokumentasi Fungsi Utama

### `fetchData()`
Mengambil semua data donasi dari backend dengan GET request.

### `verifyDonation(idTransaksi)`
Verifikasi donasi berdasarkan UUID.

**Parameter:**
- `idTransaksi` (string): UUID transaksi

### `updateDonation(idTransaksi, payload)`
Update data donasi.

**Parameters:**
- `idTransaksi` (string): UUID transaksi
- `payload` (object): Data baru dengan field names standardized

### `deleteDonation(idTransaksi)`
Hapus donasi berdasarkan UUID.

**Parameter:**
- `idTransaksi` (string): UUID transaksi

## ⚠️ Breaking Changes

### API Requests

**Sebelum:**
```javascript
{
  action: "verify",
  row: 5,
  authToken: "firebase-token"
}
```

**Sesudah:**
```javascript
{
  action: "verify",
  id: "uuid-123"
  // authToken dihapus
}
```

### Response Format

**Sebelum:**
```javascript
{
  row: 5,
  Timestamp: "2024-01-01",
  JenisDonasi: "Zakat",
  Nominal: 1000000,
  ...
}
```

**Sesudah:**
```javascript
{
  idTransaksi: "uuid-123",
  Timestamp: "2024-01-01",
  type: "Zakat",
  nominal: 1000000,
  ...
}
```

## 🐛 Troubleshooting

### Error: "Data dengan ID Transaksi ... tidak ditemukan"
- Pastikan UUID yang dikirim valid
- Check apakah data benar-benar ada di spreadsheet

### Error: "Invalid action"
- Pastikan Code.gs sudah diupdate ke versi terbaru
- Clear cache browser

### Data tidak muncul
- Check browser console (F12) untuk error
- Pastikan field names di frontend match dengan backend

### Filter tidak bekerja
- Clear filter dan coba lagi
- Pastikan data menggunakan field names baru

## 📞 Support

Untuk pertanyaan atau issue, silakan buka GitHub Issues di repository ini.

---

**Version:** 2.0  
**Last Updated:** 2026-02-13  
**Status:** ✅ Refactoring Complete
