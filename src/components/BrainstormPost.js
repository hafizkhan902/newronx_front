import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';
import ShareButton from './ShareButton';
import { useUser } from '../UserContext';

const infoFields = [
  {
    key: 'targetAudience',
    label: 'Audience',
    icon: (
      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M2 20c0-4 8-6 10-6s10 2 10 6" /></svg>
    ),
  },
  {
    key: 'marketAlternatives',
    label: 'Alternatives',
    icon: (
      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="7" height="7" rx="2" /><rect x="14" y="7" width="7" height="7" rx="2" /><rect x="3" y="17" width="7" height="4" rx="2" /><rect x="14" y="17" width="7" height="4" rx="2" /></svg>
    ),
  },
  {
    key: 'problemStatement',
    label: 'Problem',
    icon: (
      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>
    ),
  },
  {
    key: 'uniqueValue',
    label: 'Unique',
    icon: (
      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M6.34 17.66l-1.41 1.41m12.02 0l-1.41-1.41M6.34 6.34L4.93 4.93" /></svg>
    ),
  },
];

const approachRoles = [
  'Developer',
  'Designer',
  'Marketer',
  'Product Manager',
  'Other',
];

// Add mockApproaches array for demonstration
const mockApproaches = [
  { name: 'Alice', role: 'Frontend Developer', avatar: 'A', description: 'I can help build a beautiful and responsive UI.' },
  { name: 'Bob', role: 'Product Manager', avatar: 'B', description: 'I have experience managing agile teams and product roadmaps.' },
  { name: 'Charlie', role: 'UI/UX Designer', avatar: 'C', description: 'I can design user flows and wireframes for your MVP.' },
];

