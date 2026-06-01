import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { KanbanBoard } from './KanbanBoard';
import TeamChat from './TeamChat';

const StudentDashboardView = ({ campusId, currentUser }) => {
  const [activeTab, setActiveTab] = useState("projects");
  const [allocations, setAllocations] = useState([]);
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  useEffect(() => {
    fetchCampusAllocations();
  }, [campusId]);

  const fetchCampusAllocations = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/students/${currentUser.id}/projects`);
      setAllocations(res.data);
    } catch (error) {
      console.error("Failed to fetch student allocations:", error);
    }
  };

  const renderContent = () => {
    if (activeTab === "projects") {
      return (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>My Assigned Projects</h2>
          {allocations.length === 0 ? (
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>You have not been assigned to any projects yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {allocations.map(alloc => (
                <div key={alloc.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    {alloc.project.logoUrl ? (
                      <img src={alloc.project.logoUrl} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'contain', background: 'white', padding: '4px', border: '1px solid var(--border-glass)' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                        {alloc.project.title.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-main)', fontSize: '16px', fontWeight: '700', lineHeight: '1.3' }}>{alloc.project.title}</h3>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5' }}>{alloc.project.description}</p>
                    </div>
                  </div>
                  
                  {alloc.mentor ? (
                    <div style={{ padding: '14px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto' }}>
                      <span style={{ fontSize: '11px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '800' }}>Assigned Mentor</span>
                      <span style={{ fontSize: '14.5px', color: 'var(--text-main)', fontWeight: '700' }}>{alloc.mentor.name}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{alloc.mentor.email}</span>
                    </div>
                  ) : (
                    <div style={{ padding: '14px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: '10px', marginTop: 'auto' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic' }}>No mentor assigned yet.</span>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <button 
                      onClick={() => { setSelectedAllocation(alloc); setActiveTab("kanban"); }}
                      className="btn-primary"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      View Kanban
                    </button>
                    <button 
                      onClick={() => { setSelectedAllocation(alloc); setActiveTab("chat"); }}
                      className="btn-secondary"
                      style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                    >
                      Team Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "kanban" && selectedAllocation) {
      return (
        <div>
          <button 
            onClick={() => setActiveTab("projects")}
            className="btn-secondary"
            style={{ marginBottom: '24px' }}
          >
            ← Back to Projects
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>{selectedAllocation.project.title} - Kanban Board</h2>
          <KanbanBoard projectId={selectedAllocation.projectId} campusId={campusId} />
        </div>
      );
    }

    if (activeTab === "chat" && selectedAllocation) {
      return (
        <div style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
          <button 
            onClick={() => setActiveTab("projects")}
            className="btn-secondary"
            style={{ marginBottom: '20px', alignSelf: 'flex-start' }}
          >
            ← Back to Projects
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>{selectedAllocation.project.title} - Team Chat</h2>
          <div className="glass-panel" style={{ flex: 1, minHeight: 0, padding: '20px' }}>
            <TeamChat allocationId={selectedAllocation.id} currentUser={currentUser} />
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ padding: '32px', color: 'var(--text-main)', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '32px', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Welcome, <span style={{ color: 'var(--primary)' }}>{currentUser.name}</span></h1>
      {renderContent()}
    </div>
  );
};

export default StudentDashboardView;
