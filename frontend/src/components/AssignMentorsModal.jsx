import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes, FaChalkboardTeacher, FaCheck, FaSpinner } from 'react-icons/fa';

export default function AssignMentorsModal({
  isOpen,
  onClose,
  allocationId,
  campusId,
  projectTitle,
  company,
  currentAssignments = [],
  onAssignSuccess,
  triggerToast
}) {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMentors, setSelectedMentors] = useState([]);

  useEffect(() => {
    if (isOpen && campusId) {
      fetchMentors();
      setSelectedMentors(currentAssignments.map(a => a.facultyId));
    }
  }, [isOpen, campusId, currentAssignments]);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/mentors/${campusId}`);
      setMentors(res.data);
    } catch (err) {
      console.error("Failed to fetch mentors", err);
      triggerToast("Failed to fetch faculty mentors.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMentor = (mentorId) => {
    setSelectedMentors(prev => 
      prev.includes(mentorId) 
        ? prev.filter(id => id !== mentorId)
        : [...prev, mentorId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`http://localhost:5000/allocations/${allocationId}/assign`, {
        mentorIds: selectedMentors
      });
      triggerToast("Mentors assigned successfully!");
      onAssignSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to assign mentors", err);
      triggerToast("Failed to assign mentors.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(8px)",
      zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center",
      animation: "fadeIn 0.3s ease"
    }}>
      <div className="glass-panel" style={{
        width: "90%", maxWidth: "500px", background: "var(--bg-card)",
        border: "1px solid var(--border-glass)", borderRadius: "20px",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "var(--shadow-premium)"
      }}>
        {/* Header */}
        <div style={{
          padding: "24px", borderBottom: "1px solid var(--border-glass)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: "rgba(45, 212, 191, 0.1)", color: "var(--primary)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <FaChalkboardTeacher size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Assign Faculty Mentors</h2>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                {projectTitle} <span style={{ opacity: 0.7 }}>by {company}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
            padding: "8px", display: "flex", borderRadius: "50%", transition: "all 0.2s"
          }} className="hover-bg-glass">
            <FaTimes size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", maxHeight: "60vh", overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0", color: "var(--primary)" }}>
              <FaSpinner size={24} className="spin" />
            </div>
          ) : mentors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: "14px" }}>
              No Faculty Mentors found for this campus.<br/>
              Ensure users with MENTOR role exist in the database.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--text-muted)" }}>
                Select one or more mentors to oversee this project cohort:
              </p>
              {mentors.map(mentor => {
                const isSelected = selectedMentors.includes(mentor.id);
                return (
                  <div
                    key={mentor.id}
                    onClick={() => handleToggleMentor(mentor.id)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "16px", borderRadius: "12px", cursor: "pointer",
                      background: isSelected ? "rgba(45, 212, 191, 0.1)" : "rgba(255, 255, 255, 0.03)",
                      border: "1px solid",
                      borderColor: isSelected ? "var(--primary)" : "var(--border-glass)",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: isSelected ? "var(--primary)" : "rgba(255,255,255,0.1)",
                        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: "bold", fontSize: "14px"
                      }}>
                        {mentor.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "14px", color: "var(--text-main)" }}>{mentor.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{mentor.email}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{ color: "var(--primary)" }}>
                        <FaCheck size={16} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "20px 24px", borderTop: "1px solid var(--border-glass)",
          display: "flex", justifyContent: "flex-end", gap: "12px", background: "rgba(0,0,0,0.1)"
        }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: "10px 20px", borderRadius: "8px" }}>
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="btn-primary" 
            style={{ padding: "10px 24px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}
          >
            {saving && <FaSpinner className="spin" size={14} />}
            Save Assignments
          </button>
        </div>
      </div>
    </div>
  );
}
