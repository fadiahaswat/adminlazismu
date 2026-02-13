/**
 * =====================================================================
 * LAZISMU MU'ALLIMIN - GOOGLE APPS SCRIPT BACKEND
 * =====================================================================
 * Script ini mengelola data donasi dan kuitansi untuk website Lazismu Mu'allimin
 * Fitur:
 * - CRUD operations untuk data donasi berbasis row number (16 kolom)
 * - Google reCAPTCHA v3 verification (Dengan fitur Bypass untuk Testing)
 * - Penyimpanan data kuitansi
 * - Verifikasi status donasi
 * 
 * @version 2.2 (Row-based, 16 columns)
 */

// =====================================================================
// KONFIGURASI
// =====================================================================

const SPREADSHEET_ID = "1EhFeSGfar1mqzEQo5CgncmDr8nflFqcSyAaXAFmWFqE";
const SHEET_NAME = "DataDonasi";           
const SHEET_KUITANSI = "DataKuitansi";     
const RECAPTCHA_SECRET_KEY = "6LdhLGIsAAAAABVKoyyNjpCjIt8z_eF54m1NyUQm";
const RECAPTCHA_THRESHOLD = 0.2;

// Column structure constants
const STATUS_COLUMN = 16;  // Column P
const DATA_START_COLUMN = 2;  // Column B (after Timestamp)
const DATA_COLUMN_COUNT = 14;  // Columns B-O

// SAKLAR PENGATURAN (TRUE = Bypass Captcha Aktif, FALSE = Wajib Captcha)
// Ganti menjadi FALSE saat website sudah rilis untuk publik!
const BYPASS_RECAPTCHA = true; 

// =====================================================================
// FUNGSI UTAMA - ENTRY POINTS
// =====================================================================

function doGet(e) {
  try {
    const data = readData();
    return response({ status: "success", data: data });
  } catch (error) {
    return response({ status: "error", message: error.message });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  
  try {
    lock.tryLock(10000);
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    if (!action) throw new Error("Invalid request: 'action' is missing.");
    
    let result;
    
    switch (action) {
      case "create":
        result = handleCreateDonation(requestData);
        break;
        
      case "kuitansi":
        result = simpanKuitansi(requestData);
        break;
        
      case "verify":
        if (!requestData.row) throw new Error("Row number is missing for verify action.");
        result = verifyData(requestData.row);
        break;
        
      case "update":
        if (!requestData.row || !requestData.payload) throw new Error("Row number and payload are required for update action.");
        result = updateData(requestData.row, requestData.payload);
        break;
        
      case "delete":
        if (!requestData.row) throw new Error("Row number is missing for delete action.");
        result = deleteData(requestData.row);
        break;
        
      case "sendReceipt":
        result = { message: "Kuitansi berhasil digenerate di klien." };
        break;
        
      default:
        throw new Error(`Invalid action: ${action}`);
    }
    
    return response({ status: "success", data: result });
    
  } catch (error) {
    Logger.log("Error in doPost: " + error.message);
    return response({ status: "error", message: error.message });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

// =====================================================================
// RECAPTCHA VERIFICATION
// =====================================================================

function verifikasiRecaptcha(token) {
  try {
    const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + RECAPTCHA_SECRET_KEY + "&response=" + token;
    const httpResponse = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const json = JSON.parse(httpResponse.getContentText());
    return json.success && json.score >= RECAPTCHA_THRESHOLD;
  } catch (error) {
    return false;
  }
}

function handleCreateDonation(requestData) {
  if (!requestData.payload) throw new Error("Payload is missing for create action.");
  
  const token = requestData.payload.recaptchaToken;
  let isHuman = false;

  // FITUR BYPASS RECAPTCHA
  if (BYPASS_RECAPTCHA) {
    isHuman = true; 
    Logger.log("Peringatan: Verifikasi reCAPTCHA di-bypass (Testing Mode).");
  } else {
    if (!token) throw new Error("Verifikasi keamanan gagal: Token reCAPTCHA tidak ditemukan.");
    isHuman = verifikasiRecaptcha(token);
  }
  
  if (!isHuman) {
    throw new Error("Sistem mendeteksi aktivitas mencurigakan (Bot). Donasi ditolak.");
  }
  
  delete requestData.payload.recaptchaToken;
  return createData(requestData.payload);
}

// =====================================================================
// DONATION CRUD OPERATIONS (UUID BASED)
// =====================================================================

function getSheet() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" tidak ditemukan.`);
  return sheet;
}

function createData(payload) {
  const sheet = getSheet();
  const timestamp = new Date();
  
  // Susun data sesuai struktur kolom A-P (16 Kolom tanpa UUID)
  const rowData = [
    timestamp,                  // A: Timestamp
    payload.type || "",         // B: Jenis Donasi
    payload.nominal || 0,       // C: Nominal
    payload.metode || "",       // D: Metode Pembayaran
    payload.nama || "",         // E: Nama Donatur
    payload.donaturTipe || "",  // F: Tipe Donatur
    payload.DetailAlumni || "", // G: Detail Alumni
    payload.namaSantri || "",   // H: Nama Santri
    payload.nisSantri || "",    // I: NIS Santri
    payload.rombelSantri || "", // J: Rombel/Kelas Santri
    payload.hp || "",           // K: No HP
    payload.alamat || "",       // L: Alamat
    payload.email || "",        // M: Email
    payload.NoKTP || "",        // N: No KTP
    payload.doa || "",          // O: Pesan Doa
    "Belum Verifikasi"          // P: Status
  ];
  
  sheet.appendRow(rowData);
  const row = sheet.getLastRow();
  return { message: "Data berhasil disimpan.", row: row };
}

function readData() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) return [];
  
  // Baca data dari Kolom A-P (16 Kolom)
  const range = sheet.getRange(2, 1, lastRow - 1, 16);
  const values = range.getValues();
  
  return values.map((row, index) => ({
    row: index + 2,            // Nomor baris di sheet (mulai dari 2)
    Timestamp: row[0],
    type: row[1],              // Diseragamkan dengan frontend (dulu: JenisDonasi)
    nominal: row[2],           // Diseragamkan
    metode: row[3],            // Diseragamkan
    nama: row[4],              // Diseragamkan
    donaturTipe: row[5],
    DetailAlumni: row[6],
    namaSantri: row[7],
    nisSantri: row[8],
    rombelSantri: row[9],
    hp: row[10],               // Diseragamkan
    alamat: row[11],
    email: row[12],
    NoKTP: row[13],
    doa: row[14],              // Diseragamkan (dulu: PesanDoa)
    Status: row[15]
  }));
}

