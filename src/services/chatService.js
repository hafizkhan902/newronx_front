import { apiRequest } from '../utils/api';

export class ChatService {
  static async getChats() {
    try {
      console.log('🔧 [ChatService] Testing /api/chats endpoint...');
      const response = await apiRequest('/api/chats');
      const data = await response.json();
      
      console.log('🔧 [ChatService] Raw response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data: data
      });

      // Extract chats from nested structure
      if (data && data.data && Array.isArray(data.data.chats)) {
        console.log('🔧 [ChatService] Extracted chats:', data.data.chats);
        return data.data.chats;
      }
      
      console.log('🔧 [ChatService] Returning raw data (no nested chats found)');
      return data;
    } catch (error) {
      console.error('🔧 [ChatService] Error:', error);
      throw error;
    }
  }
  
  static async testDirectBackend() {
    try {
      console.log('🔧 [ChatService] Testing direct backend connection...');
      const response = await fetch('http://localhost:2000/api/chats', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      console.log('🔧 [ChatService] Direct backend response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data: data
      });
      
      return { status: response.status, data };
    } catch (error) {
      console.error('🔧 [ChatService] Direct backend error:', error);
      throw error;
    }
  }
}
