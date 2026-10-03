import React from 'react';
import { Crown, Star, ShieldCheck, Zap, Gift, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const VIPModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  if (!isOpen) return null;

  const vipTiers = [
    { level: 'Bronze', color: '#cd7f32', minWager: '₹0', cashback: '0.5%', bonus: '₹100' },
    { level: 'Silver', color: '#cbd5e1', minWager: '₹10,000', cashback: '1.0%', bonus: '₹500' },
    { level: 'Gold', color: '#ffb800', minWager: '₹50,000', cashback: '2.0%', bonus: '₹2,500', current: true },
    { level: 'Platinum', color: '#38bdf8', minWager: '₹2,00,000', cashback: '3.5%', bonus: '₹10,000' },
    { level: 'Diamond', color: '#a855f7', minWager: '₹10,00,000', cashback: '5.0%', bonus: '₹50,000' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel modal-content"
        style={{
          maxWidth: '540px',
          padding: '24px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 184, 0, 0.4)',
          background: 'linear-gradient(180deg, rgba(22, 28, 48, 0.98) 0%, rgba(10, 14, 25, 0.98) 100%)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 35px rgba(255, 184, 0, 0.3)'
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
              background: 'linear-gradient(135deg, #ffe066 0%, #ffb800 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(255, 184, 0, 0.5)'
            }}>
              <Crown size={22} color="#1e1402" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>LuckyPlay VIP Club</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Exclusive perks, higher withdrawal limits & VIP cashback!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tiers List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
          {vipTiers.map((tier) => (
            <div
              key={tier.level}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: '14px',
                background: tier.current ? 'rgba(255, 184, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: tier.current ? '1.5px solid #ffb800' : '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: tier.color, boxShadow: `0 0 8px ${tier.color}` }} />
                <div>
                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '14px' }}>
                    {tier.level}
                    {tier.current && (
                      <span style={{ marginLeft: '8px', fontSize: '10px', background: '#ffb800', color: '#000', padding: '2px 6px', borderRadius: '8px', fontWeight: 900 }}>
                        ACTIVE TIER
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Min Wager: {tier.minWager}</div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#10b981', fontWeight: 800, fontSize: '13px' }}>{tier.cashback} Cashback</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Bonus: {tier.bonus}</div>
              </div>
            </div>
          ))}
        </div>

        {/* VIP Perks */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '14px',
          padding: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
            <Zap size={14} color="#818cf8" /> Instant Withdrawals
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
            <Gift size={14} color="#ffb800" /> Weekly Free Spins
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
            <ShieldCheck size={14} color="#10b981" /> Dedicated VIP Host
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
            <Star size={14} color="#ec4899" /> Custom High Limits
          </div>
        </div>
      </div>
    </div>
  );
};
