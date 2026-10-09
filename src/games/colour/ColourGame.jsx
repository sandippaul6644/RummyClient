import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { socket } from '../../services/socket.js';
import { api } from '../../services/api.js';
import { sound } from '../../utils/sound.js';
import { ShieldCheck, History, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

// ── Color helpers ─────────────────────────────────────────────────────────────
const COLOR_GRADIENT = {
  RED:    'linear-gradient(135deg, #ff4b63 0%, #ef4444 100%)',
  GREEN:  'linear-gradient(135deg, #00f59b 0%, #059669 100%)',
  VIOLET: 'linear-gradient(135deg, #ff4ef9 0%, #a855f7 100%)',
};

const getResultGradient = (colors = []) => {
  const c = colors.map(x => x.toUpperCase());
  if (c.includes('RED')   && c.includes('VIOLET')) return 'linear-gradient(135deg, #ff4b63 50%, #d946ef 50%)';
  if (c.includes('GREEN') && c.includes('VIOLET')) return 'linear-gradient(135deg, #00f59b 50%, #d946ef 50%)';
  if (c.includes('GREEN'))  return COLOR_GRADIENT.GREEN;
  if (c.includes('RED'))    return COLOR_GRADIENT.RED;
  if (c.includes('VIOLET')) return COLOR_GRADIENT.VIOLET;
  return '#6366f1';
};

const getNumberColors = (n) => {
  const str = String(n);
  if (str === '0') return ['RED', 'VIOLET'];
  if (str === '5') return ['GREEN', 'VIOLET'];
  if (['1','3','7','9'].includes(str)) return ['GREEN'];
  return ['RED'];
};

const CHIPS = ['1','5','10','25','50','100','500'];
const CHIP_THEMES = {
  '1':   { bg: 'linear-gradient(135deg,#64748b,#334155)', border: 'rgba(148,163,184,0.6)', color: '#f8fafc' },
  '5':   { bg: 'linear-gradient(135deg,#ef4444,#b91c1c)', border: 'rgba(248,113,113,0.8)', color: '#fff' },
  '10':  { bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', border: 'rgba(96,165,250,0.8)',  color: '#fff' },
  '25':  { bg: 'linear-gradient(135deg,#10b981,#047857)', border: 'rgba(52,211,153,0.8)',  color: '#fff' },
  '50':  { bg: 'linear-gradient(135deg,#f59e0b,#b45309)', border: 'rgba(251,191,36,0.8)',  color: '#fff' },
  '100': { bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', border: 'rgba(192,132,252,0.8)', color: '#fff' },
  '500': { bg: 'linear-gradient(135deg,#0f172a,#1e1b4b)', border: 'rgba(251,191,36,0.9)',  color: '#fcd34d' },
};

// ── Main component ─────────────────────────────────────────────────────────────
export const ColourGame = () => {
  const { user, wallet, refreshWallet, setIsAuthModalOpen } = useAuth();

  // Round state
  const [roundId,       setRoundId]       = useState(null);
  const [roundNumber,   setRoundNumber]   = useState(null);
  const [roundStatus,   setRoundStatus]   = useState('OPEN');
  const [betCloseTime,  setBetCloseTime]  = useState(null);
  const [serverSeedHash,setServerSeedHash]= useState('');
  const [remainingSec,  setRemainingSec]  = useState(30);
  const [isBettingOpen, setIsBettingOpen] = useState(true);

  // Result state
  const [lastResult,    setLastResult]    = useState(null);
  const [revealedSeed,  setRevealedSeed]  = useState(null);
  const [history,       setHistory]       = useState([]);
  const [myBets,        setMyBets]        = useState([]);
  const [liveBets,      setLiveBets]      = useState([]);

  // UI state
  const [selectedBet,   setSelectedBet]   = useState(null);
  const [betAmount,     setBetAmount]      = useState('10');
  const [submitting,    setSubmitting]     = useState(false);
  const [alertMsg,      setAlertMsg]       = useState('');
  const [alertError,    setAlertError]     = useState(false);
  const [activeTab,     setActiveTab]      = useState('history');
  const [showVerify,    setShowVerify]     = useState(false);
  const [loadingHistory,setLoadingHistory] = useState(false);

  const countdownRef = useRef(null);

  // ── Load initial data ────────────────────────────────────────────────────
  const loadGame = useCallback(async () => {
    try {
      const [gameRes, histRes] = await Promise.all([
        api.get('/games/colour'),
        api.get('/games/colour/history?limit=20'),
      ]);

      if (gameRes.data?.success) {
        const { currentRound } = gameRes.data.data;
        if (currentRound) {
          setRoundId(currentRound.roundId);
          setRoundNumber(currentRound.roundNumber);
          setRoundStatus(currentRound.status);
          setServerSeedHash(currentRound.serverSeedHash);
          setBetCloseTime(currentRound.betCloseTime);
          setIsBettingOpen(currentRound.status === 'OPEN');
          setRemainingSec(currentRound.remainingSec || 0);
        }
      }

      if (histRes.data?.success) setHistory(histRes.data.data || []);
    } catch (err) { console.error('[ColourGame] Load failed:', err.message); }
  }, []);

  const loadMyBets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/games/colour/my-bets?limit=30');
      if (res.data?.success) setMyBets(res.data.data?.bets || []);
    } catch {}
  }, [user]);

  // ── Client-side countdown from betCloseTime ──────────────────────────────
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

  // ── Socket event handlers ─────────────────────────────────────────────────
  useEffect(() => {
    loadGame();
    socket.emit('game:join', { gameSlug: 'colour' });

    // New round opened
    socket.on('colour:round:open', (data) => {
      setRoundId(data.roundId);
      setRoundNumber(data.roundNumber);
      setRoundStatus('OPEN');
      setServerSeedHash(data.serverSeedHash);
      setBetCloseTime(data.betCloseTime);
      setIsBettingOpen(true);
      setLiveBets([]);
      setLastResult(null);
      setRevealedSeed(null);
      setShowVerify(false);
      sound.playBeep && sound.playBeep(true);
    });

    // Round created (shows hash before open)
    socket.on('colour:round:created', (data) => {
      setServerSeedHash(data.serverSeedHash);
    });

    // Server tick (backup countdown)
    socket.on('colour:round:tick', (data) => {
      if (data.remainingSec <= 5 && data.remainingSec > 0) {
        sound.playBeep && sound.playBeep(false);
      }
    });

    // Round closed — no more bets
    socket.on('colour:round:closed', () => {
      setIsBettingOpen(false);
      setRoundStatus('CLOSED');
    });

    // Result announced
    socket.on('colour:round:result', (data) => {
      const res = data.result || data.resultData;
      setLastResult(res);
      setRoundStatus('RESULT_GENERATED');

      if (res?.colors) {
        try {
          confetti({ particleCount: 65, spread: 80, origin: { y: 0.45 },
            colors: ['#00f59b', '#d946ef', '#ff4b63', '#ffe066'] });
        } catch {}
        sound.playWin && sound.playWin();
      }
    });

    // Round fully settled — reveal seed
    socket.on('colour:round:settled', (data) => {
      setRoundStatus('SETTLED');
      setRevealedSeed(data.serverSeed || null);
      // Update history
      setHistory(prev => [
        {
          roundId:        data.roundId,
          roundNumber:    data.roundNumber,
          result:         data.result,
          serverSeedHash: data.serverSeedHash,
        },
        ...prev.slice(0, 19),
      ]);
      refreshWallet();
      loadMyBets();
    });

    // Someone placed a bet
    socket.on('colour:bet:placed', (bet) => {
      setLiveBets(prev => [bet, ...prev.slice(0, 19)]);
    });

    return () => {
      socket.emit('game:leave', { gameSlug: 'colour' });
      ['colour:round:open','colour:round:created','colour:round:tick',
       'colour:round:closed','colour:round:result','colour:round:settled',
       'colour:bet:placed',
       // Legacy events (backward compat while old engine still referenced)
       'colour:round_start','colour:tick','colour:betting_closed',
       'colour:new_bet','colour:round_result',
      ].forEach(ev => socket.off(ev));
    };
  }, [loadGame, loadMyBets, refreshWallet]);

  // Load my bets when user logs in
  useEffect(() => { if (user) loadMyBets(); }, [user, loadMyBets]);

  // ── Bet placement ─────────────────────────────────────────────────────────
  const handlePlaceBet = async () => {
    if (!user) { setIsAuthModalOpen(true); return; }
    if (!selectedBet) { setAlert('Select a colour or number first', true); return; }

    const num = Number(betAmount);
    if (isNaN(num) || num <= 0) { setAlert('Enter a valid bet amount', true); return; }
    if (wallet && num > Number(wallet.balance)) { setAlert('Insufficient balance', true); return; }
    if (!isBettingOpen) { setAlert('Betting is closed for this round', true); return; }

    setSubmitting(true);
    setAlertMsg('');
    sound.playClick && sound.playClick();

    try {
      const res = await api.post('/games/colour/bets', {
        prediction:     selectedBet,
        amount:         num,
        idempotencyKey: `${user._id || user.id}:${roundId}:${selectedBet}:${Date.now()}`,
      });

      if (res.data?.success) {
        sound.playCashout && sound.playCashout();
        setAlert(`₹${num.toFixed(0)} on ${selectedBet}! ✓`, false);
        setMyBets(prev => [res.data.data, ...prev]);
        refreshWallet();
      }
    } catch (err) {
      setAlert(err.response?.data?.message || 'Bet failed. Please retry.', true);
    } finally {
      setSubmitting(false);
    }
  };

  const setAlert = (msg, isError) => {
    setAlertMsg(msg);
    setAlertError(isError);
    setTimeout(() => setAlertMsg(''), 3500);
  };

  // ── Number button style ───────────────────────────────────────────────────
  const getNumStyle = (n, isSelected) => {
    const colors = getNumberColors(n);
    const isPurple = colors.includes('VIOLET');
    const isGreen  = colors.includes('GREEN') && !isPurple;
    const baseGrad = isPurple && colors.includes('RED')   ? `linear-gradient(135deg, #ff4b63 50%, #d946ef 50%)`
                   : isPurple && colors.includes('GREEN') ? `linear-gradient(135deg, #00f59b 50%, #d946ef 50%)`
                   : isGreen ? COLOR_GRADIENT.GREEN
                   : COLOR_GRADIENT.RED;

    return isSelected
      ? { background: baseGrad, border: '2px solid #fff', boxShadow: '0 0 20px rgba(255,255,255,0.3)', color: '#fff', transform: 'scale(1.08)', transition: 'all 0.15s' }
      : { background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.15)', color: '#cbd5e1', transition: 'all 0.15s' };
  };

  const countdown = remainingSec;
  const countdownColor = countdown <= 5 ? '#f87171' : countdown <= 10 ? '#fbbf24' : '#34d399';
  const timerPercent   = Math.min(100, (countdown / 25) * 100);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="colour-game-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* ── Top status bar ── */}
      <div className="colour-top-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textTransform: 'uppercase' }}>
            ROUND #{roundNumber ?? '—'}
          </span>
          <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '12px', fontWeight: 800,
            background: isBettingOpen ? 'rgba(0,245,155,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${isBettingOpen ? 'rgba(0,245,155,0.5)' : 'rgba(239,68,68,0.4)'}`,
            color: isBettingOpen ? '#00f59b' : '#f87171',
          }}>
            {isBettingOpen ? '● BETTING OPEN' : roundStatus === 'SETTLED' ? '✓ SETTLED' : '🔒 CALCULATING'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Countdown */}
          {isBettingOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} color={countdownColor} />
              <span style={{ fontWeight: 900, fontSize: '20px', color: countdownColor, fontVariantNumeric: 'tabular-nums', minWidth: '28px', textAlign: 'right' }}>{countdown}</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>s</span>
            </div>
          )}
          {/* Provably Fair */}
          <button type="button" onClick={() => setShowVerify(!showVerify)}
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc', padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} /> FAIR
          </button>
        </div>
      </div>

      {/* ── Timer bar ── */}
      {isBettingOpen && (
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${timerPercent}%`, background: `linear-gradient(90deg, ${countdownColor}, ${countdownColor}88)`, transition: 'width 0.5s linear' }} />
        </div>
      )}

      {/* ── Provably fair info ── */}
      {showVerify && (
        <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '11px' }}>
          <div style={{ color: '#a78bfa', fontWeight: 800, marginBottom: '6px' }}>🔐 Provably Fair — HMAC-SHA256-v1</div>
          <div style={{ color: '#94a3b8', wordBreak: 'break-all', lineHeight: 1.7 }}>
            <div><span style={{ color: '#64748b' }}>Committed Hash:</span> {serverSeedHash || '—'}</div>
            {revealedSeed && <div style={{ color: '#34d399' }}><span style={{ color: '#64748b' }}>Revealed Seed:</span> {revealedSeed}</div>}
          </div>
          <div style={{ color: '#475569', marginTop: '6px', fontSize: '10px' }}>Verify: sha256(serverSeed) === hash above → HMAC(seed, "colour_public_seed_v1:{nonce}")</div>
        </div>
      )}

      {/* ── Last result ── */}
      {lastResult && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '14px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>LAST RESULT</div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getResultGradient(lastResult.colors), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px', color: '#fff', boxShadow: '0 0 20px rgba(0,0,0,0.4)' }}>
            {lastResult.number}
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '14px' }}>{lastResult.colors?.join(' + ')}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Round #{roundNumber}</div>
          </div>
        </div>
      )}

      {/* ── History strip (clickable → opens History tab) ── */}
      {history.length > 0 && (
        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', padding: '2px 0', cursor: 'pointer' }}
          onClick={() => setActiveTab('history')} title="See full history">
          {history.slice(0, 20).map((r, i) => (
            <div key={r.roundId || i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: getResultGradient(r.result?.colors || []), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', color: '#fff', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.15)' }}>
              {r.result?.number ?? '?'}
            </div>
          ))}
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', color: '#475569' }}>
            ›
          </div>
        </div>
      )}

      {/* ── Color buttons ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {['RED','GREEN','VIOLET'].map(color => (
          <button key={color} type="button" onClick={() => setSelectedBet(color)}
            style={{
              padding: '14px 8px',
              borderRadius: '14px',
              border: selectedBet === color ? '2px solid #fff' : '1.5px solid rgba(255,255,255,0.15)',
              background: selectedBet === color ? COLOR_GRADIENT[color] : 'rgba(255,255,255,0.05)',
              color: selectedBet === color ? '#fff' : '#94a3b8',
              fontWeight: 900,
              fontSize: '13px',
              cursor: 'pointer',
              transform: selectedBet === color ? 'scale(1.04)' : 'none',
              boxShadow: selectedBet === color ? '0 0 20px rgba(255,255,255,0.2)' : 'none',
              transition: 'all 0.15s',
            }}>
            {color}
          </button>
        ))}
      </div>

      {/* ── Number buttons ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
        {['0','1','2','3','4','5','6','7','8','9'].map(n => (
          <button key={n} type="button" onClick={() => setSelectedBet(n)}
            style={{ ...getNumStyle(n, selectedBet === n), padding: '12px 0', borderRadius: '10px', fontWeight: 900, fontSize: '16px', cursor: 'pointer' }}>
            {n}
          </button>
        ))}
      </div>

      {/* ── Chips + Bet amount ── */}
      <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
        {CHIPS.map(chip => {
          const t = CHIP_THEMES[chip];
          const isActive = betAmount === chip;
          return (
            <button key={chip} type="button" onClick={() => setBetAmount(chip)}
              style={{ background: t.bg, border: isActive ? `2px solid ${t.border}` : `1px solid ${t.border}44`, color: t.color, borderRadius: '50%', width: '44px', height: '44px', fontWeight: 900, fontSize: '11px', cursor: 'pointer', flexShrink: 0, boxShadow: isActive ? `0 0 12px ${t.border}` : 'none', transform: isActive ? 'scale(1.1)' : 'none', transition: 'all 0.15s' }}>
              ₹{chip}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} min="1"
          style={{ flex: 1, padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: 700, outline: 'none' }} />
        <button type="button" onClick={() => setBetAmount(String(Math.floor(Number(betAmount) / 2)))} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>½</button>
        <button type="button" onClick={() => setBetAmount(String(Number(betAmount) * 2))} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>2×</button>
      </div>

      {/* ── Place Bet button ── */}
      {alertMsg && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, textAlign: 'center',
          background: alertError ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)',
          border: `1px solid ${alertError ? 'rgba(239,68,68,0.4)' : 'rgba(52,211,153,0.4)'}`,
          color: alertError ? '#f87171' : '#34d399' }}>
          {alertMsg}
        </div>
      )}

      <button type="button" onClick={handlePlaceBet} disabled={submitting || !isBettingOpen}
        style={{
          padding: '15px',
          borderRadius: '14px',
          border: 'none',
          background: !isBettingOpen ? 'rgba(100,116,139,0.3)'
            : selectedBet ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'rgba(99,102,241,0.2)',
          color: !isBettingOpen || !selectedBet ? '#475569' : '#fff',
          fontWeight: 900,
          fontSize: '15px',
          cursor: submitting || !isBettingOpen ? 'not-allowed' : 'pointer',
          boxShadow: isBettingOpen && selectedBet ? '0 4px 20px rgba(99,102,241,0.4)' : 'none',
          transition: 'all 0.2s',
          letterSpacing: '-0.3px',
        }}>
        {submitting ? 'Placing…' : !isBettingOpen ? '🔒 Betting Closed' : selectedBet ? `Bet ₹${betAmount} on ${selectedBet}` : 'Select a colour or number'}
      </button>

      {/* ── Tabs: History / Live Bets / My Bets ── */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {[['history','📊 History'],['live','🔴 Live Bets'],['mine','👤 My Bets']].map(([key, label]) => (
          <button key={key} type="button"
            onClick={() => {
              setActiveTab(key);
              if (key === 'mine') loadMyBets();
            }}
            style={{
              padding: '9px 14px', background: 'none', border: 'none',
              borderBottom: activeTab === key ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === key ? '#818cf8' : '#64748b',
              fontWeight: 700, fontSize: '12px', cursor: 'pointer', marginBottom: '-1px',
              whiteSpace: 'nowrap',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ minHeight: '200px', maxHeight: '300px', overflowY: 'auto' }}>

        {/* ── History ── */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 0' }}>
            {history.length === 0
              ? <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '24px' }}>No history yet</div>
              : history.map((r, i) => {
                  const colors = r.result?.colors || [];
                  const num    = r.result?.number ?? '?';
                  const mainC  = colors[0] || 'RED';
                  const clrMap = { RED: '#f87171', GREEN: '#34d399', VIOLET: '#c084fc' };
                  const bg     = getResultGradient(colors);
                  return (
                    <div key={r.roundId || i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: `3px solid ${clrMap[mainC] || '#6366f1'}` }}>
                      {/* Number circle */}
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '15px', color: '#fff', flexShrink: 0, boxShadow: '0 0 8px rgba(0,0,0,0.3)' }}>
                        {num}
                      </div>
                      {/* Colour chips */}
                      <div style={{ display: 'flex', gap: '4px', flex: 1, flexWrap: 'wrap' }}>
                        {colors.map(c => (
                          <span key={c} style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, background: `${clrMap[c] || '#6366f1'}20`, color: clrMap[c] || '#818cf8', border: `1px solid ${clrMap[c] || '#6366f1'}44` }}>
                            {c}
                          </span>
                        ))}
                      </div>
                      {/* Round number */}
                      <span style={{ fontSize: '10px', color: '#334155', fontWeight: 600, flexShrink: 0 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 0' }}>
            {liveBets.length === 0
              ? <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '24px' }}>No bets placed this round yet</div>
              : liveBets.map((b, i) => {
                  const pred = b.prediction || b.selection || '?';
                  const isNum = !isNaN(Number(pred));
                  const clrMap = { RED:'#f87171', GREEN:'#34d399', VIOLET:'#c084fc' };
                  const col = isNum ? '#fbbf24' : clrMap[pred] || '#818cf8';
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '9px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, flex: 1 }}>
                        {b.username || 'Player'}
                      </span>
                      <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, background: `${col}18`, color: col, border: `1px solid ${col}33`, margin: '0 8px', flexShrink: 0 }}>
                        {isNum ? `#${pred}` : pred}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', flexShrink: 0 }}>
                        ₹{Number(b.amount).toFixed(0)}
                      </span>
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* ── My Bets ── */}
        {activeTab === 'mine' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 0' }}>
            {!user
              ? <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '24px' }}>Login to see your bets</div>
              : myBets.length === 0
                ? <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '24px' }}>No bets yet — place your first bet!</div>
                : myBets.map((b, i) => {
                    const clrMap = { RED:'#f87171', GREEN:'#34d399', VIOLET:'#c084fc' };
                    const pred   = b.prediction || '?';
                    const isNum  = !isNaN(Number(pred));
                    const col    = isNum ? '#fbbf24' : clrMap[pred] || '#818cf8';
                    const isWon  = b.status === 'WON';
                    const isLost = b.status === 'LOST';
                    return (
                      <div key={b._id || i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '10px', background: isWon ? 'rgba(52,211,153,0.06)' : isLost ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isWon ? 'rgba(52,211,153,0.15)' : isLost ? 'rgba(239,68,68,0.1)' : 'transparent'}` }}>
                        {/* Round */}
                        <span style={{ fontSize: '10px', color: '#334155', fontWeight: 700, flexShrink: 0 }}>#{b.roundNumber}</span>
                        {/* Prediction chip */}
                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, background: `${col}18`, color: col, border: `1px solid ${col}33`, flexShrink: 0 }}>
                          {isNum ? `#${pred}` : pred}
                        </span>
                        {/* Stake */}
                        <span style={{ fontSize: '12px', color: '#94a3b8', flex: 1 }}>₹{Number(b.amount).toFixed(0)}</span>
                        {/* Result */}
                        <span style={{ fontSize: '12px', fontWeight: 800, flexShrink: 0,
                          color: isWon ? '#34d399' : isLost ? '#f87171' : b.status === 'REFUNDED' ? '#fbbf24' : '#64748b' }}>
                          {isWon  ? `+₹${Number(b.payout || 0).toFixed(0)}`
                          : isLost ? '—'
                          : b.status === 'REFUNDED' ? 'REFUND'
                          : 'PENDING'}
                        </span>
                      </div>
                    );
                  })
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default ColourGame;