function verifyData(rowNumber) {
  const sheet = getSheet();
  
  // Update kolom P (STATUS_COLUMN) dengan status "Terverifikasi"
  sheet.getRange(rowNumber, STATUS_COLUMN).setValue("Terverifikasi");
  return { message: "Data berhasil diverifikasi." };
}

function updateData(rowNumber, p) {
  const sheet = getSheet();
  
  // Update data dari Kolom B - O (Diseragamkan dengan payload createData)
  const values = [[
    p.type || "",
    p.nominal || 0,
    p.metode || "",
    p.nama || "",
    p.donaturTipe || "",
    p.DetailAlumni || "",
    p.namaSantri || "",
    p.nisSantri || "",
    p.rombelSantri || "",
    p.hp || "",
    p.alamat || "",
    p.email || "",
    p.NoKTP || "",
    p.doa || ""
  ]];
  
  // Update DATA_COLUMN_COUNT kolom mulai dari DATA_START_COLUMN (B)
  sheet.getRange(rowNumber, DATA_START_COLUMN, 1, DATA_COLUMN_COUNT).setValues(values);
  return { message: "Data berhasil diperbarui." };
}

function deleteData(rowNumber) {
  const sheet = getSheet();
  sheet.deleteRow(rowNumber);
  return { message: "Data berhasil dihapus." };
}

// =====================================================================
// KUITANSI FUNCTIONS
// =====================================================================

function simpanKuitansi(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_KUITANSI);
  if (!sheet) throw new Error(`Tab "${SHEET_KUITANSI}" tidak ditemukan!`);
  
  const nextRow = sheet.getLastRow() + 1;
  const newRow = [
    new Date(),        // A
    data.no_inv,       // B
    data.tgl_kwt,      // C
    data.nama,         // D
    data.penyetor,     // E
    data.alamat,       // F
    data.hp,           // G
    data.zakat,        // H
    data.infaq,        // I
    data.lain,         // J
    data.total,        // K
    data.amil          // L
  ];
  
  sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
  return { message: "Data Kuitansi berhasil disimpan." };
}

function response(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
