import React, { useEffect, useState } from 'react';
import UserAvatar from '../../UserAvatar';

// Helper function
async function fetchPublicProfile(userId) {
  const url = `/api/users/${userId}/public`;
  // console.log('[PublicProfile] Fetching public profile:', url, 'for userId:', userId);
  const response = await fetch(url);
  // console.log('[PublicProfile] Response status:', response.status);
  const text = await response.text();
  // console.log('[PublicProfile] Raw response text:', text);
  if (!response.ok) {
    // console.error('[PublicProfile] API error:', response.status, text);
    throw new Error('Failed to fetch public profile');
  }
  try {
    const json = JSON.parse(text);
    // console.log('[PublicProfile] Parsed JSON:', json);
    return json;
  } catch (err) {
    console.error('[PublicProfile] JSON parse error:', err, text);
    throw new Error('Failed to parse public profile JSON');
  }
}

function PublicProfile({ userId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(null);

  useEffect(() => {
    // console.log('[PublicProfile] useEffect triggered for userId:', userId);
    fetchPublicProfile(userId)
      .then(profile => {
        setProfile(profile);
        // console.log('[PublicProfile] Profile set:', profile);
      })
      .catch(err => {
        alert('Error: ' + err.message);
        // console.error('[PublicProfile] Fetch error:', err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // Fetch user's posts/ideas
  useEffect(() => {
    if (userId) {
      fetchUserPosts(userId);
    }
  }, [userId]);

  const fetchUserPosts = async (userId) => {
    try {
      setPostsLoading(true);
      setPostsError(null);
      
      // Try different possible API endpoints for user posts
      const possibleEndpoints = [
        `/api/ideas/user/${userId}`,
        `/api/users/${userId}/ideas`,
        `/api/ideas?author=${userId}`
      ];
      
      let response = null;
      let data = null;
      
      for (const endpoint of possibleEndpoints) {
        try {
          response = await fetch(endpoint, { credentials: 'include' });
          if (response.ok) {
            data = await response.json();
            console.log('[PublicProfile] API Response from', endpoint, ':', data);
            break;
          }
        } catch (err) {
          continue; // Try next endpoint
        }
      }
      
      if (data) {
        // Handle different response formats
        const posts = data.ideas || data.posts || data || [];
        console.log('[PublicProfile] Processed posts:', posts);
        
        // Additional validation to ensure posts are proper objects
        const validPosts = Array.isArray(posts) ? posts.filter(post => {
          if (!post || typeof post !== 'object') {
            console.warn('[PublicProfile] Invalid post found:', post);
            return false;
          }
          return true;
        }) : [];
        
        setUserPosts(validPosts);
      } else {
        setUserPosts([]);
      }
    } catch (err) {
      console.error('[PublicProfile] Error fetching user posts:', err);
      setPostsError('Failed to load user posts');
      setUserPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center text-gray-400">Loading...</div>;
  if (!profile) return <div className="flex items-center justify-center text-gray-400">User not found.</div>;

  // Status ring color
  const statusRing = profile.status === 'active' ? 'border-green-500' : profile.status === 'busy' ? 'border-yellow-400' : 'border-gray-400';
  const statusDot = profile.status === 'active' ? 'bg-green-500' : profile.status === 'busy' ? 'bg-yellow-400' : 'bg-gray-400';

  return (
    <div className="items-center bg-gray-50">
      <div className=" max-w-3xl bg-white border border-gray-200 md:p-12 mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar + Info */}
          <div className="flex flex-col items-start gap-4 min-w-[140px]">
            <div className={`rounded-full border-4 ${statusRing} w-32 h-32 flex items-center justify-center`}>
              <UserAvatar
                userId={userId}
                avatarUrl={profile.avatar}
                size={112}
                isMentor={profile.isMentor}
                isInvestor={profile.isInvestor}
              />
            </div>
          </div>
          {/* Main Info */}
          <div className="flex-1 flex flex-col gap-2 items-start">
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{profile.fullName}</div>
            {profile.email && <div className="text-gray-500 text-base">@{profile.email}</div>}
            {profile.phone && <div className="text-gray-500 text-base">Phone: {profile.phone}</div>}
            <div className="flex items-center gap-2 mt-1 mb-2">
              <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
              <span className="text-sm text-gray-400 capitalize">{profile.status || 'active'}</span>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-2">
              <button className="px-3 py-1 border border-blue-500 text-blue-600 rounded-md font-normal bg-white hover:bg-blue-50 transition text-sm">Connect</button>
              <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md font-normal bg-white hover:bg-gray-100 transition text-sm">Message</button>
              <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md font-normal bg-white hover:bg-gray-100 transition text-sm">Invite to Team</button>
              <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md font-normal bg-white hover:bg-gray-100 transition text-sm">Endorse</button>
              <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md font-normal bg-white hover:bg-gray-100 transition text-sm">Share</button>
            </div>
          </div>
        </div>
        {/* Bio */}
        {profile.bio && (
          <div className="mt-8 mb-4">
            <div className="text-xs text-gray-500 mb-1 lowercase">bio</div>
            <div className="text-base text-gray-800">{profile.bio}</div>
          </div>
        )}
        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1 lowercase">skills</div>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">{typeof skill === 'string' ? skill : (skill && skill.name ? skill.name : '')}</span>
              ))}
            </div>
          </div>
        )}
        {/* Social Links */}
        {profile.socialLinks && profile.socialLinks.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1 lowercase">social links</div>
            <ul className="flex flex-col gap-1">
              {profile.socialLinks.map((link, idx) => (
                <li key={link._id || idx} className="flex items-center gap-2 text-base text-gray-700">
                  <span className="font-medium text-gray-600 min-w-[70px]">{link.type}:</span>
                  <a href={link.value} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 hover:underline">{link.value}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Interested Roles */}
        {profile.interestedRoles && profile.interestedRoles.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1 lowercase">interested roles</div>
            <div className="flex flex-wrap gap-2">
              {profile.interestedRoles.map((role, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">{typeof role === 'string' ? role : (role && role.name ? role.name : '')}</span>
              ))}
            </div>
          </div>
        )}
        {/* Resume / Portfolio */}
        {(profile.resume || profile.portfolio) && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1 lowercase">resume</div>
            <div className="flex flex-wrap gap-3">
              {profile.resume && <a href={profile.resume} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-base">View Resume</a>}
              {profile.portfolio && <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-base">Portfolio</a>}
            </div>
          </div>
        )}
        {/* Wishlist Ideas */}
        {profile.wishlist && profile.wishlist.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1 lowercase">idea wishlist</div>
            <ul className="flex flex-wrap gap-2">
              {profile.wishlist.map((wish, idx) => (
                <li key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">{wish}</li>
              ))}
            </ul>
          </div>
        )}
        {/* Roadmap / Activity */}
        {profile.roadmap && profile.roadmap.length > 0 && (
          <div className="mb-2">
            <div className="text-xs text-gray-500 mb-1 lowercase">roadmap</div>
            <ul className="flex flex-col gap-1">
              {profile.roadmap.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-base text-gray-700">
                  <span>{item.title}</span>
                  {item.status === 'done' && <span className="text-green-600">✅</span>}
                  {item.status === 'in-progress' && <span className="text-yellow-500">🚧</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* User Posts/Ideas Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Ideas & Posts</h3>
          
          {postsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-gray-50 p-4 rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : postsError ? (
            <div className="text-center py-6 text-gray-500">
              <p>{postsError}</p>
            </div>
          ) : userPosts.length > 0 ? (
            <div className="space-y-4">
              {userPosts.filter(post => post && typeof post === 'object').slice(0, 5).map((post, index) => (
                <div key={post._id || post.id || index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {(typeof post.title === 'string' ? post.title : '') || 
                     (typeof post.pitch === 'string' ? post.pitch : '') || 
                     'Untitled Idea'}
                  </h4>
                  {post.description && typeof post.description === 'string' && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {post.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
                    </span>
                    <div className="flex items-center space-x-4">
                      {post.likes && (
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                          </svg>
                          {Array.isArray(post.likes) ? post.likes.length : (typeof post.likes === 'number' ? post.likes : 0)}
                        </span>
                      )}
                      {post.approaches && (
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          {Array.isArray(post.approaches) ? post.approaches.length : (typeof post.approaches === 'number' ? post.approaches : 0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {userPosts.length > 5 && (
                <div className="text-center pt-3">
                  <span className="text-sm text-gray-500">
                    Showing 5 of {userPosts.length} ideas
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p>No public ideas shared yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicProfile; 