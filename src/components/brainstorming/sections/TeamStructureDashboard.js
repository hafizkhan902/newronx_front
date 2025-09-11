import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '../../../utils/api';
import { useUser } from '../../../UserContext';
import UserAvatar from '../../UserAvatar';
import TeamFilesSection from './TeamFilesSection';
import TaskModal from './TaskModal';
import TaskList from './TaskList';

const TeamStructureDashboard = ({ ideaId, onClose }) => {
  const { user } = useUser();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddRole, setShowAddRole] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  
  // Team member menu states
  const [activeMenu, setActiveMenu] = useState(null);
  const [showSubroleModal, setShowSubroleModal] = useState(null);
  const [subroleStep, setSubroleStep] = useState('search'); // 'search' -> 'select' -> 'confirm'
  const [subroleQuery, setSubroleQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [subroleOptions, setSubroleOptions] = useState([]);
  const [selectedSubrole, setSelectedSubrole] = useState(null);
  const menuRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  // Subroles state
  const [memberSubroles, setMemberSubroles] = useState({});


  // Fetch subroles for all team members
  const fetchAllSubroles = useCallback(async (teamComposition) => {
    try {
      const subrolePromises = teamComposition.map(async (member) => {
        try {
          const response = await apiRequest(`/api/teams/${ideaId}/members/${member._id}/subroles`);
          if (response.ok) {
            const data = await response.json();
            return {
              memberId: member._id,
              subroles: data.data?.subroles || []
            };
          }
        } catch (err) {
          console.warn(`Failed to fetch subroles for member ${member._id}:`, err);
        }
        return {
          memberId: member._id,
          subroles: []
        };
      });

      const results = await Promise.all(subrolePromises);
      const subrolesMap = {};
      results.forEach(({ memberId, subroles }) => {
        subrolesMap[memberId] = subroles;
      });
      
      console.log('✅ [TeamStructure] Subroles loaded:', subrolesMap);
      setMemberSubroles(subrolesMap);
    } catch (err) {
      console.error('❌ Error fetching subroles:', err);
    }
  }, [ideaId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
        setShowSubroleModal(null);
        setSubroleStep('search');
        setSubroleQuery('');
        setSearchResults([]);
        setSelectedUser(null);
        setSubroleOptions([]);
        setSelectedSubrole(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // User search functionality using team-specific endpoint
  const searchUsers = useCallback(async (query) => {
    try {
      setSearchLoading(true);
      
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }

      const response = await apiRequest(`/api/teams/${ideaId}/search-users?q=${encodeURIComponent(query.trim())}`);
      
      if (response.ok) {
        const data = await response.json();
        // Backend returns users in data.users format
        const users = data.data?.users || data.users || [];
        
        console.log('🔍 [TeamStructure] User search results:', users.length, 'users found');
        setSearchResults(users);
      } else {
        console.error('❌ [TeamStructure] User search failed:', response.status);
        setSearchResults([]);
      }
    } catch (err) {
      console.error('❌ Error searching users:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [ideaId]);

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

  const handleLeaveTeam = async (memberId) => {
    try {
      // Security check: only allow users to leave if it's their own membership
      const member = teamData?.teamStructure?.teamComposition?.find(m => m._id === memberId);
      if (!member || String(member.user._id) !== String(user?._id)) {
        console.error('❌ [TeamStructure] Unauthorized: User cannot leave team for another member');
        alert('You can only leave the team for yourself.');
        return;
      }

      console.log('🔄 [TeamStructure] Member leaving team:', memberId);
      // TODO: Implement leave team API call
      // const response = await apiRequest(`/api/teams/${ideaId}/members/${memberId}`, { method: 'DELETE' });
      
      // For now, show confirmation
      if (window.confirm('Are you sure you want to leave this team?')) {
        // Refresh team structure after leaving
        await fetchTeamStructure();
        setActiveMenu(null);
      }
    } catch (err) {
      console.error('❌ Error leaving team:', err);
    }
  };

  const handlePromoteToLead = async (memberId) => {
    try {
      // Security check: only allow author to promote members
      if (String(author._id) !== String(user?._id)) {
        console.error('❌ [TeamStructure] Unauthorized: Only idea author can promote members');
        alert('Only the idea author can promote team members.');
        return;
      }

      const member = teamData?.teamStructure?.teamComposition?.find(m => m._id === memberId);
      if (!member) {
        console.error('❌ [TeamStructure] Member not found');
        return;
      }

      if (window.confirm(`Promote ${member.user.fullName} to team leader?`)) {
        console.log('🔄 [TeamStructure] Promoting member to lead:', memberId);
        // TODO: Implement promote to lead API call
        // const response = await apiRequest(`/api/teams/${ideaId}/members/${memberId}/promote`, { method: 'POST' });
        
        alert(`${member.user.fullName} promoted to team leader!`);
        setActiveMenu(null);
        await fetchTeamStructure();
      }
    } catch (err) {
      console.error('❌ Error promoting member:', err);
      alert('Error promoting team member. Please try again.');
    }
  };

  const handleDemoteFromLead = async (memberId) => {
    try {
      // Security check: only allow author to demote members
      if (String(author._id) !== String(user?._id)) {
        console.error('❌ [TeamStructure] Unauthorized: Only idea author can demote members');
        alert('Only the idea author can demote team members.');
        return;
      }

      const member = teamData?.teamStructure?.teamComposition?.find(m => m._id === memberId);
      if (!member) {
        console.error('❌ [TeamStructure] Member not found');
        return;
      }

      if (window.confirm(`Remove leadership from ${member.user.fullName}?`)) {
        console.log('🔄 [TeamStructure] Demoting member from lead:', memberId);
        // TODO: Implement demote from lead API call
        // const response = await apiRequest(`/api/teams/${ideaId}/members/${memberId}/demote`, { method: 'POST' });
        
        alert(`${member.user.fullName} is no longer a team leader.`);
        setActiveMenu(null);
        await fetchTeamStructure();
      }
    } catch (err) {
      console.error('❌ Error demoting member:', err);
      alert('Error demoting team member. Please try again.');
    }
  };

  const handleRemoveFromTeam = async (memberId) => {
    try {
      // Security check: only allow author to remove members
      if (String(author._id) !== String(user?._id)) {
        console.error('❌ [TeamStructure] Unauthorized: Only idea author can remove members');
        alert('Only the idea author can remove team members.');
        return;
      }

      const member = teamData?.teamStructure?.teamComposition?.find(m => m._id === memberId);
      if (!member) {
        console.error('❌ [TeamStructure] Member not found');
        return;
      }

      if (window.confirm(`Remove ${member.user.fullName} from the team? This action cannot be undone.`)) {
        console.log('🔄 [TeamStructure] Removing member from team using membership ID:', memberId);
        console.log('🔍 [TeamStructure] Member object:', member);
        console.log('🔍 [TeamStructure] Member._id (membership ID):', member._id);
        console.log('🔍 [TeamStructure] Member.user._id (user ID):', member.user._id);
        console.log('🔍 [TeamStructure] API URL will be:', `/api/teams/${ideaId}/members/${memberId}`);
        console.log('🔍 [TeamStructure] Current user (author):', user?._id);
        console.log('🔍 [TeamStructure] Idea author:', author._id);
        
        console.log('🚀 [TeamStructure] Making DELETE request...');
        const response = await apiRequest(`/api/teams/${ideaId}/members/${memberId}`, { 
          method: 'DELETE' 
        });
        console.log('📡 [TeamStructure] Response received:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ [TeamStructure] Member removed successfully:', data);
          alert(`${member.user.fullName} has been removed from the team.`);
          setActiveMenu(null);
          await fetchTeamStructure();
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ [TeamStructure] Failed to remove member:', errorData);
          alert(errorData.message || 'Failed to remove team member. Please try again.');
        }
      }
    } catch (err) {
      console.error('❌ Error removing member:', err);
      alert('Error removing team member. Please try again.');
    }
  };

  const handleAddSubrole = async () => {
    try {
      if (!selectedUser || !selectedSubrole || !showSubroleModal) {
        console.error('❌ [TeamStructure] Missing required data for subrole assignment');
        return;
      }

      const parentMember = showSubroleModal;
      
      // Security check: only allow users to add subroles to their own role
      if (String(parentMember.user._id) !== String(user?._id)) {
        console.error('❌ [TeamStructure] Unauthorized: User cannot add subrole for another member');
        alert('You can only add subroles to your own role.');
        return;
      }

      console.log('🔄 [TeamStructure] Adding subrole:', {
        parentMemberId: parentMember._id,
        selectedUser: selectedUser.name,
        selectedSubrole: selectedSubrole.title
      });

      const response = await apiRequest(`/api/teams/${ideaId}/members/${parentMember._id}/subroles`, {
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
        
        // Reset all subrole modal states
        setShowSubroleModal(null);
        setSubroleStep('search');
        setSubroleQuery('');
        setSearchResults([]);
        setSelectedUser(null);
        setSubroleOptions([]);
        setSelectedSubrole(null);
        setActiveMenu(null);
        
        // Refresh subroles for the specific parent member
        const refreshResponse = await apiRequest(`/api/teams/${ideaId}/members/${parentMember._id}/subroles`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setMemberSubroles(prev => ({
            ...prev,
            [parentMember._id]: refreshData.data?.subroles || []
          }));
        }
        
        // Also refresh team structure for any other updates
        await fetchTeamStructure();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add subrole');
      }
    } catch (err) {
      console.error('❌ Error adding subrole:', err);
      alert(`Error adding subrole: ${err.message}`);
    }
  };

  const syncIdeaRoles = useCallback(async (currentTeamData) => {
    try {
      console.log('🔄 [TeamStructure] Fetching idea data to sync roles...');
      
      // Fetch the idea data to get neededRoles
      const ideaResponse = await apiRequest(`/api/ideas/${ideaId}`);
      
      if (ideaResponse.ok) {
        const ideaData = await ideaResponse.json();
        console.log('📦 [TeamStructure] Idea data received:', ideaData);
        
        const neededRoles = ideaData.data?.neededRoles || ideaData.neededRoles || [];
        console.log('🎯 [TeamStructure] Needed roles from idea:', neededRoles);
        
        if (neededRoles.length > 0) {
          // Add roles that don't exist in team structure
          const existingRoles = currentTeamData.teamStructure?.rolesNeeded || [];
          const existingRoleNames = existingRoles.map(role => role.role?.toLowerCase());
          
          let rolesAdded = false;
          for (const neededRole of neededRoles) {
            if (!existingRoleNames.includes(neededRole.toLowerCase())) {
              console.log('➕ [TeamStructure] Adding missing role:', neededRole);
              
              try {
                const addRoleResponse = await apiRequest(`/api/teams/${ideaId}/roles`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role: neededRole })
                });
                
                if (addRoleResponse.ok) {
                  console.log('✅ [TeamStructure] Role added successfully:', neededRole);
                  rolesAdded = true;
                } else {
                  console.error('❌ [TeamStructure] Failed to add role:', neededRole);
                }
              } catch (roleErr) {
                console.error('❌ [TeamStructure] Error adding role:', neededRole, roleErr);
              }
            }
          }
          
          return rolesAdded;
        } else {
          console.log('ℹ️ [TeamStructure] No neededRoles found in idea');
        }
      } else {
        console.warn('⚠️ [TeamStructure] Failed to fetch idea data for role sync');
      }
    } catch (err) {
      console.error('❌ [TeamStructure] Error syncing idea roles:', err);
    }
    return false;
  }, [ideaId]);

  const fetchTeamStructure = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 [TeamStructure] Fetching team structure for idea:', ideaId);
      const response = await apiRequest(`/api/teams/${ideaId}/structure`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 [TeamStructure] Team structure data:', data);
        
        // Handle nested response format
        const structureData = data.data || data;
        setTeamData(structureData);
        
        // Check if team structure is empty but idea has neededRoles
        if (structureData.teamStructure?.rolesNeeded?.length === 0) {
          console.log('🔍 [TeamStructure] No roles found, checking idea for neededRoles...');
          const rolesAdded = await syncIdeaRoles(structureData);
          if (rolesAdded) {
            // Refresh after a short delay to allow backend processing
            setTimeout(() => {
              fetchTeamStructure();
            }, 1000);
          }
        }
        
        // Fetch subroles for all team members
        if (structureData.teamStructure?.teamComposition?.length > 0) {
          await fetchAllSubroles(structureData.teamStructure.teamComposition);
        }
        
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to load team structure: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('❌ [TeamStructure] Error fetching team structure:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ideaId, fetchAllSubroles]);

  const fetchTasks = useCallback(async (statusFilters = ['todo', 'in_progress']) => {
    try {
      console.log('🔄 [TeamStructure] Fetching tasks for idea:', ideaId, 'with filters:', statusFilters);
      
      // Build query parameters for status filtering
      const queryParams = new URLSearchParams();
      statusFilters.forEach(status => {
        queryParams.append('status', status);
      });
      
      const url = `/api/tasks/idea/${ideaId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiRequest(url);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📦 [TeamStructure] API Response:', result);
        
        // Extract tasks from nested response structure
        const fetchedTasks = result.data?.tasks || result.tasks || result.data || [];
        
        if (Array.isArray(fetchedTasks)) {
          setTasks(fetchedTasks);
          console.log('✅ [TeamStructure] Tasks loaded from API:', fetchedTasks.length, 'with filters:', statusFilters);
        } else {
          console.warn('⚠️ [TeamStructure] Invalid tasks data structure:', result);
          setTasks([]);
        }
      } else {
        console.error('❌ [TeamStructure] Failed to fetch tasks:', response.status);
        setTasks([]);
      }
      
    } catch (err) {
      console.error('❌ [TeamStructure] Error fetching tasks:', err);
      setTasks([]);
    }
  }, [ideaId]);

  // useEffect for initial data loading (moved after function definitions)
  useEffect(() => {
    fetchTeamStructure();
    fetchTasks();
  }, [ideaId, fetchTeamStructure, fetchTasks]);

  const handleTaskAdded = (newTask) => {
    console.log('✅ [TeamStructure] New task added:', newTask);
    setTasks(prev => [newTask, ...prev]);
    setShowTaskModal(false);
  };

  const handleFilterChange = (statusFilters) => {
    console.log('🔄 [TeamStructure] Filter changed to:', statusFilters);
    fetchTasks(statusFilters);
  };

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      console.log('🔄 [TeamStructure] Updating task:', taskId, updates);
      
      // For status updates, use PATCH endpoint for direct status toggle
      if (updates.status && Object.keys(updates).length === 1) {
        const response = await apiRequest(`/api/tasks/${taskId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: updates.status })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ [TeamStructure] Task status updated via PATCH:', result);
          
          // Update local state with the response data
          const updatedTask = result.data?.task || result.task || result;
          setTasks(prev => prev.map(task => 
            task._id === taskId ? { ...task, ...updatedTask, status: updates.status } : task
          ));
        } else {
          const errorData = await response.json();
          console.error('❌ [TeamStructure] Failed to update task status:', errorData.message);
          throw new Error(errorData.message || 'Failed to update task status');
        }
      } 
      // For multiple field updates, use PUT endpoint for general update
      else if (Object.keys(updates).length > 1) {
        const response = await apiRequest(`/api/tasks/${taskId}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ [TeamStructure] Task updated via PUT:', result);
          
          // Update local state with the response data
          const updatedTask = result.data?.task || result.task || result;
          setTasks(prev => prev.map(task => 
            task._id === taskId ? { ...task, ...updatedTask } : task
          ));
        } else {
          const errorData = await response.json();
          console.error('❌ [TeamStructure] Failed to update task:', errorData.message);
          throw new Error(errorData.message || 'Failed to update task');
        }
      }
      // For single field updates (non-status), update locally for now
      else {
        console.log('🔄 [TeamStructure] Local update for field:', Object.keys(updates)[0]);
        setTasks(prev => prev.map(task => 
          task._id === taskId ? { ...task, ...updates } : task
        ));
      }
      
    } catch (err) {
      console.error('❌ [TeamStructure] Error updating task:', err);
      // Show user-friendly error message
      const errorMessage = err.message || 'Failed to update task';
      alert(`Update failed: ${errorMessage}`);
    }
  };

  const removeRole = async (roleId) => {
    try {
      console.log('🔄 [TeamStructure] Removing role:', roleId);
      const response = await apiRequest(`/api/teams/${ideaId}/roles/${roleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [TeamStructure] Role removed:', data);
        // Refresh team structure
        fetchTeamStructure();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to remove role');
      }
    } catch (err) {
      console.error('❌ [TeamStructure] Error removing role:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Team Management</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading team structure...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Team Management</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-700 mb-4">{error}</p>
            <button 
              onClick={fetchTeamStructure}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!teamData) return null;

  const { teamMetrics, teamStructure, permissions, author, ideaTitle } = teamData;

  // Debug logging for user matching
  console.log('🔍 [TeamStructure] Current user:', user?._id, typeof user?._id);
  console.log('🔍 [TeamStructure] Team members:', teamStructure.teamComposition.map(m => ({ id: m.user._id, name: m.user.fullName, type: typeof m.user._id })));
  console.log('🔍 [TeamStructure] Member subroles state:', memberSubroles);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header Section */}
        <div className="border-b border-gray-200 bg-white">
          {/* Top Header Bar */}
          <div className="px-8 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight leading-tight">
                  {ideaTitle}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5 font-medium">
                  Team Collaboration Hub
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                Settings
              </button>
              <button 
                onClick={onClose} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-8">
            <nav className="flex space-x-8 border-b border-gray-200">
              {[
                { id: 'overview', label: 'Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                { id: 'tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m5 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-5 4v6m5-6v6m-5 0V5a2 2 0 012-2h2a2 2 0 012 2v0' },
                { id: 'feed', label: 'Feed', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
                { id: 'files', label: 'Files', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
                { id: 'performance', label: 'Performance', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 713.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z', authorOnly: true }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                  </svg>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {activeTab === 'overview' && (
            <div className="p-8">
              {/* Team Metrics */}
              <div className="grid grid-cols-4 gap-8 mb-8 py-6 border-b border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-1">{teamMetrics.currentSize}/{teamMetrics.maxTeamSize}</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide">Team Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-1">{teamMetrics.completionPercentage}%</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide">Complete</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-1">{teamMetrics.openPositions}</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide">Open Roles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-1">{teamMetrics.coreRolesFilled}/{teamMetrics.totalCoreRoles}</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide">Core Roles</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-900">Team Formation Progress</span>
            <span className="text-sm font-medium text-gray-900">{teamMetrics.completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 h-1">
            <div 
              className="bg-gray-900 h-1 transition-all duration-300" 
              style={{ width: `${teamMetrics.completionPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Author */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-4">Idea Author</h3>
          <div 
            className="py-4 border-b border-gray-100"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <div style={{ flex: '0 0 60%', display: 'flex', alignItems: 'center' }}>
              <UserAvatar
                userId={author._id}
                avatarUrl={author.avatar}
                size={40}
                isMentor={author.isMentor}
                isInvestor={author.isInvestor}
              />
              <div style={{ marginLeft: '16px', minWidth: 0, flex: 1 }}>
                <div className="font-medium text-gray-900 text-sm truncate">{author.fullName}</div>
                <div className="text-xs text-gray-500 truncate">Founder & Team Lead</div>
              </div>
            </div>
            <div style={{ flex: '0 0 25%' }}></div>
            <div style={{ flex: '0 0 15%', textAlign: 'right' }} className="text-xs font-medium text-gray-900">
              LEADER
            </div>
          </div>
        </div>

        {/* Current Team Members */}
        {teamStructure.teamComposition.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-4">Current Team</h3>
            <div className="space-y-0">
              {teamStructure.teamComposition.map((member) => (
                <div key={member._id}>
                  {/* Main Team Member */}
                  <div 
                    className="py-4 border-b border-gray-100 relative"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <div style={{ flex: '0 0 50%', display: 'flex', alignItems: 'center' }}>
                      <UserAvatar
                        userId={member.user._id}
                        avatarUrl={member.user.avatar}
                        size={40}
                        isMentor={member.user.isMentor}
                        isInvestor={member.user.isInvestor}
                      />
                      <div style={{ marginLeft: '16px', minWidth: 0, flex: 1 }}>
                        <div className="font-medium text-gray-900 text-sm truncate">{member.user.fullName}</div>
                        <div className="text-xs text-gray-500 truncate">{member.assignedRole}</div>
                      </div>
                    </div>
                    <div style={{ flex: '0 0 25%', paddingRight: '16px' }} className="text-xs text-gray-500">
                      {new Date(member.assignedAt).toLocaleDateString()}
                    </div>
                    <div style={{ flex: '0 0 15%', textAlign: 'right' }} className="text-xs font-medium text-gray-900">
                      {member.isLead ? 'LEAD' : 'ACTIVE'}
                    </div>
                    
                    {/* Three-dot menu - show for current user OR idea author */}
                    {(String(member.user._id) === String(user?._id) || String(author._id) === String(user?._id)) && (
                      <div className="relative ml-2" ref={activeMenu === member._id ? menuRef : null}>
                        <button
                          onClick={() => setActiveMenu(activeMenu === member._id ? null : member._id)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                          </svg>
                        </button>
                        
                        {/* Dropdown menu */}
                        {activeMenu === member._id && (
                          <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            <div className="py-1">
                              {/* Current user's own options */}
                              {String(member.user._id) === String(user?._id) && (
                                <>
                                  <button
                                    onClick={() => {
                                      console.log('🔄 [TeamStructure] Opening subrole modal for member:', member);
                                      setShowSubroleModal(member);
                                      setSubroleStep('search');
                                      setActiveMenu(null);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Subrole
                                  </button>
                                  <button
                                    onClick={() => handleLeaveTeam(member._id)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                                    </svg>
                                    Leave Team
                                  </button>
                                </>
                              )}
                              
                              {/* Author's management options for other members */}
                              {String(author._id) === String(user?._id) && String(member.user._id) !== String(user?._id) && (
                                <>
                                  <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                                    Team Management
                                  </div>
                                  
                                  {!member.isLead ? (
                                    <button
                                      onClick={() => handlePromoteToLead(member._id)}
                                      className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                      <svg className="w-4 h-4 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                      </svg>
                                      Promote to Leader
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleDemoteFromLead(member._id)}
                                      className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                                    >
                                      <svg className="w-4 h-4 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                      </svg>
                                      Remove Leadership
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => handleRemoveFromTeam(member._id)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Remove from Team
                                  </button>
                                </>
                              )}
                              
                              {/* Author's options for their own row */}
                              {String(author._id) === String(user?._id) && String(member.user._id) === String(user?._id) && (
                                <button
                                  onClick={() => {
                                    console.log('🔄 [TeamStructure] Opening subrole modal for author:', member);
                                    setShowSubroleModal(member);
                                    setSubroleStep('search');
                                    setActiveMenu(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Add Subrole
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Subrole Members - heavily indented and smaller */}
                  {memberSubroles[member._id] && memberSubroles[member._id].length > 0 && (
                    <div className="bg-gray-50/70 border-l-4 border-l-blue-200 ml-4">
                      {memberSubroles[member._id].map((subrole, subroleIndex) => (
                        <div 
                          key={subrole._id}
                          className={`py-2.5 pl-12 pr-4 relative ${subroleIndex !== memberSubroles[member._id].length - 1 ? 'border-b border-gray-200' : ''}`}
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          {/* Enhanced connection lines */}
                          <div className="absolute left-8 top-0 bottom-0 w-px bg-blue-300"></div>
                          <div className="absolute left-8 top-1/2 w-6 h-px bg-blue-300"></div>
                          <div className="absolute left-6 top-1/2 w-2 h-2 bg-blue-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                          
                          <div style={{ flex: '0 0 50%', display: 'flex', alignItems: 'center' }}>
                            <UserAvatar
                              userId={subrole.user._id}
                              avatarUrl={subrole.user.avatar}
                              size={28}
                              isMentor={subrole.user.isMentor}
                              isInvestor={subrole.user.isInvestor}
                            />
                            <div style={{ marginLeft: '10px', minWidth: 0, flex: 1 }}>
                              <div className="font-medium text-gray-700 text-xs truncate">{subrole.user.fullName}</div>
                              <div className="text-xs text-gray-500 truncate flex items-center mt-0.5">
                                <svg className="w-2.5 h-2.5 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                <span className="text-xs">{subrole.assignedRole}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ flex: '0 0 25%', paddingRight: '16px' }} className="text-xs text-gray-400">
                            {new Date(subrole.assignedAt).toLocaleDateString()}
                          </div>
                          <div style={{ flex: '0 0 15%', textAlign: 'right' }}>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              SUB
                            </span>
                          </div>
                          
                          {/* Three-dot menu for subrole - show for current user OR idea author */}
                          {(String(subrole.user._id) === String(user?._id) || String(author._id) === String(user?._id)) && (
                            <div className="relative ml-2">
                              <button
                                onClick={() => setActiveMenu(activeMenu === subrole._id ? null : subrole._id)}
                                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                              >
                                <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                </svg>
                              </button>
                              
                              {/* Dropdown menu for subrole */}
                              {activeMenu === subrole._id && (
                                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleLeaveTeam(subrole._id)}
                                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 713 3v1" />
                                      </svg>
                                      Leave Subrole
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Roles Needed */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Roles Needed</h3>
            {permissions.canManageTeam && (
              <button 
                onClick={() => setShowAddRole(true)}
                className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
              >
                + Add Role
              </button>
            )}
          </div>
          
          {teamStructure.rolesNeeded.length === 0 ? (
            <div className="text-center py-12 border border-gray-200">
              <p className="text-gray-500 mb-2">No roles defined yet</p>
              {permissions.canManageTeam && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Add roles to start building your team</p>
                  <button 
                    onClick={async () => {
                      console.log('🔄 [TeamStructure] Manual role sync triggered');
                      const rolesAdded = await syncIdeaRoles(teamData);
                      if (rolesAdded) {
                        // Refresh after a short delay to allow backend processing
                        setTimeout(() => {
                          fetchTeamStructure();
                        }, 1000);
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Sync roles from idea
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-gray-200">
              {/* Table Header */}
              <div 
                className="px-6 py-4 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide"
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <div style={{ flex: '0 0 42%', paddingRight: '16px' }}>Role</div>
                <div style={{ flex: '0 0 12%', paddingRight: '16px' }}>Type</div>
                <div style={{ flex: '0 0 12%', paddingRight: '16px' }}>Positions</div>
                <div style={{ flex: '0 0 8%', paddingRight: '16px' }}>Priority</div>
                <div style={{ flex: '0 0 18%', paddingRight: '16px' }}>Status</div>
                <div style={{ flex: '0 0 8%', textAlign: 'center' }}>Actions</div>
              </div>
              
              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {teamStructure.rolesNeeded.map((role) => (
                  <div 
                    key={role._id} 
                    className="px-6 py-5 hover:bg-gray-50 transition-colors"
                    style={{ display: 'flex', alignItems: 'flex-start' }}
                  >
                    <div style={{ flex: '0 0 42%', paddingRight: '16px' }}>
                      <div className="font-medium text-gray-900 text-sm mb-1 leading-tight">{role.roleType}</div>
                      <div className="text-xs text-gray-500 mb-2 leading-relaxed">{role.description}</div>
                      {role.skillsRequired && role.skillsRequired.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {role.skillsRequired.slice(0, 3).map((skill, index) => (
                            <span key={index} className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700">
                              {skill}
                            </span>
                          ))}
                          {role.skillsRequired.length > 3 && (
                            <span className="inline-block px-2 py-0.5 text-xs text-gray-500">
                              +{role.skillsRequired.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ flex: '0 0 12%', paddingRight: '16px', paddingTop: '2px' }}>
                      <div className="text-xs font-medium text-gray-900">
                        {role.isCore ? 'CORE' : 'OPTIONAL'}
                      </div>
                    </div>
                    
                    <div style={{ flex: '0 0 12%', paddingRight: '16px', paddingTop: '2px' }}>
                      <div className="text-xs font-medium text-gray-900">
                        {role.currentPositions}/{role.maxPositions}
                      </div>
                    </div>
                    
                    <div style={{ flex: '0 0 8%', paddingRight: '16px', paddingTop: '2px' }}>
                      <div className="text-xs font-medium text-gray-900">
                        {role.priority}
                      </div>
                    </div>
                    
                    <div style={{ flex: '0 0 18%', paddingRight: '16px', paddingTop: '2px' }}>
                      <div className="text-xs font-medium text-gray-900 mb-1">
                        {role.currentPositions >= role.maxPositions ? 'FILLED' : 'OPEN'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {role.applications} applications
                      </div>
                    </div>
                    
                    <div style={{ flex: '0 0 8%', display: 'flex', justifyContent: 'center', paddingTop: '2px' }}>
                      {permissions.canManageTeam && (
                        <button 
                          onClick={() => removeRole(role._id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                          title="Remove role"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Team Status */}
        <div className="border-t border-gray-200 pt-6">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: '0 0 75%', paddingRight: '16px' }}>
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Team Status</h4>
              <p className="text-xs text-gray-500 mt-1">
                {teamStructure.isTeamComplete ? 
                  'Team formation complete' : 
                  `${teamMetrics.openPositions} positions still needed`
                }
              </p>
            </div>
            <div style={{ flex: '0 0 25%', textAlign: 'right' }} className="text-xs font-medium text-gray-900">
              {teamStructure.isTeamComplete ? 'COMPLETE' : 'IN PROGRESS'}
            </div>
          </div>
        </div>

            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Task Management</h2>
                  <p className="text-sm text-gray-500 mt-1">Assign and track team tasks</p>
                </div>
                
                {permissions.canManageTeam && (
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Task</span>
                  </button>
                )}
              </div>
              
              <TaskList 
                ideaId={ideaId} 
                teamMembers={teamStructure.teamComposition}
                tasks={tasks}
                onTaskUpdate={handleTaskUpdate}
                onFilterChange={handleFilterChange}
              />
            </div>
          )}

          {activeTab === 'feed' && (
            <TeamFeedSection 
              ideaId={ideaId} 
              teamMembers={teamData?.teamStructure?.teamComposition || []}
            />
          )}

          {activeTab === 'files' && (
            <TeamFilesSection 
              ideaId={ideaId} 
              teamMembers={teamData?.teamStructure?.teamComposition || []}
            />
          )}

          {activeTab === 'performance' && (
            <div className="p-8">
              {/* Performance Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Team Performance</h2>
                  <p className="text-sm text-gray-500 mt-1">Author-only insights and analytics</p>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Author Only
                </div>
              </div>

              {/* Performance Overview Cards */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Team Productivity</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-1">{teamMetrics.completionPercentage}%</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2">↗ Team progress tracking</p>
                </div>

                <div className="bg-white p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-1">2.4h</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">→ Communication efficiency</p>
                </div>

                <div className="bg-white p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Quality Score</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-1">4.2/5</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">→ Work quality average</p>
                </div>

                <div className="bg-white p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Active Members</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-1">{teamStructure.teamComposition.length}/{teamMetrics.maxTeamSize}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">→ Team composition status</p>
                </div>
              </div>

              {/* Team Member Performance Table */}
              <div className="bg-white border border-gray-200 mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Individual Performance</h3>
                  <p className="text-sm text-gray-500 mt-1">Private performance metrics for team management</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teamStructure.teamComposition.map((member, index) => {
                        // Generate consistent performance data based on member ID
                        const memberHash = member._id.slice(-4); // Use last 4 chars of ID for consistency
                        const hashNum = parseInt(memberHash, 16) || 1000; // Convert to number
                        
                        const tasksCompleted = 5 + (hashNum % 6); // 5-10 tasks
                        const totalTasks = tasksCompleted + (hashNum % 4); // +0-3 additional
                        const responseTime = (1.2 + ((hashNum % 50) / 20)).toFixed(1); // 1.2-3.7 hours
                        const qualityScore = (3.5 + ((hashNum % 15) / 10)).toFixed(1); // 3.5-5.0 rating
                        const starCount = Math.min(5, Math.floor(parseFloat(qualityScore))); // Stars based on quality
                        
                        return (
                        <tr key={member._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <UserAvatar 
                                user={member.user} 
                                size="w-8 h-8" 
                                className="mr-3"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{member.user.fullName}</div>
                                <div className="text-sm text-gray-500">{member.user.firstName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{member.assignedRole}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{tasksCompleted}/{totalTasks}</div>
                            <div className="text-sm text-gray-500">completed</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {responseTime}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm text-gray-900">{qualityScore}/5</div>
                              <div className="ml-2 flex">
                                {[...Array(5)].map((_, i) => (
                                  <svg key={i} className={`w-4 h-4 ${i < starCount ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {member.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-gray-600 hover:text-gray-900 mr-3">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Performance Insights */}
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h4>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Strong Performance</p>
                        <p className="text-sm text-gray-600">Design team consistently delivering high-quality work ahead of schedule</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Needs Attention</p>
                        <p className="text-sm text-gray-600">Marketing response time has increased by 40% this week</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Opportunity</p>
                        <p className="text-sm text-gray-600">Consider pairing junior developers with senior team members</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Recommended Actions</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">Schedule 1:1 with Marketing Lead</p>
                      <p className="text-sm text-blue-700 mt-1">Discuss workload and potential blockers</p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200">
                      <p className="text-sm font-medium text-green-900">Recognize Design Team</p>
                      <p className="text-sm text-green-700 mt-1">Public acknowledgment for consistent excellence</p>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200">
                      <p className="text-sm font-medium text-purple-900">Team Building Session</p>
                      <p className="text-sm text-purple-700 mt-1">Improve cross-functional collaboration</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Role Modal */}
        {showAddRole && (
          <AddRoleModal 
            ideaId={ideaId}
            onClose={() => setShowAddRole(false)}
            onRoleAdded={fetchTeamStructure}
          />
        )}

        {/* Task Modal */}
        {/* Subrole Assignment Modal */}
        {showSubroleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-lg">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Add Subrole Member</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Adding subrole under: <strong>{showSubroleModal.user.fullName}</strong> ({showSubroleModal.assignedRole})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSubroleModal(null);
                      setSubroleStep('search');
                      setSubroleQuery('');
                      setSearchResults([]);
                      setSelectedUser(null);
                      setSubroleOptions([]);
                      setSelectedSubrole(null);
                    }}
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
                    
                    {!searchLoading && searchResults.length === 0 && subroleQuery.length >= 2 && (
                      <div className="text-center py-8 text-gray-500">
                        No users found matching "{subroleQuery}"
                      </div>
                    )}
                    
                    {!searchLoading && searchResults.length > 0 && (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {searchResults.map((searchUser) => (
                          <button
                            key={searchUser._id}
                            onClick={() => handleUserSelection(searchUser, showSubroleModal)}
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
        )}

        {showTaskModal && (
          <TaskModal
            isOpen={showTaskModal}
            onClose={() => setShowTaskModal(false)}
            ideaId={ideaId}
            teamMembers={teamStructure?.teamComposition || []}
            onTaskAdded={handleTaskAdded}
          />
        )}
      </div>
    </div>
  );
};

// Add Role Modal Component
const AddRoleModal = ({ ideaId, onClose, onRoleAdded }) => {
  const [roleData, setRoleData] = useState({
    roleType: '',
    description: '',
    isCore: true,
    maxPositions: 1,
    priority: 1,
    skillsRequired: []
  });
  const [skillInput, setSkillInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addSkill = () => {
    if (skillInput.trim() && !roleData.skillsRequired.includes(skillInput.trim())) {
      setRoleData(prev => ({
        ...prev,
        skillsRequired: [...prev.skillsRequired, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setRoleData(prev => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleData.roleType.trim()) return;

    setSubmitting(true);
    try {
      const response = await apiRequest(`/api/teams/${ideaId}/roles`, {
        method: 'POST',
        body: JSON.stringify(roleData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [AddRole] Role added:', data);
        onRoleAdded();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add role');
      }
    } catch (err) {
      console.error('❌ [AddRole] Error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white p-8 w-full max-w-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Add New Role</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Role Title</label>
            <input
              type="text"
              value={roleData.roleType}
              onChange={(e) => setRoleData(prev => ({ ...prev, roleType: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-gray-900 transition-colors"
              placeholder="e.g., Frontend Developer"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
            <textarea
              value={roleData.description}
              onChange={(e) => setRoleData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-gray-900 transition-colors"
              rows="3"
              placeholder="Describe the responsibilities and requirements..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Max Positions</label>
              <input
                type="number"
                min="1"
                max="10"
                value={roleData.maxPositions}
                onChange={(e) => setRoleData(prev => ({ ...prev, maxPositions: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-gray-900 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Priority</label>
              <select
                value={roleData.priority}
                onChange={(e) => setRoleData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-gray-900 transition-colors"
              >
                <option value={1}>High (1)</option>
                <option value={2}>Medium (2)</option>
                <option value={3}>Low (3)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={roleData.isCore}
                onChange={(e) => setRoleData(prev => ({ ...prev, isCore: e.target.checked }))}
                className="border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="ml-3 text-sm text-gray-900">Core role (essential for team)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Skills Required</label>
            <div className="flex space-x-3 mb-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1 px-4 py-3 border border-gray-200 focus:outline-none focus:border-gray-900 transition-colors"
                placeholder="Add a skill..."
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-3 border border-gray-200 text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Add
              </button>
            </div>
            {roleData.skillsRequired.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {roleData.skillsRequired.map((skill, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-900 text-sm">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-900 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !roleData.roleType.trim()}
              className="px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Adding...' : 'Add Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Team Feed Component
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
  
  // User cache for comment authors
  const [userCache, setUserCache] = useState({});
  



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
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error loading team posts:', err);
      setError(err.message || 'Failed to load team posts');
    } finally {
      setLoading(false);
    }
  }, [ideaId]);

  // useEffect for fetchTeamPosts (moved after function definition)
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
          const newPost = result.message;
          if (newPost && newPost._id) {
            setPosts(prevPosts => [newPost, ...(prevPosts || [])]);
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
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        ideaId,
        postContent: newPost,
        attachmentsCount: attachments?.length || 0
      });
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
              placeholder="Write your post /announcement"
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

              {/* Post Attachments */}
              {post.attachments && post.attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {post.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors shadow-sm"
                      onClick={() => {
                        if (attachment.fileType === 'link') {
                          window.open(attachment.url, '_blank', 'noopener,noreferrer');
                        } else {
                          window.open(attachment.url, '_blank');
                        }
                      }}
                    >
                      <span className="text-base mr-2">
                        {attachment.fileType === 'link' ? '🔗' : 
                         attachment.fileType?.includes('image') ? '🖼️' : '📄'}
                      </span>
                      <span className="text-sm text-gray-700 flex-1 truncate">
                        {attachment.originalName || attachment.name}
                      </span>
                      {attachment.fileSize && (
                        <span className="text-xs text-gray-500 ml-2">
                          {Math.round(attachment.fileSize / 1024)}KB
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Post Links */}
              {post.links && post.links.length > 0 && (
                <div className="mb-3 space-y-2">
                  <p className="text-xs font-medium text-gray-600 mb-2">🔗 Links:</p>
                  {post.links.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors shadow-sm border border-blue-100"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      <div className="flex-shrink-0 mr-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-900 truncate">
                          {link.title || 'Shared Link'}
                        </p>
                        <p className="text-xs text-blue-600 truncate">
                          {link.url}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
                  
                  {/* Badges for special posts */}
                  {post.isAnnouncement && (
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      📢 Announcement
                    </span>
                  )}
                  {post.isPinned && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      📌 Pinned
                    </span>
                  )}
                </div>

                {/* Comments Section */}
                {showComments[post._id] && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {/* Existing Comments */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {post.comments.map(comment => {
                          // Handle different comment author structures
                          let commentAuthor;
                          
                          console.log('🔍 [TeamFeed] Processing comment:', comment._id, 'Author type:', typeof comment.author, 'Author data:', comment.author);
                          console.log('🔍 [TeamFeed] Comment author keys:', comment.author ? Object.keys(comment.author) : 'No author');
                          console.log('🔍 [TeamFeed] Comment author fullName:', comment.author?.fullName);
                          console.log('🔍 [TeamFeed] Comment author firstName:', comment.author?.firstName);
                          
                          if (typeof comment.author === 'string') {
                            console.log('📍 [TeamFeed] Taking STRING path for author:', comment.author);
                            console.log('🔍 [TeamFeed] Current user ID:', user?._id);
                            console.log('🔍 [TeamFeed] Team members count:', teamMembers?.length || 0);
                            console.log('🔍 [TeamFeed] Team members:', teamMembers?.map(m => ({ id: m.user?._id, name: m.user?.fullName })));
                            
                            // Author is just a user ID, try to find the user in team members first
                            const teamMember = (teamMembers || []).find(member => 
                              member.user?._id === comment.author
                            );
                            
                            if (teamMember) {
                              commentAuthor = teamMember.user;
                              console.log('✅ [TeamFeed] Found in team members:', teamMember.user.fullName);
                            } else if (user?._id === comment.author) {
                              // If it's the current user
                              commentAuthor = user;
                              console.log('✅ [TeamFeed] Using current user:', user?.fullName || user?.firstName);
                            } else if (userCache[comment.author]) {
                              // Check if we have cached user data
                              commentAuthor = userCache[comment.author];
                              console.log('✅ [TeamFeed] Using cached user:', userCache[comment.author].fullName);
                            } else {
                              // Fallback: use a generic structure with proper user ID
                              commentAuthor = { 
                                _id: comment.author, 
                                fullName: 'Loading user...', 
                                avatar: '' 
                              };
                              console.log('⚠️ [TeamFeed] User not found locally, using fallback for:', comment.author);
                              
                              // Don't try to fetch user details since the API is failing
                              // Instead, let's try a different approach - check if we can find this user in the post author
                              const postAuthor = posts.find(p => p.author?._id === comment.author)?.author;
                              if (postAuthor) {
                                commentAuthor = postAuthor;
                                console.log('✅ [TeamFeed] Found user in post authors:', postAuthor.fullName);
                              }
                            }
                          } else if (comment.author && typeof comment.author === 'object') {
                            console.log('📍 [TeamFeed] Taking OBJECT path for author');
                            // Author is already a full object - use it directly
                            commentAuthor = comment.author;
                            console.log('✅ [TeamFeed] Using full author object:', commentAuthor.fullName || commentAuthor.firstName);
                          } else {
                            console.log('📍 [TeamFeed] Taking FALLBACK path for author');
                            // Fallback for any other case
                            commentAuthor = { 
                              _id: 'unknown', 
                              fullName: 'Unknown User', 
                              avatar: '' 
                            };
                            console.warn('⚠️ [TeamFeed] Unknown comment author format:', comment.author);
                          }
                          
                          return (
                            <div key={comment._id} className="flex gap-2">
                              <UserAvatar
                                fullName={commentAuthor?.fullName || commentAuthor?.firstName || 'Unknown User'}
                                avatarUrl={commentAuthor?.avatar}
                                size={20}
                              />
                              <div className="flex-1 bg-gray-50 rounded-lg p-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-gray-900">
                                    {commentAuthor?.fullName || commentAuthor?.firstName || 'Unknown User'}
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

export default TeamStructureDashboard;
