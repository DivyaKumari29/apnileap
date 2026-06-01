import React, { useMemo, useState } from 'react';
import { FaGraduationCap, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { ManageTeamsModal } from './ManageTeamsModal';
import TeamChat from './TeamChat';

export default function FacultyDashboardView({ sessionUser, moderatorProjects, loading, onRefresh }) {
  const [assignModalAllocation, setAssignModalAllocation] = useState(null);
  const [activeTab, setActiveTab] = useState("cohorts");
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  // Filter projects assigned to this specific faculty member
  const assignedProjects = useMemo(() => {
    if (!moderatorProjects || !sessionUser) return [];
    
    return moderatorProjects.filter(proj => {
      // Look through allocations to see if this user is assigned
      return proj.allocations?.some(alloc => 
        alloc.mentorAssignments?.some(assignment => assignment.facultyId === sessionUser.id)
      );
    });
  }, [moderatorProjects, sessionUser]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh", flexDirection: "column", gap: "16px" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid rgba(16, 185, 129, 0.1)", borderTopColor: "var(--accent)", borderRadius: "50%" }} className="spin"></div>
        <div style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: "600" }}>Loading Faculty Cohorts...</div>
      </div>
    );
  }

  if (activeTab === "chat" && selectedAllocation) {
    return (
      <div className="fade-in" style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", height: "85vh", display: "flex", flexDirection: "column" }}>
        <button 
          onClick={() => { setActiveTab("cohorts"); setSelectedAllocation(null); }}
          className="btn-secondary"
          style={{ marginBottom: '24px', alignSelf: 'flex-start', border: '1px solid var(--border-glass)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '700' }}
        >
          ← Back to Cohorts
        </button>
        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-main)' }}>
          {selectedAllocation.project?.title} - Team Sync Workspace
        </h2>
        <div style={{ flex: 1, minHeight: 0 }}>
          <TeamChat allocationId={selectedAllocation.id} currentUser={sessionUser} />
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, var(--accent), var(--primary))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 8px 24px rgba(16, 185, 129, 0.2)" }}>
          <FaGraduationCap size={28} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "var(--text-main)" }}>Faculty Mentor Dashboard</h1>
          <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: "15px" }}>Welcome, {sessionUser?.name}. Manage your assigned student cohorts.</p>
        </div>
      </div>

      {assignedProjects.length === 0 ? (
        <div className="glass-panel" style={{ padding: "60px", textAlign: "center", borderRadius: "16px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <span style={{ fontSize: "24px" }}>📚</span>
          </div>
          <h3 style={{ fontSize: "18px", margin: "0 0 8px" }}>No Active Cohorts</h3>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "14px" }}>You have not been assigned as a Mentor for any projects yet. Please check back later or contact your Campus Coordinator.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
          {assignedProjects.map(proj => {
            // Get the specific allocation progress
            const allocation = proj.allocations?.find(a => 
              a.mentorAssignments?.some(assign => assign.facultyId === sessionUser.id)
            );
            const progress = allocation?.progressPercent || 0;

            return (
              <div key={proj.id} className="glass-panel" style={{ 
                borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column",
                border: "1px solid var(--border-glass)", transition: "transform 0.2s",
              }}>
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ background: "white", padding: "8px", borderRadius: "10px", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={proj.logoUrl} alt={proj.company} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-main)" }}>{proj.title}</h3>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", marginTop: "2px", letterSpacing: "0.5px", textTransform: "uppercase" }}>{proj.company}</div>
                      </div>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-muted)", lineHeight: "1.5", flex: 1 }}>{proj.description}</p>
                  
                  <div style={{ background: "var(--bg-elevated)", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid var(--border-glass)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Cohort Progress</span>
                      <span style={{ fontSize: "18px", fontWeight: "800", color: "var(--accent)" }}>{progress}%</span>
                    </div>
                    <div style={{ height: "8px", background: "var(--bg-sidebar)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, var(--primary), var(--accent))", borderRadius: "4px", transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "12px" }}>
                        <FaCheckCircle color="var(--status-done-text)" size={12} />
                        <span>{allocation?.doneTasks || 0} tasks approved</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ background: "rgba(16, 185, 129, 0.05)", padding: "16px 24px", borderTop: "1px solid rgba(16, 185, 129, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                  <button 
                    onClick={() => setAssignModalAllocation(allocation)}
                    className="btn-glow" style={{ background: "#3B82F6", color: "white", border: "none", padding: "8px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer", flex: 1 }}>
                    Manage Teams
                  </button>
                  <button 
                    onClick={() => { setSelectedAllocation({ ...allocation, project: proj }); setActiveTab("chat"); }}
                    className="btn-glow" style={{ background: "var(--primary)", color: "var(--text-primary-btn)", border: "none", padding: "8px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer", flex: 1 }}>
                    Team Chat
                  </button>
                  <button className="btn-glow" style={{ background: "var(--accent)", color: "white", border: "none", padding: "8px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer", flex: 1 }}>
                    Review Work
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {assignModalAllocation && (
        <ManageTeamsModal 
          allocation={assignModalAllocation}
          onClose={() => setAssignModalAllocation(null)}
          onRefresh={() => {
            if (onRefresh) onRefresh(); 
          }}
        />
      )}
    </div>
  );
}
