import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../../../UserContext';
import UserAvatar from '../../UserAvatar';
import { useChatMessages } from '../../../hooks/useChatMessages';
import { apiRequest } from '../../../utils/api';

import MessageStatusIndicator from './MessageStatusIndicator';

function ChatView({ chat, onBack, onAvatarClick, onUpdateUnreadCount }) {
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { 
    messages,
    loading: messagesLoading,
    error: messagesError,
    connected,
    sendMessage: sendApiMessage,
    refreshMessages,
    setTypingState
  } = useChatMessages(chat._id, user);

  // Get current user ID with fallback for mock data
  const getCurrentUserId = () => {
    if (user?._id) {
      return user._id;
    }
    // Fallback for mock data or when user context is not ready
    return 'currentUser';
  };

  const markChatAsRead = useCallback(async () => {
    if (!chat) return;

    try {
      // Immediately update parent component about read status
      if (onUpdateUnreadCount) {
        onUpdateUnreadCount(chat._id, 0);
        console.log('🔄 Marked chat as read locally:', chat._id);
      }

      // Skip server update for now to prevent ERR_INSUFFICIENT_RESOURCES
      // TODO: Re-enable once backend is stable
      console.log('✅ Chat marked as read locally (server update temporarily disabled)');
      
      // // Try to update server
      // const response = await apiRequest(`/api/chats/${chat._id}/read`, {
      //   method: 'POST'
      // });
      // 
      // if (response.ok) {
      //   console.log('✅ Chat marked as read on server:', chat._id);
      // } else {
      //   console.log('⚠️ Could not mark chat as read on server, but updated locally');
      // }
    } catch (err) {
      console.log('⚠️ Error marking chat as read:', err);
    }
  }, [chat, onUpdateUnreadCount]);

  useEffect(() => {
    if (chat) {
      // Mark messages as read when opening chat (with delay to prevent spam)
      const timer = setTimeout(() => {
        markChatAsRead();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [chat, markChatAsRead]);



  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Log when user context is available for debugging
  useEffect(() => {
    if (user) {
      console.log('👤 User context available in ChatView:', {
        userId: user._id,
        userName: user.name || user.fullName,
        messageCount: messages.length
      });
    }
  }, [user, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };



  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await sendApiMessage(messageContent);
      console.log('✅ Message sent successfully');
    } catch (err) {
      console.error('❌ Error sending message:', err);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const getChatName = () => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat';
    }
    
    const otherMember = chat.members?.find(member => 
      member.user && String(member.user._id) !== String(user?._id)
    );
    return otherMember?.user?.fullName || otherMember?.user?.name || 'Direct Chat';
  };

  const getChatAvatar = () => {
    if (chat.avatar) return chat.avatar;
    
    if (chat.type === 'group') {
      return null;
    }
    
    const otherMember = chat.members?.find(member => 
      member.user && String(member.user._id) !== String(user?._id)
    );
    return otherMember?.user?.avatar;
  };

  const getOtherMemberId = () => {
    if (chat.type === 'group') return null;
    
    const otherMember = chat.members?.find(member => 
      member.user && String(member.user._id) !== String(user?._id)
    );
    return otherMember?.user?._id;
  };

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (messagesLoading) {
    return (
      <div className="max-w-xl mx-auto w-full bg-white border border-gray-200 flex flex-col h-96">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <button onClick={onBack} className="mr-3 p-1 hover:bg-gray-100 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="animate-pulse flex items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto w-full bg-white border border-gray-200 flex flex-col h-96">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center">
        <button 
          onClick={onBack} 
          className="mr-3 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex items-center flex-1">
          {getChatAvatar() ? (
            <UserAvatar
              userId={getOtherMemberId()}
              avatarUrl={getChatAvatar()}
              size={32}
              isMentor={chat.otherMember?.isMentor}
              isInvestor={chat.otherMember?.isInvestor}
              onClick={() => onAvatarClick && getOtherMemberId() && onAvatarClick(getOtherMemberId())}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 mr-3">
              {chat.type === 'group' ? (
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.998 2.998 0 0 0 17.06 6H16c-.8 0-1.54.37-2.01.99L12 9.5 10.01 6.99C9.54 6.37 8.8 6 8 6H6.94c-1.24 0-2.31.81-2.66 2.01L1.5 16H4v6h2v-6h2.5l1.5-4.5L12 14.5l2-3 1.5 4.5H18v6h2z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>
          )}
          
          <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">{getChatName()}</h3>
                <div className="flex items-center space-x-2">
                  {connected ? (
                    <div className="flex items-center text-xs text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      <span>Live</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-orange-600">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                      <span>Sync</span>
                    </div>
                  )}
                </div>
              </div>
            <p className="text-xs text-gray-500">
              {chat.type === 'group' ? `${chat.members?.length || 0} members` : 'Direct message'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messagesError ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">{messagesError}</p>
            <button 
              onClick={refreshMessages}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <p className="text-xs text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            // Better user ID comparison with debugging
            const messageSenderId = message.sender?._id;
            const currentUserId = getCurrentUserId();
            const isOwn = messageSenderId && currentUserId && String(messageSenderId) === String(currentUserId);
            
            // Debug logging for alignment issues
            if (process.env.NODE_ENV === 'development') {
              console.log('Message alignment check:', {
                messageId: message._id,
                messageSenderId,
                currentUserId,
                isOwn,
                senderName: message.sender?.name || message.sender?.fullName
              });
            }
            
            return (
              <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-xs ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {!isOwn && (
                    <UserAvatar
                      userId={message.sender?._id}
                      avatarUrl={message.sender?.avatar}
                      size={24}
                      isMentor={message.sender?.isMentor}
                      isInvestor={message.sender?.isInvestor}
                      onClick={() => onAvatarClick && message.sender?._id && onAvatarClick(message.sender._id)}
                    />
                  )}
                  <div className="flex flex-col">
                    <div className={`rounded-lg p-3 ${
                      isOwn 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    } ${message.status === 'sending' ? 'opacity-80' : ''}`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-gray-300' : 'text-gray-500'}`}>
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                    <MessageStatusIndicator 
                      status={message.status} 
                      isOwn={isOwn}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              
              // Handle typing state for smart polling
              setTypingState(true);
              
              // Clear existing timeout
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              
              // Set user as not typing after 2 seconds of inactivity
              typingTimeoutRef.current = setTimeout(() => {
                setTypingState(false);
              }, 2000);
            }}
            onFocus={() => setTypingState(true)}
            onBlur={() => {
              // Clear timeout and set not typing when input loses focus
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              setTypingState(false);
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-gray-400 text-sm"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            )}
          </button>
        </div>
      </form>


    </div>
  );
}

export default ChatView; 