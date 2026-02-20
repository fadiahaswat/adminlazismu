/**
 * =====================================================================
 * CONSTANTS - Centralized Configuration
 * =====================================================================
 */

// Firebase Configuration
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAWPIcS8h3kE6kJYBxjeVFdSprgrMzOFo8",
  authDomain: "lazismu-auth.firebaseapp.com",
  projectId: "lazismu-auth",
  storageBucket: "lazismu-auth.firebasestorage.app",
  messagingSenderId: "398570239500",
  appId: "1:398570239500:web:0b3e96109a4bf304ebe029"
};

// ReCAPTCHA Configuration
export const RECAPTCHA_SITE_KEY = '6LeXJmAsAAAAAJzjGF8E3oVbviXI_5BeEZYjy_hP';

// Allowed Admin Emails
export const ALLOWED_ADMIN_EMAILS = [
  "lazismumuallimin@gmail.com",
  "ad.lazismumuallimin@gmail.com",
  "tafak.k@gmail.com",
  "andiaqillahfadiahaswat@gmail.com"
];

// Google Apps Script API URL
export const GAS_API_URL = "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec";

// UI Constants
export const BTN_LOGIN_GOOGLE_HTML = '<i class="fab fa-google"></i><span>Masuk dengan Google</span>';

// Data Field Mapping (Old -> New naming convention)
export const FIELD_MAPPING = {
  // Backend uses these field names (standardized)
  type: 'type',           // Jenis Donasi
  nominal: 'nominal',     // Nominal
  metode: 'metode',       // Metode Pembayaran
  nama: 'nama',           // Nama Donatur
  hp: 'hp',               // No HP
  doa: 'doa',             // Pesan Doa
  alamat: 'alamat',
  email: 'email',
  donaturTipe: 'donaturTipe',
  DetailAlumni: 'DetailAlumni',
  namaSantri: 'namaSantri',
  nisSantri: 'nisSantri',
  rombelSantri: 'rombelSantri',
  NoKTP: 'NoKTP',
  Status: 'Status'
};

// Status Options
export const STATUS_OPTIONS = {
  UNVERIFIED: 'Belum Verifikasi',
  VERIFIED: 'Terverifikasi'
};

// Donation Types
export const DONATION_TYPES = [
  'Zakat',
  'Infaq',
  'Sedekah',
  'Wakaf',
  'Lainnya'
];

// Payment Methods
export const PAYMENT_METHODS = [
  'Tunai',
  'Transfer Bank',
  'E-Wallet',
  'QRIS'
];
