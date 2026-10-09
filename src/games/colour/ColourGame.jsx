import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { socket }  from '../../services/socket.js';
import { api }     from '../../services/api.js';
import { ShieldCheck, Clock, Zap } from 'lucide-react';

// ── Colour constants ──────────────────────────────────────────────────────────
const CLR = {
  RED:    { solid: '#ef4444', glow: '239,68,68',    grad: 'linear-gradient(135deg,#ff5e72,#ef4444)', emoji: '🔴', mult: '2.0×' },
  GREEN:  { solid: '#10b981', glow: '16,185,129',   grad: 'linear-gradient(135deg,#00f59b,#059669)', emoji: '🟢', mult: '2.0×' },
  VIOLET: { solid: '#a855f7', glow: '168,85,247',   grad: 'linear-gradient(135deg,#e879f9,#a855f7)', emoji: '🟣', mult: '4.5×' },
};

const NUM_TO_COLORS = {
  '0':['RED','VIOLET'],'1':['GREEN'],'2':['RED'],'3':['GREEN'],
  '4':['RED'],'5':['GREEN','VIOLET'],'6':['RED'],'7':['GREEN'],
  '8':['RED'],'9':['GREEN'],
};

const resultGrad = (colors=[]) => {
  const c = colors.map(x=>x.toUpperCase());
  if (c.includes('RED')   && c.includes('VIOLET')) return 'linear-gradient(135deg,#ff5e72 50%,#e879f9 50%)';
  if (c.includes('GREEN') && c.includes('VIOLET')) return 'linear-gradient(135deg,#00f59b 50%,#e879f9 50%)';
  if (c.includes('GREEN'))  return CLR.GREEN.grad;
  if (c.includes('RED'))    return CLR.RED.grad;
  if (c.includes('VIOLET')) return CLR.VIOLET.grad;
  return 'linear-gradient(135deg,#6366f1,#a855f7)';
};

const numGrad = (n) => {
  const cols = NUM_TO_COLORS[String(n)] || ['RED'];
  if (cols.includes('RED') && cols.includes('VIOLET'))   return 'linear-gradient(135deg,#ff5e72 50%,#e879f9 50%)';
  if (cols.includes('GREEN') && cols.includes('VIOLET')) return 'linear-gradient(135deg,#00f59b 50%,#e879f9 50%)';
  if (cols.includes('GREEN')) return CLR.GREEN.grad;
  return CLR.RED.grad;
};

const numGlow = (n) => {
  const c = NUM_TO_COLORS[String(n)] || ['RED'];
  if (c.includes('VIOLET')) return '168,85,247';
  if (c.includes('GREEN'))  return '16,185,129';
  return '239,68,68';
};

const CHIPS = [
  { v:'1',   bg:'linear-gradient(135deg,#475569,#1e293b)', ring:'rgba(148,163,184,0.7)' },
  { v:'5',   bg:'linear-gradient(135deg,#f87171,#dc2626)', ring:'rgba(248,113,113,0.8)' },
  { v:'10',  bg:'linear-gradient(135deg,#60a5fa,#2563eb)', ring:'rgba(96,165,250,0.8)'  },
  { v:'25',  bg:'linear-gradient(135deg,#34d399,#047857)', ring:'rgba(52,211,153,0.8)'  },
  { v:'50',  bg:'linear-gradient(135deg,#fbbf24,#b45309)', ring:'rgba(251,191,36,0.8)'  },
  { v:'100', bg:'linear-gradient(135deg,#c084fc,#6d28d9)', ring:'rgba(192,132,252,0.8)' },
  { v:'500', bg:'linear-gradient(135deg,#fcd34d,#92400e)', ring:'rgba(252,211,77,0.9)'  },
];

