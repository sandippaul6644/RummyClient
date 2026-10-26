import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { socket }  from '../../services/socket.js';
import { api }     from '../../services/api.js';
import { ShieldCheck } from 'lucide-react';

// ── Card helpers ───────────────────────────────────────────────────────────────
const SUIT_SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' };
const SUIT_COLOR  = { H: '#ef4444', D: '#ef4444', S: '#f1f5f9', C: '#f1f5f9' };

const CHIPS = [
  { v: '10',   bg: 'linear-gradient(135deg,#60a5fa,#2563eb)', ring: 'rgba(96,165,250,0.8)' },
  { v: '50',   bg: 'linear-gradient(135deg,#fbbf24,#b45309)', ring: 'rgba(251,191,36,0.8)' },
  { v: '100',  bg: 'linear-gradient(135deg,#c084fc,#6d28d9)', ring: 'rgba(192,132,252,0.8)' },
  { v: '500',  bg: 'linear-gradient(135deg,#fcd34d,#92400e)', ring: 'rgba(252,211,77,0.9)' },
  { v: '1000', bg: 'linear-gradient(135deg,#34d399,#047857)', ring: 'rgba(52,211,153,0.8)' },
];

const BET_OPTIONS = [
  { key: 'DRAGON', label: '🐉 DRAGON', sub: '1:1', color: '#3b82f6', glow: '59,130,246'  },
  { key: 'TIE',    label: '🤝 TIE',    sub: '8:1', color: '#f59e0b', glow: '245,158,11'  },
  { key: 'TIGER',  label: '🐯 TIGER',  sub: '1:1', color: '#ef4444', glow: '239,68,68'   },
];

