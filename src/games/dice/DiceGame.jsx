import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { sound } from '../../utils/sound.js';
import { ProvablyFairModal } from '../../components/ProvablyFairModal.jsx';
import { Dices, ShieldCheck, History, ArrowRightLeft, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const DiceCube = ({ value, isRolling, animClass, defaultTilt }) => {
  const getTransform = () => {
    if (isRolling) return undefined;
    const { x, y } = defaultTilt;
    switch (value) {
      case 1: return `rotateX(${x}deg) rotateY(${y}deg)`;
      case 2: return `rotateX(${x - 90}deg) rotateY(${y}deg)`;
      case 3: return `rotateX(${x}deg) rotateY(${y - 90}deg)`;
      case 4: return `rotateX(${x}deg) rotateY(${y + 90}deg)`;
      case 5: return `rotateX(${x + 90}deg) rotateY(${y}deg)`;
      case 6: return `rotateX(${x}deg) rotateY(${y + 180}deg)`;
      default: return `rotateX(${x}deg) rotateY(${y}deg)`;
    }
  };

  return (
    <div
      className={`dice-cube ${isRolling ? animClass : ''}`}
      style={{ transform: getTransform() }}
    >
      {/* 1: Front */}
      <div className="dice-face dice-face-front face-1">
        <span className="dice-pip" />
      </div>
      {/* 2: Top */}
      <div className="dice-face dice-face-top face-2">
        <span className="dice-pip" />
        <span className="dice-pip" />
      </div>
      {/* 3: Right */}
      <div className="dice-face dice-face-right face-3">
        <span className="dice-pip" />
        <span className="dice-pip" />
        <span className="dice-pip" />
      </div>
      {/* 4: Left */}
      <div className="dice-face dice-face-left face-4">
        <span className="dice-pip" />
        <span className="dice-pip" />
        <span className="dice-pip" />
        <span className="dice-pip" />
      </div>
      {/* 5: Bottom */}
      <div className="dice-face dice-face-bottom face-5">
        <span className="dice-pip" />
        <span className="dice-pip" />
        <span className="dice-pip" />
        <span className="dice-pip" />
        <span className="dice-pip" />
      </div>
      {/* 6: Back */}
      <div className="dice-face dice-face-back face-6">
        <span className="dice-pip" />
        <span className="dice-pip" />
        <span className="dice-pip" />
        <span className="dice-pip" />
        <span className="dice-pip" />
        <span className="dice-pip" />
      </div>
    </div>
  );
};

export const DiceGame = () => {
  const { user, wallet, refreshWallet, setIsAuthModalOpen } = useAuth();
  const [target, setTarget] = useState(50.0);
  const [condition, setCondition] = useState('over');
  const [betAmount, setBetAmount] = useState('10');
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState(null);
  const [displayRoll, setDisplayRoll] = useState('50.00');
  const [diceFaces, setDiceFaces] = useState([3, 5]);
  const [rollHistory, setRollHistory] = useState([]);
  const [isFairModalOpen, setIsFairModalOpen] = useState(false);
  const [fairData, setFairData] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');
  const shuffleTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (shuffleTimerRef.current) clearInterval(shuffleTimerRef.current);
    };
  }, []);

  const winChance = condition === 'over' ? Number((100 - target).toFixed(2)) : Number(target.toFixed(2));
  const multiplier = Number(Math.max(1.01, (99 / winChance)).toFixed(4));
  const profitOnWin = Number((Number(betAmount || 0) * (multiplier - 1)).toFixed(2));

  const handleRoll = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const numAmount = Number(betAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAlertMsg('Enter a valid wager amount');
      return;
    }
    if (wallet && numAmount > Number(wallet.balance)) {
      setAlertMsg('Insufficient bankroll balance');
      return;
    }

    setRolling(true);
    setAlertMsg('');
    sound.playDiceRoll();

    // Start rapid number ticker shuffle during rolling animation
    if (shuffleTimerRef.current) clearInterval(shuffleTimerRef.current);
    shuffleTimerRef.current = setInterval(() => {
      setDisplayRoll((Math.random() * 99).toFixed(2));
    }, 45);

    const startTime = Date.now();

    try {
      const res = await api.post('/games/dice/actions', {
        amount: numAmount,
        condition,
        target,
        clientSeed: 'player_custom_seed_' + Math.random().toString(36).substring(2, 8),
      });

      // Ensure minimum 700ms rolling animation duration for thrilling visuals
      const elapsed = Date.now() - startTime;
      const minDuration = 750;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }

      if (shuffleTimerRef.current) {
        clearInterval(shuffleTimerRef.current);
        shuffleTimerRef.current = null;
      }

      if (res.data?.success) {
        const result = res.data.data;
        setDisplayRoll(result.roll.toFixed(2));
        setLastRoll(result);
        
        // Pick dice faces reflecting the result
        const d1 = Math.max(1, Math.min(6, Math.floor((result.roll / 100) * 6) + 1));
        const d2 = Math.max(1, Math.min(6, Math.floor(((result.roll * 7) % 6)) + 1));
        setDiceFaces([d1, d2]);

        setFairData({
          serverSeed: result.serverSeed,
          serverSeedHash: result.serverSeedHash,
          clientSeed: result.clientSeed,
        });

        if (result.isWin) {
          sound.playWin();
          try {
            confetti({
              particleCount: 50,
              spread: 70,
              origin: { y: 0.55 },
              colors: ['#a855f7', '#6366f1', '#10b981', '#fbbf24']
            });
          } catch {}
        } else {
          sound.playBeep(false);
        }

        setRollHistory((prev) => [result, ...prev.slice(0, 19)]);
        refreshWallet();
      }
    } catch (err) {
      if (shuffleTimerRef.current) {
        clearInterval(shuffleTimerRef.current);
        shuffleTimerRef.current = null;
      }
      setAlertMsg(err.response?.data?.message || err.message || 'Roll failed');
    } finally {
      setRolling(false);
    }
  };

  const handleHalve = () => setBetAmount(String(Math.max(1, Math.floor(Number(betAmount) / 2))));
  const handleDouble = () => setBetAmount(String(Math.min(5000, Number(betAmount) * 2)));
  const handleMax = () => wallet && setBetAmount(String(Math.floor(Number(wallet.balance))));

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '12px 10px 36px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{
        padding: '16px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
            padding: '8px',
            borderRadius: '10px',
            boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)'
          }}>
            <Dices size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 900 }}>Classic Provably Fair Dice</h1>
            <p style={{ color: '#94a3b8', fontSize: '12px' }}>Customizable odds with instant rolls up to 990x</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { sound.playClick(); setIsFairModalOpen(true); }}
          style={{
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#818cf8',
            padding: '6px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <ShieldCheck size={14} /> Provably Fair
        </button>
      </div>

      {/* Main Dice Visualizer & Slider Arena */}
      <div className="glass-panel-glow" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        
        {/* 3D Rolling Dice Arena */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 0',
          position: 'relative'
        }}>
          <div className="dice-scene">
            <DiceCube
              value={diceFaces[0]}
              isRolling={rolling}
              animClass="rolling-1"
              defaultTilt={{ x: 18, y: -22 }}
            />
            <DiceCube
              value={diceFaces[1]}
              isRolling={rolling}
              animClass="rolling-2"
              defaultTilt={{ x: -14, y: 28 }}
            />
          </div>
          
          {rolling && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#c084fc',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginTop: '8px',
              animation: 'pulseGlow 1s infinite'
            }}>
              <Sparkles size={13} /> Rolling Dice...
            </div>
          )}
        </div>

        {/* Roll Value Display Box */}
        <div style={{
          minWidth: '150px',
          padding: '12px 20px',
          borderRadius: '14px',
          background: rolling
            ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)'
            : lastRoll
              ? lastRoll.isWin
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.15) 100%)'
              : 'rgba(15, 23, 42, 0.8)',
          border: rolling
            ? '2px solid #a855f7'
            : lastRoll
              ? lastRoll.isWin
                ? '2px solid #10b981'
                : '2px solid #ef4444'
              : '2px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: rolling
            ? '0 0 25px rgba(168, 85, 247, 0.5)'
            : lastRoll
              ? lastRoll.isWin
                ? '0 0 25px rgba(16, 185, 129, 0.5)'
                : '0 0 25px rgba(239, 68, 68, 0.5)'
              : 'none',
          transition: 'all 0.3s'
        }}>
          <div className="font-mono" style={{
            fontSize: '38px',
            fontWeight: 900,
            color: rolling
              ? '#c084fc'
              : lastRoll
                ? (lastRoll.isWin ? '#34d399' : '#f87171')
                : '#fff'
          }}>
            {displayRoll}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: rolling ? '#c084fc' : '#94a3b8', letterSpacing: '0.5px' }}>
            {rolling ? 'ROLLING...' : lastRoll ? (lastRoll.isWin ? 'WINNER!' : 'MISSED') : 'ROLL VALUE'}
          </div>
        </div>

        {/* Interactive Slider */}
        <div style={{ width: '100%', maxWidth: '650px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>

          <input
            type="range"
            min="1.00"
            max="98.00"
            step="0.01"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            style={{
              width: '100%',
              height: '14px',
              borderRadius: '7px',
              accentColor: '#a855f7',
              cursor: 'pointer'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Condition: <strong style={{ color: '#fff', textTransform: 'uppercase' }}>Roll {condition} {target.toFixed(2)}</strong>
            </span>
            <button
              type="button"
              onClick={() => { sound.playClick(); setCondition(condition === 'over' ? 'under' : 'over'); }}
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#818cf8',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ArrowRightLeft size={13} /> Flip to {condition === 'over' ? 'Under' : 'Over'}
            </button>
          </div>
        </div>

        {/* Stats Grid: Multiplier, Win Chance, Profit */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', width: '100%', maxWidth: '650px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Multiplier</div>
            <div className="font-mono" style={{ fontSize: '16px', fontWeight: 900, color: '#818cf8', marginTop: '2px' }}>
              {multiplier.toFixed(4)}x
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Win Chance</div>
            <div className="font-mono" style={{ fontSize: '16px', fontWeight: 900, color: '#34d399', marginTop: '2px' }}>
              {winChance.toFixed(2)}%
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Net Profit</div>
            <div className="font-mono" style={{ fontSize: '16px', fontWeight: 900, color: '#fbbf24', marginTop: '2px' }}>
              +₹{profitOnWin.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Bet Amount & Roll Action */}
      <div className="glass-panel" style={{ padding: '20px 16px' }}>
        {alertMsg && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#818cf8',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '14px'
          }}>
            {alertMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
                Bet Amount (₹ INR)
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={handleHalve}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}
                >
                  ½
                </button>
                <button
                  type="button"
                  onClick={handleDouble}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}
                >
                  2×
                </button>
                <button
                  type="button"
                  onClick={handleMax}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#818cf8', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}
                >
                  MAX
                </button>
              </div>
            </div>

            <input
              type="number"
              min="1"
              max="5000"
              className="glass-input font-mono"
              style={{ width: '100%', fontSize: '16px', fontWeight: 700 }}
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={handleRoll}
            disabled={rolling}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
            }}
          >
            {rolling ? 'ROLLING...' : `ROLL DICE (₹${Number(betAmount || 0).toFixed(2)})`}
          </button>
        </div>
      </div>

      {/* Roll History Table */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <History size={15} /> Recent Rolls
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {rollHistory.length > 0 ? (
            rollHistory.map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: r.isWin ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                  border: r.isWin ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {r.isWin ? <CheckCircle2 size={14} color="#34d399" /> : <XCircle size={14} color="#f87171" />}
                  <span style={{ color: '#94a3b8' }}>{r.condition.toUpperCase()} {r.target.toFixed(2)}</span>
                </div>
                <div className="font-mono" style={{ fontWeight: 800, color: r.isWin ? '#34d399' : '#f87171' }}>
                  Roll: {r.roll.toFixed(2)}
                </div>
                <div className="font-mono" style={{ fontWeight: 800, color: r.isWin ? '#34d399' : '#94a3b8' }}>
                  {r.isWin ? `+₹${r.payout.toFixed(2)}` : `-₹${betAmount}`}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '16px' }}>
              Roll the dice to see results here.
            </div>
          )}
        </div>
      </div>

      <ProvablyFairModal
        isOpen={isFairModalOpen}
        onClose={() => setIsFairModalOpen(false)}
        roundData={fairData}
      />
    </div>
  );
};
