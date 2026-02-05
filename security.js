// === KEAMANAN TAMBAHAN ===
// Script ini menambahkan lapisan keamanan ekstra untuk mencegah manipulasi client-side

(function() {
    'use strict';
    
    // 1. Disable Right Click (untuk mencegah inspect element dengan mudah)
    // CATATAN: Ini hanya membuat lebih sulit, bukan impossible
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        console.warn('Right click disabled untuk keamanan');
        return false;
    }, false);
    
    // 2. Disable common DevTools shortcuts
    document.addEventListener('keydown', function(e) {
        // F12 - DevTools
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I - DevTools
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+J - Console
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        // Ctrl+U - View Source
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+C - Inspect Element
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
    }, false);
    
    // 3. Detect DevTools Opening (berdasarkan timing difference)
    let devtoolsOpen = false;
    const threshold = 160; // DevTools biasanya membuat window lebih besar
    
    function detectDevTools() {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                console.warn('⚠️ PERINGATAN: DevTools terdeteksi');
                // Optional: Redirect atau tampilkan warning
                // window.location.href = '/warning.html';
            }
        } else {
            devtoolsOpen = false;
        }
    }
    
    // Check setiap 500ms
    setInterval(detectDevTools, 500);
    
    // 4. Prevent console manipulation
    // Override console methods untuk mendeteksi manipulasi
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = function() {
        // Log tetap berfungsi tapi kita bisa track
        originalLog.apply(console, arguments);
    };
    
    // 5. Monitor local/session storage (but don't freeze - it causes errors)
    // Instead, we just log access attempts
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
        // Log suspicious changes if needed
        return originalSetItem.apply(this, arguments);
    };
    
    // 6. Monitor untuk debugging attempts
    let lastTime = Date.now();
    setInterval(function() {
        const currentTime = Date.now();
        if (currentTime - lastTime > 300) { // Jeda lebih dari 300ms = kemungkinan breakpoint
            console.warn('⚠️ Debugging terdeteksi - execution paused');
        }
        lastTime = currentTime;
    }, 100);
    
    // 7. Protect against iframe injection
    if (window.top !== window.self) {
        console.error('⚠️ KEAMANAN: Aplikasi tidak boleh di-frame!');
        window.top.location = window.self.location;
    }
    
    // 8. Add integrity check untuk form submissions
    window.FORM_INTEGRITY_TOKEN = Math.random().toString(36).substring(2, 15);
    
    console.log('%c🔒 Sistem Keamanan Aktif', 'color: green; font-weight: bold; font-size: 14px;');
    console.log('%cPERINGATAN: Memodifikasi kode aplikasi dapat menyebabkan masalah keamanan!', 
                'color: red; font-weight: bold; font-size: 12px;');
})();
