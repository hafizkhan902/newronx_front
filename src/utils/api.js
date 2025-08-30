// API configuration utility
export const getApiUrl = () => {
  return process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:2000';
};

// API request wrapper with error handling
export const apiRequest = async (endpoint, options = {}) => {
  // If endpoint starts with '/api/', use CRA proxy (same-origin) to ensure cookies work
  const url = endpoint && endpoint.startsWith('/api/')
    ? endpoint
    : `${getApiUrl()}${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    cache: 'no-store',
    ...options
  };

  try {
    const response = await fetch(url, defaultOptions);
    if (!response.ok) {
      // Try to extract a meaningful error message from body
      let message = `${response.status} ${response.statusText}`;
      try {
        const data = await response.clone().json();
        message = data.message || data.error || (Array.isArray(data.errors) && data.errors[0]?.msg) || message;
      } catch {}
      throw new Error(`API request failed: ${message}`);
    }
    return response;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
}; 