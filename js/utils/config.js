const CONFIG = {
    API_BASE_URL: 'http://localhost:3001/api', // Can be changed to production URL
    
    // Event slug to event ID mapping for public registration pages
    EVENT_SLUGS: {
        'kolhapur-2026': 33,
        'Kolhapur-2026': 33,
    },
    
    // Cloudinary configuration
    CLOUDINARY: {
        CLOUD_NAME: '', // Set your Cloudinary cloud name here
        UPLOAD_PRESET: '', // Set your Cloudinary unsigned upload preset here
        USE_CLOUDINARY: false, // Will be dynamically evaluated based on keys
    }
};

// Check if Cloudinary is configured
CONFIG.CLOUDINARY.USE_CLOUDINARY = !!CONFIG.CLOUDINARY.CLOUD_NAME && !!CONFIG.CLOUDINARY.UPLOAD_PRESET;

window.CONFIG = CONFIG;
