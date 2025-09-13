import React, { useState } from 'react';
import { usePerformanceData } from '../../../hooks/usePerformanceData';
import UserAvatar from '../../UserAvatar';

const TeamPerformanceSection = ({ ideaId, teamData, teamStructure, teamMetrics }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, all
  
  // Use the performance data hook
  const { performanceData, loading, error, lastUpdated, refreshData } = usePerformanceData(ideaId);

  if (!teamData) return null;

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Team Performance</h2>
            <p className="text-sm text-gray-500 mt-1">Loading performance analytics...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-900">Performance Data Unavailable</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={refreshData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const perf = performanceData || {};

  return (
    <div className="p-8">
      {/* Performance Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">Team Performance</h2>
          <p className="text-xs lg:text-sm text-gray-500 mt-1 leading-relaxed">
            Real-time insights and analytics • Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs lg:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-2 lg:px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-lg">
              <svg className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="whitespace-nowrap">Author Only</span>
            </div>
            
            <button
              onClick={refreshData}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-50"
              title="Refresh data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="bg-white p-4 lg:p-6 border border-gray-200 rounded-lg min-h-[120px] flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-500 truncate">Team Productivity</p>
              <p className="text-xl lg:text-2xl font-semibold text-gray-900 mt-1 truncate">{perf.overall?.productivity || 0}%</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="mt-auto">
            <span className={`text-xs ${perf.overall?.productivity >= 80 ? 'text-green-600' : 'text-yellow-600'} truncate block`}>
              {perf.overall?.productivity >= 80 ? '↗ Excellent' : '→ Good progress'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 border border-gray-200 rounded-lg min-h-[120px] flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-500 truncate">Avg Response Time</p>
              <p className="text-xl lg:text-2xl font-semibold text-gray-900 mt-1 truncate">{perf.communication?.avgResponseTime || '0h'}</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-auto">
            <p className="text-xs text-blue-600 truncate">→ Communication efficiency</p>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 border border-gray-200 rounded-lg min-h-[120px] flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-500 truncate">Quality Score</p>
              <p className="text-xl lg:text-2xl font-semibold text-gray-900 mt-1 truncate">{perf.overall?.quality || 0}/5</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
          <div className="mt-auto">
            <p className="text-xs text-yellow-600 truncate">→ Work quality average</p>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 border border-gray-200 rounded-lg min-h-[120px] flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-500 truncate">Team Velocity</p>
              <p className="text-xl lg:text-2xl font-semibold text-gray-900 mt-1 truncate">{perf.overall?.velocity || 0}/wk</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-auto">
            <p className="text-xs text-purple-600 truncate">→ Tasks completed per week</p>
          </div>
        </div>
      </div>

      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
        <div className="bg-white p-4 lg:p-6 border border-gray-200 rounded-lg">
          <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-3 lg:mb-4 truncate">Task Performance</h3>
          <div className="space-y-2 lg:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm text-gray-600 truncate">Completed</span>
              <span className="text-xs lg:text-sm font-medium flex-shrink-0 ml-2">{perf.tasks?.completed || 0}/{perf.tasks?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm text-gray-600 truncate">In Progress</span>
              <span className="text-xs lg:text-sm font-medium flex-shrink-0 ml-2">{perf.tasks?.inProgress || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm text-gray-600 truncate">Overdue</span>
              <span className={`text-xs lg:text-sm font-medium flex-shrink-0 ml-2 ${(perf.tasks?.overdue || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {perf.tasks?.overdue || 0}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs lg:text-sm font-medium text-gray-900 truncate">Completion Rate</span>
                <span className="text-xs lg:text-sm font-bold text-gray-900 flex-shrink-0 ml-2">{perf.tasks?.completionRate || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 border border-gray-200 rounded-lg">
          <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-3 lg:mb-4 truncate">Communication</h3>
          <div className="space-y-2 lg:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm text-gray-600 truncate">Total Messages</span>
              <span className="text-xs lg:text-sm font-medium flex-shrink-0 ml-2">{perf.communication?.totalMessages || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm text-gray-600 truncate">Active Members</span>
              <span className="text-xs lg:text-sm font-medium flex-shrink-0 ml-2">{perf.communication?.activeMembers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm text-gray-600 truncate">Avg Response</span>
              <span className="text-xs lg:text-sm font-medium flex-shrink-0 ml-2">{perf.communication?.avgResponseTime || '0h'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 border border-gray-200 rounded-lg">
          <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-3 lg:mb-4 truncate">Collaboration</h3>
          <div className="space-y-2 lg:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm text-gray-600 truncate">Team Posts</span>
              <span className="text-xs lg:text-sm font-medium flex-shrink-0 ml-2">{perf.engagement?.totalPosts || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm text-gray-600 truncate">Files Shared</span>
              <span className="text-xs lg:text-sm font-medium flex-shrink-0 ml-2">{perf.engagement?.totalFiles || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm text-gray-600 truncate">Engagement</span>
              <span className="text-xs lg:text-sm font-medium flex-shrink-0 ml-2">{perf.engagement?.avgEngagement || 0}/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Performance Table */}
      <div className="bg-white border border-gray-200 rounded-lg mb-8">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base lg:text-lg font-medium text-gray-900 truncate">Individual Performance</h3>
              <p className="text-xs lg:text-sm text-gray-500 mt-1 truncate">Detailed metrics for each team member</p>
            </div>
            <button
              onClick={() => setSelectedMember(null)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors flex-shrink-0 ${
                selectedMember ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {selectedMember ? 'Show All' : 'All Members'}
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">Member</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Role</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Overall</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Tasks</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Response</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Quality</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Trend</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(perf.members || []).map((memberPerf, index) => {
                const member = teamStructure.teamComposition[index];
                if (!member) return null;
                
                // Add defensive checks for memberPerf structure
                const safePerf = {
                  overall: memberPerf?.performance?.overall || memberPerf?.overall || { score: 0, grade: 'N/A', trend: 'stable' },
                  tasks: memberPerf?.performance?.tasks || memberPerf?.tasks || { completedTasks: 0, totalTasks: 0, completionRate: 0 },
                  communication: memberPerf?.performance?.communication || memberPerf?.communication || { avgResponseTime: '0h', activityLevel: 'low' },
                  collaboration: memberPerf?.performance?.collaboration || memberPerf?.collaboration || { score: 0 },
                  contribution: memberPerf?.performance?.contribution || memberPerf?.contribution || { score: 0 }
                };
                
                return (
                  <tr 
                    key={member._id} 
                    className={`hover:bg-gray-50 cursor-pointer ${selectedMember === member._id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedMember(selectedMember === member._id ? null : member._id)}
                  >
                    <td className="px-3 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center min-w-0">
                        <UserAvatar 
                          userId={member.user._id}
                          avatarUrl={member.user.avatar}
                          size={28}
                          className="mr-2 lg:mr-3 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs lg:text-sm font-medium text-gray-900 truncate">{member.user.fullName}</div>
                          <div className="text-xs text-gray-500 truncate">{member.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4">
                      <div className="min-w-0">
                        <span className="text-xs lg:text-sm text-gray-900 block truncate">{member.assignedRole}</span>
                        {member.isLead && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">Lead</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center min-w-0">
                        <span className={`text-sm lg:text-lg font-bold mr-1 lg:mr-2 ${
                          safePerf.overall.score >= 4 ? 'text-green-600' : 
                          safePerf.overall.score >= 3 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {safePerf.overall.score}/5
                        </span>
                        <span className={`text-xs px-1.5 lg:px-2 py-1 rounded-full font-medium ${
                          safePerf.overall.grade.startsWith('A') ? 'bg-green-100 text-green-700' :
                          safePerf.overall.grade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                          safePerf.overall.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {safePerf.overall.grade}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4">
                      <div className="text-xs lg:text-sm text-gray-900">{safePerf.tasks.completedTasks}/{safePerf.tasks.totalTasks}</div>
                      <div className="text-xs text-gray-500 truncate">{safePerf.tasks.completionRate}% completion</div>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4">
                      <div className="text-xs lg:text-sm text-gray-900 truncate">{safePerf.communication.avgResponseTime}</div>
                      <div className="text-xs text-gray-500 truncate">{safePerf.communication.activityLevel} activity</div>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-3 h-3 lg:w-4 lg:h-4 ${i < Math.floor(safePerf.overall.score || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center">
                        <span className={`text-xs px-1.5 lg:px-2 py-1 rounded-full truncate ${
                          safePerf.overall.trend === 'up' ? 'bg-green-100 text-green-700' :
                          safePerf.overall.trend === 'down' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {safePerf.overall.trend === 'up' ? '↗ Rising' : 
                           safePerf.overall.trend === 'down' ? '↘ Declining' : '→ Stable'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMember(member._id);
                        }}
                        className="text-xs lg:text-sm text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Member Performance (when selected) */}
      {selectedMember && (
        <div className="bg-white border border-gray-200 rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Detailed Performance: {teamStructure.teamComposition.find(m => m._id === selectedMember)?.user.fullName}
              </h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {(() => {
              const memberIndex = teamStructure.teamComposition.findIndex(m => m._id === selectedMember);
              const memberPerf = perf.members?.[memberIndex];
              
              if (!memberPerf) return <p className="text-gray-500">Performance data not available</p>;
              
              // Add defensive checks for detailed view
              const safeDetailPerf = {
                overall: memberPerf?.performance?.overall || memberPerf?.overall || { score: 0, grade: 'N/A', trend: 'stable' },
                tasks: memberPerf?.performance?.tasks || memberPerf?.tasks || { score: 0 },
                communication: memberPerf?.performance?.communication || memberPerf?.communication || { score: 0 },
                collaboration: memberPerf?.performance?.collaboration || memberPerf?.collaboration || { score: 0 },
                contribution: memberPerf?.performance?.contribution || memberPerf?.contribution || { score: 0 },
                insights: memberPerf?.insights || [],
                recommendations: memberPerf?.recommendations || []
              };
              
              return (
                <div className="grid grid-cols-2 gap-8">
                  {/* Performance Breakdown */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Performance Breakdown</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">Task Performance</span>
                        <div className="flex items-center">
                          <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                            <div 
                              className="h-2 bg-green-500 rounded-full" 
                              style={{ width: `${((safeDetailPerf.tasks.score || 0) / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold">{safeDetailPerf.tasks.score || 0}/5</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">Communication</span>
                        <div className="flex items-center">
                          <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                            <div 
                              className="h-2 bg-blue-500 rounded-full" 
                              style={{ width: `${((safeDetailPerf.communication.score || 0) / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold">{safeDetailPerf.communication.score || 0}/5</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">Collaboration</span>
                        <div className="flex items-center">
                          <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                            <div 
                              className="h-2 bg-purple-500 rounded-full" 
                              style={{ width: `${((safeDetailPerf.collaboration.score || 0) / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold">{safeDetailPerf.collaboration.score || 0}/5</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">Contribution</span>
                        <div className="flex items-center">
                          <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                            <div 
                              className="h-2 bg-orange-500 rounded-full" 
                              style={{ width: `${((safeDetailPerf.contribution.score || 0) / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold">{safeDetailPerf.contribution.score || 0}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Insights & Recommendations */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Insights & Recommendations</h4>
                    
                    {/* Insights */}
                    {safeDetailPerf.insights && safeDetailPerf.insights.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Performance Insights</h5>
                        <div className="space-y-2">
                          {safeDetailPerf.insights.map((insight, idx) => (
                            <div key={idx} className={`p-2 rounded-lg text-sm ${
                              insight.type === 'success' ? 'bg-green-50 text-green-800' :
                              insight.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                              'bg-blue-50 text-blue-800'
                            }`}>
                              {insight.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Recommendations */}
                    {safeDetailPerf.recommendations && safeDetailPerf.recommendations.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h5>
                        <div className="space-y-3">
                          {safeDetailPerf.recommendations.map((rec, idx) => (
                            <div key={idx} className="border-l-4 border-blue-400 pl-3">
                              <p className="text-sm font-medium text-gray-900">{rec.action}</p>
                              <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                              <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                                rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {rec.priority} priority
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Fallback message for no insights/recommendations */}
                    {(!safeDetailPerf.insights || safeDetailPerf.insights.length === 0) && 
                     (!safeDetailPerf.recommendations || safeDetailPerf.recommendations.length === 0) && (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500 italic">
                          Detailed performance insights will appear as team activity increases.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Team Insights & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
          <h4 className="text-base lg:text-lg font-medium text-gray-900 mb-3 lg:mb-4 truncate">Team Insights</h4>
          <div className="space-y-3 lg:space-y-4">
            {(perf.teamInsights || perf.insights || []).map((insight, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  insight.type === 'success' ? 'bg-green-500' :
                  insight.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-900 truncate">{insight.title}</p>
                  <p className="text-xs lg:text-sm text-gray-600 mt-1 leading-relaxed">{insight.message}</p>
                </div>
              </div>
            ))}
            
            {((!perf.teamInsights && !perf.insights) || ((perf.teamInsights || perf.insights || []).length === 0)) && (
              <p className="text-xs lg:text-sm text-gray-500 italic leading-relaxed">
                No specific insights available yet. Performance insights will appear as team activity increases.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
          <h4 className="text-base lg:text-lg font-medium text-gray-900 mb-3 lg:mb-4 truncate">Recommended Actions</h4>
          <div className="space-y-3">
            {(perf.teamRecommendations || perf.recommendations || []).map((rec, idx) => (
              <div key={idx} className={`p-3 border rounded-lg ${
                rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-xs lg:text-sm font-medium truncate ${
                  rec.priority === 'high' ? 'text-red-900' :
                  rec.priority === 'medium' ? 'text-yellow-900' :
                  'text-blue-900'
                }`}>{rec.action}</p>
                <p className={`text-xs lg:text-sm mt-1 leading-relaxed ${
                  rec.priority === 'high' ? 'text-red-700' :
                  rec.priority === 'medium' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>{rec.description}</p>
              </div>
            ))}
            
            {((!perf.teamRecommendations && !perf.recommendations) || ((perf.teamRecommendations || perf.recommendations || []).length === 0)) && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs lg:text-sm font-medium text-green-900">Team is performing well!</p>
                <p className="text-xs lg:text-sm text-green-700 mt-1 leading-relaxed">No immediate actions required. Keep up the great work!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPerformanceSection;
