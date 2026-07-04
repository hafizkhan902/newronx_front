import React, { useState, useEffect, useRef } from 'react';
import BrainstormPost from '../../BrainstormPost';

const LIMIT = 10;

// ── Parse neededRoles regardless of how backend stored it ─────────────────────
function parseRoles(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap(r => {
      if (typeof r === 'string' && r.trim().startsWith('[')) {
        try { return JSON.parse(r); } catch { return r; }
      }
      return r;
    }).filter(Boolean);
  }
  if (typeof raw === 'string') {
    if (raw.trim().startsWith('[')) { try { return JSON.parse(raw); } catch {} }
    return raw.split(',').map(r => r.trim()).filter(Boolean);
  }
  return [];
}

// ── API call ──────────────────────────────────────────────────────────────────
async function searchIdeas({ q, tags, page }) {
  const params = new URLSearchParams();
  if (q?.trim())    params.set('q',     q.trim());
  if (tags?.length) params.set('tags',  tags.join(','));
  params.set('page',  page);
  params.set('limit', LIMIT);

  const res = await fetch(`/api/ideas/search?${params}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Search failed (${res.status})`);
  }

  const json = await res.json();
  return {
    ideas:      json.data?.ideas      ?? json.ideas ?? [],
    pagination: json.data?.pagination ?? null,
  };
}

