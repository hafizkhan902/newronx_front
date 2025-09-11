import React, { useState } from 'react';
import UserAvatar from '../../UserAvatar';
import { useUser } from '../../../UserContext';
import { apiRequest } from '../../../utils/api';

const TaskList = ({ ideaId, teamMembers, tasks, onTaskUpdate, onFilterChange }) => {
  const { user } = useUser();
  const [showCompleted, setShowCompleted] = useState(false);
  const [activeFilters, setActiveFilters] = useState(['todo', 'in_progress']); // Default to show active tasks
  const [visibleColumns, setVisibleColumns] = useState({
    status: true,
    priority: true,
    assignee: true,
    dueDate: true,
    attachments: true,
    category: false,
    tags: false,
    estimatedHours: false
  });
  const [editingTask, setEditingTask] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [batchEditMode, setBatchEditMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  
  // Attachment popup state
  const [showAttachmentPopup, setShowAttachmentPopup] = useState(null);
  const [attachmentPopupPosition, setAttachmentPopupPosition] = useState({ x: 0, y: 0 });

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

  const deleteTask = async (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    if (window.confirm(`Delete task "${task.title}"? This action cannot be undone.`)) {
      try {
        console.log('🔄 [TaskList] Deleting task:', taskId);
        
        // Make direct API call to DELETE /api/tasks/{taskId}
        const response = await apiRequest(`/api/tasks/${taskId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ [TaskList] Task deleted successfully:', result);
          
          // Refresh the task list by calling the parent's filter change to reload tasks
          if (onFilterChange) {
            onFilterChange(activeFilters);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to delete task');
        }
      } catch (error) {
        console.error('❌ [TaskList] Failed to delete task:', error);
        alert(`Failed to delete task: ${error.message}`);
      }
    }
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

  const handleFilterChange = (statusFilters) => {
    setActiveFilters(statusFilters);
    if (onFilterChange) {
      onFilterChange(statusFilters);
    }
  };

  const setQuickFilter = (filterType) => {
    let newFilters;
    switch (filterType) {
      case 'all':
        newFilters = ['todo', 'in_progress', 'completed', 'cancelled'];
        break;
      case 'active':
        newFilters = ['todo', 'in_progress'];
        break;
      case 'completed':
        newFilters = ['completed'];
        break;
      default:
        newFilters = ['todo', 'in_progress'];
    }
    handleFilterChange(newFilters);
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

  // Attachment utility functions
  const hasAttachments = (task) => {
    return task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0;
  };

  const getAttachmentIcon = (attachment) => {
    // Handle both frontend format and backend format
    if (attachment.type === 'link' || attachment.fileType === 'link') return '🔗';
    
    // Get filename from either frontend format or backend format
    const fileName = attachment.name || attachment.originalName || '';
    const fileType = attachment.fileType || '';
    
    // Check fileType first (backend format)
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    
    // Fallback to extension check
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp': return '🖼️';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleAttachmentClick = (event, task) => {
    if (!hasAttachments(task)) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setAttachmentPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setShowAttachmentPopup(task._id);
  };

  const downloadAttachment = (attachment) => {
    // Handle both frontend format and backend format
    const isLink = attachment.type === 'link' || attachment.fileType === 'link';
    const url = attachment.url;
    const fileName = attachment.name || attachment.originalName || 'attachment';
    
    if (isLink) {
      // Open link in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Download file
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setShowAttachmentPopup(null);
  };

  const closeAttachmentPopup = () => {
    setShowAttachmentPopup(null);
  };

  // Since we're using backend filtering, we can display all returned tasks
  // The backend will filter based on activeFilters

  // Function to render task table
  const renderTaskTable = (taskList, isCompleted = false) => {
    if (taskList.length === 0) return null;

    return (
      <div className={`bg-white border border-gray-200 overflow-hidden overflow-x-auto ${isCompleted ? 'opacity-75' : ''}`}>
        {/* Header Row */}
        <div className={`border-b border-gray-200 ${isCompleted ? 'bg-green-50' : 'bg-gray-50'}`}>
          <div className="flex items-center h-10 px-2 sm:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-full">
            <div className="w-4 flex-shrink-0">
              <input 
                type="checkbox" 
                className="w-3 h-3"
                checked={taskList.length > 0 && taskList.every(task => selectedTasks.has(task._id))}
                onChange={() => {
                  const allSelected = taskList.every(task => selectedTasks.has(task._id));
                  setSelectedTasks(prev => {
                    const newSet = new Set(prev);
                    taskList.forEach(task => {
                      if (allSelected) {
                        newSet.delete(task._id);
                      } else {
                        newSet.add(task._id);
                      }
                    });
                    return newSet;
                  });
                }}
                title={`Select all ${isCompleted ? 'completed' : 'active'} tasks`}
              />
            </div>
            <div className="flex-1 min-w-0 px-1 sm:px-2">Task</div>
            {visibleColumns.status && <div className="w-20 sm:w-24 px-1 sm:px-2">Status</div>}
            {visibleColumns.priority && <div className="w-16 sm:w-20 px-1 sm:px-2 hidden sm:block">Priority</div>}
            {visibleColumns.assignee && <div className="w-24 sm:w-32 px-1 sm:px-2">Assignee</div>}
            {visibleColumns.dueDate && <div className="w-20 sm:w-24 px-1 sm:px-2">Due</div>}
            {visibleColumns.attachments && <div className="w-8 px-1 sm:px-2 text-center">📎</div>}
            {visibleColumns.category && <div className="w-16 sm:w-20 px-1 sm:px-2 hidden md:block">Category</div>}
            {visibleColumns.estimatedHours && <div className="w-12 sm:w-16 px-1 sm:px-2 hidden lg:block">Hours</div>}
            {visibleColumns.tags && <div className="w-24 sm:w-32 px-1 sm:px-2 hidden lg:block">Tags</div>}
            <div className="w-8 px-1 sm:px-2 text-center">🗑️</div>
          </div>
        </div>

        {/* Task Rows */}
        <div className="divide-y divide-gray-100">
          {taskList.map((task) => renderTaskRow(task, isCompleted))}
        </div>
      </div>
    );
  };

  // Function to render individual task row
  const renderTaskRow = (task, isCompleted = false) => {
    const assigneeInfo = getAssigneeDisplay(task);
    const overdue = isOverdue(task);
    const canUpdate = canUserUpdateTask(task);
    const statusOption = statusOptions.find(s => s.value === task.status);
    const priorityOption = priorityOptions.find(p => p.value === task.priority);
    const categoryOption = categoryOptions.find(c => c.value === task.category);
    
    return (
      <div key={task._id} className={`flex items-center h-12 px-2 sm:px-4 hover:bg-gray-50 group min-w-full ${isCompleted ? 'bg-green-50' : ''}`}>
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
              className={`text-sm cursor-text hover:bg-gray-100 px-1 py-1 -mx-1 rounded truncate ${isCompleted ? 'text-gray-600 line-through' : 'text-gray-900'}`}
            >
              {task.title}
            </div>
          )}
        </div>

        {/* Status */}
        {visibleColumns.status && (
          <div className="w-20 sm:w-24 px-1 sm:px-2">
            {canUpdate && !isCompleted ? (
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
                title={isCompleted ? "Task completed" : "Only assigned users can update status"}
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
              disabled={isCompleted}
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

        {/* Attachments */}
        {visibleColumns.attachments && (
          <div className="w-8 px-1 sm:px-2 text-center">
            {hasAttachments(task) ? (
              <button
                onClick={(e) => handleAttachmentClick(e, task)}
                className="text-sm hover:text-blue-600 transition-colors cursor-pointer"
                title={`${task.attachments.length} attachment${task.attachments.length > 1 ? 's' : ''}`}
              >
                📎
                {task.attachments.length > 1 && (
                  <span className="text-xs text-gray-500 ml-0.5">{task.attachments.length}</span>
                )}
              </button>
            ) : (
              <span className="text-gray-300">-</span>
            )}
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
                disabled={isCompleted}
              />
            ) : (
              <div
                onClick={() => !isCompleted && startEditing(task._id, 'estimatedHours', task.estimatedHours || '')}
                className={`text-xs text-gray-700 px-1 py-1 -mx-1 rounded ${!isCompleted ? 'cursor-text hover:bg-gray-100' : ''}`}
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

        {/* Delete Button */}
        <div className="w-8 px-1 sm:px-2 flex justify-center">
          <button
            onClick={() => deleteTask(task._id)}
            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
            title="Delete task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4" onClick={(e) => {
      // Close attachment popup when clicking outside
      if (showAttachmentPopup && !e.target.closest('.attachment-popup') && !e.target.closest('button[title*="attachment"]')) {
        closeAttachmentPopup();
      }
    }}>
      {/* Controls */}
      <div className="flex flex-col space-y-3">
        {/* Filter Controls */}
        <div className="flex flex-col space-y-3">
          {/* Quick Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-sm font-medium text-gray-700">Quick filters:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setQuickFilter('active')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    activeFilters.length === 2 && activeFilters.includes('todo') && activeFilters.includes('in_progress')
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Active Tasks
                </button>
                <button
                  onClick={() => setQuickFilter('completed')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    activeFilters.length === 1 && activeFilters.includes('completed')
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setQuickFilter('all')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    activeFilters.length === 4
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Tasks
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {tasks.length} tasks shown
            </div>
          </div>

          {/* Column Toggle Controls */}
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
                     key === 'assignee' ? 'Assign' :
                     key === 'attachments' ? 'Files' : key}
                  </span>
                </label>
              ))}
            </div>
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
                <option value="">Batch Status Update</option>
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
                <option value="">Batch Priority Update</option>
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

      {/* Filtered Tasks */}
      {tasks.length > 0 ? (
        <div className="space-y-2">
          {renderTaskTable(tasks, activeFilters.length === 1 && activeFilters.includes('completed'))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m5 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-5 4v6m5-6v6m-5 0V5a2 2 0 012-2h2a2 2 0 012 2v0" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">
            {activeFilters.length === 0 
              ? 'Select a filter to view tasks.' 
              : `No tasks found with status: ${activeFilters.join(', ')}.`
            }
          </p>
        </div>
      )}

      {/* Attachment Popup */}
      {showAttachmentPopup && (
        <div
          className="attachment-popup fixed bg-white border border-gray-200 shadow-lg z-50 max-w-xs w-64"
          style={{
            left: `${attachmentPopupPosition.x - 128}px`, // Center horizontally (w-64 = 256px / 2 = 128px)
            top: `${attachmentPopupPosition.y - 10}px`, // Position above the button
            transform: 'translateY(-100%)'
          }}
        >
          {/* Popup Arrow */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-0.5">
              <div className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-white"></div>
            </div>
          </div>

          {/* Popup Header */}
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Attachments</h3>
            <button
              onClick={closeAttachmentPopup}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ×
            </button>
          </div>

          {/* Attachment List */}
          <div className="max-h-48 overflow-y-auto">
            {(() => {
              const task = tasks.find(t => t._id === showAttachmentPopup);
              if (!task || !hasAttachments(task)) return null;

              return task.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                  onClick={() => downloadAttachment(attachment)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg flex-shrink-0">
                      {getAttachmentIcon(attachment)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate" title={attachment.name || attachment.originalName}>
                        {attachment.name || attachment.originalName}
                      </p>
                      {(attachment.size || attachment.fileSize) && (
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.size || attachment.fileSize)}
                        </p>
                      )}
                      {(attachment.type === 'link' || attachment.fileType === 'link') && (
                        <p className="text-xs text-blue-600 truncate" title={attachment.url}>
                          {attachment.url}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Popup Footer */}
          <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 text-center">
            Click to {(() => {
              const task = tasks.find(t => t._id === showAttachmentPopup);
              if (!task || !hasAttachments(task)) return 'view';
              const hasFiles = task.attachments.some(att => att.type === 'file' || (att.fileType && att.fileType !== 'link'));
              const hasLinks = task.attachments.some(att => att.type === 'link' || att.fileType === 'link');
              if (hasFiles && hasLinks) return 'download/open';
              if (hasFiles) return 'download';
              return 'open';
            })()} attachment
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
