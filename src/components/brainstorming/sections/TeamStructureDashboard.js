import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '../../../utils/api';
import { useUser } from '../../../UserContext';
import UserAvatar from '../../UserAvatar';
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

  useEffect(() => {
    fetchTeamStructure();
    fetchTasks();
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
        
        // Refresh team structure
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

  const fetchTeamStructure = async () => {
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
          await syncIdeaRoles(structureData);
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
  };

  const syncIdeaRoles = async (currentTeamData) => {
    try {
      console.log('🔄 [TeamStructure] Fetching idea data to sync roles...');
      
      // Fetch the idea data to get neededRoles
      const ideaResponse = await apiRequest(`/api/ideas/${ideaId}`);
      
      if (ideaResponse.ok) {
        const ideaData = await ideaResponse.json();
        console.log('📦 [TeamStructure] Idea data received:', ideaData);
        
        // Extract idea data - handle different response formats
        const idea = ideaData.data || ideaData.idea || ideaData;
        const neededRoles = idea.neededRoles;
        
        if (neededRoles && neededRoles.length > 0) {
          console.log('✅ [TeamStructure] Found neededRoles in idea:', neededRoles);
          
          // Create roles in team structure
          for (let i = 0; i < neededRoles.length; i++) {
            const roleType = neededRoles[i].trim();
            if (roleType) {
              console.log(`🔄 [TeamStructure] Creating role: ${roleType}`);
              
              try {
                const roleResponse = await apiRequest(`/api/teams/${ideaId}/roles`, {
                  method: 'POST',
                  body: JSON.stringify({
                    roleType: roleType,
                    description: `${roleType} role needed for this startup idea`,
                    isCore: i < 3, // First 3 roles are core
                    maxPositions: 1,
                    priority: i + 1,
                    skillsRequired: []
                  })
                });
                
                if (roleResponse.ok) {
                  console.log(`✅ [TeamStructure] Created role: ${roleType}`);
                } else {
                  console.warn(`⚠️ [TeamStructure] Failed to create role: ${roleType}`);
                }
              } catch (roleErr) {
                console.warn(`⚠️ [TeamStructure] Error creating role ${roleType}:`, roleErr);
              }
            }
          }
          
          // Refresh team structure after creating roles
          console.log('🔄 [TeamStructure] Refreshing team structure after role sync...');
          setTimeout(() => {
            fetchTeamStructure();
          }, 1000);
        } else {
          console.log('ℹ️ [TeamStructure] No neededRoles found in idea');
        }
      } else {
        console.warn('⚠️ [TeamStructure] Failed to fetch idea data for role sync');
      }
    } catch (err) {
      console.error('❌ [TeamStructure] Error syncing idea roles:', err);
    }
  };

  const fetchTasks = async (statusFilters = ['todo', 'in_progress']) => {
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
  };

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
  console.log('🔍 [TeamStructure] Current user:', user?._id);
  console.log('🔍 [TeamStructure] Team members:', teamStructure.teamComposition.map(m => ({ id: m.user._id, name: m.user.fullName })));

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
                  <div 
                    className="py-4 border-b border-gray-100 last:border-b-0 relative"
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
                    
                    {/* Three-dot menu - only show for current user */}
                    {String(member.user._id) === String(user?._id) && (
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
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            <div className="py-1">
                              {/* Add Subrole - show for all team members until backend implements canAddSubroles */}
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
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Leave Team
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
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
                      await syncIdeaRoles(teamData);
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
            <div className="p-8">
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Team Feed</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Real-time updates and team communication. Coming soon.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="p-8">
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">File Management</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Centralized document storage and sharing. Coming soon.
                </p>
              </div>
            </div>
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

export default TeamStructureDashboard;