// ── Client-side substring fallback (used when backend returns 0 results) ──────
function localFilter(posts, q, tags) {
  const lq = q?.toLowerCase() || '';
  const lt = (tags || []).map(t => t.toLowerCase());
  return (posts || []).filter(p => {
    const matchQ = !lq ||
      p.title?.toLowerCase().includes(lq) ||
      p.description?.toLowerCase().includes(lq) ||
      (p.tags || []).some(t => t.toLowerCase().includes(lq)) ||
      p.author?.fullName?.toLowerCase().includes(lq);
    const matchT = !lt.length ||
      lt.every(t => (p.tags || []).some(pt => pt.toLowerCase().includes(t)));
    return matchQ && matchT;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
function SearchSection({ searchQuery: externalQuery, onSearchChange, posts: feedPosts }) {
  const [query,      setQuery]      = useState(externalQuery || '');
  const [tagInput,   setTagInput]   = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [showRoleDD, setShowRoleDD] = useState(false);

  const [results,    setResults]    = useState([]);
  const [isLocal,    setIsLocal]    = useState(false); // true when using client-side fallback
  const [pagination, setPagination] = useState(null);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const roleDDRef  = useRef(null);
  const abortRef   = useRef(null);

  // ── Close role dropdown on outside click ──────────────────────────────────
  useEffect(() => {
    const h = e => { if (roleDDRef.current && !roleDDRef.current.contains(e.target)) setShowRoleDD(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Seed from navbar "See all results" link ────────────────────────────────
  useEffect(() => {
    if (externalQuery && externalQuery !== query) {
      setQuery(externalQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalQuery]);

  // ── Core fetch — called on search or page change ───────────────────────────
  const doSearch = (q, tags, pg) => {
    if (!q?.trim() && !tags?.length) {
      setResults([]); setIsLocal(false); setPagination(null); setHasSearched(false); return;
    }

    if (abortRef.current) abortRef.current = false;
    const token = {};
    abortRef.current = token;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    searchIdeas({ q, tags, page: pg })
      .then(({ ideas, pagination: pag }) => {
        if (abortRef.current !== token) return;
        if (ideas.length > 0) {
          setResults(ideas);
          setIsLocal(false);
          setPagination(pag);
        } else {
          // Backend returned nothing — fall back to client-side substring search
          const local = localFilter(feedPosts, q, tags);
          setResults(local);
          setIsLocal(true);
          setPagination(null);
        }
      })
      .catch(() => {
        if (abortRef.current !== token) return;
        // Network/auth error — still try local fallback silently
        const local = localFilter(feedPosts, q, tags);
        setResults(local);
        setIsLocal(true);
        setPagination(null);
        setError(local.length ? null : 'Search unavailable — try again later');
      })
      .finally(() => {
        if (abortRef.current === token) setLoading(false);
      });
  };

  // ── Debounced search-as-you-type (always page 1) ──────────────────────────
  useEffect(() => {
    const t = setTimeout(() => doSearch(query, activeTags, 1), 380);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTags]);

  // ── Pagination — fetch new page directly ──────────────────────────────────
  const goToPage = (pg) => {
    setPage(pg);
    doSearch(query, activeTags, pg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Tag helpers ────────────────────────────────────────────────────────────
  const addTag = raw => {
    const t = raw.trim();
    if (t && !activeTags.includes(t)) setActiveTags(prev => [...prev, t]);
  };
  const removeTag = t => setActiveTags(prev => prev.filter(x => x !== t));

  // ── Role options from current results ─────────────────────────────────────
  const defaultRoles = ['Developer', 'Designer', 'Marketer', 'Data Scientist', 'Others'];
  const allRoles = Array.from(new Set([
    ...defaultRoles,
    ...results.flatMap(p => parseRoles(p.neededRoles)),
  ])).filter(Boolean);

  // Client-side role filter on top of server results
  const visiblePosts = results.filter(post => {
    const check = roleFilter === 'Others' && customRole ? customRole : roleFilter;
    if (!check) return true;
    return parseRoles(post.neededRoles).some(r => r.toLowerCase().includes(check.toLowerCase()));
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Search Ideas</h1>
        <p className="text-sm text-gray-500">Find ideas by keyword, tags, or team role needed</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setPage(1);
            if (onSearchChange) onSearchChange(e.target.value);
          }}
          placeholder="Search by keyword…"
          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
        />
        {loading && (
          <span className="absolute right-3.5 top-3">
            <svg className="w-4 h-4 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </span>
        )}
        {!loading && query && (
          <button type="button"
            onClick={() => { setQuery(''); setActiveTags([]); if (onSearchChange) onSearchChange(''); }}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Active tags */}
        {activeTags.map(t => (
          <span key={t} className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            #{t}
            <button type="button" onClick={() => removeTag(t)} className="hover:opacity-70 focus:outline-none">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </span>
        ))}

        {/* Tag input */}
        <form onSubmit={e => { e.preventDefault(); if (tagInput.trim()) { addTag(tagInput); setTagInput(''); setPage(1); } }}>
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            placeholder="+ Add tag"
            className="text-xs border border-dashed border-gray-300 rounded-full px-3 py-1.5 placeholder-gray-400 focus:outline-none focus:border-indigo-400 bg-transparent w-24 transition"
          />
        </form>

        <div className="flex-1" />

        {/* Role filter */}
        <div ref={roleDDRef} className="relative">
          <button type="button"
            onClick={() => setShowRoleDD(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition ${
              roleFilter ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M10 20h4"/>
            </svg>
            {roleFilter ? (roleFilter === 'Others' && customRole ? customRole : roleFilter) : 'Role'}
            {roleFilter && (
              <span onClick={e => { e.stopPropagation(); setRoleFilter(''); setCustomRole(''); }}
                className="ml-0.5 text-base leading-none hover:text-indigo-900">×</span>
            )}
          </button>
          {showRoleDD && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 overflow-hidden">
              <div className="max-h-48 overflow-y-auto p-1">
                {allRoles.map(role => (
                  <button key={role} type="button"
                    className={`w-full text-left px-3 py-2 text-sm rounded-xl transition hover:bg-indigo-50 ${roleFilter === role ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}
                    onClick={() => { setRoleFilter(role); if (role !== 'Others') setShowRoleDD(false); }}>
                    {role}
                  </button>
                ))}
              </div>
              {roleFilter === 'Others' && (
                <div className="p-2 border-t border-gray-100">
                  <input type="text" autoFocus
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
                    placeholder="Custom role…"
                    value={customRole}
                    onChange={e => setCustomRole(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && customRole.trim()) setShowRoleDD(false); }}
                  />
                  <button disabled={!customRole.trim()} onClick={() => setShowRoleDD(false)}
                    className="mt-1.5 w-full bg-indigo-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition">
                    Apply
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results area */}
      {error ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-9 w-9 border-2 border-indigo-500 border-t-transparent" />
            <p className="text-sm text-gray-400">Searching ideas…</p>
          </div>
        </div>
      ) : !hasSearched ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-500 mb-1">Start searching</p>
          <p className="text-xs text-gray-400">Type a keyword above to search across all ideas</p>
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-500 mb-1">No results found</p>
          <p className="text-xs text-gray-400">Try different keywords or remove some filters</p>
        </div>
      ) : (
        <>
          {/* Count */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400 font-medium">
                {pagination
                  ? `${pagination.totalItems} result${pagination.totalItems !== 1 ? 's' : ''} · page ${pagination.currentPage} of ${pagination.totalPages}`
                  : `${visiblePosts.length} result${visiblePosts.length !== 1 ? 's' : ''}`}
              </p>
              {isLocal && (
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full uppercase tracking-wide">
                  local results
                </span>
              )}
            </div>
            {roleFilter && (
              <span className="text-xs text-indigo-600 font-medium">
                Role: {roleFilter === 'Others' && customRole ? customRole : roleFilter}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {visiblePosts.map(post => <BrainstormPost key={post._id} post={post} />)}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => goToPage(page - 1)} disabled={!pagination.hasPrevPage}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                Prev
              </button>
              <div className="flex items-center gap-1">
                {(() => {
                  const total = pagination.totalPages;
                  const cur   = pagination.currentPage;
                  const start = Math.max(1, Math.min(cur - 2, total - 4));
                  const end   = Math.min(total, start + 4);
                  return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(pg => (
                    <button key={pg} onClick={() => goToPage(pg)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${cur === pg ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {pg}
                    </button>
                  ));
                })()}
              </div>
              <button onClick={() => goToPage(page + 1)} disabled={!pagination.hasNextPage}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SearchSection;
