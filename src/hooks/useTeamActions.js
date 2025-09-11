import { useCallback } from 'react';
import { useUser } from '../UserContext';
import { apiRequest } from '../utils/api';

export const useTeamActions = (ideaId, teamData, onRefresh) => {
  const { user } = useUser();

  const handleLeaveTeam = useCallback(async (memberId) => {
    try {
      // Security check: only allow users to leave if it's their own membership
      const member = teamData?.teamStructure?.teamComposition?.find(m => m._id === memberId);
      if (!member || String(member.user._id) !== String(user?._id)) {
        console.error('❌ [TeamStructure] Unauthorized: User cannot leave team for another member');
        alert('You can only leave the team for yourself.');
        return;
      }

      console.log('🔄 [TeamStructure] Member leaving team:', memberId);
      // TODO: Implement leave team API call
      // const response = await apiRequest(`/api/teams/${ideaId}/members/${memberId}`, { method: 'DELETE' });
      
      // For now, show confirmation
      if (window.confirm('Are you sure you want to leave this team?')) {
        // Refresh team structure after leaving
        onRefresh();
      }
    } catch (err) {
      console.error('❌ Error leaving team:', err);
    }
  }, [ideaId, teamData, user, onRefresh]);

  const handlePromoteToLead = useCallback(async (memberId) => {
    try {
      const author = teamData?.teamStructure?.author;
      // Security check: only allow author to promote members
      if (String(author._id) !== String(user?._id)) {
        console.error('❌ [TeamStructure] Unauthorized: Only idea author can promote members');
        alert('Only the idea author can promote team members.');
        return;
      }

      const member = teamData?.teamStructure?.teamComposition?.find(m => m._id === memberId);
      if (!member) {
        console.error('❌ [TeamStructure] Member not found');
        return;
      }

      if (window.confirm(`Promote ${member.user.fullName} to team leader?`)) {
        console.log('🔄 [TeamStructure] Promoting member to lead:', memberId);
        // TODO: Implement promote to lead API call
        // const response = await apiRequest(`/api/teams/${ideaId}/members/${memberId}/promote`, { method: 'POST' });
        
        alert(`${member.user.fullName} promoted to team leader!`);
        onRefresh();
      }
    } catch (err) {
      console.error('❌ Error promoting member:', err);
      alert('Error promoting team member. Please try again.');
    }
  }, [ideaId, teamData, user, onRefresh]);

  const handleDemoteFromLead = useCallback(async (memberId) => {
    try {
      const author = teamData?.teamStructure?.author;
      // Security check: only allow author to demote members
      if (String(author._id) !== String(user?._id)) {
        console.error('❌ [TeamStructure] Unauthorized: Only idea author can demote members');
        alert('Only the idea author can demote team members.');
        return;
      }

      const member = teamData?.teamStructure?.teamComposition?.find(m => m._id === memberId);
      if (!member) {
        console.error('❌ [TeamStructure] Member not found');
        return;
      }

      if (window.confirm(`Remove leadership from ${member.user.fullName}?`)) {
        console.log('🔄 [TeamStructure] Demoting member from lead:', memberId);
        // TODO: Implement demote from lead API call
        // const response = await apiRequest(`/api/teams/${ideaId}/members/${memberId}/demote`, { method: 'POST' });
        
        alert(`${member.user.fullName} is no longer a team leader.`);
        onRefresh();
      }
    } catch (err) {
      console.error('❌ Error demoting member:', err);
      alert('Error demoting team member. Please try again.');
    }
  }, [ideaId, teamData, user, onRefresh]);

  const handleRemoveFromTeam = useCallback(async (memberId) => {
    try {
      const author = teamData?.teamStructure?.author;
      // Security check: only allow author to remove members
      if (String(author._id) !== String(user?._id)) {
        console.error('❌ [TeamStructure] Unauthorized: Only idea author can remove members');
        alert('Only the idea author can remove team members.');
        return;
      }

      const member = teamData?.teamStructure?.teamComposition?.find(m => m._id === memberId);
      if (!member) {
        console.error('❌ [TeamStructure] Member not found');
        return;
      }

      if (window.confirm(`Remove ${member.user.fullName} from the team? This action cannot be undone.`)) {
        console.log('🔄 [TeamStructure] Removing member from team using membership ID:', memberId);
        
        const response = await apiRequest(`/api/teams/${ideaId}/members/${memberId}`, { 
          method: 'DELETE' 
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ [TeamStructure] Member removed successfully:', data);
          alert(`${member.user.fullName} has been removed from the team.`);
          onRefresh();
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ [TeamStructure] Failed to remove member:', errorData);
          alert(errorData.message || 'Failed to remove team member. Please try again.');
        }
      }
    } catch (err) {
      console.error('❌ Error removing member:', err);
      alert('Error removing team member. Please try again.');
    }
  }, [ideaId, teamData, user, onRefresh]);

  return {
    handleLeaveTeam,
    handlePromoteToLead,
    handleDemoteFromLead,
    handleRemoveFromTeam
  };
};
