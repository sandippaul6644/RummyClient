import React, { useState } from 'react';
import { Users, Copy, Check, Share2, Sparkles, X, Gift, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { sound } from '../utils/sound.js';

export const ReferEarnModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const referralCode = user ? (user.username || 'USER').toUpperCase() + '777' : 'LUCKY777';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const handleCopy = () => {
    sound.playClick();
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel modal-content"
        style={{
          maxWidth: '520px',
          padding: '24px',
          borderRadius: '24px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          background: 'linear-gradient(180deg, rgba(16, 24, 40, 0.98) 0%, rgba(8, 14, 26, 0.98) 100%)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(16, 185, 129, 0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)'
            }}>
              <Users size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>Refer & Earn Unlimited</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Get lifetime commission from every friend's bet!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '14px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Friends Invited</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>14</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '14px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Commission Earned</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>₹3,250.00</div>
          </div>
        </div>

        {/* Copy Referral Link */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px', display: 'block' }}>
            Your Exclusive Referral Link
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '6px 6px 6px 12px',
            gap: '8px'
          }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {referralLink}
            </span>
            <button
              onClick={handleCopy}
              className="btn-gold"
              style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '8px' }}
            >
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
        </div>

        {/* 3 Tier Commission Structure */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffb800', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={16} /> 3-Level Commission Tiers
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#94a3b8' }}>Tier 1 (Direct)</div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '15px', marginTop: '2px' }}>5% Wagering</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#94a3b8' }}>Tier 2 (Sub)</div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '15px', marginTop: '2px' }}>2% Wagering</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#94a3b8' }}>Tier 3 (Network)</div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '15px', marginTop: '2px' }}>1% Wagering</div>
            </div>
          </div>
        </div>

        {/* Bonus note */}
        <div style={{
          fontSize: '11px',
          color: '#64748b',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <Sparkles size={14} color="#10b981" />
          Friends also receive an instant ₹500 Welcome Bonus upon registration.
        </div>
      </div>
    </div>
  );
};
