import React, { useState, useCallback, useMemo } from 'react';
import { ColourGame } from '../games/colour/ColourGame.jsx';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { sound } from '../utils/sound.js';

export const ColorPredictionPage = () => {
  const navigate = useNavigate();

  // Dynamic header colors synchronized from live ColourGame state
  const [headerColors, setHeaderColors] = useState([
    { id: 'GREEN', solid: '#10b981', glow: '16,185,129' },
    { id: 'VIOLET', solid: '#a855f7', glow: '168,85,247' },
    { id: 'RED', solid: '#ef4444', glow: '239,68,68' },
  ]);

  const handleBack = () => {
    sound.playClick();
    navigate('/');
  };

  const handleColorsChange = useCallback((colors) => {
    if (colors && colors.length > 0) {
      setHeaderColors(colors);
    }
  }, []);

  // Compute smooth, explicit-stop gradient across all active colors for title & divider
  const dynamicTitleGradient = useMemo(() => {
    if (!headerColors || headerColors.length === 0) {
      return 'linear-gradient(90deg, #10b981 0%, #a855f7 50%, #ef4444 100%)';
    }
    const solids = headerColors.map((c) => c.solid || '#10b981');
    if (solids.length === 1) return solids[0];
    if (solids.length === 2) return `linear-gradient(90deg, ${solids[0]} 0%, ${solids[1]} 100%)`;
    if (solids.length === 3) return `linear-gradient(90deg, ${solids[0]} 0%, ${solids[1]} 50%, ${solids[2]} 100%)`;
    const step = 100 / (solids.length - 1);
    return `linear-gradient(90deg, ${solids.map((s, idx) => `${s} ${(idx * step).toFixed(0)}%`).join(', ')})`;
  }, [headerColors]);

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

        {/* Centre: Game title with dynamic dots and dynamic title gradient */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {headerColors.map((c) => (
                <div
                  key={c.id || c.solid}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: c.solid || '#10b981',
                    boxShadow: `0 0 7px ${c.solid || '#10b981'}`,
                  }}
                />
              ))}
            </div>
            <svg
              viewBox="0 0 156 20"
              style={{
                height: '19px',
                width: '150px',
                display: 'inline-block',
                verticalAlign: 'middle',
                overflow: 'visible',
              }}
            >
              <defs>
                <linearGradient id="headerTitleDynamicGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  {headerColors.map((c, idx) => {
                    const offset = headerColors.length > 1
                      ? `${((idx / (headerColors.length - 1)) * 100).toFixed(0)}%`
                      : '0%';
                    return <stop key={c.id || idx} offset={offset} stopColor={c.solid || '#10b981'} />;
                  })}
                </linearGradient>
              </defs>
              <text
                x="0"
                y="15.5"
                fill="url(#headerTitleDynamicGrad)"
                fontSize="15.5"
                fontWeight="900"
                letterSpacing="0.4"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              >
                Colour Prediction
              </text>
            </svg>
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

      {/* Dynamic top gradient divider */}
      <div style={{ height: '2px', background: dynamicTitleGradient, opacity: 0.85 }}/>

      {/* Game content with callback */}
      <div style={{ padding: '8px 10px 24px', flex: 1 }}>
        <ColourGame onColorsChange={handleColorsChange} />
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
