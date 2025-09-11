import { useState, useCallback } from 'react';
import { apiRequest } from '../utils/api';

export const useTeamStructure = (ideaId) => {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memberSubroles, setMemberSubroles] = useState({});

  // Fetch subroles for all team members
  const fetchAllSubroles = useCallback(async (teamComposition) => {
    try {
      const subrolePromises = teamComposition.map(async (member) => {
        try {
          const response = await apiRequest(`/api/teams/${ideaId}/members/${member._id}/subroles`);
          if (response.ok) {
            const data = await response.json();
            return {
              memberId: member._id,
              subroles: data.data?.subroles || []
            };
          }
        } catch (err) {
          console.warn(`Failed to fetch subroles for member ${member._id}:`, err);
        }
        return {
          memberId: member._id,
          subroles: []
        };
      });

      const results = await Promise.all(subrolePromises);
      const subrolesMap = {};
      results.forEach(({ memberId, subroles }) => {
        subrolesMap[memberId] = subroles;
      });
      
      console.log('✅ [TeamStructure] Subroles loaded:', subrolesMap);
      setMemberSubroles(subrolesMap);
    } catch (err) {
      console.error('❌ Error fetching subroles:', err);
    }
  }, [ideaId]);

  const syncIdeaRoles = useCallback(async (currentTeamData) => {
    try {
      console.log('🔄 [TeamStructure] Fetching idea data to sync roles...');
      
      // Fetch the idea data to get neededRoles
      const ideaResponse = await apiRequest(`/api/ideas/${ideaId}`);
      
      if (ideaResponse.ok) {
        const ideaData = await ideaResponse.json();
        console.log('📦 [TeamStructure] Idea data received:', ideaData);
        
        const neededRoles = ideaData.data?.neededRoles || ideaData.neededRoles || [];
        console.log('🎯 [TeamStructure] Needed roles from idea:', neededRoles);
        
        if (neededRoles.length > 0) {
          // Add roles that don't exist in team structure
          const existingRoles = currentTeamData.teamStructure?.rolesNeeded || [];
          const existingRoleNames = existingRoles.map(role => role.role?.toLowerCase());
          
          let rolesAdded = false;
          for (const neededRole of neededRoles) {
            if (!existingRoleNames.includes(neededRole.toLowerCase())) {
              console.log('➕ [TeamStructure] Adding missing role:', neededRole);
              
              try {
                const addRoleResponse = await apiRequest(`/api/teams/${ideaId}/roles`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role: neededRole })
                });
                
                if (addRoleResponse.ok) {
                  console.log('✅ [TeamStructure] Role added successfully:', neededRole);
                  rolesAdded = true;
                } else {
                  console.error('❌ [TeamStructure] Failed to add role:', neededRole);
                }
              } catch (roleErr) {
                console.error('❌ [TeamStructure] Error adding role:', neededRole, roleErr);
              }
            }
          }
          
          return rolesAdded;
        } else {
          console.log('ℹ️ [TeamStructure] No neededRoles found in idea');
        }
      } else {
        console.warn('⚠️ [TeamStructure] Failed to fetch idea data for role sync');
      }
    } catch (err) {
      console.error('❌ [TeamStructure] Error syncing idea roles:', err);
    }
    return false;
  }, [ideaId]);

  const fetchTeamStructure = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 [TeamStructure] Fetching team structure for idea:', ideaId);
      const response = await apiRequest(`/api/teams/${ideaId}/structure`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 [TeamStructure] Team structure data:', data);
        
        // Handle nested response format
        const structureData = data.data || data;
        setTeamData(structureData);
        
        // Check if team structure is empty but idea has neededRoles
        if (structureData.teamStructure?.rolesNeeded?.length === 0) {
          console.log('🔍 [TeamStructure] No roles found, checking idea for neededRoles...');
          const rolesAdded = await syncIdeaRoles(structureData);
          if (rolesAdded) {
            // Refresh after a short delay to allow backend processing
            setTimeout(() => {
              fetchTeamStructure();
            }, 1000);
          }
        }
        
        // Fetch subroles for all team members
        if (structureData.teamStructure?.teamComposition?.length > 0) {
          await fetchAllSubroles(structureData.teamStructure.teamComposition);
        }
        
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to load team structure: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('❌ [TeamStructure] Error fetching team structure:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ideaId, fetchAllSubroles, syncIdeaRoles]);

  const removeRole = useCallback(async (roleId) => {
    try {
      console.log('🔄 [TeamStructure] Removing role:', roleId);
      const response = await apiRequest(`/api/teams/${ideaId}/roles/${roleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [TeamStructure] Role removed:', data);
        // Refresh team structure
        fetchTeamStructure();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to remove role');
      }
    } catch (err) {
      console.error('❌ [TeamStructure] Error removing role:', err);
      setError(err.message);
    }
  }, [ideaId, fetchTeamStructure]);

  return {
    teamData,
    loading,
    error,
    memberSubroles,
    fetchTeamStructure,
    syncIdeaRoles,
    removeRole,
    setMemberSubroles
  };
};