function BrainstormPost({ post, onApproach, setSelectedUserId, onInteraction, isPublicView = false }) {
  const navigate = useNavigate();
  const { user } = useUser(); // Get current user
  const [showApproachModal, setShowApproachModal] = useState(false);
  const [showApproachesList, setShowApproachesList] = useState(false);
  const [approachRole, setApproachRole] = useState(approachRoles[0]);
  const [approachMsg, setApproachMsg] = useState('');
  // Appreciation state
  const [appreciated, setAppreciated] = useState(!!post.appreciated);
  const [appreciateCount, setAppreciateCount] = useState(post.appreciateCount || 0);
  const [iconAnimating, setIconAnimating] = useState(false);
  // Suggestion modal state
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestionInput, setSuggestionInput] = useState("");
  const [suggestions, setSuggestions] = useState(post.suggestions || []);
  // Error popup state
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  // Privacy modal state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  // NDA modal state
  const [showNDAModal, setShowNDAModal] = useState(false);
  const [ndaLoading, setNdaLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    title: post.title || '',
    description: post.description || '',
    targetAudience: post.targetAudience || '',
    marketAlternatives: post.marketAlternatives || '',
    problemStatement: post.problemStatement || '',
    uniqueValue: post.uniqueValue || '',
    neededRoles: post.neededRoles || approachRoles
  });

  // Check if current user is the author of this post (robust across id shapes)
  const authorId = (post && post.author)
    ? (post.author._id || post.author.id || (typeof post.author === 'string' ? post.author : null))
    : null;
  const currentUserId = user ? (user._id || user.id) : null;
  const isOwnPost = currentUserId && authorId && String(currentUserId) === String(authorId);
  
  // Ref for the three dot menu
  const threeDotMenuRef = useRef(null);
  
  // Handle click outside to close three dot menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (threeDotMenuRef.current && !threeDotMenuRef.current.contains(event.target)) {
        setShowThreeDotMenu(false);
      }
    };
    
    if (showThreeDotMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showThreeDotMenu]);

  // For approach roles, use post.neededRoles if available, otherwise default
  let rolesArray = approachRoles;
  if (post.neededRoles) {
    if (Array.isArray(post.neededRoles)) {
      // If it's an array with a single string that looks like a JSON array, parse it
      if (
        post.neededRoles.length === 1 &&
        typeof post.neededRoles[0] === 'string' &&
        post.neededRoles[0].trim().startsWith('[')
      ) {
        try {
          const parsed = JSON.parse(post.neededRoles[0]);
          if (Array.isArray(parsed)) rolesArray = parsed;
        } catch {
          // fallback: split by comma
          rolesArray = post.neededRoles[0].split(',').map(r => r.replace(/[[\]"]/g, '').trim()).filter(Boolean);
        }
      } else {
        // Otherwise, use the array as-is
        rolesArray = post.neededRoles;
      }
    } else if (typeof post.neededRoles === 'string') {
      // Try to parse as JSON array if it looks like one
      if (post.neededRoles.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(post.neededRoles);
          if (Array.isArray(parsed)) rolesArray = parsed;
        } catch {
          rolesArray = post.neededRoles.split(',').map(r => r.replace(/[[\]"]/g, '').trim()).filter(Boolean);
        }
      } else {
        rolesArray = post.neededRoles.split(',').map(r => r.trim()).filter(Boolean);
      }
    }
  }

  // Use local state for real-time approach count and list
  const [approachCount, setApproachCount] = useState(Array.isArray(post.approaches) ? post.approaches.length : 0);
  const [realApproaches, setRealApproaches] = useState(Array.isArray(post.approaches) ? post.approaches : []);
  
  // Debug: log approaches to check user population and data structure
  console.log('[BrainstormPost] Post ID:', post._id, 'Approaches:', realApproaches);
  
  // Validate approaches data structure
  const validApproaches = realApproaches.filter(approach => {
    if (!approach || typeof approach !== 'object') {
      console.warn('[BrainstormPost] Invalid approach found:', approach);
      return false;
    }
    return true;
  });

  // When opening the Approaches list, fetch full post details to ensure
  // user objects in approaches are populated for avatar/name display
  useEffect(() => {
    if (!showApproachesList) return;
    let aborted = false;

    const enrichApproachesWithProfiles = async (approaches) => {
      try {
        // Collect user IDs that need enrichment
        const userIds = Array.from(
          new Set(
            approaches
              .map(a => (typeof a.user === 'string' ? a.user : (a.user?._id || a.user?.id)))
              .filter(Boolean)
          )
        );
        if (userIds.length === 0) return approaches;

        // Fetch public profiles in parallel
        const results = await Promise.all(
          userIds.map(async (id) => {
            // Try public profile first
            try {
              let res = await fetch(`/api/users/${id}/public`, { credentials: 'include' });
              if (res.ok) {
                const json = await res.json();
                const profile = json?.data || json?.user || json?.profile || json;
                if (profile && (profile.fullName || profile.firstName || profile.name)) {
                  return [id, profile];
                }
              }
            } catch {}

            // Fallback: try generic user endpoint if available
            try {
              let res = await fetch(`/api/users/${id}`, { credentials: 'include' });
              if (res.ok) {
                const json = await res.json();
                const profile = json?.data || json?.user || json?.profile || json;
                if (profile && (profile.fullName || profile.firstName || profile.name)) {
                  return [id, profile];
                }
              }
            } catch {}

            // Fallback: try search endpoint with id (some backends support id query)
            try {
              let res = await fetch(`/api/users/search?q=${encodeURIComponent(id)}`, { credentials: 'include' });
              if (res.ok) {
                const json = await res.json();
                const list = json?.data || json?.users || json;
                const first = Array.isArray(list) ? list[0] : null;
                if (first && (first.fullName || first.firstName || first.name)) {
                  return [id, first];
                }
              }
            } catch {}

            return [id, null];
          })
        );
        const idToProfile = Object.fromEntries(results);

        // Merge profiles back into approaches
        return approaches.map((a) => {
          if (a && typeof a.user === 'string') {
            const profile = idToProfile[a.user];
            if (profile && typeof profile === 'object') {
              return {
                ...a,
                user: {
                  _id: profile._id || a.user,
                  fullName: profile.fullName || profile.firstName || profile.name || 'Unknown',
                  avatar: profile.avatar || '',
                  isMentor: profile.isMentor,
                  isInvestor: profile.isInvestor,
                }
              };
            }
            // If profile not found, keep ID but wrap into object so UI can handle
            return {
              ...a,
              user: { _id: a.user, fullName: 'Unknown', avatar: '' }
            };
          }
          return a;
        });
      } catch {
        return approaches;
      }
    };

    (async () => {
      try {
        // Fetch latest post for up-to-date approaches
        const res = await fetch(`/api/ideas/${post._id}`, { credentials: 'include' });
        if (!res.ok) return;
        const payload = await res.json();
        const idea = payload?.data || payload?.idea || payload;
        let approaches = Array.isArray(idea?.approaches) ? idea.approaches : [];
        approaches = await enrichApproachesWithProfiles(approaches);
        if (!aborted) {
          setRealApproaches(approaches);
          setApproachCount(approaches.length);
        }
      } catch {}
    })();

    return () => { aborted = true; };
  }, [showApproachesList, post._id]);

  // You may want to get isAuthenticated from props or context. For now, fallback to window.isAuthenticated or always true for demo.
  const isAuthenticated = typeof window !== 'undefined' && window.isAuthenticated !== undefined ? window.isAuthenticated : true;

  const handleAppreciate = async () => {
    if (!isAuthenticated) {
      alert('You must be logged in to appreciate a post.');
      return;
    }
    try {
      if (!appreciated) {
        // Like
        const res = await fetch(`/api/ideas/${post._id}/like`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Failed to appreciate post');
        const data = await res.json();
        setAppreciateCount(data.appreciateCount ?? (appreciateCount + 1));
        setAppreciated(data.appreciated ?? true);
      } else {
        // Unlike
        const res = await fetch(`/api/ideas/${post._id}/unlike`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Failed to remove appreciation');
        const data = await res.json();
        setAppreciateCount(data.appreciateCount ?? Math.max(0, appreciateCount - 1));
        setAppreciated(data.appreciated ?? false);
      }
      setIconAnimating(true);
      setTimeout(() => setIconAnimating(false), 500);
    } catch (err) {
      setIconAnimating(false);
      // Optionally show error
    }
  };

  const handleSendApproach = async (e) => {
    e.preventDefault();
    
    // Check if user is trying to approach their own idea
    if (isOwnPost) {
      setErrorMessage("You cannot approach your own idea. You're the author of this idea!");
      setShowErrorPopup(true);
      return;
    }
    
    try {
      const res = await fetch(`/api/ideas/${post._id}/approach`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: approachRole,
          description: approachMsg
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to send approach');
      }
      // After successful POST, fetch latest approaches and update state
      const postRes = await fetch(`/api/ideas/${post._id}`);
      const updatedPost = await postRes.json();
      setApproachCount(Array.isArray(updatedPost.approaches) ? updatedPost.approaches.length : 0);
      setRealApproaches(Array.isArray(updatedPost.approaches) ? updatedPost.approaches : []);
      setShowApproachModal(false);
      setApproachMsg('');
      setApproachRole(rolesArray[0]);
    } catch (err) {
      setErrorMessage(err.message);
      setShowErrorPopup(true);
    }
  };

  const handleSuggest = async () => {
    if (!suggestionInput.trim()) return;
    try {
      const res = await fetch(`/api/ideas/${post._id}/suggestion`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: suggestionInput })
      });
      if (!res.ok) throw new Error('Failed to submit suggestion');
      // Always fetch the latest suggestions from the backend for real-time avatars/names
      const postRes = await fetch(`/api/ideas/${post._id}`);
      const updatedPost = await postRes.json();
      setSuggestions(updatedPost.suggestions || []);
      setSuggestionInput("");
    } catch (err) {
      // Optionally show error
    }
  };

  const handleEditIdea = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    
    try {
      const res = await fetch(`/api/ideas/${post._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update idea');
      }
      
      const updatedIdea = await res.json();
      
      // Update the post data with the new information
      Object.assign(post, updatedIdea.idea || updatedIdea);
      
      setShowEditModal(false);
      setShowThreeDotMenu(false);
      setEditLoading(false);
      
      // Show success message
      setErrorMessage('Idea updated successfully!');
      setShowErrorPopup(true);
      
    } catch (err) {
      setErrorMessage(err.message);
      setShowErrorPopup(true);
      setEditLoading(false);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Privacy form state and handlers
  const [privacyForm, setPrivacyForm] = useState({
    privacy: post.privacy || 'Public'
  });

  const handlePrivacyUpdate = async (e) => {
    e.preventDefault();
    setPrivacyLoading(true);
    
    try {
      const res = await fetch(`/api/ideas/${post._id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privacy: privacyForm.privacy
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update idea privacy');
      }
      
      // Update the post data with new privacy setting
      post.privacy = privacyForm.privacy;
      
      setShowPrivacyModal(false);
      setPrivacyLoading(false);
      
      // Show success message
      setErrorMessage('Idea privacy updated successfully!');
      setShowErrorPopup(true);
      
    } catch (err) {
      setErrorMessage(err.message);
      setShowErrorPopup(true);
      setPrivacyLoading(false);
    }
  };

  const handlePrivacyChange = (field, value) => {
    setPrivacyForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // NDA form state and handlers
  const [ndaForm, setNdaForm] = useState({
    hasNDA: false,
    ndaType: 'none',
    ndaFile: '',
    ndaGeneratedContent: '',
    ideaProtection: false
  });

  const [ndaCompanyName, setNdaCompanyName] = useState('');
  const [ndaProjectName, setNdaProjectName] = useState('');
  const [ndaProtectionScope, setNdaProtectionScope] = useState('');
  const [ndaFile, setNdaFile] = useState(null);

  // NDA Protection state
  const [ndaProtection, setNdaProtection] = useState(post.ndaProtection?.enabled || false);
  
  // NDA Blur and Agreement state
  const [showNDABlur, setShowNDABlur] = useState(ndaProtection && !isOwnPost);
  const [showNDAAgreementForm, setShowNDAAgreementForm] = useState(false);
  const [ndaAgreementForm, setNdaAgreementForm] = useState({
    signerName: user?.fullName || '',
    signerEmail: user?.email || '',
    companyName: '',
    position: '',
    agreeToTerms: false,
    agreeToConfidentiality: false,
    signature: ''
  });
  const [ndaAgreementLoading, setNdaAgreementLoading] = useState(false);

  const handleNDAGenerate = async (e) => {
    e.preventDefault();
    setNdaLoading(true);
    
    try {
      const res = await fetch(`/api/users/profile/nda/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: ndaCompanyName,
          projectName: ndaProjectName,
          protectionScope: ndaProtectionScope
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to generate NDA');
      }
      
      const data = await res.json();
      setNdaForm(data.nda);
      setShowNDAModal(false);
      setNdaLoading(false);
      
      // Show success message
      setErrorMessage('NDA generated successfully!');
      setShowErrorPopup(true);
      
    } catch (err) {
      setErrorMessage(err.message);
      setShowErrorPopup(true);
      setNdaLoading(false);
    }
  };

  const handleNDAUpload = async (e) => {
    e.preventDefault();
    if (!ndaFile) {
      setErrorMessage('Please select a PDF file');
      setShowErrorPopup(true);
      return;
    }
    
    setNdaLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('ndaFile', ndaFile);

      const res = await fetch(`/api/users/profile/nda/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to upload NDA');
      }
      
      const data = await res.json();
      setNdaForm(data.nda);
      setShowNDAModal(false);
      setNdaLoading(false);
      
      // Show success message
      setErrorMessage('NDA uploaded successfully!');
      setShowErrorPopup(true);
      
    } catch (err) {
      setErrorMessage(err.message);
      setShowErrorPopup(true);
      setNdaLoading(false);
    }
  };

  const handleNDARemove = async () => {
    setNdaLoading(true);
    
    try {
      const res = await fetch(`/api/users/profile/nda`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to remove NDA');
      }
      
      const data = await res.json();
      setNdaForm(data.nda);
      setShowNDAModal(false);
      setNdaLoading(false);
      
      // Show success message
      setErrorMessage('NDA removed successfully!');
      setShowErrorPopup(true);
      
    } catch (err) {
      setErrorMessage(err.message);
      setShowErrorPopup(true);
      setNdaLoading(false);
    }
  };

  // NDA Protection toggle for ideas
  const handleNDAProtectionToggle = async () => {
    setNdaLoading(true);
    
    try {
      const res = await fetch(`/api/ideas/${post._id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ndaProtection: {
            enabled: !ndaProtection
          }
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update NDA protection');
      }
      
      // Update local state
      setNdaProtection(!ndaProtection);
      post.ndaProtection = { enabled: !ndaProtection };
      
      setShowNDAModal(false);
      setNdaLoading(false);
      
      // Show success message
      setErrorMessage(`NDA protection ${!ndaProtection ? 'enabled' : 'disabled'} successfully!`);
      setShowErrorPopup(true);
      
    } catch (err) {
      setErrorMessage(err.message);
      setShowErrorPopup(true);
      setNdaLoading(false);
    }
  };

  // NDA Agreement form handlers
  const handleNDAContentClick = () => {
    if (ndaProtection && !isOwnPost) {
      setShowNDAAgreementForm(true);
    }
  };

  const handleNDAAgreementSubmit = async (e) => {
    e.preventDefault();
    setNdaAgreementLoading(true);
    
    try {
      const res = await fetch(`/api/ideas/${post._id}/sign-nda`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ndaFormData: ndaAgreementForm
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to sign NDA');
      }
      
      // Remove blur and show content
      setShowNDABlur(false);
      setShowNDAAgreementForm(false);
      setNdaAgreementLoading(false);
      
      // Show success message
      setErrorMessage('NDA signed successfully! You can now view the content.');
      setShowErrorPopup(true);
      
    } catch (err) {
      setErrorMessage(err.message);
      setShowErrorPopup(true);
      setNdaAgreementLoading(false);
    }
  };

  const handleNDAAgreementChange = (field, value) => {
    setNdaAgreementForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 pb-8 sm:pb-10 flex flex-col gap-4 relative">
      {/* Top right buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {/* Approaches Button */}
        <button
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold transition px-3 py-1 bg-blue-50 rounded-full shadow-sm border border-blue-100"
          onClick={() => setShowApproachesList(true)}
        >
          Approaches <span className="ml-1">{approachCount}</span>
        </button>
        
        {/* Three dot menu for own posts */}
        {isOwnPost && (
          <div className="relative" ref={threeDotMenuRef}>
            <button
              className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
              onClick={() => setShowThreeDotMenu(!showThreeDotMenu)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {/* Dropdown menu */}
            {showThreeDotMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                <button
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    setShowEditModal(true);
                    setShowThreeDotMenu(false);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Idea
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                  onClick={() => {
                    setShowPrivacyModal(true);
                    setShowThreeDotMenu(false);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Privacy
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                  onClick={() => {
                    setShowNDAModal(true);
                    setShowThreeDotMenu(false);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  NDA
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Privacy badge - bottom right, responsive */}
      {(() => {
        console.log('🔍 BrainstormPost - Post privacy check:', {
          postId: post._id || post.id,
          title: post.title,
          privacy: post.privacy,
          hasPrivacy: !!post.privacy,
          isNotPublic: post.privacy !== 'Public',
          shouldShow: post.privacy && post.privacy !== 'Public'
        });
        // Show badge for non-public posts
        return post.privacy && post.privacy !== 'Public';
      })() && (
        <div className="absolute bottom-4 right-4 z-10 sm:bottom-6 sm:right-6">
          <div className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
            post.privacy === 'Private' 
              ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200' 
              : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
          }`}>
            <span className="hidden sm:inline">
              {post.privacy === 'Private' ? '🔒 Private' : post.privacy === 'Team' ? '👥 Team' : `🔍 ${post.privacy || 'No Privacy'}`}
            </span>
            <span className="sm:hidden">
              {post.privacy === 'Private' ? '🔒' : post.privacy === 'Team' ? '👥' : '🔍'}
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 mb-1">
        <UserAvatar
          userId={post.author._id}
          avatarUrl={post.author.avatar}
          size={32}
          isMentor={post.author.isMentor}
          isInvestor={post.author.isInvestor}
        />
        <div className="flex flex-col">
          <span className="text-sm text-black font-medium">{post.author.fullName || post.author.name}</span>
          <span className="text-xs text-gray-400">{post.time}</span>
        </div>
      </div>
      
      {/* NDA Protected Content */}
      <div className={`relative ${showNDABlur ? 'cursor-pointer' : ''}`} onClick={handleNDAContentClick}>
        {/* Title & Description */}
        <div className={showNDABlur ? 'filter blur-sm pointer-events-none' : ''}>
          <h3 className="text-lg font-semibold text-black mb-1 truncate">{post.title}</h3>
          <p className="text-gray-700 text-sm mb-3 whitespace-pre-line">{post.description}</p>
          {/* Defensive: Never render image URL as text */}
          {Array.isArray(post.images) && post.images.length > 0 && post.images[0].url && typeof post.description === 'string' && post.description.includes(post.images[0].url) && (
            <style>{`.post-image-url-text { display: none !important; }`}</style>
          )}
        </div>
        
        {/* Image section above title/description */}
        {Array.isArray(post.images) && post.images.length > 0 && post.images[0].url && (
          <div className={`mb-2 flex justify-center ${showNDABlur ? 'filter blur-sm pointer-events-none' : ''}`}>
            <img
              src={post.images[0].url}
              alt={post.title}
              className="rounded border border-gray-200 object-cover max-h-48 w-full"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        )}
        
        {/* Info Fields */}
        <div className={`flex flex-col gap-1 mb-2 ${showNDABlur ? 'filter blur-sm pointer-events-none' : ''}`}>
          {infoFields.map((field) => {
            // Show fallback if missing
            let value = post[field.key];
            if (typeof value === 'undefined' || value === null || value === '') value = '—';
            return (
              <div key={field.key} className="flex items-center text-xs text-gray-500">
                {field.icon}
                <span className="mr-1 font-medium">{field.label}:</span>
                <span className="text-gray-700">{value}</span>
              </div>
            );
          })}
        </div>
        
        {/* Tags */}
        <div className={`flex flex-wrap gap-2 mb-2 ${showNDABlur ? 'filter blur-sm pointer-events-none' : ''}`}>
          {post.tags.map((tag) => (
            <span key={tag} className="border border-gray-300 text-gray-500 text-xs px-2 py-0.5 rounded-full">#{tag}</span>
          ))}
        </div>
        
        {/* NDA Blur Overlay */}
        {showNDABlur && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm rounded-lg">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Protected Content</h3>
              <p className="text-sm text-gray-600 mb-4">This idea is protected by an NDA. Click to sign the agreement and view the content.</p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Sign NDA to View
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Actions */}
      {!post.hideActions && (
        <div className="flex gap-6 mt-2">
          {!isOwnPost && (
            <button 
              className="flex items-center gap-1 text-gray-500 hover:text-black text-xs font-medium transition" 
              onClick={() => {
                if (isPublicView && onInteraction) {
                  onInteraction('approach');
                } else {
                  setShowApproachModal(true);
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3.5 5.5V17a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2.5C17.5 13.5 19 11.5 19 9a7 7 0 0 0-7-7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 21h6" /></svg>
              Approach
            </button>
          )}
          <button
            className={`flex items-center gap-1 text-gray-500 hover:text-black text-xs font-medium transition relative ${appreciated ? 'text-red-600 font-semibold' : ''}`}
            onClick={() => {
              if (isPublicView && onInteraction) {
                onInteraction('appreciate');
              } else {
                handleAppreciate();
              }
            }}
          >
            <span className="relative w-4 h-4 flex items-center justify-center">
              {/* Heart icon (outlined or filled) */}
              <svg
                className={`absolute left-0 top-0 w-4 h-4 transition-all duration-300 ${!appreciated ? (iconAnimating ? 'scale-125 opacity-0' : 'scale-100 opacity-100') : 'scale-0 opacity-0'}`}
                fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21C12 21 4 13.5 4 8.5C4 5.5 6.5 3 9.5 3C11.04 3 12.5 3.99 13.07 5.36C13.64 3.99 15.1 3 16.65 3C19.65 3 22.1 5.5 22.1 8.5C22.1 13.5 12 21 12 21Z" />
              </svg>
              <svg
                className={`absolute left-0 top-0 w-4 h-4 transition-all duration-300 ${appreciated ? (iconAnimating ? 'scale-125 opacity-0' : 'scale-100 opacity-100') : 'scale-0 opacity-0'}`}
                fill={appreciated ? "#ef4444" : "none"} stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21C12 21 4 13.5 4 8.5C4 5.5 6.5 3 9.5 3C11.04 3 12.5 3.99 13.07 5.36C13.64 3.99 15.1 3 16.65 3C19.65 3 22.1 5.5 22.1 8.5C22.1 13.5 12 21 12 21Z" />
              </svg>
            </span>
            Appreciate <span className="ml-1">{appreciateCount}</span>
          </button>
          <button 
            className="flex items-center gap-1 text-gray-500 hover:text-black text-xs font-medium transition" 
            onClick={() => {
              if (isPublicView && onInteraction) {
                onInteraction('suggest');
              } else {
                setShowSuggestModal(true);
              }
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12v.01" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v.01" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12v.01" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 12v.01" /></svg>
            Suggest <span className="ml-1">{post.suggestCount}</span>
          </button>
          <ShareButton 
            ideaId={post._id} 
            ideaTitle={post.title} 
            onInteraction={isPublicView ? onInteraction : undefined}
          />
        </div>
      )}
      {/* Approach Modal (for proposing) */}
      {showApproachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <form onSubmit={handleSendApproach} className="bg-white border border-gray-200 shadow-2xl p-0 w-full max-w-md relative animate-modal-fade-in rounded-none">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white rounded-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-blue-600 border-2 border-white shadow overflow-hidden">
                  {post.author.avatar && post.author.avatar.startsWith('http') ? (
                    <img
                      src={post.author.avatar}
                      alt={post.author.fullName || post.author.name || 'User'}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    (post.author.fullName?.[0] || post.author.name?.[0] || 'U')
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">Approach: {post.title}</span>
                  <span className="text-xs text-gray-500">by {post.author.fullName || post.author.name}</span>
                </div>
              </div>
              <button type="button" className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowApproachModal(false)} aria-label="Close">&times;</button>
            </div>
            {/* Idea Details Section */}
            <div className="px-6 pt-4 pb-2">
              <div className="bg-white border border-gray-100 p-4 flex flex-col gap-2">
                <div className="text-base font-bold text-gray-900 mb-1">{post.title}</div>
                <div className="text-sm text-gray-700 mb-2">{post.description}</div>
                {post.infoFields && (
                  <div className="flex flex-col gap-1 text-xs text-gray-500 mb-2">
                    {post.infoFields.map((field, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {field.icon}
                        <span>{field.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {post.tags.map((tag, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Body */}
            <div className="px-6 py-6">
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Select Role</label>
                <select
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={approachRole}
                  onChange={e => setApproachRole(e.target.value)}
                  required
                >
                  {rolesArray.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-xs text-gray-500 mb-1 font-semibold">How can you help?</label>
                <textarea
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Explain your interest and how you can help in this role..."
                  value={approachMsg}
                  onChange={e => setApproachMsg(e.target.value)}
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end border-t border-gray-100 pt-4">
                <button type="button" className="bg-gray-100 text-gray-700 px-5 py-2 rounded font-semibold hover:bg-gray-200 transition" onClick={() => setShowApproachModal(false)}>Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded font-semibold hover:bg-blue-700 transition">Send</button>
              </div>
            </div>
          </form>
        </div>
      )}
      {/* Approaches List Modal */}
      {showApproachesList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-md animate-modal-fade-in relative rounded-none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-none">
              <div className="text-lg font-bold text-gray-900">Approaches <span className='font-normal text-gray-400'>({approachCount})</span></div>
              <button type="button" className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowApproachesList(false)} aria-label="Close">&times;</button>
            </div>
            <div className="px-6 py-6">
              {validApproaches.length === 0 ? (
                <div className="text-gray-400 text-center">No approaches yet.</div>
              ) : (
                <ul className="space-y-0 divide-y divide-gray-100">
                  {validApproaches.map((approach, idx) => (
                    <li key={approach._id || idx} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                      <UserAvatar
                        userId={approach.user?._id}
                        avatarUrl={approach.user?.avatar}
                        size={44}
                        isMentor={approach.user?.isMentor}
                        isInvestor={approach.user?.isInvestor}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">
                            {(() => {
                              if (!approach.user || typeof approach.user !== 'object') return 'Unknown';
                              return approach.user.fullName || approach.user.firstName || approach.user.name || 'Unknown';
                            })()}
                          </span>
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                            {typeof approach.role === 'string' ? approach.role : ''}
                          </span>
                        </div>
                        {approach.description && typeof approach.description === 'string' && (
                          <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">{approach.description}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Suggest Modal Popup */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-xl animate-modal-fade-in relative rounded-none">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-none">
              <div className="text-lg font-bold text-gray-900">Suggestions</div>
              <button type="button" className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowSuggestModal(false)} aria-label="Close">&times;</button>
            </div>
            {/* Suggestion Input */}
            <div className="px-6 pb-4 pt-6">
              <textarea
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none mb-2"
                placeholder="Add your suggestion..."
                value={suggestionInput}
                onChange={e => setSuggestionInput(e.target.value)}
                rows={2}
              />
              <div className="flex justify-end">
                <button
                  className="bg-blue-600 text-white px-5 py-2 rounded font-semibold hover:bg-blue-700 transition"
                  onClick={handleSuggest}
                  disabled={!suggestionInput.trim()}
                >
                  Submit
                </button>
              </div>
            </div>
            {/* Suggestions List */}
            <div className="px-6 pb-6">
              <div className="text-xs text-gray-500 mb-2">Previous Suggestions</div>
              <ul className="space-y-3 max-h-40 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <li key={s._id || idx} className="bg-gray-50 border border-gray-100 rounded px-3 py-2 text-sm flex items-start gap-3">
                    <UserAvatar
                      userId={s.user?._id}
                      avatarUrl={s.user?.avatar}
                      size={32}
                      isMentor={s.user?.isMentor}
                      isInvestor={s.user?.isInvestor}
                    />
                    {/* Name and content */}
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-gray-700">
                        {s.user && (s.user.fullName || s.user.name) ? (s.user.fullName || s.user.name) : 'Unknown'}
                      </span>
                      <span className="ml-2 text-gray-600">{s.content || s.description || s.text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {/* Error Popup */}
      {showErrorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-sm animate-modal-fade-in relative rounded-none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white rounded-none">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="text-lg font-bold text-gray-900">Cannot Approach</div>
              </div>
              <button type="button" className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowErrorPopup(false)} aria-label="Close">&times;</button>
            </div>
            <div className="px-6 py-6 text-center">
              <div className="mb-4">
                <p className="text-sm text-gray-700 leading-relaxed">{errorMessage}</p>
              </div>
              <div className="flex justify-center">
                <button
                  className="bg-orange-600 text-white px-6 py-2 rounded font-semibold hover:bg-orange-700 transition text-sm"
                  onClick={() => setShowErrorPopup(false)}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Idea Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <form onSubmit={handleEditIdea} className="bg-white border border-gray-200 shadow-2xl w-full max-w-2xl animate-modal-fade-in relative rounded-none max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white rounded-none sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="text-lg font-bold text-gray-900">Edit Idea</div>
              </div>
              <button type="button" className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowEditModal(false)} aria-label="Close">&times;</button>
            </div>
            
            {/* Form Content */}
            <div className="px-6 py-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Idea Title</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={editForm.title}
                  onChange={(e) => handleEditFormChange('title', e.target.value)}
                  placeholder="Enter your idea title"
                  required
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Description</label>
                <textarea
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                  value={editForm.description}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                  placeholder="Describe your idea in detail"
                  rows={4}
                  required
                />
              </div>
              
              {/* Target Audience */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Target Audience</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={editForm.targetAudience}
                  onChange={(e) => handleEditFormChange('targetAudience', e.target.value)}
                  placeholder="Who is your target audience?"
                />
              </div>
              
              {/* Market Alternatives */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Market Alternatives</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={editForm.marketAlternatives}
                  onChange={(e) => handleEditFormChange('marketAlternatives', e.target.value)}
                  placeholder="What alternatives exist in the market?"
                />
              </div>
              
              {/* Problem Statement */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Problem Statement</label>
                <textarea
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                  value={editForm.problemStatement}
                  onChange={(e) => handleEditFormChange('problemStatement', e.target.value)}
                  placeholder="What problem does your idea solve?"
                  rows={3}
                />
              </div>
              
              {/* Unique Value */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Unique Value Proposition</label>
                <textarea
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                  value={editForm.uniqueValue}
                  onChange={(e) => handleEditFormChange('uniqueValue', e.target.value)}
                  placeholder="What makes your idea unique?"
                  rows={3}
                />
              </div>
              
              {/* Needed Roles */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Needed Roles</label>
                <div className="flex flex-wrap gap-2">
                  {approachRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        editForm.neededRoles.includes(role)
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                      onClick={() => {
                        const updatedRoles = editForm.neededRoles.includes(role)
                          ? editForm.neededRoles.filter(r => r !== role)
                          : [...editForm.neededRoles, role];
                        handleEditFormChange('neededRoles', updatedRoles);
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded font-semibold hover:bg-gray-50 transition text-sm"
                onClick={() => setShowEditModal(false)}
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition text-sm disabled:opacity-50"
                disabled={editLoading || !editForm.title.trim() || !editForm.description.trim()}
              >
                {editLoading ? 'Updating...' : 'Update Idea'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Privacy Settings Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-md animate-modal-fade-in relative rounded-none">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white rounded-none">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="text-lg font-bold text-gray-900">Privacy Settings</div>
              </div>
              <button type="button" className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowPrivacyModal(false)} aria-label="Close">&times;</button>
            </div>
            
            {/* Form Content */}
            <form onSubmit={handlePrivacyUpdate} className="px-6 py-6 space-y-4">
              {/* Current Privacy Status */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                <div className="text-sm font-semibold text-purple-800 mb-1">Current Privacy</div>
                <div className="text-sm text-purple-700">
                  {privacyForm.privacy === 'Public' && '🌍 Public - Visible to everyone'}
                  {privacyForm.privacy === 'Private' && '🔒 Private - Only visible to you'}
                  {privacyForm.privacy === 'Team' && '👥 Team - Visible to team members'}
                </div>
              </div>
              
              {/* Idea Privacy Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Change Idea Privacy</label>
                <div className="space-y-3">
                  {/* Public Option */}
                  <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    privacyForm.privacy === 'Public' 
                      ? 'border-purple-300 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-200'
                  }`} onClick={() => handlePrivacyChange('privacy', 'Public')}>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        privacyForm.privacy === 'Public' 
                          ? 'border-purple-600 bg-purple-600' 
                          : 'border-gray-300'
                      }`}>
                        {privacyForm.privacy === 'Public' && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">🌍 Public</div>
                        <div className="text-xs text-gray-500">Visible to everyone on the platform</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Team Option */}
                  <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    privacyForm.privacy === 'Team' 
                      ? 'border-purple-300 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-200'
                  }`} onClick={() => handlePrivacyChange('privacy', 'Team')}>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        privacyForm.privacy === 'Team' 
                          ? 'border-purple-600 bg-purple-600' 
                          : 'border-gray-300'
                      }`}>
                        {privacyForm.privacy === 'Team' && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">👥 Team</div>
                        <div className="text-xs text-gray-500">Visible to team members and collaborators</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Private Option */}
                  <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    privacyForm.privacy === 'Private' 
                      ? 'border-purple-300 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-200'
                  }`} onClick={() => handlePrivacyChange('privacy', 'Private')}>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        privacyForm.privacy === 'Private' 
                          ? 'border-purple-600 bg-purple-600' 
                          : 'border-gray-300'
                      }`}>
                        {privacyForm.privacy === 'Private' && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">🔒 Private</div>
                        <div className="text-xs text-gray-500">Only visible to you</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded font-semibold hover:bg-gray-50 transition text-sm"
                  onClick={() => setShowPrivacyModal(false)}
                  disabled={privacyLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700 transition text-sm disabled:opacity-50"
                  disabled={privacyLoading}
                >
                  {privacyLoading ? 'Updating...' : 'Update Idea Privacy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* NDA Management Modal */}
      {showNDAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-lg animate-modal-fade-in relative rounded-none max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white rounded-none sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-lg font-bold text-gray-900">NDA Management</div>
              </div>
              <button type="button" className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowNDAModal(false)} aria-label="Close">&times;</button>
            </div>
            
            {/* Content */}
            <div className="px-6 py-6">
              {/* Current NDA Protection Status */}
              <div className={`p-4 border rounded mb-4 ${
                ndaProtection 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`text-sm font-semibold mb-2 ${
                  ndaProtection ? 'text-green-800' : 'text-gray-800'
                }`}>
                  {ndaProtection ? '🔒 NDA Protection Active' : '🔓 No NDA Protection'}
                </div>
                <div className={`text-sm ${
                  ndaProtection ? 'text-green-700' : 'text-gray-700'
                }`}>
                  {ndaProtection 
                    ? 'This idea is protected by NDA. Other users will see blurred content and must sign the agreement to view details.'
                    : 'Enable NDA protection to require users to sign an agreement before viewing this idea.'
                  }
                </div>
              </div>
              
              {/* NDA Protection Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">NDA Protection</div>
                    <div className="text-xs text-gray-500">
                      {ndaProtection 
                        ? 'Content is blurred for other users' 
                        : 'Content is visible to everyone'
                      }
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleNDAProtectionToggle}
                    disabled={ndaLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      ndaProtection ? 'bg-green-600' : 'bg-gray-300'
                    } ${ndaLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      ndaProtection ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                {ndaProtection && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-semibold text-blue-800 mb-2">How it works:</div>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Other users will see blurred content</li>
                      <li>• They must click to sign the NDA agreement</li>
                      <li>• After signing, they can view the full content</li>
                      <li>• You'll receive email notifications of NDA signings</li>
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded font-semibold hover:bg-gray-50 transition text-sm"
                  onClick={() => setShowNDAModal(false)}
                  disabled={ndaLoading}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* NDA Agreement Form Modal */}
      {showNDAAgreementForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-lg animate-modal-fade-in relative rounded-none max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white rounded-none sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-lg font-bold text-gray-900">Sign NDA Agreement</div>
              </div>
              <button type="button" className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" onClick={() => setShowNDAAgreementForm(false)} aria-label="Close">&times;</button>
            </div>
            
            {/* Content */}
            <div className="px-6 py-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">NDA Agreement for: {post.title}</h3>
                <p className="text-sm text-gray-600">By signing this agreement, you agree to maintain confidentiality of the information shared.</p>
              </div>
              
              <form onSubmit={handleNDAAgreementSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={ndaAgreementForm.signerName}
                      onChange={(e) => handleNDAAgreementChange('signerName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={ndaAgreementForm.signerEmail}
                      onChange={(e) => handleNDAAgreementChange('signerEmail', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={ndaAgreementForm.companyName}
                      onChange={(e) => handleNDAAgreementChange('companyName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={ndaAgreementForm.position}
                      onChange={(e) => handleNDAAgreementChange('position', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Digital Signature *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Type your full name as signature"
                    value={ndaAgreementForm.signature}
                    onChange={(e) => handleNDAAgreementChange('signature', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      checked={ndaAgreementForm.agreeToTerms}
                      onChange={(e) => handleNDAAgreementChange('agreeToTerms', e.target.checked)}
                      className="mt-1"
                      required
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                      I agree to the terms and conditions of this NDA agreement *
                    </label>
                  </div>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreeToConfidentiality"
                      checked={ndaAgreementForm.agreeToConfidentiality}
                      onChange={(e) => handleNDAAgreementChange('agreeToConfidentiality', e.target.checked)}
                      className="mt-1"
                      required
                    />
                    <label htmlFor="agreeToConfidentiality" className="text-sm text-gray-700">
                      I agree to maintain confidentiality of all information shared *
                    </label>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded font-semibold hover:bg-gray-50 transition text-sm"
                    onClick={() => setShowNDAAgreementForm(false)}
                    disabled={ndaAgreementLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition text-sm disabled:opacity-50"
                    disabled={ndaAgreementLoading || !ndaAgreementForm.agreeToTerms || !ndaAgreementForm.agreeToConfidentiality || !ndaAgreementForm.signature}
                  >
                    {ndaAgreementLoading ? 'Signing...' : 'Sign NDA'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrainstormPost; 