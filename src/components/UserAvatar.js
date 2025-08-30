import React, { useState, useEffect } from 'react';
import defaultAvatar from '../default_avatar.png';
import PublicProfile from './brainstorming/sections/PublicProfile';
import { useUser } from '../UserContext';
import './brainstorming/sections/profile.css';

function UserAvatar({ userId, avatarUrl, size = 36, onClick, isMentor = false, isInvestor = false }) {
  const [showProfile, setShowProfile] = useState(false);
  const { user } = useUser();

  // Handle ESC key to close profile
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showProfile) {
        setShowProfile(false);
      }
    };

    if (showProfile) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when profile is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore body scroll
      document.body.style.overflow = 'unset';
    };
  }, [showProfile]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      // If parent provides onClick, use that instead of showing popup
      onClick(userId);
    } else if (userId) {
      // Check if clicking on own avatar - if so, don't show public profile popup
      if (user && String(userId) === String(user._id)) {
        return; // Don't show popup for own avatar
      }
      // Only show popup if no parent onClick handler is provided
      setShowProfile(true);
    }
  };

  const handleCloseProfile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowProfile(false);
  };

  // Calculate badge size based on avatar size - subtle and professional
  const badgeSize = Math.max(14, size * 0.25);
  
  // Debug logging for badges (only when badges should be visible)
  if (isMentor) {
    console.log('🎯 UserAvatar - Mentor badge should be visible:', { userId, isMentor, size, badgeSize });
  }
  if (isInvestor) {
    console.log('💰 UserAvatar - Investor badge should be visible:', { userId, isInvestor, size, badgeSize });
  }
  


  return (
    <>
      <div className="relative inline-block avatar_view">
        <img
          src={avatarUrl && String(avatarUrl).trim() !== '' ? avatarUrl : defaultAvatar}
          alt="avatar"
          className="rounded-full border object-cover cursor-pointer hover:opacity-80 transition-opacity"
          style={{ width: size, height: size }}
          onClick={handleClick}
          onError={e => { e.target.src = defaultAvatar; }}
        />
        
        {/* Mentor Badge - Right Side */}
        {isMentor && (
          <div 
            className="absolute bg-gray-800 rounded-full border-2 border-white shadow-md flex items-center justify-center z-20"
            style={{ 
              width: badgeSize, 
              height: badgeSize, 
              bottom: -1, 
              right: -1,
              transform: 'translate(0, 0)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
            }}
            title="Mentor"
          >
            <svg 
              className="text-white" 
              style={{ width: badgeSize * 0.45, height: badgeSize * 0.45 }}
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
            </svg>
          </div>
        )}
        
        {/* Investor Badge - Left Side */}
        {isInvestor && (
          <div 
            className="absolute bg-green-600 rounded-full border-2 border-white shadow-md flex items-center justify-center z-20"
            style={{ 
              width: badgeSize, 
              height: badgeSize, 
              bottom: -1, 
              left: -1,
              transform: 'translate(0, 0)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
            }}
            title="Investor"
          >
            <svg 
              className="text-white" 
              style={{ width: badgeSize * 0.45, height: badgeSize * 0.45 }}
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
            </svg>
          </div>
        )}
      </div>
      
      {/* Full-screen Profile Popup */}
      {showProfile && userId && (
        <div className="fixed inset-0 z-[9999] bg-white">
          {/* Close Button - Fixed at top right */}
          <button
            className="fixed top-6 right-6 z-[10000] w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
            onClick={handleCloseProfile}
            aria-label="Close profile"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Profile Content - Full screen with scroll */}
          <div className="w-full h-full overflow-y-auto">
            <div className="min-h-full flex items-start justify-center p-6 pt-20">
              <div className="w-full max-w-4xl">
                <PublicProfile userId={userId} />
              </div>
            </div>
          </div>
          
          {/* Optional: Keyboard shortcut hint */}
          <div className="fixed bottom-6 left-6 text-xs text-gray-400">
            Press ESC to close
          </div>
        </div>
      )}
    </>
  );
}

export default UserAvatar; 