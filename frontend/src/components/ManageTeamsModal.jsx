import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const ManageTeamsModal = ({ allocation, onClose, onRefresh }) => {
  const [teams, setTeams] = useState(allocation.teams || []);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTeamId, setActiveTeamId] = useState(null); // Team ID currently being assigned students
  
  // State for student assignment
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    // Keep internal teams state in sync if allocation changes
    setTeams(allocation.teams || []);
  }, [allocation]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/allocations/${allocation.id}/teams`, {
        name: newTeamName
      });
      if (res.data.success) {
        setTeams([...teams, { ...res.data.team, studentAssignments: [] }]);
        setNewTeamName('');
        onRefresh(); // Refresh parent view
      }
    } catch (error) {
      console.error("Failed to create team", error);
    } finally {
      setLoading(false);
    }
  };

  const openStudentAssignment = async (team) => {
    if (activeTeamId === team.id) {
      // Toggle off
      setActiveTeamId(null);
      return;
    }
    
    setActiveTeamId(team.id);
    setFetchingStudents(true);
    try {
      const res = await axios.get(`http://localhost:5000/students/${allocation.targetCampusId}`);
      setStudents(res.data);
      
      const existingIds = team.studentAssignments?.map(sa => sa.studentId) || [];
      setSelectedStudentIds(existingIds);
    } catch (error) {
      console.error("Failed to fetch students", error);
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleCheckboxChange = (studentId) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleSaveAssignments = async (teamId) => {
    setAssigning(true);
    try {
      const res = await axios.post(`http://localhost:5000/teams/${teamId}/assign-students`, {
        studentIds: selectedStudentIds
      });
      if (res.data.success) {
        // Update local team state
        setTeams(teams.map(t => t.id === teamId ? res.data.team : t));
        setActiveTeamId(null);
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to assign students", error);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1E1E1E', padding: '24px', borderRadius: '12px',
        width: '600px', maxWidth: '90%', border: '1px solid #333',
        maxHeight: '85vh', overflowY: 'auto'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '8px', color: '#fff' }}>Manage Teams</h2>
        <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '24px' }}>
          Project: {allocation.project?.title}
        </p>
        
        {/* Create Team Section */}
        <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
          <h3 style={{ fontSize: '16px', color: '#eee', marginBottom: '12px' }}>Create New Team</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="e.g. Alpha Squad" 
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#111', color: '#fff' }}
            />
            <button 
              onClick={handleCreateTeam}
              disabled={loading || !newTeamName.trim()}
              style={{ padding: '10px 16px', backgroundColor: '#10B981', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </div>

        {/* List of Teams Section */}
        <h3 style={{ fontSize: '16px', color: '#eee', marginBottom: '16px' }}>Existing Teams</h3>
        {teams.length === 0 ? (
          <p style={{ color: '#aaa', fontStyle: 'italic' }}>No teams created yet. Create one above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {teams.map(team => (
              <div key={team.id} style={{ border: '1px solid #444', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#fff' }}>{team.name}</h4>
                    <span style={{ fontSize: '12px', color: '#aaa' }}>
                      {team.studentAssignments?.length || 0} students assigned
                    </span>
                  </div>
                  <button 
                    onClick={() => openStudentAssignment(team)}
                    style={{ padding: '8px 12px', backgroundColor: activeTeamId === team.id ? '#444' : 'transparent', border: '1px solid #555', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    {activeTeamId === team.id ? 'Cancel Assignment' : 'Assign Students'}
                  </button>
                </div>
                
                {/* Expandable Student Assignment Section */}
                {activeTeamId === team.id && (
                  <div style={{ padding: '16px', borderTop: '1px solid #444', backgroundColor: '#111' }}>
                    <h5 style={{ margin: '0 0 12px 0', color: '#eee' }}>Select students for {team.name}</h5>
                    
                    {fetchingStudents ? (
                      <p style={{ color: '#aaa', fontSize: '13px' }}>Loading students...</p>
                    ) : students.length === 0 ? (
                      <p style={{ color: '#aaa', fontSize: '13px' }}>No students found for this campus.</p>
                    ) : (
                      <>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px', border: '1px solid #333', borderRadius: '6px' }}>
                          {students.map(student => (
                            <label key={student.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #222', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={() => handleCheckboxChange(student.id)}
                                style={{ marginRight: '12px', transform: 'scale(1.1)' }}
                              />
                              <div>
                                <div style={{ color: '#fff', fontSize: '14px' }}>{student.name}</div>
                                <div style={{ color: '#888', fontSize: '11px' }}>{student.email}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                        <button 
                          onClick={() => handleSaveAssignments(team.id)}
                          disabled={assigning}
                          style={{ padding: '8px 16px', backgroundColor: '#3B82F6', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
                        >
                          {assigning ? 'Saving...' : 'Save Student Assignments'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button 
            onClick={onClose}
            style={{ padding: '10px 24px', backgroundColor: '#333', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
