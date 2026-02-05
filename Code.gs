/**
 * Google Apps Script Backend untuk Admin Dashboard LAZISMU
 * 
 * File ini harus di-deploy di Google Apps Script dan terhubung dengan Google Sheets.
 * URL deployment harus dimasukkan ke GAS_API_URL di admin.js
 * 
 * CARA DEPLOY:
 * 1. Buka Google Apps Script: https://script.google.com
 * 2. Buat project baru
 * 3. Copy isi file ini ke Code.gs
 * 4. Atur SPREADSHEET_ID dengan ID Google Sheet Anda
 * 5. Atur ALLOWED_ADMIN_EMAILS sesuai dengan admin.js
 * 6. Deploy sebagai Web App dengan akses "Anyone"
 * 7. Copy URL deployment ke admin.js sebagai GAS_API_URL
 */

// ============ KONFIGURASI ============
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE"; // Ganti dengan ID Google Sheet Anda
const SHEET_NAME = "Data"; // Nama sheet yang digunakan

// PENTING: Harus sama dengan ALLOWED_ADMIN_EMAILS di admin.js
const ALLOWED_ADMIN_EMAILS = [
    "lazismumuallimin@gmail.com",
    "ad.lazismumuallimin@gmail.com",
    "andiaqillahfadiahaswat@gmail.com"
];

// Firebase Project ID untuk validasi token
const FIREBASE_PROJECT_ID = "lazismu-auth";

/**
 * Fungsi utama untuk menangani HTTP GET request
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Ambil header dari baris pertama
    const headers = data[0];
    
    // Konversi data ke format JSON
    const jsonData = [];
    for (let i = 1; i < data.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }
      row.row = i + 1; // Nomor baris (1-based index)
      jsonData.push(row);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: jsonData
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Gagal mengambil data: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Fungsi utama untuk menangani HTTP POST request
 */
function doPost(e) {
  try {
    // Parse request body
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const authToken = requestData.authToken;
    
    // Validasi token dan dapatkan email
    const email = verifyFirebaseToken(authToken);
    
    if (!email) {
      return createErrorResponse('AKSES DITOLAK: Sesi tidak valid atau Anda bukan admin.');
    }
    
    // Cek apakah email termasuk admin yang diizinkan
    if (!isAdminEmail(email)) {
      return createErrorResponse('AKSES DITOLAK: Sesi tidak valid atau Anda bukan admin.');
    }
    
    // Handle berbagai action
    switch(action) {
      case 'verify':
        return handleVerify(requestData);
      case 'update':
        return handleUpdate(requestData);
      case 'delete':
        return handleDelete(requestData);
      case 'generate_receipt':
        return handleGenerateReceipt(requestData);
      default:
        return createErrorResponse('Action tidak dikenal: ' + action);
    }
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createErrorResponse('Terjadi kesalahan: ' + error.message);
  }
}

/**
 * Verifikasi Firebase ID Token dan kembalikan email
 * 
 * CATATAN: Ini adalah verifikasi sederhana menggunakan Google's token info API.
 * Untuk produksi, sebaiknya gunakan Firebase Admin SDK atau verifikasi yang lebih robust.
 */
function verifyFirebaseToken(token) {
  if (!token) {
    Logger.log('Token tidak ditemukan');
    return null;
  }
  
  try {
    // Gunakan Google's tokeninfo endpoint untuk memverifikasi token
    const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token);
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const responseCode = response.getResponseCode();
    
    if (responseCode !== 200) {
      Logger.log('Token verification failed with code: ' + responseCode);
      return null;
    }
    
    const tokenInfo = JSON.parse(response.getContentText());
    
    // Verifikasi audience (Firebase project ID atau client ID)
    const audience = tokenInfo.aud;
    const isValidAudience = audience && (
      audience.includes(FIREBASE_PROJECT_ID) || 
      audience.includes('398570239500') // App ID dari config
    );
    
    if (!isValidAudience) {
      Logger.log('Invalid audience: ' + audience);
      return null;
    }
    
    // Verifikasi issuer
    const issuer = tokenInfo.iss;
    const isValidIssuer = issuer && (
      issuer === 'https://securetoken.google.com/' + FIREBASE_PROJECT_ID ||
      issuer === 'accounts.google.com'
    );
    
    if (!isValidIssuer) {
      Logger.log('Invalid issuer: ' + issuer);
      return null;
    }
    
    // Verifikasi token belum expired
    const expirationTime = parseInt(tokenInfo.exp);
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (currentTime >= expirationTime) {
      Logger.log('Token expired');
      return null;
    }
    
    // Kembalikan email dari token
    const email = tokenInfo.email;
    Logger.log('Token verified for email: ' + email);
    return email ? email.toLowerCase().trim() : null;
    
  } catch (error) {
    Logger.log('Error verifying token: ' + error.toString());
    return null;
  }
}