// ── Card face component ────────────────────────────────────────────────────────
const CardFace = ({ card, faceDown }) => {
  if (faceDown || !card) {
    return (
      <div style={{
        width: 70, height: 100, borderRadius: 10,
        background: 'linear-gradient(135deg,#1e293b,#0f172a)',
        border: '2px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, color: '#334155',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      }}>?</div>
    );
  }
  const color  = SUIT_COLOR[card.suit]  || '#f1f5f9';
  const symbol = SUIT_SYMBOL[card.suit] || card.suit;
  return (
    <div style={{
      width: 70, height: 100, borderRadius: 10,
      background: 'linear-gradient(135deg,#1e293b,#162032)',
      border: `2px solid ${color}44`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 12px ${color}33`,
      gap: 4,
    }}>
      <span style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{card.rank}</span>
      <span style={{ fontSize: 22, lineHeight: 1, color }}>{symbol}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export const DragonTigerGame = () => {
  const { user, wallet, refreshWallet, setIsAuthModalOpen } = useAuth();

  // ── Round state ──────────────────────────────────────────────────────────
  const [roundId,        setRoundId]        = useState(null);
  const [roundNumber,    setRoundNumber]     = useState(null);
  const [roundStatus,    setRoundStatus]     = useState('OPEN');
  const [betCloseTime,   setBetCloseTime]    = useState(null);
  const [serverSeedHash, setServerSeedHash]  = useState('');
  const [remainingSec,   setRemainingSec]    = useState(20);
  const [isBettingOpen,  setIsBettingOpen]   = useState(true);

  // ── Result state ─────────────────────────────────────────────────────────
  const [dragonCard,   setDragonCard]   = useState(null);
  const [tigerCard,    setTigerCard]    = useState(null);
  const [winner,       setWinner]       = useState(null);
  const [revealedSeed, setRevealedSeed] = useState(null);

  // ── Betting state ────────────────────────────────────────────────────────
  const [selectedBet, setSelectedBet] = useState(null);
  const [betAmount,   setBetAmount]   = useState('10');
  const [submitting,  setSubmitting]  = useState(false);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [alertMsg,   setAlertMsg]   = useState(null);
  const [alertError, setAlertError] = useState(false);
  const [activeTab,  setActiveTab]  = useState('history');
  const [history,    setHistory]    = useState([]);
  const [myBets,     setMyBets]     = useState([]);
  const [liveBets,   setLiveBets]   = useState([]);
  const [showVerify, setShowVerify] = useState(false);
  const [myBetsPage, setMyBetsPage] = useState(1);

  const countdownRef = useRef(null);

  const showAlert = (msg, isError) => {
    setAlertMsg(msg); setAlertError(isError);
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadGame = useCallback(async () => {
    try {
      const [gr, hr] = await Promise.all([
        api.get('/games/dragontiger'),
        api.get('/games/dragontiger/history?limit=20'),
      ]);
      if (gr.data?.success) {
        const r = gr.data.data?.currentRound;
        if (r) {
          setRoundId(r._id || r.roundId || null);
          setRoundNumber(r.roundNumber);
          setRoundStatus(r.status);
          setServerSeedHash(r.serverSeedHash || '');
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
      const res = await api.get(`/games/dragontiger/my-bets?limit=20&page=${myBetsPage}`);
      if (res.data?.success) setMyBets(res.data.data?.bets || []);
    } catch {}
  }, [user, myBetsPage]);

  // ── Countdown from betCloseTime ───────────────────────────────────────────
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

  // ── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadGame();
    socket.emit('game:join', { gameSlug: 'dragontiger' });

    // New betting round starts — reset result state
    socket.on('dt:round:betting', d => {
      setRoundNumber(d.roundNumber);
      setRoundStatus('OPEN');
      setServerSeedHash(d.serverSeedHash || '');
      setBetCloseTime(d.betEndsAt || d.betCloseTime || null);
      setIsBettingOpen(true);
      setDragonCard(null);
      setTigerCard(null);
      setWinner(null);
      setRevealedSeed(null);
      setLiveBets([]);
    });

    // Betting closed, cards being dealt
    socket.on('dt:round:dealing', () => {
      setRoundStatus('CLOSED');
      setIsBettingOpen(false);
    });

    // Cards revealed
    socket.on('dt:round:result', d => {
      setDragonCard(d.dragonCard || null);
      setTigerCard(d.tigerCard   || null);
      setWinner(d.winner         || null);
      setRoundStatus('RESULT_GENERATED');
    });

    // Round settled — reveal server seed
    socket.on('dt:round:settled', d => {
      setRevealedSeed(d.serverSeed || null);
      setRoundStatus('SETTLED');
      setHistory(prev => [{
        roundNumber: d.roundNumber,
        winner:      d.winner,
        dragonCard:  d.dragonCard,
        tigerCard:   d.tigerCard,
      }, ...prev.slice(0, 19)]);
      refreshWallet();
      if (user) loadMyBets();
    });

    // Countdown tick from server
    socket.on('dt:tick', d => {
      if (d.remainingSec !== undefined) setRemainingSec(d.remainingSec);
      if (d.isBettingOpen !== undefined) setIsBettingOpen(d.isBettingOpen);
    });

    // Live bet feed
    socket.on('dt:bet:placed', bet => {
      setLiveBets(prev => [bet, ...prev.slice(0, 9)]);
    });

    return () => {
      socket.emit('game:leave', { gameSlug: 'dragontiger' });
      ['dt:round:betting','dt:round:dealing','dt:round:result',
       'dt:round:settled','dt:tick','dt:bet:placed',
      ].forEach(ev => socket.off(ev));
    };
  }, [loadGame, loadMyBets, refreshWallet, user]);

  useEffect(() => { if (user) loadMyBets(); }, [user, loadMyBets]);

  // ── Place bet ──────────────────────────────────────────────────────────────
  const handlePlaceBet = async () => {
    if (!user) { setIsAuthModalOpen(true); return; }
    if (!selectedBet) { showAlert('Select Dragon, Tie, or Tiger first', true); return; }
    const num = Number(betAmount);
    if (isNaN(num) || num <= 0) { showAlert('Enter a valid amount', true); return; }
    if (wallet && num > Number(wallet.balance)) { showAlert('Insufficient balance', true); return; }
    if (!isBettingOpen) { showAlert('Betting is closed', true); return; }

    setSubmitting(true);
    try {
      const res = await api.post('/games/dragontiger/bets', {
        selection: selectedBet,
        amount:    parseFloat(betAmount),
      });
      if (res.data?.success) {
        showAlert(`₹${num.toFixed(0)} on ${selectedBet} ✓`, false);
        refreshWallet();
        if (user) loadMyBets();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Bet failed', true);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived display values ─────────────────────────────────────────────────
  const countdown = remainingSec;
  const cdColor   = countdown <= 5 ? '#f87171' : countdown <= 10 ? '#fbbf24' : '#34d399';
  const timerPct  = Math.min(100, (countdown / 20) * 100);
  const selOpt    = BET_OPTIONS.find(o => o.key === selectedBet);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#fff' }}>

      {/* ═══════════════════════════════════════════════════════════════
          ROUND HEADER
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(239,68,68,0.1))',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: 18, padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(10px)',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
            ROUND #{roundNumber ?? '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 800,
              background: isBettingOpen ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${isBettingOpen ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color: isBettingOpen ? '#34d399' : '#f87171',
            }}>
              {isBettingOpen ? '● BETTING OPEN'
                : roundStatus === 'SETTLED'          ? '✓ SETTLED'
                : roundStatus === 'RESULT_GENERATED' ? '🃏 RESULT'
                : '⏸ DEALING'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Countdown ring */}
          {isBettingOpen && (
            <div style={{ position: 'relative', width: 52, height: 52 }}>
              <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3"/>
                <circle cx="26" cy="26" r="22" fill="none" stroke={cdColor} strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - timerPct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: cdColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{countdown}</span>
                <span style={{ fontSize: 8, color: '#64748b', fontWeight: 700 }}>SEC</span>
              </div>
            </div>
          )}

          {/* Provably fair toggle */}
          <button type="button" onClick={() => setShowVerify(!showVerify)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', padding: '8px 10px', borderRadius: 12, cursor: 'pointer' }}>
            <ShieldCheck size={14}/>
            <span style={{ fontSize: 8, fontWeight: 800 }}>FAIR</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          HISTORY BADGES
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 0', cursor: 'pointer' }}
        onClick={() => setActiveTab('history')}>
        {history.slice(0, 20).map((r, i) => {
          const w  = r.winner;
          const bg = w === 'DRAGON' ? '#3b82f6' : w === 'TIGER' ? '#ef4444' : '#f59e0b';
          return (
            <div key={i} style={{
              width: 34, height: 34, borderRadius: '50%', background: bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 11, color: '#fff', flexShrink: 0,
              border: '2px solid rgba(255,255,255,0.12)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}>
              {w === 'DRAGON' ? 'D' : w === 'TIGER' ? 'T' : '='}
            </div>
          );
        })}
        {history.length > 0 && (
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)', fontSize: 14, color: '#334155' }}>›</div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CARD DISPLAY
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(15,23,42,0.9),rgba(9,14,30,0.95))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18, padding: '20px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        backdropFilter: 'blur(10px)',
      }}>
        {/* Dragon side */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#60a5fa', letterSpacing: 1, textTransform: 'uppercase' }}>🐉 Dragon</div>
          <CardFace card={dragonCard} faceDown={!dragonCard} />
          {winner === 'DRAGON' && (
            <div style={{ fontSize: 10, fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', padding: '3px 10px', borderRadius: 20 }}>WINNER!</div>
          )}
        </div>

        {/* Centre VS */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'rgba(255,255,255,0.15)' }}>VS</div>
          {winner === 'TIE' && (
            <div style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', padding: '3px 10px', borderRadius: 20 }}>TIE!</div>
          )}
        </div>

        {/* Tiger side */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#f87171', letterSpacing: 1, textTransform: 'uppercase' }}>🐯 Tiger</div>
          <CardFace card={tigerCard} faceDown={!tigerCard} />
          {winner === 'TIGER' && (
            <div style={{ fontSize: 10, fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', padding: '3px 10px', borderRadius: 20 }}>WINNER!</div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          PROVABLY FAIR PANEL
      ═══════════════════════════════════════════════════════════════ */}
      {showVerify && (
        <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '14px 16px', fontSize: 11 }}>
          <div style={{ color: '#818cf8', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={13}/> Provably Fair — HMAC-SHA256-DECK-DUAL-v1
          </div>
          <div style={{ color: '#64748b', lineHeight: 1.8, wordBreak: 'break-all' }}>
            <div><span style={{ color: '#334155' }}>Committed Hash: </span><span style={{ fontFamily: 'monospace', fontSize: 10 }}>{serverSeedHash || '—'}</span></div>
            {revealedSeed && (
              <div style={{ color: '#34d399' }}><span style={{ color: '#334155' }}>Revealed Seed: </span><span style={{ fontFamily: 'monospace', fontSize: 10 }}>{revealedSeed}</span></div>
            )}
          </div>
          {revealedSeed && roundId && (
            <button type="button"
              onClick={async () => {
                try {
                  const res = await api.get(`/games/dragontiger/verify/${roundId}`);
                  if (res.data?.success) {
                    const v = res.data.data;
                    showAlert(v.valid ? '✓ Provably fair verified!' : `✗ Mismatch: ${v.reason}`, !v.valid);
                  }
                } catch { showAlert('Verification failed', true); }
              }}
              style={{ marginTop: 8, padding: '5px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              Verify Round
            </button>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          BET ROW — DRAGON  |  TIE  |  TIGER
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {BET_OPTIONS.map(opt => {
          const sel = selectedBet === opt.key;
          return (
            <button key={opt.key} type="button" onClick={() => setSelectedBet(sel ? null : opt.key)}
              style={{
                padding: '14px 8px 12px',
                borderRadius: 16,
                border: sel ? `2px solid ${opt.color}` : `1.5px solid rgba(${opt.glow},0.2)`,
                background: sel
                  ? `linear-gradient(135deg,rgba(${opt.glow},0.35),rgba(${opt.glow},0.18))`
                  : `rgba(${opt.glow},0.07)`,
                cursor: 'pointer',
                transform: sel ? 'scale(1.04) translateY(-2px)' : 'scale(1)',
                boxShadow: sel
                  ? `0 8px 24px rgba(${opt.glow},0.4), inset 0 1px 0 rgba(255,255,255,0.15)`
                  : '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: sel ? '#fff' : `rgba(${opt.glow},0.9)` }}>{opt.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: sel ? 'rgba(255,255,255,0.7)' : `rgba(${opt.glow},0.6)` }}>{opt.sub}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BET AMOUNT SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ background: 'linear-gradient(180deg,rgba(15,23,42,0.7),rgba(9,14,30,0.8))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, backdropFilter: 'blur(8px)' }}>

        {/* Chips */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Quick Bet</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
            {CHIPS.map(({ v, bg, ring }) => {
              const act = betAmount === v;
              return (
                <button key={v} type="button" onClick={() => setBetAmount(v)}
                  style={{
                    position: 'relative', background: bg, borderRadius: 10, height: 40,
                    border: act ? `2px solid ${ring}` : '1px solid rgba(255,255,255,0.08)',
                    color: '#fff', fontWeight: 900, fontSize: 11, cursor: 'pointer',
                    boxShadow: act ? `0 0 16px ${ring}, inset 0 1px 0 rgba(255,255,255,0.2)` : '0 2px 6px rgba(0,0,0,0.3)',
                    transform: act ? 'scale(1.06) translateY(-1px)' : 'scale(1)',
                    transition: 'all 0.15s', overflow: 'hidden',
                  }}>
                  {act && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)' }}/>}
                  ₹{v}
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount input row */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Bet Amount</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ color: '#475569', fontSize: 16, fontWeight: 800 }}>₹</span>
              </div>
              <input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} min="1"
                style={{ width: '100%', height: '100%', padding: '0 14px 0 50px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 20, fontWeight: 700, outline: 'none', boxSizing: 'border-box', minHeight: 48 }}
              />
            </div>
            {[
              ['½',  () => setBetAmount(s => String(Math.max(1, Math.floor(Number(s)/2))))],
              ['2×', () => setBetAmount(s => String(Number(s)*2))],
              ['MAX', () => wallet && setBetAmount(String(Math.floor(Number(wallet.balance))))],
            ].map(([label, fn]) => (
              <button key={label} type="button" onClick={fn}
                style={{ padding: '0 13px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: label === 'MAX' ? '#fbbf24' : '#94a3b8', cursor: 'pointer', fontWeight: 800, fontSize: 12, flexShrink: 0, whiteSpace: 'nowrap', height: 48, transition: 'background 0.15s' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Balance pill */}
        {wallet && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 11, color: '#334155', fontWeight: 700 }}>Balance</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#94a3b8' }}>
              ₹{Number(wallet.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Alert */}
        {alertMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, textAlign: 'center', background: alertError ? 'rgba(239,68,68,0.12)' : 'rgba(52,211,153,0.12)', border: `1px solid ${alertError ? 'rgba(239,68,68,0.4)' : 'rgba(52,211,153,0.4)'}`, color: alertError ? '#f87171' : '#34d399' }}>
            {alertMsg}
          </div>
        )}

        {/* Place Bet button */}
        <button type="button" onClick={handlePlaceBet}
          disabled={!isBettingOpen || submitting || !selectedBet}
          style={{
            position: 'relative', padding: 0, height: 56, borderRadius: 16,
            background: 'transparent', overflow: 'hidden',
            cursor: (!isBettingOpen || submitting || !selectedBet) ? 'not-allowed' : 'pointer',
            border: isBettingOpen && selOpt ? `1px solid rgba(${selOpt.glow},0.4)` : '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.2s',
          }}>
          {/* bg fill */}
          <div style={{
            position: 'absolute', inset: 0,
            background: !isBettingOpen
              ? 'rgba(71,85,105,0.4)'
              : selOpt
                ? `linear-gradient(135deg,rgba(${selOpt.glow},0.35),rgba(${selOpt.glow},0.18))`
                : 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.08))',
            transition: 'background 0.3s',
          }}/>
          {/* glow */}
          {isBettingOpen && selOpt && (
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 100%, rgba(${selOpt.glow},0.25) 0%, transparent 70%)` }}/>
          )}
          {/* shine */}
          {isBettingOpen && selectedBet && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg,rgba(255,255,255,0.1),transparent)', borderRadius: '16px 16px 0 0' }}/>
          )}
          {/* label */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: '100%' }}>
            {submitting ? (
              <>
                <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }}/>
                <span style={{ fontWeight: 900, fontSize: 15, color: '#fff' }}>Placing…</span>
              </>
            ) : !isBettingOpen ? (
              <span style={{ fontWeight: 900, fontSize: 15, color: '#475569' }}>🔒 Betting Closed</span>
            ) : selectedBet ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                <span style={{ fontWeight: 900, fontSize: 15, color: '#fff' }}>Place ₹{betAmount}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 700 }}>on {selectedBet}</span>
              </div>
            ) : (
              <span style={{ fontWeight: 800, fontSize: 14, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.2px' }}>Select Dragon, Tie, or Tiger to bet</span>
            )}
          </div>
          {/* outer glow ring */}
          {isBettingOpen && selOpt && (
            <div style={{ position: 'absolute', inset: -1, borderRadius: 17, boxShadow: `0 0 20px rgba(${selOpt.glow},0.3)`, pointerEvents: 'none' }}/>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TABS — History | Live Bets | My Bets
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { key: 'history', label: 'History',   badge: history.length   },
            { key: 'live',    label: 'Live Bets', badge: liveBets.length  },
            { key: 'mine',    label: 'My Bets',   badge: myBets.length    },
          ].map(({ key, label, badge }) => {
            const act = activeTab === key;
            return (
              <button key={key} type="button"
                onClick={() => { setActiveTab(key); if (key === 'mine') loadMyBets(); }}
                style={{
                  flex: 1, padding: '12px 4px', background: 'none', border: 'none',
                  borderBottom: act ? '2px solid #6366f1' : '2px solid transparent',
                  color: act ? '#818cf8' : '#64748b',
                  fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  transition: 'color 0.15s',
                }}>
                <span>{label}</span>
                {badge > 0 && (
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 10, background: act ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.07)', color: act ? '#818cf8' : '#475569', fontWeight: 800 }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ minHeight: 120 }}>

          {/* ── History ── */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {history.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 10 }}>
                  <div style={{ fontSize: 32 }}>🃏</div>
                  <div style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>No rounds completed yet</div>
                </div>
              ) : history.map((r, i) => {
                const w   = r.winner;
                const bg  = w === 'DRAGON' ? '#3b82f6' : w === 'TIGER' ? '#ef4444' : '#f59e0b';
                const dc  = r.dragonCard;
                const tc  = r.tigerCard;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: i === 0 ? `${bg}11` : 'transparent', borderLeft: `3px solid ${i === 0 ? bg : 'transparent'}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: `0 0 10px ${bg}66` }}>
                      {w === 'DRAGON' ? 'D' : w === 'TIGER' ? 'T' : '='}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
                        Round #{r.roundNumber}
                        {i === 0 && <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 5, fontSize: 8, fontWeight: 900, background: 'rgba(99,102,241,0.3)', color: '#818cf8', textTransform: 'uppercase' }}>NEW</span>}
                      </div>
                      {dc && tc && (
                        <div style={{ fontSize: 10, color: '#475569' }}>
                          Dragon: {dc.rank}{SUIT_SYMBOL[dc.suit] || dc.suit} · Tiger: {tc.rank}{SUIT_SYMBOL[tc.suit] || tc.suit}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: bg, background: `${bg}22`, padding: '2px 8px', borderRadius: 20, border: `1px solid ${bg}44` }}>{w}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Live Bets ── */}
          {activeTab === 'live' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {liveBets.length === 0 ? (
                <div style={{ color: '#334155', fontSize: 12, textAlign: 'center', padding: '30px' }}>No bets placed yet this round</div>
              ) : liveBets.map((b, i) => {
                const sel = b.selection || '?';
                const sc  = sel === 'DRAGON' ? '#3b82f6' : sel === 'TIGER' ? '#ef4444' : '#f59e0b';
                const sg  = sel === 'DRAGON' ? '59,130,246' : sel === 'TIGER' ? '239,68,68' : '245,158,11';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: `rgba(${sg},0.15)`, border: `1.5px solid rgba(${sg},0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: sc, flexShrink: 0 }}>
                      {sel[0]}
                    </div>
                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, flex: 1 }}>{b.username || 'Player'}</span>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: `rgba(${sg},0.12)`, color: sc, border: `1px solid rgba(${sg},0.25)` }}>{sel}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24', flexShrink: 0 }}>₹{Number(b.amount || 0).toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── My Bets ── */}
          {activeTab === 'mine' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {!user ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#334155', fontSize: 12 }}>Login to see your bets</div>
              ) : myBets.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#334155', fontSize: 12 }}>No bets placed yet</div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ color: '#475569', fontSize: 10, textTransform: 'uppercase' }}>
                          {['Round','Selection','Amount','Status','Payout'].map(h => (
                            <th key={h} style={{ padding: '6px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 700 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {myBets.map((b, i) => {
                          const sc = b.selection === 'DRAGON' ? '#3b82f6' : b.selection === 'TIGER' ? '#ef4444' : '#f59e0b';
                          const st = b.status === 'WON' ? '#34d399' : b.status === 'LOST' ? '#f87171' : b.status === 'REFUNDED' ? '#fbbf24' : '#64748b';
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '7px 12px', color: '#94a3b8' }}>#{b.roundNumber}</td>
                              <td style={{ padding: '7px 12px' }}><span style={{ color: sc, fontWeight: 700 }}>{b.selection}</span></td>
                              <td style={{ padding: '7px 12px', color: '#fbbf24', fontWeight: 700 }}>₹{b.amount}</td>
                              <td style={{ padding: '7px 12px' }}><span style={{ color: st, fontWeight: 700, fontSize: 10 }}>{b.status}</span></td>
                              <td style={{ padding: '7px 12px', color: b.payout > 0 ? '#34d399' : '#475569', fontWeight: 700 }}>
                                {b.payout > 0 ? `₹${b.payout}` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  <div style={{ display: 'flex', gap: 8, padding: '10px 14px', justifyContent: 'center', alignItems: 'center' }}>
                    <button type="button" onClick={() => setMyBetsPage(p => Math.max(1, p - 1))} disabled={myBetsPage <= 1}
                      style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: myBetsPage <= 1 ? 'not-allowed' : 'pointer', fontSize: 11 }}>
                      ← Prev
                    </button>
                    <span style={{ fontSize: 11, color: '#475569' }}>Page {myBetsPage}</span>
                    <button type="button" onClick={() => setMyBetsPage(p => p + 1)}
                      style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer', fontSize: 11 }}>
                      Next →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
