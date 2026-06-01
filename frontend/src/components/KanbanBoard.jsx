import React from 'react';

export const KanbanBoard = ({ projectId, campusId }) => {
  return (
    <div style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#1E1E1E', color: '#ccc', textAlign: 'center', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Kanban Board for Project {projectId} (Campus {campusId}) is locked to your Campus Coordinator in this version. Please use the Team Chat to sync with your mentor.</p>
    </div>
  );
};
