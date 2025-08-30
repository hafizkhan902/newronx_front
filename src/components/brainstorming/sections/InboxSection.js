import React, { useState, useEffect } from 'react';
import { useUser } from '../../../UserContext';
import ChatView from './ChatView';
import NewChatModal from './NewChatModal';
import UserAvatar from '../../UserAvatar';
import { apiRequest } from '../../../utils/api';

function InboxSection({ onAvatarClick }) {
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

  // Listen for real-time message events to update chat list
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

    return () => {
      window.removeEventListener('messageReceived', handleMessageReceived);
      window.removeEventListener('messageSent', handleMessageSent);
    };
  }, [user, chatUnreadCounts]);

  // Polling for chat list updates (fallback for real-time)
  useEffect(() => {
    const pollChats = () => {
      fetchChats(false); // Silent fetch without loading state
    };

    const interval = setInterval(pollChats, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchChats = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const response = await apiRequest('/api/chats');

      if (response.ok) {
        const data = await response.json();
        const fetchedChats = data.chats || [];
        
        console.log('✅ Chats fetched from API:', fetchedChats.length);
        
        // Sort chats by last activity
        const sortedChats = fetchedChats.sort((a, b) => 
          new Date(b.lastActivity || b.createdAt) - new Date(a.lastActivity || a.createdAt)
        );
        
        setChats(sortedChats);

        // Initialize unread counts
        const unreadCounts = {};
        for (const chat of sortedChats) {
          try {
                    const unreadResponse = await apiRequest(`/api/chats/${chat._id}/unread-count`);
            if (unreadResponse.ok) {
              const unreadData = await unreadResponse.json();
              unreadCounts[chat._id] = unreadData.count || 0;
            } else {
              unreadCounts[chat._id] = 0;
            }
          } catch (err) {
            console.log('⚠️ Could not fetch unread count for chat:', chat._id);
            unreadCounts[chat._id] = 0;
          }
        }
        setChatUnreadCounts(unreadCounts);
      } else {
        console.error('❌ Failed to fetch chats:', response.status);
        setError('Failed to load chats. Please try again.');
        setChats([]);
      }
    } catch (err) {
      console.error('❌ Network error fetching chats:', err);
      setError('Unable to connect to server. Please check your connection.');
      setChats([]);
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
    console.log('🔄 Updating unread count for chat:', chatId, '→', newCount);
    
    // Update local state
    setChatUnreadCounts(prev => ({
      ...prev,
      [chatId]: newCount
    }));

    // Update server (temporarily disabled to prevent resource exhaustion)
    if (newCount === 0) {
      console.log('✅ Chat marked as read locally (server update temporarily disabled)');
      // apiRequest(`/api/chats/${chatId}/read`, {
      //   method: 'POST'
      // }).catch(err => {
      //   console.log('⚠️ Could not mark chat as read on server:', err.message);
      // });
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
            <button 
              onClick={() => setShowNewChatModal(true)}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
            >
              Start Conversation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {chats.map((chat) => {
              const otherUser = getOtherUser(chat);
              const unreadCount = chatUnreadCounts[chat._id] || 0;
              
              if (!otherUser) {
                return null;
              }

              return (
                <div
                  key={chat._id}
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleChatSelect(chat)}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <UserAvatar
                      userId={otherUser._id}
                      avatarUrl={otherUser.avatar}
                      size={48}
                      isMentor={otherUser.isMentor}
                      isInvestor={otherUser.isInvestor}
                    />
                  </div>

                  {/* Chat Info */}
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {otherUser.fullName || otherUser.name || 'Unknown User'}
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
                      {chat.lastMessage ? chat.lastMessage.content : 'No messages yet'}
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