import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { sound } from '../utils/sound.js';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Gift,
  Gamepad2,
  ShieldAlert,
  Info,
  Clock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const NotificationModal = () => {
  const {
    notifications,
    unreadCount,
    isNotificationModalOpen,
    closeNotificationModal,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const { openWalletModal } = useAuth();
  const navigate = useNavigate();

  const [filter, setFilter] = useState('all');

  if (!isNotificationModalOpen) return null;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'rewards':
        return <Gift size={16} color="#fbbf24" />;
      case 'game':
        return <Gamepad2 size={16} color="#38bdf8" />;
      case 'security':
        return <ShieldAlert size={16} color="#f87171" />;
      case 'system':
      default:
        return <Info size={16} color="#818cf8" />;
    }
  };

  const formatTime = (isoString) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const handleActionClick = (action, notifId) => {
    sound.playClick();
    markAsRead(notifId);
    closeNotificationModal();

    if (!action) return;

    if (action.type === 'wallet') {
      if (openWalletModal) {
        openWalletModal(action.tab || 'overview');
      }
    } else if (action.type === 'navigate' && action.path) {
      navigate(action.path);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeNotificationModal}>
      <div
        className="glass-panel modal-content"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '88vh',
          borderRadius: '24px',
          border: '1px solid rgba(129, 140, 248, 0.25)',
          background: 'linear-gradient(180deg, rgba(16, 20, 38, 0.98) 0%, rgba(9, 11, 22, 0.99) 100%)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '20px 22px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)',
              }}
            >
              <Bell size={20} color="#c7d2fe" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                    }}
                  >
                    {unreadCount} New
                  </span>
                )}
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Platform alerts, rewards & updates
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '10px',
                  color: '#a5b4fc',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.2s',
                }}
                title="Mark all as read"
              >
                <CheckCheck size={14} /> Read All
              </button>
            )}

            <button
              onClick={closeNotificationModal}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Categories Bar */}
        <div
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
          className="no-scrollbar"
        >
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'rewards', label: 'Rewards', count: notifications.filter((n) => n.category === 'rewards').length },
            { id: 'game', label: 'Games', count: notifications.filter((n) => n.category === 'game').length },
            { id: 'system', label: 'System', count: notifications.filter((n) => n.category === 'system' || n.category === 'security').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setFilter(tab.id);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 700,
                border: filter === tab.id ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                background: filter === tab.id ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : 'rgba(255, 255, 255, 0.03)',
                color: filter === tab.id ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
              <span
                style={{
                  fontSize: '10px',
                  opacity: 0.8,
                  background: filter === tab.id ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  padding: '1px 5px',
                  borderRadius: '10px',
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            minHeight: '260px',
            maxHeight: '420px',
          }}
        >
          {filteredNotifications.length === 0 ? (
            <div
              style={{
                padding: '48px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                color: '#64748b',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                }}
              >
                <Bell size={24} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#94a3b8' }}>
                No notifications in this category
              </div>
              <div style={{ fontSize: '12px', maxWidth: '280px' }}>
                You're all caught up! New reward opportunities and platform alerts will appear here.
              </div>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: notif.read
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 20, 38, 0.6) 100%)',
                  border: notif.read
                    ? '1px solid rgba(255, 255, 255, 0.05)'
                    : '1px solid rgba(129, 140, 248, 0.3)',
                  position: 'relative',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  transition: 'all 0.2s ease',
                  cursor: notif.read ? 'default' : 'pointer',
                }}
              >
                {/* Left Indicator for Unread */}
                {!notif.read && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '6px',
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                      boxShadow: '0 0 8px #38bdf8',
                    }}
                  />
                )}

                {/* Category Icon */}
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {getCategoryIcon(notif.category)}
                </div>

                {/* Text Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: notif.read ? 700 : 800,
                        color: notif.read ? '#e2e8f0' : '#ffffff',
                      }}
                    >
                      {notif.title}
                    </h4>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        flexShrink: 0,
                      }}
                    >
                      <Clock size={11} /> {formatTime(notif.timestamp)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '12px',
                      color: notif.read ? '#94a3b8' : '#cbd5e1',
                      lineHeight: 1.45,
                    }}
                  >
                    {notif.message}
                  </p>

                  {/* Action button if present */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '6px' }}>
                    {notif.action ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(notif.action, notif.id);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#ffffff',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)',
                        }}
                      >
                        {notif.action.label} <ExternalLink size={11} />
                      </button>
                    ) : <div />}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        padding: '4px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Remove notification"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={12} color="#fbbf24" /> Instant real-time updates enabled
          </span>

          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Trash2 size={12} /> Clear History
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
