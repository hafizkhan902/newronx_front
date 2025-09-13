/**
 * Team Performance Calculation Engine
 * Calculates comprehensive team and individual performance metrics
 */

export class PerformanceCalculator {
  
  /**
   * Calculate individual member performance
   * @param {Object} member - Team member data
   * @param {Array} tasks - All tasks for the idea
   * @param {Array} messages - Chat messages
   * @param {Array} posts - Team feed posts
   * @param {Array} files - File contributions
   * @returns {Object} Individual performance metrics
   */
  static calculateMemberPerformance(member, tasks, messages, posts, files) {
    const memberId = member.user._id;
    
    // 1. TASK PERFORMANCE (40% weight)
    const memberTasks = tasks.filter(task => 
      task.assignedUsers?.includes(memberId) || task.assignmentType === 'everyone'
    );
    
    const taskMetrics = this.calculateTaskMetrics(memberTasks, memberId);
    
    // 2. COMMUNICATION PERFORMANCE (25% weight)
    const memberMessages = messages.filter(msg => msg.sender._id === memberId);
    const communicationMetrics = this.calculateCommunicationMetrics(memberMessages, member.assignedAt);
    
    // 3. COLLABORATION PERFORMANCE (20% weight)
    const memberPosts = posts.filter(post => post.author._id === memberId);
    const collaborationMetrics = this.calculateCollaborationMetrics(memberPosts, memberMessages);
    
    // 4. CONTRIBUTION PERFORMANCE (15% weight)
    const memberFiles = files.filter(file => file.uploader._id === memberId);
    const contributionMetrics = this.calculateContributionMetrics(memberFiles, memberPosts);
    
    // WEIGHTED OVERALL SCORE
    const overallScore = (
      taskMetrics.score * 0.40 +
      communicationMetrics.score * 0.25 +
      collaborationMetrics.score * 0.20 +
      contributionMetrics.score * 0.15
    );
    
    return {
      overall: {
        score: Math.round(overallScore * 10) / 10, // Round to 1 decimal
        grade: this.getPerformanceGrade(overallScore),
        trend: this.calculateTrend(member, 'overall')
      },
      tasks: taskMetrics,
      communication: communicationMetrics,
      collaboration: collaborationMetrics,
      contribution: contributionMetrics,
      insights: this.generateInsights(taskMetrics, communicationMetrics, collaborationMetrics, contributionMetrics),
      recommendations: this.generateRecommendations(member, taskMetrics, communicationMetrics)
    };
  }
  
  /**
   * Calculate task-related performance metrics
   */
  static calculateTaskMetrics(memberTasks, memberId) {
    const completedTasks = memberTasks.filter(task => task.status === 'completed');
    const inProgressTasks = memberTasks.filter(task => task.status === 'in_progress');
    const overdueTasks = memberTasks.filter(task => 
      task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'
    );
    
    // Task completion rate
    const completionRate = memberTasks.length > 0 ? (completedTasks.length / memberTasks.length) * 100 : 0;
    
    // Average task completion time
    const completionTimes = completedTasks
      .filter(task => task.completedAt && task.createdAt)
      .map(task => new Date(task.completedAt) - new Date(task.createdAt));
    
    const avgCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
      : 0;
    
    // On-time delivery rate
    const onTimeDeliveries = completedTasks.filter(task => 
      !task.deadline || new Date(task.completedAt) <= new Date(task.deadline)
    );
    const onTimeRate = completedTasks.length > 0 ? (onTimeDeliveries.length / completedTasks.length) * 100 : 100;
    
    // Priority task performance
    const highPriorityTasks = memberTasks.filter(task => task.priority === 'high');
    const highPriorityCompleted = highPriorityTasks.filter(task => task.status === 'completed');
    const priorityPerformance = highPriorityTasks.length > 0 
      ? (highPriorityCompleted.length / highPriorityTasks.length) * 100 
      : 100;
    
    // Calculate overall task score (0-5 scale)
    const taskScore = (
      (completionRate / 100) * 1.5 +        // 30% weight
      (onTimeRate / 100) * 1.5 +            // 30% weight  
      (priorityPerformance / 100) * 1.0 +   // 20% weight
      (overdueTasks.length === 0 ? 1 : 0.5) // 20% weight
    );
    
    return {
      score: Math.min(5, taskScore),
      completionRate: Math.round(completionRate),
      avgCompletionTime: this.formatDuration(avgCompletionTime),
      onTimeRate: Math.round(onTimeRate),
      totalTasks: memberTasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      overdueTasks: overdueTasks.length,
      priorityPerformance: Math.round(priorityPerformance)
    };
  }
  
