import React, { useRef, useState, useEffect, useMemo } from 'react';
import BrainstormPost from './BrainstormPost';
import './genie.css';
import FabMenu from './brainstorming/fab/FabMenu';
import InboxModal from './brainstorming/inbox/InboxModal';
import NotificationsModal from './brainstorming/notifications/NotificationsModal';
import FeedSection from './brainstorming/sections/FeedSection';
import NewPostSection from './brainstorming/sections/NewPostSection';
import SearchSection from './brainstorming/sections/SearchSection';
import AnalyticsSection from './brainstorming/sections/AnalyticsSection';
import ApproachModal from './brainstorming/sections/ApproachModal';
import ProfileSection from './brainstorming/sections/ProfileSection';
import SettingsSection from './brainstorming/sections/SettingsSection';
import InboxSection from './brainstorming/sections/InboxSection';
import PublicProfile from './brainstorming/sections/PublicProfile';
import { useUser } from '../UserContext';
// ── SVG icon helpers ──────────────────────────────────────────────────────────
const Ico = {
  feed: (cls = 'w-4 h-4') => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="4" y="6" width="16" height="4" rx="2" /><rect x="4" y="14" width="16" height="4" rx="2" />
    </svg>
  ),
  plus: (cls = 'w-4 h-4') => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  inbox: (cls = 'w-4 h-4') => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  search: (cls = 'w-4 h-4') => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  ),
  profile: (cls = 'w-4 h-4') => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" /><path d="M2 20c0-4 8-6 10-6s10 2 10 6" />
    </svg>
  ),
  settings: (cls = 'w-4 h-4') => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 008 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09A1.65 1.65 0 0016 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.14.31.22.65.22 1v.09A1.65 1.65 0 0021 12a1.65 1.65 0 00-1.6 1z" />
    </svg>
  ),
  bell: (cls = 'w-5 h-5') => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17H9v-7a3 3 0 116 0v7zm-3 4a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
    </svg>
  ),
  filter: (cls = 'w-4 h-4') => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M10 20h4" />
    </svg>
  ),
  close: (cls = 'w-5 h-5') => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  rocket: (cls = 'w-4 h-4') => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c3 0 7 2 7 9-2 0-3.5 1-4.5 2.5L12 21l-2.5-6.5C8.5 13 7 12 5 12c0-7 4-9 7-9z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  ),
  addUser: (cls = 'w-5 h-5') => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  chevronDown: (cls = 'w-4 h-4') => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
};

// ── Desktop/mobile nav tab definitions ───────────────────────────────────────
const DESKTOP_NAV = [
  { key: 'feed',      label: 'Home' },
  { key: 'discovery', label: 'Discovery' },
  { key: 'inbox',     label: 'Teams' },
];

const BOTTOM_NAV = [
  { key: 'feed',    label: 'Home',    icon: Ico.feed },
  { key: 'new',     label: 'Post',    icon: Ico.plus },
  { key: 'inbox',   label: 'Inbox',   icon: Ico.inbox },
  { key: 'search',  label: 'Search',  icon: Ico.search },
  { key: 'profile', label: 'Profile', icon: Ico.profile },
];

// ── User avatar helper ────────────────────────────────────────────────────────
function UserInitialsAvatar({ user, size = 36, onClick }) {
  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : (user?.firstName?.[0] || 'U').toUpperCase();

  const style = { width: size, height: size, minWidth: size };

  if (user?.avatar?.startsWith('http')) {
    return (
      <button onClick={onClick} style={style}
        className="rounded-full overflow-hidden ring-2 ring-gray-200 hover:ring-indigo-400 transition-all focus:outline-none"
      >
        <img src={user.avatar} alt={initials} className="w-full h-full object-cover" />
      </button>
    );
  }
  return (
    <button onClick={onClick} style={style}
      className="rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-gray-200 hover:ring-indigo-400 transition-all focus:outline-none"
    >
      {initials}
    </button>
  );
}

// ── Idea Detail Modal — uses the existing BrainstormPost card ─────────────────
function IdeaDetailModal({ idea, onClose }) {
  if (!idea) return null;
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button sits above the card */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-600 shadow transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <BrainstormPost post={idea} />
      </div>
    </div>
  );
}

