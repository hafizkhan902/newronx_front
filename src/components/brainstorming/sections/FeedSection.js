import React, { useState, useEffect } from 'react';
import BrainstormPost from '../../BrainstormPost';

function FeedSection({ onApproach, onAvatarClick, onNavigateToInbox }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ideas/feed', {
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Failed to load feed (${response.status})`);
      }

      const data = await response.json();
      const rawIdeas = Array.isArray(data) ? data : (data.ideas || data.data || []);

      const normalized = rawIdeas.map((i) => {
        const author = i.author && typeof i.author === 'object' ? i.author : {};
        const images = Array.isArray(i.images)
          ? i.images
          : (i.image ? [{ url: i.image }] : []);

        const createdAt = i.createdAt || i.created_at;
        const time = createdAt ? new Date(createdAt).toLocaleString() : '';

        return {
          _id: i._id || i.id,
          id: i._id || i.id,
          title: i.title || '',
          description: i.description || '',
          // Info fields expected by BrainstormPost
          targetAudience: i.targetAudience || '',
          marketAlternatives: i.marketAlternatives || '',
          problemStatement: i.problemStatement || '',
          uniqueValue: i.uniqueValue || '',
          privacy: i.privacy || 'Public',
          tags: Array.isArray(i.tags) ? i.tags : [],
          createdAt,
          time,
          author: {
            _id: author._id || author.id,
            fullName: author.fullName || author.firstName || author.name || 'Unknown',
            avatar: author.avatar || '',
            isMentor: author.isMentor,
            isInvestor: author.isInvestor,
          },
          images,
          approaches: i.approaches || [],
          suggestions: i.suggestions || [],
          appreciateCount: i.appreciateCount || i.likes || 0,
          suggestCount: i.suggestCount || 0,
          neededRoles: i.neededRoles || [],
        };
      });

      console.log('📊 FeedSection - Normalized posts (BrainstormPost shape):', normalized);
      setPosts(normalized);
    } catch (err) {
      // console.error('Error fetching posts:', err);
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Feed</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-6 border border-gray-200 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/5"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Feed</h2>
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-600">
          <p className="font-medium">Error loading posts</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={fetchPosts}
            className="mt-3 text-sm bg-red-100 px-4 py-2 rounded hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Feed</h2>
      {posts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded p-8 text-center">
          <p className="text-gray-400 mb-2">No ideas yet.</p>
          <p className="text-sm text-gray-500">Be the first to share your idea!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <BrainstormPost key={post.id} post={post} onAvatarClick={onAvatarClick} onNavigateToInbox={onNavigateToInbox} />
          ))}
        </div>
      )}
    </div>
  );
}

export default FeedSection; 