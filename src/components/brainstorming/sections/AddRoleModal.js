import React, { useState } from 'react';
import { apiRequest } from '../../../utils/api';

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

export default AddRoleModal;
