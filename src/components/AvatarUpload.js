import React, { useState, useRef, useEffect } from 'react';
import ProfileService from '../utils/profileService';

const validateFile = (file) => {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload an image (JPEG, PNG, or GIF).');
  }

  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Maximum size is 5MB.');
  }
};

const statusColors = {
  active: 'border-green-500 bg-green-50',
  busy: 'border-yellow-500 bg-yellow-50',
  offline: 'border-gray-400 bg-gray-50'
};

const statusLabels = {
  active: 'Active',
  busy: 'Busy',
  offline: 'Offline'
};

const AvatarUpload = ({ onAvatarChange, currentAvatar, currentStatus = 'active', onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(currentAvatar);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef(null);

  // Close status menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setShowStatusMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
    }
    
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      validateFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setLoading(true);
      setError(null);

      console.log('[AvatarUpload] Starting avatar upload...');

      // Use ProfileService to upload avatar
      const result = await ProfileService.updateAvatar(file);
      
      console.log('[AvatarUpload] Avatar upload successful:', result);
      
      // Update the UI with the new avatar
      if (result.avatar) {
        const cacheBusted = `${result.avatar}${result.avatar.includes('?') ? '&' : '?'}t=${Date.now()}`;
        onAvatarChange(cacheBusted);
        setPreview(cacheBusted);
      }
      
      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      console.error('[AvatarUpload] Avatar upload failed:', err);
      setError(err.message || 'Failed to upload avatar');
      setPreview(currentAvatar);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      console.log('[AvatarUpload] Updating status to:', newStatus);

      // Use ProfileService to update status
      await ProfileService.updateStatus(newStatus);
      
      console.log('[AvatarUpload] Status updated successfully');
      
      // Update the parent component
      onStatusChange(newStatus);
      setShowStatusMenu(false);
    } catch (err) {
      console.error('[AvatarUpload] Status update failed:', err);
      setError('Failed to update status');
    }
  };

  return (
    <div className="relative w-28 h-28">
      <input
        type="file"
        id="avatar-input"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload avatar"
      />
      
      {/* Status Ring Container */}
      <div className="relative w-full h-full">
        {/* Outer Status Ring */}
        <div 
          className={`absolute inset-0 rounded-full cursor-pointer ${statusColors[currentStatus]} border-4 transition-colors duration-300 ease-in-out`}
          onClick={(e) => {
            e.stopPropagation();
            setShowStatusMenu(true);
          }}
          role="button"
          tabIndex={0}
          aria-label="Change status"
        />

        {/* Inner White Ring for spacing */}
        <div className="absolute inset-[3px] rounded-full bg-white border-2 border-white" />

        {/* Avatar Container */}
        <div 
          className={`absolute inset-[6px] rounded-full overflow-hidden cursor-pointer bg-gray-100 flex items-center justify-center transition-all duration-200 ${loading ? 'opacity-50' : 'hover:opacity-90'}`}
          onClick={() => !loading && document.getElementById('avatar-input').click()}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && document.getElementById('avatar-input').click()}
          aria-label="Click to change avatar"
        >
          {preview ? (
            <img 
              src={preview} 
              alt="Avatar preview" 
              className="w-full h-full object-cover"
              onError={() => {
                // console.error('Failed to load avatar:', preview);
                setPreview(null);
              }}
            />
          ) : (
            <div className="text-gray-400 text-sm">
              Upload
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>

        {/* Status Menu Dropdown */}
        {showStatusMenu && (
          <div 
            ref={statusMenuRef}
            className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg py-2 w-32 z-50"
          >
            {Object.entries(statusLabels).map(([status, label]) => (
              <button
                key={status}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 ${
                  status === currentStatus ? 'bg-gray-50' : ''
                }`}
                onClick={() => handleStatusChange(status)}
              >
                <span 
                  className={`w-2 h-2 rounded-full ${statusColors[status].replace('border-', 'bg-').split(' ')[0]}`}
                />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute -bottom-6 left-0 right-0 text-xs text-red-500 text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default AvatarUpload; 