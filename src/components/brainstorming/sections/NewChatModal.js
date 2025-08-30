import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../../../UserContext';
import UserAvatar from '../../UserAvatar';
import { apiRequest } from '../../../utils/api';

function NewChatModal({ isOpen, onClose, onChatCreated }) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const searchTimeoutRef = useRef(null);

  const searchUsers = useCallback(async (query) => {
    try {
      setLoading(true);
      setError(null);

      // Don't search if query is empty or too short
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      const response = await apiRequest(`/api/users/search?q=${encodeURIComponent(query.trim())}&limit=10`);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Raw search response:', data);
        
        // Handle different possible response structures
        let users = [];
        if (data.users) {
          users = data.users;
        } else if (data.results) {
          users = data.results;
        } else if (Array.isArray(data)) {
          users = data;
        }
        
        const filteredUsers = users.filter(u => 
          u._id !== user?._id && u._id !== 'currentUser'
        );
        setSearchResults(filteredUsers);
        console.log('✅ User search results:', filteredUsers.length, 'users found');
      } else {
        console.error('❌ Failed to search users:', response.status);
        setError('Failed to search users. Please try again.');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('❌ Error searching users:', err);
      setError('Unable to search users. Please check your connection.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
      // Load all users initially
      searchUsers('');
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [isOpen, searchUsers]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(query);
    }, 300);
  };

  const createDirectChat = async (selectedUser) => {
    try {
      setCreating(true);
      setError(null);

      console.log('🔄 Creating direct chat with user:', selectedUser);
      console.log('🔄 Selected user ID:', selectedUser._id);

      // According to your API docs, only include the selected user in participants
      const requestBody = {
        type: 'direct',
        members: [selectedUser._id]
      };
      
      console.log('🔄 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await apiRequest('/api/chats', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Direct chat created:', data);
        
        // Handle different response structures
        const chat = data.chat || data;
        onChatCreated(chat);
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to create chat:', response.status, errorData);
        setError(errorData.message || 'Failed to create chat. Please try again.');
      }
    } catch (err) {
      console.error('❌ Error creating chat:', err);
      setError('Unable to create chat. Please check your connection.');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Message</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search users by name or email..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-sm"
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Unable to search users</h3>
              <p className="text-red-500 mb-4">{error}</p>
              <button 
                onClick={() => searchUsers(searchQuery)}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                {searchQuery ? 'No users found' : 'No users available'}
              </h3>
              <p className="text-xs text-gray-500">
                {searchQuery ? 'Try a different search term' : 'There are no users to message'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {searchResults.map((searchUser) => (
                <div
                  key={searchUser._id}
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => !creating && createDirectChat(searchUser)}
                >
                  <UserAvatar
                    userId={searchUser._id}
                    avatarUrl={searchUser.avatar}
                    size={48}
                    isMentor={searchUser.isMentor}
                    isInvestor={searchUser.isInvestor}
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {searchUser.fullName || searchUser.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {searchUser.email}
                    </p>
                  </div>
                  {creating ? (
                    <div className="ml-3">
                      <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : (
                    <div className="ml-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewChatModal; 