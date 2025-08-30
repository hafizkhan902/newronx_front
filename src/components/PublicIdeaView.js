import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import UserAvatar from './UserAvatar';
import BrainstormPost from './BrainstormPost';
import { useUser } from '../UserContext';
import FeatureTabs from './brainstorming/sections/FeatureTabs';
import LoginModal from './LoginModal';

const PublicIdeaView = () => {
  const { ideaId } = useParams();
  const { user, setUser } = useUser();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [interactionType, setInteractionType] = useState('');
  
  // Pending action state for retrying after login
  const [pendingAction, setPendingAction] = useState(null);

  const isAuthenticated = !!user;

  // Debug logging for authentication state
  useEffect(() => {
    console.log('🔍 PublicIdeaView - User context:', user);
    console.log('🔍 PublicIdeaView - isAuthenticated:', isAuthenticated);
  }, [user, isAuthenticated]);

  // Check authentication status and fetch user profile on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('🔍 PublicIdeaView - Checking authentication status and fetching user profile...');
        const response = await fetch('/api/users/profile', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🔍 PublicIdeaView - Profile check response status:', response.status);
        
        if (response.ok) {
          const profileData = await response.json();
          const userData = profileData.user || profileData;
          console.log('🔍 PublicIdeaView - Profile check successful:', userData);
          if (userData && !user) {
            setUser(userData);
            console.log('🔍 PublicIdeaView - User context updated from profile check');
          }
        } else {
          console.log('🔍 PublicIdeaView - Profile check failed - user not authenticated');
        }
      } catch (error) {
        console.log('🔍 PublicIdeaView - Profile check error:', error);
      }
    };

    // Only check if we don't have user data
    if (!user) {
      checkAuthStatus();
    } else {
      console.log('🔍 PublicIdeaView - User already in context, skipping profile check');
    }
  }, [user, setUser]);

  // Retry pending action after successful authentication
  const retryPendingAction = async () => {
    if (!pendingAction || !isAuthenticated) {
      console.log('🔄 No pending action or user not authenticated');
      return;
    }

    console.log('🔄 Retrying pending action:', pendingAction);
    
    try {
      let endpoint;
      let requestBody = {};
      
      switch (pendingAction.type) {
        case 'approach':
          endpoint = `/api/ideas/${pendingAction.ideaId}/approach`;
          requestBody = { 
            role: 'Developer', // Default role, could be made configurable
            description: 'I can help with this idea!' 
          };
          break;
        case 'appreciate':
          endpoint = `/api/ideas/${pendingAction.ideaId}/like`;
          break;
        case 'suggest':
          endpoint = `/api/ideas/${pendingAction.ideaId}/suggestion`;
          requestBody = { 
            content: 'Great idea! Here\'s my suggestion.' 
          };
          break;
        case 'share':
          // Share doesn't need API call, just show success
          console.log('✅ Share action completed');
          setPendingAction(null);
          return;
        default:
          console.warn('⚠️ Unknown action type:', pendingAction.type);
          setPendingAction(null);
          return;
      }
      
      const response = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Pending action completed successfully:', result);
        // Show success message
        alert(`Successfully ${pendingAction.type}ed the idea!`);
      } else {
        console.error('❌ Pending action failed:', result);
        alert(`Failed to ${pendingAction.type} the idea: ${result.message}`);
      }
      
      setPendingAction(null);
      
    } catch (error) {
      console.error('❌ Error retrying pending action:', error);
      alert(`Error completing ${pendingAction.type}: ${error.message}`);
      setPendingAction(null);
    }
  };

  // Handle login success
  const handleLoginSuccess = () => {
    console.log('✅ LoginModal - Login successful, retrying pending action...');
    setTimeout(() => {
      retryPendingAction();
    }, 1000);
  };

  useEffect(() => {
    const fetchIdea = async () => {
      try {
        setLoading(true);
        // Use proxied API path
        const response = await fetch(`/api/ideas/${ideaId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
          throw new Error('Idea not found or not publicly accessible');
        }
        const data = await response.json();
        setIdea(data.data || data);
      } catch (err) {
        console.error('Error fetching idea:', err);
        setError(err.message || 'Failed to load idea');
      } finally {
        setLoading(false);
      }
    };
    if (ideaId) {
      fetchIdea();
    }
  }, [ideaId]);

  // Handle interaction attempts by unregistered users
  const handleInteraction = (type) => {
    console.log('🔄 Interaction requested:', type);
    setInteractionType(type);
    setPendingAction({ type, ideaId });
    setShowLoginModal(true);
  };

  if (loading) {
    return (
      <main className="bg-white h-screen overflow-y-auto p-0">
        <div className="max-w-2xl mx-auto w-full bg-white border border-gray-200 p-6 relative">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading idea...</div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-white h-screen overflow-y-auto p-0">
        <div className="max-w-2xl mx-auto w-full bg-white border border-gray-200 p-6 relative">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">Error: {error}</div>
          </div>
        </div>
      </main>
    );
  }

  if (!idea) {
    return (
      <main className="bg-white h-screen overflow-y-auto p-0">
        <div className="max-w-2xl mx-auto w-full bg-white border border-gray-200 p-6 relative">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Idea not found</div>
          </div>
        </div>
      </main>
    );
  }

  // All features array for logged-in users
  const allFeatures = [
    { key: 'feed', label: 'Feed', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="4" rx="2"/><rect x="4" y="14" width="16" height="4" rx="2"/></svg>) },
    { key: 'new', label: 'New Post', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>) },
    { key: 'inbox', label: 'Inbox', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>) },
    { key: 'search', label: 'Search', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>) },
    { key: 'profile', label: 'Profile', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>) },
    { key: 'settings', label: 'Settings', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09A1.65 1.65 0 0 0-1.51 1z"/></svg>) },
  ];

  return (
    <main className="bg-white h-screen overflow-y-auto p-0">
      {/* Header with conditional content */}
      <div className="max-w-2xl mx-auto w-full bg-white border border-gray-200 p-6 relative">
        {console.log('🎨 Rendering header - isAuthenticated:', isAuthenticated, 'user:', user)}
        {/* For logged-in users: Show full navigation */}
        {isAuthenticated ? (
          <div>
            <div className="text-xs text-green-600 mb-2">✅ Logged in as: {user?.email || user?.name || 'User'}</div>
            <FeatureTabs
              features={allFeatures}
              activeFeature={null}
              setActiveFeature={(featureKey) => {
                // For logged-in users, navigate normally
                // Navigate to the main app home page
                window.location.href = '/home';
              }}
              setPhase={() => {}}
            />
          </div>
        ) : (
          /* For unregistered users: Show only Login/Sign Up buttons */
          <div>
            <div className="text-xs text-red-600 mb-2">❌ Not authenticated</div>
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    console.log('🔘 Log In button clicked!');
                    setShowLoginModal(true);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Log In
                </button>
                <Link 
                  to="/" 
                  className="bg-blue-600 text-white py-1.5 px-3 text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto w-full bg-white border border-gray-200 p-6 relative">
        {idea && (
          <BrainstormPost 
            post={idea} 
            hideActions={false}
            onInteraction={isAuthenticated ? undefined : handleInteraction}
            isPublicView={!isAuthenticated}
          />
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        title={interactionType ? `Login to ${interactionType} this idea` : 'Login to share your thoughts'}
        description={
          interactionType === 'approach' ? 'Login to approach this idea and collaborate with the author.' :
          interactionType === 'appreciate' ? 'Login to appreciate this idea and show your support.' :
          interactionType === 'suggest' ? 'Login to add suggestions and help improve this idea.' :
          interactionType === 'share' ? 'Login to share this idea and track sharing analytics.' :
          'Login to access your account and continue collaborating.'
        }
      />
    </main>
  );
};

export default PublicIdeaView; 