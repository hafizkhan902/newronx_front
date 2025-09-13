import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../../UserContext';
import { apiRequest } from '../../../utils/api';
import UserAvatar from '../../UserAvatar';

const TeamFeedSection = ({ ideaId, teamMembers }) => {
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Post creation states
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  
  // Comment states
  const [showComments, setShowComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  
  // Pagination states
  const [pagination, setPagination] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // User cache for comment authors (keeping for future use)
  // const [userCache, setUserCache] = useState({});

  const fetchTeamPosts = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch team posts using real API endpoint
      let response = await apiRequest(`/api/team-posts/idea/${ideaId}?page=${pageNum}&limit=10`);

      // If cookie auth fails with 401, try with Authorization header as fallback
      if (!response.ok && response.status === 401) {
        console.log('🔄 [TeamFeed] Cookie auth failed for fetch, trying with Authorization header...');
        
        // Extract token from cookies
        const tokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          const token = tokenCookie.split('=')[1];
          console.log('🔑 [TeamFeed] Found token in cookies, retrying fetch with Bearer auth...');
          
          response = await fetch(`/api/team-posts/idea/${ideaId}?page=${pageNum}&limit=10`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      }

      if (response.ok) {
        const result = await response.json();
        console.log('🔍 TeamFeedSection - Full API response:', result);
        
        if (result.success) {
          // Handle the actual backend response structure: result.message.posts
          let posts = result.message?.posts || result.data?.posts || result.posts || result.data || [];
          const paginationData = result.message?.pagination || result.data?.pagination || null;
          
          // If posts is not an array, try to extract it differently
          if (!Array.isArray(posts)) {
            console.warn('📊 TeamFeedSection - Posts is not an array, trying to extract:', posts);
            posts = [];
          }
          
          console.log('📊 TeamFeedSection - Extracted posts:', posts);
          console.log('📊 TeamFeedSection - Posts array length:', posts.length);
          console.log('📊 TeamFeedSection - Pagination data:', paginationData);
          
          if (pageNum === 1) {
            setPosts(posts);
          } else {
            setPosts(prev => [...prev, ...posts]);
          }
          
          // Update pagination state
          setPagination(paginationData);
          
          console.log('📊 TeamFeedSection - Posts state updated, total posts:', posts.length);
          
          // Check comment author structure for debugging
          posts.forEach(post => {
            if (post.comments && post.comments.length > 0) {
              console.log('📝 [TeamFeed] Post has', post.comments.length, 'comments');
              post.comments.forEach((comment, index) => {
                console.log(`📝 [TeamFeed] Comment ${index + 1}:`, {
                  id: comment._id,
                  authorType: typeof comment.author,
                  authorData: comment.author,
                  content: comment.content.substring(0, 50) + '...'
                });
              });
            }
          });
        } else {
          console.error('❌ TeamFeedSection - API returned success: false:', result);
          throw new Error(result.message || 'Failed to load team posts');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ TeamFeedSection - API Error Response:', errorData);
        
        // Check for specific backend authorization errors
        if (errorData.message && errorData.message.includes('team.some is not a function')) {
          throw new Error('Team access error: You may not be a member of this team. Please contact the idea author to be added to the team.');
        }
        
        // Check for other common authorization errors
        if (response.status === 403) {
          throw new Error('Access denied: You do not have permission to view team posts. Please contact the idea author.');
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error loading team posts:', err);
      setError(err.message || 'Failed to load team posts');
    } finally {
      setLoading(false);
    }
  }, [ideaId]);

  // useEffect for fetchTeamPosts
  useEffect(() => {
    fetchTeamPosts();
  }, [fetchTeamPosts]);

  const handlePostSubmit = async () => {
    if (!newPost.trim() && (!attachments || attachments.length === 0)) return;

    setIsPosting(true);
    try {
      console.log('🚀 [TeamFeed] Starting post creation...', {
        ideaId,
        contentLength: newPost.trim().length,
        attachmentsCount: attachments?.length || 0
      });

      const formData = new FormData();
      formData.append('ideaId', ideaId);
      formData.append('content', newPost.trim());
      
      // Handle mentions (extract @mentions from content)
      const mentionRegex = /@([^\s]+)/g;
      const mentions = [];
      const matches = [...newPost.matchAll(mentionRegex)];
      matches.forEach(matchResult => {
        const mentionedUser = (teamMembers || []).find(member => 
          member.user?.fullName?.toLowerCase().includes(matchResult[1].toLowerCase())
        );
        if (mentionedUser) {
          mentions.push(mentionedUser.user._id);
        }
      });
      
      // Send mentions as array, not JSON string
      mentions.forEach(userId => {
        formData.append('mentions', userId);
      });

      // Handle attachments and links
      const links = [];
      (attachments || []).forEach((attachment) => {
        if (attachment.type === 'file') {
          formData.append('attachments', attachment.file);
        } else if (attachment.type === 'link') {
          // Backend expects links in format: [{"url": "...", "title": "..."}]
          links.push({
            url: attachment.url,
            title: attachment.name || attachment.url.split('/').pop() || 'Shared Link'
          });
        }
      });

      // Send links as JSON string (backend expects array of objects)
      if (links.length > 0) {
        formData.append('links', JSON.stringify(links));
      }

      // Additional options (can be extended later)
      formData.append('isAnnouncement', false);
      formData.append('isPinned', false);

      console.log('🔍 [TeamFeed] FormData contents:');
      for (let pair of formData.entries()) {
        console.log(`  ${pair[0]}: ${pair[1]}`);
      }

      // Try with cookie-based auth first (consistent with rest of app)
      let response = await apiRequest('/api/team-posts', {
        method: 'POST',
        body: formData,
        // Remove Content-Type header to let browser set it with boundary for multipart
        headers: {}
      });

      // If cookie auth fails with 401, try with Authorization header as fallback
      if (!response.ok && response.status === 401) {
        console.log('🔄 [TeamFeed] Cookie auth failed, trying with Authorization header...');
        
        // Extract token from cookies
        const tokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          const token = tokenCookie.split('=')[1];
          console.log('🔑 [TeamFeed] Found token in cookies, retrying with Bearer auth...');
          
          response = await fetch('/api/team-posts', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
        }
      }

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Post creation response:', result);
        
        if (result.success) {
          console.log('✅ Post created successfully:', result.message);
          
          // Optimistically add the new post to the feed (it's in result.message)
          const newPostData = result.message;
          if (newPostData && newPostData._id) {
            setPosts(prevPosts => [newPostData, ...(prevPosts || [])]);
            console.log('✅ New post added to feed optimistically');
          }
          
          // Reset form
          setNewPost('');
          setAttachments([]);
          setShowAttachmentOptions(false);
          
          console.log('✅ Post creation completed successfully');
        } else {
          throw new Error(result.message || 'Failed to create post');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Post creation failed:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Error creating post:', err);
      alert(`Failed to create post: ${err.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} not supported. Please use PDF or image files.`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      const newAttachment = {
        id: Date.now() + Math.random(),
        type: 'file',
        name: file.name,
        size: file.size,
        file: file,
        url: URL.createObjectURL(file)
      };

      setAttachments(prev => [...prev, newAttachment]);
    });

    e.target.value = '';
  };

  const addLink = (url) => {
    if (!url.trim()) return;

    try {
      new URL(url.trim());
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    const newAttachment = {
      id: Date.now() + Math.random(),
      type: 'link',
      name: url.trim(),
      url: url.trim()
    };

    setAttachments(prev => [...prev, newAttachment]);
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => {
      const attachment = prev.find(att => att.id === attachmentId);
      if (attachment && attachment.url && attachment.type === 'file') {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter(att => att.id !== attachmentId);
    });
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleLike = async (postId) => {
    try {
      let response = await apiRequest(`/api/team-posts/${postId}/like`, {
        method: 'POST'
      });

      // If cookie auth fails with 401, try with Authorization header as fallback
      if (!response.ok && response.status === 401) {
        console.log('🔄 [TeamFeed] Cookie auth failed for like, trying with Authorization header...');
        
        // Extract token from cookies
        const tokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          const token = tokenCookie.split('=')[1];
          console.log('🔑 [TeamFeed] Found token in cookies, retrying like with Bearer auth...');
          
          response = await fetch(`/api/team-posts/${postId}/like`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      }
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // Update the post's like count and user's like status
          setPosts(prev => prev.map(post => 
            post._id === postId 
              ? { 
                  ...post, 
                  likeCount: result.data.likeCount, 
                  isLikedByUser: result.data.isLikedByUser 
                }
              : post
          ));
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (postId, content) => {
    if (!content.trim()) return;

    try {
      let response = await apiRequest(`/api/team-posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: content.trim() })
      });

      // If cookie auth fails with 401, try with Authorization header as fallback
      if (!response.ok && response.status === 401) {
        console.log('🔄 [TeamFeed] Cookie auth failed for comment, trying with Authorization header...');
        
        // Extract token from cookies
        const tokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          const token = tokenCookie.split('=')[1];
          console.log('🔑 [TeamFeed] Found token in cookies, retrying comment with Bearer auth...');
          
          response = await fetch(`/api/team-posts/${postId}/comments`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: content.trim() })
          });
        }
      }
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // Refresh posts to show new comment
          fetchTeamPosts();
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {/* Post Creation Area Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg backdrop-blur-sm p-4 animate-pulse">
          <div className="h-24 bg-gray-200 rounded-xl mb-3"></div>
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded-lg w-32"></div>
            <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
          </div>
        </div>

        {/* Posts Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl shadow-lg backdrop-blur-sm p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/5"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 rounded-2xl shadow-lg backdrop-blur-sm p-4 text-red-600">
          <p className="font-medium">Error loading posts</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={fetchTeamPosts}
            className="mt-3 text-sm bg-red-100 px-4 py-2 hover:bg-red-200 transition-colors rounded-lg shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Background Overlay */}
      {(newPost.trim() || showAttachmentOptions) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 transition-all duration-300 z-10"
          onClick={() => {
            setShowAttachmentOptions(false);
          }}
        />
      )}
      
      <div className="p-6 space-y-4 relative">
        {/* Post Creation Area */}
        <div className={`bg-white rounded-2xl shadow-lg transition-all duration-300 relative ${
          newPost.trim() || showAttachmentOptions ? 'z-20 shadow-2xl' : 'z-10'
        }`}>
          <div className="p-4">
            <div className="relative">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Write your post/announcement..."
                className="w-full min-h-24 p-3 pr-32 pb-12 bg-gray-50 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white text-base resize-none transition-all duration-200"
                style={{ fontFamily: 'inherit' }}
              />
              
              {/* Controls inside textarea */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                {/* Attachment Options */}
                <div className="relative">
                  <button
                    onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-lg text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="hidden sm:inline">attach</span>
                  </button>
                  
                  {showAttachmentOptions && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl z-30 min-w-48 max-h-64 overflow-y-auto">
                      <div className="py-2">
                        <label className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700">
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                            multiple
                            className="hidden"
                          />
                          <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Upload File
                        </label>
                        
                        <button
                          onClick={() => {
                            const url = prompt('Enter URL:');
                            if (url) {
                              addLink(url);
                              setShowAttachmentOptions(false);
                            }
                          }}
                          className="flex items-center w-full px-4 py-2 hover:bg-gray-50 text-left text-gray-700"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Add Link
                        </button>
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        
                        {teamMembers && teamMembers.length > 0 && (
                          <div className="px-4 py-2">
                            <p className="text-xs text-gray-500 mb-2">Mention Team Member:</p>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {teamMembers.map((member) => (
                                <button
                                  key={member.user._id}
                                  onClick={() => {
                                    const mention = `@${member.user.fullName} `;
                                    setNewPost(prev => prev + mention);
                                    setShowAttachmentOptions(false);
                                  }}
                                  className="flex items-center w-full px-2 py-1 hover:bg-gray-50 text-left text-sm text-gray-700"
                                >
                                  <UserAvatar
                                    fullName={member.user.fullName}
                                    avatarUrl={member.user.avatar}
                                    size={16}
                                  />
                                  <span className="ml-2 text-gray-700">{member.user.fullName}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Post Button */}
                <button
                  onClick={handlePostSubmit}
                  disabled={isPosting || (!newPost.trim() && (!attachments || attachments.length === 0))}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium rounded-lg shadow-sm text-sm"
                >
                  {isPosting ? 'POSTING...' : 'POST'}
                </button>
              </div>
            </div>
            
            {/* Attachments Display */}
            {attachments && attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {(attachments || []).map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-2 bg-gray-100 rounded-lg shadow-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-base">
                        {attachment.type === 'link' ? '🔗' : '📎'}
                      </span>
                      <span className="text-sm text-gray-700 truncate">
                        {attachment.name}
                      </span>
                      {attachment.size && (
                        <span className="text-xs text-gray-500">
                          ({Math.round(attachment.size / 1024)}KB)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Posts Feed */}
        <div className={`space-y-3 transition-all duration-300 ${
          newPost.trim() || showAttachmentOptions ? 'opacity-50' : 'opacity-100'
        }`}>
          {(!posts || posts.length === 0) ? (
            <div className="bg-white rounded-2xl shadow-lg backdrop-blur-sm p-6 text-center">
              <p className="text-gray-400 mb-2">No posts yet.</p>
              <p className="text-sm text-gray-500">Be the first to share an update with your team!</p>
            </div>
          ) : (
            (posts || []).map((post) => (
              <div key={post._id} className="bg-white rounded-2xl shadow-lg backdrop-blur-sm p-4">
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-3">
                  <UserAvatar
                    fullName={post.author?.fullName || 'Unknown User'}
                    avatarUrl={post.author?.avatar}
                    size={32}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {post.author?.fullName || 'Unknown User'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(post.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-3">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                    {post.content}
                  </p>
                </div>

                {/* Post Actions */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 mb-3">
                    <button 
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center gap-2 transition-colors ${
                        post.isLikedByUser 
                          ? 'text-blue-600 hover:text-blue-700' 
                          : 'text-gray-500 hover:text-blue-600'
                      }`}
                    >
                      <svg className="w-4 h-4" fill={post.isLikedByUser ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-xs">{post.likeCount || 0} {post.likeCount === 1 ? 'Like' : 'Likes'}</span>
                    </button>
                    
                    <button 
                      onClick={() => setShowComments(prev => ({
                        ...prev,
                        [post._id]: !prev[post._id]
                      }))}
                      className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-xs">{post.commentCount || 0} {post.commentCount === 1 ? 'Comment' : 'Comments'}</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {showComments[post._id] && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {/* Existing Comments */}
                      {post.comments && post.comments.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {post.comments.map(comment => {
                            // Handle comment author display
                            const commentAuthor = comment.author && typeof comment.author === 'object' 
                              ? comment.author 
                              : { fullName: 'Team Member', avatar: '' };
                            
                            return (
                              <div key={comment._id} className="flex gap-2">
                                <UserAvatar
                                  fullName={commentAuthor?.fullName || 'Team Member'}
                                  avatarUrl={commentAuthor?.avatar}
                                  size={20}
                                />
                                <div className="flex-1 bg-gray-50 rounded-lg p-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-gray-900">
                                      {commentAuthor?.fullName || 'Team Member'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatTimeAgo(comment.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-700">{comment.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add Comment Input */}
                      <div className="flex gap-2">
                        <UserAvatar
                          fullName={user?.fullName || 'Current User'}
                          avatarUrl={user?.avatar}
                          size={20}
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={commentInputs[post._id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({
                              ...prev,
                              [post._id]: e.target.value
                            }))}
                            placeholder="Write a comment..."
                            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && commentInputs[post._id]?.trim()) {
                                handleComment(post._id, commentInputs[post._id]);
                                setCommentInputs(prev => ({
                                  ...prev,
                                  [post._id]: ''
                                }));
                              }
                            }}
                          />
                          {commentInputs[post._id]?.trim() && (
                            <button
                              onClick={() => {
                                handleComment(post._id, commentInputs[post._id]);
                                setCommentInputs(prev => ({
                                  ...prev,
                                  [post._id]: ''
                                }));
                              }}
                              className="mt-1 text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Post
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Load More Button */}
          {pagination && pagination.hasNext && (
            <div className="text-center py-4">
              <button
                onClick={() => {
                  setLoadingMore(true);
                  fetchTeamPosts(pagination.currentPage + 1).finally(() => setLoadingMore(false));
                }}
                disabled={loadingMore}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {loadingMore ? 'Loading...' : 'Load More Posts'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Showing {posts?.length || 0} of {pagination.totalPosts} posts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamFeedSection;
