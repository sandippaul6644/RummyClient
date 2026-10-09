import React from 'react';
import { ColourGame } from '../games/colour/ColourGame.jsx';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const ColorPredictionPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '6px 10px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#f8fafc', padding: '5px 12px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ChevronLeft size={15} /> Back to Lobby
        </button>
        <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '3px 10px', borderRadius: '12px', fontWeight: 800 }}>
          ● 30s LIVE ROUNDS
        </span>
      </div>
      <ColourGame />
    </div>
  );
};

export default ColorPredictionPage;
