import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import {
  Crown,
  Search,
  Gift,
  Star,
  LifeBuoy,
  Home,
  Gamepad2,
  Wallet,
  User,
  LogOut,
  Bell,
  Volume2,
  VolumeX,
  ArrowDownRight,
  Plus,
  Flame
} from 'lucide-react';
import { sound } from '../utils/sound.js';

export const Header = ({
  currentView,
  setCurrentView,
  onOpenDailyRewards,
  onOpenRefer,
  onOpenVIP,
  searchQuery,
  setSearchQuery,
  isSearchOpen,
  setIsSearchOpen,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const {
    user,
    wallet,
    logout,
    setIsAuthModalOpen,
    setIsDepositModalOpen,
    setIsWithdrawModalOpen,
    openWalletModal,
    demoLogin,
  } = useAuth();
  const { openNotificationModal, unreadCount } = useNotifications();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
    sound.playClick();
  };

  // Fallback balance: ₹ 1,250 (from design reference image) or real wallet balance
  const balance = wallet ? Number(wallet.balance) : 1250;

  return (
    <>
      {/* Top Header Navigation */}
      <header
        style={{
          margin: '0 auto',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 60,
          gap: '8px',
          maxWidth: '1280px',
          width: '100%',
          boxSizing: 'border-box',
          background: 'rgba(7, 10, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flexShrink: 0 }}>
          <div
            onClick={() => {
              sound.playClick();
              navigate('/');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Crown
              size={30}
              color="#ffe066"
              fill="#f59e0b"
              style={{
                filter: 'drop-shadow(0 0 12px rgba(255, 224, 102, 0.95))',
                flexShrink: 0,
              }}
            />

            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '20px',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.1,
                  color: '#ffffff',
                  textShadow: '0 2px 10px rgba(255, 224, 102, 0.4)',
                }}
              >
                LuckyPlay
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#c4b5fd',
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                  whiteSpace: 'nowrap',
                }}
              >
                Play · Enjoy · Win
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            className="mobile-hide"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <button
              onClick={() => {
                sound.playClick();
                navigate('/');
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '20px',
                background:
                  currentPath === '/'
                    ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                    : 'transparent',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow:
                  currentPath === '/'
                    ? '0 0 15px rgba(99, 102, 241, 0.4)'
                    : 'none',
              }}
            >
              <Home size={14} /> Home
            </button>

            <button
              onClick={() => {
                sound.playClick();
                navigate('/colorprediction');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background:
                  currentPath === '/colorprediction' || currentPath === '/colour'
                    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                    : 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              Colour
            </button>

            <button
              onClick={() => {
                sound.playClick();
                navigate('/aviator');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background:
                  currentPath === '/aviator' || currentPath === '/crash'
                    ? 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)'
                    : 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fb7185',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>🚀</span>
              Aviator
            </button>

            <button
              onClick={() => {
                sound.playClick();
                navigate('/dice');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background:
                  currentPath === '/dice' || currentPath === '/mines'
                    ? 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)'
                    : 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>🎲</span>
              Dice
            </button>

            <button
              onClick={() => {
                sound.playClick();
                navigate('/promotions');
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '20px',
                background:
                  currentPath === '/promotions'
                    ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                    : 'transparent',
                border: 'none',
                color: currentPath === '/promotions' ? '#fff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Gift size={14} /> Promotions
            </button>

            <button
              onClick={() => {
                sound.playClick();
                navigate('/vip');
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '20px',
                background:
                  currentPath === '/vip'
                    ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                    : 'transparent',
                border: 'none',
                color: currentPath === '/vip' ? '#fff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Star size={14} color="#ffb800" /> VIP
            </button>

            <button
              onClick={() => {
                sound.playClick();
                navigate('/refer');
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '20px',
                background:
                  currentPath === '/refer'
                    ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                    : 'transparent',
                border: 'none',
                color: currentPath === '/refer' ? '#fff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <LifeBuoy size={14} /> Support
            </button>
          </nav>
        </div>

        {/* Right Side Header Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Live Search Toggle - Desktop Only (on mobile reference it's hidden) */}
          <button
            onClick={() => {
              sound.playClick();
              setIsSearchOpen(!isSearchOpen);
            }}
            className="mobile-hide"
            style={{
              background: isSearchOpen
                ? 'rgba(99, 102, 241, 0.25)'
                : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: isSearchOpen ? '#818cf8' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Search Games"
          >
            <Search size={16} />
          </button>

          {/* Sound Toggle (Desktop) */}
          <button
            onClick={toggleSound}
            className="mobile-hide"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              color: soundEnabled ? '#818cf8' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Notification Bell (Mobile & Desktop) */}
          <button
            onClick={() => {
              sound.playClick();
              openNotificationModal();
            }}
            style={{
              background: '#140f2e',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              color: '#e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
              transition: 'transform 0.2s, background 0.2s',
            }}
            title="Notifications & Alerts"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Wallet Balance Pill */}
          <div
            onClick={() => {
              sound.playClick();
              if (openWalletModal) openWalletModal('overview');
              else setIsDepositModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#140f2e',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '14px',
              padding: '4px 5px 4px 11px',
              gap: '8px',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255,255,255,0.08)',
            }}
            title="LuckyPlay Wallet & Bankroll"
          >
            <Wallet size={16} color="#38bdf8" style={{ filter: 'drop-shadow(0 0 6px #38bdf8)' }} />
            <span
              className="font-mono"
              style={{
                fontWeight: 800,
                fontSize: '14px',
                color: '#ffffff',
                letterSpacing: '-0.2px',
                whiteSpace: 'nowrap',
              }}
            >
              ₹ {balance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>

            {/* Vibrant Green "+" Deposit Button */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                if (openWalletModal) openWalletModal('deposit');
                else setIsDepositModalOpen(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #00e676 0%, #059669 100%)',
                color: '#ffffff',
                width: '26px',
                height: '26px',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(0, 230, 118, 0.65)',
                flexShrink: 0,
                fontWeight: 900,
              }}
              title="Deposit Virtual Chips"
            >
              <Plus size={16} strokeWidth={3.5} />
            </div>
          </div>

          {/* Desktop "Deposit" Button */}
          <button
            onClick={() => {
              sound.playClick();
              if (openWalletModal) openWalletModal('deposit');
              else setIsDepositModalOpen(true);
            }}
            className="btn-primary btn-green mobile-hide"
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              borderRadius: '20px',
              fontWeight: 800,
            }}
          >
            Deposit
          </button>

          {/* User Profile / Auth Button (Desktop Only: Mobile uses bottom navigation bar) */}
          {user ? (
            <div className="mobile-hide" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                onClick={() => {
                  sound.playClick();
                  navigate('/profile');
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '14px',
                  color: '#fff',
                }}
                title={user.username}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  logout();
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  padding: '7px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="mobile-hide" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => {
                  sound.playClick();
                  setIsAuthModalOpen(true);
                }}
                className="btn-gold"
                style={{
                  padding: '7px 12px',
                  fontSize: '12px',
                  borderRadius: '18px',
                }}
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Realtime Search Bar Dropdown */}
      {isSearchOpen && (
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '8px 18px',
            background: 'rgba(11, 16, 30, 0.95)',
            borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
            position: 'sticky',
            top: '61px',
            zIndex: 55,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '6px 12px',
              gap: '10px',
            }}
          >
            <Search size={16} color="#818cf8" />
            <input
              type="text"
              placeholder="Search by game name (e.g. Colour, Aviator, Dice, Slots, Teen Patti)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                width: '100%',
                outline: 'none',
                fontSize: '13px',
                fontFamily: 'inherit',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

    </>
  );
};
