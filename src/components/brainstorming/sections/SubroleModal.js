import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../../utils/api';
import UserAvatar from '../../UserAvatar';

const SubroleModal = ({ 
  ideaId, 
  member, 
  onClose, 
  onSubroleAdded,
  subroleQuery,
  setSubroleQuery,
  subroleSearchResults,
  setSubroleSearchResults,
  selectedUser,
  setSelectedUser,
  selectedSubrole,
  setSelectedSubrole,
  searchTimeoutRef
}) => {
  const [subroleStep, setSubroleStep] = useState('search');
  const [searchLoading, setSearchLoading] = useState(false);
  const [subroleOptions, setSubroleOptions] = useState([]);

  // User search functionality using team-specific endpoint
  const searchUsers = async (query) => {
    try {
      setSearchLoading(true);
      
      if (!query || query.trim().length < 2) {
        setSubroleSearchResults([]);
        setSearchLoading(false);
        return;
      }

      const response = await apiRequest(`/api/teams/${ideaId}/search-users?q=${encodeURIComponent(query.trim())}`);
      
      if (response.ok) {
        const data = await response.json();
        // Backend returns users in data.users format
        const users = data.data?.users || data.users || [];
        
        console.log('🔍 [TeamStructure] User search results:', users.length, 'users found');
        setSubroleSearchResults(users);
      } else {
        console.error('❌ [TeamStructure] User search failed:', response.status);
        setSubroleSearchResults([]);
      }
    } catch (err) {
      console.error('❌ Error searching users:', err);
      setSubroleSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubroleSearch = (query) => {
    setSubroleQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(query);
    }, 300);
  };

  // Fetch subrole options based on parent role
  const fetchSubroleOptions = async (parentRole) => {
    try {
      console.log('🔄 [TeamStructure] Fetching subrole options for role:', parentRole);
      const response = await apiRequest(`/api/teams/subrole-options?roleType=${encodeURIComponent(parentRole)}`);
      
      if (response.ok) {
        const data = await response.json();
        const options = data.data?.subroleOptions || [];
        console.log('✅ [TeamStructure] Subrole options loaded:', options.length);
        setSubroleOptions(options);
        return options;
      } else {
        console.error('❌ [TeamStructure] Failed to fetch subrole options:', response.status);
        setSubroleOptions([]);
        return [];
      }
    } catch (err) {
      console.error('❌ Error fetching subrole options:', err);
      setSubroleOptions([]);
      return [];
    }
  };

  // Handle user selection and move to subrole selection step
  const handleUserSelection = async (user, parentMember) => {
    setSelectedUser(user);
    console.log('👤 [TeamStructure] User selected:', user.name, 'for parent role:', parentMember.assignedRole);
    
    // Fetch subrole options for the parent role
    await fetchSubroleOptions(parentMember.assignedRole);
    setSubroleStep('select');
  };

  const handleAddSubrole = async () => {
    try {
      if (!selectedUser || !selectedSubrole || !member) {
        console.error('❌ [TeamStructure] Missing required data for subrole assignment');
        return;
      }

      console.log('🔄 [TeamStructure] Adding subrole:', {
        parentMemberId: member._id,
        selectedUser: selectedUser.name,
        selectedSubrole: selectedSubrole.title
      });

      const response = await apiRequest(`/api/teams/${ideaId}/members/${member._id}/subroles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newUserId: selectedUser._id,
          subroleData: selectedSubrole
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [TeamStructure] Subrole assigned successfully:', data);
        
        // Show success message
        alert(data.message || `${selectedUser.name} added as ${selectedSubrole.title}`);
        
        // Call the parent callback to refresh data
        onSubroleAdded();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add subrole');
      }
    } catch (err) {
      console.error('❌ Error adding subrole:', err);
      alert(`Error adding subrole: ${err.message}`);
    }
  };

  if (!member) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-lg">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Subrole Member</h2>
              <p className="text-sm text-gray-500 mt-1">
                Adding subrole under: <strong>{member.user.fullName}</strong> ({member.assignedRole})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {subroleStep === 'search' && (
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Search for User</h3>
              <input
                type="text"
                placeholder="Search by name, email, or skills..."
                value={subroleQuery}
                onChange={(e) => handleSubroleSearch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                autoFocus
              />
              
              {searchLoading && (
                <div className="text-center py-8 text-gray-500">
                  Searching users...
                </div>
              )}
              
              {!searchLoading && subroleSearchResults.length === 0 && subroleQuery.length >= 2 && (
                <div className="text-center py-8 text-gray-500">
                  No users found matching "{subroleQuery}"
                </div>
              )}
              
              {!searchLoading && subroleSearchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {subroleSearchResults.map((searchUser) => (
                    <button
                      key={searchUser._id}
                      onClick={() => handleUserSelection(searchUser, member)}
                      className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <UserAvatar
                        userId={searchUser._id}
                        avatarUrl={searchUser.avatar}
                        size={48}
                      />
                      <div className="ml-4 flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{searchUser.name}</h4>
                        <p className="text-sm text-gray-500">{searchUser.email}</p>
                        {searchUser.skills && searchUser.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {searchUser.skills.slice(0, 3).map((skill) => (
                              <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                            {searchUser.skills.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                +{searchUser.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {subroleStep === 'select' && selectedUser && (
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Select Subrole</h3>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <UserAvatar
                    userId={selectedUser._id}
                    avatarUrl={selectedUser.avatar}
                    size={40}
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Selected user: {selectedUser.name}</p>
                    <p className="text-xs text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {subroleOptions.map((option) => (
                  <button
                    key={option.title}
                    onClick={() => setSelectedSubrole(option)}
                    className={`w-full p-4 border rounded-lg text-left transition-colors ${
                      selectedSubrole?.title === option.title
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <h4 className="text-sm font-medium text-gray-900">{option.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded mt-2 ${
                      option.level === 'senior' ? 'bg-green-100 text-green-700' :
                      option.level === 'lead' ? 'bg-purple-100 text-purple-700' :
                      option.level === 'specialist' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {option.level}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          {subroleStep === 'select' && (
            <>
              <button
                onClick={() => {
                  setSubroleStep('search');
                  setSelectedUser(null);
                  setSubroleOptions([]);
                  setSelectedSubrole(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleAddSubrole}
                disabled={!selectedSubrole}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedSubrole
                    ? 'text-white bg-gray-900 hover:bg-gray-800'
                    : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                }`}
              >
                Assign Subrole
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubroleModal;
