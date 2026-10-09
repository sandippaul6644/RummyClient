import React from 'react';
import { DiceGame }   from '../games/dice/DiceGame.jsx';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const DicePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

      {/* ── Game sub-header bar ── */}
      <div style={{
        position: 'sticky', top: '61px', zIndex: 50,
        background: 'linear-gradient(135deg,#060f2a 0%,#091424 50%,#05101e 100%)',
        borderBottom: '1px solid rgba(56,189,248,0.2)',
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
            <span style={{ fontSize:'18px' }}>🎲</span>
            <span style={{ fontSize:'14px', fontWeight:900, background:'linear-gradient(90deg,#38bdf8,#818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Classic Dice
            </span>
          </div>
          <span style={{ fontSize:'9px', color:'#475569', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginTop:'1px' }}>
            Provably Fair · 99% RTP
          </span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(56,189,248,0.1)', border:'1px solid rgba(56,189,248,0.3)', borderRadius:'20px', padding:'5px 10px', flexShrink:0 }}>
          <span style={{ fontSize:'10px', fontWeight:800, color:'#38bdf8', whiteSpace:'nowrap' }}>⚡ INSTANT</span>
        </div>
      </div>

      <div style={{ height:'3px', background:'linear-gradient(90deg,#38bdf8,#818cf8,#c084fc)', opacity:0.7 }}/>

      <div style={{ padding:'10px 10px 24px' }}>
        <DiceGame />
      </div>
    </div>
  );
};

export default DicePage;
