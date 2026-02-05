// =====================================================================
// 1. KONFIGURASI KEAMANAN (WAJIB DIISI)
// =====================================================================
const FIREBASE_API_KEY = "AIzaSyDWWGUUlyRxiq3AA64yWAnGYwTLH_G-zEc"; // API Key Firebase Anda
const ALLOWED_EMAILS = [
  "lazismumuallimin@gmail.com",
  "ad.lazismumuallimin@gmail.com", 
  "andiaqillahfadiahaswat@gmail.com"
];

// =====================================================================
// 2. KONFIGURASI SPREADSHEET
// =====================================================================
const SPREADSHEET_ID = "1EhFeSGfar1mqzEQo5CgncmDr8nflFqcSyAaXAFmWFqE"; 
const SHEET_NAME = "DataDonasi";       // Tab Web Donasi
const SHEET_KUITANSI = "DataKuitansi"; // Tab Web Kuitansi

function verifyAuthToken(token) {
  if (!token) {
    console.error("DEBUG: Token tidak ditemukan dalam request.");
    return null;
  }
  
  const url = "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + FIREBASE_API_KEY;
  const payload = { idToken: token };
  
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true // Penting agar error response bisa dibaca
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    const data = JSON.parse(responseText);
    
    // DEBUG LOG: Cek apa balasan dari Google
    if (responseCode !== 200) {
      console.error("DEBUG: Gagal Validasi Token. Response: " + responseText);
      return null;
    }

    if (data.users && data.users.length > 0) {
      const email = data.users[0].email;
      console.log("DEBUG: Token valid untuk email: " + email);
      return email;
    } else {
      console.error("DEBUG: Token valid tapi user tidak ditemukan.");
    }
  } catch (e) {
    console.error("DEBUG: Exception saat fetch: " + e.toString());
    return null;
  }
  return null;
}

// =====================================================================
// 4. FUNGSI UTAMA (DO POST) - TEMPAT LOGIKA BERJALAN
// =====================================================================
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Mencegah bentrok data

  try {
    // -----------------------------------------------------
    // A. TERIMA DATA
    // -----------------------------------------------------
    let requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (err) {
      throw new Error("Format JSON tidak valid.");
    }

    const action = requestData.action;
    if (!action) throw new Error("Aksi (action) tidak ditemukan.");

    // -----------------------------------------------------
    // B. CEK KEAMANAN (SATPAM BERAKSI DI SINI)
    // -----------------------------------------------------
    // Daftar aksi yang WAJIB pakai Token Admin
    const protectedActions = ["fetch", "verify", "delete", "update", "kuitansi", "sendReceipt"];
    
    // Jika aksi termasuk yang diproteksi, kita cek tokennya
    if (protectedActions.includes(action)) {
      const token = requestData.authToken; // Token dari admin.js
      const userEmail = verifyAuthToken(token); // Cek keaslian
      
      // Jika token palsu ATAU email tidak terdaftar
      if (!userEmail || !ALLOWED_EMAILS.includes(userEmail.toLowerCase())) {
        return response({ 
          status: "error", 
          message: "AKSES DITOLAK: Sesi tidak valid atau Anda bukan admin." 
        });
      }
      // Jika lolos, kode lanjut ke bawah...
    }

    // -----------------------------------------------------
    // C. PROSES DATA (LOGIKA ASLI ANDA)
    // -----------------------------------------------------
    let result;

    if (action == "fetch") {
       // Ambil data untuk admin yang sudah terautentikasi
       result = readData();
    }
    else if (action == "kuitansi") {
       result = simpanKuitansi(requestData);
    }
    else if (action == "create") {
       // Create biasanya dari form publik, jadi tidak perlu token admin
       result = createData(requestData.payload);
    } 
    else if (action == "verify") {
       if (!requestData.row) throw new Error("Nomor baris (row) tidak ada.");
       result = verifyData(requestData.row);
    }
    else if (action == "update") {
       if (!requestData.row || !requestData.payload) throw new Error("Data tidak lengkap.");
       result = updateData(requestData.row, requestData.payload);
    } 
    else if (action == "delete") {
       if (!requestData.row) throw new Error("Nomor baris (row) tidak ada.");
       result = deleteData(requestData.row);
    } 
    else if (action == "sendReceipt") {
       return response({ status: "success", message: "Kuitansi siap." });
    }
    else {
       throw new Error(`Aksi tidak dikenal: ${action}`);
    }

    return response({ status: "success", data: result });

  } catch (error) {
    return response({ status: "error", message: error.message });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    const data = readData();
    return response({ status: "success", data: data });
  } catch (error) {
    return response({ status: "error", message: error.message });
  }
}

// =====================================================================
// 5. FUNGSI CRUD & HELPER (TIDAK DIUBAH)
// =====================================================================

function simpanKuitansi(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_KUITANSI);
  if (!sheet) throw new Error(`Tab "${SHEET_KUITANSI}" tidak ditemukan!`);

  var nextRow = sheet.getLastRow() + 1;
  var newRow = [
    new Date(), data.no_inv, data.tgl_kwt, data.nama, data.penyetor, 
    data.alamat, data.hp, data.zakat, data.infaq, data.lain, 
    data.total, data.amil
  ];

  sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
  return { message: "Data Kuitansi berhasil disimpan." };
}

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" tidak ditemukan.`);
  return sheet;
}

function createData(payload) {
  const sheet = getSheet();
  const timestamp = new Date();
  const rowData = [
    timestamp, payload.type, payload.nominal, payload.metode, payload.nama, 
    payload.donaturTipe, payload.DetailAlumni || "", payload.namaSantri || "", 
    payload.nisSantri || "", payload.rombelSantri || "", payload.hp, 
    payload.alamat, payload.email || "", payload.NoKTP || "", 
    payload.doa || "", "Belum Verifikasi"
  ];
  sheet.appendRow(rowData);
  return { message: "Data berhasil disimpan." };
}

function readData() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return []; 
  
  const range = sheet.getRange(2, 1, lastRow - 1, 16); 
  const values = range.getValues();
  
  return values.map((row, index) => ({
    row: index + 2,
    Timestamp: row[0], JenisDonasi: row[1], Nominal: row[2], MetodePembayaran: row[3],
    NamaDonatur: row[4], TipeDonatur: row[5], DetailAlumni: row[6], NamaSantri: row[7],
    NISSantri: row[8], KelasSantri: row[9], NoHP: row[10], Alamat: row[11],
    Email: row[12], NoKTP: row[13], PesanDoa: row[14], Status: row[15]
  }));
}

function verifyData(rowNumber) {
  const sheet = getSheet();
  sheet.getRange(rowNumber, 16).setValue("Terverifikasi");
  return { message: "Data berhasil diverifikasi." };
}

function updateData(rowNumber, p) {
  const sheet = getSheet();
  const values = [[
    p.JenisDonasi, p.Nominal, p.MetodePembayaran, p.NamaDonatur, p.TipeDonatur, 
    p.DetailAlumni, p.NamaSantri, p.NISSantri, p.KelasSantri, p.NoHP, 
    p.Alamat, p.Email, p.NoKTP, p.PesanDoa
  ]];
  sheet.getRange(rowNumber, 2, 1, 14).setValues(values);
  return { message: "Data berhasil diperbarui." };
}

function deleteData(rowNumber) {
  const sheet = getSheet();
  sheet.deleteRow(rowNumber);
  return { message: "Data berhasil dihapus." };
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
