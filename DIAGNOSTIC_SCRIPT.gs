/**
 * =====================================================================
 * DIAGNOSTIC SCRIPT - Test Spreadsheet Structure
 * =====================================================================
 * Run this in Apps Script to verify your spreadsheet structure
 * 
 * CARA MENGGUNAKAN:
 * 1. Copy script ini ke Apps Script editor
 * 2. Save
 * 3. Pilih function "diagnoseSpreadsheetStructure" dari dropdown
 * 4. Klik "Run"
 * 5. Check Execution log untuk hasil
 */

// UPDATE THIS: Ganti dengan Spreadsheet ID Anda
// Cara mendapatkan ID: Buka spreadsheet, copy dari URL
// Contoh URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_ANDA/edit
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE"; // ← GANTI INI!
const SHEET_NAME = "DataDonasi"; // Sesuaikan nama sheet jika berbeda

function diagnoseSpreadsheetStructure() {
  Logger.log("=== DIAGNOSTIC: Spreadsheet Structure ===\n");
  
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      Logger.log("❌ ERROR: Sheet '" + SHEET_NAME + "' tidak ditemukan!");
      return;
    }
    
    Logger.log("✅ Sheet '" + SHEET_NAME + "' ditemukan\n");
    
    // 1. Check Headers
    Logger.log("--- 1. HEADER ROW ---");
    const headers = sheet.getRange(1, 1, 1, 20).getValues()[0];
    
    for (let i = 0; i < 17; i++) {
      const colLetter = String.fromCharCode(65 + i); // A=65, B=66, ...
      const header = headers[i] || "(kosong)";
      Logger.log("Kolom " + colLetter + ": " + header);
    }
    
    // 2. Expected Structure
    Logger.log("\n--- 2. EXPECTED STRUCTURE ---");
    const expectedHeaders = [
      "ID Transaksi atau idTransaksi",
      "Timestamp",
      "type atau JenisDonasi", 
      "nominal atau Nominal",
      "metode atau MetodePembayaran",
      "nama atau NamaDonatur",
      "donaturTipe",
      "DetailAlumni",
      "namaSantri",
      "nisSantri",
      "rombelSantri",
      "hp atau NoHP",
      "alamat",
      "email",
      "NoKTP",
      "doa atau PesanDoa",
      "Status"
    ];
    
    Logger.log("Struktur yang diharapkan:");
    for (let i = 0; i < expectedHeaders.length; i++) {
      const colLetter = String.fromCharCode(65 + i);
      Logger.log("Kolom " + colLetter + ": " + expectedHeaders[i]);
    }
    
    // 3. Check if Column A contains UUID
    Logger.log("\n--- 3. CHECK COLUMN A (ID Transaksi) ---");
    const lastRow = sheet.getLastRow();
    Logger.log("Total rows (including header): " + lastRow);
    
    if (lastRow > 1) {
      const sampleSize = Math.min(5, lastRow - 1);
      const columnAData = sheet.getRange(2, 1, sampleSize, 1).getValues();
      
      Logger.log("\nSample data di Kolom A (5 baris pertama):");
      let uuidCount = 0;
      
      for (let i = 0; i < columnAData.length; i++) {
        const value = columnAData[i][0];
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
        
        if (isUUID) uuidCount++;
        
        Logger.log("Row " + (i + 2) + ": " + value + " " + (isUUID ? "✅ (UUID)" : "❌ (BUKAN UUID)"));
      }
      
      Logger.log("\n📊 UUID Count: " + uuidCount + "/" + sampleSize);
      
      if (uuidCount === 0) {
        Logger.log("⚠️  WARNING: Kolom A tidak berisi UUID!");
        Logger.log("⚠️  Kemungkinan:");
        Logger.log("   1. Kolom A belum dibuat (masih struktur lama)");
        Logger.log("   2. Data belum di-migrate dengan UUID");
        Logger.log("\n💡 SOLUSI: Jalankan function 'fixMissingUUIDs()' untuk fix otomatis");
      } else if (uuidCount < sampleSize) {
        Logger.log("⚠️  WARNING: Sebagian data belum punya UUID!");
        Logger.log("💡 SOLUSI: Jalankan function 'fixMissingUUIDs()' untuk mengisi UUID yang kosong");
      } else {
        Logger.log("✅ BAGUS: Semua sample data punya UUID!");
      }
    } else {
      Logger.log("ℹ️  Sheet kosong (belum ada data)");
    }
    
    // 4. Test readData function
    Logger.log("\n--- 4. TEST readData() FUNCTION ---");
    try {
      const data = readData();
      if (data.length > 0) {
        const firstRecord = data[0];
        Logger.log("✅ readData() berhasil!");
        Logger.log("📄 Sample record pertama:");
        Logger.log("   idTransaksi: " + (firstRecord.idTransaksi || "KOSONG ❌"));
        Logger.log("   Timestamp: " + firstRecord.Timestamp);
        Logger.log("   type: " + (firstRecord.type || "KOSONG"));
        Logger.log("   nominal: " + (firstRecord.nominal || 0));
        Logger.log("   nama: " + (firstRecord.nama || "KOSONG"));
        Logger.log("   Status: " + (firstRecord.Status || "KOSONG"));
        
        if (!firstRecord.idTransaksi) {
          Logger.log("\n❌ ERROR: Field idTransaksi KOSONG!");
          Logger.log("   Ini berarti struktur mapping belum benar atau data belum punya UUID");
        }
      } else {
        Logger.log("ℹ️  Tidak ada data untuk di-test");
      }
    } catch (e) {
      Logger.log("❌ ERROR saat readData(): " + e.message);
    }
    
    // 5. Summary
    Logger.log("\n=== SUMMARY ===");
    Logger.log("Sheet: " + SHEET_NAME + " (" + (lastRow - 1) + " rows)");
    Logger.log("Header Kolom A: " + headers[0]);
    Logger.log("Struktur: " + (headers[0] && (headers[0].toLowerCase().includes("id") || headers[0].toLowerCase().includes("transaksi")) ? "✅ ADA" : "❌ TIDAK ADA"));
    
  } catch (error) {
    Logger.log("❌ FATAL ERROR: " + error.message);
    Logger.log("Stack trace: " + error.stack);
  }
}

