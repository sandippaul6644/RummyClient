import React from 'react';
import { DragonTigerGame } from '../games/dragontiger/DragonTigerGame.jsx';
import { useNavigate }     from 'react-router-dom';
import { ChevronLeft }     from 'lucide-react';

export const DragonTigerPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

      {/* ── Game sub-header bar ── */}
      <div style={{
        position: 'sticky',
        top: '61px',
        zIndex: 50,
        background: 'linear-gradient(135deg, #0a0510 0%, #0d0814 50%, #08101a 100%)',
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
            <span style={{ fontSize: '16px' }}>🐉</span>
            <span style={{
              fontSize: '14px', fontWeight: 900, letterSpacing: '0.3px',
              background: 'linear-gradient(90deg,#3b82f6,#f59e0b,#ef4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Dragon vs Tiger
            </span>
            <span style={{ fontSize: '16px' }}>🐯</span>
          </div>
          <span style={{ fontSize: '9px', color: '#475569', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '1px' }}>
            Provably Fair · HMAC-SHA256-DECK-DUAL-v1
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
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', whiteSpace: 'nowrap' }}>20s LIVE</span>
        </div>
      </div>

      {/* Accent gradient strip */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg,#3b82f6,#6366f1,#f59e0b,#ef4444)', opacity: 0.85 }}/>

      {/* Game content */}
      <div style={{ padding: '10px 10px 24px' }}>
        <DragonTigerGame />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DragonTigerPage;
