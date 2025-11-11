export const COLORS = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  accent: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  light: '#f8fafc',
  white: '#ffffff',
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

export const CATEGORIES = [
  'Business Owner',
  'Professional',
  'Student',
  'Retired',
  'Other',
];

export const DISTRICTS = [
  'Mumbai',
  'Pune',
  'Nagpur',
  'Thane',
  'Nashik',
  'Aurangabad',
  'Solapur',
  'Kolhapur',
  'Amravati',
  'Nanded',
];

export const NOTIFICATION_CATEGORIES = [
  'Event',
  'News',
  'Update',
  'Reminder',
  'Other',
];

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'mr', name: 'Marathi' },
  { code: 'hi', name: 'Hindi' },
];

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Event slug to event ID mapping for public registration pages
// Example: Access /kolhapur-2026 or /Kolhapur-2026 will map to the event with ID 32
// To add a new event registration page:
//   1. Create the event in the admin panel
//   2. Note the event ID from the URL (e.g., /events/32)
//   3. Add the mapping here: 'slug-name': 32 (use lowercase)
// Note: Slugs are matched case-insensitively, but use lowercase in this mapping
export const EVENT_SLUGS = {
  'kolhapur-2026': 33,
  // Add both lowercase and any common variations if needed
  'Kolhapur-2026': 33, // Capital K variant for backward compatibility
};
