import apiService from '../services/apiService';

// ProfileService - Centralized profile management
class ProfileService {
  static async getProfile() {
    try {
      const response = await apiService.getProfile();
      console.log('[ProfileService] Raw API response:', response);
      
      // Extract profile data from response - handle different response formats
      const profileData = response.data || response.user || response;
      console.log('[ProfileService] Extracted profile data:', profileData);
      
      // Normalize the profile data for frontend consumption
      const normalizedData = this.normalizeProfileData(profileData);
      console.log('[ProfileService] Normalized profile data:', normalizedData);
      
      return normalizedData;
    } catch (error) {
      console.error('ProfileService.getProfile error:', error);
      throw new Error('Failed to load profile');
    }
  }

  // Normalize profile data from backend format to frontend format
  static normalizeProfileData(profileData) {
    if (!profileData) return profileData;

    const normalized = { ...profileData };

    // Convert socialLinks from object format to array format for frontend
    if (normalized.socialLinks && typeof normalized.socialLinks === 'object' && !Array.isArray(normalized.socialLinks)) {
      const socialLinksArray = Object.entries(normalized.socialLinks)
        .filter(([type, url]) => url && url.trim())
        .map(([type, url]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
          value: url.trim()
        }));
      
      normalized.socialLinks = socialLinksArray;
    }

    // Ensure skills and roles are arrays
    if (normalized.skills && !Array.isArray(normalized.skills)) {
      if (typeof normalized.skills === 'string') {
        normalized.skills = normalized.skills.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        normalized.skills = [];
      }
    }

    if (normalized.interestedRoles && !Array.isArray(normalized.interestedRoles)) {
      if (typeof normalized.interestedRoles === 'string') {
        normalized.interestedRoles = normalized.interestedRoles.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        normalized.interestedRoles = [];
      }
    }