// ── Top navbar ────────────────────────────────────────────────────────────────
// localSearch: substring match on already-loaded feed posts (case-insensitive)
function localSearch(posts, q) {
  if (!q || !posts?.length) return [];
  const lq = q.toLowerCase();
  return posts.filter(p =>
    p.title?.toLowerCase().includes(lq) ||
    p.description?.toLowerCase().includes(lq) ||
    (p.tags || []).some(t => t.toLowerCase().includes(lq)) ||
    p.author?.fullName?.toLowerCase().includes(lq)
  ).slice(0, 7);
}

function AppNavbar({ user, activeFeature, onTabClick, onNewIdea, onAvatarClick, onToggleSidebar, onBell, feedPosts }) {
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [searchErr,   setSearchErr]   = useState('');
  const [open,        setOpen]        = useState(false);
  const [activeIdea,  setActiveIdea]  = useState(null);
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nxRecentSearches') || '[]'); } catch { return []; }
  });
  const searchRef = useRef(null);
  const timerRef  = useRef(null);

  const saveRecent = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const next = [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, 5);
      try { localStorage.setItem('nxRecentSearches', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try { localStorage.removeItem('nxRecentSearches'); } catch {}
  };

  // Debounced search — timer in ref so React re-renders never cancel it
  const handleQueryChange = (value) => {
    setQuery(value);
    if (!value.trim()) {
      clearTimeout(timerRef.current);
      setResults([]); setOpen(true); setSearchErr(''); setSearching(false);
      return;
    }
    setOpen(true);
    setSearching(true);
    setSearchErr('');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/ideas/search?q=${encodeURIComponent(value.trim())}&limit=7`,
          { method: 'GET', credentials: 'include' }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const apiIdeas =
          Array.isArray(json.data?.ideas)  ? json.data.ideas  :
          Array.isArray(json.ideas)         ? json.ideas        :
          Array.isArray(json.data)          ? json.data         :
          Array.isArray(json.results)       ? json.results      :
          [];
        const final = apiIdeas.length > 0 ? apiIdeas : localSearch(feedPosts, value.trim());
        setResults(final);
        setSearchErr('');
        if (final.length > 0) saveRecent(value);
      } catch (e) {
        const local = localSearch(feedPosts, value.trim());
        setResults(local);
        setSearchErr(local.length ? '' : e.message);
        if (local.length > 0) saveRecent(value);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clearSearch = () => {
    clearTimeout(timerRef.current);
    setQuery(''); setResults([]); setOpen(false); setSearchErr(''); setSearching(false);
  };

  // Deterministic pastel colour for idea icon based on first char
  const ideaIconColor = (idea) => {
    const palettes = [
      { bg: 'bg-indigo-100', icon: 'text-indigo-500' },
      { bg: 'bg-emerald-100', icon: 'text-emerald-500' },
      { bg: 'bg-violet-100',  icon: 'text-violet-500'  },
      { bg: 'bg-rose-100',    icon: 'text-rose-500'    },
      { bg: 'bg-amber-100',   icon: 'text-amber-500'   },
      { bg: 'bg-sky-100',     icon: 'text-sky-500'     },
    ];
    const seed = (idea._id || idea.title || '').charCodeAt(0) || 0;
    return palettes[seed % palettes.length];
  };

  // Short status badge derived from idea fields
  const ideaBadge = (idea) => {
    if (idea.status === 'draft') return { label: 'DRAFT', cls: 'bg-gray-100 text-gray-500' };
    if ((idea.proposeCount || 0) >= 3) return { label: 'HOT', cls: 'bg-rose-100 text-rose-600' };
    if ((idea.appreciateCount || 0) >= 5) return { label: 'TRENDING', cls: 'bg-amber-100 text-amber-600' };
    return { label: 'IDEA', cls: 'bg-emerald-100 text-emerald-600' };
  };

  const showDropdown = open;
  const hasQuery = query.trim().length > 0;

  return (
    <nav className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex items-center gap-3 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-indigo-700 font-black text-xl tracking-tight select-none">Newronx</span>
      </div>

      {/* Desktop center tabs */}
      <div className="hidden md:flex items-center gap-1 ml-4">
        {DESKTOP_NAV.map(tab => (
          <button key={tab.key} onClick={() => onTabClick(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFeature === tab.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Live search ── */}
      <div ref={searchRef} className="hidden md:flex flex-1 max-w-sm ml-4 relative">
        {/* Input */}
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {searching
              ? <svg className="w-4 h-4 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/></svg>
            }
          </span>
          <input
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Search ideas, people, tags…"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-8 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white focus:border-transparent transition"
          />
          {query && (
            <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {/* ── Search dropdown ── */}
        {showDropdown && (
          <div className="absolute top-full left-0 w-[420px] mt-2 bg-white border border-gray-200/80 rounded-2xl shadow-2xl shadow-black/10 z-[9999] overflow-hidden">

            {/* Recent searches — shown when input is empty */}
            {!hasQuery && recentSearches.length > 0 && (
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Recent Searches</span>
                  <button onClick={clearRecent} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition focus:outline-none">Clear</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleQueryChange(s)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 rounded-full text-xs font-medium transition"
                    >
                      <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No-query + no recent: prompt */}
            {!hasQuery && recentSearches.length === 0 && (
              <div className="px-5 py-6 flex flex-col items-center gap-2 text-center">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/></svg>
                <p className="text-sm text-gray-400">Type to search ideas, tags, or people</p>
              </div>
            )}

            {/* Searching spinner */}
            {hasQuery && searching && (
              <div className="flex items-center gap-3 px-5 py-5 text-sm text-gray-500">
                <svg className="w-4 h-4 text-indigo-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Searching for <span className="font-semibold text-gray-700">"{query}"</span>…
              </div>
            )}

            {/* Error state */}
            {hasQuery && !searching && searchErr && (
              <div className="px-5 py-4 text-sm text-red-500 text-center">
                Search failed — please try again
              </div>
            )}

            {/* Empty state */}
            {hasQuery && !searching && !searchErr && results.length === 0 && (
              <div className="px-5 py-6 flex flex-col items-center gap-2 text-center">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p className="text-sm text-gray-500">No matches for <span className="font-semibold">"{query}"</span></p>
                <p className="text-xs text-gray-400">Try a different keyword or tag</p>
              </div>
            )}

            {/* Results */}
            {hasQuery && !searching && results.length > 0 && (
              <>
                <div className="px-5 pt-4 pb-2">
                  <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Top Matches</span>
                </div>
                <ul className="pb-1">
                  {results.map((idea) => {
                    const { bg, icon } = ideaIconColor(idea);
                    const badge = ideaBadge(idea);
                    const author = idea.author?.fullName || idea.author?.name || '';
                    const tags   = (idea.tags || []).slice(0, 2);
                    return (
                      <li key={idea._id || idea.id}>
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition text-left group"
                          onClick={() => { setOpen(false); setActiveIdea(idea); }}
                        >
                          {/* Icon square */}
                          <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                            <svg className={`w-5 h-5 ${icon}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                            </svg>
                          </div>

                          {/* Text block */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate leading-tight group-hover:text-indigo-700 transition">
                              {idea.title || 'Untitled'}
                            </p>
                            {author && (
                              <p className="text-xs text-gray-400 mt-0.5">by {author}</p>
                            )}
                            {tags.length > 0 && (
                              <div className="flex gap-1.5 mt-1">
                                {tags.map(t => (
                                  <span key={t} className="text-[11px] font-medium text-indigo-500">#{t}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Badge */}
                          <span className={`shrink-0 text-[9px] font-black tracking-widest uppercase px-2 py-1 rounded-md ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => { onTabClick('search'); clearSearch(); }}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition focus:outline-none"
                  >
                    View all results for "{query}" →
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {onToggleSidebar && (
          <button onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition focus:outline-none" aria-label="Filter">
            {Ico.filter()}
          </button>
        )}
        <button onClick={() => onTabClick('profile')} title="Settings"
          className={`hidden md:flex p-2 rounded-lg transition-all ${activeFeature === 'profile' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
          {Ico.settings()}
        </button>
        <button onClick={onBell}
          className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition focus:outline-none" aria-label="Notifications">
          {Ico.bell()}
        </button>
        <button onClick={onNewIdea}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition focus:outline-none">
          New Idea
        </button>
        <div className="flex items-center gap-1">
          <UserInitialsAvatar user={user} size={34} onClick={onAvatarClick} />
          <button onClick={onAvatarClick} className="text-gray-400 hover:text-gray-600 transition ml-0.5 focus:outline-none">
            {Ico.chevronDown()}
          </button>
        </div>
      </div>

      {/* Idea detail popup — rendered outside the nav flow but inside the component */}
      <IdeaDetailModal idea={activeIdea} onClose={() => setActiveIdea(null)} />
    </nav>
  );
}

// ── Mobile bottom navigation ──────────────────────────────────────────────────
function BottomNav({ activeFeature, onTabClick }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 md:hidden bg-white border-t border-gray-200 flex items-center safe-area-bottom shadow-lg">
      {BOTTOM_NAV.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onTabClick(key)}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium transition-all focus:outline-none ${
            activeFeature === key ? 'text-indigo-600' : 'text-gray-400 active:text-gray-600'
          }`}
        >
          {Icon(`w-5 h-5 ${activeFeature === key ? 'text-indigo-600' : 'text-gray-400'}`)}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

// ── Featured hero card (top of feed) ─────────────────────────────────────────
function FeaturedCard({ post, onExplore }) {
  return (
    <div className="relative rounded-2xl overflow-hidden mb-5 bg-gradient-to-br from-slate-900 via-teal-900/80 to-slate-800 min-h-[220px] flex flex-col justify-end p-7">
      {/* Decorative background circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-teal-500/10 blur-2xl" />
        <div className="absolute top-8 right-24 w-32 h-32 rounded-full bg-indigo-500/15 blur-xl" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex gap-2 mb-3">
          <span className="text-[10px] font-bold text-teal-300 bg-teal-900/70 border border-teal-700/60 px-3 py-1 rounded-full tracking-wide">
            FEATURED SPOTLIGHT
          </span>
          <span className="text-[10px] font-bold text-gray-300 bg-slate-700/70 border border-slate-600/60 px-3 py-1 rounded-full tracking-wide">
            TRENDING #1
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white leading-tight mb-2 max-w-lg">
          {post?.title || 'Next-Gen Quantum Ledger: The Decentralized Future'}
        </h2>
        <p className="text-sm text-gray-300 mb-5 max-w-md leading-relaxed">
          {post?.description
            ? post.description.slice(0, 100) + (post.description.length > 100 ? '…' : '')
            : 'Building the world\u2019s most secure and scalable decentralized asset management infrastructure.'}
        </p>
        <button
          onClick={() => post && onExplore(post)}
          className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100 transition shadow"
        >
          Explore Idea <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

// ── Horizontal category filter tabs ──────────────────────────────────────────
function CategoryTabs({ categories, selectedCategory, onSelectCategory }) {
  const staticTabs = ['all', 'Tech', 'Health', 'FinTech', 'SaaS'];
  const dynamicTabs = categories.map(c => c.name).filter(n => !staticTabs.includes(n));
  const tabs = [...staticTabs, ...dynamicTabs].slice(0, 8);

  return (
    <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onSelectCategory(tab)}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
            selectedCategory === tab
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          {tab === 'all' ? 'All Ideas' : tab}
        </button>
      ))}
      <button
        className="ml-auto shrink-0 p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition"
        title="Filter"
      >
        {Ico.filter()}
      </button>
    </div>
  );
}

// ── Right sidebar ─────────────────────────────────────────────────────────────
function RightSidebar({ feedPosts, onAvatarClick, onViewAll }) {
  const trending = useMemo(() => {
    return [...feedPosts]
      .sort((a, b) => (b.appreciateCount || 0) - (a.appreciateCount || 0))
      .slice(0, 3);
  }, [feedPosts]);

  const innovators = useMemo(() => {
    const seen = new Set();
    const authors = [];
    feedPosts.forEach(p => {
      const a = p.author;
      if (a?._id && !seen.has(String(a._id))) {
        seen.add(String(a._id));
        authors.push(a);
      }
    });
    return authors.slice(0, 3);
  }, [feedPosts]);

  return (
    <div className="space-y-4">
      {/* Trending */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-base">Trending</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">This Week</span>
        </div>
        <div className="space-y-3">
          {trending.length > 0 ? trending.map((post, i) => (
            <div key={post._id || i} className="flex items-start gap-3">
              <span className="text-2xl font-extrabold text-gray-200 w-9 shrink-0 leading-none pt-0.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800 leading-snug">{post.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{post.appreciateCount || 0} active participants</p>
              </div>
            </div>
          )) : (
            ['Modular Sat-Link Antennas', 'Web3 Identity Engine', 'CO2 Direct Air Capture'].map((title, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-2xl font-extrabold text-gray-200 w-9 shrink-0 leading-none pt-0.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{(9400 - i * 2200).toLocaleString()} active participants</p>
                </div>
              </div>
            ))
          )}
        </div>
        <button
          onClick={onViewAll}
          className="mt-4 w-full py-2 text-sm text-indigo-600 font-semibold border border-indigo-100 rounded-xl hover:bg-indigo-50 transition"
        >
          View All Leaderboards
        </button>
      </div>

      {/* Innovators to Watch */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 text-base mb-4">Innovators to Watch</h3>
        <div className="space-y-3">
          {innovators.length > 0 ? innovators.map(author => (
            <div key={author._id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onAvatarClick(author._id)}
                  className="w-9 h-9 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0 focus:outline-none hover:ring-2 hover:ring-indigo-300 transition"
                >
                  {author.avatar?.startsWith('http')
                    ? <img src={author.avatar} alt="" className="w-full h-full object-cover" />
                    : (author.fullName?.[0] || 'U').toUpperCase()}
                </button>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{author.fullName || author.firstName || 'Founder'}</p>
                  <p className="text-xs text-gray-400">{author.role || 'Innovator'}</p>
                </div>
              </div>
              <button className="text-gray-300 hover:text-indigo-600 transition focus:outline-none">
                {Ico.addUser()}
              </button>
            </div>
          )) : (
            [{ name: 'Alex Rivers', role: 'Full-stack Architect' }, { name: 'Elena Sol', role: 'VC Portfolio Lead' }].map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                    {p.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.role}</p>
                  </div>
                </div>
                <button className="text-gray-300 hover:text-indigo-600 transition focus:outline-none">{Ico.addUser()}</button>
              </div>
            ))
          )}
        </div>
        <button className="mt-4 text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1">
          Find more mentors <span aria-hidden="true">›</span>
        </button>
      </div>

      {/* Footer links */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
          {['Manifesto', 'Privacy', 'Security', 'Network'].map(link => (
            <span key={link} className="hover:text-gray-600 cursor-pointer transition">{link}</span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 leading-snug">
          © 2024 Newronx. Building the next generation of global founders.
        </p>
      </div>
    </div>
  );
}

// ── Mobile sidebar drawer ─────────────────────────────────────────────────────
function SidebarDrawer({ open, onClose, feedPosts, onAvatarClick, onViewAll }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 bottom-0 w-72 max-w-[85vw] z-40 md:hidden bg-white border-l border-gray-200 flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 shrink-0">
          <span className="font-bold text-gray-800 text-sm">Trending & Innovators</span>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition focus:outline-none">
            {Ico.close()}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <RightSidebar feedPosts={feedPosts} onAvatarClick={(id) => { onAvatarClick(id); onClose(); }} onViewAll={onViewAll} />
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function BrainstormingSection({ hideHeader }) {
  // ── State (all unchanged from original) ────────────────────────────────────
  const [activeFeature, setActiveFeature] = useState('feed');
  const [phase, setPhase] = useState('main');
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [pitch, setPitch] = useState('');
  const [pdf, setPdf] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', targetAudience: '',
    marketAlternatives: '', problemStatement: '', uniqueValue: '',
  });
  const [showFields, setShowFields] = useState({});
  const [submitting] = useState(false);
  const [privacy, setPrivacy] = useState('Public');
  const [approachModal, setApproachModal] = useState({ open: false, post: null });
  const [fabOpen, setFabOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showApproaches, setShowApproaches] = useState(false);
  const [showGenie, setShowGenie] = useState(false);
  const [genieClosing, setGenieClosing] = useState(false);
  const [showMentorInterest, setShowMentorInterest] = useState(false);
  const [activeSection, setActiveSection] = useState('feed');
  const [publicProfileUserId, setPublicProfileUserId] = useState(null);
  const [targetChatId, setTargetChatId] = useState(null);
  const [feedPosts, setFeedPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false);

  const { user, setUser } = useUser();
  const inboxBtnRef = useRef(null);

  // ── Derived data (unchanged) ────────────────────────────────────────────────
  const categories = useMemo(() => {
    const tagCounts = {};
    feedPosts.forEach(p => (p.tags || []).forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }));
    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [feedPosts]);

  const userStats = useMemo(() => {
    if (!user?._id) return { ideasPosted: 0, approaches: 0, appreciations: 0, suggestions: 0 };
    const own = feedPosts.filter(p => String(p.author?._id) === String(user._id));
    return {
      ideasPosted: own.length,
      approaches: own.reduce((s, p) => s + (Array.isArray(p.approaches) ? p.approaches.length : 0), 0),
      appreciations: own.reduce((s, p) => s + (p.appreciateCount || 0), 0),
      suggestions: own.reduce((s, p) => s + (p.suggestCount || 0), 0),
    };
  }, [feedPosts, user?._id]);

  // Featured post = most appreciated
  const featuredPost = useMemo(() => {
    return [...feedPosts].sort((a, b) => (b.appreciateCount || 0) - (a.appreciateCount || 0))[0] || null;
  }, [feedPosts]);

  const mockNotifications = [
    { id: 1, text: 'Alice appreciated your idea.' },
    { id: 2, text: 'Bob proposed a new feature for your post.' },
    { id: 3, text: 'Your idea was added to Trending.' },
  ];
  const mockApproaches = [
    { id: 1, from: 'Charlie', message: 'Interested in joining your team!' },
    { id: 2, from: 'Dana',    message: 'Can we collaborate on your project?' },
  ];

  // ── Effects (unchanged) ────────────────────────────────────────────────────
  useEffect(() => {
    if (user) return;
    (async () => {
      try {
        const res = await fetch('/api/users/profile', { credentials: 'include', headers: { 'Content-Type': 'application/json' } });
        if (res.ok) { const d = await res.json(); setUser(d.user || d); }
        else setUser({ _id: 'currentUser', fullName: 'Demo User', email: 'demo@example.com' });
      } catch {
        setUser({ _id: 'currentUser', fullName: 'Demo User', email: 'demo@example.com' });
      }
    })();
  }, [user, setUser]);

  useEffect(() => {
    if (showApproaches) { setShowGenie(true); setGenieClosing(false); }
    else if (showGenie) {
      setGenieClosing(true);
      setTimeout(() => { setShowGenie(false); setGenieClosing(false); }, 600);
    }
  }, [showApproaches]); // eslint-disable-line

  useEffect(() => {
    if (activeSection === 'publicProfile' && publicProfileUserId && user?._id &&
        String(publicProfileUserId) === String(user._id)) {
      setActiveSection('profile');
      setPublicProfileUserId(null);
    }
  }, [activeSection, publicProfileUserId, user?._id]);

  useEffect(() => { setSidebarDrawerOpen(false); }, [activeFeature]);

  // ── Handlers (unchanged) ───────────────────────────────────────────────────
  const switchFeature = (key) => {
    setActiveFeature(key);
    setPhase('main');
    if (activeSection === 'publicProfile') { setActiveSection(key); setPublicProfileUserId(null); }
  };

  const handleAvatarClick = (userId) => {
    if (user && String(userId) === String(user._id)) {
      // Own avatar → go to profile settings, clear any public-profile view
      setActiveFeature('profile');
      setActiveSection('feed');
      setPublicProfileUserId(null);
    } else {
      // Another user's avatar → show their public profile
      setPublicProfileUserId(userId);
      setActiveSection('publicProfile');
    }
  };

  const handleNavigateToInbox = (chatId) => { setTargetChatId(chatId); setActiveFeature('inbox'); };

  const handleImageChange = (e) => { if (e.target.files?.[0]) { setImage(URL.createObjectURL(e.target.files[0])); setAddMenuOpen(false); } };
  const handlePitchChange  = (e) => setPitch(e.target.value);
  const handlePdfChange    = (e) => { if (e.target.files?.[0]) { setPdf(e.target.files[0].name); setAddMenuOpen(false); } };
  const handleFormChange   = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const showSidebar = (activeFeature === 'feed' || activeFeature === 'discovery') && activeSection !== 'publicProfile';

  // ── Public profile guard ───────────────────────────────────────────────────
  if (activeSection === 'publicProfile' && publicProfileUserId && user?._id &&
      String(publicProfileUserId).trim() === String(user._id).trim()) {
    return (
      <div className="h-screen bg-gray-50 text-gray-900 flex flex-col overflow-hidden">
        {!hideHeader && (
          <AppNavbar
            user={user}
            activeFeature={activeFeature}
            onTabClick={switchFeature}
            onNewIdea={() => switchFeature('new')}
            onAvatarClick={() => switchFeature('profile')}
            onBell={() => setShowNotifications(o => !o)}
            feedPosts={feedPosts}
          />
        )}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-center text-sm font-medium">
              You are viewing your own profile.
            </div>
            <ProfileSection showMentorInterest={showMentorInterest} />
          </div>
        </div>
        <BottomNav activeFeature={activeFeature} onTabClick={switchFeature} />
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-gray-50 text-gray-900 flex flex-col overflow-hidden">
      {/* Top navbar */}
      {!hideHeader && (
        <AppNavbar
          user={user}
          activeFeature={activeFeature}
          onTabClick={switchFeature}
          onNewIdea={() => switchFeature('new')}
          onAvatarClick={() => switchFeature('profile')}
          onToggleSidebar={showSidebar ? () => setSidebarDrawerOpen(o => !o) : null}
          onBell={() => { setShowNotifications(o => !o); setShowApproaches(false); }}
          feedPosts={feedPosts}
        />
      )}

      {/* Mobile right sidebar drawer */}
      {showSidebar && (
        <SidebarDrawer
          open={sidebarDrawerOpen}
          onClose={() => setSidebarDrawerOpen(false)}
          feedPosts={feedPosts}
          onAvatarClick={handleAvatarClick}
          onViewAll={() => switchFeature('search')}
        />
      )}

      {/* Page body — fills remaining height, only main content scrolls */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-[1360px] mx-auto px-4 md:px-6 h-full flex gap-6">
          {/* ── Main content (scrollable) ──────────────────────────────────── */}
          <main className="flex-1 min-w-0 overflow-y-auto py-5 pb-24 md:pb-8">
          {activeSection === 'publicProfile' && publicProfileUserId ? (
            String(publicProfileUserId) === String(user?._id) ? (
              <>
                <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-center text-sm font-medium">
                  You are viewing your own profile.
                </div>
                <ProfileSection showMentorInterest={showMentorInterest} />
              </>
            ) : (
              <PublicProfile
                userId={publicProfileUserId}
                onClose={() => { setActiveSection('feed'); setPublicProfileUserId(null); }}
              />
            )
          ) : (
            <>
              {/* Hero card + category filter — feed view only */}
              {activeFeature === 'feed' && (
                <>
                  <FeaturedCard
                    post={featuredPost}
                    onExplore={post => setApproachModal({ open: true, post })}
                  />
                  <CategoryTabs
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                  />
                </>
              )}

              {activeFeature === 'feed' && (
                <FeedSection
                  onApproach={post => setApproachModal({ open: true, post })}
                  onAvatarClick={handleAvatarClick}
                  onNavigateToInbox={handleNavigateToInbox}
                  onPostsLoaded={setFeedPosts}
                  filterTag={selectedCategory === 'all' ? null : selectedCategory}
                />
              )}
              {activeFeature === 'new' && (
                <NewPostSection
                  form={form} setForm={setForm}
                  showFields={showFields} setShowFields={setShowFields}
                  phase={phase} setPhase={setPhase}
                  image={image} setImage={setImage}
                  pitch={pitch} setPitch={setPitch}
                  pdf={pdf} setPdf={setPdf}
                  addMenuOpen={addMenuOpen} setAddMenuOpen={setAddMenuOpen}
                  privacy={privacy} setPrivacy={setPrivacy}
                  submitting={submitting}
                  handleFormChange={handleFormChange}
                  handleImageChange={handleImageChange}
                  handlePitchChange={handlePitchChange}
                  handlePdfChange={handlePdfChange}
                  onAvatarClick={handleAvatarClick}
                />
              )}
              {activeFeature === 'discovery' && (
                <>
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Discover Ideas</h2>
                    <p className="text-sm text-gray-500">Explore all ideas from the community</p>
                  </div>
                  <CategoryTabs
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                  />
                  <FeedSection
                    onApproach={post => setApproachModal({ open: true, post })}
                    onAvatarClick={handleAvatarClick}
                    onNavigateToInbox={handleNavigateToInbox}
                    onPostsLoaded={setFeedPosts}
                    filterTag={selectedCategory === 'all' ? null : selectedCategory}
                  />
                </>
              )}
              {activeFeature === 'analytics' && (
                <AnalyticsSection />
              )}
              {activeFeature === 'search' && (
                <SearchSection
                  posts={feedPosts}
                  searchQuery={showFields.searchQuery || ''}
                  onSearchChange={q => setShowFields(f => ({ ...f, searchQuery: q }))}
                />
              )}
              {activeFeature === 'inbox' && (
                <InboxSection
                  onAvatarClick={handleAvatarClick}
                  targetChatId={targetChatId}
                  onChatOpened={() => setTargetChatId(null)}
                />
              )}
              {activeFeature === 'profile' && (
                <ProfileSection
                  showMentorInterest={showMentorInterest}
                  publicProfileUserId={publicProfileUserId}
                  onClosePublicProfile={() => setPublicProfileUserId(null)}
                />
              )}
              {activeFeature === 'settings' && (
                <SettingsSection onMentorInterestChange={setShowMentorInterest} />
              )}
            </>
          )}
          </main>

          {/* ── Right sidebar — always visible, never scrolls away ────────── */}
          {showSidebar && (
            <aside className="hidden lg:flex lg:flex-col w-72 xl:w-80 shrink-0 py-5 overflow-y-auto">
              <RightSidebar
                feedPosts={feedPosts}
                onAvatarClick={handleAvatarClick}
                onViewAll={() => switchFeature('search')}
              />
            </aside>
          )}
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav activeFeature={activeFeature} onTabClick={switchFeature} />

      {/* ── Floating "Launch Idea" button ─────────────────────────────────── */}
      {activeFeature !== 'new' && (
        <button
          onClick={() => switchFeature('new')}
          className="hidden md:flex fixed bottom-6 right-6 z-30 items-center gap-2 bg-gray-900 text-white pl-3 pr-4 py-3 rounded-full font-bold text-sm shadow-xl hover:bg-gray-800 active:scale-95 transition-all focus:outline-none"
          aria-label="Launch a new idea"
        >
          {Ico.rocket('w-4 h-4 text-teal-400')}
          <span className="tracking-wide">LAUNCH IDEA</span>
        </button>
      )}

      {/* ── Modals (all unchanged) ────────────────────────────────────────── */}
      <ApproachModal
        open={approachModal.open}
        post={approachModal.post}
        mockApproaches={mockApproaches}
        onClose={() => setApproachModal({ open: false, post: null })}
      />
      <FabMenu
        fabOpen={fabOpen} setFabOpen={setFabOpen}
        onShowNotifications={() => { setShowNotifications(o => !o); setShowApproaches(false); }}
        onShowApproaches={()    => { setShowApproaches(o => !o); setShowNotifications(false); }}
        inboxBtnRef={inboxBtnRef}
      />
      <NotificationsModal show={showNotifications} mockNotifications={mockNotifications} onClose={() => setShowNotifications(false)} />
      <InboxModal show={showApproaches} genieClosing={genieClosing} showGenie={showGenie} mockApproaches={mockApproaches} onClose={() => setShowApproaches(false)} />
    </div>
  );
}

export default BrainstormingSection;
