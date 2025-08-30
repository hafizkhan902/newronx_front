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
      const response = await apiRequest(`/api/messages/${chatId}`);

      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        
        // Only update if messages actually changed to prevent UI flicker
        setMessages(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(newMessages)) {
            return newMessages;
          }
          return prev;
        });
        setError(null);
      } else {
        throw new Error('Failed to load messages');
      }
    } catch (err) {
      console.error('Error loading messages:', err);
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
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      timestamp: new Date().toISOString(),
      isTemp: true
    };

    // Add optimistic message
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await apiRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ 
          chatId: chatId,
          content: content.trim() 
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Replace temp message with real message (API returns data.data based on documentation)
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempMessage._id 
              ? { ...result.data, justSent: true }
              : msg
          )
        );
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      
      // Show error message
      const errorMessage = {
        _id: `error-${Date.now()}`,
        content: '❌ Failed to send message. Please try again.',
        sender: { name: 'System' },
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
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
    setTypingState,
    connected: true // Always show as connected since we're using HTTP
  };
} 