  /**
   * Calculate communication-related performance metrics
   */
  static calculateCommunicationMetrics(memberMessages, joinDate) {
    const now = new Date();
    const memberSince = new Date(joinDate);
    const daysActive = Math.max(1, (now - memberSince) / (1000 * 60 * 60 * 24));
    
    // Response time calculation (based on message gaps)
    const responseTimes = [];
    for (let i = 1; i < memberMessages.length; i++) {
      const currentMsg = new Date(memberMessages[i].createdAt);
      const prevMsg = new Date(memberMessages[i-1].createdAt);
      const responseTime = currentMsg - prevMsg;
      
      // Only count responses within 24 hours as valid response times
      if (responseTime < 24 * 60 * 60 * 1000) {
        responseTimes.push(responseTime);
      }
    }
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    // Activity level
    const messagesPerDay = memberMessages.length / daysActive;
    const activityLevel = messagesPerDay > 5 ? 'high' : messagesPerDay > 2 ? 'medium' : 'low';
    
    // Communication quality (based on message length and engagement)
    const avgMessageLength = memberMessages.length > 0 
      ? memberMessages.reduce((sum, msg) => sum + msg.content.length, 0) / memberMessages.length 
      : 0;
    
    const qualityScore = Math.min(5, 
      (avgMessageLength > 50 ? 2 : 1) +        // Message depth
      (messagesPerDay > 1 ? 2 : 1) +           // Frequency
      (avgResponseTime < 4 * 60 * 60 * 1000 ? 1 : 0) // Responsiveness
    );
    
    return {
      score: qualityScore,
      avgResponseTime: this.formatDuration(avgResponseTime),
      responseTimeMs: avgResponseTime,
      messagesPerDay: Math.round(messagesPerDay * 10) / 10,
      totalMessages: memberMessages.length,
      activityLevel,
      avgMessageLength: Math.round(avgMessageLength),
      daysActive: Math.round(daysActive)
    };
  }
  
  /**
   * Calculate collaboration performance metrics
   */
  static calculateCollaborationMetrics(memberPosts, memberMessages) {
    // Team feed engagement
    const totalPosts = memberPosts.length;
    const totalLikes = memberPosts.reduce((sum, post) => sum + (post.likeCount || 0), 0);
    const totalComments = memberPosts.reduce((sum, post) => sum + (post.commentCount || 0), 0);
    
    // Engagement rate
    const engagementRate = totalPosts > 0 ? (totalLikes + totalComments) / totalPosts : 0;
    
    // Mention activity (helping others)
    const mentionCount = memberMessages.filter(msg => 
      msg.content.includes('@') && msg.content.match(/@\w+/g)
    ).length;
    
    // Knowledge sharing (posts with attachments/links)
    const knowledgeSharing = memberPosts.filter(post => 
      (post.attachments && post.attachments.length > 0) || 
      (post.links && post.links.length > 0)
    ).length;
    
    const collaborationScore = Math.min(5,
      (engagementRate > 2 ? 1.5 : engagementRate > 1 ? 1 : 0.5) +  // Engagement
      (mentionCount > 5 ? 1.5 : mentionCount > 2 ? 1 : 0.5) +       // Helping others
      (knowledgeSharing > 2 ? 1 : knowledgeSharing > 0 ? 0.5 : 0) + // Knowledge sharing
      (totalPosts > 5 ? 1 : totalPosts > 2 ? 0.5 : 0)               // Activity
    );
    
    return {
      score: collaborationScore,
      totalPosts,
      avgLikesPerPost: totalPosts > 0 ? Math.round((totalLikes / totalPosts) * 10) / 10 : 0,
      avgCommentsPerPost: totalPosts > 0 ? Math.round((totalComments / totalPosts) * 10) / 10 : 0,
      mentionCount,
      knowledgeSharing,
      engagementRate: Math.round(engagementRate * 10) / 10
    };
  }
  
