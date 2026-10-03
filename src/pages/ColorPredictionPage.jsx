import React from 'react';
import { ColourGame } from '../games/colour/ColourGame.jsx';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { sound } from '../utils/sound.js';

export const ColorPredictionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="game-page-wrapper" style={{ maxWidth: '1280px', margin: '0 auto', padding: '6px 10px 18px' }}>
      {/* Quick Back Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <button
          onClick={() => {
            sound.playClick();
            navigate('/');
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            color: '#f8fafc',
            padding: '5px 12px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <ChevronLeft size={15} /> Back to Lobby
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 10px', borderRadius: '12px', fontWeight: 800 }}>
            ● 30s LIVE ROUNDS
          </span>
        </div>
      </div>

      {/* Main Color Prediction Engine */}
      <ColourGame />
    </div>
  );
};

export default ColorPredictionPage;

