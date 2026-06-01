import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaGraduationCap, FaUser, FaPaperPlane, FaUsers, FaDotCircle } from 'react-icons/fa';

const TeamChat = ({ allocationId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [allocation, setAllocation] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchAllocationDetails();
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Simple polling
    return () => clearInterval(interval);
  }, [allocationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchAllocationDetails = async () => {
    try {
      setLoadingMembers(true);
      const res = await axios.get(`http://localhost:5000/allocations/${allocationId}`);
      setAllocation(res.data);
    } catch (error) {
      console.error("Failed to fetch allocation details:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/allocations/${allocationId}/chat`);
      setMessages(res.data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(`http://localhost:5000/allocations/${allocationId}/chat`, {
        senderId: currentUser.id,
        content: newMessage
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'row', 
      height: '100%', 
      border: '1px solid var(--border-glass)', 
      borderRadius: '16px', 
      backgroundColor: 'var(--bg-card)', 
      overflow: 'hidden', 
      backdropFilter: 'blur(12px)',
      boxShadow: 'var(--shadow-premium)'
    }}>
      {/* Left Pane - Chat Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* Chat Header */}
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid var(--border-glass)', 
          backgroundColor: 'rgba(2, 6, 9, 0.25)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '18px', fontWeight: '800' }}>Team Workspace Sync</h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaDotCircle color="var(--primary)" size={10} className="pulse" />
              <span>Real-time channel active</span>
            </p>
          </div>
        </div>
        
        {/* Messages Container */}
        <div style={{ 
          flex: 1, 
          padding: '24px', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          background: 'rgba(1, 5, 7, 0.15)'
        }}>
          {messages.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>💬</span>
              <p style={{ margin: 0, fontSize: '14.5px', fontWeight: '600' }}>No messages yet. Start the conversation!</p>
              <p style={{ margin: 0, fontSize: '12.5px', maxWidth: '250px' }}>Coordinate plans, sync on goals, or check in with your mentor.</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.senderId === currentUser.id;
              const isMentor = msg.sender?.role === 'MENTOR';
              
              let bubbleBg = 'var(--bg-input)';
              let bubbleBorder = '1px solid var(--border-glass)';
              let bubbleTextColor = 'var(--text-main)';
              let alignment = 'flex-start';
              
              if (isMe) {
                bubbleBg = 'linear-gradient(135deg, var(--primary), var(--secondary))';
                bubbleBorder = 'none';
                bubbleTextColor = 'var(--text-primary-btn)';
                alignment = 'flex-end';
              } else if (isMentor) {
                bubbleBg = 'rgba(251, 146, 60, 0.08)';
                bubbleBorder = '1px solid var(--accent)';
                bubbleTextColor = 'var(--text-main)';
              }

              return (
                <div key={msg.id} style={{ alignSelf: alignment, maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    fontSize: '11px', 
                    color: 'var(--text-muted)', 
                    marginBottom: '6px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {isMe ? (
                      'You'
                    ) : (
                      <>
                        {isMentor ? <FaGraduationCap color="var(--accent)" size={12} /> : <FaUser size={10} />}
                        <span>{msg.sender.name}</span>
                        <span style={{ 
                          fontSize: '9px', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontWeight: '800',
                          background: isMentor ? 'rgba(251, 146, 60, 0.15)' : 'rgba(45, 212, 191, 0.15)',
                          color: isMentor ? 'var(--accent)' : 'var(--primary)',
                          border: `1px solid ${isMentor ? 'rgba(251, 146, 60, 0.3)' : 'rgba(45, 212, 191, 0.3)'}`
                        }}>
                          {isMentor ? 'Faculty Mentor' : 'Student'}
                        </span>
                      </>
                    )}
                  </div>
                  <div style={{ 
                    padding: '12px 16px', 
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', 
                    background: bubbleBg,
                    border: bubbleBorder,
                    color: bubbleTextColor,
                    fontSize: '14px',
                    lineHeight: '1.5',
                    boxShadow: isMe ? '0 4px 12px rgba(45, 212, 191, 0.15)' : 'none'
                  }}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} style={{ 
          display: 'flex', 
          padding: '20px 24px', 
          borderTop: '1px solid var(--border-glass)', 
          backgroundColor: 'rgba(2, 6, 9, 0.25)',
          alignItems: 'center'
        }}>
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message to sync with the team..."
            style={{ 
              flex: 1, 
              padding: '14px 18px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-glass)', 
              backgroundColor: 'var(--bg-input)', 
              color: 'var(--text-main)', 
              marginRight: '12px',
              fontSize: '14px',
              outline: 'none',
              transition: 'var(--transition-smooth)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
          />
          <button type="submit" className="btn-glow" style={{ 
            padding: '14px 24px', 
            borderRadius: '12px', 
            border: 'none', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
            color: 'var(--text-primary-btn)', 
            cursor: 'pointer', 
            fontWeight: '800',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(45, 212, 191, 0.2)'
          }}>
            <span>Send</span>
            <FaPaperPlane size={12} />
          </button>
        </form>
      </div>

      {/* Right Pane - Active Members Sidebar */}
      <div style={{ 
        width: '280px', 
        borderLeft: '1px solid var(--border-glass)', 
        backgroundColor: 'rgba(1, 5, 7, 0.4)', 
        padding: '24px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px',
        overflowY: 'auto'
      }}>
        <div>
          <h4 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '11px', 
            fontWeight: '900', 
            color: 'var(--text-muted)', 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaUsers size={14} />
            <span>Active Team Workspace</span>
          </h4>
          
          {loadingMembers ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid rgba(45, 212, 191, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} className="spin"></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Mentor Segment */}
              <div>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Faculty Mentor</span>
                <div style={{ marginTop: '8px' }}>
                  {allocation?.mentor ? (
                    <div style={{ 
                      padding: '12px', 
                      background: 'rgba(251, 146, 60, 0.05)', 
                      border: '1.5px solid var(--border-glow)',
                      borderColor: 'rgba(251, 146, 60, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(251, 146, 60, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                          <FaGraduationCap size={14} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>{allocation.mentor.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{allocation.mentor.email}</span>
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: '9px', 
                        fontWeight: '900', 
                        background: 'rgba(251, 146, 60, 0.15)', 
                        color: 'var(--accent)', 
                        padding: '3px 8px', 
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        alignSelf: 'flex-start',
                        marginTop: '4px'
                      }}>
                        Advisor assigned
                      </span>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '12px', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px dashed var(--border-glass)',
                      borderRadius: '12px',
                      textAlign: 'center',
                      fontSize: '12px',
                      color: 'var(--text-dim)',
                      fontStyle: 'italic'
                    }}>
                      No mentor assigned
                    </div>
                  )}
                </div>
              </div>

              {/* Students Segment */}
              <div>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Cohort</span>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {allocation?.students && allocation.students.length > 0 ? (
                    allocation.students.map(student => (
                      <div key={student.id} style={{ 
                        padding: '10px 12px', 
                        background: 'rgba(45, 212, 191, 0.02)', 
                        border: '1px solid var(--border-glass)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(45, 212, 191, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <FaUser size={11} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</span>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.email}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ 
                      padding: '12px', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px dashed var(--border-glass)',
                      borderRadius: '12px',
                      textAlign: 'center',
                      fontSize: '12px',
                      color: 'var(--text-dim)',
                      fontStyle: 'italic'
                    }}>
                      No students assigned
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamChat;
