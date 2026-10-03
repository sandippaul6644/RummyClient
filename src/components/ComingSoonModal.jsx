import React, { useState } from 'react';
import { Sparkles, Bell, Check, X, ArrowRight, Zap, Rocket, Dices, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/sound.js';

export const ComingSoonModal = ({ game, isOpen, onClose, onLaunchActiveGame }) => {
  const [notified, setNotified] = useState(false);

  if (!isOpen || !game) return null;

  const handleNotify = () => {
    sound.playClick();
    setNotified(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel modal-content"
        style={{
          maxWidth: '480px',
          padding: '24px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 184, 0, 0.35)',
          background: 'linear-gradient(180deg, rgba(18, 24, 42, 0.98) 0%, rgba(8, 12, 22, 0.98) 100%)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 35px rgba(255, 184, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Thumbnail or Badge */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          {game.image ? (
            <div style={{
              width: '100%',
              height: '180px',
              borderRadius: '16px',
              overflow: 'hidden',
              marginBottom: '14px',
              border: '1px solid rgba(255, 184, 0, 0.3)',
              position: 'relative'
            }}>
              <img
                src={game.image}
                alt={game.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
              }}>
                COMING SOON
              </div>
            </div>
          ) : (
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #ffe066 0%, #ffb800 100%)',
              margin: '0 auto 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              boxShadow: '0 0 25px rgba(255, 184, 0, 0.4)'
            }}>
              {game.icon || '🎰'}
            </div>
          )}

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            background: 'rgba(255, 184, 0, 0.15)',
            border: '1px solid rgba(255, 184, 0, 0.4)',
            color: '#ffb800',
            fontSize: '11px',
            fontWeight: 800,
            marginBottom: '8px'
          }}>
            <Sparkles size={13} /> EARLY ACCESS PREVIEW
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>{game.title}</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            {game.description || 'This premium casino title is currently in the final stages of security audits and provably-fair RNG certification.'}
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '14px',
          padding: '12px 8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>EXPECTED RTP</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>{game.rtp || '98.6%'}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>CATEGORY</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#818cf8', marginTop: '2px' }}>{game.category || 'Casino'}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>CERTIFICATION</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffb800', marginTop: '2px' }}>Provably Fair</div>
          </div>
        </div>

        {/* Notify / Pre-register Button */}
        <div style={{ marginBottom: '22px' }}>
          {notified ? (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              color: '#34d399',
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <Check size={18} /> You're on the VIP launch list! +₹100 bonus reserved.
            </div>
          ) : (
            <button
              onClick={handleNotify}
              className="btn-gold"
              style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px' }}
            >
              <Bell size={16} /> Notify Me on Launch & Get ₹100 Free
            </button>
          )}
        </div>

        {/* Play Active Live Games Instead */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
            Available Now (Live Realtime Games):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => { onClose(); onLaunchActiveGame('colour'); }}
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                padding: '8px 4px',
                color: '#34d399',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Zap size={16} />
              <span>Colour</span>
            </button>

            <button
              onClick={() => { onClose(); onLaunchActiveGame('crash'); }}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '8px 4px',
                color: '#f87171',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Rocket size={16} />
              <span>Crash</span>
            </button>

            <button
              onClick={() => { onClose(); onLaunchActiveGame('dice'); }}
              style={{
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '10px',
                padding: '8px 4px',
                color: '#c084fc',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Dices size={16} />
              <span>Dice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
