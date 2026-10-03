import React from 'react';
import { DiceGame } from '../games/dice/DiceGame.jsx';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { sound } from '../utils/sound.js';

export const DicePage = () => {
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '3px 10px', borderRadius: '12px', fontWeight: 800 }}>
            🎲 99% RTP INSTANT ROLL
          </span>
        </div>
      </div>

      {/* Main Classic Dice / Mines Engine */}
      <DiceGame />
    </div>
  );
};

export default DicePage;
