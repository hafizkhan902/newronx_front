import React, { useState, useRef } from 'react';
import { useUser } from '../../../UserContext';
import UserAvatar from '../../UserAvatar';

const TeamOverviewSection = ({ 
  teamData, 
  permissions,
  memberSubroles,
  activeMenu,
  setActiveMenu,
  showSubroleModal,
  setShowSubroleModal,
  setSubroleStep,
  onLeaveTeam,
  onPromoteToLead,
  onDemoteFromLead,
  onRemoveFromTeam,
  onRemoveRole,
  onShowAddRole
}) => {
  const { user } = useUser();
  const menuRef = useRef(null);
  
  if (!teamData) return null;

  const { teamMetrics, teamStructure, author, ideaTitle } = teamData;

  return (
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
                                  onClick={() => onLeaveTeam(member._id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3v1" />
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
                                    onClick={() => onPromoteToLead(member._id)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                  >
                                    <svg className="w-4 h-4 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Promote to Leader
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => onDemoteFromLead(member._id)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                                  >
                                    <svg className="w-4 h-4 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                    </svg>
                                    Remove Leadership
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => onRemoveFromTeam(member._id)}
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
                                    onClick={() => onLeaveTeam(subrole._id)}
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
              onClick={onShowAddRole}
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
                        onClick={() => onRemoveRole(role._id)}
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
  );
};

export default TeamOverviewSection;
