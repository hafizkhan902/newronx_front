import React, { useState, useEffect } from 'react';
import BrainstormPost from '../../BrainstormPost';

function SearchSection({ searchQuery, onSearchChange }) {
  // State for role filter
  const [roleFilter, setRoleFilter] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [customRole, setCustomRole] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch search results from API
  useEffect(() => {
    if (!searchQuery) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const url = `/api/ideas/search?q=${encodeURIComponent(searchQuery)}`;
    // console.log('Search query:', searchQuery);
    // console.log('Fetching:', url);
    fetch(url, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        // console.log('Search results:', data);
        setResults(Array.isArray(data.ideas) ? data.ideas : []);
        setLoading(false);
      })
      .catch(err => {
        // console.error('Search error:', err);
        setError('Failed to fetch search results');
        setLoading(false);
      });
  }, [searchQuery]);

  // Collect all unique roles from results and add some basic defaults
  const defaultRoles = ["Developer", "Document Gatherer", "Part Time", "Others"];
  const allRoles = Array.from(
    new Set([
      ...defaultRoles,
      ...results
        .flatMap(post => {
          if (Array.isArray(post.neededRoles)) {
            // neededRoles is an array
            return post.neededRoles.flatMap(role => {
              // If role is a JSON stringified array, parse it
              if (typeof role === 'string' && role.trim().startsWith('[')) {
                try {
                  return JSON.parse(role);
                } catch {
                  return role;
                }
              }
              return role;
            });
          } else if (typeof post.neededRoles === 'string') {
            // neededRoles is a string
            if (post.neededRoles.trim().startsWith('[')) {
              try {
                return JSON.parse(post.neededRoles);
              } catch {
                return post.neededRoles.split(',').map(r => r.trim());
              }
            }
            return post.neededRoles.split(',').map(r => r.trim());
          }
          return [];
        })
        .filter(Boolean)
    ])
  );

  // Filter results by role
  const filteredPosts = results.filter(post => {
    let roleToCheck = roleFilter === 'Others' && customRole ? customRole : roleFilter;
    const matchesRole =
      !roleToCheck ||
      (Array.isArray(post.neededRoles)
        ? post.neededRoles.some(role => {
            if (typeof role === 'string' && role.trim().startsWith('[')) {
              try {
                return JSON.parse(role).some(r => r.toLowerCase().includes(roleToCheck.toLowerCase()));
              } catch {
                return false;
              }
            }
            return role.toLowerCase().includes(roleToCheck.toLowerCase());
          })
        : typeof post.neededRoles === 'string'
        ? post.neededRoles.toLowerCase().includes(roleToCheck.toLowerCase())
        : false);
    return matchesRole;
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Search</h2>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Search ideas..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
        <button
          className="px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm font-medium hover:bg-gray-200 transition relative"
          onClick={() => setShowRoleDropdown(open => !open)}
        >
          Filter by Role
        </button>
        {roleFilter && (
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold flex items-center gap-1">
            {roleFilter === 'Others' && customRole ? customRole : roleFilter}
            <button
              className="ml-1 text-blue-700 hover:text-blue-900 text-xs"
              onClick={() => { setRoleFilter(""); setCustomRole(""); }}
              title="Clear filter"
            >
              &times;
            </button>
          </span>
        )}
        {/* Role Dropdown */}
        {showRoleDropdown && (
          <div className="absolute mt-12 right-0 bg-white border border-gray-200 shadow-lg rounded z-50 min-w-[180px] w-56 max-h-60">
            <div className="p-2 max-h-40 overflow-y-auto">
              {allRoles.length === 0 ? (
                <div className="text-gray-400 text-sm">No roles found</div>
              ) : (
                allRoles.map(role => (
                  <button
                    key={role}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded"
                    onClick={e => {
                      if (role === 'Others') {
                        setRoleFilter('Others');
                        setCustomRole("");
                        // Keep dropdown open for input
                      } else {
                        setRoleFilter(role);
                        setShowRoleDropdown(false);
                      }
                    }}
                  >
                    {role}
                  </button>
                ))
              )}
            </div>
            {/* Custom role input for 'Others' */}
            {roleFilter === 'Others' && (
              <div className="p-2 border-t border-gray-100 bg-gray-50">
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Enter custom role..."
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customRole.trim()) {
                      setShowRoleDropdown(false);
                    }
                  }}
                />
                <button
                  className="mt-2 w-full bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700 transition"
                  disabled={!customRole.trim()}
                  onClick={() => setShowRoleDropdown(false)}
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="text-gray-400">Searching...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map(post => <BrainstormPost key={post._id} post={post} />)
        ) : (
          <div className="text-gray-400">No posts found.</div>
        )}
      </div>
    </div>
  );
}

export default SearchSection; 