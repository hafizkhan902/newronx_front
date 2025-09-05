import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/api';

export function useChatMessages(chatId, currentUser) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUserTyping, setIsUserTyping] = useState(false);

  // Load messages from API
  const loadMessages = useCallback(async (showLoading = true) => {
    if (!chatId) return;

    try {
      if (showLoading) {
        setLoading(true);
      }
      
      console.log('🔄 [useChatMessages] Loading messages for chat:', chatId);
      const response = await apiRequest(`/api/messages/chat/${chatId}?page=1&limit=50`);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 [useChatMessages] Raw messages response:', data);
        
        // Handle nested response format: { success: true, data: { messages: [...] } }
        let newMessages = [];
        if (data && data.data && Array.isArray(data.data.messages)) {
          newMessages = data.data.messages;
          console.log('✅ [useChatMessages] Found messages in data.data.messages:', newMessages.length);
        } else if (data && Array.isArray(data.messages)) {
          newMessages = data.messages;
          console.log('✅ [useChatMessages] Found messages in data.messages:', newMessages.length);
        } else if (Array.isArray(data)) {
          newMessages = data;
          console.log('✅ [useChatMessages] Found messages as direct array:', newMessages.length);
        } else {
          console.warn('⚠️ [useChatMessages] Unexpected messages response structure:', data);
        }
        
        // Only update if messages actually changed to prevent UI flicker
        setMessages(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(newMessages)) {
            console.log('📝 [useChatMessages] Updating messages:', newMessages.length);
            return newMessages;
          }
          return prev;
        });
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to load messages (${response.status}): ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('❌ [useChatMessages] Error loading messages:', err);
      if (showLoading) {
        setError(err.message);
        setMessages([]);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [chatId]);

  // Send message via API
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || !chatId || !currentUser) return;

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      content: content.trim(),
      sender: {
        _id: currentUser._id,
        firstName: currentUser.firstName || currentUser.name,
        fullName: currentUser.fullName || currentUser.name,
        avatar: currentUser.avatar
      },
      createdAt: new Date().toISOString(),
      type: 'text',
      status: 'sending'
    };

    // Add optimistic message
    setMessages(prev => [...prev, tempMessage]);

    try {
      console.log('🔄 [useChatMessages] Sending message to chat:', chatId);
      const response = await apiRequest(`/api/messages/chat/${chatId}`, {
        method: 'POST',
        body: JSON.stringify({ 
          content: content.trim(),
          type: 'text'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📦 [useChatMessages] Send message response:', result);
        
        // Handle nested response format: { success: true, data: { message: {...} } }
        let newMessage = null;
        if (result && result.data && result.data.message) {
          newMessage = result.data.message;
          console.log('✅ [useChatMessages] Found message in result.data.message');
        } else if (result && result.message) {
          newMessage = result.message;
          console.log('✅ [useChatMessages] Found message in result.message');
        } else if (result && result.data) {
          newMessage = result.data;
          console.log('✅ [useChatMessages] Found message in result.data');
        }
        
        if (newMessage) {
          // Replace temp message with real message
          setMessages(prev => 
            prev.map(msg => 
              msg._id === tempMessage._id 
                ? { ...newMessage, status: 'sent' }
                : msg
            )
          );
          
          // Dispatch event for real-time updates
          const event = new CustomEvent('messageSent', {
            detail: { chatId, content: content.trim() }
          });
          window.dispatchEvent(event);
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to send message (${response.status}): ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('❌ [useChatMessages] Error sending message:', err);
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      
      // Show error message
      const errorMessage = {
        _id: `error-${Date.now()}`,
        content: '❌ Failed to send message. Please try again.',
        sender: { firstName: 'System', fullName: 'System' },
        createdAt: new Date().toISOString(),
        type: 'error',
        status: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
      throw err; // Re-throw to let ChatView handle it
    }
  }, [chatId, currentUser]);

  // Load messages when chat changes
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Smart polling - only when user is not typing and less frequently
  useEffect(() => {
    if (!chatId) return;

    const interval = setInterval(() => {
      // Only poll if user is not actively typing
      if (!isUserTyping) {
        loadMessages(false); // Silent loading - no loading state changes
      }
    }, 10000); // Increased to 10 seconds to be less intrusive

    return () => clearInterval(interval);
  }, [chatId, loadMessages, isUserTyping]);

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId) => {
    if (!chatId || !messageId) return;

    try {
      console.log('🔄 [useChatMessages] Marking message as read:', messageId);
      const response = await apiRequest(`/api/messages/chat/${chatId}/messages/${messageId}/read`, {
        method: 'PATCH'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [useChatMessages] Message marked as read:', result);
        
        // Update local message status
        setMessages(prev => 
          prev.map(msg => 
            msg._id === messageId 
              ? { ...msg, readBy: [...(msg.readBy || []), { user: currentUser._id, readAt: new Date().toISOString() }] }
              : msg
          )
        );
      } else {
        console.warn('⚠️ [useChatMessages] Could not mark message as read on server');
      }
    } catch (err) {
      console.warn('⚠️ [useChatMessages] Error marking message as read:', err);
    }
  }, [chatId, currentUser]);

  // Provide typing state control
  const setTypingState = useCallback((typing) => {
    setIsUserTyping(typing);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    refreshMessages: loadMessages,
    markMessageAsRead,
    setTypingState,
    connected: true // Always show as connected since we're using HTTP
  };
} 