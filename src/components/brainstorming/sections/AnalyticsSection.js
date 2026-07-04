import React, { useState, useEffect } from 'react';
import { useUser } from '../../../UserContext';

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'indigo', icon }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    green:  'bg-green-50  text-green-600  border-green-100',
    amber:  'bg-amber-50  text-amber-600  border-amber-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    sky:    'bg-sky-50    text-sky-600    border-sky-100',
    rose:   'bg-rose-50   text-rose-600   border-rose-100',
  };
  return (
    <div className={`flex items-center gap-4 p-5 rounded-2xl border ${colors[color]} bg-opacity-60`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
        <p className="text-sm font-semibold text-gray-700 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-base font-bold text-gray-900 mb-4">{children}</h2>;
}

function ProgressBar({ label, value, max, color = 'bg-indigo-500' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs text-gray-500 truncate shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-xs font-semibold text-gray-600 text-right shrink-0">{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function AnalyticsSection() {
  const { user } = useUser();
  const [loading,    setLoading]    = useState(true);
  const [myIdeas,    setMyIdeas]    = useState([]);
  const [feedIdeas,  setFeedIdeas]  = useState([]);
  const [period,     setPeriod]     = useState('all'); // 'week' | 'month' | 'all'

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [feedRes, myRes] = await Promise.allSettled([
          fetch('/api/ideas/feed?limit=100', { credentials: 'include' }),
          user?._id ? fetch(`/api/ideas/user/${user._id}`, { credentials: 'include' }) : Promise.resolve(null),
        ]);

        if (feedRes.status === 'fulfilled' && feedRes.value.ok) {
          const d = await feedRes.value.json();
          if (alive) setFeedIdeas(d.ideas || d || []);
        }
        if (myRes.status === 'fulfilled' && myRes.value?.ok) {
          const d = await myRes.value.json();
          if (alive) setMyIdeas(d.ideas || d || []);
        }
      } catch {}
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [user]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const now   = new Date();
  const weekAgo  = new Date(now - 7  * 86400000);
  const monthAgo = new Date(now - 30 * 86400000);

  const inPeriod = (idea) => {
    const d = new Date(idea.createdAt);
    if (period === 'week')  return d >= weekAgo;
    if (period === 'month') return d >= monthAgo;
    return true;
  };

  const visibleFeed = feedIdeas.filter(inPeriod);
  const visibleMine = myIdeas.filter(inPeriod);

  // Platform totals
  const totalIdeas    = visibleFeed.length;
  const totalLikes    = visibleFeed.reduce((s, i) => s + (i.appreciateCount || i.likes || 0), 0);
  const totalComments = visibleFeed.reduce((s, i) => s + (i.commentsCount   || i.comments?.length || 0), 0);
  const totalPropose  = visibleFeed.reduce((s, i) => s + (i.proposeCount    || 0), 0);

  // My stats
  const myViews       = visibleMine.reduce((s, i) => s + (i.views || 0), 0);
  const myLikes       = visibleMine.reduce((s, i) => s + (i.appreciateCount || i.likes || 0), 0);
  const myPropose     = visibleMine.reduce((s, i) => s + (i.proposeCount || 0), 0);

  // Tag distribution (community)
  const tagMap = {};
  visibleFeed.forEach(idea => {
    (idea.tags || []).forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; });
  });
  const topTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxTag  = topTags[0]?.[1] || 1;

  // Top ideas by engagement
  const topIdeas = [...visibleFeed]
    .map(i => ({ ...i, engagement: (i.appreciateCount || 0) + (i.proposeCount || 0) + (i.commentsCount || 0) }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  // My ideas by engagement
  const myTopIdeas = [...visibleMine]
    .map(i => ({ ...i, engagement: (i.appreciateCount || 0) + (i.proposeCount || 0) }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  const tagColors = ['bg-indigo-500','bg-violet-500','bg-sky-500','bg-teal-500','bg-amber-500','bg-rose-500'];

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-9 w-9 border-2 border-indigo-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header + period toggle ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Analytics</h1>
          <p className="text-sm text-gray-500">Platform activity and your idea performance</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {[['week','7d'],['month','30d'],['all','All']].map(([key, label]) => (
            <button key={key} onClick={() => setPeriod(key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${period === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Community overview ───────────────────────────────────────────────── */}
      <div>
        <SectionTitle>Community Overview</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Ideas Published" value={totalIdeas} color="indigo"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>}
          />
          <StatCard label="Total Likes" value={totalLikes} color="rose"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>}
          />
          <StatCard label="Proposals" value={totalPropose} color="green"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>}
          />
          <StatCard label="Discussions" value={totalComments} color="amber"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── My Performance ──────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <SectionTitle>My Performance</SectionTitle>
          {myIdeas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg className="w-10 h-10 text-gray-200 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"/></svg>
              <p className="text-sm text-gray-500">Post your first idea to see your stats</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'My Ideas',    val: visibleMine.length,  color: 'text-indigo-600' },
                  { label: 'Likes',       val: myLikes,             color: 'text-rose-500'   },
                  { label: 'Proposals',   val: myPropose,           color: 'text-green-600'  },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className={`text-xl font-black ${color}`}>{val}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {myTopIdeas.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Top Ideas</p>
                  <div className="space-y-2.5">
                    {myTopIdeas.map((idea, idx) => (
                      <div key={idea._id} className="flex items-center gap-3">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 shrink-0">{idx + 1}</span>
                        <p className="flex-1 text-sm text-gray-800 truncate">{idea.title || 'Untitled'}</p>
                        <span className="text-xs text-gray-400 font-medium shrink-0">{idea.engagement} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {myViews > 0 && (
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profile views</span>
                  <span className="text-sm font-bold text-sky-600">{myViews}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Top ideas (community) ────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <SectionTitle>Trending Ideas</SectionTitle>
          {topIdeas.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topIdeas.map((idea, idx) => (
                <div key={idea._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black text-white shrink-0 ${
                    idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-gray-200 text-gray-500'
                  }`}>{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{idea.title || 'Untitled'}</p>
                    <p className="text-xs text-gray-400">by {idea.author?.fullName || idea.author?.name || 'Unknown'}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-rose-400" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/></svg>
                      {idea.appreciateCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      {idea.proposeCount || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tag / category distribution ──────────────────────────────────────── */}
      {topTags.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <SectionTitle>Popular Topics</SectionTitle>
          <div className="space-y-3">
            {topTags.map(([tag, count], idx) => (
              <ProgressBar key={tag} label={tag} value={count} max={maxTag} color={tagColors[idx % tagColors.length]} />
            ))}
          </div>
          {/* Tag pills */}
          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-100">
            {topTags.map(([tag, count], idx) => (
              <span key={tag} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${tagColors[idx % tagColors.length]}`}>
                {tag}
                <span className="opacity-70">·{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Activity summary banner ──────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-semibold opacity-80">Platform health</p>
            <p className="text-2xl font-black mt-0.5">
              {totalIdeas > 0
                ? `${((totalLikes + totalPropose + totalComments) / totalIdeas).toFixed(1)} avg. interactions / idea`
                : 'No ideas yet'}
            </p>
          </div>
          <div className="flex gap-6">
            {[
              { label: 'Engagement rate', val: totalIdeas ? `${Math.min(99, Math.round(((totalLikes + totalPropose) / totalIdeas) * 10))}%` : '—' },
              { label: 'Avg. proposals',  val: totalIdeas ? (totalPropose / totalIdeas).toFixed(1) : '—' },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-black">{val}</p>
                <p className="text-xs opacity-70 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsSection;