// ─────────────────────────────────────────────────────────────────────────────
export const ColourGame = () => {
  const { user, wallet, refreshWallet, setIsAuthModalOpen } = useAuth();

  const [roundId,        setRoundId]        = useState(null);
  const [roundNumber,    setRoundNumber]     = useState(null);
  const [roundStatus,    setRoundStatus]     = useState('OPEN');
  const [betCloseTime,   setBetCloseTime]    = useState(null);
  const [serverSeedHash, setServerSeedHash]  = useState('');
  const [remainingSec,   setRemainingSec]    = useState(30);
  const [isBettingOpen,  setIsBettingOpen]   = useState(true);

  const [lastResult,    setLastResult]    = useState(null);
  const [revealedSeed,  setRevealedSeed]  = useState(null);
  const [history,       setHistory]       = useState([]);
  const [myBets,        setMyBets]        = useState([]);
  const [liveBets,      setLiveBets]      = useState([]);

  const [selectedBet,   setSelectedBet]   = useState(null);
  const [betAmount,     setBetAmount]      = useState('10');
  const [submitting,    setSubmitting]     = useState(false);
  const [alertMsg,      setAlertMsg]       = useState('');
  const [alertError,    setAlertError]     = useState(false);
  const [activeTab,     setActiveTab]      = useState('history');
  const [showVerify,    setShowVerify]     = useState(false);

  const countdownRef = useRef(null);

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadGame = useCallback(async () => {
    try {
      const [gr, hr] = await Promise.all([
        api.get('/games/colour'),
        api.get('/games/colour/history?limit=20'),
      ]);
      if (gr.data?.success) {
        const r = gr.data.data.currentRound;
        if (r) {
          setRoundId(r.roundId); setRoundNumber(r.roundNumber);
          setRoundStatus(r.status); setServerSeedHash(r.serverSeedHash);
          setBetCloseTime(r.betCloseTime);
          setIsBettingOpen(r.status === 'OPEN');
          setRemainingSec(r.remainingSec || 0);
        }
      }
      if (hr.data?.success) setHistory(hr.data.data || []);
    } catch {}
  }, []);

  const loadMyBets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/games/colour/my-bets?limit=30');
      if (res.data?.success) setMyBets(res.data.data?.bets || []);
    } catch {}
  }, [user]);

  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (!betCloseTime) return;
    const tick = () => {
      const rem = Math.max(0, Math.ceil((new Date(betCloseTime) - Date.now()) / 1000));
      setRemainingSec(rem);
      setIsBettingOpen(rem > 0);
    };
    tick();
    countdownRef.current = setInterval(tick, 500);
    return () => clearInterval(countdownRef.current);
  }, [betCloseTime]);

  useEffect(() => {
    loadGame();
    socket.emit('game:join', { gameSlug: 'colour' });

    socket.on('colour:round:open', d => {
      setRoundId(d.roundId); setRoundNumber(d.roundNumber);
      setRoundStatus('OPEN'); setServerSeedHash(d.serverSeedHash);
      setBetCloseTime(d.betCloseTime); setIsBettingOpen(true);
      setLiveBets([]); setLastResult(null); setRevealedSeed(null); setShowVerify(false);
    });
    socket.on('colour:round:created', d => setServerSeedHash(d.serverSeedHash));
    socket.on('colour:round:closed',  () => { setIsBettingOpen(false); setRoundStatus('CLOSED'); });
    socket.on('colour:round:result',  d => {
      const res = d.result || d.resultData;
      setLastResult(res); setRoundStatus('RESULT_GENERATED');
      if (res?.colors) {
        try {
          const confetti = window.__confetti;
          if (confetti) confetti({ particleCount:65, spread:80, origin:{y:0.45}, colors:['#00f59b','#d946ef','#ff4b63','#ffe066'] });
        } catch {}
      }
    });
    socket.on('colour:round:settled', d => {
      setRoundStatus('SETTLED'); setRevealedSeed(d.serverSeed || null);
      setHistory(prev => [{ roundId:d.roundId, roundNumber:d.roundNumber, result:d.result, serverSeedHash:d.serverSeedHash }, ...prev.slice(0,19)]);
      refreshWallet(); loadMyBets();
    });
    socket.on('colour:bet:placed', bet => setLiveBets(prev => [bet, ...prev.slice(0,19)]));

    return () => {
      socket.emit('game:leave', { gameSlug: 'colour' });
      ['colour:round:open','colour:round:created','colour:round:tick',
       'colour:round:closed','colour:round:result','colour:round:settled','colour:bet:placed',
      ].forEach(ev => socket.off(ev));
    };
  }, [loadGame, loadMyBets, refreshWallet]);

  useEffect(() => { if (user) loadMyBets(); }, [user, loadMyBets]);

  // ── Bet ───────────────────────────────────────────────────────────────────
  const handlePlaceBet = async () => {
    if (!user) { setIsAuthModalOpen(true); return; }
    if (!selectedBet) { showAlert('Select a colour or number first', true); return; }
    const num = Number(betAmount);
    if (isNaN(num) || num <= 0) { showAlert('Enter a valid amount', true); return; }
    if (wallet && num > Number(wallet.balance)) { showAlert('Insufficient balance', true); return; }
    if (!isBettingOpen) { showAlert('Betting is closed', true); return; }

    setSubmitting(true);
    try {
      const res = await api.post('/games/colour/bets', {
        prediction:     selectedBet,
        amount:         num,
        idempotencyKey: `${user._id||user.id}:${roundId}:${selectedBet}:${Date.now()}`,
      });
      if (res.data?.success) {
        showAlert(`₹${num.toFixed(0)} on ${selectedBet} ✓`, false);
        setMyBets(prev => [res.data.data, ...prev]);
        refreshWallet();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Bet failed', true);
    } finally { setSubmitting(false); }
  };

  const showAlert = (msg, isError) => {
    setAlertMsg(msg); setAlertError(isError);
    setTimeout(() => setAlertMsg(''), 3500);
  };

  const countdown = remainingSec;
  const cdColor   = countdown <= 5 ? '#f87171' : countdown <= 10 ? '#fbbf24' : '#34d399';
  const timerPct  = Math.min(100, (countdown / 25) * 100);

  // Selected prediction metadata
  const selIsNum  = selectedBet && !isNaN(Number(selectedBet));
  const selColor  = selIsNum ? null : CLR[selectedBet];
  const selGrad   = selIsNum ? numGrad(selectedBet) : selColor?.grad;
  const selGlow   = selIsNum ? numGlow(selectedBet) : (selColor ? selColor.glow : null);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px', color:'#fff' }}>

      {/* ═══════════════════════════════════════════════════════════════
          ROUND HEADER
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(168,85,247,0.12))',
        border: '1px solid rgba(139,92,246,0.25)',
        borderRadius: '18px',
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(10px)',
      }}>
        <div>
          <div style={{ fontSize:'11px', color:'#7c3aed', fontWeight:800, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px' }}>
            ROUND #{roundNumber ?? '—'}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{
              fontSize:'11px', padding:'3px 10px', borderRadius:'20px', fontWeight:800,
              background: isBettingOpen ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${isBettingOpen ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color: isBettingOpen ? '#34d399' : '#f87171',
            }}>
              {isBettingOpen ? '● BETTING OPEN' : roundStatus === 'SETTLED' ? '✓ SETTLED' : '⏸ CALCULATING'}
            </span>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          {/* Timer */}
          {isBettingOpen && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ position:'relative', width:52, height:52 }}>
                <svg width="52" height="52" style={{ transform:'rotate(-90deg)' }}>
                  <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3"/>
                  <circle cx="26" cy="26" r="22" fill="none" stroke={cdColor} strokeWidth="3"
                    strokeDasharray={`${2*Math.PI*22}`}
                    strokeDashoffset={`${2*Math.PI*22*(1-timerPct/100)}`}
                    strokeLinecap="round" style={{ transition:'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
                  />
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:'16px', fontWeight:900, color:cdColor, lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{countdown}</span>
                  <span style={{ fontSize:'8px', color:'#64748b', fontWeight:700 }}>SEC</span>
                </div>
              </div>
            </div>
          )}

          {/* Provably Fair */}
          <button type="button" onClick={() => setShowVerify(!showVerify)}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', background:'rgba(139,92,246,0.12)', border:'1px solid rgba(168,85,247,0.3)', color:'#a78bfa', padding:'8px 10px', borderRadius:'12px', cursor:'pointer' }}>
            <ShieldCheck size={14}/>
            <span style={{ fontSize:'8px', fontWeight:800 }}>FAIR</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          HISTORY CIRCLES
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ display:'flex', gap:'6px', overflowX:'auto', padding:'4px 0', cursor:'pointer' }}
        onClick={() => setActiveTab('history')}>
        {history.slice(0,20).map((r,i)=>(
          <div key={r.roundId||i} style={{
            width:34, height:34, borderRadius:'50%',
            background: resultGrad(r.result?.colors||[]),
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:900, fontSize:'13px', color:'#fff', flexShrink:0,
            border:'2px solid rgba(255,255,255,0.12)',
            boxShadow:'0 2px 8px rgba(0,0,0,0.4)',
          }}>
            {r.result?.number??'?'}
          </div>
        ))}
        {history.length>0 && (
          <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid rgba(255,255,255,0.08)', fontSize:'14px', color:'#334155' }}>›</div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          LAST RESULT
      ═══════════════════════════════════════════════════════════════ */}
      {lastResult && (
        <div style={{
          display:'flex', alignItems:'center', gap:'14px',
          padding:'14px 16px', borderRadius:'16px',
          background:'rgba(15,23,42,0.8)', border:'1px solid rgba(255,255,255,0.08)',
          backdropFilter:'blur(10px)',
        }}>
          <div style={{
            width:50, height:50, borderRadius:'50%',
            background: resultGrad(lastResult.colors||[]),
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:900, fontSize:'22px', color:'#fff', flexShrink:0,
            boxShadow:`0 0 20px rgba(${lastResult.colors?.includes('GREEN')?'16,185,129':lastResult.colors?.includes('VIOLET')?'168,85,247':'239,68,68'},0.5)`,
          }}>
            {lastResult.number}
          </div>
          <div>
            <div style={{ fontSize:'15px', fontWeight:900, color:'#fff', marginBottom:'3px' }}>{lastResult.colors?.join(' + ')}</div>
            <div style={{ fontSize:'10px', color:'#475569', fontWeight:600 }}>Round #{roundNumber} · Result</div>
          </div>
          <div style={{ marginLeft:'auto', fontSize:'10px', color:'#334155', fontWeight:700, textAlign:'right' }}>
            <div>SETTLED</div>
            <div style={{ color:'#1e293b' }}>✓</div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PROVABLY FAIR PANEL
      ═══════════════════════════════════════════════════════════════ */}
      {showVerify && (
        <div style={{ background:'rgba(139,92,246,0.07)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:'14px', padding:'14px 16px', fontSize:'11px' }}>
          <div style={{ color:'#a78bfa', fontWeight:800, marginBottom:'8px', display:'flex', alignItems:'center', gap:'6px' }}>
            <ShieldCheck size={13}/> Provably Fair — HMAC-SHA256-v1
          </div>
          <div style={{ color:'#64748b', lineHeight:1.8, wordBreak:'break-all' }}>
            <div><span style={{ color:'#334155' }}>Committed Hash: </span><span style={{ fontFamily:'monospace', fontSize:'10px' }}>{serverSeedHash||'—'}</span></div>
            {revealedSeed && <div style={{ color:'#34d399' }}><span style={{ color:'#334155' }}>Revealed Seed: </span><span style={{ fontFamily:'monospace', fontSize:'10px' }}>{revealedSeed}</span></div>}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          COLOUR BUTTONS
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
        {['RED','GREEN','VIOLET'].map(color => {
          const c = CLR[color];
          const sel = selectedBet === color;
          return (
            <button key={color} type="button" onClick={() => setSelectedBet(sel ? null : color)}
              style={{
                padding:'16px 8px 12px',
                borderRadius:'16px',
                border: sel ? `2px solid ${c.solid}` : '1.5px solid rgba(255,255,255,0.1)',
                background: sel ? c.grad : `linear-gradient(135deg,rgba(${c.glow},0.12),rgba(${c.glow},0.06))`,
                cursor:'pointer',
                transform: sel ? 'scale(1.04) translateY(-2px)' : 'scale(1)',
                boxShadow: sel ? `0 8px 24px rgba(${c.glow},0.45), inset 0 1px 0 rgba(255,255,255,0.2)` : '0 2px 8px rgba(0,0,0,0.2)',
                transition:'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:'6px',
              }}>
              <span style={{ fontSize:'22px' }}>{c.emoji}</span>
              <span style={{ fontSize:'13px', fontWeight:900, color: sel ? '#fff' : `rgba(${c.glow},0.9)`, letterSpacing:'0.5px' }}>{color}</span>
              <span style={{ fontSize:'10px', fontWeight:700, color: sel ? 'rgba(255,255,255,0.7)' : `rgba(${c.glow},0.5)` }}>{c.mult}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          NUMBER BUTTONS (0 – 9)
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'6px' }}>
        {['0','1','2','3','4','5','6','7','8','9'].map(n => {
          const sel  = selectedBet === n;
          const glow = numGlow(n);
          const grad = numGrad(n);
          const cols = NUM_TO_COLORS[n]||['RED'];
          return (
            <button key={n} type="button" onClick={() => setSelectedBet(sel ? null : n)}
              style={{
                padding:'12px 0',
                borderRadius:'12px',
                border: sel ? `2px solid rgba(${glow},0.8)` : `1.5px solid rgba(${glow},0.2)`,
                background: sel ? grad : `rgba(${glow},0.08)`,
                cursor:'pointer',
                transform: sel ? 'scale(1.08) translateY(-1px)' : 'scale(1)',
                boxShadow: sel ? `0 6px 20px rgba(${glow},0.4)` : 'none',
                transition:'all 0.15s cubic-bezier(0.34,1.56,0.64,1)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
              }}>
              <span style={{ fontSize:'18px', fontWeight:900, color: sel ? '#fff' : `rgba(${glow},0.85)` }}>{n}</span>
              <div style={{ display:'flex', gap:'2px', justifyContent:'center' }}>
                {cols.map(c=>(
                  <span key={c} style={{ width:5, height:5, borderRadius:'50%', background:CLR[c]?.solid||'#6366f1', opacity:sel?1:0.6 }}/>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BET SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ background:'linear-gradient(180deg,rgba(15,23,42,0.7),rgba(9,14,30,0.8))', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'16px', display:'flex', flexDirection:'column', gap:'14px', backdropFilter:'blur(8px)' }}>

        {/* ── Chip grid (2 rows of 4 — no horizontal scroll) ── */}
        <div>
          <div style={{ fontSize:'9px', fontWeight:800, color:'#334155', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>Quick Bet</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px' }}>
            {CHIPS.map(({ v, bg, ring }) => {
              const act = betAmount === v;
              return (
                <button key={v} type="button" onClick={() => setBetAmount(v)}
                  style={{
                    position:'relative',
                    background:bg,
                    borderRadius:'10px',
                    height:40,
                    border: act ? `2px solid ${ring}` : '1px solid rgba(255,255,255,0.08)',
                    color:'#fff', fontWeight:900, fontSize:'11px', cursor:'pointer',
                    boxShadow: act ? `0 0 16px ${ring}, inset 0 1px 0 rgba(255,255,255,0.2)` : '0 2px 6px rgba(0,0,0,0.3)',
                    transform: act ? 'scale(1.06) translateY(-1px)' : 'scale(1)',
                    transition:'all 0.15s',
                    overflow:'hidden',
                  }}>
                  {act && <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.1)' }}/>}
                  ₹{v}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Amount input row ── */}
        <div>
          <div style={{ fontSize:'9px', fontWeight:800, color:'#334155', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>Bet Amount</div>
          <div style={{ display:'flex', gap:'6px', alignItems:'stretch' }}>
            {/* Input */}
            <div style={{ flex:1, position:'relative' }}>
              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:40, display:'flex', alignItems:'center', justifyContent:'center', borderRight:'1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ color:'#475569', fontSize:'16px', fontWeight:800 }}>₹</span>
              </div>
              <input
                type="number" value={betAmount}
                onChange={e => setBetAmount(e.target.value)}
                min="1"
                style={{
                  width:'100%', height:'100%', padding:'0 14px 0 50px',
                  background:'rgba(255,255,255,0.06)',
                  border:'1px solid rgba(255,255,255,0.1)',
                  borderRadius:'12px', color:'#fff',
                  fontSize:'20px', fontWeight:700, outline:'none',
                  boxSizing:'border-box', minHeight:48,
                }}
              />
            </div>
            {/* ½  2×  MAX */}
            {[
              ['½',  () => setBetAmount(s => String(Math.max(1, Math.floor(Number(s)/2))))],
              ['2×', () => setBetAmount(s => String(Number(s)*2))],
              ['MAX', () => wallet && setBetAmount(String(Math.floor(Number(wallet.balance))))],
            ].map(([label, fn]) => (
              <button key={label} type="button" onClick={fn}
                style={{
                  padding:'0 13px', borderRadius:'12px',
                  background:'rgba(255,255,255,0.05)',
                  border:'1px solid rgba(255,255,255,0.09)',
                  color: label==='MAX' ? '#fbbf24' : '#94a3b8',
                  cursor:'pointer', fontWeight:800, fontSize:'12px',
                  flexShrink:0, whiteSpace:'nowrap', height:48,
                  transition:'background 0.15s',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Balance pill ── */}
        {wallet && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize:'11px', color:'#334155', fontWeight:700 }}>Balance</span>
            <span style={{ fontSize:'13px', fontWeight:900, color:'#94a3b8' }}>
              ₹{Number(wallet.balance||0).toLocaleString('en-IN',{minimumFractionDigits:2})}
            </span>
          </div>
        )}

        {/* Alert */}
        {alertMsg && (
          <div style={{ padding:'10px 14px', borderRadius:'10px', fontSize:'12px', fontWeight:700, textAlign:'center', background:alertError?'rgba(239,68,68,0.12)':'rgba(52,211,153,0.12)', border:`1px solid ${alertError?'rgba(239,68,68,0.4)':'rgba(52,211,153,0.4)'}`, color:alertError?'#f87171':'#34d399' }}>
            {alertMsg}
          </div>
        )}

        {/* ── Place Bet button ── */}
        <button
          type="button"
          onClick={handlePlaceBet}
          disabled={submitting || !isBettingOpen}
          style={{
            position:'relative',
            padding:'0',
            height:56,
            borderRadius:'16px',
            background:'transparent',
            overflow:'hidden',
            cursor: submitting||!isBettingOpen ? 'not-allowed' : 'pointer',
            border: isBettingOpen && selectedBet && selGlow
              ? `1px solid rgba(${selGlow},0.4)`
              : '1px solid rgba(255,255,255,0.08)',
            transition:'all 0.2s',
            transform: isBettingOpen && selectedBet && !submitting ? 'translateY(0)' : 'none',
          }}>
          {/* Button background */}
          <div style={{
            position:'absolute', inset:0,
            background: !isBettingOpen
              ? 'rgba(71,85,105,0.4)'
              : selectedBet && selGrad
                ? selGrad
                : 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.08))',
            transition:'background 0.3s',
          }}/>
          {/* Glow overlay when active */}
          {isBettingOpen && selectedBet && selGlow && (
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 100%, rgba(${selGlow},0.3) 0%, transparent 70%)` }}/>
          )}
          {/* Shine */}
          {isBettingOpen && selectedBet && (
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'40%', background:'linear-gradient(180deg,rgba(255,255,255,0.12),transparent)', borderRadius:'16px 16px 0 0' }}/>
          )}
          {/* Button text */}
          <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', height:'100%' }}>
            {submitting ? (
              <>
                <span style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'spin 0.7s linear infinite', display:'inline-block' }}/>
                <span style={{ fontWeight:900, fontSize:'15px', color:'#fff' }}>Placing…</span>
              </>
            ) : !isBettingOpen ? (
              <span style={{ fontWeight:900, fontSize:'15px', color:'#475569' }}>🔒 Betting Closed</span>
            ) : selectedBet ? (
              <>
                <span style={{ fontSize:'18px' }}>
                  {!isNaN(Number(selectedBet)) ? '🎲' : CLR[selectedBet]?.emoji || '🎯'}
                </span>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', lineHeight:1.2 }}>
                  <span style={{ fontWeight:900, fontSize:'15px', color:'#fff' }}>Place ₹{betAmount}</span>
                  <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.65)', fontWeight:700 }}>on {selectedBet}</span>
                </div>
              </>
            ) : (
              <span style={{ fontWeight:800, fontSize:'14px', color:'rgba(255,255,255,0.22)', letterSpacing:'0.2px' }}>Select a colour or number to bet</span>
            )}
          </div>
          {/* Outer glow */}
          {isBettingOpen && selectedBet && selGlow && (
            <div style={{ position:'absolute', inset:-1, borderRadius:'17px', boxShadow:`0 0 20px rgba(${selGlow},0.35)`, pointerEvents:'none' }}/>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TABS: History / Live / My Bets
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ background:'rgba(15,23,42,0.4)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', overflow:'hidden' }}>

        {/* Tab bar */}
        <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          {[
            { key:'history', label:'History',   badge: history.length   },
            { key:'live',    label:'Live Bets', badge: liveBets.length  },
            { key:'mine',    label:'My Bets',   badge: myBets.length    },
          ].map(({ key, label, badge }) => {
            const act = activeTab === key;
            return (
              <button key={key} type="button"
                onClick={() => { setActiveTab(key); if(key==='mine') loadMyBets(); }}
                style={{
                  flex:1, padding:'12px 4px', background:'none', border:'none',
                  borderBottom: act ? '2px solid #6366f1' : '2px solid transparent',
                  color: act ? '#818cf8' : '#64748b',
                  fontWeight:700, fontSize:'12px', cursor:'pointer',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
                  transition:'color 0.15s',
                }}>
                <span>{label}</span>
                {badge > 0 && (
                  <span style={{ fontSize:'9px', padding:'1px 5px', borderRadius:'10px', background: act?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.07)', color: act?'#818cf8':'#475569', fontWeight:800 }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ overflowY:'visible' }}>

          {/* ── History ── */}
          {activeTab === 'history' && (
            <div style={{ display:'flex', flexDirection:'column' }}>
              {history.length === 0
                ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', gap:'10px' }}>
                    <div style={{ fontSize:'32px' }}>🎲</div>
                    <div style={{ color:'#334155', fontSize:'12px', fontWeight:600 }}>No rounds completed yet</div>
                  </div>
                )
                : history.map((r,i) => {
                    const colors = r.result?.colors||[];
                    const num    = r.result?.number ?? '?';
                    const main   = colors[0]||'RED';
                    const c      = CLR[main];
                    const bg     = resultGrad(colors);
                    const isLatest = i === 0;
                    return (
                      <div key={r.roundId||i} style={{
                        display:'flex',
                        alignItems:'center',
                        gap:'10px',
                        padding:'9px 14px',
                        borderBottom:'1px solid rgba(255,255,255,0.04)',
                        background: isLatest
                          ? `rgba(${c?.glow||'99,102,241'},0.07)`
                          : 'transparent',
                        borderLeft: `3px solid ${isLatest ? (c?.solid||'#6366f1') : 'transparent'}`,
                      }}>
                        {/* Number circle */}
                        <div style={{
                          width:38, height:38, borderRadius:'50%',
                          background:bg, flexShrink:0,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontWeight:900, fontSize:'16px', color:'#fff',
                          boxShadow:`0 0 10px rgba(${c?.glow||'99,102,241'},${isLatest?0.5:0.25})`,
                        }}>
                          {num}
                        </div>

                        {/* Colour chips */}
                        <div style={{ display:'flex', gap:'4px', alignItems:'center', flex:1 }}>
                          {isLatest && (
                            <span style={{ padding:'2px 6px', borderRadius:'5px', fontSize:'8px', fontWeight:900, background:'rgba(99,102,241,0.3)', color:'#818cf8', letterSpacing:'0.5px', textTransform:'uppercase' }}>
                              NEW
                            </span>
                          )}
                          {colors.map(cl => (
                            <span key={cl} style={{
                              padding:'3px 9px', borderRadius:'20px', fontSize:'10px', fontWeight:800,
                              background:`rgba(${CLR[cl]?.glow||'99,102,241'},0.15)`,
                              color: CLR[cl]?.solid || '#818cf8',
                              border:`1px solid rgba(${CLR[cl]?.glow||'99,102,241'},0.3)`,
                            }}>
                              {cl}
                            </span>
                          ))}
                        </div>

                        {/* Round number */}
                        <span style={{ fontSize:'10px', color:'#1e293b', fontWeight:700, flexShrink:0 }}>
                          #{r.roundNumber}
                        </span>
                      </div>
                    );
                  })
              }
            </div>
          )}

          {/* ── Live Bets ── */}
          {activeTab === 'live' && (
            <div style={{ display:'flex', flexDirection:'column' }}>
              {liveBets.length === 0
                ? <div style={{ color:'#334155', fontSize:'12px', textAlign:'center', padding:'30px' }}>No bets placed yet this round</div>
                : liveBets.map((b,i) => {
                    const pred = b.prediction||b.selection||'?';
                    const isN  = !isNaN(Number(pred));
                    const glow = isN ? numGlow(pred) : (CLR[pred]?.glow||'99,102,241');
                    const solid= isN ? (CLR[NUM_TO_COLORS[pred]?.[0]||'RED']?.solid||'#fbbf24') : CLR[pred]?.solid||'#818cf8';
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'11px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:`rgba(${glow},0.15)`, border:`1.5px solid rgba(${glow},0.3)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'13px', color:solid, flexShrink:0 }}>
                          {isN ? pred : pred[0]}
                        </div>
                        <span style={{ fontSize:'13px', color:'#94a3b8', fontWeight:600, flex:1 }}>{b.username||'Player'}</span>
                        <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:800, background:`rgba(${glow},0.12)`, color:solid, border:`1px solid rgba(${glow},0.25)` }}>
                          {isN ? `#${pred}` : pred}
                        </span>
                        <span style={{ fontSize:'14px', fontWeight:900, color:'#fbbf24', flexShrink:0 }}>₹{Number(b.amount).toFixed(0)}</span>
                      </div>
                    );
                  })
              }
            </div>
          )}

          {/* ── My Bets ── */}
          {activeTab === 'mine' && (
            <div style={{ display:'flex', flexDirection:'column' }}>
              {!user
                ? <div style={{ color:'#334155', fontSize:'12px', textAlign:'center', padding:'30px' }}>Login to see your bets</div>
                : myBets.length === 0
                  ? <div style={{ color:'#334155', fontSize:'12px', textAlign:'center', padding:'30px' }}>No bets yet — place your first bet!</div>
                  : myBets.map((b,i) => {
                      const pred  = b.prediction||'?';
                      const isN   = !isNaN(Number(pred));
                      const glow  = isN ? numGlow(pred) : (CLR[pred]?.glow||'99,102,241');
                      const solid = isN ? '#fbbf24' : CLR[pred]?.solid||'#818cf8';
                      const isWon = b.status==='WON', isLost = b.status==='LOST';
                      return (
                        <div key={b._id||i} style={{
                          display:'flex', alignItems:'center', gap:'10px', padding:'11px 16px',
                          borderBottom:'1px solid rgba(255,255,255,0.04)',
                          background: isWon?'rgba(16,185,129,0.05)':isLost?'rgba(239,68,68,0.04)':'transparent',
                          borderLeft: isWon?'3px solid #10b981':isLost?'3px solid #ef4444':'3px solid transparent',
                        }}>
                          <span style={{ fontSize:'10px', color:'#1e293b', fontWeight:700, flexShrink:0, minWidth:32 }}>#{b.roundNumber}</span>
                          <span style={{ padding:'3px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:800, background:`rgba(${glow},0.12)`, color:solid, border:`1px solid rgba(${glow},0.25)`, flexShrink:0 }}>
                            {isN ? `#${pred}` : pred}
                          </span>
                          <span style={{ fontSize:'12px', color:'#64748b', flex:1 }}>₹{Number(b.amount).toFixed(0)}</span>
                          <span style={{ fontSize:'13px', fontWeight:800, flexShrink:0, color: isWon?'#34d399':isLost?'#f87171':b.status==='REFUNDED'?'#fbbf24':'#475569' }}>
                            {isWon?`+₹${Number(b.payout||0).toFixed(0)}`:isLost?'LOST':b.status==='REFUNDED'?'REFUND':'PENDING'}
                          </span>
                        </div>
                      );
                    })
              }
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ColourGame;
