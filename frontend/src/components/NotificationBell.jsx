import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaBell, FaCheck, FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaCircle } from 'react-icons/fa';

export default function NotificationBell({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await axios.get(`/api/users/${currentUser.id}/notifications`);
      setNotifications(res.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(`/api/users/${currentUser.id}/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type) => {
    switch (type) {
      case 'SUCCESS': return <FaCheckCircle color="#10b981" />;
      case 'WARNING': return <FaExclamationTriangle color="#f59e0b" />;
      case 'ERROR': return <FaExclamationTriangle color="#ef4444" />;
      case 'INFO': 
      default: return <FaInfoCircle color="#3b82f6" />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        className="icon-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '4px', right: '4px',
            background: '#ef4444',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            borderRadius: '50%',
            height: '16px',
            width: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="glass-panel fade-in" style={{
          position: 'absolute',
          top: '40px',
          right: '0',
          width: '350px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          padding: '0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-glass)', position: 'sticky', top: 0, background: 'rgba(20,20,30,0.95)', backdropFilter: 'blur(10px)', zIndex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                Mark all as read
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <FaBell size={24} style={{ opacity: 0.2, marginBottom: '10px' }} />
                <p style={{ margin: 0, fontSize: '13px' }}>You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  style={{ 
                    padding: '16px', 
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                    display: 'flex',
                    gap: '12px',
                    transition: 'background 0.2s',
                    cursor: n.isRead ? 'default' : 'pointer'
                  }}
                  onClick={(e) => !n.isRead && handleMarkAsRead(e, n.id)}
                >
                  <div style={{ marginTop: '2px' }}>
                    {getIcon(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px', color: n.isRead ? 'var(--text-muted)' : 'var(--text-main)' }}>{n.title}</strong>
                      {!n.isRead && <FaCircle size={8} color="var(--primary)" />}
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '8px', display: 'block' }}>
                      {new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
