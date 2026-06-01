import React, { useState, useEffect } from 'react';
import { GraduationCap, Trophy, X, Loader2 } from 'lucide-react';
import axios from 'axios';

const FIPProgressModal = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      fetchLiveMetrics();
    } else {
      setTimeout(() => setMounted(false), 300);
      setMetrics(null);
    }
  }, [isOpen]);

  const fetchLiveMetrics = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/hub/metrics");
      setMetrics(response.data);
    } catch (error) {
      console.error("Failed to fetch FIP cohort metrics", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !mounted) return null;

  // Find top performing cohort dynamically
  let topSpoke = null;
  if (metrics && metrics.spokes && metrics.spokes.length > 0) {
    topSpoke = [...metrics.spokes].sort((a, b) => b.completionRate - a.completionRate)[0];
  }

  // Pre-defined color mapping for known spokes
  const getSpokeColor = (key) => {
    if (key === "AK") return "var(--primary)"; // KLE Spoke
    // Just a fallback generator
    const colors = ["var(--primary)", "var(--secondary)", "var(--accent)", "var(--text-dim)"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      opacity: isOpen ? 1 : 0,
      transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    }} onClick={onClose}>
      <div 
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "850px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--bg-card)",
          border: "1px solid var(--border-glass)",
          transform: isOpen ? "scale(1) translateY(0)" : "scale(0.95) translateY(20px)",
          opacity: isOpen ? 1 : 0,
          transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "32px", position: "relative" }}>
          
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                padding: "12px",
                borderRadius: "16px",
                boxShadow: "0 8px 25px rgba(45, 212, 191, 0.3)"
              }}>
                <GraduationCap size={28} color="#020609" style={{ strokeWidth: 2.5 }} />
              </div>
              <div>
                <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.5px", margin: 0 }}>
                  FIP Campus Cohort Academic Progress
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
                  Real-time overview of student cohorts, faculty mentors, and academic milestones across all active campuses.
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border-glass)",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                cursor: "pointer",
                transition: "var(--transition-smooth)"
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = "var(--text-main)"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            >
              <X size={18} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 0", color: "var(--primary)" }}>
              <Loader2 size={36} className="pulse-glow" style={{ animation: "spin 1s linear infinite" }} />
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <>
              {/* Table Container */}
              <div style={{ 
                background: "rgba(0,0,0,0.06)", 
                borderRadius: "16px", 
                border: "1px solid var(--border-glass)",
                overflow: "hidden",
                marginBottom: "24px"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "rgba(45, 212, 191, 0.05)", borderBottom: "1px solid var(--border-glass)" }}>
                      <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "700", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Campus Institution</th>
                      <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "700", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Student Cohort</th>
                      <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "700", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Faculty Mentors</th>
                      <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "700", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sponsor Projects</th>
                      <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "700", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Task Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics && metrics.spokes && metrics.spokes.map((row, i) => {
                      // Keep visual colors consistent for demo campuses
                      let rowColor = "var(--primary)";
                      if (row.name.includes("COEP")) rowColor = "var(--secondary)";
                      if (row.name.includes("MMCOEP")) rowColor = "var(--purple)";
                      if (row.name.includes("RIT")) rowColor = "var(--accent)";

                      return (
                        <tr key={row.id} style={{ borderBottom: i === metrics.spokes.length - 1 ? "none" : "1px solid var(--border-glass)", transition: "background 0.2s" }} className="table-row-hover">
                          <td style={{ padding: "16px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{
                                width: "28px", height: "28px", borderRadius: "8px", 
                                background: `${rowColor}15`, border: `1px solid ${rowColor}40`,
                                color: rowColor, display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "12px", fontWeight: "800"
                              }}>
                                {row.name.charAt(0)}
                              </div>
                              <span style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "14px" }}>{row.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: "14px", fontWeight: "500" }}>{row.students || 0} Students</td>
                          <td style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: "14px", fontWeight: "500" }}>{row.mentors || 0} Mentors</td>
                          <td style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: "14px", fontWeight: "500" }}>{row.projects || 0} Project{(row.projects === 0 || row.projects > 1) ? 's' : ''}</td>
                          <td style={{ padding: "16px 20px", textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
                              <div style={{ width: "80px", height: "6px", background: "rgba(128,128,128,0.15)", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{ width: `${row.completionRate || 0}%`, height: "100%", background: rowColor, borderRadius: "3px", transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                              </div>
                              <span style={{ fontWeight: "700", color: rowColor, fontSize: "14px", minWidth: "35px" }}>{row.completionRate || 0}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Highlight Card */}
              {topSpoke && (
                <div style={{
                  background: "linear-gradient(90deg, rgba(251, 146, 60, 0.1), rgba(251, 146, 60, 0.02))",
                  border: "1px solid rgba(251, 146, 60, 0.2)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px"
                }}>
                  <div style={{ background: "rgba(251, 146, 60, 0.15)", padding: "10px", borderRadius: "12px", color: "var(--accent)" }}>
                    <Trophy size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "var(--text-main)", marginBottom: "4px" }}>
                      Top Performing Cohort
                    </h3>
                    <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                      <span style={{ color: "var(--text-main)", fontWeight: "600" }}>{topSpoke.name}</span> is leading portfolio progress with a <span style={{ color: "var(--accent)", fontWeight: "600" }}>{topSpoke.completionRate}% avg completion rate</span> across all live tasks and milestones.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
            <button 
              onClick={onClose}
              className="btn-primary"
              style={{ padding: "12px 30px", fontSize: "14px", fontWeight: "700", borderRadius: "12px" }}
            >
              Close Portal
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default FIPProgressModal;