  /**
   * Calculate contribution performance metrics  
   */
  static calculateContributionMetrics(memberFiles, memberPosts) {
    // File contributions
    const totalFiles = memberFiles.length;
    const totalFileDownloads = memberFiles.reduce((sum, file) => sum + (file.downloadCount || 0), 0);
    
    // File quality (based on downloads and file types)
    const documentFiles = memberFiles.filter(file => file.category === 'document').length;
    const codeFiles = memberFiles.filter(file => file.category === 'code').length;
    const designFiles = memberFiles.filter(file => file.category === 'design').length;
    
    // Diversity of contributions
    const contributionTypes = new Set();
    if (documentFiles > 0) contributionTypes.add('documentation');
    if (codeFiles > 0) contributionTypes.add('code');
    if (designFiles > 0) contributionTypes.add('design');
    if (memberPosts.length > 0) contributionTypes.add('communication');
    
    const diversityScore = contributionTypes.size;
    
    // Calculate contribution score
    const contributionScore = Math.min(5,
      (totalFiles > 5 ? 1.5 : totalFiles > 2 ? 1 : totalFiles > 0 ? 0.5 : 0) +  // File quantity
      (totalFileDownloads > 10 ? 1 : totalFileDownloads > 3 ? 0.5 : 0) +        // File usage
      (diversityScore > 2 ? 1.5 : diversityScore > 1 ? 1 : 0.5) +               // Diversity
      (memberPosts.length > 3 ? 1 : memberPosts.length > 1 ? 0.5 : 0)           // Communication
    );
    
    return {
      score: contributionScore,
      totalFiles,
      totalDownloads: totalFileDownloads,
      avgDownloadsPerFile: totalFiles > 0 ? Math.round((totalFileDownloads / totalFiles) * 10) / 10 : 0,
      documentFiles,
      codeFiles,
      designFiles,
      diversityScore,
      contributionTypes: Array.from(contributionTypes)
    };
  }
  
  /**
   * Calculate overall team performance
   */
  static calculateTeamPerformance(teamMembers, tasks, messages, posts, files) {
    // Calculate individual performances
    const memberPerformances = teamMembers.map(member => 
      this.calculateMemberPerformance(member, tasks, messages, posts, files)
    );
    
    // Team-level metrics
    const teamTaskCompletion = tasks.length > 0 
      ? (tasks.filter(task => task.status === 'completed').length / tasks.length) * 100 
      : 0;
    
    const teamResponseTime = memberPerformances.reduce((sum, perf) => 
      sum + perf.communication.responseTimeMs, 0
    ) / memberPerformances.length;
    
    const teamQuality = memberPerformances.reduce((sum, perf) => 
      sum + perf.overall.score, 0
    ) / memberPerformances.length;
    
    const teamCollaboration = memberPerformances.reduce((sum, perf) => 
      sum + perf.collaboration.score, 0
    ) / memberPerformances.length;
    
    // Team productivity calculation
    const teamProductivity = (
      (teamTaskCompletion / 100) * 0.40 +           // Task completion rate
      (teamQuality / 5) * 0.30 +                   // Average quality
      (teamCollaboration / 5) * 0.20 +             // Collaboration level
      (this.calculateTeamVelocity(tasks) / 5) * 0.10 // Team velocity
    ) * 100;
    
    return {
      overall: {
        productivity: Math.round(teamProductivity),
        quality: Math.round(teamQuality * 10) / 10,
        collaboration: Math.round(teamCollaboration * 10) / 10,
        velocity: this.calculateTeamVelocity(tasks)
      },
      tasks: {
        total: tasks.length,
        completed: tasks.filter(task => task.status === 'completed').length,
        inProgress: tasks.filter(task => task.status === 'in_progress').length,
        overdue: tasks.filter(task => 
          task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'
        ).length,
        completionRate: Math.round(teamTaskCompletion)
      },
      communication: {
        avgResponseTime: this.formatDuration(teamResponseTime),
        totalMessages: messages.length,
        activeMembers: memberPerformances.filter(perf => perf.communication.activityLevel !== 'low').length
      },
      engagement: {
        totalPosts: posts.length,
        totalFiles: files.length,
        avgEngagement: Math.round(
          memberPerformances.reduce((sum, perf) => sum + perf.collaboration.engagementRate, 0) / 
          memberPerformances.length * 10
        ) / 10
      },
      members: memberPerformances,
      insights: this.generateTeamInsights(memberPerformances, tasks, messages),
      recommendations: this.generateTeamRecommendations(memberPerformances)
    };
  }
  
