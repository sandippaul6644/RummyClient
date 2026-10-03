import React from 'react';
import { X, ShieldCheck, Key, Hash, Check } from 'lucide-react';
import { sound } from '../utils/sound.js';

export const ProvablyFairModal = ({ isOpen, onClose, roundData }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div className="glass-panel-glow" style={{
        width: '100%',
        maxWidth: '520px',
        padding: '28px',
        position: 'relative'
      }}>
        <button
          onClick={() => { sound.playClick(); onClose(); }}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8'
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Provably Fair Cryptography</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Independently verifiable SHA256 / HMAC outcomes</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', marginBottom: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
              <Hash size={13} /> Server Seed Hash (Committed Before Round)
            </div>
            <div className="font-mono" style={{ color: '#818cf8', wordBreak: 'break-all', fontSize: '12px' }}>
              {roundData?.serverSeedHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', marginBottom: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
              <Key size={13} /> Server Seed (Revealed After Settlement)
            </div>
            <div className="font-mono" style={{ color: '#34d399', wordBreak: 'break-all', fontSize: '12px' }}>
              {roundData?.serverSeed || 'Revealed once current round concludes'}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: '#94a3b8', marginBottom: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
              Mathematical Verification Formula
            </div>
            <div className="font-mono" style={{ color: '#cbd5e1', fontSize: '12px', lineHeight: 1.5 }}>
              Result = HMAC_SHA256(serverSeed, clientSeed:nonce)
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { sound.playClick(); onClose(); }}
          className="btn-primary"
          style={{ width: '100%', marginTop: '20px', padding: '12px' }}
        >
          Close & Return to Game
        </button>
      </div>
    </div>
  );
};
