# 🚀 Panduan Deployment - Aplikasi Lazismu yang Sudah Direfactor

## ⚡ Quick Deployment (5-10 Menit)

### Langkah 1: Update Backend (WAJIB!)

1. **Buka Google Spreadsheet Anda**
   - URL: https://docs.google.com/spreadsheets/d/1EhFeSGfar1mqzEQo5CgncmDr8nflFqcSyAaXAFmWFqE

2. **Periksa Struktur Kolom**
   - Pastikan kolom A adalah untuk `idTransaksi` (UUID)
   - Jika belum ada, insert kolom baru di posisi A
   
   **Struktur Baru:**
   ```
   A: idTransaksi (UUID)
   B: Timestamp
   C: type
   D: nominal
   E: metode
   F: nama
   G: donaturTipe
   ... dst
   ```

3. **Update Apps Script**
   - Klik: **Extensions → Apps Script**
   - Copy seluruh isi file `Code.gs` dari repository
   - Paste ke Apps Script editor (replace semua kode lama)
   - **PENTING**: Update konfigurasi:
   
   ```javascript
   const SPREADSHEET_ID = "1EhFeSGfar1mqzEQo5CgncmDr8nflFqcSyAaXAFmWFqE";
   const RECAPTCHA_SECRET_KEY = "YOUR_RECAPTCHA_SECRET"; // Update ini!
   const BYPASS_RECAPTCHA = true; // Set false untuk production
   ```

4. **Deploy Script**
   - Klik: **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**
   - Copy **Web app URL** (untuk update di admin.js jika berbeda)

### Langkah 2: Update Frontend (Otomatis via GitHub Pages)

Frontend akan otomatis terupdate jika menggunakan GitHub Pages. Jika tidak:

1. **Upload files ke hosting:**
   - `index.html`
   - `admin.js` (yang sudah direfactor)
   - `admin.css`
   - `tailwind-generated.css`
   - `logo.png`, `stempel.png`, `ttd.png`
   - Folder `src/` (opsional, untuk referensi)

2. **Verifikasi Konfigurasi:**
   
   Buka `admin.js` dan pastikan:
   ```javascript
   const GAS_API_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
   ```
   
   Match dengan URL dari deployment step 1.4 di atas.

### Langkah 3: Migrasi Data Lama (Jika Perlu)

Jika Anda memiliki data lama tanpa UUID:

1. **Buka Apps Script**
2. **Tambahkan function ini:**

```javascript
function migrateOldData() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  
  // Insert kolom A jika belum ada
  sheet.insertColumnBefore(1);
  sheet.getRange(1, 1).setValue("idTransaksi");
  
  // Generate UUID untuk setiap row
  for (let i = 2; i <= lastRow; i++) {
    const currentID = sheet.getRange(i, 1).getValue();
    
    if (!currentID || currentID === "") {
      const uuid = Utilities.getUuid();
      sheet.getRange(i, 1).setValue(uuid);
      Logger.log(`Row ${i}: Generated UUID ${uuid}`);
    }
  }
  
  Logger.log("Migration complete!");
}
```

3. **Run function:**
   - Select `migrateOldData`
   - Click **Run**
   - Authorize jika diminta
   - Check logs untuk konfirmasi

4. **Hapus function setelah selesai** (tidak diperlukan lagi)

### Langkah 4: Test Aplikasi

1. **Buka Admin Dashboard**
   - URL: https://fadiahaswat.github.io/adminlazismu/ (atau custom domain Anda)

2. **Login**
   - Klik "Masuk dengan Google"
   - Login dengan email admin yang diizinkan
   - Pastikan login berhasil dan UI muncul

3. **Test Fetch Data**
   - Klik tombol Refresh
   - Data harus muncul di tabel
   - Check browser console (F12) untuk error

4. **Test CRUD Operations**
   - [ ] **Verify**: Klik tombol verify (✓) pada salah satu donasi
   - [ ] **Edit**: Klik tombol edit (✏️), ubah data, save
   - [ ] **Delete**: Klik tombol delete (🗑️), konfirmasi
   - [ ] **Print**: Klik tombol print (🖨️), download PDF

5. **Test Filters**
   - [ ] Search by nama/hp
   - [ ] Filter by status (Terverifikasi/Belum)
   - [ ] Filter by type donasi
   - [ ] Filter by metode pembayaran
   - [ ] Filter by tanggal

6. **Test Export**
   - [ ] Klik "Export CSV"
   - [ ] Download dan buka file
   - [ ] Pastikan field names benar

## 🔍 Verifikasi Perubahan

### Checklist Backend (Code.gs)

```bash
✅ UUID generation dengan Utilities.getUuid()
✅ findRowById() function exists
✅ createData() returns idTransaksi
✅ readData() returns idTransaksi field
✅ verifyData(idTransaksi) - bukan row number
✅ updateData(idTransaksi, payload)
✅ deleteData(idTransaksi)
✅ BYPASS_RECAPTCHA = true untuk testing
✅ Field names: type, nominal, metode, nama, hp, doa
```

### Checklist Frontend (admin.js)

