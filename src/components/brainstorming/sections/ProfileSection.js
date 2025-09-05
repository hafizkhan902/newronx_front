import React, { useState, useEffect } from 'react';
import UserAvatar from '../../UserAvatar';
import AvatarUpload from '../../AvatarUpload';
import PublicProfile from './PublicProfile';
import ProfileService from '../../../utils/profileService';
import { useUser } from '../../../UserContext';
import MyIdeasSection from './MyIdeasSection';
import './profile.css';

function ProfileSection({ showMentorInterest, publicProfileUserId, onClosePublicProfile }) {
  const { user, setUser } = useUser(); // Use global user context
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  
  // State for public profile replacement (local state, used by MyIdeasSection)
  const [showingPublicProfile, setShowingPublicProfile] = useState(false);
  const [localPublicProfileUserId, setLocalPublicProfileUserId] = useState(null);

  // NDA Signings state
  const [ndaSignings, setNdaSignings] = useState([]);
  const [ndaSigningsLoading, setNdaSigningsLoading] = useState(false);
  const [showNDASignings, setShowNDASignings] = useState(false);

  // Function to handle avatar clicks from MyIdeasSection
  const handleShowPublicProfile = (userId) => {
    if (userId && String(userId) !== String(user?._id)) {
      setLocalPublicProfileUserId(userId);
      setShowingPublicProfile(true);
    }
  };

  // Function to close public profile and return to original profile
  const handleClosePublicProfile = () => {
    setShowingPublicProfile(false);
    setLocalPublicProfileUserId(null);
  };

  // Function to fetch NDA signings for user's ideas
  const fetchNDASignings = async () => {
    setNdaSigningsLoading(true);
    try {
      // Try different approaches to get user's ideas
      let ideas = [];
      
      // First try: Get all ideas from feed and filter by author
      try {
        const feedRes = await fetch(`/api/ideas/feed`, {
          credentials: 'include'
        });
        
        if (feedRes.ok) {
          const feedData = await feedRes.json();
          const feedIdeas = feedData.ideas || [];
          // Filter ideas by current user
          ideas = feedIdeas.filter(idea => idea.author._id === user._id);
        }
      } catch (err) {
        console.log('Feed approach failed, trying alternative...');
      }
      
      // If no ideas found, try direct approach with user ID
      if (ideas.length === 0) {
        try {
          const userIdeasRes = await fetch(`/api/ideas/user/${user._id}`, {
            credentials: 'include'
          });
          
          if (userIdeasRes.ok) {
            const userIdeasData = await userIdeasRes.json();
            ideas = userIdeasData.ideas || userIdeasData || [];
          }
        } catch (err) {
          console.log('User ideas approach failed');
        }
      }
      
      console.log('Found ideas:', ideas);
      
      // Fetch NDA signings for each idea that has NDA protection
      const allSignings = [];
      
      for (const idea of ideas) {
        if (idea.ndaProtection?.enabled) {
          try {
            const signingsRes = await fetch(`/api/ideas/${idea._id}/nda-signings`, {
              credentials: 'include'
            });
            
            if (signingsRes.ok) {
              const signingsData = await signingsRes.json();
              if (signingsData.ndaSignings && signingsData.ndaSignings.length > 0) {
                allSignings.push({
                  ideaId: idea._id,
                  ideaTitle: idea.title,
                  signings: signingsData.ndaSignings
                });
              }
            }
          } catch (err) {
            console.error(`Failed to fetch NDA signings for idea ${idea._id}:`, err);
          }
        }
      }
      
      setNdaSignings(allSignings);
    } catch (err) {
      console.error('Failed to fetch NDA signings:', err);
    } finally {
      setNdaSigningsLoading(false);
    }
  };

  // Load profile on component mount if user data is not available
  useEffect(() => {
    if (!user || !user._id) {
      console.log('[ProfileSection] No user data in context, loading profile...');
      loadProfile();
    } else {
      console.log('[ProfileSection] User data already available in context:', user);
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ProfileSection] Starting profile load...');
      
      const profileData = await ProfileService.getProfile();
      console.log('[ProfileSection] Profile loaded successfully:', profileData);
      
      // Ensure we have valid profile data
      if (!profileData || !profileData._id) {
        console.error('[ProfileSection] Invalid profile data received:', profileData);
        throw new Error('Invalid profile data received from server');
      }
      
      setUser(profileData);
      console.log('[ProfileSection] User context updated with profile data');
    } catch (err) {
      console.error('[ProfileSection] Failed to load profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Start editing
  const handleEdit = () => {
    setEditData({
      ...user,
      resumeUrl: user.resumeUrl !== undefined ? user.resumeUrl : user.resume || '',
      roles: user.roles !== undefined ? user.roles : user.interestedRoles || [],
      socialLinks: Array.isArray(user.socialLinks) ? user.socialLinks : [],
    });
    setEditing(true);
    setSaveError('');
    setSaveSuccess('');
  };

  // Cancel editing
  const handleCancel = () => {
    setEditing(false);
    setEditData(null);
    setSaveError('');
    setSaveSuccess('');
  };

  // Save profile (now used for status/avatar quick updates too)
  const handleQuickSave = async (updates) => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    
    try {
      // Validate the update data
      const validationErrors = ProfileService.validateProfileData(updates);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      console.log('[ProfileSection] Sending profile update payload:', updates);

      // Use ProfileService to update the profile
      const updatedProfile = await ProfileService.updateProfile(updates);
      
      // Update local state with the server response
      setUser(updatedProfile);
      
      // Update edit data if we're editing
      if (editing && editData) {
        setEditData({ ...editData, ...updates });
      }
      
      // Refresh profile data from backend to ensure consistency
      setTimeout(async () => {
        try {
          const refreshedProfile = await ProfileService.refreshProfile();
          setUser(refreshedProfile);
          console.log('[ProfileSection] Profile refreshed from backend:', refreshedProfile);
        } catch (err) {
          console.warn('[ProfileSection] Could not refresh profile:', err);
        }
      }, 500);
      
      // Show success message
      setSaveSuccess('Profile updated successfully!');
      setTimeout(() => setSaveSuccess(''), 3000);
      
      console.log('[ProfileSection] Profile updated successfully:', updatedProfile);
      
    } catch (err) {
      console.error('[ProfileSection] Profile update failed:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Status menu state
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusColors = {
    active: 'bg-green-500',
    busy: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };
  const statusLabels = {
    active: 'Active',
    busy: 'Busy',
    offline: 'Offline',
  };
  const currentStatus = (editing
    ? (editData && editData.status) || 'active'
    : (user && user.status) || 'active');

  // Handle avatar update from AvatarUpload component
  const handleAvatarChange = (newAvatarUrl) => {
    setUser(prev => ({
      ...prev,
      avatar: newAvatarUrl
    }));
  };

  // Handle status update from AvatarUpload component
  const handleStatusChange = (newStatus) => {
    setUser(prev => ({
      ...prev,
      status: newStatus
    }));
  };

  // Share profile (copy URL or use Web Share API)
  const handleShareProfile = async () => {
    try {
      const url = window.location.origin + '/';
      if (navigator.share) {
        await navigator.share({ title: 'My Profile', url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setSaveSuccess('Link copied to clipboard');
        setTimeout(() => setSaveSuccess(''), 2000);
      }
    } catch {}
  };

  // Helper to validate URL
  function isValidUrl(url) {
    if (!url) return true; // Allow empty
    try {
      // Accepts http, https, and common file links
      const u = new URL(url.startsWith('http') ? url : 'https://' + url);
      return /^https?:/.test(u.protocol);
    } catch {
      return false;
    }
  }

  // Validate all socialLinks values are valid URLs
  function allSocialLinksValid(socialLinks) {
    if (!Array.isArray(socialLinks)) return true;
    return socialLinks.every(link => !link.value || isValidUrl(link.value));
  }

  // Click-away for status/avatar menu
  const menuRef = React.useRef();
  useEffect(() => {
    if (!showStatusMenu) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowStatusMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showStatusMenu]);

  if (loading) return (
    <div className="max-w-xl mx-auto w-full bg-white p-8 border border-gray-200">
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent mx-auto mb-4"></div>
        <p className="text-sm font-medium text-gray-600">Loading profile...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="max-w-xl mx-auto w-full bg-white p-8 border border-gray-200">
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">❌</div>
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button 
          onClick={loadProfile} 
          className="mt-4 text-xs text-blue-600 hover:underline font-medium px-3 py-1 border border-blue-100 rounded"
        >
          Try Again
        </button>
      </div>
    </div>
  );
  if (!user) return null;

  // If showing public profile (either from props or local state), render it with close button
  const displayPublicProfileUserId = publicProfileUserId || (showingPublicProfile ? localPublicProfileUserId : null);
  if (displayPublicProfileUserId) {
    return (
      <div className="max-w-xl mx-auto w-full bg-white p-8 border border-gray-200 relative">
        {/* Back to Profile Button */}
        <button
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          onClick={() => {
            if (onClosePublicProfile) {
              onClosePublicProfile();
            } else {
              handleClosePublicProfile();
            }
          }}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Profile
        </button>
        <PublicProfile userId={displayPublicProfileUserId} />
      </div>
    );
  }

  const d = editing ? editData : user;
  
  // Add debugging for profile data structure
  console.log('[ProfileSection] Current profile data (d):', d);
  
  const resumeUrl = d?.resumeUrl || d?.resume || '';
  const fixedResumeUrl = resumeUrl
    ? (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://') ? resumeUrl : 'https://' + resumeUrl)
    : '';
  const resumeValid = isValidUrl(resumeUrl);
  const roles = d?.roles || d?.interestedRoles || [];
  const socialLinks = Array.isArray(d?.socialLinks) ? d.socialLinks : [];
  const socialLinksValid = allSocialLinksValid(socialLinks);
  const joinedText = d?.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null;
  const experiences = Array.isArray(d?.experience)
    ? d.experience
    : Array.isArray(d?.experiences)
    ? d.experiences
    : Array.isArray(d?.workExperience)
    ? d.workExperience
    : [];
  
  console.log('[ProfileSection] Processed profile fields:', {
    resumeUrl, roles, socialLinks, joinedText, experiences: experiences.length
  });

  function formatRange(start, end) {
    const fmt = (val) => {
      if (!val) return null;
      try {
        const dt = new Date(val);
        if (Number.isNaN(dt.getTime())) return String(val);
        return dt.toLocaleDateString('en-US', { year: 'numeric' });
      } catch {
        return String(val);
      }
    };
    const s = fmt(start);
    const e = end ? fmt(end) : 'Present';
    return [s, e].filter(Boolean).join(' - ');
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Top actions */}
      <div className="flex justify-between mb-3">
        <button 
          className="text-xs text-gray-500 hover:underline" 
          onClick={loadProfile}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Profile'}
        </button>
        <div className="flex">
        {editing ? (
          <>
            <button className="text-xs text-gray-500 hover:underline mr-2" onClick={handleCancel} disabled={saving}>Cancel</button>
            <button
              className="text-xs text-blue-600 hover:underline font-medium px-2 py-1 border border-blue-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                await handleQuickSave({
                  fullName: editData.fullName,
                  firstName: editData.firstName,
                  phone: editData.phone,
                  bio: editData.bio,
                  skills: editData.skills,
                  socialLinks: editData.socialLinks,
                  interestedRoles: editData.roles,
                  resume: editData.resumeUrl || editData.resume,
                  city: editData.city,
                  country: editData.country,
                });
                setEditing(false);
                setEditData(null);
              }}
              disabled={saving || !resumeValid || !socialLinksValid}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        ) : (
          <button className="text-xs text-blue-600 hover:underline font-medium px-2 py-1 border border-blue-100 rounded" onClick={handleEdit}>Edit Profile</button>
        )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left sidebar card */}
        <aside className="profile-card p-6 lg:col-span-1">
          <div className="flex items-center avatar gap-4 mb-3">
            {editing ? (
              <AvatarUpload
                onAvatarChange={handleAvatarChange}
                currentAvatar={user.avatar}
                currentStatus={user.status}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <UserAvatar userId={user._id} avatarUrl={user.avatar} size={64} isMentor={user.isMentor} isInvestor={user.isInvestor} />
            )}
            <div>
              {editing ? (
                <>
                  <input type="text" className="border border-gray-200 rounded px-2 py-1 text-sm mb-1 w-full" value={d.fullName || ''} onChange={e => setEditData({ ...editData, fullName: e.target.value })} placeholder="Full Name"/>
                  <input type="text" className="border border-gray-200 rounded px-2 py-1 text-sm w-full" value={d.firstName || ''} onChange={e => setEditData({ ...editData, firstName: e.target.value })} placeholder="First Name" />
                </>
              ) : (
                <>
                  <div className="text-base font-semibold text-gray-900">{d?.fullName || d?.name || 'No Name'}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span className={`w-2 h-2 rounded-full ${statusColors[currentStatus]}`}></span>
                    <span>{statusLabels[currentStatus]}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contact & meta */}
          <ul className="space-y-2 text-xs text-gray-600 mb-4">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z" fill="none"></path><path d="M22 6l-10 7L2 6" /></svg>
              {editing ? (
                <input type="email" className="border border-gray-200 rounded px-2 py-1 text-xs w-full" value={d.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value })} placeholder="Email"/>
              ) : (
                <span>{d?.email || 'No email'}</span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.12.81.3 1.6.54 2.35a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 5 5l1.73-1.09a2 2 0 0 1 2.11-.45c.75.24 1.54.42 2.35.54A2 2 0 0 1 22 16.92z"/></svg>
              {editing ? (
                <input type="text" className="border border-gray-200 rounded px-2 py-1 text-xs w-full" value={d.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} placeholder="Phone" />
              ) : (
                <span>{d?.phone || '—'}</span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {editing ? (
                <div className="flex gap-2 w-full">
                  <input type="text" className="border border-gray-200 rounded px-2 py-1 text-xs w-1/2" value={d.city || ''} onChange={e => setEditData({ ...editData, city: e.target.value })} placeholder="City" />
                  <input type="text" className="border border-gray-200 rounded px-2 py-1 text-xs w-1/2" value={d.country || ''} onChange={e => setEditData({ ...editData, country: e.target.value })} placeholder="Country" />
                </div>
              ) : (
                <span>{[d?.city, d?.country].filter(Boolean).join(', ') || '—'}</span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 0 0 2-2v-6H3v6a2 2 0 0 0 2 2z"/></svg>
              <span>Joined {joinedText || '—'}</span>
            </li>
          </ul>

          {/* Social icons */}
          {Array.isArray(socialLinks) && socialLinks.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-2">Social Links</div>
              <div className="flex items-center gap-3">
                {socialLinks.map((link, idx) => (
                  <a key={idx} href={link.value} target="_blank" rel="noopener noreferrer" className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] hover:bg-gray-200" title={link.type}>
                    {link.type?.[0] || '•'}
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right content */}
        <main className="lg:col-span-2 space-y-4">
          {/* Bio */}
          <div className="profile-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">About</h3>
              {editing && <button className="text-xs text-blue-600 hover:underline" onClick={() => setEditData({ ...editData, bio: '' })}>Clear</button>}
            </div>
            {editing ? (
              <textarea className="w-full border border-gray-200 rounded px-2 py-2 text-sm" value={d.bio || ''} onChange={e => setEditData({ ...editData, bio: e.target.value })} placeholder="Bio" rows={3} />
            ) : (
              <div className="text-sm text-gray-700">{d?.bio || '—'}</div>
            )}
          </div>

          {/* Skills */}
          <div className="profile-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Technical Skills</h3>
              {editing && <button className="text-xs text-blue-600 hover:underline" onClick={() => setEditData({ ...editData, skills: [] })}>Clear</button>}
            </div>
            <div className="flex flex-wrap gap-2">
              {(d?.skills || []).map((skill, idx) => (
                <span key={idx} className="profile-chip">{skill}</span>
              ))}
              {editing && (
                <input className="border border-gray-200 rounded px-2 py-1 text-xs" placeholder="Add skill" onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setEditData({ ...editData, skills: [...(d.skills || []), e.target.value.trim()] });
                    e.target.value = '';
                  }
                }} />
              )}
            </div>
          </div>

          {/* Interested Roles */}
          <div className="profile-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Interested Roles</h3>
              {editing && <button className="text-xs text-blue-600 hover:underline" onClick={() => setEditData({ ...editData, roles: [] })}>Clear</button>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roles.map((role, idx) => (
                <div key={idx} className="profile-tile">
                  {role}
                </div>
              ))}
              {editing && (
                <input className="border border-gray-200 rounded px-2 py-1 text-xs sm:col-span-2" placeholder="Add role and press Enter" onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setEditData({ ...editData, roles: [...roles, e.target.value.trim()] });
                    e.target.value = '';
                  }
                }} />
              )}
            </div>
          </div>

          {/* Experience Overview */}
          <div className="profile-card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Experience Overview</h3>
            <div className="space-y-5">
              {experiences.length > 0 ? (
                experiences.map((exp, idx) => (
                  <div key={idx}>
                    <div className="text-sm font-semibold text-gray-900">{exp.title || exp.role || '—'}</div>
                    <div className="text-[11px] text-gray-600 mb-1">
                      {(exp.company || exp.org || exp.organization || '—')} • {formatRange(exp.startDate || exp.start || exp.from, exp.endDate || exp.end || exp.to)}
                    </div>
                    {exp.summary && (
                      <div className="text-xs text-gray-700 leading-relaxed">
                        {exp.summary}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">No experience added yet.</div>
              )}
            </div>
          </div>

          {/* Documents & Actions */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Documents & Actions</h3>
            {editing ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Resume URL</label>
                <input 
                  type="url" 
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm" 
                  value={editData?.resumeUrl || editData?.resume || ''} 
                  onChange={e => setEditData({ ...editData, resumeUrl: e.target.value })} 
                  placeholder="https://example.com/my-resume.pdf" 
                />
                {!resumeValid && resumeUrl && (
                  <p className="text-xs text-red-500 mt-1">Please enter a valid URL</p>
                )}
              </div>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!editing && (
                <a href={fixedResumeUrl || '#'} target={fixedResumeUrl ? '_blank' : undefined} rel={fixedResumeUrl ? 'noopener noreferrer' : undefined} className={`flex items-center justify-center px-4 py-3 rounded profile-action-primary ${fixedResumeUrl ? '' : 'opacity-50 cursor-not-allowed'}`} onClick={e => { if (!fixedResumeUrl) e.preventDefault(); }}>
                  <span className="text-sm font-medium">Download Resume</span>
                </a>
              )}
              <button className="flex items-center justify-center px-4 py-3 rounded profile-action-secondary" onClick={() => setShowNDASignings(v => !v)}>
                <span className="text-sm font-medium">{showNDASignings ? 'Hide Agreements' : 'View Agreements'}</span>
              </button>
              <button className="flex items-center justify-center px-4 py-3 rounded profile-action-secondary" onClick={editing ? handleCancel : handleEdit}>
                <span className="text-sm font-medium">{editing ? 'Cancel Edit' : 'Edit Profile'}</span>
              </button>
              <button className="flex items-center justify-center px-4 py-3 rounded profile-action-secondary" onClick={handleShareProfile}>
                <span className="text-sm font-medium">Share Profile</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {saveSuccess && <div className="text-xs text-green-600 mt-4 bg-green-50 p-2 rounded">{saveSuccess}</div>}
      {saveError && <div className="text-xs text-red-600 mt-2">{saveError}</div>}

      {/* NDA Agreements Section - Minimal, Serious Design */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">NDA Agreements</h3>
            <p className="text-sm text-gray-500">Signed confidentiality agreements for your protected ideas</p>
          </div>
          <button
            onClick={() => {
              if (showNDASignings) {
                setShowNDASignings(false);
              } else {
                fetchNDASignings();
                setShowNDASignings(true);
              }
            }}
            className="text-xs text-blue-600 hover:underline font-medium px-2 py-1 border border-blue-100 rounded"
          >
            {showNDASignings ? 'Hide Agreements' : 'View Agreements'}
          </button>
        </div>
        {showNDASignings && (
          <div className="space-y-6">
            {ndaSigningsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent mx-auto mb-4"></div>
                <p className="text-sm font-medium text-gray-600">Loading NDA agreements...</p>
              </div>
            ) : ndaSignings.length > 0 ? (
              ndaSignings.map((ideaSignings) => (
                <div key={ideaSignings.ideaId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Idea Header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-semibold text-gray-900">{ideaSignings.ideaTitle}</h4>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">NDA</span>
                        </div>
                        <p className="text-xs text-gray-500">Protected by NDA</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium border border-gray-200">
                        {ideaSignings.signings.length} Agreement{ideaSignings.signings.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  {/* Signings List */}
                  <div className="divide-y divide-gray-100">
                    {ideaSignings.signings.map((signing, index) => (
                      <div key={index} className="px-5 py-5 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-base font-semibold text-gray-700">
                              {signing.signedBy.firstName?.[0] || signing.signedBy.fullName?.[0] || 'U'}
                            </div>
                            <div>
                              <div className="text-base font-semibold text-gray-900 mb-0.5">{signing.signedBy.fullName}</div>
                              <div className="text-sm text-gray-500 mb-1">{signing.signedBy.email}</div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {signing.formData.companyName && (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    {signing.formData.companyName}
                                  </span>
                                )}
                                {signing.formData.position && (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {signing.formData.position}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right min-w-[90px]">
                            <div className="text-xs text-gray-700 font-medium">
                              {new Date(signing.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(signing.signedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        {/* Signature Section */}
                        <div className="bg-gray-50 rounded border border-gray-200 px-4 py-3 mt-2 flex items-center gap-3">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Digital Signature</span>
                          <span className="ml-auto text-sm font-mono text-gray-900 bg-white px-3 py-1 rounded border border-gray-200">
                            {signing.formData.signature}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">No NDA Agreements Found</h4>
                <p className="text-sm text-gray-600 mb-1">You haven't received any signed NDA agreements yet.</p>
                <p className="text-xs text-gray-500">Agreements will appear here when users sign NDAs for your protected ideas.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* My Ideas Section */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <MyIdeasSection onShowPublicProfile={handleShowPublicProfile} />
      </div>
    </div>
  );
}

export default ProfileSection; 