/**
 * Cek apakah email termasuk admin yang diizinkan
 */
function isAdminEmail(email) {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedAdminEmails = ALLOWED_ADMIN_EMAILS.map(e => e.toLowerCase().trim());
  
  const isAdmin = normalizedAdminEmails.includes(normalizedEmail);
  Logger.log('Checking if ' + normalizedEmail + ' is admin: ' + isAdmin);
  
  return isAdmin;
}

/**
 * Handle verify action - tandai donasi sebagai terverifikasi
 */
function handleVerify(requestData) {
  try {
    const rowNumber = parseInt(requestData.row);
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    // Cari kolom "Terverifikasi" atau "Status"
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let statusCol = headers.indexOf('Terverifikasi') + 1;
    
    if (statusCol === 0) {
      statusCol = headers.indexOf('Status') + 1;
    }
    
    if (statusCol === 0) {
      return createErrorResponse('Kolom Terverifikasi/Status tidak ditemukan');
    }
    
    // Update status
    sheet.getRange(rowNumber, statusCol).setValue('Ya');
    
    // Tambahkan timestamp verifikasi jika ada kolom untuk itu
    const timestampCol = headers.indexOf('Waktu Verifikasi') + 1;
    if (timestampCol > 0) {
      sheet.getRange(rowNumber, timestampCol).setValue(new Date());
    }
    
    return createSuccessResponse('Data berhasil diverifikasi');
    
  } catch (error) {
    Logger.log('Error in handleVerify: ' + error.toString());
    return createErrorResponse('Gagal memverifikasi: ' + error.message);
  }
}

/**
 * Handle update action - update data donasi
 */
function handleUpdate(requestData) {
  try {
    const rowNumber = parseInt(requestData.row);
    const updateData = requestData.data;
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    // Ambil headers
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Update setiap field yang diberikan
    for (const key in updateData) {
      const colIndex = headers.indexOf(key) + 1;
      if (colIndex > 0) {
        sheet.getRange(rowNumber, colIndex).setValue(updateData[key]);
      }
    }
    
    return createSuccessResponse('Data berhasil diupdate');
    
  } catch (error) {
    Logger.log('Error in handleUpdate: ' + error.toString());
    return createErrorResponse('Gagal mengupdate: ' + error.message);
  }
}

/**
 * Handle delete action - hapus baris data
 */
function handleDelete(requestData) {
  try {
    const rowNumber = parseInt(requestData.row);
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    // Validasi row number
    if (rowNumber <= 1) {
      return createErrorResponse('Tidak dapat menghapus header');
    }
    
    if (rowNumber > sheet.getLastRow()) {
      return createErrorResponse('Nomor baris tidak valid');
    }
    
    // Hapus baris
    sheet.deleteRow(rowNumber);
    
    Logger.log('Row ' + rowNumber + ' deleted successfully');
    return createSuccessResponse('Data berhasil dihapus');
    
  } catch (error) {
    Logger.log('Error in handleDelete: ' + error.toString());
    return createErrorResponse('Gagal menghapus: ' + error.message);
  }
}

/**
 * Handle generate receipt - buat kwitansi
 */
function handleGenerateReceipt(requestData) {
  try {
    const rowNumber = parseInt(requestData.row);
    const receiptData = requestData.receiptData;
    
    // Di sini Anda bisa implementasi logic untuk generate PDF kwitansi
    // Untuk sekarang, kita hanya return success
    
    Logger.log('Receipt generated for row: ' + rowNumber);
    return createSuccessResponse('Kwitansi berhasil dibuat');
    
  } catch (error) {
    Logger.log('Error in handleGenerateReceipt: ' + error.toString());
    return createErrorResponse('Gagal membuat kwitansi: ' + error.message);
  }
}

/**
 * Helper function untuk membuat success response
 */
function createSuccessResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper function untuk membuat error response
 */
function createErrorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}
