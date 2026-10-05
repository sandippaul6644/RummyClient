import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { X, Sparkles, Shield, User, Lock, Mail, Phone, Tag, Eye, EyeOff } from 'lucide-react';
import { sound } from '../utils/sound.js';

// ── Password strength helper ──────────────────────────────────────────────────
const getPasswordStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak',   color: '#ef4444' };
  if (score <= 3) return { score, label: 'Fair',   color: '#f97316' };
  if (score <= 4) return { score, label: 'Good',   color: '#eab308' };
  return              { score, label: 'Strong', color: '#22c55e' };
};

export const AuthModal = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register, demoLogin } = useAuth();

  const [isRegister, setIsRegister] = useState(false);

  // Login fields
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [fullName,        setFullName]        = useState('');
  const [email,           setEmail]           = useState('');
  const [phone,           setPhone]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode,    setReferralCode]    = useState('');

  // UI state
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error,               setError]               = useState('');
  const [loading,             setLoading]             = useState(false);

  if (!isAuthModalOpen) return null;

  const pwStrength = isRegister ? getPasswordStrength(password) : null;

  const resetFields = () => {
    setFullName(''); setEmail(''); setPhone('');
    setPassword(''); setConfirmPassword(''); setReferralCode('');
    setUsernameOrEmail(''); setLoginPassword('');
    setShowPassword(false); setShowConfirmPassword(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side password match check (belt-and-suspenders alongside server Joi check)
    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (isRegister && !/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number starting with 6–9');
      return;
    }

    setLoading(true);
    sound.playClick();
    try {
      if (isRegister) {
        await register({ fullName, email, phone, password, confirmPassword, referralCode });
      } else {
        await login(usernameOrEmail, loginPassword);
      }
      sound.playWin();
      resetFields();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors?.length) {
        setError(apiErrors.map(e => e.message).join(' · '));
      } else {
        setError(err.response?.data?.message || err.message || 'Authentication failed');
      }
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
      resetFields();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    }
  };

  const switchMode = () => {
    sound.playClick();
    setIsRegister(!isRegister);
    resetFields();
  };

  // ── Shared sub-components ─────────────────────────────────────────────────
  const Label = ({ children, optional }) => (
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
      {children}
      {optional && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#475569', fontWeight: 400 }}>(Optional)</span>}
    </label>
  );

  const IconInput = ({ icon: Icon, type = 'text', placeholder, value, onChange, required, minLength, maxLength, pattern, autoComplete, right }) => (
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        className="glass-input"
        style={{ width: '100%', paddingLeft: '38px', paddingRight: right ? '40px' : undefined }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        autoComplete={autoComplete}
      />
      <Icon size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b', pointerEvents: 'none' }} />
      {right}
    </div>
  );

  const ToggleEye = ({ show, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      style={{ position: 'absolute', right: '12px', top: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}
      tabIndex={-1}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className="modal-overlay" onClick={() => { setIsAuthModalOpen(false); resetFields(); }}>
      <div
        className="glass-panel modal-content"
        style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255, 184, 0, 0.3)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={() => { sound.playClick(); setIsAuthModalOpen(false); resetFields(); }}
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', zIndex: 1 }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', marginBottom: '10px' }}>
            <Shield size={28} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            {isRegister ? 'Create Player Account' : 'Welcome Back to Nexus'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
            {isRegister ? 'Join the next generation provably fair casino' : 'Enter your credentials to access your live bankroll'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* ── REGISTER FORM ── */}
        {isRegister ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>

            {/* Full Name */}
            <div>
              <Label>Full Name</Label>
              <IconInput icon={User} placeholder="e.g. Rahul Sharma" value={fullName} onChange={e => setFullName(e.target.value)} required minLength={2} maxLength={100} autoComplete="name" />
            </div>

            {/* Email */}
            <div>
              <Label>Email Address</Label>
              <IconInput icon={Mail} type="email" placeholder="player@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            {/* Mobile */}
            <div>
              <Label>Mobile Number</Label>
              <IconInput icon={Phone} type="tel" placeholder="10-digit mobile (e.g. 9876543210)" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} required minLength={10} maxLength={10} autoComplete="tel" />
              {phone && !/^[6-9]\d{9}$/.test(phone) && (
                <p style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>Must start with 6–9 and be exactly 10 digits</p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label>Password</Label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '38px', paddingRight: '40px' }}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required minLength={8} autoComplete="new-password"
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b', pointerEvents: 'none' }} />
                <ToggleEye show={showPassword} onToggle={() => setShowPassword(v => !v)} />
              </div>
              {/* Strength bar */}
              {password && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '3px' }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= pwStrength.score ? pwStrength.color : 'rgba(255,255,255,0.1)', transition: 'background 0.2s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '10px', color: pwStrength.color, fontWeight: 600 }}>{pwStrength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label>Confirm Password</Label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '38px', paddingRight: '40px', borderColor: confirmPassword && confirmPassword !== password ? 'rgba(239,68,68,0.6)' : undefined }}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required autoComplete="new-password"
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b', pointerEvents: 'none' }} />
                <ToggleEye show={showConfirmPassword} onToggle={() => setShowConfirmPassword(v => !v)} />
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>Passwords do not match</p>
              )}
            </div>

            {/* Referral Code */}
            <div>
              <Label optional>Referral Code</Label>
              <IconInput icon={Tag} placeholder="Friend's referral code" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} autoComplete="off" />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '4px', padding: '12px' }}
              disabled={loading || (confirmPassword && confirmPassword !== password)}
            >
              {loading ? 'Creating Account…' : 'Register & Claim ₹1,000'}
            </button>
          </form>

        ) : (
        /* ── LOGIN FORM ── */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Username or Email */}
            <div>
              <Label>Username or Email</Label>
              <IconInput icon={User} placeholder="Username or email address" value={usernameOrEmail} onChange={e => setUsernameOrEmail(e.target.value)} required autoComplete="username" />
            </div>

            {/* Password */}
            <div>
              <Label>Password</Label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '38px', paddingRight: '40px' }}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required autoComplete="current-password"
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b', pointerEvents: 'none' }} />
                <ToggleEye show={showPassword} onToggle={() => setShowPassword(v => !v)} />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '6px', padding: '12px' }} disabled={loading}>
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Quick demo buttons */}
        <div style={{ margin: '18px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Quick Demo Access</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button type="button" onClick={() => handleQuickDemo('user')}
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Sparkles size={14} /> Demo Player
          </button>
          <button type="button" onClick={() => handleQuickDemo('admin')}
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Shield size={14} /> Demo Admin
          </button>
        </div>

        {/* Toggle mode */}
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#94a3b8' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" onClick={switchMode}
            style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
            {isRegister ? 'Sign In' : 'Register Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
