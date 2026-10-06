/**
 * CrashGame.jsx — Production Aviator / Crash Rocket game UI
 *
 * Socket events (server → client):
 *   crash:round:waiting  { roundNumber, serverSeedHash, waitEndsAt }
 *   crash:round:betting  { roundNumber, betEndsAt, bettingDurationSec }
 *   crash:round:flying   { roundNumber, startedAt }
 *   crash:tick           { multiplier, elapsedMs }
 *   crash:round:crashed  { roundNumber, crashPoint }
 *   crash:round:settled  { roundNumber, crashPoint, serverSeed }
 *   crash:bet:placed     { username, amount, autoCashout }
 *   crash:cashout        { userId, multiplier, payout }
 */

import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { Rocket, ShieldCheck, History, TrendingUp, Users, X } from 'lucide-react';
import { useAuth }  from '../../context/AuthContext.jsx';
import { socket }   from '../../services/socket.js';
import { api }      from '../../services/api.js';

// ── Same multiplier formula as the server ─────────────────────────────────────
const K = 0.00006;
function calcMultiplier(elapsedMs) {
  return Math.max(1.00, Math.floor(Math.exp(K * elapsedMs) * 100) / 100);
}

// ── Colour for a given multiplier ─────────────────────────────────────────────
function multColour(m) {
  if (m < 1.5)  return '#ffffff';
  if (m < 2)    return '#34d399';
  if (m < 3)    return '#22d3ee';
  if (m < 5)    return '#a78bfa';
  if (m < 10)   return '#f59e0b';
  return '#f97316';
}

function crashColour(cp) {
  if (!cp || cp >= 10) return '#a855f7';
  if (cp >= 5)  return '#f59e0b';
  if (cp >= 2)  return '#34d399';
  return '#f87171';
}

