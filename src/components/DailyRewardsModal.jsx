import React, { useState } from 'react';
import { Gift, CheckCircle2, Sparkles, X, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { sound } from '../utils/sound.js';
import { api } from '../services/api.js';

export const DailyRewardsModal = ({ isOpen, onClose }) => {
  const { user, wallet, setWallet } = useAuth();
  const [claimedDay, setClaimedDay] = useState(() => {
    return parseInt(localStorage.getItem('lucky_claimed_day') || '0', 10);
  });
  const [loading, setLoading] = useState(false);
  const [rewardMsg, setRewardMsg] = useState('');

  if (!isOpen) return null;

  const rewardDays = [
    { day: 1, amount: 50, icon: '🪙' },
    { day: 2, amount: 100, icon: '💰' },
    { day: 3, amount: 150, icon: '💎' },
    { day: 4, amount: 200, icon: '🎁' },
    { day: 5, amount: 300, icon: '⚡' },
    { day: 6, amount: 500, icon: '🔥' },
    { day: 7, amount: 1000, icon: '👑', jackpot: true },
  ];

  const currentActiveDay = (claimedDay % 7) + 1;

  const handleClaim = async (dayItem) => {
    if (dayItem.day !== currentActiveDay) return;
    setLoading(true);
    sound.playWin();

    try {
      if (user) {
        // Credit to backend wallet if user is logged in
        const res = await api.post('/wallet/deposit', {
          amount: dayItem.amount,
          paymentMethod: 'daily_reward'
        });
        if (res.data?.data?.wallet) {
          setWallet(res.data.data.wallet);
        }
      } else if (wallet) {
        // Update local wallet in demo mode
        setWallet({
          ...wallet,
          balance: Number(wallet.balance) + dayItem.amount
        });
      }

      localStorage.setItem('lucky_claimed_day', String(dayItem.day));
      setClaimedDay(dayItem.day);
      setRewardMsg(`🎉 Congratulations! You claimed ₹${dayItem.amount} into your bankroll!`);
      setTimeout(() => {
        setRewardMsg('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setRewardMsg(`🎉 Claimed ₹${dayItem.amount} bonus!`);
      localStorage.setItem('lucky_claimed_day', String(dayItem.day));
      setClaimedDay(dayItem.day);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel modal-content"
        style={{
          maxWidth: '520px',
          padding: '24px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 184, 0, 0.3)',
          background: 'linear-gradient(180deg, rgba(20, 24, 40, 0.98) 0%, rgba(10, 14, 25, 0.98) 100%)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255, 184, 0, 0.2)'
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
              <Gift size={22} color="#1e1402" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>Daily Login Rewards</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Check in daily to unlock bigger multipliers & cash!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {rewardMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center',
            color: '#34d399',
            fontSize: '13px',
            fontWeight: 800,
            marginBottom: '16px'
          }}>
            {rewardMsg}
          </div>
        )}

        {/* 7 Days Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {rewardDays.map((item) => {
            const isClaimed = item.day <= claimedDay;
            const isToday = item.day === currentActiveDay;
            const isLocked = item.day > currentActiveDay;

            return (
              <div
                key={item.day}
                style={{
                  gridColumn: item.jackpot ? 'span 2' : 'span 1',
                  background: isToday
                    ? 'linear-gradient(145deg, rgba(255, 184, 0, 0.18) 0%, rgba(245, 158, 11, 0.08) 100%)'
                    : isClaimed
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isToday
                    ? '1.5px solid #ffb800'
                    : isClaimed
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '14px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  boxShadow: isToday ? '0 0 16px rgba(255, 184, 0, 0.35)' : 'none'
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 800, color: isToday ? '#ffb800' : '#64748b', textTransform: 'uppercase' }}>
                  Day {item.day}
                </span>

                <div style={{ fontSize: '24px', margin: '4px 0' }}>{item.icon}</div>

                <div style={{ fontSize: '14px', fontWeight: 900, color: isClaimed ? '#10b981' : '#fff' }}>
                  ₹{item.amount}
                </div>

                {isClaimed ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#10b981', marginTop: '4px', fontWeight: 800 }}>
                    <CheckCircle2 size={12} /> Claimed
                  </div>
                ) : isToday ? (
                  <button
                    onClick={() => handleClaim(item)}
                    disabled={loading}
                    className="btn-gold"
                    style={{
                      marginTop: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      borderRadius: '8px',
                      width: '100%'
                    }}
                  >
                    {loading ? '...' : 'Claim'}
                  </button>
                ) : (
                  <span style={{ fontSize: '10px', color: '#475569', marginTop: '4px', fontWeight: 700 }}>
                    Locked
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Info box */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Crown size={22} color="#ffe066" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
            Reach Day 7 streak to trigger the <strong style={{ color: '#ffb800' }}>₹1,000 Crown Mega Bonus</strong>. Log in consecutive days without interruption.
          </div>
        </div>
      </div>
    </div>
  );
};
