import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, ShieldCheck, Wallet, History, LogOut, ArrowRight, Star } from 'lucide-react';
import { sound } from '../utils/sound.js';
import { useAuth } from '../context/AuthContext.jsx';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, wallet, logout, setIsAuthModalOpen, setIsDepositModalOpen, setIsWithdrawModalOpen } = useAuth();

  const balance = wallet ? Number(wallet.balance) : 1250;

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', padding: '10px 12px 30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <button
          onClick={() => {
            sound.playClick();
            navigate('/');
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            color: '#f8fafc',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ChevronLeft size={16} /> Lobby
        </button>

        <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={20} color="#38bdf8" /> My Account
        </h1>
      </div>

      {user ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Profile Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
              border: '1.5px solid rgba(99, 102, 241, 0.35)',
              borderRadius: '20px',
              padding: '18px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 900,
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.2)',
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>

              <div>
                <div style={{ fontSize: '17px', fontWeight: 900, color: '#ffffff' }}>{user.username}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{user.email || 'Verified Player'}</div>
                <div style={{ display: 'inline-block', marginTop: '4px', fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>
                  ✓ Provably Fair Certified
                </div>
              </div>
            </div>
          </div>

          {/* Quick Wallet Actions */}
          <div
            style={{
              background: '#13192c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Real Money Balance</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#ffe066' }}>
                ₹ {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => {
                  sound.playClick();
                  setIsDepositModalOpen(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #00e676, #059669)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '13px',
                  padding: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(0,230,118,0.4)',
                }}
              >
                Deposit
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setIsWithdrawModalOpen(true);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '13px',
                  padding: '10px',
                  cursor: 'pointer',
                }}
              >
                Withdraw
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => {
                sound.playClick();
                navigate('/wallet');
              }}
              style={{
                background: '#13192c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '14px 16px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={18} color="#38bdf8" /> Transaction History
              </div>
              <ArrowRight size={16} color="#64748b" />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                navigate('/vip');
              }}
              style={{
                background: '#13192c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '14px 16px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Star size={18} color="#fbbf24" /> VIP Club Status
              </div>
              <ArrowRight size={16} color="#64748b" />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                logout();
                navigate('/');
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '14px',
                padding: '14px 16px',
                color: '#f87171',
                fontWeight: 800,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginTop: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LogOut size={18} /> Logout
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#13192c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <User size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
            Player Sign In Required
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 18px' }}>
            Login or register to access your wallet, bets history, and VIP perks.
          </p>
          <button
            onClick={() => {
              sound.playClick();
              setIsAuthModalOpen(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #ffe066, #ffb800)',
              border: 'none',
              borderRadius: '14px',
              color: '#1e1402',
              fontWeight: 800,
              fontSize: '14px',
              padding: '12px 24px',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(255, 184, 0, 0.4)',
            }}
          >
            Login / Register Now
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
