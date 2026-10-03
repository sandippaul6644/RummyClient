import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Crown, Star, ShieldCheck, Zap, Award } from 'lucide-react';
import { sound } from '../utils/sound.js';
import { useAuth } from '../context/AuthContext.jsx';

export const VIPPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const tiers = [
    { level: 'Bronze', turnover: '₹0', cashback: '5%', color: '#cd7f32', perk: 'Daily Free Lucky Spin' },
    { level: 'Silver', turnover: '₹50,000', cashback: '8%', color: '#94a3b8', perk: 'Faster Withdrawals (5 mins)' },
    { level: 'Gold', turnover: '₹2,00,000', cashback: '12%', color: '#fbbf24', perk: 'Dedicated Account Manager' },
    { level: 'Platinum', turnover: '₹10,00,000', cashback: '15%', color: '#38bdf8', perk: 'VIP Birthday & Festival Gifts' },
    { level: 'Diamond Crown', turnover: '₹50,00,000', cashback: '20%', color: '#ec4899', perk: 'Unlimited Zero-Fee Payouts' },
  ];

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
          <Crown size={20} color="#fbbf24" /> VIP Club
        </h1>
      </div>

      {/* User Current Tier Status */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2e1065 0%, #1e1b4b 100%)',
          border: '1.5px solid rgba(251, 191, 36, 0.4)',
          borderRadius: '20px',
          padding: '18px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          marginBottom: '14px',
          textAlign: 'center',
        }}
      >
        <Crown size={36} color="#ffe066" style={{ filter: 'drop-shadow(0 0 12px rgba(255, 224, 102, 0.8))', marginBottom: '6px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: '0 0 4px' }}>
          {user ? `Welcome VIP ${user.username}` : 'Join LuckyPlay VIP'}
        </h2>
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px' }}>
          Wager to level up and unlock luxury bonuses & instant cashback
        </p>

        {/* Progress Bar */}
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', height: '10px', overflow: 'hidden', padding: '1px' }}>
          <div style={{ width: '35%', height: '100%', borderRadius: '8px', background: 'linear-gradient(90deg, #ffe066, #ffb800)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#cbd5e1', marginTop: '4px', fontWeight: 700 }}>
          <span>Current: Bronze</span>
          <span>Next: Silver (35%)</span>
        </div>
      </div>

      {/* VIP Tiers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tiers.map((t, i) => (
          <div
            key={i}
            style={{
              background: '#13192c',
              border: `1px solid ${t.color}35`,
              borderRadius: '16px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: `${t.color}20`,
                  border: `1px solid ${t.color}60`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: t.color,
                  fontWeight: 900,
                  fontSize: '14px',
                }}
              >
                #{i + 1}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>{t.level}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t.perk}</div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, color: t.color }}>{t.cashback} Back</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Wager {t.turnover}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VIPPage;
