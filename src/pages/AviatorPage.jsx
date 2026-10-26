import React from 'react';
import { CrashGame } from '../games/crash/CrashGame.jsx';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Flame } from 'lucide-react';
import { sound } from '../utils/sound.js';

export const AviatorPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    sound.playClick();
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Sleek Cockpit Sub-Header Bar ── */}
      <div
        style={{
          position: 'sticky',
          top: '60px',
          zIndex: 40,
          background: 'rgba(10, 14, 24, 0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 90, 0, 0.25)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <button
          onClick={handleBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '9px',
            color: '#cbd5e1',
            padding: '5px 10px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          <ChevronLeft size={15} /> Back
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={15} fill="#ff5500" color="#ff2200" />
            <span
              style={{
                fontSize: '14.5px',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.3px',
              }}
            >
              Aviator Rocket
            </span>
          </div>
          <span
            style={{
              fontSize: '8.5px',
              color: '#64748b',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            Provably Fair · HMAC-SHA256
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'linear-gradient(135deg, rgba(255, 68, 68, 0.25) 0%, rgba(255, 140, 0, 0.15) 100%)',
            border: '1px solid rgba(255, 68, 68, 0.45)',
            borderRadius: '20px',
            padding: '4px 9px',
            flexShrink: 0,
            boxShadow: '0 0 10px rgba(255, 68, 68, 0.25)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 8px #ef4444',
              animation: 'pulse 1.4s infinite',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '10px', fontWeight: 900, color: '#ff7171', whiteSpace: 'nowrap' }}>LIVE</span>
        </div>
      </div>

      {/* Fiery Accent Line */}
      <div
        style={{
          height: '2px',
          background: 'linear-gradient(90deg, #ff1a1a 0%, #ff6a00 50%, #ffea00 100%)',
          boxShadow: '0 0 8px rgba(255, 106, 0, 0.6)',
        }}
      />

      {/* Main Game Shell */}
      <div style={{ flex: 1, padding: '4px 0 16px' }}>
        <CrashGame />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
};

export default AviatorPage;
