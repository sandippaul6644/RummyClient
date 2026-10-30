import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Copy, Check, Sparkles, Gift, Award, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { sound } from '../utils/sound.js';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

export const ReferEarnPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);
      api
        .get('/users/me/referral')
        .then((res) => {
          if (res.data?.success) {
            setReferralData(res.data.data);
          }
        })
        .catch((err) => console.error('Error fetching referral details:', err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const referralCode =
    user?.referralCode ||
    referralData?.referralCode ||
    (user ? (user.username || 'PLAYER').toUpperCase() + '777' : 'LUCKY777');

  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const cfg = referralData?.config || {};
  const referralBonus = cfg.referralBonus ?? 100;
  const signUpBonus = cfg.signUpBonus ?? 50;
  const qualifyingDeposit = cfg.qualifyingDeposit ?? 100;
  const instantReward = Boolean(cfg.instantRewardOnSignup);

  const totalReferrals = referralData?.totalReferrals ?? 0;
  const totalReward = referralData?.totalReward ?? 0;
  const referralsList = referralData?.referrals || [];

  const handleCopy = () => {
    sound.playClick();
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', padding: '12px 14px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
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
            padding: '7px 14px',
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

        <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} color="#10b981" /> Refer & Earn
        </h1>
      </div>

      {/* Main Promo Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #042f2e 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.45)',
          borderRadius: '22px',
          padding: '24px 20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6), 0 0 20px rgba(16,185,129,0.2)',
          marginBottom: '16px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ fontSize: '36px', marginBottom: '4px' }}>🎁</div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
          Invite Friends & Earn ₹{referralBonus}
        </h2>
        <p style={{ fontSize: '13px', color: '#a7f3d0', margin: '0 0 16px', lineHeight: 1.4 }}>
          {instantReward
            ? 'Earn ₹' + referralBonus + ' instantly in your cash wallet when your friends sign up!'
            : 'Earn ₹' + referralBonus + ' when your friend makes a first deposit of ₹' + qualifyingDeposit + '+.'}
          <br />
          <span style={{ color: '#fff', fontWeight: 800 }}>
            Your friend also receives an instant ₹{signUpBonus} Welcome Bonus!
          </span>
        </p>

        {/* Copy Link Field */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            padding: '5px 6px 5px 14px',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: '#cbd5e1',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
            }}
          >
            {referralLink}
          </span>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#10b981' : 'linear-gradient(135deg, #ffe066, #ffb800)',
              border: 'none',
              borderRadius: '8px',
              color: copied ? '#fff' : '#1e1402',
              fontWeight: 800,
              fontSize: '12px',
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: '10px' }}>
          Your Referral Code: <strong style={{ color: '#fff', letterSpacing: '1px' }}>{referralCode}</strong>
        </div>
      </div>

      {/* Referral Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div
          style={{
            background: '#13192c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Friends Invited
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>
            {totalReferrals}
          </div>
        </div>

        <div
          style={{
            background: '#13192c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            Rewards Earned
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>
            ₹{totalReward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* How it works card */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: '18px',
          padding: '18px',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} color="#fbbf24" /> How to Earn
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>
              1
            </span>
            <span>Share your personal link or code with your friends via WhatsApp, Telegram, or social media.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>
              2
            </span>
            <span>Friend signs up and immediately receives a <strong>₹{signUpBonus} Welcome Bonus</strong>.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>
              3
            </span>
            <span>
              You get credited with <strong>₹{referralBonus}</strong> cash {instantReward ? 'immediately' : `once they deposit ₹${qualifyingDeposit}+`}.
            </span>
          </div>
        </div>
      </div>

      {/* Referrals history list */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: '18px',
          padding: '18px',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' }}>
          Invited Friends ({referralsList.length})
        </div>

        {referralsList.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '16px 0' }}>
            No friends invited yet. Share your link to start earning!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {referralsList.map((ref, idx) => (
              <div
                key={ref._id || idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.25)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
              >
                <div>
                  <div style={{ color: '#f8fafc', fontWeight: 700 }}>
                    Player #{String(ref.referredUserId || '').slice(-6)}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '10px' }}>
                    {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: ref.status === 'rewarded' ? '#34d399' : '#fbbf24',
                      background: ref.status === 'rewarded' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 191, 36, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {ref.status === 'rewarded' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {ref.status === 'rewarded' ? `+₹${ref.rewardAmount || referralBonus}` : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferEarnPage;