    return normalized;
  }

  static async updateProfile(updateData) {
    try {
      // Prepare data for submission - only include allowed fields
      const allowedFields = [
        'firstName', 'fullName', 'bio', 'skills', 'socialLinks', 
        'interestedRoles', 'resume', 'phone', 'city', 'country', 'status'
      ];

      const filteredData = {};
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined && updateData[field] !== null) {
          filteredData[field] = updateData[field];
        }
      });

      // Handle field name mapping (frontend to backend)
      if (updateData.name && !filteredData.fullName) {
        filteredData.fullName = updateData.name;
      }
      if (updateData.roles && !filteredData.interestedRoles) {
        filteredData.interestedRoles = updateData.roles;
      }
      if (updateData.resumeUrl && !filteredData.resume) {
        filteredData.resume = updateData.resumeUrl;
      }

      // Basic sanitization: drop empty strings and empty arrays
      const isEmpty = (v) => (
        v === undefined || v === null || 
        (typeof v === 'string' && v.trim() === '') || 
        (Array.isArray(v) && v.length === 0)
      );

      Object.entries(filteredData).forEach(([k, v]) => {
        if (isEmpty(v)) delete filteredData[k];
      });

      // Social links: convert from array format to object format for backend
      if (Array.isArray(filteredData.socialLinks)) {
        console.log('[ProfileService] Converting socialLinks from array to object format');
        console.log('[ProfileService] Original socialLinks:', filteredData.socialLinks);
        
        // Convert from [{type: 'linkedin', value: 'url'}] to {linkedin: 'url'}
        const socialLinksObject = {};
        filteredData.socialLinks.forEach(link => {
          if (link && link.type && link.value) {
            socialLinksObject[link.type.toLowerCase()] = link.value.trim();
          }
        });
        
        if (Object.keys(socialLinksObject).length > 0) {
          filteredData.socialLinks = socialLinksObject;
          console.log('[ProfileService] Converted socialLinks:', filteredData.socialLinks);
        } else {
          delete filteredData.socialLinks;
          console.log('[ProfileService] No valid socialLinks, removed from payload');
        }
      }

      console.log('[ProfileService] Final payload:', filteredData);

      // Validate the payload before sending
      const validationResult = this.validateUpdatePayload(filteredData);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      const result = await apiService.updateProfile(filteredData);
      console.log('[ProfileService] Profile update successful:', result);
      return result;
    } catch (error) {
      console.error('ProfileService.updateProfile error:', error);
      throw error;
    }
  }

  static async updateAvatar(file) {
    try {
      console.log('[ProfileService] Uploading avatar...');
      const result = await apiService.uploadAvatar(file);
      console.log('[ProfileService] Avatar upload successful:', result);
      return result;
    } catch (error) {
      console.error('ProfileService.updateAvatar error:', error);
      throw error;
    }
  }

  static async updateStatus(status) {
    try {
      const result = await apiService.updateProfile({ status });
      console.log('[ProfileService] Status update successful:', result);
      return result;
    } catch (error) {
      console.error('ProfileService.updateStatus error:', error);
      throw error;
    }
  }

  static async updateField(field, value) {
    try {
      const updateData = { [field]: value };
      return await this.updateProfile(updateData);
    } catch (error) {
      console.error(`ProfileService.updateField error for ${field}:`, error);
      throw error;
    }
  }

  static async updateMultipleFields(fields) {
    try {
      return await this.updateProfile(fields);
    } catch (error) {
      console.error('ProfileService.updateMultipleFields error:', error);
      throw error;
    }
  }

  static async refreshProfile() {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh profile: ${response.status}`);
      }

      const data = await response.json();
      const profileData = data.data || data.user || data;
      
      // Normalize the profile data for frontend consumption
      return this.normalizeProfileData(profileData);
    } catch (error) {
      console.error('ProfileService.refreshProfile error:', error);
      throw new Error('Failed to refresh profile');
    }
  }

  static validateProfileData(data) {
    const errors = [];

    // Validate social links (support both array and object formats)
    if (data.socialLinks) {
      if (Array.isArray(data.socialLinks)) {
        // Array format: [{type: 'linkedin', value: 'url'}]
        data.socialLinks.forEach((link, index) => {
          if (!link.type || !link.value) {
            errors.push(`Social link ${index + 1} must have both type and value`);
          } else if (link.value && !this.isValidUrl(link.value)) {
            errors.push(`Social link ${index + 1} must be a valid URL`);
          }
        });
      } else if (typeof data.socialLinks === 'object') {
        // Object format: {linkedin: 'url', github: 'url'}
        Object.entries(data.socialLinks).forEach(([type, url]) => {
          if (url && !this.isValidUrl(url)) {
            errors.push(`${type} URL must be valid`);
          }
        });
      } else {
        errors.push('Social links must be an array or object');
      }
    }

    // Validate resume URL
    if (data.resume && !this.isValidUrl(data.resume)) {
      errors.push('Resume must be a valid URL');
    }

    // Validate skills and roles are arrays
    if (data.skills && !Array.isArray(data.skills)) {
      errors.push('Skills must be an array');
    }
    if (data.interestedRoles && !Array.isArray(data.interestedRoles)) {
      errors.push('Interested roles must be an array');
    }

    // Validate string lengths
    if (data.bio && data.bio.length > 500) {
      errors.push('Bio must be 500 characters or less');
    }
    if (data.fullName && data.fullName.length > 100) {
      errors.push('Full name must be 100 characters or less');
    }
    if (data.firstName && data.firstName.length > 50) {
      errors.push('First name must be 50 characters or less');
    }

    return errors;
  }

  static isValidUrl(url) {
    if (!url) return true; // Allow empty
    try {
      const u = new URL(url.startsWith('http') ? url : 'https://' + url);
      return /^https?:/.test(u.protocol);
    } catch {
      return false;
    }
  }

  // Validate the final update payload structure
  static validateUpdatePayload(payload) {
    const errors = [];

    // Check required field types
    if (payload.firstName && typeof payload.firstName !== 'string') {
      errors.push('firstName must be a string');
    }
    if (payload.fullName && typeof payload.fullName !== 'string') {
      errors.push('fullName must be a string');
    }
    if (payload.bio && typeof payload.bio !== 'string') {
      errors.push('bio must be a string');
    }
    if (payload.phone && typeof payload.phone !== 'string') {
      errors.push('phone must be a string');
    }
    if (payload.city && typeof payload.city !== 'string') {
      errors.push('city must be a string');
    }
    if (payload.country && typeof payload.country !== 'string') {
      errors.push('country must be a string');
    }
    if (payload.resume && typeof payload.resume !== 'string') {
      errors.push('resume must be a string');
    }

    // Check array fields
    if (payload.skills && !Array.isArray(payload.skills)) {
      errors.push('skills must be an array');
    }
    if (payload.interestedRoles && !Array.isArray(payload.interestedRoles)) {
      errors.push('interestedRoles must be an array');
    }

    // Check socialLinks format
    if (payload.socialLinks) {
      if (typeof payload.socialLinks !== 'object' || Array.isArray(payload.socialLinks)) {
        errors.push('socialLinks must be an object with key-value pairs');
      } else {
        // Validate each social link URL
        Object.entries(payload.socialLinks).forEach(([type, url]) => {
          if (typeof url !== 'string' || !this.isValidUrl(url)) {
            errors.push(`${type} URL must be a valid URL string`);
          }
        });
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Test method for debugging profile retrieval
  static async testProfileGet() {
    try {
      console.log('[ProfileService] Testing profile GET request...');
      
      const response = await fetch('/api/users/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[ProfileService] Test GET response status:', response.status);
      console.log('[ProfileService] Test GET response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json().catch(() => ({}));
      console.log('[ProfileService] Test GET response data:', data);
      
      return {
        success: response.ok,
        status: response.status,
        data: data
      };
    } catch (error) {
      console.error('[ProfileService] Test GET error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test method for debugging profile updates
  static async testProfileUpdate(testData = {}) {
    try {
      console.log('[ProfileService] Testing profile update with:', testData);
      
      // Send minimal test data
      const testPayload = {
        bio: testData.bio || 'Test bio update',
        ...testData
      };
      
      console.log('[ProfileService] Test payload:', testPayload);
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });
      
      console.log('[ProfileService] Test response status:', response.status);
      console.log('[ProfileService] Test response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json().catch(() => ({}));
      console.log('[ProfileService] Test response data:', data);
      
      return {
        success: response.ok,
        status: response.status,
        data: data
      };
    } catch (error) {
      console.error('[ProfileService] Test update error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default ProfileService;
