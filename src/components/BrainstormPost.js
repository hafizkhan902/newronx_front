import React, { useState, useEffect, useRef } from 'react';
import UserAvatar from './UserAvatar';
import ShareButton from './ShareButton';
import { useUser } from '../UserContext';
import ConflictResolutionModal from './brainstorming/sections/ConflictResolutionModal';

const infoFields = [
  {
    key: 'targetAudience',
    label: 'Audience',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="4" /><path d="M3 21c0-4 2.7-7 6-7h1" strokeLinecap="round" />
        <circle cx="17" cy="9" r="3" /><path d="M21 21c0-3-1.8-5-4-5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'problemStatement',
    label: 'Problem',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    key: 'marketAlternatives',
    label: 'Rivals',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="2" y="7" width="8" height="6" rx="1.5" /><rect x="14" y="7" width="8" height="6" rx="1.5" />
        <rect x="5" y="15" width="8" height="5" rx="1.5" /><rect x="11" y="15" width="8" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    key: 'uniqueValue',
    label: 'Unique',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l1.5 4.5L12 5l5.5 2.5L19 3M12 5v14M5 21h14" />
        <path strokeLinecap="round" d="M9 12h6M9 16h6" />
      </svg>
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

function BrainstormPost({ post, onApproach, setSelectedUserId, onInteraction, isPublicView = false, onNavigateToInbox }) {
  const { user } = useUser(); // Get current user
  const [showApproachModal, setShowApproachModal] = useState(false);
  const [showApproachesList, setShowApproachesList] = useState(false);
  const [approachRole, setApproachRole] = useState(approachRoles[0]);
  const [approachMsg, setApproachMsg] = useState('');
  // Appreciation state
  const [appreciated, setAppreciated] = useState(!!post.appreciated);
  const [appreciateCount, setAppreciateCount] = useState(post.appreciateCount || 0);
  const [_iconAnimating, setIconAnimating] = useState(false); // eslint-disable-line no-unused-vars
  // Suggestion modal state
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestionInput, setSuggestionInput] = useState("");
  const [suggestions, setSuggestions] = useState(post.suggestions || []);
  const [suggestionCount, setSuggestionCount] = useState(post.suggestCount || 0);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
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

  // Handle approach acceptance response according to backend recommendation
  const handleApproachAccepted = (response) => {
    const { collaborationChat } = response.data || {};
    
    if (!collaborationChat) {
      // Fallback for old response format
      showNotification(`✅ Approach accepted! ${response.message}`);
      return;
    }
    
    if (collaborationChat.action === 'created_new') {
      // Show "New chat created" UI
      const chatName = collaborationChat.chatName || post.title;
      showNotification(`🆕 New collaboration chat created: ${chatName}`);
      
      // Add new chat to chat list
      addChatToList(collaborationChat);
      
      // Trigger chat created event for real-time updates
      window.dispatchEvent(new CustomEvent('chatCreated', {
        detail: { 
          chatId: collaborationChat.chatId, 
          chatName: chatName, 
          type: 'idea_collaboration' 
        }
      }));
      
      console.log(`✅ [BrainstormPost] New collaboration chat created: ${chatName} (ID: ${collaborationChat.chatId})`);
      
    } else if (collaborationChat.action === 'added_to_existing') {
      // Show "Member added" UI
      const approacherName = response.data.approach?.user?.fullName || 'Team member';
      showNotification(`👥 ${approacherName} added to ${collaborationChat.chatName}`);
      
      // Update existing chat member count
      updateChatMemberCount(collaborationChat.chatId, collaborationChat.memberCount);
      
      console.log(`✅ [BrainstormPost] Member added to existing chat: ${collaborationChat.chatName} (ID: ${collaborationChat.chatId})`);
    }
  };

  // Show notification to user
  const showNotification = (message) => {
    setErrorMessage(message);
    setShowErrorPopup(true);
  };

  // Add new chat to the chat list (triggers inbox refresh)
  const addChatToList = (collaborationChat) => {
    // Dispatch event to refresh inbox chat list
    window.dispatchEvent(new CustomEvent('chatListUpdate', {
      detail: { type: 'add', chat: collaborationChat }
    }));
  };

  // Update existing chat member count
  const updateChatMemberCount = (chatId, memberCount) => {
    // Dispatch event to update specific chat in inbox
    window.dispatchEvent(new CustomEvent('chatListUpdate', {
      detail: { type: 'update', chatId, memberCount }
    }));
  };

  const handleApproachAction = async (approachId, action, resolution = null) => {
    try {
      console.log(`[BrainstormPost] ${action} approach:`, approachId, resolution ? 'with resolution' : '');
      
      const requestBody = {
        status: action
      };
      
      if (resolution) {
        requestBody.resolution = resolution;
      }
      
      const res = await fetch(`/api/ideas/${post._id}/approaches/${approachId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const response = await res.json();
      console.log(`[BrainstormPost] API Response:`, response);
      
      // Handle conflict detection (409 status)
      if (res.status === 409 && response.conflict) {
        console.log('⚠️ [BrainstormPost] Conflict detected, showing resolution modal');
        
        // Show conflict resolution modal
        setConflictModal({
          conflictData: response.data.conflictData,
          approach: response.data.approach,
          approachId,
          onResolve: (resolution) => handleApproachAction(approachId, action, resolution),
          onCancel: () => setConflictModal(null)
        });
        return;
      }
      
      if (!res.ok) {
        throw new Error(response.message || `Failed to ${action} approach`);
      }
      
      // Update local state immediately for better UX
      setRealApproaches(prevApproaches => 
        prevApproaches.map(approach => 
          approach._id === approachId 
            ? { ...approach, status: action }
            : approach
        )
      );
      
      // Close conflict modal if it was open
      setConflictModal(null);
      
      // Handle chat creation for selected approaches
      if (action === 'selected' && response.success) {
        // Use the backend's recommended approach for handling chat creation/addition
        handleApproachAccepted(response);
        
        // Navigate to inbox if chat was created/updated
        if (onNavigateToInbox && response.data?.collaborationChat?.chatId) {
          setTimeout(() => {
            console.log(`🚀 [BrainstormPost] Navigating to inbox with chatId: ${response.data.collaborationChat.chatId}`);
            onNavigateToInbox(response.data.collaborationChat.chatId);
          }, 2000);
        }
      }
        
      // Close approaches modal
      setShowApproachesList(false);
      
      // Show simple success message for non-selected actions
      if (action === 'queued') {
        setErrorMessage('✅ Approach queued for later review.');
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
      } else if (action === 'declined') {
        setErrorMessage('❌ Approach declined.');
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
      }
      
      console.log(`[BrainstormPost] Successfully ${action} approach`);
      
    } catch (err) {
      console.error(`[BrainstormPost] Error ${action} approach:`, err);
      setErrorMessage(err.message || `Failed to ${action} approach`);
      setShowErrorPopup(true);
      setConflictModal(null); // Close conflict modal on error
    }
  };

  // Fetch suggestions from the correct API endpoint
  const fetchSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const res = await fetch(`/api/ideas/${post._id}/suggestions`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSuggestions(data.data.suggestions || []);
          setSuggestionCount(data.data.pagination?.totalSuggestions || data.data.suggestions?.length || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Load suggestions when modal opens
  useEffect(() => {
    if (showSuggestModal) {
      fetchSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuggestModal]);

  const handleSuggest = async () => {
    if (!suggestionInput.trim()) return;
    try {
      const res = await fetch(`/api/ideas/${post._id}/suggestion`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: suggestionInput })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit suggestion');
      }
      
      const data = await res.json();
      if (data.success) {
        // Update suggestion count from response
        setSuggestionCount(data.data.totalSuggestions || suggestionCount + 1);
        // Refresh suggestions list
        await fetchSuggestions();
        setSuggestionInput("");
      }
    } catch (err) {
      console.error('Error submitting suggestion:', err);
      // Optionally show error to user
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

  // Conflict resolution state
  const [conflictModal, setConflictModal] = useState(null);

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

  // Tag color palette — cycles through a set of brand-friendly pill colors
  const tagPalette = [
    'bg-teal-50 text-teal-700 border-teal-200',
    'bg-indigo-50 text-indigo-700 border-indigo-200',
    'bg-violet-50 text-violet-700 border-violet-200',
    'bg-sky-50 text-sky-700 border-sky-200',
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'bg-rose-50 text-rose-700 border-rose-200',
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow relative">

      {/* ── Header row: avatar · name · time · bookmark · menu ─── */}
      <div className="flex items-center gap-3">
        <UserAvatar
          userId={post.author._id}
          avatarUrl={post.author.avatar}
          size={40}
          isMentor={post.author.isMentor}
          isInvestor={post.author.isInvestor}
        />
        <div className="flex-1 min-w-0">
          <span className="text-sm text-gray-900 font-semibold block truncate">
            {post.author.fullName || post.author.name}
          </span>
          <span className="text-xs text-gray-400">{post.time}</span>
        </div>

        {/* Approach count — small teal badge */}
        <button
          onClick={() => setShowApproachesList(true)}
          className="flex items-center gap-1 px-2 py-1 bg-teal-50 border border-teal-200 text-teal-600 rounded-lg text-xs font-semibold hover:bg-teal-100 active:scale-95 transition-all shrink-0 touch-manipulation"
          title="View approaches"
        >
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>{approachCount}</span>
        </button>

        {/* Bookmark icon */}
        <button className="p-1.5 text-gray-300 hover:text-indigo-500 transition-colors focus:outline-none" aria-label="Bookmark">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        {/* Three-dot menu for own posts */}
        {isOwnPost && (
          <div className="relative" ref={threeDotMenuRef}>
            <button
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition focus:outline-none"
              onClick={() => setShowThreeDotMenu(!showThreeDotMenu)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showThreeDotMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[140px] overflow-hidden">
                <button
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
                  onClick={() => { setShowEditModal(true); setShowThreeDotMenu(false); }}
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Idea
                </button>
                <button
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition border-t border-gray-100"
                  onClick={() => { setShowPrivacyModal(true); setShowThreeDotMenu(false); }}
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Privacy
                </button>
                <button
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition border-t border-gray-100"
                  onClick={() => { setShowNDAModal(true); setShowThreeDotMenu(false); }}
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  NDA
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── NDA-protected content block ─────────────────────────── */}
      <div className={`relative ${showNDABlur ? 'cursor-pointer' : ''}`} onClick={handleNDAContentClick}>
        <div className={showNDABlur ? 'filter blur-sm pointer-events-none' : ''}>
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-1.5 leading-snug">{post.title}</h3>
          {/* Description */}
          <p className="text-gray-500 text-sm mb-4 leading-relaxed line-clamp-2">{post.description}</p>

          {/* Post image */}
          {Array.isArray(post.images) && post.images.length > 0 && post.images[0].url && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img
                src={post.images[0].url}
                alt={post.title}
                className="w-full object-cover max-h-52"
              />
            </div>
          )}

          {/* Info chips */}
          {infoFields.some(f => post[f.key]) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4">
              {infoFields.map((field) => {
                const value = post[field.key];
                if (!value) return null;
                return (
                  <div
                    key={field.key}
                    className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 min-w-0"
                  >
                    <span className="text-gray-400 text-xs shrink-0">{field.label}:</span>
                    <span className="text-gray-600 text-xs truncate">{value}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tags — colored uppercase pills */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, i) => (
                <span
                  key={tag}
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${tagPalette[i % tagPalette.length]}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* NDA blur overlay */}
        {showNDABlur && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
            <div className="text-center px-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Protected by NDA</h3>
              <p className="text-xs text-gray-500 mb-3">Sign the agreement to view this idea.</p>
              <button className="bg-indigo-600 text-white text-xs px-4 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition">
                Sign NDA to View
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Privacy badge */}
      {post.privacy && post.privacy !== 'Public' && (
        <div className="flex">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
            post.privacy === 'Private'
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-blue-50 text-blue-600 border-blue-200'
          }`}>
            {post.privacy === 'Private' ? 'Private' : post.privacy === 'Team' ? 'Team' : post.privacy}
          </span>
        </div>
      )}

      {/* ── Action row ─────────────────────────────────────────── */}
      {!post.hideActions && (
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          {/* Like */}
          <button
            onClick={() => { isPublicView && onInteraction ? onInteraction('appreciate') : handleAppreciate(); }}
            className={`flex items-center gap-1.5 text-sm font-medium transition-all active:scale-95 touch-manipulation ${
              appreciated ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'
            }`}
          >
            <svg className="w-5 h-5 shrink-0" fill={appreciated ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21C12 21 4 13.5 4 8.5C4 5.5 6.5 3 9.5 3C11.04 3 12.5 3.99 13.07 5.36C13.64 3.99 15.1 3 16.65 3C19.65 3 22.1 5.5 22.1 8.5C22.1 13.5 12 21 12 21Z" />
            </svg>
            {appreciateCount > 0 && <span className="tabular-nums">{appreciateCount.toLocaleString()}</span>}
          </button>

          {/* Comments / Suggestions */}
          <button
            onClick={() => { isPublicView && onInteraction ? onInteraction('suggest') : setShowSuggestModal(true); }}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-indigo-500 transition-all active:scale-95 touch-manipulation"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {suggestionCount > 0 && <span className="tabular-nums">{suggestionCount}</span>}
          </button>

          {/* Share */}
          <div className="text-gray-400 hover:text-indigo-500 transition">
            <ShareButton ideaId={post._id} ideaTitle={post.title} onInteraction={isPublicView ? onInteraction : undefined} />
          </div>

          {/* Right side CTA */}
          <div className="ml-auto shrink-0">
            {isOwnPost ? (
              <button
                onClick={() => setShowApproachesList(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
              >
                View Full Blueprint <span aria-hidden="true">→</span>
              </button>
            ) : (
              <button
                onClick={() => { isPublicView && onInteraction ? onInteraction('approach') : setShowApproachModal(true); }}
                className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all touch-manipulation"
              >
                Join Core Team
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
      {/* Approach Modal */}
      {showApproachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleSendApproach} className="bg-zinc-900 border border-zinc-700 w-full max-w-md relative rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-emerald-400 overflow-hidden">
                  {post.author.avatar?.startsWith('http') ? (
                    <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (post.author.fullName?.[0] || 'U')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{post.title}</p>
                  <p className="text-xs text-zinc-500">by {post.author.fullName || post.author.name}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowApproachModal(false)} className="text-zinc-500 hover:text-white text-xl font-bold">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-semibold">Select Role</label>
                <select
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  value={approachRole} onChange={e => setApproachRole(e.target.value)} required
                >
                  {rolesArray.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-semibold">How can you help?</label>
                <textarea
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none resize-none"
                  placeholder="Explain your interest and how you can help..."
                  value={approachMsg} onChange={e => setApproachMsg(e.target.value)} rows={3} required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-zinc-800">
                <button type="button" className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-700 transition" onClick={() => setShowApproachModal(false)}>Cancel</button>
                <button type="submit" className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-500 transition">Send</button>
              </div>
            </div>
          </form>
        </div>
      )}
      {/* Approaches List Modal */}
      {showApproachesList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md relative rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <p className="text-base font-bold text-white">Approaches <span className="font-normal text-zinc-500">({approachCount})</span></p>
              <button type="button" onClick={() => setShowApproachesList(false)} className="text-zinc-500 hover:text-white text-xl font-bold">&times;</button>
            </div>
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              {validApproaches.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">No approaches yet.</p>
              ) : (
                <ul className="divide-y divide-zinc-800">
                  {validApproaches.map((approach, idx) => (
                    <li key={approach._id || idx} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0 group">
                      <UserAvatar userId={approach.user?._id} avatarUrl={approach.user?.avatar} size={38} isMentor={approach.user?.isMentor} isInvestor={approach.user?.isInvestor} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-white">
                            {(!approach.user || typeof approach.user !== 'object') ? 'Unknown' : (approach.user.fullName || approach.user.firstName || approach.user.name || 'Unknown')}
                          </span>
                          {approach.role && <span className="text-xs text-zinc-400 bg-zinc-800 rounded px-2 py-0.5">{approach.role}</span>}
                          {approach.status && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              approach.status === 'selected' ? 'bg-emerald-900/50 text-emerald-400' :
                              approach.status === 'queued' ? 'bg-yellow-900/50 text-yellow-400' :
                              approach.status === 'declined' ? 'bg-red-900/50 text-red-400' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>{approach.status === 'selected' ? 'Selected' : approach.status === 'queued' ? 'Queued' : approach.status === 'declined' ? 'Declined' : 'Pending'}</span>
                          )}
                        </div>
                        {approach.description && <p className="text-sm text-zinc-400 mt-1">{approach.description}</p>}
                      </div>
                      {isOwnPost && (!approach.status || approach.status === 'pending') && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleApproachAction(approach._id, 'selected')} className="p-1.5 rounded-lg hover:bg-emerald-900/40 text-emerald-500 transition" title="Accept">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button onClick={() => handleApproachAction(approach._id, 'queued')} className="p-1.5 rounded-lg hover:bg-yellow-900/40 text-yellow-500 transition" title="Queue">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                          <button onClick={() => handleApproachAction(approach._id, 'declined')} className="p-1.5 rounded-lg hover:bg-red-900/40 text-red-500 transition" title="Decline">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Suggest Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg relative rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <p className="text-base font-bold text-white">Suggestions</p>
              <button type="button" onClick={() => setShowSuggestModal(false)} className="text-zinc-500 hover:text-white text-xl font-bold">&times;</button>
            </div>
            <div className="px-6 pt-5 pb-4">
              <textarea
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none resize-none mb-2"
                placeholder="Add your suggestion..."
                value={suggestionInput} onChange={e => setSuggestionInput(e.target.value)} rows={2}
              />
              <div className="flex justify-end">
                <button className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-emerald-500 transition disabled:opacity-40" onClick={handleSuggest} disabled={!suggestionInput.trim()}>Submit</button>
              </div>
            </div>
            <div className="px-6 pb-5">
              <p className="text-xs text-zinc-500 mb-2">Previous Suggestions ({suggestionCount})</p>
              {loadingSuggestions ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500" />
                  <span className="ml-2 text-sm text-zinc-500">Loading...</span>
                </div>
              ) : suggestions.length > 0 ? (
                <ul className="space-y-2 max-h-44 overflow-y-auto">
                  {suggestions.map((s, idx) => (
                    <li key={s._id || idx} className="bg-zinc-800 rounded-xl px-3 py-2 text-sm flex items-start gap-2">
                      <UserAvatar userId={s.user?._id} avatarUrl={s.user?.avatar} size={28} isMentor={s.user?.isMentor} isInvestor={s.user?.isInvestor} />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-zinc-300 text-xs">{s.user?.fullName || s.user?.name || 'Unknown'}</span>
                        <span className="ml-1.5 text-zinc-400 text-xs">{s.content || s.description || s.text}</span>
                        <p className="text-xs text-zinc-600 mt-0.5">{new Date(s.createdAt).toLocaleDateString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center py-3 text-zinc-600 text-sm">No suggestions yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Error / Info Popup */}
      {showErrorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm relative rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <p className="text-base font-bold text-white">Notice</p>
              <button type="button" onClick={() => setShowErrorPopup(false)} className="text-zinc-500 hover:text-white text-xl font-bold">&times;</button>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">{errorMessage}</p>
              <button className="bg-zinc-700 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-600 transition" onClick={() => setShowErrorPopup(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Idea Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleEditIdea} className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl relative rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
              <p className="text-base font-bold text-white">Edit Idea</p>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-zinc-500 hover:text-white text-xl font-bold">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: 'Idea Title', field: 'title', type: 'input', placeholder: 'Enter your idea title', required: true },
                { label: 'Description', field: 'description', type: 'textarea', placeholder: 'Describe your idea', rows: 4, required: true },
                { label: 'Target Audience', field: 'targetAudience', type: 'input', placeholder: 'Who is your target audience?' },
                { label: 'Market Alternatives', field: 'marketAlternatives', type: 'input', placeholder: 'Existing alternatives?' },
                { label: 'Problem Statement', field: 'problemStatement', type: 'textarea', placeholder: 'What problem does it solve?', rows: 3 },
                { label: 'Unique Value Proposition', field: 'uniqueValue', type: 'textarea', placeholder: 'What makes it unique?', rows: 3 },
              ].map(({ label, field, type, placeholder, rows, required }) => (
                <div key={field}>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-semibold">{label}</label>
                  {type === 'input' ? (
                    <input type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none" value={editForm[field]} onChange={e => handleEditFormChange(field, e.target.value)} placeholder={placeholder} required={required} />
                  ) : (
                    <textarea className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none resize-none" value={editForm[field]} onChange={e => handleEditFormChange(field, e.target.value)} placeholder={placeholder} rows={rows} required={required} />
                  )}
                </div>
              ))}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-semibold">Needed Roles</label>
                <div className="flex flex-wrap gap-2">
                  {approachRoles.map(role => (
                    <button key={role} type="button"
                      className={`px-3 py-1 rounded-full text-xs font-medium transition border ${editForm.neededRoles.includes(role) ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}
                      onClick={() => { const upd = editForm.neededRoles.includes(role) ? editForm.neededRoles.filter(r => r !== role) : [...editForm.neededRoles, role]; handleEditFormChange('neededRoles', upd); }}
                    >{role}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3">
              <button type="button" className="px-4 py-2 text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-700 transition" onClick={() => setShowEditModal(false)} disabled={editLoading}>Cancel</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition disabled:opacity-40" disabled={editLoading || !editForm.title.trim() || !editForm.description.trim()}>{editLoading ? 'Updating...' : 'Update Idea'}</button>
            </div>
          </form>
        </div>
      )}
      
      {/* Privacy Settings Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md relative rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <p className="text-base font-bold text-white">Privacy Settings</p>
              <button type="button" onClick={() => setShowPrivacyModal(false)} className="text-zinc-500 hover:text-white text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handlePrivacyUpdate} className="px-6 py-5 space-y-3">
              {[
                { value: 'Public', label: 'Public', desc: 'Visible to everyone on the platform' },
                { value: 'Team', label: 'Team', desc: 'Visible to team members only' },
                { value: 'Private', label: 'Private', desc: 'Only visible to you' },
              ].map(opt => (
                <div key={opt.value} onClick={() => handlePrivacyChange('privacy', opt.value)}
                  className={`border rounded-xl p-3 cursor-pointer transition-all flex items-center gap-3 ${privacyForm.privacy === opt.value ? 'border-emerald-600/50 bg-emerald-900/20' : 'border-zinc-700 hover:border-zinc-600'}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${privacyForm.privacy === opt.value ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-600'}`}>
                    {privacyForm.privacy === opt.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{opt.label}</p>
                    <p className="text-xs text-zinc-500">{opt.desc}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button type="button" className="px-4 py-2 text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-700 transition" onClick={() => setShowPrivacyModal(false)} disabled={privacyLoading}>Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition disabled:opacity-40" disabled={privacyLoading}>{privacyLoading ? 'Updating...' : 'Update Privacy'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* NDA Management Modal */}
      {showNDAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg relative rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
              <p className="text-base font-bold text-white">NDA Management</p>
              <button type="button" onClick={() => setShowNDAModal(false)} className="text-zinc-500 hover:text-white text-xl font-bold">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className={`p-4 border rounded-xl text-sm ${ndaProtection ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                {ndaProtection ? 'NDA Protection Active — other users see blurred content.' : 'No NDA protection. Content is visible to everyone.'}
              </div>
              <div className="flex items-center justify-between p-4 border border-zinc-700 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-white">NDA Protection</p>
                  <p className="text-xs text-zinc-500">{ndaProtection ? 'Content is blurred for others' : 'Content visible to everyone'}</p>
                </div>
                <button type="button" onClick={handleNDAProtectionToggle} disabled={ndaLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ndaProtection ? 'bg-emerald-600' : 'bg-zinc-700'} ${ndaLoading ? 'opacity-50' : 'cursor-pointer'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${ndaProtection ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex justify-end pt-2 border-t border-zinc-800">
                <button type="button" className="px-4 py-2 text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-700 transition" onClick={() => setShowNDAModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* NDA Agreement Form Modal */}
      {showNDAAgreementForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg relative rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
              <p className="text-base font-bold text-white">Sign NDA Agreement</p>
              <button type="button" onClick={() => setShowNDAAgreementForm(false)} className="text-zinc-500 hover:text-white text-xl font-bold">&times;</button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-zinc-400 mb-4">By signing, you agree to maintain confidentiality of the information shared in <strong className="text-white">{post.title}</strong>.</p>
              <form onSubmit={handleNDAAgreementSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Full Name *', field: 'signerName', type: 'text', required: true },
                    { label: 'Email *', field: 'signerEmail', type: 'email', required: true },
                    { label: 'Company', field: 'companyName', type: 'text' },
                    { label: 'Position', field: 'position', type: 'text' },
                  ].map(({ label, field, type, required }) => (
                    <div key={field}>
                      <label className="block text-xs text-zinc-400 mb-1 font-semibold">{label}</label>
                      <input type={type} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none" value={ndaAgreementForm[field]} onChange={e => handleNDAAgreementChange(field, e.target.value)} required={required} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1 font-semibold">Digital Signature *</label>
                  <input type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none" placeholder="Type your full name" value={ndaAgreementForm.signature} onChange={e => handleNDAAgreementChange('signature', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'agreeToTerms', field: 'agreeToTerms', label: 'I agree to the terms and conditions of this NDA *' },
                    { id: 'agreeToConfidentiality', field: 'agreeToConfidentiality', label: 'I agree to maintain confidentiality of all information shared *' },
                  ].map(({ id, field, label }) => (
                    <div key={id} className="flex items-start gap-3">
                      <input type="checkbox" id={id} checked={ndaAgreementForm[field]} onChange={e => handleNDAAgreementChange(field, e.target.checked)} className="mt-0.5 accent-emerald-500" required />
                      <label htmlFor={id} className="text-sm text-zinc-400">{label}</label>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button type="button" className="px-4 py-2 text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-700 transition" onClick={() => setShowNDAAgreementForm(false)} disabled={ndaAgreementLoading}>Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition disabled:opacity-40" disabled={ndaAgreementLoading || !ndaAgreementForm.agreeToTerms || !ndaAgreementForm.agreeToConfidentiality || !ndaAgreementForm.signature}>{ndaAgreementLoading ? 'Signing...' : 'Sign NDA'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {conflictModal && (
        <ConflictResolutionModal {...conflictModal} />
      )}
    </div>
  );
}

export default BrainstormPost; 