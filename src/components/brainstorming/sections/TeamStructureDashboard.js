import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../../../UserContext';
import { useTeamStructure } from '../../../hooks/useTeamStructure';
import { useTeamActions } from '../../../hooks/useTeamActions';
import { apiRequest } from '../../../utils/api';

// Import section components
import TeamOverviewSection from './TeamOverviewSection';
import TeamPerformanceSection from './TeamPerformanceSection';
import TeamFeedSection from './TeamFeedSection';
import TeamFilesSection from './TeamFilesSection';
import TaskList from './TaskList';
import TaskModal from './TaskModal';
import AddRoleModal from './AddRoleModal';
import SubroleModal from './SubroleModal';

const TeamStructureDashboard = ({ ideaId, onClose }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  
  // Team member menu states
  const [activeMenu, setActiveMenu] = useState(null);
  const [showSubroleModal, setShowSubroleModal] = useState(null);
  const [, setSubroleStep] = useState('search');
  const [subroleQuery, setSubroleQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSubrole, setSelectedSubrole] = useState(null);
  const menuRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Use custom hooks
  const {
    teamData,
    loading,
    error,
    memberSubroles,
    fetchTeamStructure,
    removeRole
  } = useTeamStructure(ideaId);

  const {
    handleLeaveTeam,
    handlePromoteToLead,
    handleDemoteFromLead,
    handleRemoveFromTeam
  } = useTeamActions(ideaId, teamData, fetchTeamStructure);

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
        setSelectedSubrole(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      const timeoutRef = searchTimeoutRef.current;
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, []);

  // Check if user is authorized for performance tab and redirect if not
  useEffect(() => {
    if (teamData && activeTab === 'performance') {
      const { author } = teamData;
      const isAuthorCheck = author && user && String(author._id) === String(user._id);
      
      if (!isAuthorCheck) {
        console.warn('⚠️ [TeamStructure] Non-author attempted to access performance tab, redirecting to overview');
        setActiveTab('overview');
      }
    }
  }, [teamData, activeTab, user]);

  // Tasks management
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

  // useEffect for initial data loading
  useEffect(() => {
    fetchTeamStructure();
    fetchTasks();
  }, [fetchTeamStructure, fetchTasks]);

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

  // Subrole handlers
  const handleSubroleAdded = () => {
    // Refresh subroles for the specific parent member
    fetchTeamStructure();
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

  // Check if current user is a team member or author
  const isAuthor = author && user && String(author._id) === String(user._id);
  
  // Enhanced team membership check using both teamComposition and flatComposition
  const checkMembership = (members) => {
    if (!members || !Array.isArray(members) || !user) return false;
    
    return members.some(member => {
      if (!member) return false;
      
      // Strategy 1: Check member.user._id (main structure)
      if (member.user && member.user._id) {
        return String(member.user._id) === String(user._id);
      }
      
      // Strategy 2: Check member._id (if member is the user object directly)
      if (member._id) {
        return String(member._id) === String(user._id);
      }
      
      // Strategy 3: Check member.userId (alternative structure)
      if (member.userId) {
        return String(member.userId) === String(user._id);
      }
      
      return false;
    });
  };
  
  const isTeamMember = checkMembership(teamStructure?.teamComposition) || 
                      checkMembership(teamStructure?.flatComposition) || 
                      false;
  
  const hasTeamAccess = isAuthor || isTeamMember;

  console.log('🔍 [TeamStructure] Enhanced access check:', {
    userId: user?._id,
    userEmail: user?.email,
    authorId: author?._id,
    isAuthor,
    isTeamMember,
    hasTeamAccess,
    teamComposition: teamStructure?.teamComposition?.map(m => ({
      memberId: m._id,
      userId: m.user?._id,
      userEmail: m.user?.email,
      name: m.user?.fullName,
      role: m.assignedRole || m.role
    })),
    flatComposition: teamStructure?.flatComposition?.map(m => ({
      memberId: m._id,
      userId: m.user?._id,
      userEmail: m.user?.email,
      name: m.user?.fullName,
      role: m.assignedRole || m.role
    })),
    checkResults: {
      teamCompositionCheck: checkMembership(teamStructure?.teamComposition),
      flatCompositionCheck: checkMembership(teamStructure?.flatComposition)
    }
  });

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
              ].filter(tab => {
                // Filter out author-only tabs for non-authors
                if (tab.authorOnly) {
                  return isAuthor;
                }
                return true;
              }).map((tab) => (
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
            <TeamOverviewSection
              teamData={teamData}
              permissions={permissions}
              memberSubroles={memberSubroles}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              showSubroleModal={showSubroleModal}
              setShowSubroleModal={setShowSubroleModal}
              setSubroleStep={setSubroleStep}
              onLeaveTeam={handleLeaveTeam}
              onPromoteToLead={handlePromoteToLead}
              onDemoteFromLead={handleDemoteFromLead}
              onRemoveFromTeam={handleRemoveFromTeam}
              onRemoveRole={removeRole}
              onShowAddRole={() => setShowAddRoleModal(true)}
            />
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
            hasTeamAccess ? (
              <TeamFeedSection 
                ideaId={ideaId} 
                teamMembers={teamData?.teamStructure?.teamComposition || []}
              />
            ) : (
              <div className="p-8">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-medium text-amber-900">Team Access Required</h3>
                      <p className="text-amber-700 mt-1">You need to be a team member to access the team feed. Please contact the idea author to join the team.</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {activeTab === 'files' && (
            hasTeamAccess ? (
              <TeamFilesSection 
                ideaId={ideaId} 
                teamMembers={teamData?.teamStructure?.teamComposition || []}
              />
            ) : (
              <div className="p-8">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-medium text-amber-900">Team Access Required</h3>
                      <p className="text-amber-700 mt-1">You need to be a team member to access team files. Please contact the idea author to join the team.</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {activeTab === 'performance' && (
            isAuthor ? (
              <TeamPerformanceSection 
                ideaId={ideaId}
                teamData={teamData}
                teamStructure={teamStructure}
                teamMetrics={teamMetrics}
              />
            ) : (
              <div className="p-8">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-medium text-amber-900">Access Restricted</h3>
                      <p className="text-amber-700 mt-1">Performance analytics are only available to the idea author.</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddRoleModal && (
        <AddRoleModal
          ideaId={ideaId}
          onClose={() => setShowAddRoleModal(false)}
          onRoleAdded={fetchTeamStructure}
        />
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

      {showSubroleModal && (
        <SubroleModal
          ideaId={ideaId}
          member={showSubroleModal}
          onClose={() => {
            setShowSubroleModal(null);
            setSubroleStep('search');
            setSubroleQuery('');
            setSearchResults([]);
            setSelectedUser(null);
            setSelectedSubrole(null);
          }}
          onSubroleAdded={handleSubroleAdded}
          subroleQuery={subroleQuery}
          setSubroleQuery={setSubroleQuery}
          subroleSearchResults={searchResults}
          setSubroleSearchResults={setSearchResults}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          selectedSubrole={selectedSubrole}
          setSelectedSubrole={setSelectedSubrole}
          searchTimeoutRef={searchTimeoutRef}
        />
      )}
    </div>
  );
};

export default TeamStructureDashboard;
