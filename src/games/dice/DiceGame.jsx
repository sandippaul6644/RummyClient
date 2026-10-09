/**
 * DiceGame.jsx — Classic Provably Fair Dice
 *
 * API: POST /games/dice/bets  { amount, condition, target, clientSeed? }
 * Response includes serverSeed (revealed immediately — instant game)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dices, ShieldCheck, History, ArrowRightLeft, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useAuth }  from '../../context/AuthContext.jsx';
import { api }      from '../../services/api.js';

// ── Multiplier formula (must match server) ────────────────────────────────────
function calcMultiplier(condition, target, houseEdge = 0.01) {
  const winProb = condition === 'over' ? 100 - target : target;
  if (winProb <= 0 || winProb >= 100) return 1.01;
  return Number(Math.max(1.01, Math.min((100 * (1 - houseEdge)) / winProb, 990)).toFixed(4));
}

// ── Visual styles ─────────────────────────────────────────────────────────────
const panel = {
  background: 'rgba(15,23,42,0.7)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '20px',
};

const statBox = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '12px',
  padding: '12px 16px',
  textAlign: 'center',
};

// ── Slider colour track ───────────────────────────────────────────────────────
// The visible slider track is a CSS gradient built dynamically from target + condition
function sliderBackground(condition, target) {
  const pct = target; // 0–100
  return condition === 'over'
    ? `linear-gradient(to right, #334155 0%, #334155 ${pct}%, rgba(168,85,247,0.6) ${pct}%, rgba(168,85,247,0.6) 100%)`
    : `linear-gradient(to right, rgba(168,85,247,0.6) 0%, rgba(168,85,247,0.6) ${pct}%, #334155 ${pct}%, #334155 100%)`;
}

// ─────────────────────────────────────────────────────────────────────────────
export const DiceGame = () => {
  const { user, wallet, refreshWallet, setIsAuthModalOpen } = useAuth();

  const [target,    setTarget]    = useState(50);
  const [condition, setCondition] = useState('over');
  const [betInput,  setBetInput]  = useState('10');
  const [rolling,   setRolling]   = useState(false);
  const [result,    setResult]    = useState(null);   // last roll result
  const [animRoll,  setAnimRoll]  = useState('50.00');
  const [history,   setHistory]   = useState([]);
  const [alert,     setAlert]     = useState('');
  const [showSeed,  setShowSeed]  = useState(false);  // provably fair section

  const animRef = useRef(null);

  // Live-computed stats
  const winChance  = condition === 'over' ? Number((100 - target).toFixed(2)) : Number(target.toFixed(2));
  const multiplier = calcMultiplier(condition, target);
  const profitOnWin = Number((Number(betInput || 0) * (multiplier - 1)).toFixed(2));

  // Cleanup animation timer on unmount
  useEffect(() => () => { if (animRef.current) clearInterval(animRef.current); }, []);

  const showAlert = (msg) => { setAlert(msg); setTimeout(() => setAlert(''), 4000); };

  const handleRoll = async () => {
    if (!user) { setIsAuthModalOpen?.(true); return; }
    const num = Number(betInput);
    if (isNaN(num) || num <= 0) { showAlert('Enter a valid bet amount'); return; }

    setRolling(true);
    setResult(null);
    setShowSeed(false);

    // Ticker animation
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() =>
      setAnimRoll((Math.random() * 99.99).toFixed(2)), 50
    );

    try {
      const clientSeed = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const res = await api.post('/games/dice/bets', {
        amount: num,
        condition,
        target,
        clientSeed,
      });

      // Keep animation going for at least 700ms
      await new Promise(r => setTimeout(r, 700));

      if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }

      if (res.data?.success) {
        const d = res.data.data;
        setAnimRoll(d.roll.toFixed(2));
        setResult(d);
        setHistory(prev => [d, ...prev.slice(0, 19)]);
        refreshWallet?.();
      }
    } catch (err) {
      if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }
      showAlert(err.response?.data?.message || 'Roll failed');
      setAnimRoll('—');
    } finally {
      setRolling(false);
    }
  };

  const flipCondition = () => setCondition(c => c === 'over' ? 'under' : 'over');

  const isWin = result?.isWin;
  const rollColor = rolling ? '#c084fc' : isWin == null ? '#fff' : isWin ? '#34d399' : '#f87171';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', color: '#fff' }}>

      {/* Header */}
      <div style={{ ...panel, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)', padding: '10px', borderRadius: '12px' }}>
            <Dices size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Classic Provably Fair Dice</h1>
            <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>Customizable odds · Up to 49.5× · Instant results</p>
          </div>
        </div>
        <button onClick={() => setShowSeed(s => !s)}
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ShieldCheck size={14} /> Provably Fair
        </button>
      </div>

      {/* Alert */}
      {alert && (
        <div style={{ padding: '11px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '13px' }}>
          {alert}
        </div>
      )}

      {/* Result display */}
      <div style={{ ...panel, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

        {/* Large roll number */}
        <div style={{
          minWidth: 200, padding: '20px 36px', borderRadius: '16px', textAlign: 'center',
          background: rolling ? 'rgba(168,85,247,0.12)' : isWin == null ? 'rgba(255,255,255,0.04)' : isWin ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
          border: `2px solid ${rollColor}44`,
          boxShadow: rolling ? '0 0 30px rgba(168,85,247,0.3)' : isWin ? '0 0 30px rgba(52,211,153,0.25)' : isWin === false ? '0 0 20px rgba(239,68,68,0.2)' : 'none',
          transition: 'all 0.3s',
        }}>
          <div style={{ fontSize: '56px', fontWeight: 900, fontFamily: 'monospace', color: rollColor, lineHeight: 1 }}>
            {animRoll}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: rolling ? '#c084fc' : isWin == null ? '#475569' : isWin ? '#34d399' : '#f87171', letterSpacing: '1px', marginTop: '6px' }}>
            {rolling ? 'Rolling…' : isWin == null ? 'Roll Value' : isWin ? '🎉 You Win!' : 'Better luck next time'}
          </div>
          {result && !rolling && (
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {result.condition.toUpperCase()} {result.target} — {result.isWin ? `+₹${result.payout.toFixed(2)}` : `-₹${result.amount}`}
            </div>
          )}
        </div>

        {/* Slider */}
        <div style={{ width: '100%', maxWidth: '680px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', fontWeight: 700, marginBottom: '6px' }}>
            {[0,25,50,75,100].map(v => <span key={v}>{v}</span>)}
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="range" min="2" max="98" step="1"
              value={target}
              onChange={e => setTarget(Number(e.target.value))}
              style={{
                width: '100%', height: '14px', borderRadius: '7px', cursor: 'pointer',
                appearance: 'none', outline: 'none',
                background: sliderBackground(condition, target),
              }}
            />
            {/* Target label */}
            <div style={{
              position: 'absolute', top: '-22px',
              left: `calc(${target}% - 20px)`,
              fontSize: '11px', fontWeight: 800, color: '#c084fc',
              pointerEvents: 'none',
            }}>
              {target}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              Bet: <strong style={{ color: '#fff' }}>Roll {condition.toUpperCase()} {target}</strong>
            </span>
            <button onClick={flipCondition}
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', padding: '5px 11px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowRightLeft size={12} /> Flip to {condition === 'over' ? 'Under' : 'Over'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', width: '100%', maxWidth: '680px' }}>
          <div style={statBox}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Multiplier</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#818cf8', fontFamily: 'monospace' }}>{multiplier.toFixed(4)}×</div>
          </div>
          <div style={statBox}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Win Chance</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>{winChance.toFixed(2)}%</div>
          </div>
          <div style={statBox}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Profit on Win</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>+₹{profitOnWin.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Bet form */}
      <div style={panel}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
              Bet Amount (₹)
            </label>
            <input
              type="number" min="1" max="5000" step="1"
              value={betInput}
              onChange={e => setBetInput(e.target.value)}
              disabled={rolling}
              style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '16px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '1px' }}>
            {['½', '2×', 'Max'].map(label => (
              <button key={label} onClick={() => {
                const n = Number(betInput);
                if (label === '½')   setBetInput(String(Math.max(1, Math.floor(n / 2))));
                if (label === '2×')  setBetInput(String(Math.min(5000, n * 2)));
                if (label === 'Max' && wallet) setBetInput(String(Math.floor(Number(wallet.balance))));
              }} style={{ padding: '11px 14px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={handleRoll}
            disabled={rolling}
            style={{
              minWidth: '160px', padding: '11px 24px', borderRadius: '10px', border: 'none',
              background: rolling ? 'rgba(168,85,247,0.3)' : 'linear-gradient(135deg,#a855f7,#6366f1)',
              color: '#fff', fontWeight: 900, fontSize: '15px',
              cursor: rolling ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: rolling ? 'none' : '0 0 20px rgba(168,85,247,0.35)',
            }}>
            {rolling ? <><RefreshCw size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> Rolling…</> : `🎲 Roll ₹${Number(betInput || 0).toFixed(2)}`}
          </button>
        </div>

        {wallet && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#475569' }}>
            Balance: <strong style={{ color: '#94a3b8' }}>₹{Number(wallet.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
        )}
      </div>

      {/* Provably Fair section */}
      {showSeed && result && (
        <div style={{ ...panel, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.05)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <ShieldCheck size={14} /> Provably Fair — Last Roll
          </h3>
          {[
            ['Server Seed', result.serverSeed],
            ['Server Seed Hash', result.serverSeedHash],
            ['Client Seed', result.clientSeed],
            ['Nonce', String(result.nonce)],
            ['Roll', result.roll.toFixed(2)],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 700 }}>{label}</span>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', wordBreak: 'break-all' }}>{value}</span>
            </div>
          ))}
          <p style={{ fontSize: '11px', color: '#334155', marginTop: '10px' }}>
            Verify: HMAC-SHA256(serverSeed, clientSeed:{result.nonce}) → first 8 hex chars → roll 0.00–99.99
          </p>
        </div>
      )}

      {/* Roll history */}
      <div style={panel}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', textTransform: 'uppercase' }}>
          <History size={14} /> Recent Rolls
        </h3>
        {history.length === 0
          ? <div style={{ color: '#334155', fontSize: '12px', textAlign: 'center', padding: '20px' }}>Roll the dice to see results here</div>
          : history.map((r, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', marginBottom: '4px', borderRadius: '9px',
                background: r.isWin ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.02)',
                border: r.isWin ? '1px solid rgba(52,211,153,0.2)' : '1px solid transparent',
                fontSize: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  {r.isWin ? <CheckCircle2 size={14} color="#34d399" /> : <XCircle size={14} color="#f87171" />}
                  <span style={{ color: '#64748b' }}>{r.condition.toUpperCase()} {r.target}</span>
                </div>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: r.isWin ? '#34d399' : '#f87171' }}>
                  {r.roll.toFixed(2)}
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: r.isWin ? '#34d399' : '#94a3b8' }}>
                  {r.isWin ? `+₹${r.payout.toFixed(2)}` : `−₹${r.amount}`}
                </span>
                <span style={{ color: '#475569', fontSize: '11px' }}>{r.multiplier.toFixed(2)}×</span>
              </div>
            ))
        }
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=range]::-webkit-slider-thumb { appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #a855f7; cursor: pointer; box-shadow: 0 0 8px rgba(168,85,247,0.6); }
        input[type=range]::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #a855f7; cursor: pointer; border: none; }
      `}</style>
    </div>
  );
};
