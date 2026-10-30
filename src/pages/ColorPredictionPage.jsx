import React from 'react';
import { ColourGame } from '../games/colour/ColourGame.jsx';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Flame } from 'lucide-react';
import { sound } from '../utils/sound.js';

export const ColorPredictionPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    sound.playClick();
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Game sub-header bar ── */}
      <div style={{
        position: 'sticky',
        top: '60px',
        zIndex: 40,
        background: 'rgba(10, 14, 24, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
      }}>

        {/* Left: Back button */}
        <button onClick={handleBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '9px',
            color: '#cbd5e1',
            padding: '5px 10px',
            fontSize: '12px', fontWeight: 800, cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}>
          <ChevronLeft size={15} /> Back
        </button>

        {/* Centre: Game title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '3.5px' }}>
              {['#ef4444','#10b981','#a855f7'].map(c => (
                <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }}/>
              ))}
            </div>
            <span style={{
              fontSize: '14.5px', fontWeight: 900, letterSpacing: '0.3px',
              background: 'linear-gradient(90deg, #f87171 0%, #34d399 50%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Colour Prediction
            </span>
          </div>
          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '1px' }}>
            PROVABLY FAIR · HMAC-SHA256
          </span>
        </div>

        {/* Right: Live badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'rgba(16,185,129,0.14)',
          border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: '20px',
          padding: '4px 9px',
          flexShrink: 0,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', animation: 'pulse 1.5s infinite', display: 'inline-block' }}/>
          <span style={{ fontSize: '10px', fontWeight: 900, color: '#34d399', whiteSpace: 'nowrap' }}>30s LIVE</span>
        </div>
      </div>

      <div style={{ height: '2px', background: 'linear-gradient(90deg,#ef4444 0%,#10b981 50%,#a855f7 100%)', opacity: 0.85 }}/>

      {/* Game content */}
      <div style={{ padding: '8px 10px 24px', flex: 1 }}>
        <ColourGame />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
};

export default ColorPredictionPage;