// ─────────────────────────────────────────────────────────────────────────────
export const CrashGame = () => {
  const { user, wallet, refreshWallet, setIsAuthModalOpen } = useAuth();
  const canvasRef   = useRef(null);
  const animRef     = useRef(null);
  const flyStartRef = useRef(0);

  // ── Game state ──────────────────────────────────────────────────────────────
  const [phase,      setPhase]      = useState('WAITING');
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(null);
  const [countdown,  setCountdown]  = useState(0);
  const [roundNum,   setRoundNum]   = useState(null);
  const [seedHash,   setSeedHash]   = useState('');

  // ── Bet state ───────────────────────────────────────────────────────────────
  const [betInput,    setBetInput]    = useState('10');
  const [autoInput,   setAutoInput]   = useState('0');  // 0 = manual
  const [hasBet,      setHasBet]      = useState(false);
  const [betAmount,   setBetAmount]   = useState(0);
  const [cashedOut,   setCashedOut]   = useState(false);
  const [cashoutMult, setCashoutMult] = useState(null);
  const [cashoutPay,  setCashoutPay]  = useState(null);
  const [placing,     setPlacing]     = useState(false);
  const [cashingOut,  setCashingOut]  = useState(false);
  const [toast,       setToast]       = useState(null);

  // ── Live players + history ──────────────────────────────────────────────────
  const [livePlayers, setLivePlayers] = useState([]);
  const [history,     setHistory]     = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // ── Flash helper ─────────────────────────────────────────────────────────────
  const flash = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Load initial history ─────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/games/crash/history?limit=30')
      .then(r => r.data?.success && setHistory(r.data.data || []))
      .catch(() => {});
  }, []);

  // ── Fetch current round on mount (reconnect) ──────────────────────────────────
  useEffect(() => {
    api.get('/games/crash/current-round').then(r => {
      if (!r.data?.success || !r.data.data) return;
      const rd = r.data.data;
      setRoundNum(rd.roundNumber);
      setSeedHash(rd.serverSeedHash);
      if (rd.status === 'BETTING') {
        setPhase('BETTING');
        const rem = Math.max(0, Math.ceil((new Date(rd.betCloseTime) - Date.now()) / 1000));
        setCountdown(rem);
      } else if (rd.status === 'FLYING') {
        setPhase('FLYING');
        flyStartRef.current = Date.now(); // approximate — will sync on next tick
        setMultiplier(rd.currentMultiplier || 1.00);
      } else {
        setPhase('WAITING');
      }
    }).catch(() => {});
  }, []);

  // ── Socket events ─────────────────────────────────────────────────────────────
  useEffect(() => {
    socket.emit('game:join', { gameSlug: 'crash' });

    const onWaiting = ({ roundNumber, serverSeedHash }) => {
      setPhase('WAITING');
      setMultiplier(1.00);
      setCrashPoint(null);
      setRoundNum(roundNumber);
      setSeedHash(serverSeedHash);
      setHasBet(false);
      setCashedOut(false);
      setCashoutMult(null);
      setCashoutPay(null);
      setLivePlayers([]);
    };

    const onBetting = ({ roundNumber, betEndsAt, bettingDurationSec }) => {
      setPhase('BETTING');
      setRoundNum(roundNumber);
      const rem = Math.max(0, Math.ceil((new Date(betEndsAt) - Date.now()) / 1000));
      setCountdown(rem);
    };

    const onFlying = ({ roundNumber, startedAt }) => {
      setPhase('FLYING');
      flyStartRef.current = new Date(startedAt).getTime();
      setMultiplier(1.00);
      setCountdown(0);
    };

    const onTick = ({ multiplier: m }) => {
      setMultiplier(m);
    };

    const onCrashed = ({ roundNumber, crashPoint: cp }) => {
      setPhase('CRASHED');
      setCrashPoint(cp);
      setMultiplier(cp);
      // Add to history
      setHistory(prev => [{ roundNumber, crashPoint: cp, settledAt: new Date() }, ...prev].slice(0, 30));
      // Players who didn't cash out
      setLivePlayers(prev => prev.map(p => p.cashedOut ? p : { ...p, lost: true }));
      if (hasBet && !cashedOut) {
        flash(`Crashed at ${cp}× — you lost ₹${betAmount}`, 'error');
        refreshWallet?.();
      }
    };

    const onSettled = ({ crashPoint: cp, serverSeed }) => {
      setPhase('WAITING');
      setSeedHash(h => h); // hash stays
    };

    const onBetPlaced = ({ username, amount, autoCashout }) => {
      setLivePlayers(prev => {
        if (prev.find(p => p.username === username)) return prev;
        return [...prev, { username, amount, autoCashout, cashedOut: false, lost: false }];
      });
    };

    const onCashout = ({ userId, multiplier: m, payout }) => {
      setLivePlayers(prev =>
        prev.map(p =>
          (p.userId === String(userId) || p.username === String(userId))
            ? { ...p, cashedOut: true, cashoutMult: m, payout }
            : p
        )
      );
      // Self cashout confirmation
      if (user && String(userId) === String(user._id || user.id)) {
        setCashedOut(true);
        setCashoutMult(m);
        setCashoutPay(payout);
        flash(`Cashed out at ${m}× — won ₹${payout.toFixed(2)}!`, 'win');
        refreshWallet?.();
      }
    };

    socket.on('crash:round:waiting',  onWaiting);
    socket.on('crash:round:betting',  onBetting);
    socket.on('crash:round:flying',   onFlying);
    socket.on('crash:tick',           onTick);
    socket.on('crash:round:crashed',  onCrashed);
    socket.on('crash:round:settled',  onSettled);
    socket.on('crash:bet:placed',     onBetPlaced);
    socket.on('crash:cashout',        onCashout);

    return () => {
      socket.emit('game:leave', { gameSlug: 'crash' });
      socket.off('crash:round:waiting',  onWaiting);
      socket.off('crash:round:betting',  onBetting);
      socket.off('crash:round:flying',   onFlying);
      socket.off('crash:tick',           onTick);
      socket.off('crash:round:crashed',  onCrashed);
      socket.off('crash:round:settled',  onSettled);
      socket.off('crash:bet:placed',     onBetPlaced);
      socket.off('crash:cashout',        onCashout);
    };
  }, [user, hasBet, betAmount, cashedOut, flash, refreshWallet]);

  // ── Countdown tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'BETTING') return;
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // ── Canvas chart ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = canvas.width;
    const H = canvas.height;
    const PAD_L = 40, PAD_B = 30, PAD_T = 20, PAD_R = 20;
    const cW = W - PAD_L - PAD_R;
    const cH = H - PAD_T - PAD_B;

    // Multiplier → Y pixel (log scale looks better)
    const multToY = (m) => {
      const logM   = Math.log(Math.max(1, m));
      const logMax = Math.log(Math.max(2, multiplier * 1.2));
      return PAD_T + cH - (logM / logMax) * cH;
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#060b18');
      bg.addColorStop(1, '#0a0f1e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 53 + 7) % (W - 20) + 10;
        const sy = (i * 37 + 11) % (H - 20) + 10;
        ctx.fillRect(sx, sy, 1, 1);
      }

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth   = 1;
      [1.5, 2, 3, 5, 10].forEach(m => {
        if (m > multiplier * 1.5) return;
        const y = multToY(m);
        ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '10px monospace';
        ctx.fillText(`${m}×`, 4, y + 3);
      });

      if (phase === 'WAITING' || phase === 'BETTING') {
        // Idle state — just show 1× line
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        const y1 = multToY(1);
        ctx.beginPath(); ctx.moveTo(PAD_L, y1); ctx.lineTo(W - PAD_R, y1); ctx.stroke();
        return;
      }

      // ── Draw curve ────────────────────────────────────────────────────────────
      const elapsedMs = phase === 'FLYING' ? Date.now() - flyStartRef.current : 99999;
      const maxT      = phase === 'FLYING' ? elapsedMs : elapsedMs;
      const steps     = Math.min(200, Math.floor(maxT / 100));

      if (steps < 1) return;

      const lineColor = phase === 'CRASHED'
        ? '#f87171'
        : multColour(multiplier);

      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * maxT;
        const m = calcMultiplier(t);
        const x = PAD_L + (i / steps) * cW;
        const y = multToY(m);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }

      // Glow effect
      ctx.shadowBlur  = 10;
      ctx.shadowColor = lineColor;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth   = 2.5;
      ctx.stroke();
      ctx.shadowBlur  = 0;

      // Fill under curve
      const endX = PAD_L + cW;
      const endY = multToY(phase === 'CRASHED' ? crashPoint : multiplier);
      ctx.lineTo(endX, H - PAD_B);
      ctx.lineTo(PAD_L, H - PAD_B);
      ctx.closePath();
      const fill = ctx.createLinearGradient(0, 0, 0, H);
      fill.addColorStop(0, `${lineColor}22`);
      fill.addColorStop(1, 'transparent');
      ctx.fillStyle = fill;
      ctx.fill();

      // ── Rocket at curve tip ────────────────────────────────────────────────────
      if (phase === 'FLYING') {
        const rX = PAD_L + cW;
        const rY = multToY(multiplier);
        ctx.font      = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Slight tilt
        ctx.save();
        ctx.translate(rX - 6, rY - 4);
        ctx.rotate(-0.5);
        ctx.fillText('🚀', 0, 0);
        ctx.restore();
      }

      if (phase === 'CRASHED') {
        const rX = PAD_L + cW;
        const rY = multToY(crashPoint || multiplier);
        ctx.font      = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💥', rX - 6, rY - 4);
      }
    };

    if (phase === 'FLYING') {
      const loop = () => { draw(); animRef.current = requestAnimationFrame(loop); };
      animRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animRef.current);
    } else {
      draw();
    }
  }, [phase, multiplier, crashPoint]);

  // ── Bet actions ───────────────────────────────────────────────────────────────
  const handlePlaceBet = async () => {
    if (!user) { setIsAuthModalOpen?.(true); return; }
    if (hasBet || phase !== 'BETTING' || placing) return;

    const amt  = parseFloat(betInput);
    const auto = parseFloat(autoInput) || 0;
    if (isNaN(amt) || amt <= 0) { flash('Enter a valid bet amount', 'error'); return; }

    setPlacing(true);
    try {
      const res = await api.post('/games/crash/bets', {
        amount: amt,
        autoCashout: auto >= 1.01 ? auto : null,
      });
      if (res.data?.success) {
        setHasBet(true);
        setBetAmount(amt);
        flash(`Bet placed: ₹${amt}${auto >= 1.01 ? ` (auto @ ${auto}×)` : ''}`, 'info');
        refreshWallet?.();
        // Add self to live list
        setLivePlayers(prev => [
          { username: user.username, amount: amt, autoCashout: auto >= 1.01 ? auto : null, cashedOut: false, lost: false, self: true },
          ...prev.filter(p => p.username !== user.username),
        ]);
      }
    } catch (e) {
      flash(e.response?.data?.message || 'Bet failed', 'error');
    } finally {
      setPlacing(false);
    }
  };

  const handleCashout = async () => {
    if (!hasBet || cashedOut || phase !== 'FLYING' || cashingOut) return;
    setCashingOut(true);
    try {
      const res = await api.post('/games/crash/cashout');
      if (res.data?.success) {
        const d = res.data.data;
        setCashedOut(true);
        setCashoutMult(d.multiplier);
        setCashoutPay(d.payout);
        flash(`Cashed out at ${d.multiplier}× — won ₹${d.payout?.toFixed(2)}!`, 'win');
        refreshWallet?.();
      }
    } catch (e) {
      flash(e.response?.data?.message || 'Cashout failed', 'error');
    } finally {
      setCashingOut(false);
    }
  };

  const setQuickBet = (v) => setBetInput(String(v));
  const multColor   = phase === 'CRASHED' ? '#f87171' : multColour(multiplier);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#060c1a', minHeight: '100vh', color: '#fff' }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, padding: '12px 24px', borderRadius: '12px', fontWeight: 700,
          fontSize: '14px', backdropFilter: 'blur(8px)',
          background: toast.type === 'win'   ? 'rgba(52,211,153,0.9)'
                    : toast.type === 'error' ? 'rgba(239,68,68,0.9)'
                    : 'rgba(30,41,59,0.95)',
          border: `1px solid ${toast.type === 'win' ? '#34d399' : toast.type === 'error' ? '#f87171' : '#334155'}`,
          color: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header strip ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Rocket size={18} color="#a855f7" />
          <span style={{ fontWeight: 900, fontSize: '16px' }}>CRASH ROCKET</span>
          {roundNum && <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Round #{roundNum}</span>}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => setShowHistory(!showHistory)}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', padding: '5px 10px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <History size={13} /> History
          </button>
          {seedHash && (
            <span style={{ fontSize: '10px', color: '#334155', fontFamily: 'monospace' }} title={seedHash}>
              🔒 {seedHash.slice(0, 12)}…
            </span>
          )}
        </div>
      </div>

      {/* ── History strip ── */}
      {showHistory && (
        <div style={{ display: 'flex', gap: '6px', padding: '10px 20px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
          {history.map((h, i) => (
            <div key={i} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, background: `${crashColour(h.crashPoint)}18`, border: `1px solid ${crashColour(h.crashPoint)}44`, color: crashColour(h.crashPoint) }}>
              {Number(h.crashPoint).toFixed(2)}×
            </div>
          ))}
          {history.length === 0 && <span style={{ color: '#334155', fontSize: '12px' }}>No history yet</span>}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, gap: 0 }}>

        {/* ── Main game area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Multiplier display */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px 8px', position: 'relative' }}>
            {phase === 'WAITING' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>Next Round Starting…</div>
              </div>
            )}
            {phase === 'BETTING' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>Place Your Bets</div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: '#fbbf24' }}>{countdown}s</div>
              </div>
            )}
            {(phase === 'FLYING' || phase === 'CRASHED') && (
              <div style={{ textAlign: 'center' }}>
                {phase === 'CRASHED' && (
                  <div style={{ fontSize: '13px', color: '#f87171', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '4px' }}>CRASHED!</div>
                )}
                <div style={{
                  fontSize: 'clamp(48px,8vw,96px)',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: multColor,
                  textShadow: `0 0 30px ${multColor}66`,
                  transition: 'color 0.3s',
                  lineHeight: 1,
                }}>
                  {multiplier.toFixed(2)}×
                </div>
                {phase === 'FLYING' && hasBet && !cashedOut && (
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    Potential: <strong style={{ color: '#34d399' }}>₹{(betAmount * multiplier).toFixed(2)}</strong>
                  </div>
                )}
                {cashedOut && cashoutMult && (
                  <div style={{ fontSize: '13px', color: '#34d399', marginTop: '4px', fontWeight: 700 }}>
                    ✓ Cashed out @ {cashoutMult}× — ₹{cashoutPay?.toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Canvas chart */}
          <div style={{ flex: 1, padding: '0 12px', minHeight: 0 }}>
            <canvas
              ref={canvasRef}
              width={700}
              height={260}
              style={{ width: '100%', height: '260px', borderRadius: '12px', background: '#060b18' }}
            />
          </div>

          {/* ── Bet controls ── */}
          <div style={{ padding: '16px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>

            {/* Quick bets */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              {[10, 50, 100, 500, 1000].map(v => (
                <button key={v} onClick={() => setQuickBet(v)} disabled={hasBet && phase === 'FLYING'}
                  style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 700, borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', cursor: 'pointer' }}>
                  ₹{v}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {/* Bet amount */}
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '5px' }}>Bet Amount (₹)</label>
                <input
                  type="number" min="1" step="1"
                  value={betInput}
                  onChange={e => setBetInput(e.target.value)}
                  disabled={hasBet || phase === 'FLYING' || phase === 'CRASHED'}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: '#fff', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Auto cashout */}
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '5px' }}>Auto Cashout (×)</label>
                <input
                  type="number" min="1.01" step="0.1" placeholder="0 = manual"
                  value={autoInput}
                  onChange={e => setAutoInput(e.target.value)}
                  disabled={hasBet || phase === 'FLYING' || phase === 'CRASHED'}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: '#fff', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Action button */}
              {(!hasBet || phase === 'WAITING' || phase === 'CRASHED') && (
                <button
                  onClick={handlePlaceBet}
                  disabled={phase !== 'BETTING' || placing || hasBet}
                  style={{
                    minWidth: '140px', padding: '10px 20px', borderRadius: '9px', border: 'none',
                    background: phase === 'BETTING' && !hasBet
                      ? 'linear-gradient(135deg,#a855f7,#6366f1)'
                      : 'rgba(255,255,255,0.05)',
                    color: phase === 'BETTING' && !hasBet ? '#fff' : '#334155',
                    fontWeight: 900, fontSize: '14px', cursor: phase === 'BETTING' && !hasBet ? 'pointer' : 'not-allowed',
                    opacity: phase === 'BETTING' && !hasBet ? 1 : 0.5,
                    transition: 'all 0.15s',
                  }}>
                  {placing ? 'Placing…' : hasBet ? 'Bet Placed' : phase === 'BETTING' ? '🚀 Place Bet' : 'Waiting…'}
                </button>
              )}

              {hasBet && phase === 'FLYING' && !cashedOut && (
                <button
                  onClick={handleCashout}
                  disabled={cashingOut}
                  style={{
                    minWidth: '160px', padding: '10px 20px', borderRadius: '9px', border: 'none',
                    background: `linear-gradient(135deg, ${multColor}, ${multColor}cc)`,
                    color: '#fff', fontWeight: 900, fontSize: '14px',
                    cursor: cashingOut ? 'not-allowed' : 'pointer',
                    boxShadow: `0 0 20px ${multColor}66`,
                    transition: 'all 0.15s',
                    animation: 'pulse 1.2s infinite',
                  }}>
                  {cashingOut ? 'Cashing…' : `💰 CASH OUT ${multiplier.toFixed(2)}×`}
                </button>
              )}

              {hasBet && cashedOut && (
                <div style={{ minWidth: '140px', padding: '10px 20px', borderRadius: '9px', border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontWeight: 700, fontSize: '13px', textAlign: 'center' }}>
                  ✓ Cashed @ {cashoutMult}×
                </div>
              )}
            </div>

            {wallet && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#475569' }}>
                Balance: <strong style={{ color: '#94a3b8' }}>₹{Number(wallet.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
            )}
          </div>
        </div>

        {/* ── Live players sidebar ── */}
        <div style={{ width: '220px', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)', flexShrink: 0 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Users size={13} color="#64748b" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Bets ({livePlayers.length})</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {livePlayers.length === 0
              ? <div style={{ padding: '20px 14px', color: '#1e293b', fontSize: '12px', textAlign: 'center' }}>No bets yet</div>
              : livePlayers.map((p, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 14px',
                    background: p.cashedOut ? 'rgba(52,211,153,0.05)' : p.lost ? 'rgba(239,68,68,0.04)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: p.self ? '#c084fc' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.username}
                      </div>
                      <div style={{ fontSize: '10px', color: '#334155' }}>₹{p.amount}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {p.cashedOut ? (
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>{p.cashoutMult?.toFixed(2) ?? '?'}×</div>
                          <div style={{ fontSize: '9px', color: '#34d399' }}>₹{p.payout?.toFixed(0)}</div>
                        </div>
                      ) : p.lost ? (
                        <span style={{ fontSize: '11px', color: '#475569' }}>—</span>
                      ) : (
                        p.autoCashout ? (
                          <span style={{ fontSize: '10px', color: '#fbbf24' }}>{p.autoCashout}×</span>
                        ) : (
                          <span style={{ fontSize: '10px', color: '#1e293b' }}>manual</span>
                        )
                      )}
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
};
