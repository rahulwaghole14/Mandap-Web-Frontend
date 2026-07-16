// This file is kept for backward compatibility.
// The single source of truth is now js/config.js
// which must be loaded BEFORE this file in any HTML page.
//
// All pages should include:  <script src="js/config.js"></script>

if (typeof API_BASE_URL === 'undefined') {
    console.error('[config] js/config.js was not loaded before js/utils/config.js! Please add <script src="js/config.js"></script> before other scripts.');
}

const CONFIG = window.CONFIG || {
    API_BASE_URL: (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://192.168.0.102:8000') + '/api',

    EVENT_SLUGS: {
        'kolhapur-2026': 33,
        'Kolhapur-2026': 33,
    },

    CLOUDINARY: {
        CLOUD_NAME: '',
        UPLOAD_PRESET: '',
        USE_CLOUDINARY: false,
    }
};

CONFIG.CLOUDINARY.USE_CLOUDINARY = !!CONFIG.CLOUDINARY.CLOUD_NAME && !!CONFIG.CLOUDINARY.UPLOAD_PRESET;

window.CONFIG = CONFIG;
