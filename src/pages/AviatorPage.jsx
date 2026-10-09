import React from 'react';
import { CrashGame }  from '../games/crash/CrashGame.jsx';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const AviatorPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

      {/* ── Game sub-header bar ── */}
      <div style={{
        position: 'sticky', top: '61px', zIndex: 50,
        background: 'linear-gradient(135deg,#1f0a0a 0%,#1a0e0e 50%,#0a1628 100%)',
        borderBottom: '1px solid rgba(239,68,68,0.2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
      }}>
        <button onClick={() => navigate('/')}
          style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', color:'#cbd5e1', padding:'6px 12px', fontSize:'12px', fontWeight:700, cursor:'pointer', flexShrink:0 }}>
          <ChevronLeft size={14}/> Back
        </button>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'18px' }}>🚀</span>
            <span style={{ fontSize:'14px', fontWeight:900, background:'linear-gradient(90deg,#f87171,#fbbf24)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Crash Rocket
            </span>
          </div>
          <span style={{ fontSize:'9px', color:'#475569', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginTop:'1px' }}>
            Provably Fair · HMAC-SHA256
          </span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'20px', padding:'5px 10px', flexShrink:0 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#f87171', boxShadow:'0 0 6px #f87171', animation:'pulse 1.5s infinite', display:'inline-block' }}/>
          <span style={{ fontSize:'10px', fontWeight:800, color:'#f87171', whiteSpace:'nowrap' }}>LIVE</span>
        </div>
      </div>

      <div style={{ height:'3px', background:'linear-gradient(90deg,#ef4444,#f97316,#fbbf24)', opacity:0.8 }}/>

      <div style={{ padding:'10px 10px 24px' }}>
        <CrashGame />
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }`}</style>
    </div>
  );
};

export default AviatorPage;