  /**
   * Calculate team velocity (tasks completed per week)
   */
  static calculateTeamVelocity(tasks) {
    const completedTasks = tasks.filter(task => task.status === 'completed' && task.completedAt);
    
    if (completedTasks.length === 0) return 0;
    
    // Get the time span of completed tasks
    const completionDates = completedTasks.map(task => new Date(task.completedAt));
    const earliestCompletion = Math.min(...completionDates);
    const latestCompletion = Math.max(...completionDates);
    
    const timeSpanWeeks = Math.max(1, (latestCompletion - earliestCompletion) / (1000 * 60 * 60 * 24 * 7));
    
    return Math.round((completedTasks.length / timeSpanWeeks) * 10) / 10;
  }
  
  /**
   * Generate performance insights for individuals
   */
  static generateInsights(taskMetrics, communicationMetrics, collaborationMetrics, contributionMetrics) {
    const insights = [];
    
    // Task insights
    if (taskMetrics.completionRate > 90) {
      insights.push({ type: 'success', message: 'Excellent task completion rate' });
    } else if (taskMetrics.completionRate < 60) {
      insights.push({ type: 'warning', message: 'Task completion rate needs improvement' });
    }
    
    if (taskMetrics.onTimeRate > 85) {
      insights.push({ type: 'success', message: 'Consistently meets deadlines' });
    } else if (taskMetrics.onTimeRate < 70) {
      insights.push({ type: 'warning', message: 'Frequent deadline misses' });
    }
    
    // Communication insights
    if (communicationMetrics.activityLevel === 'high') {
      insights.push({ type: 'success', message: 'Highly engaged in team communication' });
    } else if (communicationMetrics.activityLevel === 'low') {
      insights.push({ type: 'info', message: 'Could benefit from more active communication' });
    }
    
    if (communicationMetrics.responseTimeMs < 2 * 60 * 60 * 1000) { // Less than 2 hours
      insights.push({ type: 'success', message: 'Very responsive team member' });
    }
    
    // Collaboration insights
    if (collaborationMetrics.knowledgeSharing > 3) {
      insights.push({ type: 'success', message: 'Excellent knowledge sharing' });
    }
    
    if (collaborationMetrics.mentionCount > 5) {
      insights.push({ type: 'success', message: 'Actively helps team members' });
    }
    
    return insights;
  }
  
