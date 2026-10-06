import React from 'react';
import { CrashGame } from '../games/crash/CrashGame.jsx';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const AviatorPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '10px 12px 30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#f8fafc', padding: '6px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ChevronLeft size={16} /> Back to Lobby
        </button>
        <span style={{ fontSize: '11px', background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '3px 10px', borderRadius: '12px', fontWeight: 800 }}>
          🚀 CRASH ROCKET
        </span>
      </div>
      <CrashGame />
    </div>
  );
};

export default AviatorPage;
