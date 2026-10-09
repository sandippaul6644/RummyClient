import React from 'react';
import { ColourGame } from '../games/colour/ColourGame.jsx';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';

export const ColorPredictionPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

      {/* ── Game sub-header bar ── */}
      <div style={{
        position: 'sticky',
        top: '61px',
        zIndex: 50,
        background: 'linear-gradient(135deg, #1a0505 0%, #180810 50%, #0a1020 100%)',
        borderBottom: '1px solid rgba(245,158,11,0.2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
      }}>

        {/* Left: Back button */}
        <button onClick={() => navigate('/')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: '#cbd5e1',
            padding: '6px 12px',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}>
          <ChevronLeft size={14} /> Back
        </button>

        {/* Centre: Game title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Colour dots */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {['#ef4444','#10b981','#a855f7'].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }}/>
              ))}
            </div>
            <span style={{
              fontSize: '14px', fontWeight: 900, letterSpacing: '0.3px',
              background: 'linear-gradient(90deg,#f87171,#34d399,#c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Colour Prediction
            </span>
          </div>
          <span style={{ fontSize: '9px', color: '#475569', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '1px' }}>
            Provably Fair · HMAC-SHA256
          </span>
        </div>

        {/* Right: Live badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(16,185,129,0.12)',
          border: '1px solid rgba(16,185,129,0.35)',
          borderRadius: '20px',
          padding: '5px 10px',
          flexShrink: 0,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', animation: 'pulse 1.5s infinite', display: 'inline-block' }}/>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', whiteSpace: 'nowrap' }}>30s LIVE</span>
        </div>
      </div>

      <div style={{ height: '3px', background: 'linear-gradient(90deg,#dc2626,#ef4444,#f59e0b,#fbbf24,#10b981,#059669)', opacity: 0.85 }}/>

      {/* Game content */}
      <div style={{ padding: '10px 10px 24px' }}>
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
