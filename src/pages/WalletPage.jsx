import React from 'react';
import { Transactions } from './Transactions.jsx';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Zap } from 'lucide-react';
import { sound } from '../utils/sound.js';

export const WalletPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '14px 12px 40px', position: 'relative' }}>

      {/* Las Vegas Neon Velvet Ambient Light Pool */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '900px',
          height: '420px',
          background: 'radial-gradient(circle at 50% 10%, rgba(168, 85, 247, 0.22) 0%, rgba(236, 72, 153, 0.16) 40%, rgba(6, 182, 212, 0.10) 70%, transparent 85%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top Header Navigation & Quick Cashier Actions */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        {/* Back to Lobby Button */}
        <button
          onClick={() => {
            sound.playClick();
            navigate('/');
          }}
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.14) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.45)',
            borderRadius: '12px',
            color: '#f3e8ff',
            padding: '7px 14px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 0 14px rgba(168, 85, 247, 0.2)',
            transition: 'all 0.2s ease',
          }}
        >
          <ChevronLeft size={16} /> Back to Lobby
        </button>

        {/* Right side: Settlement Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              color: '#fbbf24',
              padding: '5px 12px',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 0 10px rgba(251, 191, 36, 0.2)',
            }}
          >
            <Zap size={12} /> INSTANT DEPOSITS & WITHDRAWALS
          </span>
        </div>
      </div>

      {/* Main Transactions & Wallet Component */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Transactions />
      </div>
    </div>
  );
};

export default WalletPage;
