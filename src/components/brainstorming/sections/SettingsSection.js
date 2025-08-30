import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../../../UserContext';
import { useTheme } from '../../../ThemeContext';
import apiService from '../../../services/apiService';

const settingsSections = [
  { key: 'profile', label: 'Profile & Account' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'theme', label: 'Theme' },
  { key: 'account', label: 'Account Management' },
];

function SettingsSection() {
  const { user, setUser } = useUser();
  const { theme, updateTheme } = useTheme();
  const [openSection, setOpenSection] = useState('profile');
  
  // Profile & Account states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password modal states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Email modal states
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  // Roles modal states
  const [isInvestor, setIsInvestor] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [experience, setExperience] = useState('');
  const [investmentFocus, setInvestmentFocus] = useState([]);
  const [mentorshipAreas, setMentorshipAreas] = useState([]);

  // Privacy states
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showNDAModal, setShowNDAModal] = useState(false);
  const [showNDAGenerateModal, setShowNDAGenerateModal] = useState(false);
  const [showNDAUploadModal, setShowNDAUploadModal] = useState(false);
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileProtection: false,
    profileVisibility: 'public',
    allowMessages: true,
    showEmail: true,
    showPhone: false
  });
  
  // NDA settings
  const [ndaSettings, setNdaSettings] = useState({
    hasNDA: false,
    ndaType: 'none',
    ndaFile: '',
    ndaGeneratedContent: '',
    ideaProtection: false
  });

  // NDA generation states
  const [ndaCompanyName, setNdaCompanyName] = useState('');
  const [ndaProjectName, setNdaProjectName] = useState('');
  const [ndaProtectionScope, setNdaProtectionScope] = useState('');
  const [ndaFile, setNdaFile] = useState(null);

  // Notification states
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showTestNotificationModal, setShowTestNotificationModal] = useState(false);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      enabled: true,
      preferences: {
        messages: true,
        ideaCollaboration: false,
        comments: true,
        likes: false,
        groupChats: true,
        connectionRequests: true,
        weeklyDigest: true
      }
    },
    app: {
      enabled: true,
      browserPermission: 'default',
      preferences: {
        messages: true,
        ideaCollaboration: false,
        comments: true,
        likes: false,
        groupChats: true,
        connectionRequests: false
      }
    }
  });

  // Animation state for open section
  const contentRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState(0);
  
  useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight);
    }
  }, [openSection]);

  // Load user roles and privacy settings on component mount
  useEffect(() => {
    // Debug: Check what methods are available on apiService
    console.log('[SettingsSection] apiService methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(apiService)));
    console.log('[SettingsSection] apiService.getPrivacySettings:', typeof apiService.getPrivacySettings);
    console.log('[SettingsSection] apiService.getNotificationSettings:', typeof apiService.getNotificationSettings);
    console.log('[SettingsSection] apiService.getThemeSettings:', typeof apiService.getThemeSettings);
    
    loadAllSettings();
  }, [user]);

  // Load all settings in parallel
  const loadAllSettings = async () => {
    try {
      console.log('[SettingsSection] Loading all settings...');
      await Promise.all([
        loadPrivacySettings(),
        loadNotificationSettings(),
        loadThemeSettings()
      ]);
      console.log('[SettingsSection] All settings loaded successfully');
    } catch (error) {
      console.error('[SettingsSection] Failed to load all settings:', error);
    }
  };

  // Load privacy settings from API (using API service)
  const loadPrivacySettings = async () => {
    try {
      if (typeof apiService.getPrivacySettings === 'function') {
        const data = await apiService.getPrivacySettings();
        setPrivacySettings(data.privacy || data || {});
        setNdaSettings(data.nda || {});
      } else {
        console.warn('[SettingsSection] getPrivacySettings method not available, using fallback');
        // Fallback to direct fetch
        const response = await fetch('/api/users/profile/privacy', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          setPrivacySettings(data.privacy || data || {});
          setNdaSettings(data.nda || {});
        }
      }
    } catch (err) {
      console.error('Failed to load privacy settings:', err);
    }
  };

  // Load notification settings from API (using API service)
  const loadNotificationSettings = async () => {
    try {
      if (typeof apiService.getNotificationSettings === 'function') {
        const data = await apiService.getNotificationSettings();
        setNotificationSettings(data.notifications || data || notificationSettings);
      } else {
        console.warn('[SettingsSection] getNotificationSettings method not available, using fallback');
        // Fallback to direct fetch
        const response = await fetch('/api/users/profile/notifications', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          setNotificationSettings(data.notifications || data || notificationSettings);
        }
      }
    } catch (err) {
      console.error('Failed to load notification settings:', err);
    }
  };

  // Load theme settings from API (using API service)
  const loadThemeSettings = async () => {
    try {
      console.log('🔄 Loading theme settings from API...');
      if (typeof apiService.getThemeSettings === 'function') {
        const data = await apiService.getThemeSettings();
        console.log('✅ Loaded theme data:', data);
        const userTheme = data.theme?.mode || 'light';
        updateTheme(userTheme);
      } else {
        console.warn('[SettingsSection] getThemeSettings method not available, using fallback');
        // Fallback to direct fetch
        const response = await fetch('/api/users/profile/theme', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Loaded theme data (fallback):', data);
          const userTheme = data.theme?.mode || 'light';
          updateTheme(userTheme);
        }
      }
    } catch (err) {
      console.error('❌ Failed to load theme settings:', err);
    }
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Check if user is still authenticated
  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.error('[Settings] Authentication check failed:', response.status, response.statusText);
        setError('Authentication failed. Please log in again.');
        return false;
      }
      
      console.log('[Settings] Authentication check passed');
      setSuccess('Authentication check passed. User is still logged in.');
      return true;
    } catch (err) {
      console.error('[Settings] Authentication check error:', err);
      setError('Authentication check failed. Please log in again.');
      return false;
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    console.log('[Settings] Starting password change...');
    console.log('[Settings] Current cookies:', document.cookie);
    console.log('[Settings] User context:', user);

    if (!currentPassword || !currentPassword.trim()) {
      setError('Current password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Check authentication first
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      // Get fresh profile to ensure token is still valid
      console.log('[Settings] Getting fresh profile to ensure token validity...');
      try {
        const profileResponse = await fetch('/api/users/profile', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('[Settings] Fresh profile retrieved successfully');
        } else {
          console.error('[Settings] Failed to get fresh profile:', profileResponse.status);
        }
      } catch (err) {
        console.error('[Settings] Error getting fresh profile:', err);
      }

      // Optional re-auth to refresh session cookie using current password
      if (user?.email) {
        console.log('[Settings] Re-authenticating before password update...');
        try {
          const reauthRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            cache: 'no-store',
            body: JSON.stringify({ email: user.email, password: (currentPassword || '').trim() })
          });
          if (!reauthRes.ok) {
            let msg = 'Re-authentication failed. Please check your current password.';
            try { const jd = await reauthRes.json(); msg = jd.message || msg; } catch {}
            console.warn('[Settings] Re-authentication failed:', msg);
          } else {
            console.log('[Settings] Re-authentication successful.');
          }
        } catch (reauthErr) {
          console.warn('[Settings] Re-authentication error:', reauthErr);
        }
      } else {
        console.warn('[Settings] Skipping re-auth: user email not available in context');
      }

      const payload = {
        currentPassword: (currentPassword || '').trim(),
        newPassword: (newPassword || '').trim(),
      };

      console.log('[Settings] Submitting password change payload (PUT /api/users/profile/password):', payload);
      console.log('[Settings] Request details:', {
        method: 'PUT',
        url: '/api/users/profile/password',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });

      // Debug: Check what cookies are being sent
      console.log('[Settings] Cookies being sent:', document.cookie);
      console.log('[Settings] All cookies:', document.cookie.split(';').map(c => c.trim()));

      // Try PUT first, if it fails, try PATCH
      let response = await fetch('/api/users/profile/password', {
        method: 'PUT',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // If PUT fails, try PATCH
      if (!response.ok && response.status === 405) {
        console.log('[Settings] PUT method not allowed, trying PATCH...');
        response = await fetch('/api/users/profile/password', {
          method: 'PATCH',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      // If still failing with token error, try with Authorization header
      if (!response.ok && response.status === 401) {
        console.log('[Settings] Token error, trying with Authorization header...');
        // Extract token from cookies
        const tokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          const token = tokenCookie.split('=')[1];
          console.log('[Settings] Found token in cookies:', token ? 'Yes' : 'No');
          
          response = await fetch('/api/users/profile/password', {
            method: 'PUT',
            credentials: 'include',
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
        }
      }

      if (response.ok) {
        setSuccess('Password updated successfully');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        let data = {};
        try { data = await response.json(); } catch {}
        console.error('[Settings] Password change failed:', response.status, data);
        console.error('[Settings] Full response:', response);
        console.error('[Settings] Response headers:', Object.fromEntries(response.headers.entries()));
        const firstError = Array.isArray(data.errors) && data.errors.length > 0 ? (data.errors[0].msg || data.errors[0].message) : '';
        setError(firstError || data.message || `Password change failed (${response.status})`);
      }
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle email change
  const handleEmailChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await apiService.updateEmail({
        email: newEmail,
        password: emailPassword
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Email updated successfully');
        setUser(prev => ({ ...prev, email: newEmail }));
        setShowEmailModal(false);
        setNewEmail('');
        setEmailPassword('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update email');
      }
    } catch (err) {
      setError('Failed to update email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle roles update
  const handleRolesUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Normalize arrays to backend-accepted formats (comma-strings)
      const toList = (v) => {
        if (!v) return '';
        if (Array.isArray(v)) return v.join(',');
        try { const parsed = JSON.parse(v); if (Array.isArray(parsed)) return parsed.join(','); } catch {}
        return String(v);
      };

      const payload = {
        isInvestor: String(!!isInvestor), // backend accepts boolean-like strings
        isMentor: String(!!isMentor),
        company: company || undefined,
        position: position || undefined,
        experience: experience ? String(experience) : undefined,
        investmentFocus: toList(investmentFocus) || undefined,
        mentorshipAreas: toList(mentorshipAreas) || undefined
      };
      // Remove undefined keys so we only send provided fields
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      console.log('[SettingsSection] Sending roles payload:', payload);

      const response = await apiService.updateRoles(payload);

      if (response.ok) {
        const data = await response.json();
        setSuccess('Roles updated successfully');
        setUser(prev => ({ ...prev, ...data.user }));
        setShowRolesModal(false);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update roles');
      }
    } catch (err) {
      setError('Failed to update roles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle privacy settings update
  const handlePrivacyUpdate = async (settings) => {
    try {
      const response = await apiService.updatePrivacySettings(settings);

      if (response.ok) {
        const data = await response.json();
        setPrivacySettings(data.privacy);
        setSuccess('Privacy settings updated successfully');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update privacy settings');
      }
    } catch (err) {
      setError('Failed to update privacy settings. Please try again.');
    }
  };

  // Handle individual privacy setting toggle
  const handlePrivacyToggle = async (setting, value) => {
    const newSettings = { ...privacySettings, [setting]: value };
    setPrivacySettings(newSettings);
    
    // Show brief loading state
    setLoading(true);
    await handlePrivacyUpdate(newSettings);
    setLoading(false);
  };

  // Handle NDA generation
  const handleNDAGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await apiService.generateNDA({
        companyName: ndaCompanyName,
        projectName: ndaProjectName,
        protectionScope: ndaProtectionScope
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('NDA generated successfully');
        setNdaSettings(data.nda);
        setShowNDAGenerateModal(false);
        setNdaCompanyName('');
        setNdaProjectName('');
        setNdaProtectionScope('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to generate NDA');
      }
    } catch (err) {
      setError('Failed to generate NDA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle NDA upload
  const handleNDAUpload = async (e) => {
    e.preventDefault();
    if (!ndaFile) {
      setError('Please select a PDF file');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('nda', ndaFile);

      const response = await fetch('/api/users/profile/nda/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('NDA uploaded successfully');
        setNdaSettings(data.nda);
        setShowNDAUploadModal(false);
        setNdaFile(null);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to upload NDA');
      }
    } catch (err) {
      setError('Failed to upload NDA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle NDA removal
  const handleNDARemove = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.removeNDA();

      if (response.ok) {
        const data = await response.json();
        setSuccess('NDA removed successfully');
        setNdaSettings(data.nda);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to remove NDA');
      }
    } catch (err) {
      setError('Failed to remove NDA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle email notification settings update
  const handleEmailNotificationUpdate = async (settings) => {
    try {
      const response = await apiService.updateEmailNotificationSettings(settings);

      if (response.ok) {
        const data = await response.json();
        setNotificationSettings(prev => ({ ...prev, email: data.email }));
        setSuccess('Email notification settings updated successfully');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update email notifications');
      }
    } catch (err) {
      setError('Failed to update email notifications. Please try again.');
    }
  };

  // Handle app notification settings update
  const handleAppNotificationUpdate = async (settings) => {
    try {
      const response = await apiService.updateAppNotificationSettings(settings);

      if (response.ok) {
        const data = await response.json();
        setNotificationSettings(prev => ({ ...prev, app: data.app }));
        setSuccess('App notification settings updated successfully');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update app notifications');
      }
    } catch (err) {
      setError('Failed to update app notifications. Please try again.');
    }
  };

  // Handle browser permission request
  const handleBrowserPermissionRequest = async () => {
    if (!('Notification' in window)) {
      setError('Browser notifications are not supported');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      const response = await apiService.requestBrowserPermission(permission);

      if (response.ok) {
        const data = await response.json();
        setNotificationSettings(prev => ({ ...prev, app: data.app }));
        setSuccess('Browser notification permission updated successfully');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update browser permission');
      }
    } catch (err) {
      setError('Failed to request browser permission. Please try again.');
    }
  };

  // Handle test notification
  const handleTestNotification = async (type) => {
    try {
      const response = await apiService.sendTestNotification(type);

      if (response.ok) {
        const data = await response.json();
        setSuccess(`${type === 'email' ? 'Email' : 'App'} test notification sent successfully`);
        setShowTestNotificationModal(false);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to send test notification');
      }
    } catch (err) {
      setError('Failed to send test notification. Please try again.');
    }
  };

  // Handle individual notification preference toggle
  const handleNotificationToggle = async (type, setting, value) => {
    const newSettings = {
      ...notificationSettings[type],
      preferences: {
        ...notificationSettings[type].preferences,
        [setting]: value
      }
    };

    setNotificationSettings(prev => ({
      ...prev,
      [type]: newSettings
    }));

    if (type === 'email') {
      await handleEmailNotificationUpdate(newSettings);
    } else {
      await handleAppNotificationUpdate(newSettings);
    }
  };

  // Handle notification type toggle (email/app enabled)
  const handleNotificationTypeToggle = async (type, enabled) => {
    const newSettings = {
      ...notificationSettings[type],
      enabled
    };

    setNotificationSettings(prev => ({
      ...prev,
      [type]: newSettings
    }));

    if (type === 'email') {
      await handleEmailNotificationUpdate(newSettings);
    } else {
      if (enabled) {
        await handleBrowserPermissionRequest();
      } else {
        await handleAppNotificationUpdate(newSettings);
      }
    }
  };

  // Handle profile data download
  const handleDownloadProfileData = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔄 Downloading profile data (CSV format)...');
      
      // Use fetch via CRA proxy to ensure cookies are included
      const response = await fetch('/api/users/profile/download', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'text/csv'
        }
      });
      
      if (response.ok) {
        // Get filename from response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'profile-data.csv';
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ Profile data downloaded successfully as CSV!');
        setSuccess('Profile data downloaded successfully! Your data is now saved as a CSV file.');
      } else {
        const errorText = await response.text();
        console.log('❌ Download error:', errorText);
        setError('Failed to download profile data. Please try again.');
      }
    } catch (err) {
      console.log('❌ Download exception:', err);
      setError('Failed to download profile data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle theme toggle
  const handleThemeToggle = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    console.log('🔄 Toggling theme to:', newTheme);
    console.log('🔄 API URL will be:', `/api/users/profile/theme/mode`);
    
    // Apply theme immediately for better UX
    updateTheme(newTheme);
    
    try {
      const response = await apiService.updateThemeMode(newTheme);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Theme API response:', data);
        setSuccess('Theme updated successfully');
      } else {
        const data = await response.json();
        console.log('❌ Theme API error:', data);
        setError(data.message || 'Failed to update theme');
        // Revert on error
        updateTheme(theme);
      }
    } catch (err) {
      console.log('❌ Theme API exception:', err);
      setError('Failed to update theme. Please try again.');
      // Revert on error
      updateTheme(theme);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full pt-8">
      <h2 className="text-lg font-normal text-gray-800 mb-8 tracking-tight font-sans lowercase">settings</h2>
      
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-xs">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {settingsSections.map(section => (
          <div key={section.key}>
            <button
              className={`w-full text-left py-3 font-normal text-base tracking-tight font-sans text-gray-800 focus:outline-none ${openSection === section.key ? '' : 'text-gray-400'}`}
              style={{ borderBottom: openSection === section.key ? '1.5px solid #222' : '1px solid #e5e7eb', background: 'none' }}
              onClick={() => setOpenSection(openSection === section.key ? '' : section.key)}
            >
              {section.label.toLowerCase()}
            </button>
            <div
              ref={openSection === section.key ? contentRef : null}
              style={{
                maxHeight: openSection === section.key ? maxHeight : 0,
                overflow: 'hidden',
                transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
              }}
              aria-hidden={openSection !== section.key}
            >
              <div className="pl-8 pr-4 py-4 text-xs font-sans text-gray-700">
                {openSection === section.key && section.key === 'profile' && (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">Email address</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{user?.email}</span>
                        <button 
                          className="text-xs text-blue-600 underline" 
                          onClick={() => setShowEmailModal(true)}
                        >
                          Change
                        </button>
                      </div>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">Password</span>
                      <button 
                        className="text-xs text-blue-600 underline" 
                        onClick={() => setShowPasswordModal(true)}
                      >
                        Change
                      </button>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">Investor/Mentor Roles</span>
                      <button 
                        className="text-xs text-blue-600 underline" 
                        onClick={() => setShowRolesModal(true)}
                      >
                        {isInvestor || isMentor ? 'Edit' : 'Set'}
                      </button>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">Delete account</span>
                      <button className="text-xs text-red-600 underline">Delete</button>
                    </div>
                  </>
                )}
                {openSection === section.key && section.key === 'privacy' && (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">Profile protection</span>
                      <button
                        className={`text-xs font-semibold ${privacySettings.profileProtection ? 'text-green-700' : 'text-gray-400'} underline ${loading ? 'opacity-50' : ''}`}
                        onClick={() => handlePrivacyToggle('profileProtection', !privacySettings.profileProtection)}
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : (privacySettings.profileProtection ? 'Enabled' : 'Disabled')}
                      </button>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">Profile visibility</span>
                      <button
                        className="text-xs font-semibold text-blue-600 underline"
                        onClick={() => setShowPrivacyModal(true)}
                      >
                        {privacySettings.profileVisibility === 'public' ? 'Public' : 
                         privacySettings.profileVisibility === 'connections' ? 'Connections' : 'Private'}
                      </button>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">Allow messages</span>
                      <button
                        className={`text-xs font-semibold ${privacySettings.allowMessages ? 'text-green-700' : 'text-gray-400'} underline ${loading ? 'opacity-50' : ''}`}
                        onClick={() => handlePrivacyToggle('allowMessages', !privacySettings.allowMessages)}
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : (privacySettings.allowMessages ? 'Everyone' : 'None')}
                      </button>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">Show email</span>
                      <button
                        className={`text-xs font-semibold ${privacySettings.showEmail ? 'text-green-700' : 'text-gray-400'} underline ${loading ? 'opacity-50' : ''}`}
                        onClick={() => handlePrivacyToggle('showEmail', !privacySettings.showEmail)}
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : (privacySettings.showEmail ? 'Yes' : 'No')}
                      </button>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">Show phone</span>
                      <button
                        className={`text-xs font-semibold ${privacySettings.showPhone ? 'text-green-700' : 'text-gray-400'} underline ${loading ? 'opacity-50' : ''}`}
                        onClick={() => handlePrivacyToggle('showPhone', !privacySettings.showPhone)}
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : (privacySettings.showPhone ? 'Yes' : 'No')}
                      </button>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">NDA protection</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${ndaSettings.hasNDA ? 'text-green-700' : 'text-gray-400'}`}>
                          {ndaSettings.hasNDA ? 'Active' : 'None'}
                        </span>
                        <button
                          className="text-xs text-blue-600 underline"
                          onClick={() => setShowNDAModal(true)}
                        >
                          {ndaSettings.hasNDA ? 'Manage' : 'Setup'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {openSection === section.key && section.key === 'notifications' && (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">Email notifications</span>
                      <button
                        className={`text-xs font-semibold ${notificationSettings.email.enabled ? 'text-green-700' : 'text-gray-400'} underline ${loading ? 'opacity-50' : ''}`}
                        onClick={() => handleNotificationTypeToggle('email', !notificationSettings.email.enabled)}
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : (notificationSettings.email.enabled ? 'Enabled' : 'Disabled')}
                      </button>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">App notifications</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${notificationSettings.app.enabled ? 'text-green-700' : 'text-gray-400'}`}>
                          {notificationSettings.app.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      <button
                          className={`text-xs font-semibold ${notificationSettings.app.enabled ? 'text-green-700' : 'text-gray-400'} underline ${loading ? 'opacity-50' : ''}`}
                          onClick={() => handleNotificationTypeToggle('app', !notificationSettings.app.enabled)}
                          disabled={loading}
                      >
                          {loading ? 'Updating...' : (notificationSettings.app.enabled ? 'Disable' : 'Enable')}
                      </button>
                      </div>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">Browser permission</span>
                      <span className={`text-xs ${notificationSettings.app.browserPermission === 'granted' ? 'text-green-700' : notificationSettings.app.browserPermission === 'denied' ? 'text-red-600' : 'text-gray-400'}`}>
                        {notificationSettings.app.browserPermission === 'granted' ? 'Granted' : 
                         notificationSettings.app.browserPermission === 'denied' ? 'Denied' : 'Not requested'}
                      </span>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">Notification preferences</span>
                      <button
                        className="text-xs text-blue-600 underline"
                        onClick={() => setShowNotificationModal(true)}
                      >
                        Manage
                      </button>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">Test notifications</span>
                      <button
                        className="text-xs text-blue-600 underline"
                        onClick={() => setShowTestNotificationModal(true)}
                      >
                        Send test
                      </button>
                    </div>
                  </>
                )}

                {openSection === section.key && section.key === 'theme' && (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold">Theme</span>
                      <button
                        className={`text-xs font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-gray-400'} underline ${loading ? 'opacity-50' : ''}`}
                        onClick={handleThemeToggle}
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : (theme === 'light' ? 'Light' : 'Dark')}
                      </button>
                    </div>
                  </>
                )}
                {openSection === section.key && section.key === 'account' && (
                  <>
                    <div className="mb-6">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="font-semibold">Download your data</span>
                        <button 
                          className={`text-xs font-semibold text-blue-600 underline ${loading ? 'opacity-50' : ''}`}
                          onClick={handleDownloadProfileData}
                          disabled={loading}
                        >
                          {loading ? 'Downloading...' : 'Download CSV'}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 pl-0">
                        <p className="mb-2">Get a complete copy of all your profile data in a secure CSV format.</p>
                        <div className="text-xs text-gray-400">
                          <p className="mb-1">✅ Includes: Personal info, ideas, settings, statistics</p>
                          <p className="mb-1">✅ Secure: No internal structure exposure</p>
                          <p className="mb-1">✅ Readable: Opens in Excel, Google Sheets, or any text editor</p>
                          <p>✅ GDPR compliant: Complete data portability</p>
                        </div>
                      </div>
                    </div>

                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <form
            onSubmit={handlePasswordChange}
            className="bg-white border border-gray-200 rounded shadow-2xl p-8 w-full max-w-sm relative animate-modal-fade-in"
          >
            <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowPasswordModal(false)} aria-label="Close">&times;</button>
            <h3 className="text-base font-semibold mb-6 text-gray-900 text-center">Change Password</h3>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Current Password</label>
              <input type="password" className="w-full border border-gray-200 rounded px-3 py-2 focus:border-blue-500 focus:outline-none transition text-xs" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">New Password</label>
              <input type="password" className="w-full border border-gray-200 rounded px-3 py-2 focus:border-blue-500 focus:outline-none transition text-xs" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Confirm New Password</label>
              <input type="password" className="w-full border border-gray-200 rounded px-3 py-2 focus:border-blue-500 focus:outline-none transition text-xs" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="bg-gray-100 text-gray-700 px-5 py-2 rounded font-semibold hover:bg-gray-200 transition text-xs" onClick={() => setShowPasswordModal(false)}>Cancel</button>
              <button type="submit" disabled={loading} className="bg-blue-600 text-white px-5 py-2 rounded font-semibold hover:bg-blue-700 transition text-xs disabled:opacity-50">
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <form
            onSubmit={handleEmailChange}
            className="bg-white border border-gray-200 rounded shadow-2xl p-8 w-full max-w-sm relative animate-modal-fade-in"
          >
            <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowEmailModal(false)} aria-label="Close">&times;</button>
            <h3 className="text-base font-semibold mb-6 text-gray-900 text-center">Change Email</h3>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">New Email</label>
              <input type="email" className="w-full border border-gray-200 rounded px-3 py-2 focus:border-blue-500 focus:outline-none transition text-xs" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
            </div>
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Current Password</label>
              <input type="password" className="w-full border border-gray-200 rounded px-3 py-2 focus:border-blue-500 focus:outline-none transition text-xs" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} required />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="bg-gray-100 text-gray-700 px-5 py-2 rounded font-semibold hover:bg-gray-200 transition text-xs" onClick={() => setShowEmailModal(false)}>Cancel</button>
              <button type="submit" disabled={loading} className="bg-blue-600 text-white px-5 py-2 rounded font-semibold hover:bg-blue-700 transition text-xs disabled:opacity-50">
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roles Modal */}
      {showRolesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <form
            onSubmit={handleRolesUpdate}
            className="bg-white border border-gray-200 rounded shadow-2xl p-8 w-full max-w-md relative animate-modal-fade-in max-h-[90vh] overflow-y-auto"
          >
            <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowRolesModal(false)} aria-label="Close">&times;</button>
            <h3 className="text-base font-semibold mb-6 text-gray-900 text-center">Investor/Mentor Roles</h3>
            
            <div className="mb-4">
              <label className="flex items-center gap-2 text-xs text-gray-700 font-semibold">
                <input type="checkbox" checked={isInvestor} onChange={e => setIsInvestor(e.target.checked)} className="rounded" />
                Mark as Investor
              </label>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center gap-2 text-xs text-gray-700 font-semibold">
                <input type="checkbox" checked={isMentor} onChange={e => setIsMentor(e.target.checked)} className="rounded" />
                Mark as Mentor
              </label>
            </div>

            {(isInvestor || isMentor) && (
              <>
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1 font-semibold">Company</label>
                  <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 focus:border-blue-500 focus:outline-none transition text-xs" value={company} onChange={e => setCompany(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1 font-semibold">Position</label>
                  <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 focus:border-blue-500 focus:outline-none transition text-xs" value={position} onChange={e => setPosition(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1 font-semibold">Experience</label>
                  <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 focus:border-blue-500 focus:outline-none transition text-xs" value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g., 10+ years in tech investments" />
                </div>
              </>
            )}

            {isInvestor && (
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Investment Focus (comma-separated)</label>
                <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 focus:border-blue-500 focus:outline-none transition text-xs" value={investmentFocus.join(', ')} onChange={e => setInvestmentFocus(e.target.value.split(',').map(s => s.trim()).filter(s => s))} placeholder="e.g., AI, FinTech, EdTech" />
              </div>
            )}

            {isMentor && (
              <div className="mb-6">
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Mentorship Areas (comma-separated)</label>
                <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 focus:border-blue-500 focus:outline-none transition text-xs" value={mentorshipAreas.join(', ')} onChange={e => setMentorshipAreas(e.target.value.split(',').map(s => s.trim()).filter(s => s))} placeholder="e.g., Business Strategy, Product Development" />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button type="button" className="bg-gray-100 text-gray-700 px-5 py-2 rounded font-semibold hover:bg-gray-200 transition text-xs" onClick={() => setShowRolesModal(false)}>Cancel</button>
              <button type="submit" disabled={loading} className="bg-blue-600 text-white px-5 py-2 rounded font-semibold hover:bg-blue-700 transition text-xs disabled:opacity-50">
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Privacy Settings Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded shadow-2xl p-8 w-full max-w-md relative animate-modal-fade-in">
            <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowPrivacyModal(false)} aria-label="Close">&times;</button>
            <h3 className="text-base font-semibold mb-6 text-gray-900 text-center">Profile Visibility</h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-xs text-gray-700">
                <input 
                  type="radio" 
                  name="visibility" 
                  value="public"
                  checked={privacySettings.profileVisibility === 'public'}
                  onChange={(e) => handlePrivacyToggle('profileVisibility', e.target.value)}
                  className="rounded"
                />
                <div>
                  <div className="font-semibold">Public</div>
                  <div className="text-gray-500">Visible to everyone</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 text-xs text-gray-700">
                <input 
                  type="radio" 
                  name="visibility" 
                  value="connections"
                  checked={privacySettings.profileVisibility === 'connections'}
                  onChange={(e) => handlePrivacyToggle('profileVisibility', e.target.value)}
                  className="rounded"
                />
                <div>
                  <div className="font-semibold">Connections</div>
                  <div className="text-gray-500">Only visible to connected users</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 text-xs text-gray-700">
                <input 
                  type="radio" 
                  name="visibility" 
                  value="private"
                  checked={privacySettings.profileVisibility === 'private'}
                  onChange={(e) => handlePrivacyToggle('profileVisibility', e.target.value)}
                  className="rounded"
                />
                <div>
                  <div className="font-semibold">Private</div>
                  <div className="text-gray-500">Only visible to you</div>
                </div>
              </label>
            </div>

            <div className="flex justify-end mt-6">
              <button type="button" className="bg-gray-100 text-gray-700 px-5 py-2 rounded font-semibold hover:bg-gray-200 transition text-xs" onClick={() => setShowPrivacyModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* NDA Management Modal */}
      {showNDAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded shadow-2xl p-8 w-full max-w-md relative animate-modal-fade-in">
            <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowNDAModal(false)} aria-label="Close">&times;</button>
            <h3 className="text-base font-semibold mb-6 text-gray-900 text-center">NDA Protection</h3>
            
            {ndaSettings.hasNDA ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <div className="text-xs font-semibold text-green-800 mb-2">NDA Active</div>
                  <div className="text-xs text-green-700">
                    {ndaSettings.ndaType === 'uploaded' ? 'Uploaded PDF' : 'Generated Document'}
                  </div>
                  {ndaSettings.ndaFile && (
                    <a href={ndaSettings.ndaFile} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mt-2 inline-block">
                      View NDA Document
                    </a>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={handleNDARemove}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition text-xs disabled:opacity-50"
                  >
                    {loading ? 'Removing...' : 'Remove NDA'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                  <div className="text-xs font-semibold text-gray-800 mb-2">No NDA Protection</div>
                  <div className="text-xs text-gray-700">
                    Set up NDA protection for your ideas and confidential information.
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowNDAModal(false); setShowNDAGenerateModal(true); }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition text-xs"
                  >
                    Generate NDA
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowNDAModal(false); setShowNDAUploadModal(true); }}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded font-semibold hover:bg-gray-700 transition text-xs"
                  >
                    Upload NDA
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button type="button" className="bg-gray-100 text-gray-700 px-5 py-2 rounded font-semibold hover:bg-gray-200 transition text-xs" onClick={() => setShowNDAModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* NDA Generation Modal */}
      {showNDAGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <form onSubmit={handleNDAGenerate} className="bg-white border border-gray-200 rounded shadow-2xl p-8 w-full max-w-md relative animate-modal-fade-in">
            <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowNDAGenerateModal(false)} aria-label="Close">&times;</button>
            <h3 className="text-base font-semibold mb-6 text-gray-900 text-center">Generate Custom NDA</h3>
            
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Company Name</label>
              <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 focus:border-blue-500 focus:outline-none transition text-xs" value={ndaCompanyName} onChange={e => setNdaCompanyName(e.target.value)} required />
            </div>
            
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Project Name</label>
              <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 focus:border-blue-500 focus:outline-none transition text-xs" value={ndaProjectName} onChange={e => setNdaProjectName(e.target.value)} required />
            </div>
            
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Protection Scope</label>
              <textarea className="w-full border border-gray-200 rounded px-3 py-2 focus:border-blue-500 focus:outline-none transition text-xs" rows="3" value={ndaProtectionScope} onChange={e => setNdaProtectionScope(e.target.value)} placeholder="e.g., all technical specifications, algorithms, and business strategies" required />
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" className="bg-gray-100 text-gray-700 px-5 py-2 rounded font-semibold hover:bg-gray-200 transition text-xs" onClick={() => setShowNDAGenerateModal(false)}>Cancel</button>
              <button type="submit" disabled={loading} className="bg-blue-600 text-white px-5 py-2 rounded font-semibold hover:bg-blue-700 transition text-xs disabled:opacity-50">
                {loading ? 'Generating...' : 'Generate NDA'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NDA Upload Modal */}
      {showNDAUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <form onSubmit={handleNDAUpload} className="bg-white border border-gray-200 rounded shadow-2xl p-8 w-full max-w-md relative animate-modal-fade-in">
            <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowNDAUploadModal(false)} aria-label="Close">&times;</button>
            <h3 className="text-base font-semibold mb-6 text-gray-900 text-center">Upload NDA Document</h3>
            
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Select PDF File</label>
              <input 
                type="file" 
                accept=".pdf"
                onChange={(e) => setNdaFile(e.target.files[0])}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:border-blue-500 focus:outline-none transition text-xs" 
                required 
              />
              <div className="text-xs text-gray-500 mt-1">Only PDF files are allowed</div>
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" className="bg-gray-100 text-gray-700 px-5 py-2 rounded font-semibold hover:bg-gray-200 transition text-xs" onClick={() => setShowNDAUploadModal(false)}>Cancel</button>
              <button type="submit" disabled={loading || !ndaFile} className="bg-blue-600 text-white px-5 py-2 rounded font-semibold hover:bg-blue-700 transition text-xs disabled:opacity-50">
                {loading ? 'Uploading...' : 'Upload NDA'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notification Preferences Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded shadow-2xl p-8 w-full max-w-2xl relative animate-modal-fade-in max-h-[90vh] overflow-y-auto">
            <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowNotificationModal(false)} aria-label="Close">&times;</button>
            <h3 className="text-base font-semibold mb-6 text-gray-900 text-center">Notification Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Email Notifications */}
              <div>
                <h4 className="text-sm font-semibold mb-4 text-gray-800">Email Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between text-xs text-gray-700">
                    <span>Messages</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.email.preferences.messages}
                      onChange={(e) => handleNotificationToggle('email', 'messages', e.target.checked)}
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-gray-700">
                    <span>Idea Collaboration</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.email.preferences.ideaCollaboration}
                      onChange={(e) => handleNotificationToggle('email', 'ideaCollaboration', e.target.checked)}
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-gray-700">
                    <span>Comments</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.email.preferences.comments}
                      onChange={(e) => handleNotificationToggle('email', 'comments', e.target.checked)}
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-gray-700">
                    <span>Likes</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.email.preferences.likes}
                      onChange={(e) => handleNotificationToggle('email', 'likes', e.target.checked)}
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-gray-700">
                    <span>Group Chats</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.email.preferences.groupChats}
                      onChange={(e) => handleNotificationToggle('email', 'groupChats', e.target.checked)}
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-gray-700">
                    <span>Connection Requests</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.email.preferences.connectionRequests}
                      onChange={(e) => handleNotificationToggle('email', 'connectionRequests', e.target.checked)}
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-gray-700">
                    <span>Weekly Digest</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.email.preferences.weeklyDigest}
                      onChange={(e) => handleNotificationToggle('email', 'weeklyDigest', e.target.checked)}
                      className="rounded"
                    />
                  </label>
                </div>
              </div>

              {/* App Notifications */}
              <div>
                <h4 className="text-sm font-semibold mb-4 text-gray-800">App Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between text-xs text-gray-700">
                    <span>Messages</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.app.preferences.messages}
                      onChange={(e) => handleNotificationToggle('app', 'messages', e.target.checked)}
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-gray-700">
                    <span>Idea Collaboration</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.app.preferences.ideaCollaboration}
                      onChange={(e) => handleNotificationToggle('app', 'ideaCollaboration', e.target.checked)}
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-gray-700">
                    <span>Comments</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.app.preferences.comments}
                      onChange={(e) => handleNotificationToggle('app', 'comments', e.target.checked)}
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-gray-700">
                    <span>Likes</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.app.preferences.likes}
                      onChange={(e) => handleNotificationToggle('app', 'likes', e.target.checked)}
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-gray-700">
                    <span>Group Chats</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.app.preferences.groupChats}
                      onChange={(e) => handleNotificationToggle('app', 'groupChats', e.target.checked)}
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-gray-700">
                    <span>Connection Requests</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.app.preferences.connectionRequests}
                      onChange={(e) => handleNotificationToggle('app', 'connectionRequests', e.target.checked)}
                      className="rounded"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button type="button" className="bg-gray-100 text-gray-700 px-5 py-2 rounded font-semibold hover:bg-gray-200 transition text-xs" onClick={() => setShowNotificationModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Test Notification Modal */}
      {showTestNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded shadow-2xl p-8 w-full max-w-md relative animate-modal-fade-in">
            <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowTestNotificationModal(false)} aria-label="Close">&times;</button>
            <h3 className="text-base font-semibold mb-6 text-gray-900 text-center">Send Test Notification</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="text-xs font-semibold text-blue-800 mb-2">Test Notifications</div>
                <div className="text-xs text-blue-700">
                  Send a test notification to verify your settings are working correctly.
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => handleTestNotification('email')}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition text-xs disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Test Email'}
                </button>
                <button 
                  type="button" 
                  onClick={() => handleTestNotification('app')}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition text-xs disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Test App'}
                </button>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button type="button" className="bg-gray-100 text-gray-700 px-5 py-2 rounded font-semibold hover:bg-gray-200 transition text-xs" onClick={() => setShowTestNotificationModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 flex">
        <button
          className="flex items-center gap-2 text-xs text-red-700 hover:text-red-900 font-medium pl-1 transition"
          style={{ outline: 'none', background: 'none', border: 'none' }}
          onClick={async () => {
            try {
              await apiService.logout();
              window.location.href = '/';
            } catch (err) {
              alert('Logout failed');
            }
          }}
          aria-label="Log out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"/></svg>
          log out
        </button>
      </div>
    </div>
  );
}

export default SettingsSection; 