import React, { createContext, useContext, useState, useEffect } from 'react';
import { sound } from '../utils/sound.js';

const NotificationContext = createContext(null);

const STORAGE_KEY = 'luckyplay_notifications_v1';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: '🎁 Welcome Bonus Credited!',
    message: 'Welcome to LuckyPlay! You have been credited ₹1,250 in virtual simulation chips to explore all games.',
    category: 'rewards',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
    action: { label: 'Open Wallet', type: 'wallet', tab: 'overview' },
  },
  {
    id: 'notif-2',
    title: '🚀 Aviator Multiplier Hit 48.60x!',
    message: 'High multiplier alert in Aviator! Remember to set auto-cashout for optimal risk management.',
    category: 'game',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
    action: { label: 'Play Aviator', type: 'navigate', path: '/aviator' },
  },
  {
    id: 'notif-3',
    title: '🛡️ Provably Fair Commitment',
    message: 'Server seed hash SHA-256 updated. All game rounds are 100% verifiable and tamper-proof.',
    category: 'system',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: false,
  },
  {
    id: 'notif-4',
    title: '⚠️ Compliance & Educational Notice',
    message: 'LuckyPlay is an educational simulation platform (18+ only, not for Indian users, no real money). Play responsibly!',
    category: 'system',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    read: true,
  },
];

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load notifications from storage:', e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications to storage:', e);
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = ({ title, message, category = 'system', action = null }) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      category,
      timestamp: new Date().toISOString(),
      read: false,
      action,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    sound.playClick();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    sound.playClick();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    sound.playClick();
    setNotifications([]);
  };

  const openNotificationModal = () => {
    sound.playClick();
    setIsNotificationModalOpen(true);
  };

  const closeNotificationModal = () => {
    sound.playClick();
    setIsNotificationModalOpen(false);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isNotificationModalOpen,
        openNotificationModal,
        closeNotificationModal,
        setIsNotificationModalOpen,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
