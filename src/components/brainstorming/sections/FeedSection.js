import React, { useState, useEffect, useMemo } from 'react';
import BrainstormPost from '../../BrainstormPost';

function FeedSection({ onApproach, onAvatarClick, onNavigateToInbox, onPostsLoaded, filterTag }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('latest'); // 'latest' | 'top'

  useEffect(() => {
    fetchPosts();
  }, []); // eslint-disable-line

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ideas/feed', { credentials: 'include' });

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

      setPosts(normalized);
      onPostsLoaded && onPostsLoaded(normalized);
    } catch (err) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Filter by tag
  const filteredPosts = useMemo(() => {
    if (!filterTag) return posts;
    return posts.filter(p => (p.tags || []).includes(filterTag));
  }, [posts, filterTag]);

  // Sort
  const sortedPosts = useMemo(() => {
    if (sortBy === 'top') {
      return [...filteredPosts].sort((a, b) =>
        (b.appreciateCount + b.suggestCount + (Array.isArray(b.approaches) ? b.approaches.length : 0)) -
        (a.appreciateCount + a.suggestCount + (Array.isArray(a.approaches) ? a.approaches.length : 0))
      );
    }
    return [...filteredPosts].sort((a, b) =>
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [filteredPosts, sortBy]);

  // ── Shared feed header ───────────────────────────────────────────────────
  const FeedHeader = () => (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-base font-bold text-gray-800 shrink-0">Ideas</h2>
        {filterTag && (
          <span className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold px-2.5 py-1 rounded-full truncate max-w-[120px]">
            #{filterTag}
          </span>
        )}
      </div>
      <div className="flex bg-gray-100 border border-gray-200 rounded-xl p-1 gap-0.5 shrink-0">
        {['latest', 'top'].map(mode => (
          <button
            key={mode}
            onClick={() => setSortBy(mode)}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation min-h-[32px] ${
              sortBy === mode
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <FeedHeader />
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="h-3.5 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="w-14 h-7 bg-gray-100 rounded-lg shrink-0" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-gray-100 rounded-full" />
                <div className="h-6 w-24 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div>
        <FeedHeader />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-600 font-medium mb-1">Error loading posts</p>
          <p className="text-sm text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchPosts}
            className="text-sm bg-red-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-red-700 active:scale-95 transition touch-manipulation"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <div>
      <FeedHeader />

      {sortedPosts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-gray-500 mb-1">
            {filterTag ? `No ideas tagged #${filterTag}` : 'No ideas yet.'}
          </p>
          <p className="text-sm text-gray-400">Be the first to share your idea!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPosts.map((post) => (
            <BrainstormPost
              key={post.id}
              post={post}
              onAvatarClick={onAvatarClick}
              onNavigateToInbox={onNavigateToInbox}
            />
          ))}
          <p className="text-center text-gray-400 text-sm py-6">
            You&apos;ve seen all recent ideas — check back later or post your own!
          </p>
        </div>
      )}
    </div>
  );
}

export default FeedSection;
