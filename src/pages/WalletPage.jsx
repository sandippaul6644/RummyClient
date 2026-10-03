import React from 'react';
import { Transactions } from './Transactions.jsx';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { sound } from '../utils/sound.js';

export const WalletPage = () => {
  const navigate = useNavigate();

  return (
    <div className="game-page-wrapper" style={{ maxWidth: '1280px', margin: '0 auto', padding: '10px 12px 30px' }}>
      {/* Quick Back Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
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
            transition: 'all 0.2s ease',
          }}
        >
          <ChevronLeft size={16} /> Back to Lobby
        </button>

        <span style={{ fontSize: '11px', background: 'rgba(255, 184, 0, 0.15)', color: '#ffe066', padding: '3px 10px', borderRadius: '12px', fontWeight: 800 }}>
          ⚡ INSTANT DEPOSITS & WITHDRAWALS
        </span>
      </div>

      {/* Main Transactions & Wallet Component */}
      <Transactions />
    </div>
  );
};

export default WalletPage;
