// ============================================================
// CENTRAL CONFIG — dynamically determines backend IP
// ============================================================

const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // If opening the HTML directly from the filesystem (file:///...)
    if (protocol === 'file:' || !hostname) {
        return 'http://192.168.0.119:8000/api'; // Default fallback for local file testing
    }

    // Local development (if accessing via localhost)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://192.168.0.119:8000/api';
    }

    // Dynamic local network or production
    // If accessing via an IP like 192.168.X.X, this will construct the correct API URL dynamically
    if (hostname.match(/^[0-9.]+$/)) {
        return `http://${hostname}:8000/api`;
    }

    // Production / Fallback - assumes backend is on the same origin
    return window.location.origin + '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Legacy window.CONFIG kept for backward compatibility with
// any page that still reads window.CONFIG.API_BASE_URL
const CONFIG = {
    API_BASE_URL: API_BASE_URL,

    // Event slug to event ID mapping for public registration pages
    EVENT_SLUGS: {
        'annual-decorators-expo-2026': 1,
        'national-cataering-summit-2026': 2,
        'annual-expo-2026': 5,
        'international-event-design-decoration-expo-2027': 4,
    },

    // Cloudinary configuration
    CLOUDINARY: {
        CLOUD_NAME: '',         // Set your Cloudinary cloud name here
        UPLOAD_PRESET: '',      // Set your Cloudinary unsigned upload preset here
        USE_CLOUDINARY: false,
    }
};

CONFIG.CLOUDINARY.USE_CLOUDINARY = !!CONFIG.CLOUDINARY.CLOUD_NAME && !!CONFIG.CLOUDINARY.UPLOAD_PRESET;

window.CONFIG = CONFIG;
