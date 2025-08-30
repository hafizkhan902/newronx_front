import React, { useState, useEffect } from 'react';
import BrainstormPost from '../../BrainstormPost';
import { Link } from 'react-router-dom';
import PublicProfile from './PublicProfile';
import UserAvatar from '../../UserAvatar';

function MyIdeasSection({ userId, contributions = [], userContributions = [], setSelectedUserId, onShowPublicProfile }) {
  // Tab state
  const [activeTab, setActiveTab] = useState('ideas');
  const [stats, setStats] = useState({ totalIdeas: 0, totalAppreciation: 0, totalApproaches: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contribStats, setContribStats] = useState({ contributions: 0, suggestions: 0, approaches: 0, appreciations: 0 });
  const [contribLoading, setContribLoading] = useState(false);
  const [contribError, setContribError] = useState(null);
  const [showIdeasList, setShowIdeasList] = useState(false);
  const [myIdeas, setMyIdeas] = useState([]);
  const [showAppreciatedList, setShowAppreciatedList] = useState(false);
  const [appreciatedIdeas, setAppreciatedIdeas] = useState([]);
  const [showAppreciationsBox, setShowAppreciationsBox] = useState(false);
  const [appreciations, setAppreciations] = useState([]);
  const [appreciationsLoading, setAppreciationsLoading] = useState(false);
  const [appreciationsError, setAppreciationsError] = useState(null);
  const [showApproachesList, setShowApproachesList] = useState(false);
  const [myApproaches, setMyApproaches] = useState([]);
  const [approachesLoading, setApproachesLoading] = useState(false);
  const [approachesError, setApproachesError] = useState(null);
  // Remove local public profile state since it's now handled by parent
  // const [selectedPublicUserId, setSelectedPublicUserId] = useState(null);
  // const [showPublicProfile, setShowPublicProfile] = useState(false);
  // const [publicProfileUserId, setPublicProfileUserId] = useState(null);

  // Helper to try multiple endpoints until one succeeds
  const tryEndpoints = async (endpoints, options = {}) => {
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, { credentials: 'include', cache: 'no-store', ...options });
        if (!res.ok) continue;
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          return {};
        }
      } catch {}
    }
    throw new Error('All endpoints failed');
  };

  // Fetch stats for My Ideas from backend (with fallbacks)
  useEffect(() => {
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await tryEndpoints([
          '/api/ideas/my/stats',
          '/api/users/profile/ideas/stats',
          '/api/ideas/stats?scope=my',
          '/api/ideas/stats?mine=true'
        ]);
        setStats({
          totalIdeas: data.totalIdeas || data.ideas || 0,
          totalAppreciation: data.totalAppreciation || data.appreciations || 0,
          totalApproaches: data.totalApproaches || data.approaches || 0,
        });
      } catch {
        setError('Failed to fetch your stats');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Helper function to fetch user's ideas
  const fetchMyIdeas = async () => {
    const data = await tryEndpoints([
      '/api/ideas/my',
      '/api/users/profile/ideas',
      '/api/ideas?scope=my',
      '/api/ideas?mine=true'
    ]);
    const ideas = data.ideas || data.items || data;
    return Array.isArray(ideas) ? ideas : [];
  };

  // Fetch user's ideas for the list only when list is shown
  useEffect(() => {
    if (!showIdeasList) return;
    (async () => {
      try {
        const ideas = await fetchMyIdeas();
        setMyIdeas(Array.isArray(ideas) ? ideas : []);
      } catch {
        setMyIdeas([]);
      }
    })();
  }, [showIdeasList]);

  // Fetch user's appreciated ideas for the list only when list is shown
  useEffect(() => {
    if (!showAppreciatedList) return;
    setAppreciatedIdeas(myIdeas.filter(idea => idea.appreciated));
  }, [showAppreciatedList, myIdeas]);

  // Fetch user's approaches for the list only when list is shown
  useEffect(() => {
    if (!showApproachesList) return;
    setApproachesLoading(true);
    setApproachesError(null);
    (async () => {
      try {
        const data = await tryEndpoints([
          '/api/ideas/my/approaches',
          '/api/users/profile/approaches',
          '/api/ideas/approaches?scope=my'
        ]);
        console.log('[MyIdeasSection] Approaches API response:', data);
        const approaches = Array.isArray(data.approaches) ? data.approaches : (Array.isArray(data) ? data : []);
        console.log('[MyIdeasSection] Processed approaches:', approaches);
        setMyApproaches(approaches);
      } catch (err) {
        setApproachesError('Failed to fetch your approaches');
      } finally {
        setApproachesLoading(false);
      }
    })();
  }, [showApproachesList]);

  // Fetch stats for My Contribution from backend
  useEffect(() => {
    setContribLoading(true);
    setContribError(null);
    (async () => {
      try {
        const data = await tryEndpoints([
          '/api/ideas/my/contributions',
          '/api/users/profile/contributions',
          '/api/contributions/my',
          '/api/ideas/contributions?scope=my'
        ]);
        setContribStats({
          contributions: data.contributions || data.total || 0,
          suggestions: data.suggestions || 0,
          approaches: data.approaches || 0,
          appreciations: data.appreciations || 0,
        });
      } catch (err) {
        setContribError('Failed to fetch your contribution stats');
      } finally {
        setContribLoading(false);
      }
    })();
  }, []);

  // Fetch appreciations when box is shown
  useEffect(() => {
    if (!showAppreciationsBox) return;
    setAppreciationsLoading(true);
    setAppreciationsError(null);
    (async () => {
      try {
        const data = await tryEndpoints([
          '/api/ideas/my/appreciations',
          '/api/users/profile/appreciations',
          '/api/ideas/appreciations?scope=my'
        ]);
        console.log('[MyIdeasSection] Appreciations API response:', data);
        const appreciations = Array.isArray(data.appreciations) ? data.appreciations : (Array.isArray(data) ? data : []);
        console.log('[MyIdeasSection] Processed appreciations:', appreciations);
        setAppreciations(appreciations);
      } catch (err) {
        setAppreciationsError('Failed to fetch appreciations');
      } finally {
        setAppreciationsLoading(false);
      }
    })();
  }, [showAppreciationsBox]);

  return (
    <div className="w-full">
      {/* Professional Section Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
          Activity Overview
        </h1>
      </div>

      {/* Professional Tab Navigation */}
      <div className="mb-10">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
        <button
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'ideas' 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          onClick={() => setActiveTab('ideas')}
        >
              Ideas & Engagement
        </button>
        <button
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'contrib' 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          onClick={() => setActiveTab('contrib')}
        >
              Community Contributions
        </button>
          </nav>
        </div>
      </div>

      {/* Ideas & Engagement Tab */}
      {activeTab === 'ideas' && (
        <div className="space-y-8">
          {/* Professional Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ideas Card */}
            <div
              className={`bg-white border border-gray-200 p-6 transition-all duration-200 ${
                stats.totalIdeas > 0 
                  ? 'hover:border-gray-300 hover:shadow-sm cursor-pointer' 
                  : 'opacity-60'
              }`}
              onClick={() => {
                if (stats.totalIdeas > 0) {
                  setShowIdeasList(!showIdeasList);
                  setShowAppreciationsBox(false);
                  setShowApproachesList(false);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-gray-100 flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Ideas Published</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalIdeas}</p>
                </div>
              </div>
            </div>

            {/* Appreciations Card */}
            <div
              className={`bg-white border border-gray-200 p-6 transition-all duration-200 ${
                stats.totalAppreciation > 0 
                  ? 'hover:border-gray-300 hover:shadow-sm cursor-pointer' 
                  : 'opacity-60'
              }`}
              onClick={() => {
                if (stats.totalAppreciation > 0) {
                  setShowAppreciationsBox(!showAppreciationsBox);
                  setShowIdeasList(false);
                  setShowApproachesList(false);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-gray-100 flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Appreciations</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalAppreciation}</p>
                </div>
              </div>
            </div>

            {/* Approaches Card */}
            <div
              className={`bg-white border border-gray-200 p-6 transition-all duration-200 ${
                stats.totalApproaches > 0 
                  ? 'hover:border-gray-300 hover:shadow-sm cursor-pointer' 
                  : 'opacity-60'
              }`}
              onClick={() => {
                if (stats.totalApproaches > 0) {
                  setShowApproachesList(!showApproachesList);
                      setShowIdeasList(false);
                      setShowAppreciationsBox(false);
                    }
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-gray-100 flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Approaches Received</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalApproaches}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Modal Overlays */}
      {showAppreciationsBox && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
              <div className="bg-white border border-gray-200 max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Appreciations Received</h2>
              <button
                onClick={() => setShowAppreciationsBox(false)}
                      className="p-2 hover:bg-gray-200 transition-colors duration-200"
              >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
              </button>
            </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-96">
            {appreciationsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 animate-spin"></div>
                    </div>
            ) : appreciationsError ? (
                    <div className="text-center py-12">
                      <p className="text-red-600">{appreciationsError}</p>
                    </div>
            ) : appreciations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                      </div>
                      <p className="text-gray-500">No appreciations received yet</p>
                    </div>
            ) : (
                    <div className="space-y-4">
                {appreciations.map((item, idx) => (
                        <div key={idx} className="flex items-start space-x-3 p-3 border border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                                                      <UserAvatar
                              userId={item.user?._id}
                              avatarUrl={item.user?.avatar}
                              size={40}
                              isMentor={item.user?.isMentor}
                              isInvestor={item.user?.isInvestor}
                              onClick={() => {
                                if (onShowPublicProfile) {
                                  onShowPublicProfile(item.user?._id);
                                }
                              }}
                            />
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 text-sm leading-relaxed">{item.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.user?.name || 'Anonymous'}</p>
                          </div>
                        </div>
                ))}
                    </div>
            )}
                </div>
          </div>
        </div>
      )}

          {/* Approaches Modal */}
      {showApproachesList && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
              <div className="bg-white border border-gray-200 max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Approaches Received</h2>
              <button
                onClick={() => setShowApproachesList(false)}
                      className="p-2 hover:bg-gray-200 transition-colors duration-200"
              >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
              </button>
            </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-96">
            {approachesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 animate-spin"></div>
                    </div>
            ) : approachesError ? (
                    <div className="text-center py-12">
                      <p className="text-red-600">{approachesError}</p>
                    </div>
            ) : myApproaches.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">No approaches received yet</p>
                    </div>
            ) : (
                    <div className="space-y-4">
                {myApproaches.map((item, idx) => (
                        <div key={idx} className="flex items-start space-x-3 p-3 border border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                          {(item.user?._id || item.userId || item._id) && item.avatar && (
                            <UserAvatar
                                userId={item.user?._id || item.userId || item._id}
                                avatarUrl={item.avatar}
                                size={40}
                                isMentor={item.user?.isMentor}
                                isInvestor={item.user?.isInvestor}
                                onClick={() => {
                                  if (onShowPublicProfile) {
                                    onShowPublicProfile(item.user?._id || item.userId || item._id);
                                  }
                                }}
                              />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 text-sm leading-relaxed">{item.message || 'Approach details here'}</p>
                          </div>
                        </div>
                ))}
                    </div>
            )}
                </div>
          </div>
        </div>
      )}

          {/* Ideas List */}
      {showIdeasList && (
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">Published Ideas</h2>
                <p className="text-gray-600 text-sm">Ideas you have shared with the community</p>
              </div>
            {myIdeas.length > 0 ? (
                myIdeas.map(post => (
                  <div key={post._id} className="bg-white border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                    <BrainstormPost post={post} />
                  </div>
                ))
            ) : (
                <div className="text-center py-12 bg-gray-50 border border-gray-200">
                  <div className="w-12 h-12 bg-gray-200 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
          </div>
                  <p className="text-gray-500">Loading your ideas...</p>
        </div>
      )}
            </div>
          )}

          {/* Professional Empty State */}
          {!showIdeasList && !showAppreciationsBox && !showApproachesList && (
            <div className="bg-gray-50 border border-gray-200 p-12 text-center">
              {loading ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading activity data...</p>
            </div>
              ) : error ? (
                <div>
                  <div className="w-12 h-12 bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
            </div>
                  <p className="text-red-600">{error}</p>
            </div>
              ) : stats.totalIdeas > 0 ? (
                <div>
                  <div className="w-12 h-12 bg-gray-200 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
          </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Summary</h3>
                  <p className="text-gray-600">Click on any metric above to view detailed information</p>
        </div>
              ) : (
                <div>
                  <div className="w-12 h-12 bg-gray-200 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
                  <p className="text-gray-600">Start by publishing your first idea to begin tracking your activity</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Community Contributions Tab */}
      {activeTab === 'contrib' && (
        <div className="space-y-8">
          {/* Professional Contribution Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Contributions', value: contribStats.contributions },
              { label: 'Suggestions Made', value: contribStats.suggestions },
              { label: 'Approaches Sent', value: contribStats.approaches },
              { label: 'Appreciations Given', value: contribStats.appreciations }
            ].map((stat, index) => (
              <div key={index} className="bg-white border border-gray-200 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Professional Empty State for Contributions */}
          <div className="bg-gray-50 border border-gray-200 p-12 text-center">
          {contribLoading ? (
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 animate-spin mb-4"></div>
                <p className="text-gray-600">Loading contribution data...</p>
              </div>
          ) : contribError ? (
              <div>
                <div className="w-12 h-12 bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600">{contribError}</p>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 bg-gray-200 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Community Engagement</h3>
                <p className="text-gray-600">Participate in discussions and provide feedback to build your contribution history</p>
              </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyIdeasSection; 