```bash
✅ fetchData() uses GET request
✅ verifyDonation(idTransaksi) - bukan rowNumber
✅ openEditModal(idTransaksi)
✅ handleEditSubmit() transforms field names
✅ executeDelete(idTransaksi)
✅ handlePrintReceipt(idTransaksi)
✅ Event listener uses data-id, bukan data-row
✅ No authToken in POST requests
✅ calculateStatistics() uses new field names
✅ applyFilters() uses new field names
```

### Checklist Spreadsheet

```bash
✅ Kolom A: idTransaksi (UUID format)
✅ Kolom B: Timestamp
✅ Kolom C: type (bukan JenisDonasi)
✅ Kolom D: nominal (bukan Nominal)
✅ Kolom E: metode (bukan MetodePembayaran)
✅ Kolom F: nama (bukan NamaDonatur)
✅ Kolom L: hp (bukan NoHP)
✅ Kolom P: doa (bukan PesanDoa)
✅ Kolom Q: Status
```

## ⚠️ Common Issues & Solutions

### Issue 1: "Data dengan ID Transaksi ... tidak ditemukan"

**Penyebab:**
- UUID tidak valid atau data sudah dihapus
- Spreadsheet belum dimigrate

**Solusi:**
1. Check spreadsheet, pastikan kolom A berisi UUID
2. Run migration script jika belum
3. Refresh halaman dan coba lagi

### Issue 2: Field names tidak match

**Penyebab:**
- Backend dan frontend menggunakan field names berbeda

**Solusi:**
1. Pastikan Code.gs menggunakan field names baru:
   ```javascript
   type, nominal, metode, nama, hp, doa
   ```
2. Pastikan admin.js juga menggunakan field names yang sama
3. Clear cache browser dan refresh

### Issue 3: "Action tidak dikenal"

**Penyebab:**
- Code.gs belum diupdate atau deployment belum refresh

**Solusi:**
1. Deploy ulang Code.gs
2. Pastikan deployment URL benar
3. Clear cache browser

### Issue 4: Edit form tidak save

**Penyebab:**
- Field mapping tidak benar

**Solusi:**
1. Check openEditModal() - pastikan field mapping benar
2. Check handleEditSubmit() - pastikan transform payload benar
3. Test dengan browser console open untuk lihat error

### Issue 5: PDF kuitansi tidak generate

**Penyebab:**
- Data lookup menggunakan row number bukan UUID

**Solusi:**
1. Pastikan handlePrintReceipt(idTransaksi)
2. Check find dengan: `allDonationData.find(r => r.idTransaksi === idTransaksi)`
3. Bukan: `r.row === rowNumber`

## 🔐 Security Checklist

```bash
✅ BYPASS_RECAPTCHA = false di production
✅ Firebase API key restricted di console
✅ ALLOWED_ADMIN_EMAILS configured
✅ CSP headers configured
✅ XSS protection (escapeHtml)
✅ No sensitive data in console.log (production)
```

## 📊 Performance Checklist

```bash
✅ Pagination working (default 50 rows)
✅ Filtering tidak lag
✅ Search responsive
✅ PDF generation < 5 seconds
✅ Data fetch < 3 seconds
```

## 🎉 Post-Deployment

### 1. Monitor Pertama 24 Jam

- Check error logs di Apps Script
- Monitor browser console untuk frontend errors
- Test semua operasi minimal 1x

### 2. Update Documentation

- Update URL deployment di README.md jika berbeda
- Document any custom configurations
- Update team on new features

### 3. Backup

- Backup spreadsheet
- Save deployment version
- Keep old code.gs as backup

### 4. Training

- Brief team tentang perubahan
- Explain new UUID system
- Show new features

## 📞 Support & Rollback

### Jika Ada Masalah Serius:

**Rollback Backend:**
1. Buka Apps Script
2. File → Version history
3. Restore version lama
4. Re-deploy

**Rollback Frontend:**
1. Restore dari `admin.js.backup`
2. Upload ke hosting
3. Clear cache

### Get Help:

- Check REFACTORING_GUIDE.md
- Check ARCHITECTURE_COMPARISON.md
- Open GitHub Issue
- Contact: lazismumuallimin@gmail.com

---

## ✅ Final Checklist

```bash
Backend:
[ ] Code.gs updated with UUID version
[ ] SPREADSHEET_ID configured
[ ] RECAPTCHA_SECRET_KEY configured
[ ] BYPASS_RECAPTCHA set appropriately
[ ] Deployed successfully
[ ] Web app URL copied

Frontend:
[ ] GAS_API_URL updated
[ ] Files uploaded to hosting
[ ] GitHub Pages deployed

Migration:
[ ] Old data has UUIDs
[ ] Column structure correct
[ ] Test data verified

Testing:
[ ] Login works
[ ] Fetch data works
[ ] Verify works
[ ] Edit works
[ ] Delete works
[ ] Print works
[ ] Filters work
[ ] Export works

Production:
[ ] BYPASS_RECAPTCHA = false
[ ] Firebase restricted
[ ] Monitoring enabled
[ ] Team notified
```

**Status:** When all checked, you're READY FOR PRODUCTION! 🚀

---

**Last Updated:** 2026-02-13  
**Version:** 2.0  
**Deployment Time:** ~10 minutes
