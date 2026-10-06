import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, ShieldCheck, Wallet, History, LogOut, ArrowRight, Star, Upload, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { sound } from '../utils/sound.js';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const KYC_STATUS_CONFIG = {
  not_submitted: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)',  icon: AlertCircle,    label: 'Not Submitted',  desc: 'Upload an address proof to verify your account' },
  submitted:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.2)',   icon: Clock,          label: 'Under Review',   desc: 'Your documents are being reviewed. We\'ll notify you soon.' },
  under_review:  { color: '#818cf8', bg: 'rgba(129,140,248,0.1)',  border: 'rgba(129,140,248,0.2)',  icon: Clock,          label: 'Under Review',   desc: 'Our team is verifying your documents.' },
  approved:      { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.2)',   icon: CheckCircle,    label: 'Verified ✓',     desc: 'Your identity has been verified successfully.' },
  rejected:      { color: '#f87171', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.2)',    icon: XCircle,        label: 'Rejected',       desc: 'Documents were rejected. Please re-upload with correct documents.' },
};

const DOC_TYPES = [
  { value: 'aadhaar',           label: 'Aadhaar Card'     },
  { value: 'pan',               label: 'PAN Card'         },
  { value: 'passport',          label: 'Passport'         },
  { value: 'voter_id',          label: 'Voter ID'         },
  { value: 'driving_license',   label: 'Driving License'  },
  { value: 'utility_bill',      label: 'Utility Bill'     },
  { value: 'bank_statement',    label: 'Bank Statement'   },
];