/**
 * Fix missing UUIDs in Column A
 * Run this ONCE if Column A is empty or has missing UUIDs
 */
function fixMissingUUIDs() {
  Logger.log("=== FIXING MISSING UUIDs ===\n");
  
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log("❌ Sheet tidak ditemukan!");
    return;
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log("ℹ️  Tidak ada data untuk di-fix");
    return;
  }
  
  let fixedCount = 0;
  
  for (let i = 2; i <= lastRow; i++) {
    const cell = sheet.getRange(i, 1);
    const value = cell.getValue();
    
    // Check if empty or not a UUID
    if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      const newUUID = Utilities.getUuid();
      cell.setValue(newUUID);
      fixedCount++;
      Logger.log("Row " + i + ": Generated UUID = " + newUUID);
    }
  }
  
  Logger.log("\n✅ DONE! Fixed " + fixedCount + " rows");
}

/**
 * Helper function to check if spreadsheet uses old structure (16 columns)
 */
function checkIfOldStructure() {
  Logger.log("=== CHECK OLD STRUCTURE ===\n");
  
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, 20).getValues()[0];
  
  const firstHeader = headers[0] ? headers[0].toString().toLowerCase() : "";
  
  if (firstHeader.includes("timestamp") || firstHeader.includes("tanggal")) {
    Logger.log("⚠️  DETECTED: OLD STRUCTURE!");
    Logger.log("   Kolom A berisi: " + headers[0]);
    Logger.log("   Seharusnya kolom A berisi: ID Transaksi atau idTransaksi");
    Logger.log("\n💡 SOLUSI:");
    Logger.log("   1. Backup spreadsheet Anda!");
    Logger.log("   2. Insert 1 kolom baru di posisi paling kiri (sebelum kolom A)");
    Logger.log("   3. Rename kolom baru tersebut menjadi 'ID Transaksi'");
    Logger.log("   4. Jalankan function 'fixMissingUUIDs()' untuk mengisi UUID");
    return true;
  } else if (firstHeader.includes("id") || firstHeader.includes("transaksi")) {
    Logger.log("✅ STRUCTURE OK: Kolom A sudah ada untuk ID Transaksi");
    return false;
  } else {
    Logger.log("❓ UNKNOWN: Kolom A berisi: " + headers[0]);
    Logger.log("   Silakan periksa manual apakah ini sudah benar");
    return null;
  }
}
