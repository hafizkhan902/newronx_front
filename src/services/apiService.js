// services/apiService.js
class ApiService {
  constructor() {
    this.baseURL = '/api'; // Let dev proxy handle port forwarding
  }

  // Generic request method with authentication
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Debug: Check cookies before request
    console.log(`[ApiService] Making request to: ${url}`);
    console.log(`[ApiService] Cookies present:`, document.cookie ? 'Yes' : 'No');
    console.log(`[ApiService] Cookie content:`, document.cookie);
    
    const config = {
      credentials: 'include', // Critical for cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.log(`[ApiService] Request failed: ${response.status}`, error);
        
        // If token is expired, try to refresh session
        if (response.status === 401 && error.message?.includes('token')) {
          console.log('[ApiService] Token expired, attempting session refresh...');
          await this.refreshSession();
          
          // Retry the original request
          console.log('[ApiService] Retrying request after session refresh...');
          const retryResponse = await fetch(url, config);
          if (!retryResponse.ok) {
            const retryError = await retryResponse.json().catch(() => ({}));
            throw new Error(retryError.message || 'API request failed after retry');
          }
          return await retryResponse.json();
        }
        
        throw new Error(error.message || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error(`[ApiService] Request error for ${url}:`, error);
      throw error;
    }
  }

  // Session refresh method
  async refreshSession() {
    try {
      console.log('[ApiService] Refreshing session...');
      const response = await fetch(`${this.baseURL}/users/profile`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        console.log('[ApiService] Session refreshed successfully');
        return true;
      } else {
        console.warn('[ApiService] Session refresh failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('[ApiService] Session refresh error:', error);
      return false;
    }
  }

  // Profile Management
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(profileData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // Avatar Management
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.request('/users/profile/avatar', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData
    });
  }

  // Password Management
  async updatePassword(currentPassword, newPassword) {
    return this.request('/users/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  // Email Management
  async updateEmail(emailData) {
    return this.request('/users/profile/email', {
      method: 'PUT',
      body: JSON.stringify(emailData)
    });
  }

  // Notification Settings
  async getNotificationSettings() {
    return this.request('/users/profile/notifications');
  }

  async updateEmailNotificationSettings(settings) {
    return this.request('/users/profile/notifications/email', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  async updateAppNotificationSettings(settings) {
    return this.request('/users/profile/notifications/app', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // Privacy Settings
  async getPrivacySettings() {
    return this.request('/users/profile/privacy');
  }

  async updatePrivacySettings(settings) {
    return this.request('/users/profile/privacy', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // Theme Settings
  async getThemeSettings() {
    return this.request('/users/profile/theme');
  }

  async updateThemeSettings(theme) {
    return this.request('/users/profile/theme', {
      method: 'PUT',
      body: JSON.stringify(theme)
    });
  }

  async updateThemeMode(mode) {
    return this.request('/users/profile/theme/mode', {
      method: 'PATCH',
      body: JSON.stringify({ mode })
    });
  }

  // Test Notifications
  async sendTestNotification(type) {
    return this.request('/users/profile/notifications/test', {
      method: 'POST',
      body: JSON.stringify({ type })
    });
  }

  // Logout
  async logout() {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }

  // Roles Management
  async getRoles() {
    return this.request('/users/profile/roles');
  }

  async updateRoles(roles) {
    return this.request('/users/profile/roles', {
      method: 'PUT',
      body: JSON.stringify(roles)
    });
  }

  // NDA Management
  async getNDASettings() {
    return this.request('/users/profile/nda');
  }

  async generateNDA(ndaData) {
    return this.request('/users/profile/nda/generate', {
      method: 'POST',
      body: JSON.stringify(ndaData)
    });
  }

  async uploadNDA(file) {
    const formData = new FormData();
    formData.append('nda', file);

    return this.request('/users/profile/nda/upload', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData
    });
  }

  async removeNDA() {
    return this.request('/users/profile/nda', {
      method: 'DELETE'
    });
  }

  // Profile Data Download
  async downloadProfileData() {
    const response = await fetch(`${this.baseURL}/users/profile/download`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Download failed');
    }

    return response;
  }

  // Browser Permission Request
  async requestBrowserPermission(permission) {
    return this.request('/users/profile/notifications/app/request-permission', {
      method: 'POST',
      body: JSON.stringify({ permission })
    });
  }
}

const apiServiceInstance = new ApiService();
export default apiServiceInstance;
