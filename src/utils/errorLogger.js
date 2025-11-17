/**
 * Frontend Error Logging Utility
 * Logs errors to console and optionally sends to backend
 * Works in both development and production
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mandapam-backend-97mi.onrender.com';

/**
 * Log error with context
 */
export const logError = (error, context = {}) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    error: {
      name: error?.name || 'Unknown',
      message: error?.message || String(error),
      stack: error?.stack,
      code: error?.code
    },
    context: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    }
  };

  // Always log to console (visible in browser console and production logs)
  console.error(`[ERROR] [${timestamp}]`, errorInfo);

  // In production, also try to send to backend (non-blocking)
  if (process.env.NODE_ENV === 'production') {
    sendErrorToBackend(errorInfo).catch(() => {
      // Silently fail - don't break the app if logging fails
    });
  }

  return errorInfo;
};

/**
 * Log API error with full request/response context
 */
export const logApiError = (endpoint, error, requestData = {}, responseData = {}) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    type: 'API_ERROR',
    endpoint,
    error: {
      name: error?.name || 'Unknown',
      message: error?.message || String(error),
      code: error?.code,
      response: error?.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    },
    request: {
      method: requestData.method || 'GET',
      url: endpoint,
      data: requestData.data,
      headers: requestData.headers
    },
    response: responseData,
    context: {
      userAgent: navigator.userAgent,
      url: window.location.href
    }
  };

  // Always log to console
  console.error(`[API_ERROR] [${timestamp}]`, errorInfo);

  // Send to backend in production
  if (process.env.NODE_ENV === 'production') {
    sendErrorToBackend(errorInfo).catch(() => {
      // Silently fail
    });
  }

  return errorInfo;
};

/**
 * Log timeout error
 */
export const logTimeout = (endpoint, timeoutMs, requestData = {}) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    type: 'TIMEOUT',
    endpoint,
    timeout: `${timeoutMs}ms`,
    request: {
      method: requestData.method || 'GET',
      url: endpoint,
      data: requestData.data
    },
    context: {
      userAgent: navigator.userAgent,
      url: window.location.href
    }
  };

  console.error(`[TIMEOUT] [${timestamp}]`, errorInfo);

  if (process.env.NODE_ENV === 'production') {
    sendErrorToBackend(errorInfo).catch(() => {});
  }

  return errorInfo;
};

/**
 * Log network error
 */
export const logNetworkError = (endpoint, error, requestData = {}) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    type: 'NETWORK_ERROR',
    endpoint,
    error: {
      name: error?.name || 'NetworkError',
      message: error?.message || 'Network request failed',
      code: error?.code
    },
    request: {
      method: requestData.method || 'GET',
      url: endpoint,
      data: requestData.data
    },
    context: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      online: navigator.onLine
    }
  };

  console.error(`[NETWORK_ERROR] [${timestamp}]`, errorInfo);

  if (process.env.NODE_ENV === 'production') {
    sendErrorToBackend(errorInfo).catch(() => {});
  }

  return errorInfo;
};

/**
 * Send error to backend (non-blocking)
 */
const sendErrorToBackend = async (errorInfo) => {
  try {
    // Use fetch with short timeout to avoid blocking
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    await fetch(`${API_BASE_URL}/api/logs/client-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorInfo),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
  } catch (sendError) {
    // Silently fail - don't log errors about logging
    console.debug('Failed to send error log to backend:', sendError.message);
  }
};

/**
 * Log QR check-in specific errors
 */
export const logQRCheckinError = (error, qrToken = null, context = {}) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    type: 'QR_CHECKIN_ERROR',
    error: {
      name: error?.name || 'Unknown',
      message: error?.message || String(error),
      code: error?.code,
      response: error?.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    },
    qrToken: qrToken ? {
      length: qrToken.length,
      prefix: qrToken.substring(0, 20),
      startsWithEVT: qrToken.startsWith('EVT:')
    } : null,
    context: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    }
  };

  console.error(`[QR_CHECKIN_ERROR] [${timestamp}]`, errorInfo);

  if (process.env.NODE_ENV === 'production') {
    sendErrorToBackend(errorInfo).catch(() => {});
  }

  return errorInfo;
};

/**
 * Setup global error handlers
 */
export const setupErrorHandlers = () => {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, {
      type: 'UNHANDLED_PROMISE_REJECTION',
      promise: event.promise
    });
  });

  // Catch JavaScript errors
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      type: 'JAVASCRIPT_ERROR',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
};

export default {
  logError,
  logApiError,
  logTimeout,
  logNetworkError,
  logQRCheckinError,
  setupErrorHandlers
};

