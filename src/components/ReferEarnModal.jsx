import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, Sparkles, X, Gift, Award, TrendingUp, ShieldCheck, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { sound } from '../utils/sound.js';
import { api } from '../services/api.js';

export const ReferEarnModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      api
        .get('/users/me/referral')
        .then((res) => {
          if (res.data?.success) {
            setReferralData(res.data.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const referralCode =
    user?.referralCode ||
    referralData?.referralCode ||
    (user ? (user.username || 'USER').toUpperCase() + '777' : 'LUCKY777');

  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const cfg = referralData?.config || {};
  const referralBonus = cfg.referralBonus ?? 100;
  const signUpBonus = cfg.signUpBonus ?? 50;
  const qualifyingDeposit = cfg.qualifyingDeposit ?? 100;
  const instantReward = Boolean(cfg.instantRewardOnSignup);

  const totalReferrals = referralData?.totalReferrals ?? 0;
  const totalReward = referralData?.totalReward ?? 0;

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
          border: '1px solid rgba(16, 185, 129, 0.35)',
          background: 'linear-gradient(180deg, rgba(16, 24, 40, 0.98) 0%, rgba(8, 14, 26, 0.98) 100%)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(16, 185, 129, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.5)',
              }}
            >
              <Users size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>
                Refer & Earn ₹{referralBonus}
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
                {instantReward
                  ? '⚡ Instant rewards credited directly to your cash wallet!'
                  : `🎯 Rewarded when friends make a first deposit of ₹${qualifyingDeposit}+`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Highlight Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.3))',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gift size={20} color="#34d399" />
            <div style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 800 }}>
              You Get: <span style={{ color: '#34d399' }}>₹{referralBonus}</span> • Friend Gets:{' '}
              <span style={{ color: '#38bdf8' }}>₹{signUpBonus}</span>
            </div>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              background: instantReward ? 'rgba(245, 158, 11, 0.2)' : 'rgba(52, 211, 153, 0.2)',
              color: instantReward ? '#fbbf24' : '#34d399',
            }}
          >
            {instantReward ? 'INSTANT' : `MIN ₹${qualifyingDeposit}`}
          </span>
        </div>

        {/* Real Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
              Friends Invited
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>
              {totalReferrals}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
              Total Earned
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>
              ₹{totalReward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Copy Referral Link */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '12px', fontWeight: 800, color: '#cbd5e1', marginBottom: '8px', display: 'block' }}>
            Your Exclusive Referral Link
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '6px 6px 6px 12px',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                fontFamily: 'monospace',
              }}
            >
              {referralLink}
            </span>
            <button
              onClick={handleCopy}
              className="btn-gold"
              style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '8px' }}
            >
              {copied ? (
                <>
                  <Check size={14} /> Copied
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy
                </>
              )}
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
            Referral Code: <strong style={{ color: '#fbbf24', letterSpacing: '1px' }}>{referralCode}</strong>
          </div>
        </div>

        {/* Commission Feature Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '16px',
          }}
        >
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
        <div
          style={{
            fontSize: '11px',
            color: '#64748b',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Sparkles size={14} color="#10b981" />
          Friends also receive an instant ₹{signUpBonus} Welcome Bonus upon registration.
        </div>
      </div>
    </div>
  );
};
