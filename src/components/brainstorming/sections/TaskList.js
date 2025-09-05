import React, { useState } from 'react';
import UserAvatar from '../../UserAvatar';
import { useUser } from '../../../UserContext';

const TaskList = ({ ideaId, teamMembers, tasks, onTaskUpdate }) => {
  const { user } = useUser();
  const [visibleColumns, setVisibleColumns] = useState({
    status: true,
    priority: true,
    assignee: true,
    dueDate: true,
    category: false,
    tags: false,
    estimatedHours: false
  });
  const [editingTask, setEditingTask] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [batchEditMode, setBatchEditMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState(new Set());

  const priorityColors = {
    low: '#10B981',      // Green
    medium: '#F59E0B',   // Yellow  
    high: '#EF4444',     // Red
    urgent: '#8B5CF6'    // Purple
  };

  const statusOptions = [
    { value: 'pending', label: 'To Do', color: '#6B7280' },
    { value: 'in_progress', label: 'In Progress', color: '#3B82F6' },
    { value: 'completed', label: 'Done', color: '#10B981' },
    { value: 'cancelled', label: 'Cancelled', color: '#EF4444' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#10B981' },
    { value: 'medium', label: 'Medium', color: '#F59E0B' },
    { value: 'high', label: 'High', color: '#EF4444' },
    { value: 'urgent', label: 'Urgent', color: '#8B5CF6' }
  ];

  const categoryOptions = [
    { value: 'development', label: 'Dev', icon: '💻' },
    { value: 'design', label: 'Design', icon: '🎨' },
    { value: 'marketing', label: 'Marketing', icon: '📢' },
    { value: 'research', label: 'Research', icon: '🔍' },
    { value: 'planning', label: 'Planning', icon: '📋' },
    { value: 'testing', label: 'Testing', icon: '🧪' },
    { value: 'general', label: 'General', icon: '📝' }
  ];

  const updateTask = (taskId, field, value) => {
    const updates = { [field]: value };
    onTaskUpdate(taskId, updates);
    setEditingTask(null);
  };

  const updateMultipleFields = (taskId, updates) => {
    onTaskUpdate(taskId, updates);
  };

  const toggleTaskStatus = (taskId, newStatus) => {
    // Use PATCH for direct status toggle by assigned user
    onTaskUpdate(taskId, { status: newStatus });
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const batchUpdateTasks = (updates) => {
    // Use PUT endpoint for multiple field updates
    selectedTasks.forEach(taskId => {
      updateMultipleFields(taskId, updates);
    });
    setSelectedTasks(new Set());
    setBatchEditMode(false);
  };

  const selectAllTasks = () => {
    const allTaskIds = new Set(tasks.map(task => task._id));
    setSelectedTasks(allTaskIds);
  };

  const clearSelection = () => {
    setSelectedTasks(new Set());
  };

  const startEditing = (taskId, field, currentValue) => {
    setEditingTask(`${taskId}-${field}`);
    setEditValue(currentValue);
  };

  const getAssignedMember = (userId) => {
    if (!userId || !teamMembers || !Array.isArray(teamMembers)) {
      return null;
    }
    
    // Handle different possible team member structures
    const found = teamMembers.find(member => {
      // Structure 1: { user: { _id: "...", fullName: "..." } }
      if (member && member.user && member.user._id === userId) {
        return true;
      }
      // Structure 2: { _id: "...", fullName: "..." } (direct user object)
      if (member && member._id === userId) {
        return true;
      }
      // Structure 3: String ID comparison
      if (typeof member === 'string' && member === userId) {
        return true;
      }
      return false;
    });
    
    return found;
  };

  const canUserUpdateTask = (task) => {
    if (!user || !task) return false;
    
    // Handle the correct backend structure with assignments array
    if (task.assignments && Array.isArray(task.assignments)) {
      // Check if user is assigned to this task
      return task.assignments.some(assignment => assignment.user._id === user._id);
    }
    
    // Legacy support: Check if task is assigned to specific users
    if (task.assignedUsers && Array.isArray(task.assignedUsers)) {
      return task.assignedUsers.includes(user._id);
    }
    
    // Legacy support: check if task is assigned to this specific user
    if (task.assignedTo) {
      return task.assignedTo === user._id;
    }
    
    return false;
  };

  const getAssigneeDisplay = (task) => {
    // Handle the correct backend structure with assignments array
    if (task.assignments && Array.isArray(task.assignments)) {
      if (task.assignmentType === 'everyone') {
        return {
          type: 'everyone',
          display: '👥 Everyone',
          count: task.assignments.length,
          assignments: task.assignments
        };
      }
      
      if (task.assignments.length === 1) {
        const assignment = task.assignments[0];
        const user = assignment.user;
        return {
          type: 'single',
          user: user,
          assignment: assignment,
          display: user.fullName || user.firstName || 'Unknown User'
        };
      } else if (task.assignments.length > 1) {
        return {
          type: 'multiple',
          count: task.assignments.length,
          assignments: task.assignments,
          display: `${task.assignments.length} members`
        };
      }
    }
    
    // Legacy support for old structure
    if (task.assignedUsers && Array.isArray(task.assignedUsers)) {
      if (task.assignedUsers.length === 1) {
        const member = getAssignedMember(task.assignedUsers[0]);
        if (member) {
          const user = member.user || member;
          return {
            type: 'single',
            member: member,
            user: user,
            display: user.fullName || user.firstName || 'Unknown User'
          };
        }
        return {
          type: 'single',
          member: null,
          display: 'Unknown User'
        };
      } else {
        return {
          type: 'multiple',
          count: task.assignedUsers.length,
          display: `${task.assignedUsers.length} members`
        };
      }
    }
    
    // Legacy support for assignedTo
    if (task.assignedTo) {
      const member = getAssignedMember(task.assignedTo);
      if (member) {
        const user = member.user || member;
        return {
          type: 'single',
          member: member,
          user: user,
          display: user.fullName || user.firstName || 'Unknown User'
        };
      }
      return {
        type: 'single',
        member: null,
        display: 'Unknown User'
      };
    }
    
    return {
      type: 'unassigned',
      display: 'Unassigned'
    };
  };

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const formatDate = (task) => {
    // Handle both dueDate (legacy) and deadline (new backend format)
    const dateString = task.deadline || task.dueDate;
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    if (diffDays < 7) return `${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  const isOverdue = (task) => {
    const dateString = task.deadline || task.dueDate;
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col space-y-3">
        {/* Column Toggle Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <span className="text-sm font-medium text-gray-700">Show columns:</span>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {Object.entries(visibleColumns).map(([key, visible]) => (
                <label key={key} className="flex items-center space-x-1 text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => toggleColumn(key)}
                    className="w-3 h-3"
                  />
                  <span className="capitalize text-gray-600">
                    {key === 'dueDate' ? 'Due' : 
                     key === 'estimatedHours' ? 'Hours' : 
                     key === 'assignee' ? 'Assign' : key}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {tasks.length} tasks
          </div>
        </div>

        {/* Batch Edit Controls */}
        {selectedTasks.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    batchUpdateTasks({ status: e.target.value });
                    e.target.value = '';
                  }
                }}
                className="text-xs px-2 py-1 border border-blue-300 bg-white"
                defaultValue=""
              >
                <option value="">Batch Status Update (PUT)</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    Set to {option.label}
                  </option>
                ))}
              </select>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    batchUpdateTasks({ priority: e.target.value });
                    e.target.value = '';
                  }
                }}
                className="text-xs px-2 py-1 border border-blue-300 bg-white"
                defaultValue=""
              >
                <option value="">Batch Priority Update (PUT)</option>
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    Set to {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white border border-gray-200 overflow-hidden overflow-x-auto">
        {/* Header Row */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex items-center h-10 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-full">
            <div className="w-4 flex-shrink-0">
              <input 
                type="checkbox" 
                className="w-3 h-3"
                checked={tasks.length > 0 && selectedTasks.size === tasks.length}
                onChange={() => {
                  if (selectedTasks.size === tasks.length) {
                    clearSelection();
                  } else {
                    selectAllTasks();
                  }
                }}
                title="Select all tasks"
              />
            </div>
            <div className="flex-1 min-w-0 px-1 sm:px-2">Task</div>
            {visibleColumns.status && <div className="w-20 sm:w-24 px-1 sm:px-2">Status</div>}
            {visibleColumns.priority && <div className="w-16 sm:w-20 px-1 sm:px-2 hidden sm:block">Priority</div>}
            {visibleColumns.assignee && <div className="w-24 sm:w-32 px-1 sm:px-2">Assignee</div>}
            {visibleColumns.dueDate && <div className="w-20 sm:w-24 px-1 sm:px-2">Due</div>}
            {visibleColumns.category && <div className="w-16 sm:w-20 px-1 sm:px-2 hidden md:block">Category</div>}
            {visibleColumns.estimatedHours && <div className="w-12 sm:w-16 px-1 sm:px-2 hidden lg:block">Hours</div>}
            {visibleColumns.tags && <div className="w-24 sm:w-32 px-1 sm:px-2 hidden lg:block">Tags</div>}
          </div>
        </div>

        {/* Task Rows */}
        <div className="divide-y divide-gray-100">
          {tasks.map((task) => {
            const assigneeInfo = getAssigneeDisplay(task);
            const overdue = isOverdue(task);
            const canUpdate = canUserUpdateTask(task);
            const statusOption = statusOptions.find(s => s.value === task.status);
            const priorityOption = priorityOptions.find(p => p.value === task.priority);
            const categoryOption = categoryOptions.find(c => c.value === task.category);
            
            return (
              <div key={task._id} className="flex items-center h-12 px-2 sm:px-4 hover:bg-gray-50 group min-w-full">
                {/* Checkbox */}
                <div className="w-4 flex-shrink-0">
                  <input 
                    type="checkbox" 
                    className="w-3 h-3"
                    checked={selectedTasks.has(task._id)}
                    onChange={() => toggleTaskSelection(task._id)}
                    title="Select for batch operations"
                  />
                </div>

                {/* Task Title */}
                <div className="flex-1 min-w-0 px-1 sm:px-2">
                  {editingTask === `${task._id}-title` ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => updateTask(task._id, 'title', editValue)}
                      onKeyPress={(e) => e.key === 'Enter' && updateTask(task._id, 'title', editValue)}
                      className="w-full text-sm border-none outline-none bg-transparent"
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={() => startEditing(task._id, 'title', task.title)}
                      className="text-sm text-gray-900 cursor-text hover:bg-gray-100 px-1 py-1 -mx-1 rounded truncate"
                    >
                      {task.title}
                    </div>
                  )}
                </div>

                {/* Status */}
                {visibleColumns.status && (
                  <div className="w-20 sm:w-24 px-1 sm:px-2">
                    {canUpdate ? (
                      <select
                        value={task.status}
                        onChange={(e) => toggleTaskStatus(task._id, e.target.value)}
                        className="text-xs border-none outline-none bg-transparent cursor-pointer w-full"
                        style={{ color: statusOption?.color }}
                        title="Click to update status (PATCH /api/tasks/{id}/status)"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span 
                        className="text-xs"
                        style={{ color: statusOption?.color }}
                        title="Only assigned users can update status"
                      >
                        {statusOption?.label || task.status}
                      </span>
                    )}
                  </div>
                )}

                {/* Priority */}
                {visibleColumns.priority && (
                  <div className="w-16 sm:w-20 px-1 sm:px-2 hidden sm:block">
                    <select
                      value={task.priority}
                      onChange={(e) => updateTask(task._id, 'priority', e.target.value)}
                      className="text-xs border-none outline-none bg-transparent cursor-pointer w-full"
                      style={{ color: priorityOption?.color }}
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Assignee */}
                {visibleColumns.assignee && (
                  <div className="w-24 sm:w-32 px-1 sm:px-2">
                    {assigneeInfo.type === 'everyone' && assigneeInfo.assignments ? (
                      <div className="flex items-center space-x-1">
                        <div className="flex -space-x-1">
                          {assigneeInfo.assignments.slice(0, 3).map((assignment, index) => (
                            <div key={assignment.user._id} className="flex-shrink-0">
                              <UserAvatar 
                                userId={assignment.user._id}
                                avatarUrl={assignment.user.avatar} 
                                size={14}
                              />
                            </div>
                          ))}
                          {assigneeInfo.assignments.length > 3 && (
                            <div className="flex-shrink-0 w-3.5 h-3.5 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs text-gray-600">+{assigneeInfo.assignments.length - 3}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-700 truncate min-w-0 hidden sm:inline">
                          Everyone ({assigneeInfo.count})
                        </span>
                        <span className="text-xs text-gray-700 truncate min-w-0 sm:hidden">
                          All ({assigneeInfo.count})
                        </span>
                      </div>
                    ) : assigneeInfo.type === 'multiple' && assigneeInfo.assignments ? (
                      <div className="flex items-center space-x-1">
                        <div className="flex -space-x-1">
                          {assigneeInfo.assignments.slice(0, 3).map((assignment, index) => (
                            <div key={assignment.user._id} className="flex-shrink-0">
                              <UserAvatar 
                                userId={assignment.user._id}
                                avatarUrl={assignment.user.avatar} 
                                size={14}
                              />
                            </div>
                          ))}
                          {assigneeInfo.assignments.length > 3 && (
                            <div className="flex-shrink-0 w-3.5 h-3.5 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs text-gray-600">+{assigneeInfo.assignments.length - 3}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-700 truncate min-w-0 hidden sm:inline">
                          {assigneeInfo.display}
                        </span>
                        <span className="text-xs text-gray-700 truncate min-w-0 sm:hidden">
                          {assigneeInfo.count}
                        </span>
                      </div>
                    ) : assigneeInfo.type === 'single' && assigneeInfo.user ? (
                      <div className="flex items-center space-x-1 sm:space-x-1.5">
                        <div className="flex-shrink-0">
                          <UserAvatar 
                            userId={assigneeInfo.user._id}
                            avatarUrl={assigneeInfo.user.avatar} 
                            size={16}
                          />
                        </div>
                        <span className="text-xs text-gray-700 truncate min-w-0 hidden sm:inline">
                          {assigneeInfo.user.fullName || assigneeInfo.user.firstName}
                        </span>
                        <span className="text-xs text-gray-700 truncate min-w-0 sm:hidden">
                          {assigneeInfo.user.firstName || assigneeInfo.user.fullName?.split(' ')[0]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                )}

                {/* Due Date */}
                {visibleColumns.dueDate && (
                  <div className="w-20 sm:w-24 px-1 sm:px-2">
                    <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                      {formatDate(task)}
                    </span>
                  </div>
                )}

                {/* Category */}
                {visibleColumns.category && (
                  <div className="w-16 sm:w-20 px-1 sm:px-2 hidden md:block">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs">{categoryOption?.icon}</span>
                      <span className="text-xs text-gray-700 hidden lg:inline">{categoryOption?.label}</span>
                    </div>
                  </div>
                )}

                {/* Estimated Hours */}
                {visibleColumns.estimatedHours && (
                  <div className="w-12 sm:w-16 px-1 sm:px-2 hidden lg:block">
                    {editingTask === `${task._id}-estimatedHours` ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => updateTask(task._id, 'estimatedHours', parseFloat(editValue) || 0)}
                        onKeyPress={(e) => e.key === 'Enter' && updateTask(task._id, 'estimatedHours', parseFloat(editValue) || 0)}
                        className="w-full text-xs border-none outline-none bg-transparent"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={() => startEditing(task._id, 'estimatedHours', task.estimatedHours || '')}
                        className="text-xs text-gray-700 cursor-text hover:bg-gray-100 px-1 py-1 -mx-1 rounded"
                      >
                        {task.estimatedHours ? `${task.estimatedHours}h` : '-'}
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {visibleColumns.tags && (
                  <div className="w-24 sm:w-32 px-1 sm:px-2 hidden lg:block">
                    <div className="flex flex-wrap gap-1">
                      {task.tags && task.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {task.tags && task.tags.length > 2 && (
                        <span className="text-xs text-gray-400">+{task.tags.length - 2}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {tasks.length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-200">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m5 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-5 4v6m5-6v6m-5 0V5a2 2 0 012-2h2a2 2 0 012 2v0" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No tasks yet. Create your first task to get started.</p>
        </div>
      )}
    </div>
  );
};

export default TaskList;