const KycSection = () => {
  const [kycData,   setKycData]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg,       setMsg]       = useState({ text: '', error: false });
  const [docType,   setDocType]   = useState('aadhaar');
  const [docNumber, setDocNumber] = useState('');
  const [files,     setFiles]     = useState([]);
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    api.get('/kyc/status')
      .then(r => { if (r.data?.success) setKycData(r.data.data); })
      .catch(() => { setKycData({ kycStatus: 'not_submitted', submission: null }); })
      .finally(() => setLoading(false));
  }, []);

  const flash = (text, error = false) => {
    setMsg({ text, error });
    setTimeout(() => setMsg({ text: '', error: false }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) return flash('Please select at least one document file', true);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('documentType', docType);
      fd.append('documentNumber', docNumber);
      files.forEach(f => fd.append('documents', f));
      const res = await api.post('/kyc/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.success) {
        flash('Documents submitted! We\'ll review within 24–48 hours.');
        setKycData({ kycStatus: 'submitted', submission: res.data.data });
        setFiles([]);
        setDocNumber('');
      }
    } catch (err) {
      const msg503 = err.response?.status === 503
        ? 'Server is starting up — please wait a moment and try again.'
        : err.response?.data?.message || 'Upload failed. Please try again.';
      flash(msg503, true);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (idx) => setFiles(f => f.filter((_, i) => i !== idx));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files)
      .filter(f => ['image/jpeg','image/png','image/jpg','application/pdf'].includes(f.type))
      .slice(0, 3 - files.length);
    setFiles(prev => [...prev, ...dropped].slice(0, 3));
  };

  const status    = kycData?.kycStatus || 'not_submitted';
  const cfg       = KYC_STATUS_CONFIG[status] || KYC_STATUS_CONFIG.not_submitted;
  const Icon      = cfg.icon;
  const canUpload = status === 'not_submitted' || status === 'rejected';

  const fieldStyle = {
    width: '100%', padding: '11px 14px',
    background: '#0d1526',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px', color: '#f1f5f9',
    fontSize: '13px', outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  if (loading) return (
    <div style={{ background: 'linear-gradient(135deg,#111827,#0f172a)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '18px', padding: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldCheck size={16} color="#6366f1" />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#6366f1' }}>KYC Verification</span>
      </div>
      <div style={{ marginTop: '12px', height: '52px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  );

  return (
    <div style={{ background: 'linear-gradient(135deg,#111827 0%,#0f172a 100%)', border: `1px solid ${canUpload ? 'rgba(99,102,241,0.3)' : cfg.border}`, borderRadius: '18px', overflow: 'hidden' }}>

      {/* ── Gradient header bar ── */}
      <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.1))', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ background: 'rgba(99,102,241,0.2)', borderRadius: '10px', padding: '7px', display: 'flex' }}>
          <ShieldCheck size={16} color="#818cf8" />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>KYC Verification</div>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Identity & address document check</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          <Icon size={11} color={cfg.color} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
        </div>
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Status description */}
        <div style={{ padding: '12px 14px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <Icon size={18} color={cfg.color} style={{ marginTop: '1px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: cfg.color, marginBottom: '2px' }}>{cfg.label}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>{cfg.desc}</div>
          </div>
          {status === 'approved' && (
            <div style={{ marginLeft: 'auto', padding: '3px 10px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: '20px', fontSize: '10px', fontWeight: 800, color: '#34d399', whiteSpace: 'nowrap', flexShrink: 0 }}>
              ✓ VERIFIED
            </div>
          )}
        </div>

        {/* Rejection reason */}
        {status === 'rejected' && kycData?.submission?.rejectionReason && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', fontSize: '12px', color: '#fca5a5', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700 }}>Rejection reason: </span>{kycData.submission.rejectionReason}
          </div>
        )}

        {/* Upload form */}
        {canUpload && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Step label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#818cf8' }}>1</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Select Document</span>
            </div>

            {/* Document Type — dark styled */}
            <div style={{ position: 'relative' }}>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                style={{ ...fieldStyle, appearance: 'none', WebkitAppearance: 'none', paddingRight: '36px', cursor: 'pointer' }}
              >
                {DOC_TYPES.map(d => (
                  <option key={d.value} value={d.value} style={{ background: '#0d1526', color: '#f1f5f9' }}>
                    {d.label}
                  </option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>▾</div>
            </div>

            {/* Document Number */}
            <input
              value={docNumber}
              onChange={e => setDocNumber(e.target.value)}
              placeholder="Document number (optional) — e.g. XXXX XXXX XXXX"
              style={fieldStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />

            {/* Step 2 label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#818cf8' }}>2</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Upload Files</span>
              <span style={{ fontSize: '10px', color: '#475569' }}>JPEG · PNG · PDF · max 5 MB each</span>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? 'rgba(99,102,241,0.8)' : 'rgba(99,102,241,0.3)'}`,
                borderRadius: '14px',
                padding: '20px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.04)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>📁</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8', marginBottom: '4px' }}>
                {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Tap to choose or drag & drop'}
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>Front side required · Back optional · Max 3 files</div>
            </div>
            <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/jpg,application/pdf"
              style={{ display: 'none' }}
              onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)].slice(0, 3))} />

            {/* File pills with remove */}
            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '16px' }}>{f.type === 'application/pdf' ? '📄' : '🖼'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: '#c7d2fe', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                      <div style={{ fontSize: '10px', color: '#475569' }}>{(f.size / 1024).toFixed(0)} KB</div>
                    </div>
                    <button type="button" onClick={() => removeFile(i)}
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Flash message */}
            {msg.text && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, background: msg.error ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)', border: `1px solid ${msg.error ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`, color: msg.error ? '#f87171' : '#34d399' }}>
                {msg.text}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={uploading || files.length === 0}
              style={{
                padding: '13px',
                background: uploading || files.length === 0
                  ? 'rgba(99,102,241,0.25)'
                  : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                border: 'none',
                borderRadius: '14px',
                color: uploading || files.length === 0 ? '#4b5563' : '#fff',
                fontWeight: 800,
                fontSize: '14px',
                cursor: uploading || files.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: uploading || files.length === 0 ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                transition: 'all 0.2s',
                letterSpacing: '-0.3px',
              }}
            >
              {uploading ? '⏳ Submitting…' : '🔒 Submit for Verification'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

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

          {/* KYC Verification */}
          <KycSection />
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
