import React, { useState, useEffect } from 'react';
import { useUser } from '../../../UserContext';
import ChatView from './ChatView';
import NewChatModal from './NewChatModal';
import UserAvatar from '../../UserAvatar';
import { apiRequest } from '../../../utils/api';
import { ChatService } from '../../../services/chatService';

function InboxSection({ onAvatarClick, targetChatId, onChatOpened }) {
  const { user } = useUser();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChatView, setShowChatView] = useState(false);
  const [chatUnreadCounts, setChatUnreadCounts] = useState({});
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  // Auto-open specific chat when targetChatId is provided
  useEffect(() => {
    if (!targetChatId) return;

    console.log('[InboxSection] Target chat ID received:', targetChatId);
    
    // Immediately refresh chat list when targetChatId is set
    fetchChats(false).then(() => {
      let retryCount = 0;
      const maxRetries = 8; // Increased retries
      const retryInterval = 1500; // Faster retries

      const findAndOpenChat = async () => {
        console.log(`[InboxSection] Looking for target chat (attempt ${retryCount + 1}/${maxRetries}):`, targetChatId);
        console.log('[InboxSection] Current chats:', chats.map(c => ({ id: c._id, name: c.name })));
        
        // Find the chat by ID
        const targetChat = chats.find(chat => chat._id === targetChatId);
        
        if (targetChat) {
          console.log('[InboxSection] Found target chat, opening:', targetChat.name || 'Unnamed Chat');
          handleChatSelect(targetChat);
          
          // Notify parent that chat was opened
          if (onChatOpened) {
            onChatOpened();
          }
          return true; // Success
        } else {
          console.log('[InboxSection] Target chat not found, refreshing chat list...');
          await fetchChats(false); // Silent refresh
          retryCount++;
          
          if (retryCount < maxRetries) {
            setTimeout(findAndOpenChat, retryInterval);
          } else {
            console.warn('[InboxSection] Failed to find target chat after max retries');
            console.log('[InboxSection] Final chat list:', chats.map(c => ({ id: c._id, name: c.name })));
            // Clear the target to avoid infinite retries
            if (onChatOpened) {
              onChatOpened();
            }
          }
          return false; // Failed this attempt
        }
      };

      // Start the search process immediately
      findAndOpenChat();
    });
  }, [targetChatId]); // Only depend on targetChatId

  // Listen for real-time events to update chat list
  useEffect(() => {
    const handleMessageReceived = (event) => {
      const { chatId, content, fromUserId } = event.detail;
      console.log('📨 New message received in inbox for chat:', chatId);
      
      // Only increment unread count if message is from another user
      if (fromUserId !== user?._id && fromUserId !== 'currentUser') {
        setChatUnreadCounts(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1
        }));
      }

      // Update the chat list with new last message and sort by activity
      setChats(prevChats => {
        const updatedChats = prevChats.map(chat => {
          if (chat._id === chatId) {
            return {
              ...chat,
              lastMessage: {
                content: content,
                createdAt: new Date().toISOString()
              },
              lastActivity: new Date().toISOString()
            };
          }
          return chat;
        });
        return updatedChats.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
      });
    };

    const handleChatCreated = (event) => {
      const { chatId, chatName, members } = event.detail;
      console.log('🆕 New chat created:', chatId, chatName);
      
      // Refresh chat list to include the new chat
      fetchChats(false);
    };

    const handleMessageSent = (event) => {
      const { chatId, content } = event.detail;
      console.log('📤 Message sent from inbox for chat:', chatId);
      
      // Update the chat list with new last message and sort by activity
      setChats(prevChats => {
        const updatedChats = prevChats.map(chat => {
          if (chat._id === chatId) {
            return {
              ...chat,
              lastMessage: {
                content: content,
                createdAt: new Date().toISOString()
              },
              lastActivity: new Date().toISOString()
            };
          }
          return chat;
        });
        return updatedChats.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
      });
    };

    window.addEventListener('messageReceived', handleMessageReceived);
    window.addEventListener('messageSent', handleMessageSent);
    window.addEventListener('chatCreated', handleChatCreated);

    return () => {
      window.removeEventListener('messageReceived', handleMessageReceived);
      window.removeEventListener('messageSent', handleMessageSent);
      window.removeEventListener('chatCreated', handleChatCreated);
    };
  }, [user]); // Removed chatUnreadCounts dependency to prevent infinite re-renders

  // Polling for chat list updates (fallback for real-time)
  useEffect(() => {
    const pollChats = () => {
      fetchChats(false); // Silent fetch without loading state
    };

    const interval = setInterval(pollChats, 30000); // Poll every 30 seconds to reduce API calls
    return () => clearInterval(interval);
  }, []);

  const fetchChats = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      console.log('🔄 [InboxSection] Fetching chats from /api/chats...');
      const response = await apiRequest('/api/chats');
      console.log('📡 [InboxSection] API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 [InboxSection] Raw API response:', data);
        
        // Try different possible response structures
        let fetchedChats = [];
        if (data && data.data && Array.isArray(data.data.chats)) {
          // Nested format: { success: true, data: { chats: [...] } }
          fetchedChats = data.data.chats;
          console.log('✅ [InboxSection] Found chats in data.data.chats:', fetchedChats.length);
        } else if (data && Array.isArray(data.chats)) {
          // Direct format: { chats: [...] }
          fetchedChats = data.chats;
          console.log('✅ [InboxSection] Found chats in data.chats:', fetchedChats.length);
        } else if (data && Array.isArray(data.data)) {
          // Array in data: { data: [...] }
          fetchedChats = data.data;
          console.log('✅ [InboxSection] Found chats in data.data:', fetchedChats.length);
        } else if (Array.isArray(data)) {
          // Direct array: [...]
          fetchedChats = data;
          console.log('✅ [InboxSection] Found chats as direct array:', fetchedChats.length);
        } else {
          console.error('❌ [InboxSection] Unexpected response structure:', {
            dataType: typeof data,
            isArray: Array.isArray(data),
            keys: data ? Object.keys(data) : 'null',
            hasChats: data && 'chats' in data,
            hasData: data && 'data' in data,
            hasNestedChats: data && data.data && 'chats' in data.data,
            chatsType: data && data.chats ? typeof data.chats : 'undefined',
            dataType: data && data.data ? typeof data.data : 'undefined',
            nestedChatsType: data && data.data && data.data.chats ? typeof data.data.chats : 'undefined'
          });
          
          // Set empty array to prevent map error
          fetchedChats = [];
        }
        
        // Ensure fetchedChats is always an array
        if (!Array.isArray(fetchedChats)) {
          console.error('❌ [InboxSection] fetchedChats is not an array:', typeof fetchedChats);
          fetchedChats = [];
        }
        
        console.log('📋 [InboxSection] Processed chats:', fetchedChats.map(c => ({ 
          id: c._id, 
          name: c.name || c.title, 
          type: c.type,
          members: c.members?.length || 0,
          metadata: c.metadata 
        })));
        
        // Sort chats by last activity
        const sortedChats = fetchedChats.sort((a, b) => 
          new Date(b.lastActivity || b.createdAt) - new Date(a.lastActivity || a.createdAt)
        );
        
        setChats(sortedChats);

        // Initialize unread counts (server endpoint not available, using local state)
        const unreadCounts = {};
        for (const chat of sortedChats) {
          // Use existing local count or default to 0
          unreadCounts[chat._id] = chatUnreadCounts[chat._id] || 0;
        }
        setChatUnreadCounts(unreadCounts);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to fetch chats:', response.status, errorData);
        setError(`Failed to load chats (${response.status}): ${errorData.message || response.statusText}`);
        setChats([]);
      }
    } catch (err) {
      console.error('❌ Network error fetching chats:', err);
      
      let errorMessage = 'Unable to connect to server';
      if (err.message.includes('fetch')) {
        errorMessage = 'Cannot connect to backend server. Please check if the server is running.';
      } else if (err.message.includes('map is not a function')) {
        errorMessage = 'Server returned invalid data format. Please check backend API response.';
      } else {
        errorMessage = `Connection error: ${err.message}`;
      }
      
      setError(errorMessage);
      setChats([]);
      setChatUnreadCounts({});
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleChatSelect = (chat) => {
    console.log('💬 Opening chat:', chat._id);
    setSelectedChat(chat);
    setShowChatView(true);
    
    // Clear unread count for this chat
    handleUpdateUnreadCount(chat._id, 0);
  };

  const handleBackToInbox = () => {
    setShowChatView(false);
    setSelectedChat(null);
  };

  const handleUpdateUnreadCount = (chatId, newCount) => {
    // Only log if count actually changes
    const currentCount = chatUnreadCounts[chatId] || 0;
    if (currentCount !== newCount) {
      console.log('🔄 Updating unread count for chat:', chatId, '→', newCount);
    }
    
    // Update local state
    setChatUnreadCounts(prev => ({
      ...prev,
      [chatId]: newCount
    }));

    // Server update temporarily disabled to prevent resource exhaustion
    if (newCount === 0 && currentCount !== 0) {
      console.log('✅ Chat marked as read locally');
    }
  };

  const handleNewChatCreated = (newChat) => {
    console.log('✅ New chat created, adding to list:', newChat);
    
    // Add the new chat to the beginning of the list
    setChats(prevChats => [newChat, ...prevChats]);
    
    // Initialize unread count
    setChatUnreadCounts(prev => ({
      ...prev,
      [newChat._id]: 0
    }));
    
    // Open the new chat immediately
    handleChatSelect(newChat);
  };

  const getOtherUser = (chat) => {
    if (!chat.members || !Array.isArray(chat.members)) {
      return null;
    }

    const currentUserId = user?._id || 'currentUser';
    const otherMember = chat.members.find(member => {
      const memberId = member.user?._id || member._id;
      return memberId && String(memberId) !== String(currentUserId);
    });

    return otherMember?.user || otherMember || null;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffInHours < 168) { // Less than a week
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (err) {
      return '';
    }
  };

  // Show chat view if a chat is selected
  if (showChatView && selectedChat) {
    return (
      <ChatView
        chat={selectedChat}
        onBack={handleBackToInbox}
        onAvatarClick={onAvatarClick}
        onUpdateUnreadCount={handleUpdateUnreadCount}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <button 
            onClick={() => setShowNewChatModal(true)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Start new conversation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map(i => (
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
            <h3 className="text-sm font-medium text-gray-900 mb-1">Unable to load chats</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button 
              onClick={() => fetchChats()}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : chats.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No conversations yet</h3>
            <p className="text-gray-500 mb-4">Start a new conversation to begin messaging</p>
            <div className="flex gap-2 justify-center">
              <button 
                onClick={() => setShowNewChatModal(true)}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
              >
                New Chat
              </button>
              <button 
                onClick={() => fetchChats(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
              <button 
                onClick={async () => {
                  console.log('🔧 [DEBUG] Testing API connections...');
                  
                  // Test 1: Proxy route
                  try {
                    console.log('🔧 [DEBUG] Testing proxy route: /api/chats');
                    const proxyResponse = await fetch('/api/chats', {
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' }
                    });
                    const proxyData = await proxyResponse.json();
                    console.log('✅ [DEBUG] Proxy route result:', { status: proxyResponse.status, data: proxyData });
                  } catch (proxyErr) {
                    console.error('❌ [DEBUG] Proxy route failed:', proxyErr);
                  }
                  
                  // Test 2: Direct backend connection
                  try {
                    console.log('🔧 [DEBUG] Testing direct backend: http://localhost:2000/api/chats');
                    const directResponse = await fetch('http://localhost:2000/api/chats', {
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' }
                    });
                    const directData = await directResponse.json();
                    console.log('✅ [DEBUG] Direct backend result:', { status: directResponse.status, data: directData });
                  } catch (directErr) {
                    console.error('❌ [DEBUG] Direct backend failed:', directErr);
                  }
                  
                  // Test 3: Check if backend is running
                  try {
                    console.log('🔧 [DEBUG] Testing backend health...');
                    const healthResponse = await fetch('http://localhost:2000/health', {
                      credentials: 'include'
                    });
                    console.log('✅ [DEBUG] Backend health:', healthResponse.status);
                  } catch (healthErr) {
                    console.error('❌ [DEBUG] Backend not responding:', healthErr);
                  }
                  
                  alert('Check console for detailed debug results');
                }}
                className="px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
              >
                Debug API
              </button>
              <button 
                onClick={async () => {
                  console.log('🔧 [ChatService] Testing chat service...');
                  try {
                    const data = await ChatService.getChats();
                    console.log('✅ [ChatService] Success! Data structure:', {
                      type: typeof data,
                      isArray: Array.isArray(data),
                      keys: data ? Object.keys(data) : 'null',
                      hasChats: data && 'chats' in data,
                      hasData: data && 'data' in data,
                      length: Array.isArray(data) ? data.length : 'not array',
                      chatsLength: data && Array.isArray(data.chats) ? data.chats.length : 'not array',
                      dataLength: data && Array.isArray(data.data) ? data.data.length : 'not array'
                    });
                    alert(`Chat Service Test Complete!\nCheck console for details.\nData type: ${typeof data}\nIs Array: ${Array.isArray(data)}`);
                  } catch (err) {
                    console.error('❌ [ChatService] Failed:', err);
                    alert(`Chat Service Failed: ${err.message}`);
                  }
                }}
                className="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              >
                Test Service
              </button>
            </div>
            {targetChatId && (
              <p className="text-xs text-blue-600 mt-2">Looking for chat: {targetChatId}</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {chats.map((chat) => {
              const unreadCount = chatUnreadCounts[chat._id] || 0;
              const isGroupChat = chat.type === 'group' || (chat.members && chat.members.length > 2);
              const isIdeaCollaboration = chat.metadata?.chatType === 'idea_collaboration';
              
              // For group chats (especially idea collaboration), show the group name
              let displayName, displayAvatar, avatarProps;
              
              if (isGroupChat || isIdeaCollaboration) {
                displayName = chat.name || chat.title || '💡 Collaboration Chat';
                // For group chats, show a group icon or the first member's avatar
                const otherUser = getOtherUser(chat);
                if (otherUser) {
                  displayAvatar = otherUser.avatar;
                  avatarProps = {
                    userId: otherUser._id,
                    avatarUrl: otherUser.avatar,
                    size: 48,
                    isMentor: otherUser.isMentor,
                    isInvestor: otherUser.isInvestor
                  };
                } else {
                  // Fallback for group chats without clear other user
                  avatarProps = {
                    userId: 'group',
                    avatarUrl: null,
                    size: 48,
                    isMentor: false,
                    isInvestor: false
                  };
                }
              } else {
                // Regular 1-on-1 chat
                const otherUser = getOtherUser(chat);
                if (!otherUser) {
                  return null;
                }
                displayName = otherUser.fullName || otherUser.name || 'Unknown User';
                avatarProps = {
                  userId: otherUser._id,
                  avatarUrl: otherUser.avatar,
                  size: 48,
                  isMentor: otherUser.isMentor,
                  isInvestor: otherUser.isInvestor
                };
              }

              return (
                <div
                  key={chat._id}
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleChatSelect(chat)}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <UserAvatar {...avatarProps} />
                    {isIdeaCollaboration && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">💡</span>
                      </div>
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {displayName}
                        {isIdeaCollaboration && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Idea
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatTime(chat.lastMessage.createdAt)}
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px]">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {chat.lastMessage ? chat.lastMessage.content : 
                       isIdeaCollaboration ? 'Collaboration chat created' : 'No messages yet'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={handleNewChatCreated}
      />
    </div>
  );
}

export default InboxSection; 