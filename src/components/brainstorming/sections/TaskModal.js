import React, { useState } from 'react';
import { apiRequest } from '../../../utils/api';
import UserAvatar from '../../UserAvatar';

const TaskModal = ({ isOpen, onClose, ideaId, teamMembers, onTaskAdded }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: '',
    tags: [],
    category: 'general'
  });
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Attachment states
  const [attachments, setAttachments] = useState([]);
  const [attachmentType, setAttachmentType] = useState('file'); // 'file' or 'link'
  const [linkInput, setLinkInput] = useState('');

  const priorityOptions = [
    { 
      value: 'low', 
      label: 'Low Priority', 
      color: 'bg-green-100 text-green-800 border-green-200',
      badgeColor: 'bg-green-500'
    },
    { 
      value: 'medium', 
      label: 'Medium Priority', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      badgeColor: 'bg-yellow-500'
    },
    { 
      value: 'high', 
      label: 'High Priority', 
      color: 'bg-red-100 text-red-800 border-red-200',
      badgeColor: 'bg-red-500'
    },
    { 
      value: 'urgent', 
      label: 'Urgent', 
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      badgeColor: 'bg-purple-500'
    }
  ];

  const categoryOptions = [
    { value: 'development', label: '💻 Development', icon: '💻' },
    { value: 'design', label: '🎨 Design', icon: '🎨' },
    { value: 'marketing', label: '📢 Marketing', icon: '📢' },
    { value: 'research', label: '🔍 Research', icon: '🔍' },
    { value: 'planning', label: '📋 Planning', icon: '📋' },
    { value: 'testing', label: '🧪 Testing', icon: '🧪' },
    { value: 'general', label: '📝 General', icon: '📝' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!taskData.title.trim()) {
      newErrors.title = 'Task title is required';
    }
    
    if (!taskData.assignedTo) {
      newErrors.assignedTo = 'Please assign this task to a team member';
    }
    
    if (taskData.estimatedHours && (isNaN(taskData.estimatedHours) || taskData.estimatedHours <= 0)) {
      newErrors.estimatedHours = 'Estimated hours must be a positive number';
    }
    
    if (taskData.dueDate && new Date(taskData.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      // Prepare FormData for multipart/form-data request as expected by backend
      const formData = new FormData();
      
      // Basic task fields
      formData.append('ideaId', ideaId);
      formData.append('title', taskData.title.trim());
      if (taskData.description.trim()) {
        formData.append('description', taskData.description.trim());
      }
      formData.append('priority', taskData.priority);
      formData.append('category', taskData.category);
      if (taskData.estimatedHours) {
        formData.append('estimatedHours', parseFloat(taskData.estimatedHours).toString());
      }
      if (taskData.dueDate) {
        formData.append('deadline', new Date(taskData.dueDate).toISOString());
      }
      
      // Assignment
      formData.append('assignmentType', taskData.assignedTo === 'everyone' ? 'everyone' : 'specific');
      if (taskData.assignedTo !== 'everyone') {
        console.log('🔍 [TaskModal] Assigning to user:', taskData.assignedTo);
        console.log('🔍 [TaskModal] Available team members:', teamMembers.map(m => ({ id: m.user._id, name: m.user.fullName })));
        
        // Validate user ID
        if (!taskData.assignedTo || taskData.assignedTo.trim() === '') {
          throw new Error('Invalid user ID: User ID is empty');
        }
        
        // Check if selected user is in team members
        const selectedMember = teamMembers.find(m => m.user._id === taskData.assignedTo);
        if (!selectedMember) {
          throw new Error(`Selected user (${taskData.assignedTo}) is not in the team members list`);
        }
        
        console.log('🔍 [TaskModal] Selected member:', selectedMember.user.fullName);
        formData.append('assignedUsers', JSON.stringify([taskData.assignedTo]));
      }
      
      // Tags (as comma-separated string as shown in curl example)
      if (taskData.tags.length > 0) {
        formData.append('tags', taskData.tags.join(','));
      }
      
      // Handle attachments
      const links = [];
      attachments.forEach((attachment) => {
        if (attachment.type === 'file') {
          // Add file attachments
          formData.append('attachments', attachment.file);
        } else if (attachment.type === 'link') {
          // Collect links
          links.push(attachment.url);
        }
      });
      
      // Add links array if any
      if (links.length > 0) {
        formData.append('links', JSON.stringify(links));
      }

      console.log('🔄 Creating task with FormData...');
      console.log('🔍 [TaskModal] FormData contents:');
      for (let pair of formData.entries()) {
        console.log(`  ${pair[0]}: ${pair[1]}`);
      }

      const response = await apiRequest('/api/tasks', {
        method: 'POST',
        body: formData,
        // Remove Content-Type header to let browser set it with boundary for multipart
        headers: {}
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Task created successfully:', result);
        
        // Extract task from nested response structure
        const newTask = result.data?.task || result.task || result;
        onTaskAdded(newTask);
        onClose();
        
        // Reset form
        setTaskData({
          title: '',
          description: '',
          assignedTo: '',
          priority: 'medium',
          dueDate: '',
          estimatedHours: '',
          tags: [],
          category: 'general'
        });
        setTagInput('');
        
        // Clean up attachments
        attachments.forEach(att => {
          if (att.type === 'file' && att.url) {
            URL.revokeObjectURL(att.url);
          }
        });
        setAttachments([]);
        setLinkInput('');
        
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to create task`);
      }
    } catch (err) {
      console.error('❌ Error creating task:', err);
      setErrors({ submit: err.message || 'Failed to create task' });
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !taskData.tags.includes(tagInput.trim())) {
      setTaskData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTaskData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      // Validate file type (PDF, images)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          attachment: `File type ${file.type} not supported. Please use PDF or image files.`
        }));
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          attachment: 'File size must be less than 10MB'
        }));
        return;
      }

      // Add file to attachments
      const newAttachment = {
        id: Date.now() + Math.random(),
        type: 'file',
        name: file.name,
        size: file.size,
        file: file,
        url: URL.createObjectURL(file)
      };

      setAttachments(prev => [...prev, newAttachment]);
      setErrors(prev => ({ ...prev, attachment: null }));
    });

    // Reset file input
    e.target.value = '';
  };

  const addLink = () => {
    if (!linkInput.trim()) return;

    // Basic URL validation
    try {
      new URL(linkInput.trim());
    } catch {
      setErrors(prev => ({
        ...prev,
        attachment: 'Please enter a valid URL (e.g., https://example.com)'
      }));
      return;
    }

    const newAttachment = {
      id: Date.now() + Math.random(),
      type: 'link',
      name: linkInput.trim(),
      url: linkInput.trim()
    };

    setAttachments(prev => [...prev, newAttachment]);
    setLinkInput('');
    setErrors(prev => ({ ...prev, attachment: null }));
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

  const getFileIcon = (fileName) => {
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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">New Task</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Task Title */}
          <div>
            <input
              type="text"
              value={taskData.title}
              onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border ${errors.title ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:border-gray-900 text-sm`}
              placeholder="Task title *"
            />
            {errors.title && <p className="text-red-600 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <textarea
              value={taskData.description}
              onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-gray-900 text-sm resize-none"
              placeholder="Description (optional)"
            />
          </div>

          {/* Quick Options Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Priority */}
            <div>
              <select
                value={taskData.priority}
                onChange={(e) => setTaskData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-gray-900 text-sm"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <select
                value={taskData.category}
                onChange={(e) => setTaskData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-gray-900 text-sm"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Hours */}
            <div>
              <input
                type="number"
                value={taskData.estimatedHours}
                onChange={(e) => setTaskData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-gray-900 text-sm"
                placeholder="Hours"
                min="0.5"
                step="0.5"
              />
            </div>
          </div>

          {/* Assign To */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Assign to *
            </label>
            <select
              value={taskData.assignedTo}
              onChange={(e) => setTaskData(prev => ({ ...prev, assignedTo: e.target.value }))}
              className={`w-full px-3 py-2 border ${errors.assignedTo ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:border-gray-900 text-sm`}
            >
              <option value="">Select assignment</option>
              <option value="everyone">👥 Everyone (All team members)</option>
              <optgroup label="Specific Team Members">
                {teamMembers.map((member) => (
                  <option key={member.user._id} value={member.user._id}>
                    {member.user.fullName} ({member.assignedRole})
                  </option>
                ))}
              </optgroup>
            </select>
            {errors.assignedTo && <p className="text-red-600 text-xs mt-1">{errors.assignedTo}</p>}
          </div>

          {/* Due Date */}
          <div>
            <input
              type="datetime-local"
              value={taskData.dueDate}
              onChange={(e) => setTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-gray-900 text-sm"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Tags */}
          <div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-gray-900 text-sm"
              placeholder="Tags (press Enter to add)"
            />
            
            {taskData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {taskData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Attachments
            </label>
            
            {/* Attachment Type Toggle */}
            <div className="flex mb-2">
              <button
                type="button"
                onClick={() => setAttachmentType('file')}
                className={`px-3 py-1 text-xs border-l border-t border-b ${
                  attachmentType === 'file' 
                    ? 'bg-gray-900 text-white border-gray-900' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                📎 File
              </button>
              <button
                type="button"
                onClick={() => setAttachmentType('link')}
                className={`px-3 py-1 text-xs border ${
                  attachmentType === 'link' 
                    ? 'bg-gray-900 text-white border-gray-900' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                🔗 Link
              </button>
            </div>

            {/* File Upload */}
            {attachmentType === 'file' && (
              <div>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                  multiple
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-gray-900 text-sm file:mr-4 file:py-1 file:px-2 file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, PNG, GIF, WebP files up to 10MB
                </p>
              </div>
            )}

            {/* Link Input */}
            {attachmentType === 'link' && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                  className="flex-1 px-3 py-2 border border-gray-200 focus:outline-none focus:border-gray-900 text-sm"
                  placeholder="https://example.com"
                />
                <button
                  type="button"
                  onClick={addLink}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
            )}

            {/* Attachment Error */}
            {errors.attachment && (
              <p className="text-red-600 text-xs mt-1">{errors.attachment}</p>
            )}

            {/* Attachment List */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 text-sm"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="text-lg">
                        {attachment.type === 'link' ? '🔗' : getFileIcon(attachment.name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-gray-900">{attachment.name}</p>
                        {attachment.type === 'file' && attachment.size && (
                          <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400"
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
