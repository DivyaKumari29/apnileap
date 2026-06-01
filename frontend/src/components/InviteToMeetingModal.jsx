import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const InviteToMeetingModal = ({ meeting, currentUser, onClose, onInviteSuccess }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchInviteableUsers();
  }, []);

  const fetchInviteableUsers = async () => {
    try {
      // Determine what role we are allowed to invite based on current user role
      let endpoint = '';
      if (currentUser.role === 'Central Moderator' || currentUser.role === 'Corporate Sponsor' || currentUser.role.includes('Coordinator')) {
        // Coordinators can invite Mentors
        endpoint = `http://localhost:5000/mentors/${meeting.campusId}`;
      } else if (currentUser.role === 'MENTOR') {
        // Mentors can invite Students
        endpoint = `http://localhost:5000/students/${meeting.campusId}`;
      }

      if (endpoint) {
        const res = await axios.get(endpoint);
        setUsers(res.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch inviteable users", error);
      setLoading(false);
    }
  };

  const handleCheckboxChange = (userId) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleInvite = async () => {
    setInviting(true);
    try {
      const res = await axios.post(`http://localhost:5000/meetings/${meeting.id}/invite`, {
        userIds: selectedUserIds,
        invitedBy: currentUser.id
      });
      if (res.data) {
        onInviteSuccess(res.data);
        onClose();
      }
    } catch (error) {
      console.error("Failed to invite users", error);
    } finally {
      setInviting(false);
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
        width: '500px', maxWidth: '90%', border: '1px solid #333'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#fff' }}>Invite to Meeting</h2>
        <p style={{ color: '#aaa', fontSize: '14px' }}>Meeting: {meeting.title}</p>
        
        {loading ? (
          <p style={{ color: '#aaa' }}>Loading users...</p>
        ) : users.length === 0 ? (
          <p style={{ color: '#aaa' }}>No users found or you don't have permission to invite anyone to this meeting.</p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '24px', marginTop: '16px' }}>
            {users.map(user => {
              const alreadyInvited = meeting.invites?.some(inv => inv.userId === user.id);
              return (
                <label key={user.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid #333', cursor: alreadyInvited ? 'not-allowed' : 'pointer', opacity: alreadyInvited ? 0.5 : 1 }}>
                  <input 
                    type="checkbox" 
                    checked={alreadyInvited || selectedUserIds.includes(user.id)}
                    onChange={() => handleCheckboxChange(user.id)}
                    disabled={alreadyInvited}
                    style={{ marginRight: '16px', transform: 'scale(1.2)' }}
                  />
                  <div>
                    <div style={{ color: '#fff', fontWeight: 'bold' }}>{user.name} {alreadyInvited && '(Already Invited)'}</div>
                    <div style={{ color: '#aaa', fontSize: '12px' }}>{user.email}</div>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            onClick={onClose}
            style={{ padding: '10px 16px', backgroundColor: 'transparent', border: '1px solid #555', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleInvite}
            disabled={inviting || selectedUserIds.length === 0}
            style={{ padding: '10px 16px', backgroundColor: '#3B82F6', border: 'none', color: '#fff', borderRadius: '6px', cursor: (inviting || selectedUserIds.length === 0) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
          >
            {inviting ? 'Inviting...' : 'Send Invites'}
          </button>
        </div>
      </div>
    </div>
  );
};
