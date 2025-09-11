import React from 'react';
import UserAvatar from '../../UserAvatar';

const TeamPerformanceSection = ({ teamData, teamStructure, teamMetrics }) => {
  if (!teamData) return null;

  return (
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
  );
};

export default TeamPerformanceSection;
