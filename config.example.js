// --- CONTOH KONFIGURASI ---
// Salin file ini menjadi 'config.js' dan isi dengan kredensial Anda
// JANGAN commit file config.js ke repository!

export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const RECAPTCHA_SITE_KEY = "YOUR_RECAPTCHA_V3_SITE_KEY";

export const GAS_API_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL";

// API Key untuk autentikasi backend
// Harus SAMA PERSIS dengan 'ADMIN_API_KEY' di file code.gs backend
export const GAS_ADMIN_KEY = "Lazismu_2026_Secure_Key_#99";

export const ALLOWED_ADMIN_EMAILS = [
    "admin1@example.com",
    "admin2@example.com"
];
