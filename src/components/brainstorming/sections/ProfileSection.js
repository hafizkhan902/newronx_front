import React, { useState, useEffect } from 'react';
import AvatarUpload from '../../AvatarUpload';
import PublicProfile from './PublicProfile';
import ProfileService from '../../../utils/profileService';
import { useUser } from '../../../UserContext';
import { useTheme } from '../../../ThemeContext';
import apiService from '../../../services/apiService';
import MyIdeasSection from './MyIdeasSection';

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { key: 'profile',       label: 'Profile' },
  { key: 'account',       label: 'Account' },
  { key: 'roles',         label: 'Roles' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'billing',       label: 'Billing' },
  { key: 'integrations',  label: 'Integrations' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function calcCompletion(u) {
  if (!u) return 0;
  const checks = [!!u.fullName, !!u.email, !!u.bio, !!u.avatar,
    !!(u.skills?.length), !!(Array.isArray(u.socialLinks) && u.socialLinks.length)];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// Toggle switch component
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
    </button>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const cardCls = 'bg-white border border-gray-200 rounded-2xl p-6 shadow-sm';

// ── Main component ─────────────────────────────────────────────────────────────
function ProfileSection({ publicProfileUserId, onClosePublicProfile }) {
  const { user, setUser } = useUser();
  const { theme, updateTheme } = useTheme();

  // ── Profile tab state ──────────────────────────────────────────────────────
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [editData,     setEditData]     = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState('');
  const [saveSuccess,  setSaveSuccess]  = useState('');
  const [isEditing,    setIsEditing]    = useState(false);
  const [activeTab,    setActiveTab]    = useState('profile');

  // Public-profile viewer
  const [showingPublicProfile,    setShowingPublicProfile]    = useState(false);
  const [localPublicProfileUserId, setLocalPublicProfileUserId] = useState(null);

  // NDA signings (profile tab)
  const [ndaSignings,        setNdaSignings]        = useState([]);
  const [ndaSigningsLoading, setNdaSigningsLoading] = useState(false);
  const [showNDASignings,    setShowNDASignings]    = useState(false);

  // ── Account tab state ──────────────────────────────────────────────────────
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError,   setSettingsError]   = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword,   setCurrentPassword]   = useState('');
  const [newPassword,       setNewPassword]       = useState('');
  const [confirmPassword,   setConfirmPassword]   = useState('');

  // Email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail,       setNewEmail]       = useState('');
  const [emailPassword,  setEmailPassword]  = useState('');

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileProtection: false, profileVisibility: 'public',
    allowMessages: true, showEmail: true, showPhone: false,
  });

  // NDA management (account tab)
  const [ndaSettings,          setNdaSettings]          = useState({ hasNDA: false, ndaType: 'none', ndaFile: '', ndaGeneratedContent: '', ideaProtection: false });
  const [showNDAGenerateModal, setShowNDAGenerateModal] = useState(false);
  const [showNDAUploadModal,   setShowNDAUploadModal]   = useState(false);
  const [ndaCompanyName,       setNdaCompanyName]       = useState('');
  const [ndaProjectName,       setNdaProjectName]       = useState('');
  const [ndaProtectionScope,   setNdaProtectionScope]   = useState('');
  const [ndaUploadFile,        setNdaUploadFile]        = useState(null);

  // ── Roles tab state ────────────────────────────────────────────────────────
  const [rolesSaving,      setRolesSaving]      = useState(false);
  const [isInvestor,       setIsInvestor]       = useState(false);
  const [isMentor,         setIsMentor]         = useState(false);
  const [roleCompany,      setRoleCompany]      = useState('');
  const [rolePosition,     setRolePosition]     = useState('');
  const [roleExperience,   setRoleExperience]   = useState('');
  const [investmentFocus,  setInvestmentFocus]  = useState([]);
  const [mentorshipAreas,  setMentorshipAreas]  = useState([]);

  // ── Notifications tab state ────────────────────────────────────────────────
  const [notificationSettings, setNotificationSettings] = useState({
    email: { enabled: true, preferences: { messages: true, ideaCollaboration: false, comments: true, likes: false, groupChats: true, connectionRequests: true, weeklyDigest: true } },
    app:   { enabled: true, browserPermission: 'default', preferences: { messages: true, ideaCollaboration: false, comments: true, likes: false, groupChats: true, connectionRequests: false } },
  });

  // ── Load all settings on mount ─────────────────────────────────────────────
  useEffect(() => {
    loadAllSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seed roles state from user context
  useEffect(() => {
    if (user) {
      setIsInvestor(!!user.isInvestor);
      setIsMentor(!!user.isMentor);
      setRoleCompany(user.company || '');
      setRolePosition(user.position || '');
      setRoleExperience(user.experience || '');
      setInvestmentFocus(Array.isArray(user.investmentFocus) ? user.investmentFocus : []);
      setMentorshipAreas(Array.isArray(user.mentorshipAreas) ? user.mentorshipAreas : []);
    }
  }, [user]);

  const loadAllSettings = async () => {
    try {
      await Promise.all([loadPrivacySettings(), loadNotificationSettings(), loadThemeSettings()]);
    } catch {}
  };

  const loadPrivacySettings = async () => {
    try {
      let data;
      if (typeof apiService.getPrivacySettings === 'function') {
        data = await apiService.getPrivacySettings();
      } else {
        const r = await fetch('/api/users/profile/privacy', { credentials: 'include', cache: 'no-store' });
        if (r.ok) data = await r.json();
      }
      if (data) { setPrivacySettings(data.privacy || data || {}); setNdaSettings(data.nda || {}); }
    } catch {}
  };

  const loadNotificationSettings = async () => {
    try {
      let data;
      if (typeof apiService.getNotificationSettings === 'function') {
        data = await apiService.getNotificationSettings();
      } else {
        const r = await fetch('/api/users/profile/notifications', { credentials: 'include', cache: 'no-store' });
        if (r.ok) data = await r.json();
      }
      if (data) setNotificationSettings(prev => data.notifications || data || prev);
    } catch {}
  };

  const loadThemeSettings = async () => {
    try {
      let data;
      if (typeof apiService.getThemeSettings === 'function') {
        data = await apiService.getThemeSettings();
      } else {
        const r = await fetch('/api/users/profile/theme', { credentials: 'include', cache: 'no-store' });
        if (r.ok) data = await r.json();
      }
      if (data) updateTheme(data.theme?.mode || 'light');
    } catch {}
  };

  // ── Profile load ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !user._id) loadProfile();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user) {
      setEditData({
        ...user,
        resumeUrl: user.resumeUrl !== undefined ? user.resumeUrl : user.resume || '',
        roles: user.roles !== undefined ? user.roles : user.interestedRoles || [],
        socialLinks: Array.isArray(user.socialLinks) ? user.socialLinks : [],
      });
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true); setError(null);
      const data = await ProfileService.getProfile();
      if (!data?._id) throw new Error('Invalid profile data');
      setUser(data);
    } catch (err) { setError(err.message || 'Failed to load profile'); }
    finally { setLoading(false); }
  };

  // ── Profile save ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editData) return;
    setSaving(true); setSaveError(''); setSaveSuccess('');
    try {
      const payload = {
        fullName: editData.fullName, firstName: editData.firstName,
        phone: editData.phone, bio: editData.bio, skills: editData.skills,
        socialLinks: editData.socialLinks, interestedRoles: editData.roles,
        resume: editData.resumeUrl || editData.resume,
        city: editData.city, country: editData.country,
        jobTitle: editData.jobTitle, company: editData.company,
      };
      const errs = ProfileService.validateProfileData(payload);
      if (errs.length) throw new Error(errs.join(', '));
      const updated = await ProfileService.updateProfile(payload);
      setUser(updated);
      setSaveSuccess('Profile updated!');
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(''), 3000);
      setTimeout(async () => { try { setUser(await ProfileService.refreshProfile()); } catch {} }, 500);
    } catch (err) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (user) setEditData({ ...user, resumeUrl: user.resumeUrl ?? user.resume ?? '', roles: user.roles ?? user.interestedRoles ?? [], socialLinks: Array.isArray(user.socialLinks) ? user.socialLinks : [] });
    setIsEditing(false); setSaveError(''); setSaveSuccess('');
  };

  // ── Avatar / status ────────────────────────────────────────────────────────
  const handleAvatarChange  = (url)    => setUser(p => ({ ...p, avatar: url }));
  const handleStatusChange  = (status) => setUser(p => ({ ...p, status }));

  // ── Settings helper ────────────────────────────────────────────────────────
  const flashSettings = (msg, isError = false) => {
    if (isError) { setSettingsError(msg); setTimeout(() => setSettingsError(''), 4000); }
    else          { setSettingsSuccess(msg); setTimeout(() => setSettingsSuccess(''), 3000); }
  };

  // ── Password change ────────────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword.trim())          return flashSettings('Current password is required', true);
    if (newPassword !== confirmPassword)  return flashSettings('Passwords do not match', true);
    if (newPassword.length < 6)           return flashSettings('New password must be at least 6 characters', true);
    if (newPassword === currentPassword)  return flashSettings('New password must differ from current', true);
    setSettingsLoading(true);
    try {
      if (user?.email) {
        try { await fetch('/api/auth/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: currentPassword.trim() }) }); } catch {}
      }
      const payload = { currentPassword: currentPassword.trim(), newPassword: newPassword.trim() };
      let res = await fetch('/api/users/profile/password', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok && res.status === 405) res = await fetch('/api/users/profile/password', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        flashSettings('Password updated successfully');
        setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        const d = await res.json().catch(() => ({}));
        const msg = (Array.isArray(d.errors) && d.errors[0]?.msg) || d.message || `Failed (${res.status})`;
        flashSettings(msg, true);
      }
    } catch { flashSettings('Failed to update password', true); }
    finally { setSettingsLoading(false); }
  };

  // ── Email change ───────────────────────────────────────────────────────────
  const handleEmailChange = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const data = await apiService.updateEmail({ email: newEmail, password: emailPassword });
      setUser(p => ({ ...p, email: data.email || newEmail }));
      flashSettings('Email updated successfully');
      setShowEmailModal(false); setNewEmail(''); setEmailPassword('');
    } catch { flashSettings('Failed to update email', true); }
    finally { setSettingsLoading(false); }
  };

  // ── Roles save ─────────────────────────────────────────────────────────────
  const handleRolesSave = async () => {
    setRolesSaving(true);
    try {
      const toList = (v) => Array.isArray(v) ? v.join(',') : String(v || '');
      const payload = {
        isInvestor: String(!!isInvestor), isMentor: String(!!isMentor),
        ...(roleCompany    && { company:          roleCompany }),
        ...(rolePosition   && { position:         rolePosition }),
        ...(roleExperience && { experience:       String(roleExperience) }),
        ...((isInvestor && investmentFocus.length)  && { investmentFocus:  toList(investmentFocus) }),
        ...((isMentor   && mentorshipAreas.length)  && { mentorshipAreas:  toList(mentorshipAreas) }),
      };
      const res = await apiService.updateRoles(payload);
      if (res.ok) {
        const d = await res.json();
        setUser(p => ({ ...p, ...d.user }));
        flashSettings('Roles updated successfully');
      } else {
        const d = await res.json().catch(() => ({}));
        flashSettings(d.message || 'Failed to update roles', true);
      }
    } catch { flashSettings('Failed to update roles', true); }
    finally { setRolesSaving(false); }
  };

  // ── Privacy helpers ────────────────────────────────────────────────────────
  const handlePrivacyToggle = async (key, value) => {
    const next = { ...privacySettings, [key]: value };
    setPrivacySettings(next);
    setSettingsLoading(true);
    try {
      const res = await apiService.updatePrivacySettings(next);
      if (!res.ok) { const d = await res.json().catch(()=>({})); flashSettings(d.message || 'Failed to update privacy', true); }
    } catch { flashSettings('Failed to update privacy', true); }
    finally { setSettingsLoading(false); }
  };

  // ── NDA helpers ────────────────────────────────────────────────────────────
  const handleNDAGenerate = async (e) => {
    e.preventDefault(); setSettingsLoading(true);
    try {
      await apiService.generateNDA({ companyName: ndaCompanyName, projectName: ndaProjectName, protectionScope: ndaProtectionScope });
      flashSettings('NDA generated successfully');
      await loadPrivacySettings();
      setShowNDAGenerateModal(false); setNdaCompanyName(''); setNdaProjectName(''); setNdaProtectionScope('');
    } catch { flashSettings('Failed to generate NDA', true); }
    finally { setSettingsLoading(false); }
  };

  const handleNDAUpload = async (e) => {
    e.preventDefault();
    if (!ndaUploadFile) return flashSettings('Please select a PDF file', true);
    setSettingsLoading(true);
    try {
      const fd = new FormData(); fd.append('nda', ndaUploadFile);
      const res = await fetch('/api/users/profile/nda/upload', { method: 'POST', credentials: 'include', body: fd });
      if (res.ok) {
        const d = await res.json(); setNdaSettings(d.nda);
        flashSettings('NDA uploaded successfully');
        setShowNDAUploadModal(false); setNdaUploadFile(null);
      } else { const d = await res.json().catch(()=>({})); flashSettings(d.message || 'Upload failed', true); }
    } catch { flashSettings('Failed to upload NDA', true); }
    finally { setSettingsLoading(false); }
  };

  const handleNDARemove = async () => {
    setSettingsLoading(true);
    try { await apiService.removeNDA(); await loadPrivacySettings(); flashSettings('NDA removed'); }
    catch { flashSettings('Failed to remove NDA', true); }
    finally { setSettingsLoading(false); }
  };

  // ── Notification helpers ───────────────────────────────────────────────────
  const updateEmailNotifs = async (settings) => {
    try {
      const res = await apiService.updateEmailNotificationSettings(settings);
      if (res.ok) { const d = await res.json(); setNotificationSettings(p => ({ ...p, email: d.email })); }
    } catch {}
  };
  const updateAppNotifs = async (settings) => {
    try {
      const res = await apiService.updateAppNotificationSettings(settings);
      if (res.ok) { const d = await res.json(); setNotificationSettings(p => ({ ...p, app: d.app })); }
    } catch {}
  };

  const handleNotifTypeToggle = async (type, enabled) => {
    const next = { ...notificationSettings[type], enabled };
    setNotificationSettings(p => ({ ...p, [type]: next }));
    if (type === 'email') await updateEmailNotifs(next);
    else {
      if (enabled && 'Notification' in window) {
        try { const perm = await Notification.requestPermission(); await apiService.requestBrowserPermission(perm); }
        catch {}
      } else await updateAppNotifs(next);
    }
  };

  const handleNotifPrefToggle = async (type, key, value) => {
    const next = { ...notificationSettings[type], preferences: { ...notificationSettings[type].preferences, [key]: value } };
    setNotificationSettings(p => ({ ...p, [type]: next }));
    if (type === 'email') await updateEmailNotifs(next);
    else await updateAppNotifs(next);
  };

  const handleTestNotif = async (type) => {
    try {
      const res = await apiService.sendTestNotification(type);
      if (res.ok) flashSettings(`${type === 'email' ? 'Email' : 'App'} test notification sent`);
    } catch { flashSettings('Failed to send test notification', true); }
  };

  // ── Theme ──────────────────────────────────────────────────────────────────
  const handleThemeToggle = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    updateTheme(next);
    try {
      const res = await apiService.updateThemeMode(next);
      if (!res.ok) { updateTheme(theme); flashSettings('Failed to update theme', true); }
    } catch { updateTheme(theme); }
  };

  // ── Download data ──────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/users/profile/download', { credentials: 'include', headers: { 'Content-Type': 'text/csv' } });
      if (res.ok) {
        const cd = res.headers.get('Content-Disposition');
        const fn = cd?.match(/filename="(.+)"/)?.[1] || 'profile-data.csv';
        const url = URL.createObjectURL(await res.blob());
        const a = document.createElement('a'); a.href = url; a.download = fn; a.style.display = 'none';
        document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); document.body.removeChild(a);
        flashSettings('Profile data downloaded');
      } else flashSettings('Download failed', true);
    } catch { flashSettings('Download failed', true); }
    finally { setSettingsLoading(false); }
  };

  // ── NDA signings fetch (profile tab) ──────────────────────────────────────
  const fetchNDASignings = async () => {
    setNdaSigningsLoading(true);
    try {
      let ideas = [];
      try { const r = await fetch('/api/ideas/feed', { credentials: 'include' }); if (r.ok) { const d = await r.json(); ideas = (d.ideas || []).filter(i => i.author._id === user._id); } } catch {}
      if (!ideas.length) { try { const r = await fetch(`/api/ideas/user/${user._id}`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); ideas = d.ideas || d || []; } } catch {} }
      const all = [];
      for (const idea of ideas) {
        if (idea.ndaProtection?.enabled) {
          try { const r = await fetch(`/api/ideas/${idea._id}/nda-signings`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); if (d.ndaSignings?.length) all.push({ ideaId: idea._id, ideaTitle: idea.title, signings: d.ndaSignings }); } } catch {}
        }
      }
      setNdaSignings(all);
    } catch {} finally { setNdaSigningsLoading(false); }
  };

  // ── Url validation ─────────────────────────────────────────────────────────
  function isValidUrl(url) {
    if (!url) return true;
    try { const u = new URL(url.startsWith('http') ? url : 'https://' + url); return /^https?:/.test(u.protocol); } catch { return false; }
  }

  function formatRange(s, e) {
    const fmt = v => { try { const d = new Date(v); return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-US',{year:'numeric'}); } catch { return String(v); } };
    return [s ? fmt(s) : null, e ? fmt(e) : 'Present'].filter(Boolean).join(' – ');
  }

  // ── Public profile helpers ─────────────────────────────────────────────────
  const handleShowPublicProfile = (userId) => {
    if (userId && String(userId) !== String(user?._id)) { setLocalPublicProfileUserId(userId); setShowingPublicProfile(true); }
  };
  const handleCloseLocalPublicProfile = () => { setShowingPublicProfile(false); setLocalPublicProfileUserId(null); };

  // ── Early returns ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="animate-spin rounded-full h-9 w-9 border-2 border-blue-500 border-t-transparent mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading profile…</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button onClick={loadProfile} className="text-xs text-blue-600 border border-blue-200 rounded px-3 py-1.5 hover:bg-blue-50">Try Again</button>
      </div>
    </div>
  );
  if (!user) return null;

  const displayPublicProfileUserId = publicProfileUserId || (showingPublicProfile ? localPublicProfileUserId : null);
  if (displayPublicProfileUserId) return (
    <div className="w-full">
      <button className="mb-5 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition"
        onClick={() => { if (onClosePublicProfile) onClosePublicProfile(); else handleCloseLocalPublicProfile(); }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        Back to My Profile
      </button>
      <PublicProfile userId={displayPublicProfileUserId} />
    </div>
  );

  // Derived values
  const d = editData || user;
  const completion   = calcCompletion(user);
  const resumeUrl    = d?.resumeUrl || d?.resume || '';
  const fixedResume  = resumeUrl ? (resumeUrl.startsWith('http') ? resumeUrl : 'https://' + resumeUrl) : '';
  const resumeValid  = isValidUrl(resumeUrl);
  const socialLinks  = Array.isArray(d?.socialLinks) ? d.socialLinks : [];
  const roles        = d?.roles || d?.interestedRoles || [];
  const experiences  = Array.isArray(d?.experience) ? d.experience : Array.isArray(d?.experiences) ? d.experiences : Array.isArray(d?.workExperience) ? d.workExperience : [];
  const isSaveDisabled = saving || !resumeValid || !socialLinks.every(l => !l.value || isValidUrl(l.value));
  const fieldCls = isEditing ? inputCls : `${inputCls} bg-gray-50 cursor-default pointer-events-none select-text`;

  const NOTIF_PREFS = [
    { key: 'messages',           label: 'Messages' },
    { key: 'ideaCollaboration',  label: 'Idea Collaboration' },
    { key: 'comments',           label: 'Comments' },
    { key: 'likes',              label: 'Likes' },
    { key: 'groupChats',         label: 'Group Chats' },
    { key: 'connectionRequests', label: 'Connection Requests' },
  ];

  // ── Shared global flash (used by multiple tabs) ────────────────────────────
  const GlobalFlash = () => (
    <>
      {settingsSuccess && <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700"><svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>{settingsSuccess}</div>}
      {settingsError  && <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{settingsError}</div>}
    </>
  );

  return (
    <div className="w-full">
      {/* ── Breadcrumb + heading ── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
            <span>Settings</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
            <span className="text-gray-700 font-medium capitalize">{TABS.find(t => t.key === activeTab)?.label || 'Profile'}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        </div>

        {/* View as Public button */}
        <button
          type="button"
          onClick={() => { setShowingPublicProfile(true); setLocalPublicProfileUserId(user._id); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition focus:outline-none shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View as Public
        </button>
      </div>

      {/* ── Tab navigation ── */}
      <div className="border-b border-gray-200 mb-7">
        <div className="flex gap-0 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 focus:outline-none ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════ PROFILE TAB ════════════════════ */}
      {activeTab === 'profile' && (
        <>
          {/* Header card */}
          <div className={`${cardCls} mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5`}>
            <div className="shrink-0">
              <AvatarUpload onAvatarChange={handleAvatarChange} currentAvatar={user.avatar} currentStatus={user.status} onStatusChange={handleStatusChange} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{user.fullName || user.name || user.firstName || 'Your Name'}</h2>
              <p className="text-sm text-gray-500 mt-0.5">Update your photo and personal details.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {isEditing ? (
                <>
                  <button onClick={handleCancel} disabled={saving} className="text-sm text-gray-500 hover:text-gray-700 font-medium transition focus:outline-none disabled:opacity-50">Cancel</button>
                  <button onClick={handleSave} disabled={isSaveDisabled} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition focus:outline-none disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save Profile'}
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition focus:outline-none">
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {saveSuccess && <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700"><svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>{saveSuccess}</div>}
          {saveError  && <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{saveError}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className={cardCls}>
                <h3 className="text-base font-bold text-gray-900 mb-5">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <Field label="Full Name"><input type="text" className={fieldCls} readOnly={!isEditing} value={d.fullName||''} onChange={e=>setEditData(p=>({...p,fullName:e.target.value}))} placeholder="Your full name" /></Field>
                  <Field label="Email Address"><input type="email" className={fieldCls} readOnly={!isEditing} value={d.email||''} onChange={e=>setEditData(p=>({...p,email:e.target.value}))} placeholder="your@email.com" /></Field>
                </div>
                <Field label="Bio"><textarea className={`${fieldCls} resize-none`} readOnly={!isEditing} rows={4} value={d.bio||''} onChange={e=>setEditData(p=>({...p,bio:e.target.value}))} placeholder="Tell the community about yourself…" /></Field>
              </div>

              {/* Professional Details */}
              <div className={cardCls}>
                <h3 className="text-base font-bold text-gray-900 mb-5">Professional Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <Field label="Current Role"><input type="text" className={fieldCls} readOnly={!isEditing} value={d.jobTitle||d.position||''} onChange={e=>setEditData(p=>({...p,jobTitle:e.target.value}))} placeholder="e.g. CEO & Co-founder" /></Field>
                  <Field label="Company"><input type="text" className={fieldCls} readOnly={!isEditing} value={d.company||''} onChange={e=>setEditData(p=>({...p,company:e.target.value}))} placeholder="e.g. Newronx Labs" /></Field>
                </div>
                <Field label="Skills">
                  <div className={`flex flex-wrap gap-2 min-h-[42px] border border-gray-200 rounded-lg px-3 py-2 ${isEditing ? 'bg-white' : 'bg-gray-50'}`}>
                    {(d.skills||[]).map((skill,idx)=>(
                      <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium px-3 py-1 rounded-full">
                        {skill}
                        {isEditing && <button type="button" onClick={()=>setEditData(p=>({...p,skills:p.skills.filter((_,i)=>i!==idx)}))} className="text-blue-400 hover:text-blue-600 ml-0.5 focus:outline-none">×</button>}
                      </span>
                    ))}
                    {isEditing && <input className="flex-1 min-w-[120px] text-sm outline-none placeholder-gray-400 py-0.5" placeholder="Add a skill…" onKeyDown={e=>{if(e.key==='Enter'&&e.target.value.trim()){setEditData(p=>({...p,skills:[...(p.skills||[]),e.target.value.trim()]}));e.target.value='';}}} />}
                  </div>
                </Field>
              </div>

              {/* Contact & Location */}
              <div className={cardCls}>
                <h3 className="text-base font-bold text-gray-900 mb-5">Contact & Location</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <Field label="Phone"><input type="text" className={fieldCls} readOnly={!isEditing} value={d.phone||''} onChange={e=>setEditData(p=>({...p,phone:e.target.value}))} placeholder="+1 555 000 0000" /></Field>
                  <Field label="City"><input type="text" className={fieldCls} readOnly={!isEditing} value={d.city||''} onChange={e=>setEditData(p=>({...p,city:e.target.value}))} placeholder="City" /></Field>
                  <Field label="Country"><input type="text" className={fieldCls} readOnly={!isEditing} value={d.country||''} onChange={e=>setEditData(p=>({...p,country:e.target.value}))} placeholder="Country" /></Field>
                  <Field label="Resume URL">
                    <input type="url" className={`${fieldCls} ${resumeUrl&&!resumeValid?'border-red-400':''}`} readOnly={!isEditing} value={d.resumeUrl||d.resume||''} onChange={e=>setEditData(p=>({...p,resumeUrl:e.target.value}))} placeholder="https://example.com/resume.pdf" />
                    {resumeUrl&&!resumeValid&&<p className="text-xs text-red-500 mt-1">Please enter a valid URL</p>}
                  </Field>
                </div>
                {socialLinks.length>0&&(
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Social Links</label>
                    <div className="space-y-2">
                      {socialLinks.map((link,idx)=>(
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-20 text-xs text-gray-500 shrink-0 capitalize">{link.type||'Link'}</span>
                          <input type="url" className={`${fieldCls} flex-1`} readOnly={!isEditing} value={link.value||''} onChange={e=>{const u=socialLinks.map((l,i)=>i===idx?{...l,value:e.target.value}:l);setEditData(p=>({...p,socialLinks:u}));}} placeholder="https://" />
                          {isEditing&&<button type="button" onClick={()=>setEditData(p=>({...p,socialLinks:socialLinks.filter((_,i)=>i!==idx)}))} className="text-gray-300 hover:text-red-500 focus:outline-none"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Interested Roles */}
              {roles.length>0&&(
                <div className={cardCls}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900">Interested Roles</h3>
                    {isEditing&&<button className="text-xs text-gray-400 hover:text-red-500" onClick={()=>setEditData(p=>({...p,roles:[]}))}>Clear all</button>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role,idx)=>(
                      <span key={idx} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium px-3 py-1.5 rounded-full">
                        {role}
                        {isEditing&&<button type="button" onClick={()=>setEditData(p=>({...p,roles:p.roles.filter((_,i)=>i!==idx)}))} className="text-indigo-400 hover:text-indigo-600 ml-0.5 focus:outline-none">×</button>}
                      </span>
                    ))}
                    {isEditing&&<input className="text-sm border border-dashed border-gray-300 rounded-full px-3 py-1 outline-none placeholder-gray-400 focus:border-indigo-400" placeholder="+ Add role" onKeyDown={e=>{if(e.key==='Enter'&&e.target.value.trim()){setEditData(p=>({...p,roles:[...(p.roles||[]),e.target.value.trim()]}));e.target.value='';}}} />}
                  </div>
                </div>
              )}

              {/* Experience */}
              {experiences.length>0&&(
                <div className={cardCls}>
                  <h3 className="text-base font-bold text-gray-900 mb-4">Experience</h3>
                  <div className="space-y-5">
                    {experiences.map((exp,idx)=>(
                      <div key={idx} className="border-l-2 border-gray-200 pl-4">
                        <div className="text-sm font-semibold text-gray-900">{exp.title||exp.role||'—'}</div>
                        <div className="text-xs text-gray-500 mt-0.5 mb-1">{exp.company||exp.org||'—'} · {formatRange(exp.startDate||exp.start||exp.from, exp.endDate||exp.end||exp.to)}</div>
                        {exp.summary&&<p className="text-xs text-gray-600 leading-relaxed">{exp.summary}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-5">
              {/* Public Profile Preview */}
              <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-sm">
                <h4 className="text-sm font-bold mb-3">Public Profile Preview</h4>
                <div className="bg-blue-500/60 rounded-xl p-4 mb-4 text-xs leading-relaxed">
                  Your profile is currently <span className="font-bold">{completion}% complete</span>.{' '}
                  {completion<100?'Add more details to reach 100%.':'Your profile is fully complete!'}
                </div>
                <div className="w-full bg-blue-800/40 rounded-full h-1.5 mb-4"><div className="bg-white h-1.5 rounded-full transition-all duration-500" style={{width:`${completion}%`}} /></div>
                <button onClick={()=>handleShowPublicProfile(user._id)} className="w-full py-2.5 bg-white text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition focus:outline-none">View Public Profile</button>
              </div>

              {/* Account Status */}
              <div className={cardCls}>
                <h4 className="text-sm font-bold text-red-600 mb-2">Account Status</h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">Deactivating your account will hide your profile and all contributions until you reactivate.</p>
                <button className="w-full py-2.5 border border-red-300 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition focus:outline-none">Deactivate Account</button>
              </div>

              {/* Resume */}
              {fixedResume&&(
                <div className={cardCls}>
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Documents</h4>
                  <a href={fixedResume} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Download Resume
                  </a>
                </div>
              )}

              {/* NDA quick */}
              <div className={cardCls}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-gray-900">NDA Agreements</h4>
                  <button onClick={()=>{if(showNDASignings){setShowNDASignings(false);}else{fetchNDASignings();setShowNDASignings(true);}}} className="text-xs text-blue-600 hover:underline font-medium">{showNDASignings?'Hide':'View'}</button>
                </div>
                <p className="text-xs text-gray-500">Signed confidentiality agreements for your ideas.</p>
              </div>
            </div>
          </div>

          {/* NDA Signings expanded */}
          {showNDASignings&&(
            <div className={`mt-6 ${cardCls}`}>
              <h3 className="text-base font-bold text-gray-900 mb-4">NDA Agreements</h3>
              {ndaSigningsLoading?(<div className="flex items-center gap-3 py-8 text-gray-400 text-sm"><div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"/>Loading…</div>)
                :ndaSignings.length>0?ndaSignings.map(s=>(
                  <div key={s.ideaId} className="mb-5 border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-900">{s.ideaTitle}</h4>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">{s.signings.length} Agreement{s.signings.length!==1?'s':''}</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {s.signings.map((sg,i)=>(
                        <div key={i} className="px-5 py-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-gray-700">{sg.signedBy.firstName?.[0]||sg.signedBy.fullName?.[0]||'U'}</div>
                              <div><p className="text-sm font-semibold text-gray-900">{sg.signedBy.fullName}</p><p className="text-xs text-gray-500">{sg.signedBy.email}</p></div>
                            </div>
                            <span className="text-xs text-gray-500">{new Date(sg.signedAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}</span>
                          </div>
                          <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-2.5 flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                            <span className="font-mono text-gray-800">{sg.formData.signature}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )):(
                  <div className="text-center py-12 text-gray-400">
                    <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <p className="text-sm font-medium text-gray-600">No NDA agreements yet</p>
                  </div>
                )}
            </div>
          )}

          {/* My Ideas */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <MyIdeasSection onShowPublicProfile={handleShowPublicProfile} />
          </div>
        </>
      )}

      {/* ════════════════════ ACCOUNT TAB ════════════════════ */}
      {activeTab === 'account' && (
        <div className="w-full">
          <GlobalFlash />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left col — Security + Privacy + NDA */}
            <div className="lg:col-span-2 space-y-6">

              {/* Security */}
              <div className={cardCls}>
                <h3 className="text-base font-bold text-gray-900 mb-5">Security</h3>
                <div className="space-y-1">
                  <div className="flex items-center justify-between py-3.5 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Email address</p>
                      <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                    </div>
                    <button onClick={()=>setShowEmailModal(true)} className="text-sm text-blue-600 font-medium hover:underline">Change</button>
                  </div>
                  <div className="flex items-center justify-between py-3.5">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Password</p>
                      <p className="text-xs text-gray-500 mt-0.5">Set a strong password to protect your account</p>
                    </div>
                    <button onClick={()=>setShowPasswordModal(true)} className="text-sm text-blue-600 font-medium hover:underline">Change</button>
                  </div>
                </div>
              </div>

              {/* Privacy */}
              <div className={cardCls}>
                <h3 className="text-base font-bold text-gray-900 mb-5">Privacy</h3>
                <div className="space-y-1">
                  {[
                    { key:'profileProtection', label:'Profile protection', sub:'Require approval for profile views' },
                    { key:'allowMessages',     label:'Allow messages',     sub:'Let anyone send you messages' },
                    { key:'showEmail',         label:'Show email',         sub:'Display your email on your public profile' },
                    { key:'showPhone',         label:'Show phone',         sub:'Display your phone number publicly' },
                  ].map(({key,label,sub})=>(
                    <div key={key} className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                      <div><p className="text-sm font-medium text-gray-800">{label}</p><p className="text-xs text-gray-500">{sub}</p></div>
                      <Toggle checked={!!privacySettings[key]} onChange={v=>handlePrivacyToggle(key,v)} disabled={settingsLoading} />
                    </div>
                  ))}
                  <div className="pt-4">
                    <p className="text-sm font-medium text-gray-800 mb-3">Profile visibility</p>
                    <div className="flex gap-3">
                      {['public','connections','private'].map(v=>(
                        <label key={v} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border text-xs font-medium cursor-pointer transition ${privacySettings.profileVisibility===v?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          <input type="radio" name="visibility" value={v} checked={privacySettings.profileVisibility===v} onChange={()=>handlePrivacyToggle('profileVisibility',v)} className="sr-only" />
                          {v.charAt(0).toUpperCase()+v.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* NDA Protection */}
              <div className={cardCls}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">NDA Protection</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Confidentiality agreement for your ideas</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ndaSettings.hasNDA?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{ndaSettings.hasNDA?'Active':'None'}</span>
                </div>
                {ndaSettings.hasNDA?(
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      NDA is active — {ndaSettings.ndaType==='uploaded'?'Uploaded PDF':'AI-generated document'}
                      {ndaSettings.ndaFile&&<a href={ndaSettings.ndaFile} target="_blank" rel="noopener noreferrer" className="ml-2 underline">View</a>}
                    </div>
                    <button onClick={handleNDARemove} disabled={settingsLoading} className="text-sm text-red-600 font-medium hover:underline disabled:opacity-50">{settingsLoading?'Removing…':'Remove NDA'}</button>
                  </div>
                ):(
                  <div className="flex gap-3">
                    <button onClick={()=>setShowNDAGenerateModal(true)} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">Generate NDA</button>
                    <button onClick={()=>setShowNDAUploadModal(true)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition">Upload NDA</button>
                  </div>
                )}
              </div>
            </div>

            {/* Right col — Appearance + Data + Logout */}
            <div className="space-y-5">
              {/* Appearance */}
              <div className={cardCls}>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Appearance</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Theme</p>
                    <p className="text-xs text-gray-500 mt-0.5">Currently {theme} mode</p>
                  </div>
                  <button onClick={handleThemeToggle} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition focus:outline-none">
                    {theme==='light'?(<><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>Light</>)
                    :(<><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>Dark</>)}
                  </button>
                </div>
              </div>

              {/* Data & Account */}
              <div className={cardCls}>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Data & Account</h3>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Download your data</p>
                      <p className="text-xs text-gray-500 mt-0.5">Full CSV export of your profile &amp; ideas</p>
                    </div>
                    <button onClick={handleDownload} disabled={settingsLoading} className="shrink-0 text-xs text-blue-600 font-medium hover:underline disabled:opacity-50">{settingsLoading?'…':'Download'}</button>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-red-600">Delete account</p>
                      <p className="text-xs text-gray-500 mt-0.5">Permanently remove all your data</p>
                    </div>
                    <button className="shrink-0 text-xs text-red-600 font-medium hover:underline">Delete</button>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div className={cardCls}>
                <button onClick={async()=>{try{await apiService.logout();window.location.href='/';}catch{alert('Logout failed');}}} className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900 font-medium transition focus:outline-none w-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"/></svg>
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ ROLES TAB ════════════════════ */}
      {activeTab === 'roles' && (
        <div className="w-full">
          <GlobalFlash />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left — form */}
            <div className="lg:col-span-2 space-y-6">
              <div className={cardCls}>
                <h3 className="text-base font-bold text-gray-900 mb-1">Investor / Mentor Roles</h3>
                <p className="text-sm text-gray-500 mb-6">Set your role so the community can discover you as a mentor or investor.</p>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[{state:isInvestor,set:setIsInvestor,label:'Investor',icon:'💼',active:'border-amber-400 bg-amber-50',activeText:'text-amber-700',activeDot:'border-amber-500 bg-amber-500'},
                      {state:isMentor, set:setIsMentor, label:'Mentor',   icon:'🎓',active:'border-purple-400 bg-purple-50',activeText:'text-purple-700',activeDot:'border-purple-500 bg-purple-500'}
                    ].map(({state,set,label,icon,active,activeText,activeDot})=>(
                      <button key={label} type="button" onClick={()=>set(!state)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition focus:outline-none ${state?active:'border-gray-200 hover:border-gray-300'}`}>
                        <span className="text-2xl">{icon}</span>
                        <div>
                          <p className={`text-sm font-bold ${state?activeText:'text-gray-700'}`}>{label}</p>
                          <p className="text-xs text-gray-500">{state?'Active — visible to community':'Click to enable'}</p>
                        </div>
                        <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${state?activeDot:'border-gray-300'}`}>
                          {state&&<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                        </div>
                      </button>
                    ))}
                  </div>

                  {(isInvestor||isMentor)&&(
                    <>
                      <hr className="border-gray-100" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field label="Company"><input type="text" className={inputCls} value={roleCompany} onChange={e=>setRoleCompany(e.target.value)} placeholder="Your company" /></Field>
                        <Field label="Position"><input type="text" className={inputCls} value={rolePosition} onChange={e=>setRolePosition(e.target.value)} placeholder="Your title" /></Field>
                        <Field label="Experience"><input type="text" className={inputCls} value={roleExperience} onChange={e=>setRoleExperience(e.target.value)} placeholder="e.g. 10+ years in tech" /></Field>
                      </div>
                      {isInvestor&&<Field label="Investment focus (comma-separated)"><input type="text" className={inputCls} value={investmentFocus.join(', ')} onChange={e=>setInvestmentFocus(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} placeholder="e.g. AI, FinTech, EdTech" /></Field>}
                      {isMentor&&<Field label="Mentorship areas (comma-separated)"><input type="text" className={inputCls} value={mentorshipAreas.join(', ')} onChange={e=>setMentorshipAreas(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} placeholder="e.g. Product Strategy, Business" /></Field>}
                    </>
                  )}

                  <button onClick={handleRolesSave} disabled={rolesSaving} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition focus:outline-none disabled:opacity-50">
                    {rolesSaving?'Saving…':'Save Roles'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right — current status */}
            <div className="space-y-5">
              <div className={cardCls}>
                <h4 className="text-sm font-bold text-gray-900 mb-4">Current Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Investor</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user?.isInvestor?'bg-amber-100 text-amber-700':'bg-gray-100 text-gray-500'}`}>{user?.isInvestor?'Active':'Inactive'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mentor</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user?.isMentor?'bg-purple-100 text-purple-700':'bg-gray-100 text-gray-500'}`}>{user?.isMentor?'Active':'Inactive'}</span>
                  </div>
                  {user?.company&&<div className="pt-2 border-t border-gray-100"><p className="text-xs text-gray-500">Company</p><p className="text-sm font-medium text-gray-800 mt-0.5">{user.company}</p></div>}
                  {user?.position&&<div><p className="text-xs text-gray-500">Position</p><p className="text-sm font-medium text-gray-800 mt-0.5">{user.position}</p></div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ NOTIFICATIONS TAB ════════════════════ */}
      {activeTab === 'notifications' && (
        <div className="w-full">
          <GlobalFlash />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left — Email + App prefs side by side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Email Notifications */}
              <div className={cardCls}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Email Notifications</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Receive updates and alerts via email</p>
                  </div>
                  <Toggle checked={!!notificationSettings.email.enabled} onChange={v=>handleNotifTypeToggle('email',v)} />
                </div>
                {notificationSettings.email.enabled&&(
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    {[...NOTIF_PREFS, {key:'weeklyDigest', label:'Weekly Digest'}].map(({key,label})=>(
                      <div key={key} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-700">{label}</span>
                        <Toggle checked={!!notificationSettings.email.preferences[key]} onChange={v=>handleNotifPrefToggle('email',key,v)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* App Notifications */}
              <div className={cardCls}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">App Notifications</h3>
                    <p className="text-xs text-gray-500 mt-0.5">In-browser push notifications</p>
                  </div>
                  <Toggle checked={!!notificationSettings.app.enabled} onChange={v=>handleNotifTypeToggle('app',v)} />
                </div>
                <div className="flex items-center justify-between py-2.5 mb-4 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Browser permission</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${notificationSettings.app.browserPermission==='granted'?'bg-green-100 text-green-700':notificationSettings.app.browserPermission==='denied'?'bg-red-100 text-red-600':'bg-gray-100 text-gray-500'}`}>
                    {notificationSettings.app.browserPermission==='granted'?'Granted':notificationSettings.app.browserPermission==='denied'?'Denied':'Not requested'}
                  </span>
                </div>
                {notificationSettings.app.enabled&&(
                  <div className="space-y-3">
                    {NOTIF_PREFS.map(({key,label})=>(
                      <div key={key} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-700">{label}</span>
                        <Toggle checked={!!notificationSettings.app.preferences[key]} onChange={v=>handleNotifPrefToggle('app',key,v)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right — Test + summary */}
            <div className="space-y-5">
              <div className={cardCls}>
                <h4 className="text-sm font-bold text-gray-900 mb-2">Test Notifications</h4>
                <p className="text-xs text-gray-500 mb-4">Verify your notification setup is working.</p>
                <div className="space-y-2">
                  <button onClick={()=>handleTestNotif('email')} className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">Test Email</button>
                  <button onClick={()=>handleTestNotif('app')}   className="w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition">Test App</button>
                </div>
              </div>
              <div className={cardCls}>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span className="text-gray-600">Email</span><span className={`text-xs font-semibold ${notificationSettings.email.enabled?'text-green-600':'text-gray-400'}`}>{notificationSettings.email.enabled?'On':'Off'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-gray-600">App</span><span className={`text-xs font-semibold ${notificationSettings.app.enabled?'text-green-600':'text-gray-400'}`}>{notificationSettings.app.enabled?'On':'Off'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ BILLING TAB ════════════════════ */}
      {activeTab === 'billing' && (
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><div className={cardCls}><h3 className="text-base font-bold text-gray-900 mb-2">Billing</h3><p className="text-sm text-gray-500">Subscription &amp; billing management coming soon.</p></div></div>
            <div><div className={cardCls}><h4 className="text-sm font-bold text-gray-900 mb-2">Current Plan</h4><p className="text-xs text-gray-500">Free</p></div></div>
          </div>
        </div>
      )}

      {/* ════════════════════ INTEGRATIONS TAB ════════════════════ */}
      {activeTab === 'integrations' && (
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><div className={cardCls}><h3 className="text-base font-bold text-gray-900 mb-2">Integrations</h3><p className="text-sm text-gray-500">Third-party integrations coming soon.</p></div></div>
            <div><div className={cardCls}><h4 className="text-sm font-bold text-gray-900 mb-2">Connected Apps</h4><p className="text-xs text-gray-500">None yet</p></div></div>
          </div>
        </div>
      )}

      {/* ════════════════ MODALS ════════════════ */}

      {/* Password modal */}
      {showPasswordModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm relative">
            <button type="button" onClick={()=>setShowPasswordModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none">×</button>
            <h3 className="text-base font-bold text-gray-900 mb-5">Change Password</h3>
            <div className="space-y-4 mb-6">
              <Field label="Current Password"><input type="password" className={inputCls} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required /></Field>
              <Field label="New Password"><input type="password" className={inputCls} value={newPassword} onChange={e=>setNewPassword(e.target.value)} required /></Field>
              <Field label="Confirm New Password"><input type="password" className={inputCls} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required /></Field>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={()=>setShowPasswordModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={settingsLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">{settingsLoading?'Saving…':'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Email modal */}
      {showEmailModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleEmailChange} className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm relative">
            <button type="button" onClick={()=>setShowEmailModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none">×</button>
            <h3 className="text-base font-bold text-gray-900 mb-5">Change Email</h3>
            <div className="space-y-4 mb-6">
              <Field label="New Email"><input type="email" className={inputCls} value={newEmail} onChange={e=>setNewEmail(e.target.value)} required /></Field>
              <Field label="Current Password"><input type="password" className={inputCls} value={emailPassword} onChange={e=>setEmailPassword(e.target.value)} required /></Field>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={()=>setShowEmailModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={settingsLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">{settingsLoading?'Saving…':'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {/* NDA Generate modal */}
      {showNDAGenerateModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleNDAGenerate} className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md relative">
            <button type="button" onClick={()=>setShowNDAGenerateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none">×</button>
            <h3 className="text-base font-bold text-gray-900 mb-5">Generate Custom NDA</h3>
            <div className="space-y-4 mb-6">
              <Field label="Company Name"><input type="text" className={inputCls} value={ndaCompanyName} onChange={e=>setNdaCompanyName(e.target.value)} required /></Field>
              <Field label="Project Name"><input type="text" className={inputCls} value={ndaProjectName} onChange={e=>setNdaProjectName(e.target.value)} required /></Field>
              <Field label="Protection Scope"><textarea className={`${inputCls} resize-none`} rows={3} value={ndaProtectionScope} onChange={e=>setNdaProtectionScope(e.target.value)} placeholder="e.g. all technical specs, algorithms, and business strategies" required /></Field>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={()=>setShowNDAGenerateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={settingsLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">{settingsLoading?'Generating…':'Generate'}</button>
            </div>
          </form>
        </div>
      )}

      {/* NDA Upload modal */}
      {showNDAUploadModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleNDAUpload} className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm relative">
            <button type="button" onClick={()=>setShowNDAUploadModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none">×</button>
            <h3 className="text-base font-bold text-gray-900 mb-5">Upload NDA Document</h3>
            <Field label="Select PDF File">
              <input type="file" accept=".pdf" onChange={e=>setNdaUploadFile(e.target.files[0])} className={`${inputCls} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700`} required />
              <p className="text-xs text-gray-400 mt-1">PDF files only</p>
            </Field>
            <div className="flex gap-3 justify-end mt-6">
              <button type="button" onClick={()=>setShowNDAUploadModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={settingsLoading||!ndaUploadFile} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">{settingsLoading?'Uploading…':'Upload'}</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default ProfileSection;
