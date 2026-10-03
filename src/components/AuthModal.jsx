import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { X, Sparkles, Shield, User, Lock, Mail } from 'lucide-react';
import { sound } from '../utils/sound.js';

export const AuthModal = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register, demoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    sound.playClick();
    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(username || email, password);
      }
      sound.playWin();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setError('');
    sound.playClick();
    try {
      await demoLogin(role);
      sound.playWin();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
      <div
        className="glass-panel modal-content"
        style={{
          padding: '24px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 184, 0, 0.3)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { sound.playClick(); setIsAuthModalOpen(false); }}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '10px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            marginBottom: '10px'
          }}>
            <Shield size={28} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            {isRegister ? 'Create Player Account' : 'Welcome Back to Nexus'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
            {isRegister ? 'Join the next generation provably fair casino' : 'Enter your credentials to access your live bankroll'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="glass-input"
                style={{ width: '100%', paddingLeft: '38px' }}
                placeholder="e.g. LuckyAce"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
            </div>
          </div>

          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '38px' }}
                  placeholder="player@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="glass-input"
                style={{ width: '100%', paddingLeft: '38px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '6px', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isRegister ? 'Register & Claim ₹1,000' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '18px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Quick Demo Access</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleQuickDemo('user')}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '8px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} /> Demo Player
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('admin')}
            style={{
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#c084fc',
              padding: '8px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Shield size={14} /> Demo Admin
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#94a3b8' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => { sound.playClick(); setIsRegister(!isRegister); setError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#818cf8',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isRegister ? 'Sign In' : 'Register Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
