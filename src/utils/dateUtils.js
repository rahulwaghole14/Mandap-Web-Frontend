/**
 * Date utility functions for birth date handling
 */

/**
 * Format date to YYYY-MM-DD format for API
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateForAPI = (date) => {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return null;
  }
  
  return dateObj.toISOString().split('T')[0];
};

/**
 * Format date for display in UI
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale for formatting (default: 'en-IN')
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (date, locale = 'en-IN') => {
  if (!date) return 'Not provided';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Calculate age from birth date
 * @param {Date|string} birthDate - Birth date
 * @returns {number|null} Age in years or null if invalid
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  
  if (isNaN(birth.getTime())) {
    return null;
  }
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Check if person is at least 18 years old
 * @param {Date|string} birthDate - Birth date
 * @returns {boolean} True if at least 18 years old
 */
export const isAtLeast18 = (birthDate) => {
  const age = calculateAge(birthDate);
  return age !== null && age >= 18;
};

/**
 * Get maximum date for date picker (18 years ago)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getMaxDateForPicker = () => {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return maxDate.toISOString().split('T')[0];
};

/**
 * Get minimum date for date picker (100 years ago)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getMinDateForPicker = () => {
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  return minDate.toISOString().split('T')[0];
};

/**
 * Validate birth date
 * @param {string} birthDate - Birth date in YYYY-MM-DD format
 * @returns {object} Validation result with isValid and message
 */
export const validateBirthDate = (birthDate) => {
  if (!birthDate) {
    return { isValid: true, message: '' }; // Optional field
  }
  
  const date = new Date(birthDate);
  
  if (isNaN(date.getTime())) {
    return { isValid: false, message: 'Please enter a valid date' };
  }
  
  if (!isAtLeast18(birthDate)) {
    return { isValid: false, message: 'Member must be at least 18 years old' };
  }
  
  return { isValid: true, message: '' };
};