  /**
   * Generate recommendations for improvement
   */
  static generateRecommendations(member, taskMetrics, communicationMetrics) {
    const recommendations = [];
    
    if (taskMetrics.completionRate < 80) {
      recommendations.push({
        priority: 'high',
        action: 'Improve Task Management',
        description: 'Consider breaking down large tasks into smaller, manageable pieces'
      });
    }
    
    if (taskMetrics.onTimeRate < 75) {
      recommendations.push({
        priority: 'high',
        action: 'Better Deadline Planning',
        description: 'Review time estimation and add buffer time for unexpected challenges'
      });
    }
    
    if (communicationMetrics.activityLevel === 'low') {
      recommendations.push({
        priority: 'medium',
        action: 'Increase Team Engagement',
        description: 'Participate more actively in team discussions and updates'
      });
    }
    
    if (communicationMetrics.responseTimeMs > 8 * 60 * 60 * 1000) { // More than 8 hours
      recommendations.push({
        priority: 'medium',
        action: 'Improve Response Time',
        description: 'Try to respond to team messages within 4-6 hours during work days'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate team-level insights
   */
  static generateTeamInsights(memberPerformances, tasks, messages) {
    const insights = [];
    
    // Team performance distribution
    const highPerformers = memberPerformances.filter(perf => perf.overall.score >= 4).length;
    const lowPerformers = memberPerformances.filter(perf => perf.overall.score < 3).length;
    
    if (highPerformers > memberPerformances.length * 0.7) {
      insights.push({
        type: 'success',
        title: 'Strong Team Performance',
        message: `${highPerformers} out of ${memberPerformances.length} members are high performers`
      });
    }
    
    if (lowPerformers > memberPerformances.length * 0.3) {
      insights.push({
        type: 'warning',
        title: 'Performance Concerns',
        message: `${lowPerformers} members may need additional support or training`
      });
    }
    
    // Communication patterns
    const avgResponseTime = memberPerformances.reduce((sum, perf) => 
      sum + perf.communication.responseTimeMs, 0
    ) / memberPerformances.length;
    
    if (avgResponseTime < 4 * 60 * 60 * 1000) { // Less than 4 hours
      insights.push({
        type: 'success',
        title: 'Excellent Communication',
        message: 'Team maintains fast response times and active communication'
      });
    }
    
    return insights;
  }
  
  /**
   * Generate team recommendations
   */
  static generateTeamRecommendations(memberPerformances) {
    const recommendations = [];
    
    // Identify mentoring opportunities
    const highPerformers = memberPerformances.filter(perf => perf.overall.score >= 4);
    const strugglingMembers = memberPerformances.filter(perf => perf.overall.score < 3);
    
    if (highPerformers.length > 0 && strugglingMembers.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Implement Mentoring Program',
        description: `Pair ${strugglingMembers.length} struggling members with ${highPerformers.length} high performers`
      });
    }
    
    // Communication improvements
    const lowCommunicators = memberPerformances.filter(perf => 
      perf.communication.activityLevel === 'low'
    ).length;
    
    if (lowCommunicators > memberPerformances.length * 0.4) {
      recommendations.push({
        priority: 'medium',
        action: 'Improve Team Communication',
        description: 'Schedule regular check-ins and encourage more active participation'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Get performance grade based on score
   */
  static getPerformanceGrade(score) {
    if (score >= 4.5) return 'A+';
    if (score >= 4.0) return 'A';
    if (score >= 3.5) return 'B+';
    if (score >= 3.0) return 'B';
    if (score >= 2.5) return 'C+';
    if (score >= 2.0) return 'C';
    return 'D';
  }
  
  /**
   * Calculate performance trend (mock for now)
   */
  static calculateTrend(member, metricType) {
    // This would compare current performance with historical data
    // For now, return a mock trend
    const hash = member._id.slice(-2);
    const trendValue = parseInt(hash, 16) % 3;
    
    return trendValue === 0 ? 'up' : trendValue === 1 ? 'down' : 'stable';
  }
  
  /**
   * Format duration in human-readable format
   */
  static formatDuration(milliseconds) {
    if (!milliseconds || milliseconds === 0) return '0h';
    
    const hours = milliseconds / (1000 * 60 * 60);
    
    if (hours < 1) {
      const minutes = Math.round(milliseconds / (1000 * 60));
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${Math.round(hours * 10) / 10}h`;
    } else {
      const days = Math.round(hours / 24 * 10) / 10;
      return `${days}d`;
    }
  }
}

/**
 * Performance data aggregation service
 */
export class PerformanceAggregator {
  
  /**
   * Aggregate all performance data for a team
   */
  static async aggregateTeamData(ideaId) {
    try {
      // This would fetch all necessary data from various endpoints
      const [tasks, messages, posts, files, teamStructure] = await Promise.all([
        this.fetchTasks(ideaId),
        this.fetchMessages(ideaId), 
        this.fetchPosts(ideaId),
        this.fetchFiles(ideaId),
        this.fetchTeamStructure(ideaId)
      ]);
      
      return PerformanceCalculator.calculateTeamPerformance(
        teamStructure.teamComposition,
        tasks,
        messages,
        posts,
        files
      );
      
    } catch (error) {
      console.error('Error aggregating team performance data:', error);
      throw error;
    }
  }
  
  static async fetchTasks(ideaId) {
    const response = await fetch(`/api/tasks/idea/${ideaId}`, {
      credentials: 'include'
    });
    const data = await response.json();
    return data.data?.tasks || [];
  }
  
  static async fetchMessages(ideaId) {
    // This would need a new endpoint to get all chat messages for the team
    const response = await fetch(`/api/teams/${ideaId}/messages`, {
      credentials: 'include'
    });
    const data = await response.json();
    return data.data?.messages || [];
  }
  
  static async fetchPosts(ideaId) {
    const response = await fetch(`/api/team-posts/idea/${ideaId}?limit=1000`, {
      credentials: 'include'
    });
    const data = await response.json();
    return data.message?.posts || [];
  }
  
  static async fetchFiles(ideaId) {
    const response = await fetch(`/api/team-files/idea/${ideaId}?limit=1000`, {
      credentials: 'include'
    });
    const data = await response.json();
    return data.message?.files || [];
  }
  
  static async fetchTeamStructure(ideaId) {
    const response = await fetch(`/api/teams/${ideaId}/structure`, {
      credentials: 'include'
    });
    const data = await response.json();
    return data.data || data;
  }
}
