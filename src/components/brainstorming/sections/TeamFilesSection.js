import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '../../../utils/api';
import UserAvatar from '../../UserAvatar';

// Team Files Component
const TeamFilesSection = ({ ideaId, teamMembers }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'link'
  const [linkInput, setLinkInput] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null });
  const fileInputRef = useRef(null);

  const fetchTeamFiles = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy: sortBy,
        sortOrder: sortOrder === 'desc' ? '-1' : '1'
      });

      if (filterBy && filterBy !== 'all') {
        params.append('category', filterBy);
      }

      if (searchQuery && searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const apiUrl = `/api/team-files/idea/${ideaId}?${params.toString()}`;
      console.log('📁 [TeamFiles] Fetching files with params:', params.toString());
      console.log('📁 [TeamFiles] Full API URL:', apiUrl);
      console.log('📁 [TeamFiles] IdeaId:', ideaId);
      
      // Check authentication before making request
      const tokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
      console.log('📁 [TeamFiles] Token cookie found:', !!tokenCookie);
      if (tokenCookie) {
        const token = tokenCookie.split('=')[1];
        console.log('📁 [TeamFiles] Token preview:', token.substring(0, 20) + '...');
      }

      // Fetch team files using real API endpoint
      let response = await apiRequest(apiUrl);

      // Fallback with Authorization header if needed
      if (!response.ok && response.status === 401) {
        console.log('🔄 [TeamFiles] Cookie auth failed, trying with Authorization header...');
        const tokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          const token = tokenCookie.split('=')[1];
          response = await fetch(`/api/team-files/idea/${ideaId}?${params.toString()}`, {
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
        console.log('📁 [TeamFiles] Full API response:', result);
        console.log('📁 [TeamFiles] Response type:', typeof result);
        console.log('📁 [TeamFiles] Response keys:', Object.keys(result));

        if (result.success) {
          // Handle backend response structure - files are in result.message, not result.data
          console.log('📁 [TeamFiles] result.data:', result.data);
          console.log('📁 [TeamFiles] result.message:', result.message);
          console.log('📁 [TeamFiles] result.message.files:', result.message?.files);
          
          // Backend returns files in result.message.files, not result.data.files
          const files = result.message?.files || result.data?.files || [];
          const pagination = result.message?.pagination || result.data?.pagination || null;

          console.log('📁 [TeamFiles] Extracted files:', files);
          console.log('📁 [TeamFiles] Files array length:', files.length);
          console.log('📁 [TeamFiles] Extracted pagination:', pagination);

          setFiles(files);
          console.log('📁 [TeamFiles] Files state updated with:', files.length, 'files');
          
          // Handle pagination if available
          if (pagination) {
            console.log('📁 [TeamFiles] Pagination details:', pagination);
          }
        } else {
          console.error('📁 [TeamFiles] API returned success: false, message:', result.message);
          throw new Error(result.message || 'Failed to load team files');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // Check for specific backend authorization errors
        if (errorData.message && errorData.message.includes('team.some is not a function')) {
          throw new Error('Team access error: You may not be a member of this team. Please contact the idea author to be added to the team.');
        }
        
        // Check for other common authorization errors
        if (response.status === 403) {
          throw new Error('Access denied: You do not have permission to view team files. Please contact the idea author.');
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to load team files`);
      }
    } catch (err) {
      console.error('❌ [TeamFiles] Error loading files:', err);
      setError(err.message || 'Failed to load team files');
      
      // Fallback to empty array to prevent UI crashes
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [ideaId, sortBy, sortOrder, filterBy, searchQuery]);

  useEffect(() => {
    fetchTeamFiles();
  }, [fetchTeamFiles]);

  // Add useEffect to refetch when search/filter/sort changes
  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      fetchTeamFiles();
    }, 300); // Debounce search

    return () => clearTimeout(delayedFetch);
  }, [searchQuery, filterBy, sortBy, sortOrder, fetchTeamFiles]);

  const handleFileUpload = async (uploadedFiles) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('ideaId', ideaId);

      // Add files to FormData
      Array.from(uploadedFiles).forEach(file => {
        formData.append('file', file);
      });

      console.log('📤 [TeamFiles] Uploading files...');

      // Upload using real API endpoint
      let response = await apiRequest('/api/team-files/upload', {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set Content-Type with boundary
      });

      // Fallback with Authorization header if needed
      if (!response.ok && response.status === 401) {
        const tokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          const token = tokenCookie.split('=')[1];
          response = await fetch('/api/team-files/upload', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
        }
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ [TeamFiles] Files uploaded:', result.data);
          
          // Refresh the files list
          await fetchTeamFiles();
          setShowUploadArea(false);
          
          const uploadedCount = Array.isArray(result.data) ? result.data.length : 1;
          alert(`${uploadedCount} file(s) uploaded successfully!`);
        } else {
          throw new Error(result.message || 'Upload failed');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Upload failed`);
      }
    } catch (err) {
      console.error('❌ [TeamFiles] Upload error:', err);
      alert(`Failed to upload files: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLinkUpload = async () => {
    if (!linkInput.trim()) return;

    // Validate URL
    try {
      new URL(linkInput.trim());
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    setUploading(true);
    try {
      const linkData = {
        ideaId,
        url: linkInput.trim(),
        title: linkInput.trim().split('/').pop() || 'Shared Link',
        category: 'other'
      };

      console.log('📤 [TeamFiles] Uploading link...');

      // Upload using real API endpoint
      let response = await apiRequest('/api/team-files/upload-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkData)
      });

      // Fallback with Authorization header if needed
      if (!response.ok && response.status === 401) {
        const tokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          const token = tokenCookie.split('=')[1];
          response = await fetch('/api/team-files/upload-link', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(linkData)
          });
        }
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ [TeamFiles] Link uploaded:', result.data);
          
          // Refresh the files list
          await fetchTeamFiles();
          setLinkInput('');
          setShowUploadArea(false);
          
          alert('Link added successfully!');
        } else {
          throw new Error(result.message || 'Link upload failed');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Link upload failed`);
      }
    } catch (err) {
      console.error('❌ [TeamFiles] Link upload error:', err);
      alert(`Failed to add link: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // File deletion function
  const handleDeleteFile = (fileId) => {
    setConfirmDialog({
      show: true,
      message: 'Are you sure you want to delete this file?',
      onConfirm: () => performDeleteFile(fileId)
    });
  };

  const performDeleteFile = async (fileId) => {

    try {
      let response = await apiRequest(`/api/team-files/${fileId}`, {
        method: 'DELETE'
      });

      // Fallback with Authorization header if needed
      if (!response.ok && response.status === 401) {
        const tokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          const token = tokenCookie.split('=')[1];
          response = await fetch(`/api/team-files/${fileId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ [TeamFiles] File deleted');
          await fetchTeamFiles(); // Refresh list
        } else {
          throw new Error(result.message || 'Delete failed');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Delete failed');
      }
    } catch (err) {
      console.error('❌ [TeamFiles] Delete error:', err);
      alert(`Failed to delete file: ${err.message}`);
    }
  };

  // Bulk delete function
  const handleBulkDelete = () => {
    if (selectedFiles.length === 0) return;
    setConfirmDialog({
      show: true,
      message: `Are you sure you want to delete ${selectedFiles.length} file(s)?`,
      onConfirm: () => performBulkDelete()
    });
  };

  const performBulkDelete = async () => {

    try {
      let response = await apiRequest('/api/team-files/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: selectedFiles })
      });

      // Fallback with Authorization header if needed
      if (!response.ok && response.status === 401) {
        const tokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          const token = tokenCookie.split('=')[1];
          response = await fetch('/api/team-files/bulk', {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fileIds: selectedFiles })
          });
        }
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ [TeamFiles] Bulk delete completed');
          setSelectedFiles([]);
          await fetchTeamFiles(); // Refresh list
        } else {
          throw new Error(result.message || 'Bulk delete failed');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Bulk delete failed');
      }
    } catch (err) {
      console.error('❌ [TeamFiles] Bulk delete error:', err);
      alert(`Failed to delete files: ${err.message}`);
    }
  };

  // File download function
  const handleDownloadFile = async (fileId, fileName) => {
    try {
      let response = await apiRequest(`/api/team-files/${fileId}/download`);

      // Fallback with Authorization header if needed
      if (!response.ok && response.status === 401) {
        const tokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          const token = tokenCookie.split('=')[1];
          response = await fetch(`/api/team-files/${fileId}/download`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      }

      if (response.ok) {
        // For direct files, this should redirect or return file URL
        // For links, this returns the URL data
        const result = await response.json().catch(() => null);
        
        if (result && result.data && result.data.url) {
          // It's a link file
          window.open(result.data.url, '_blank');
        } else {
          // It's a direct file - the response should be a redirect or blob
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      } else {
        throw new Error('Download failed');
      }
    } catch (err) {
      console.error('❌ [TeamFiles] Download error:', err);
      alert(`Failed to download file: ${err.message}`);
    }
  };

  // Utility functions (keeping the existing ones)
  const getCategoryFromFileType = (fileType) => {
    if (fileType === 'link') return 'links';
    if (fileType && fileType.startsWith('image/')) return 'images';
    if (fileType && fileType.includes('pdf')) return 'documents';
    if (fileType && (fileType.includes('word') || fileType.includes('document'))) return 'documents';
    if (fileType && (fileType.includes('sheet') || fileType.includes('excel'))) return 'data';
    if (fileType && (fileType.includes('presentation') || fileType.includes('powerpoint'))) return 'presentations';
    return 'others';
  };

  const getFileIcon = (fileType, category) => {
    if (fileType === 'link') return '🔗';
    if (category === 'images' || fileType?.includes('image')) return '🖼️';
    if (category === 'documents' || fileType?.includes('pdf')) return '📄';
    if (category === 'data' || fileType?.includes('sheet')) return '📊';
    if (category === 'presentations' || fileType?.includes('presentation')) return '📋';
    if (category === 'design') return '🎨';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return 'Link'; // For links
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Filter and sort files
  console.log('📁 [TeamFiles] Filtering files. Current files state:', files);
  console.log('📁 [TeamFiles] Files state length:', files.length);
  console.log('📁 [TeamFiles] Filter by:', filterBy);
  console.log('📁 [TeamFiles] Search query:', searchQuery);

  const filteredFiles = files.filter(file => {
    if (filterBy !== 'all' && file.category !== filterBy) return false;
    if (searchQuery && !file.originalName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  console.log('📁 [TeamFiles] Filtered files:', filteredFiles);
  console.log('📁 [TeamFiles] Filtered files length:', filteredFiles.length);

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'originalName':
        comparison = (a.originalName || '').localeCompare(b.originalName || '');
        break;
      case 'fileSize':
        comparison = (a.fileSize || 0) - (b.fileSize || 0);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt || a.uploadedAt) - new Date(b.createdAt || b.uploadedAt);
        break;
      case 'uploader':
        comparison = (a.uploader?.fullName || '').localeCompare(b.uploader?.fullName || '');
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-100 rounded-2xl"></div>
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-100 rounded w-32"></div>
            <div className="h-8 bg-gray-100 rounded w-24"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 rounded-2xl shadow-lg p-4 text-red-600">
          <p className="font-medium">Error loading files</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={fetchTeamFiles}
            className="mt-3 text-sm bg-red-100 px-4 py-2 hover:bg-red-200 transition-colors rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Upload Mode Toggle */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Files or Links</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setUploadMode('file')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                uploadMode === 'file'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📁 Files
            </button>
            <button
              onClick={() => setUploadMode('link')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                uploadMode === 'link'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔗 Links
            </button>
          </div>
        </div>

        {/* File Upload Area */}
        {uploadMode === 'file' && (
          <div 
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
              showUploadArea 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setShowUploadArea(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setShowUploadArea(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              setShowUploadArea(false);
              const droppedFiles = e.dataTransfer.files;
              if (droppedFiles.length > 0) {
                handleFileUpload(droppedFiles);
              }
            }}
          >
            <div className="space-y-2">
              <div className="text-3xl">📁</div>
              <div>
                <p className="text-gray-600 mb-2">Drag files here or click to upload</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      handleFileUpload(e.target.files);
                    }
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors text-sm"
                >
                  {uploading ? 'Uploading...' : 'Choose Files'}
                </button>
              </div>
              <p className="text-xs text-gray-500">Supported: Images, Documents, Presentations, etc. (Max 50MB)</p>
            </div>
          </div>
        )}

        {/* Link Upload Area */}
        {uploadMode === 'link' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://example.com/shared-file"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleLinkUpload}
                disabled={uploading || !linkInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors text-sm"
              >
                {uploading ? 'Adding...' : 'Add Link'}
              </button>
            </div>
            <p className="text-xs text-gray-500">Add links to Google Drive, Figma, GitHub, or any other shared resource</p>
          </div>
        )}
      </div>

      {/* Files Header */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Team Files</h3>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {sortedFiles.length} files
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
              <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Files</option>
              <option value="documents">Documents</option>
              <option value="images">Images</option>
              <option value="data">Spreadsheets</option>
              <option value="presentations">Presentations</option>
              <option value="design">Design</option>
              <option value="links">Links</option>
              <option value="others">Others</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedFiles.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedFiles.length} file(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedFiles([])}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Files Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-600 mb-2">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={selectedFiles.length === sortedFiles.length && sortedFiles.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedFiles(sortedFiles.map(f => f._id));
                } else {
                  setSelectedFiles([]);
                }
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-4">
            <button
              onClick={() => {
                if (sortBy === 'originalName') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('originalName');
                  setSortOrder('asc');
                }
              }}
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            >
              File Name
              {sortBy === 'originalName' && (
                <svg className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
          <div className="col-span-2">
            <button
              onClick={() => {
                if (sortBy === 'fileSize') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('fileSize');
                  setSortOrder('desc');
                }
              }}
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            >
              File Size
              {sortBy === 'fileSize' && (
                <svg className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
          <div className="col-span-2">
            <button
              onClick={() => {
                if (sortBy === 'createdAt') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('createdAt');
                  setSortOrder('desc');
                }
              }}
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            >
              Last Modified
              {sortBy === 'createdAt' && (
                <svg className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
          <div className="col-span-2">
            <button
              onClick={() => {
                if (sortBy === 'uploader') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('uploader');
                  setSortOrder('asc');
                }
              }}
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            >
              Uploaded By
              {sortBy === 'uploader' && (
                <svg className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
          <div className="col-span-1">Actions</div>
        </div>

        {/* Files List */}
        <div className="space-y-1">
          {sortedFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-lg font-medium mb-1">No files yet</p>
              <p className="text-sm">Upload files or add links to get started</p>
            </div>
          ) : (
            sortedFiles.map((file) => (
              <div
                key={file._id}
                className={`grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors rounded-lg items-center ${
                  selectedFiles.includes(file._id) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file._id)}
                    onChange={() => toggleFileSelection(file._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <span className="text-xl">
                    {getFileIcon(file.fileType, file.category)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {file.category || getCategoryFromFileType(file.fileType)}
                    </p>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-600">
                    {file.fileSizeFormatted || formatFileSize(file.fileSize)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-600">
                    {formatDate(file.createdAt)}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <UserAvatar
                    fullName={file.uploader?.fullName || 'Unknown'}
                    avatarUrl={file.uploader?.avatar}
                    size={24}
                  />
                  <span className="text-sm text-gray-600 truncate">
                    {file.uploader?.fullName || 'Unknown'}
                  </span>
                </div>
                <div className="col-span-1 flex items-center gap-1">
                  <button
                    onClick={() => handleDownloadFile(file._id, file.originalName)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    title="Download/Open"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file._id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Action</h3>
            <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog({ show: false, message: '', onConfirm: null })}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ show: false, message: '', onConfirm: null });
                }}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamFilesSection;
