// API configuration utility
export const getApiUrl = () => {
  return process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || '';
};

// Base URL for API: use env (production) when set, otherwise relative (dev proxy)
const getApiBase = () => {
  const base = getApiUrl();
  if (!base || base === '') return '';
  return base.replace(/\/$/, '');
};

// API request wrapper with error handling
export const apiRequest = async (endpoint, options = {}) => {
  const path = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const base = getApiBase();
  const url = base ? `${base}${path}` : path;
  
  console.log('🔄 [API] Making request to:', url);
  
  // Don't set Content-Type for FormData - let browser handle it
  const isFormData = options.body instanceof FormData;
  
  const defaultOptions = {
    credentials: 'include',
    headers: isFormData ? {
      ...options.headers
    } : {
      'Content-Type': 'application/json',
      ...options.headers
    },
    cache: 'no-store',
    ...options
  };

  try {
    const response = await fetch(url, defaultOptions);
    console.log('📡 [API] Response status:', response.status, 'for', url);
    
    if (!response.ok) {
      // Try to extract a meaningful error message from body
      let message = `${response.status} ${response.statusText}`;
      try {
        const data = await response.clone().json();
        message = data.message || data.error || (Array.isArray(data.errors) && data.errors[0]?.msg) || message;
        console.error('❌ [API] Error response body:', data);
      } catch (parseError) {
        console.error('❌ [API] Could not parse error response:', parseError);
      }
      throw new Error(`API request failed: ${message}`);
    }
    return response;
  } catch (error) {
    console.error(`❌ [API] Network error for ${url}:`, error);
    throw error;
  }
}; 