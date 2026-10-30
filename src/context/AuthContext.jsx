import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { socket } from '../services/socket.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nexus_token') || null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletModalTab, setWalletModalTab] = useState('overview');

  const openWalletModal = (tab = 'overview') => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setWalletModalTab(tab);
    setIsWalletModalOpen(true);
  };

  const closeWalletModal = () => {
    setIsWalletModalOpen(false);
  };

  const joinUserRoom = useCallback((targetUser) => {
    const u = targetUser || user;
    if (!socket || !u) return;
    const uid = u._id || u.id;
    const currentToken = localStorage.getItem('nexus_token');
    socket.emit('user:join', { userId: uid, token: currentToken });
    if (currentToken) {
      socket.emit('user:authenticate', { token: currentToken });
    }
  }, [user]);

  const fetchMe = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        setUser(res.data.data.user);
        setWallet(res.data.data.wallet);
        joinUserRoom(res.data.data.user);
      }
    } catch {
      localStorage.removeItem('nexus_token');
      setToken(null);
      setUser(null);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [token, joinUserRoom]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const refreshWallet = async () => {
    try {
      const res = await api.get('/wallet');
      if (res.data?.success) {
        setWallet(res.data.data);
      }
    } catch (err) {
      console.error('Failed to refresh wallet:', err);
    }
  };

  // Real-time socket synchronization for live balance & cashier updates
  useEffect(() => {
    if (!socket || !user) return;

    // Join room immediately on mount or user change
    joinUserRoom(user);

    // Auto-rejoin on any socket reconnect
    const onConnect = () => {
      console.log('[AuthContext] Socket connected/reconnected — rejoining private user room');
      joinUserRoom(user);
      refreshWallet();
    };

    const onWalletUpdate = (data) => {
      console.log('[AuthContext] Realtime wallet:update received:', data);
      if (data && data.balance !== undefined) {
        const newBal = Number(data.balance);
        setWallet((prev) => ({
          ...prev,
          balance: newBal,
          totalDeposited: data.totalDeposited !== undefined ? Number(data.totalDeposited) : prev?.totalDeposited,
          totalWagered: data.totalWagered !== undefined ? Number(data.totalWagered) : prev?.totalWagered,
          totalWon: data.totalWon !== undefined ? Number(data.totalWon) : prev?.totalWon,
          totalWithdrawn: data.totalWithdrawn !== undefined ? Number(data.totalWithdrawn) : prev?.totalWithdrawn,
        }));
        window.dispatchEvent(new CustomEvent('wallet:update', { detail: data }));
      }
    };

    const onWithdrawalUpdate = (data) => {
      console.log('[AuthContext] Realtime withdrawal:update received:', data);
      window.dispatchEvent(new CustomEvent('withdrawal:update', { detail: data }));
      refreshWallet();
    };

    const onDepositUpdate = (data) => {
      console.log('[AuthContext] Realtime deposit:update received:', data);
      window.dispatchEvent(new CustomEvent('deposit:update', { detail: data }));
      refreshWallet();
      if (data?.status === 'APPROVED') {
        sound.playWin?.();
      }
    };

    const onNotificationNew = (notification) => {
      if (notification?.type?.startsWith('withdrawal') || notification?.type?.startsWith('deposit')) {
        refreshWallet();
        window.dispatchEvent(new CustomEvent('withdrawal:update', { detail: notification }));
        window.dispatchEvent(new CustomEvent('deposit:update', { detail: notification }));
        if (notification?.type === 'deposit') {
          sound.playWin?.();
        }
      }
    };

    socket.on('connect', onConnect);
    socket.on('wallet:update', onWalletUpdate);
    socket.on('user:balance', onWalletUpdate);
    socket.on('withdrawal:update', onWithdrawalUpdate);
    socket.on('deposit:update', onDepositUpdate);
    socket.on('deposit:status', onDepositUpdate);
    socket.on('notification:new', onNotificationNew);

    return () => {
      socket.off('connect', onConnect);
      socket.off('wallet:update', onWalletUpdate);
      socket.off('user:balance', onWalletUpdate);
      socket.off('withdrawal:update', onWithdrawalUpdate);
      socket.off('deposit:update', onDepositUpdate);
      socket.off('deposit:status', onDepositUpdate);
      socket.off('notification:new', onNotificationNew);
    };
  }, [user, joinUserRoom]);

  const login = async (usernameOrEmail, password) => {
    const res = await api.post('/auth/login', { usernameOrEmail, password });
    if (res.data?.success) {
      const { user, wallet, accessToken, refreshToken } = res.data.data;
      localStorage.setItem('nexus_token', accessToken);
      if (refreshToken) localStorage.setItem('nexus_refresh_token', refreshToken);
      setToken(accessToken);
      setUser(user);
      setWallet(wallet);
      setIsAuthModalOpen(false);
      socket.emit('user:join', { userId: user._id || user.id });
      return user;
    }
  };

  const register = async ({ fullName, email, phone, password, confirmPassword, referralCode }) => {
    const res = await api.post('/auth/register', {
      fullName, email, phone, password, confirmPassword, referralCode,
    });
    if (res.data?.success) {
      const { user, wallet, accessToken, refreshToken } = res.data.data;
      localStorage.setItem('nexus_token', accessToken);
      if (refreshToken) localStorage.setItem('nexus_refresh_token', refreshToken);
      setToken(accessToken);
      setUser(user);
      setWallet(wallet);
      setIsAuthModalOpen(false);
      socket.emit('user:join', { userId: user._id || user.id });
      return user;
    }
  };

  const demoLogin = async (role = 'user') => {
    const res = await api.post('/auth/demo-login', { role });
    if (res.data?.success) {
      const { user, wallet, accessToken, refreshToken } = res.data.data;
      localStorage.setItem('nexus_token', accessToken);
      if (refreshToken) localStorage.setItem('nexus_refresh_token', refreshToken);
      setToken(accessToken);
      setUser(user);
      setWallet(wallet);
      setIsAuthModalOpen(false);
      socket.emit('user:join', { userId: user._id || user.id });
      return user;
    }
  };

  const logout = async () => {
    try {
      // Invalidate the refresh token on the server so it cannot be replayed
      const refreshToken = localStorage.getItem('nexus_refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
      // Leave the user's private notification room
      if (user) socket.emit('user:leave', { userId: user._id || user.id });
    } finally {
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_refresh_token');
      setToken(null);
      setUser(null);
      setWallet(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        token,
        loading,
        login,
        register,
        demoLogin,
        logout,
        refreshWallet,
        setWallet,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isDepositModalOpen,
        setIsDepositModalOpen,
        isWithdrawModalOpen,
        setIsWithdrawModalOpen,
        withdrawalHistory,
        setWithdrawalHistory,
        isWalletModalOpen,
        setIsWalletModalOpen,
        walletModalTab,
        setWalletModalTab,
        openWalletModal,
        closeWalletModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
