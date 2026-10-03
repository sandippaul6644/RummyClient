import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Gift, Sparkles, Crown, Star, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/sound.js';
import { useAuth } from '../context/AuthContext.jsx';

export const PromotionsPage = () => {
  const navigate = useNavigate();
  const { user, setIsDepositModalOpen, setIsAuthModalOpen } = useAuth();

  const promotions = [
    {
      id: 'welcome',
      title: '100% Welcome Bonus up to ₹500',
      badge: 'NEW PLAYERS',
      badgeColor: '#ec4899',
      desc: 'Double your first deposit instantly and get free spins on Golden Slots!',
      tag: 'Code: WELCOME500',
      actionText: 'Claim Bonus',
      action: () => {
        sound.playClick();
        if (!user) setIsAuthModalOpen(true);
        else setIsDepositModalOpen(true);
      },
      gradient: 'linear-gradient(135deg, #4a044e 0%, #3b0764 50%, #1e1b4b 100%)',
      borderColor: 'rgba(217, 70, 239, 0.45)',
    },
    {
      id: 'daily',
      title: 'Daily Streak Mystery Rewards',
      badge: 'DAILY CASH',
      badgeColor: '#eab308',
      desc: 'Log in every 24 hours to open a mystery treasure chest with cash bonuses up to ₹1,000!',
      tag: 'Day 1 to Day 7 Streak',
      actionText: 'Open Chest',
      action: () => {
        sound.playClick();
        if (!user) setIsAuthModalOpen(true);
        else setIsDepositModalOpen(true);
      },
      gradient: 'linear-gradient(135deg, #2e1065 0%, #172554 100%)',
      borderColor: 'rgba(168, 85, 247, 0.45)',
    },
    {
      id: 'cashback',
      title: 'Weekly 15% VIP Loss Cashback',
      badge: 'VIP BENEFIT',
      badgeColor: '#10b981',
      desc: 'Never worry about bad luck! Receive 15% automatic cashback credited every Monday morning.',
      tag: 'Zero Wagering',
      actionText: 'View VIP Status',
      action: () => {
        sound.playClick();
        navigate('/vip');
      },
      gradient: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
      borderColor: 'rgba(16, 185, 129, 0.45)',
    },
    {
      id: 'refer',
      title: 'Refer a Friend & Earn ₹250',
      badge: 'UNLIMITED',
      badgeColor: '#38bdf8',
      desc: 'Get ₹250 instantly when your friend deposits + 5% lifetime revenue share on every wager.',
      tag: 'Instant Bank Payout',
      actionText: 'Invite Friends',
      action: () => {
        sound.playClick();
        navigate('/refer');
      },
      gradient: 'linear-gradient(135deg, #0c4a6e 0%, #082f49 100%)',
      borderColor: 'rgba(56, 189, 248, 0.45)',
    },
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
          <Gift size={20} color="#ec4899" /> Promotions
        </h1>
      </div>

      {/* Promo List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {promotions.map((promo) => (
          <div
            key={promo.id}
            style={{
              background: promo.gradient,
              border: `1.5px solid ${promo.borderColor}`,
              borderRadius: '20px',
              padding: '18px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  color: promo.badgeColor,
                  background: 'rgba(0,0,0,0.4)',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  border: `1px solid ${promo.badgeColor}50`,
                }}
              >
                {promo.badge}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{promo.tag}</span>
            </div>

            <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#ffffff', margin: 0 }}>{promo.title}</h2>
            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4, margin: 0 }}>{promo.desc}</p>

            <button
              onClick={promo.action}
              style={{
                background: 'linear-gradient(135deg, #ffe066 0%, #ffb800 100%)',
                border: 'none',
                color: '#1e1402',
                fontWeight: 800,
                fontSize: '13px',
                padding: '9px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 0 14px rgba(255, 184, 0, 0.4)',
                marginTop: '4px',
              }}
            >
              {promo.actionText} <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromotionsPage;
