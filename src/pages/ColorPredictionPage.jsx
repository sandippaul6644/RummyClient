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
    <div style={{ maxWidth: '720px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* Las Vegas Neon Velvet Ambient Light Pool */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '800px',
          height: '420px',
          background: 'radial-gradient(circle at 50% 15%, rgba(168, 85, 247, 0.22) 0%, rgba(236, 72, 153, 0.16) 40%, rgba(6, 182, 212, 0.10) 70%, transparent 85%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Game sub-header bar (Neon Velvet Glass) ── */}
      <div style={{
        position: 'sticky',
        top: '60px',
        zIndex: 40,
        background: 'rgba(24, 11, 46, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(168, 85, 247, 0.35)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.65), 0 0 20px rgba(168, 85, 247, 0.18)',
        padding: '9px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
      }}>

        {/* Left: Back button with Neon Velvet glow */}
        <button onClick={handleBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(236, 72, 153, 0.16) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.45)',
            borderRadius: '10px',
            color: '#f3e8ff',
            padding: '6px 12px',
            fontSize: '12px', fontWeight: 800, cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 0 14px rgba(168, 85, 247, 0.25)',
            transition: 'all 0.2s ease',
          }}>
          <ChevronLeft size={16} /> Back
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

        {/* Right: Live badge with Neon Emerald Halo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.20) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.65)',
          borderRadius: '20px',
          padding: '5px 11px',
          boxShadow: '0 0 16px rgba(16, 185, 129, 0.45)',
          flexShrink: 0,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399, 0 0 18px #10b981', animation: 'pulse 1.5s infinite', display: 'inline-block' }}/>
          <span style={{ fontSize: '10.5px', fontWeight: 900, color: '#6ee7b7', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>30s LIVE</span>
        </div>
      </div>

      {/* Dynamic top gradient divider with neon blur glow */}
      <div style={{
        height: '2.5px',
        background: dynamicTitleGradient,
        boxShadow: '0 0 12px rgba(168, 85, 247, 0.8), 0 0 24px rgba(236, 72, 153, 0.4)',
        position: 'relative',
        zIndex: 41,
      }}/>

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
