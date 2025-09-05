import React, { useState } from 'react';
import UserAvatar from '../../UserAvatar';

const ConflictResolutionModal = ({ 
  conflictData, 
  approach, 
  onResolve, 
  onCancel 
}) => {
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [customRole, setCustomRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResolve = async () => {
    if (!selectedResolution) return;

    setLoading(true);
    let resolution;

    switch (selectedResolution.action) {
      case 'subrole':
        resolution = {
          action: 'subrole',
          suggestedRole: customRole || selectedResolution.suggestedRole,
          isLead: false
        };
        break;
      case 'replace':
        resolution = {
          action: 'replace',
          currentMember: selectedResolution.currentMember
        };
        break;
      case 'expand':
        resolution = {
          action: 'expand'
        };
        break;
      default:
        resolution = selectedResolution;
    }

    try {
      await onResolve(resolution);
    } catch (error) {
      console.error('Resolution failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResolutionIcon = (type) => {
    switch (type) {
      case 'create_subrole': return '🎯';
      case 'replace_existing': return '🔄';
      case 'increase_capacity': return '📈';
      default: return '⚡';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              ⚠️ Role Conflict Detected
            </h2>
            <p className="text-sm text-gray-600 mt-1">This role is already filled. Choose how to proceed.</p>
          </div>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conflict Details */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-red-900 mb-2">Conflict Summary</h3>
          <p className="text-red-800 text-sm mb-3">{conflictData.message}</p>
          
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Current {approach.role}:</h4>
            <div className="flex items-center space-x-3">
              <UserAvatar
                userId={conflictData.existingMember.user._id}
                avatarUrl={conflictData.existingMember.user.avatar}
                size={40}
                isMentor={conflictData.existingMember.user.isMentor}
                isInvestor={conflictData.existingMember.user.isInvestor}
              />
              <div>
                <div className="font-medium text-gray-900">{conflictData.existingMember.user.fullName}</div>
                <div className="text-sm text-gray-600">{conflictData.existingMember.assignedRole}</div>
              </div>
            </div>
          </div>
        </div>

        {/* New Applicant */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">New Applicant</h3>
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-center space-x-3 mb-3">
              <UserAvatar
                userId={approach.user._id}
                avatarUrl={approach.user.avatar}
                size={40}
                isMentor={approach.user.isMentor}
                isInvestor={approach.user.isInvestor}
              />
              <div>
                <div className="font-medium text-gray-900">{approach.user.fullName}</div>
                <div className="text-sm text-blue-600">Applying for: {approach.role}</div>
              </div>
            </div>
            <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
              <strong>Application:</strong> {approach.description}
            </div>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Choose Resolution:</h3>
          <div className="space-y-3">
            {conflictData.resolutionOptions.map((option) => (
              <div 
                key={option.type}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedResolution?.type === option.type 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedResolution(option)}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getResolutionIcon(option.type)}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{option.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    
                    {/* Additional info for each option type */}
                    {option.type === 'replace_existing' && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                        <strong>Note:</strong> The current member will be notified and removed from the team.
                      </div>
                    )}
                    
                    {option.type === 'increase_capacity' && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-800">
                        <strong>Result:</strong> Team will have multiple people in this role.
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedResolution?.type === option.type 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedResolution?.type === option.type && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Role Input for Subrole Option */}
        {selectedResolution?.action === 'subrole' && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Customize Role Name</h4>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Role Title
              </label>
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder={selectedResolution.suggestedRole || `Senior ${approach.role}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use suggested name: "{selectedResolution.suggestedRole}"
              </p>
            </div>
            
            {/* Role Suggestions */}
            {conflictData.suggestions?.subroles && conflictData.suggestions.subroles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Suggestions:
                </label>
                <div className="flex flex-wrap gap-2">
                  {conflictData.suggestions.subroles.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCustomRole(suggestion.name)}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {suggestion.name}
                      <span className="ml-1 text-xs text-gray-500">({suggestion.skillLevel})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Alternative Suggestions */}
            {conflictData.suggestions?.alternatives && conflictData.suggestions.alternatives.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alternative Roles:
                </label>
                <div className="flex flex-wrap gap-2">
                  {conflictData.suggestions.alternatives.map((alt, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCustomRole(alt)}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleResolve} 
            disabled={!selectedResolution || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resolving...
              </>
            ) : (
              'Resolve Conflict'
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="text-blue-500 mt-0.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm text-blue-800">
              <strong>Tip:</strong> Creating specialized roles (like "Senior Developer" or "Lead Designer") 
              helps build a stronger team hierarchy and allows both talented individuals to contribute.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionModal;
