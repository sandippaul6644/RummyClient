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
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletModalTab, setWalletModalTab] = useState('overview');

  const openWalletModal = (tab = 'overview') => {
    setWalletModalTab(tab);
    setIsWalletModalOpen(true);
  };

  const closeWalletModal = () => {
    setIsWalletModalOpen(false);
  };

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
        socket.emit('user:join', { userId: res.data.data.user._id || res.data.data.user.id });
      }
    } catch {
      localStorage.removeItem('nexus_token');
      setToken(null);
      setUser(null);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

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
