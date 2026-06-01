import React, { useState } from 'react';
import axios from 'axios';
import { FaTimes, FaRunning, FaSpinner } from 'react-icons/fa';

export default function CreateSprintModal({ isOpen, onClose, currentBoardId, onSuccess, triggerToast, acceptedProjects = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    goal: '',
    project: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      triggerToast("Please fill in all required fields.", "error");
      return;
    }

    setLoading(true);
    try {
      // Jira requires proper ISO-8601 formatting. Appending arbitrary time if using date input.
      const formattedStart = new Date(formData.startDate).toISOString();
      const formattedEnd = new Date(formData.endDate).toISOString();

      let finalName = formData.name;
      let finalGoal = formData.goal;

      if (formData.project && formData.project !== "General (All Teams)") {
        finalName = `[${formData.project}] ${formData.name}`;
        finalGoal = `Target Team/Project: ${formData.project} - ${formData.goal}`;
      }

      await axios.post('http://localhost:5000/sprints', {
        boardId: currentBoardId,
        name: finalName,
        startDate: formattedStart,
        endDate: formattedEnd,
        goal: finalGoal
      });

      triggerToast("Sprint created and started successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Sprint Creation Error:", err);
      triggerToast("Failed to create sprint. Ensure you have the correct Jira permissions.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(12px)",
      zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center",
      animation: "fadeIn 0.3s ease"
    }}>
      <div className="glass-panel" style={{
        width: "90%", maxWidth: "520px", background: "var(--bg-card)",
        border: "1px solid var(--border-glass)", borderRadius: "24px",
        overflow: "hidden", boxShadow: "0 24px 48px rgba(0,0,0,0.5)"
      }}>
        
        {/* Header */}
        <div style={{
          padding: "24px 32px", borderBottom: "1px solid var(--border-glass)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "rgba(255,255,255,0.02)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.15)", color: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <FaRunning size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.5px" }}>Create New Sprint</h2>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)", fontWeight: "500" }}>Start a new phase for your cohort.</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", color: "var(--text-muted)", cursor: "pointer",
            width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", transition: "all 0.2s"
          }} className="hover-bg-glass">
            <FaTimes size={14} />
          </button>
        </div>

        {/* Body (Form) */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--text-dim)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Target Project / Team <span style={{color: "var(--accent)"}}>*</span>
              </label>
              <select
                name="project"
                value={formData.project}
                onChange={handleChange}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: "10px",
                  background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--text-main)", fontSize: "14px", transition: "border 0.2s",
                  outline: "none"
                }}
                onFocus={e => e.target.style.borderColor = "var(--primary)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                required
              >
                <option value="">-- Select Target Project/Team --</option>
                <option value="General (All Teams)">General (All Teams)</option>
                {acceptedProjects.map(proj => (
                  <option key={proj.id} value={proj.title}>{proj.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--text-dim)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Sprint Name <span style={{color: "var(--accent)"}}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Phase 1: Planning & Setup"
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: "10px",
                  background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--text-main)", fontSize: "14px", transition: "border 0.2s",
                  outline: "none"
                }}
                onFocus={e => e.target.style.borderColor = "var(--primary)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                required
              />
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--text-dim)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Start Date <span style={{color: "var(--accent)"}}>*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: "10px",
                    background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--text-main)", fontSize: "14px", outline: "none", colorScheme: "dark"
                  }}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--text-dim)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  End Date <span style={{color: "var(--accent)"}}>*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: "10px",
                    background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--text-main)", fontSize: "14px", outline: "none", colorScheme: "dark"
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--text-dim)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Sprint Goal
              </label>
              <textarea
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                placeholder="What is the main objective of this sprint?"
                rows={3}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: "10px",
                  background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--text-main)", fontSize: "14px", transition: "border 0.2s",
                  outline: "none", resize: "none"
                }}
                onFocus={e => e.target.style.borderColor = "var(--primary)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: "20px 32px", borderTop: "1px solid var(--border-glass)",
            display: "flex", justifyContent: "flex-end", gap: "12px", background: "rgba(0,0,0,0.2)"
          }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: "10px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "700" }}>
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary" 
              style={{ padding: "10px 24px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "700", background: "var(--accent)", color: "white" }}
            >
              {loading ? <FaSpinner className="spin" size={16} /> : <FaRunning size={16} />}
              Start Sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
