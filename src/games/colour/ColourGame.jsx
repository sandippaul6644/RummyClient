import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { socket } from '../../services/socket.js';
import { api } from '../../services/api.js';
import { sound } from '../../utils/sound.js';
import { ProvablyFairModal } from '../../components/ProvablyFairModal.jsx';
import { ShieldCheck, History, Flame, Coins, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ColourGame = () => {
  const { user, wallet, refreshWallet, setIsAuthModalOpen } = useAuth();
  const [roundNumber, setRoundNumber] = useState(1000);
  const [remainingSec, setRemainingSec] = useState(30);
  const [isBettingOpen, setIsBettingOpen] = useState(true);
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [serverSeed, setServerSeed] = useState('');
  const [history, setHistory] = useState([]);
  const [selectedBetType, setSelectedBetType] = useState(null);
  const [betAmount, setBetAmount] = useState('10');
  const [liveBets, setLiveBets] = useState([]);
  const [myBets, setMyBets] = useState([]);
  const [lastWinningResult, setLastWinningResult] = useState(null);
  const [isFairModalOpen, setIsFairModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [activeBetTab, setActiveBetTab] = useState('live');

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await api.get('/games/colour');
        if (res.data?.success) {
          const { currentRound, history: hist } = res.data.data;
          if (currentRound) {
            setRoundNumber(currentRound.roundNumber);
            setServerSeedHash(currentRound.serverSeedHash);
            setRemainingSec(res.data.data.remainingSec || 30);
            setIsBettingOpen(currentRound.status === 'betting');
          }
          if (hist) setHistory(hist);
        }
      } catch (err) {
        console.error('Error fetching colour game:', err);
      }
    };

    fetchGame();

    socket.emit('game:join', { gameSlug: 'colour' });

    socket.on('colour:round_start', (data) => {
      setRoundNumber(data.roundNumber);
      setServerSeedHash(data.serverSeedHash);
      setRemainingSec(data.totalDurationSec || 30);
      setIsBettingOpen(true);
      setLiveBets([]);
      setLastWinningResult(null);
      sound.playBeep(true);
    });

    socket.on('colour:tick', (data) => {
      setRemainingSec(data.remainingSec);
      setIsBettingOpen(data.isBettingOpen);
      if (data.remainingSec <= 5 && data.remainingSec > 0) {
        sound.playBeep(false);
      }
    });

    socket.on('colour:betting_closed', () => {
      setIsBettingOpen(false);
    });

    socket.on('colour:new_bet', (bet) => {
      setLiveBets((prev) => [bet, ...prev.slice(0, 15)]);
    });

    socket.on('colour:round_result', (data) => {
      setLastWinningResult(data.resultData);
      setServerSeed(data.serverSeed);
      setHistory((prev) => [
        {
          roundNumber: data.roundNumber,
          result: data.resultData,
          serverSeed: data.serverSeed,
          serverSeedHash: data.serverSeedHash,
        },
        ...prev.slice(0, 19),
      ]);
      sound.playWin();
      try {
        confetti({
          particleCount: 65,
          spread: 80,
          origin: { y: 0.45 },
          colors: ['#00f59b', '#d946ef', '#ff4b63', '#ffe066']
        });
      } catch {}
      refreshWallet();
    });

    return () => {
      socket.emit('game:leave', { gameSlug: 'colour' });
      socket.off('colour:round_start');
      socket.off('colour:tick');
      socket.off('colour:betting_closed');
      socket.off('colour:new_bet');
      socket.off('colour:round_result');
    };
  }, [refreshWallet]);

  const handlePlaceBet = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!selectedBetType) {
      setAlertMsg('Please select a color or number first!');
      return;
    }
    const num = Number(betAmount);
    if (isNaN(num) || num <= 0) {
      setAlertMsg('Enter a valid bet amount');
      return;
    }
    if (wallet && num > Number(wallet.balance)) {
      setAlertMsg('Insufficient wallet balance! Please deposit demo funds.');
      return;
    }

    setSubmitting(true);
    setAlertMsg('');
    sound.playClick();

    try {
      const res = await api.post('/games/colour/actions', {
        amount: num,
        selection: selectedBetType,
      });

      if (res.data?.success) {
        sound.playCashout();
        setMyBets((prev) => [res.data.data.bet, ...prev]);
        refreshWallet();
        setAlertMsg(`Bet of ₹${num.toFixed(2)} placed on ${String(selectedBetType).toUpperCase()}!`);
        setTimeout(() => setAlertMsg(''), 3000);
      }
    } catch (err) {
      setAlertMsg(err.response?.data?.message || err.message || 'Failed to place bet');
    } finally {
      setSubmitting(false);
    }
  };

  const chips = ['1', '5', '10', '25', '50', '100', '500'];

  const chipThemes = {
    '1': { bg: 'linear-gradient(135deg, #64748b 0%, #334155 100%)', border: 'rgba(148, 163, 184, 0.6)', color: '#f8fafc', glow: 'rgba(148, 163, 184, 0.4)' },
    '5': { bg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', border: 'rgba(248, 113, 113, 0.8)', color: '#ffffff', glow: 'rgba(239, 68, 68, 0.5)' },
    '10': { bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', border: 'rgba(96, 165, 250, 0.8)', color: '#ffffff', glow: 'rgba(59, 130, 246, 0.5)' },
    '25': { bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', border: 'rgba(52, 211, 153, 0.8)', color: '#ffffff', glow: 'rgba(16, 185, 129, 0.5)' },
    '50': { bg: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', border: 'rgba(251, 191, 36, 0.8)', color: '#ffffff', glow: 'rgba(245, 158, 11, 0.5)' },
    '100': { bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', border: 'rgba(192, 132, 252, 0.8)', color: '#ffffff', glow: 'rgba(139, 92, 246, 0.5)' },
    '500': { bg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', border: 'rgba(251, 191, 36, 0.9)', color: '#fcd34d', glow: 'rgba(245, 158, 11, 0.6)' },
  };

  const getColorClass = (colors) => {
    if (!colors) return '#64748b';
    if (colors.includes('violet') && colors.includes('red')) return 'linear-gradient(135deg, #ff4b63 50%, #d946ef 50%)';
    if (colors.includes('violet') && colors.includes('green')) return 'linear-gradient(135deg, #00f59b 50%, #d946ef 50%)';
    if (colors.includes('green')) return 'linear-gradient(135deg, #00f59b 0%, #059669 100%)';
    if (colors.includes('red')) return 'linear-gradient(135deg, #ff4b63 0%, #ef4444 100%)';
    if (colors.includes('violet')) return 'linear-gradient(135deg, #ff4ef9 0%, #a855f7 100%)';
    return '#6366f1';
  };

  const getNumberStyle = (n, isSelected) => {
    if (isSelected) {
      if (n === '0') {
        return {
          background: 'linear-gradient(135deg, #ff4b63 50%, #d946ef 50%)',
          border: '2px solid #ffffff',
          boxShadow: '0 0 22px rgba(255, 75, 99, 0.8), 0 0 22px rgba(217, 70, 239, 0.8)',
          color: '#ffffff',
          transform: 'scale(1.08)'
        };
      }
      if (n === '5') {
        return {
          background: 'linear-gradient(135deg, #00f59b 50%, #d946ef 50%)',
          border: '2px solid #ffffff',
          boxShadow: '0 0 22px rgba(0, 245, 155, 0.8), 0 0 22px rgba(217, 70, 239, 0.8)',
          color: '#ffffff',
          transform: 'scale(1.08)'
        };
      }
      if (['1', '3', '7', '9'].includes(n)) {
        return {
          background: 'linear-gradient(145deg, #00ffaa 0%, #10b981 50%, #047857 100%)',
          border: '2px solid #ffffff',
          boxShadow: '0 0 22px rgba(0, 245, 155, 0.85)',
          color: '#ffffff',
          transform: 'scale(1.08)'
        };
      }
      return {
        background: 'linear-gradient(145deg, #ff6b7e 0%, #ef4444 50%, #991b1b 100%)',
        border: '2px solid #ffffff',
        boxShadow: '0 0 22px rgba(255, 75, 99, 0.85)',
        color: '#ffffff',
        transform: 'scale(1.08)'
      };
    }

    // Unselected with distinct gaming color cues
    if (n === '0') {
      return {
        background: 'linear-gradient(135deg, rgba(255, 75, 99, 0.25) 50%, rgba(217, 70, 239, 0.25) 50%)',
        border: '1.5px solid rgba(217, 70, 239, 0.65)',
        color: '#ffffff'
      };
    }
    if (n === '5') {
      return {
        background: 'linear-gradient(135deg, rgba(0, 245, 155, 0.25) 50%, rgba(217, 70, 239, 0.25) 50%)',
        border: '1.5px solid rgba(0, 245, 155, 0.65)',
        color: '#ffffff'
      };
    }
    if (['1', '3', '7', '9'].includes(n)) {
      return {
        background: 'linear-gradient(145deg, rgba(0, 245, 155, 0.16) 0%, rgba(5, 150, 105, 0.08) 100%)',
        border: '1.5px solid rgba(0, 245, 155, 0.45)',
        color: '#00f59b'
      };
    }
    return {
      background: 'linear-gradient(145deg, rgba(255, 75, 99, 0.16) 0%, rgba(220, 38, 38, 0.08) 100%)',
      border: '1.5px solid rgba(255, 75, 99, 0.45)',
      color: '#ff4b63'
    };
  };

  return (
    <div className="colour-game-container">
      {/* 1. Top Status & Countdown Card */}
      <div className="colour-top-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase',
              letterSpacing: '0.6px'
            }}>
              ROUND #{roundNumber}
            </span>
            <span style={{
              fontSize: '10px',
              padding: '3px 9px',
              borderRadius: '12px',
              background: isBettingOpen ? 'linear-gradient(135deg, rgba(0, 245, 155, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)',
              border: isBettingOpen ? '1px solid rgba(0, 245, 155, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)',
              color: isBettingOpen ? '#00f59b' : '#f87171',
              fontWeight: 800,
              boxShadow: isBettingOpen ? '0 0 10px rgba(0, 245, 155, 0.3)' : 'none'
            }}>
              {isBettingOpen ? '● BETTING OPEN' : '🔒 CALCULATING'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => { sound.playClick(); setIsFairModalOpen(true); }}
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(217, 70, 239, 0.1) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              color: '#c084fc',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)'
            }}
          >
            <ShieldCheck size={13} /> Provably Fair
          </button>
        </div>

        {/* Timer & Result Box */}
        <div className="colour-timer-box">
          {/* Circular Countdown Ring with Gradient */}
          <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="60" height="60" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="timerNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f59b" />
                  <stop offset="50%" stopColor="#d946ef" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.06)" strokeWidth="9" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={remainingSec <= 5 ? '#ff4b63' : 'url(#timerNeonGrad)'}
                strokeWidth="9"
                fill="transparent"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * remainingSec) / 30}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 1s linear, stroke 0.3s',
                  filter: remainingSec <= 5 ? 'drop-shadow(0 0 8px rgba(255, 75, 99, 0.8))' : 'drop-shadow(0 0 6px rgba(217, 70, 239, 0.6))'
                }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: '16px', fontWeight: 900, color: remainingSec <= 5 ? '#ff4b63' : '#ffffff', textShadow: remainingSec <= 5 ? '0 0 10px rgba(255,75,99,0.8)' : '0 0 8px rgba(255,255,255,0.4)' }}>
                0:{remainingSec < 10 ? `0${remainingSec}` : remainingSec}
              </div>
              <div style={{ fontSize: '7.5px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>TIMER</div>
            </div>
          </div>

          {/* Outcome or Status */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {lastWinningResult ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(139, 92, 246, 0.15) 100%)',
                border: '1.5px solid rgba(0, 245, 155, 0.55)',
                boxShadow: '0 0 20px rgba(0, 245, 155, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                animation: 'winnerPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: getColorClass(lastWinningResult.colors),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '17px',
                  fontWeight: 900,
                  color: '#ffffff',
                  flexShrink: 0,
                  boxShadow: '0 0 16px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.5)',
                  border: '2px solid rgba(255, 255, 255, 0.6)'
                }}>
                  {lastWinningResult.number}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '10px', color: '#00f59b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={11} /> WINNING RESULT
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    #{lastWinningResult.number} — {lastWinningResult.colors.map((c) => c.toUpperCase()).join(' & ')}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.2px' }}>
                  {isBettingOpen ? '⚡ Fast 30s Prediction' : 'Evaluating Winning Number...'}
                </div>
                <div style={{ fontSize: '11.5px', color: '#a78bfa', marginTop: '2px', fontWeight: 600 }}>
                  {isBettingOpen ? 'Select Colors (2x/4.5x) or Numbers (9x)' : 'Next round starts immediately...'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History Beads */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            <History size={12} color="#a78bfa" /> Recent 16 Outcomes
          </div>
          <div className="colour-history-strip">
            {history.length > 0 ? (
              history.slice(0, 16).map((h, i) => (
                <div
                  key={i}
                  className="colour-bead"
                  style={{ background: getColorClass(h.result?.colors) }}
                  title={`Round #${h.roundNumber} - Result: ${h.result?.number}`}
                >
                  {h.result?.number ?? '?'}
                </div>
              ))
            ) : (
              <span style={{ color: '#64748b', fontSize: '11px' }}>Syncing history...</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Betting Arena (Colors, Numbers, Wager Amount & CONFIRM BET BUTTON) */}
      <div className="colour-betting-arena">
        {alertMsg && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(217, 70, 239, 0.15) 100%)',
            border: '1.5px solid rgba(168, 85, 247, 0.5)',
            color: '#e9d5ff',
            padding: '8px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
          }}>
            {alertMsg}
          </div>
        )}

        {/* Color Buttons */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#a78bfa', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            1. Select Color
          </div>
          <div className="colour-color-grid">
            <button
              type="button"
              onClick={() => { sound.playClick(); setSelectedBetType('green'); }}
              disabled={!isBettingOpen}
              className={`colour-btn-choice green ${selectedBetType === 'green' ? 'active' : ''}`}
            >
              <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.5px' }}>GREEN</div>
              <div style={{
                fontSize: '10.5px',
                fontWeight: 800,
                background: 'rgba(0,0,0,0.3)',
                padding: '2px 8px',
                borderRadius: '10px',
                marginTop: '3px'
              }}>
                2x Payout
              </div>
            </button>

            <button
              type="button"
              onClick={() => { sound.playClick(); setSelectedBetType('violet'); }}
              disabled={!isBettingOpen}
              className={`colour-btn-choice violet ${selectedBetType === 'violet' ? 'active' : ''}`}
            >
              <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.5px' }}>VIOLET</div>
              <div style={{
                fontSize: '10.5px',
                fontWeight: 800,
                background: 'rgba(0,0,0,0.3)',
                padding: '2px 8px',
                borderRadius: '10px',
                marginTop: '3px'
              }}>
                4.5x Payout
              </div>
            </button>

            <button
              type="button"
              onClick={() => { sound.playClick(); setSelectedBetType('red'); }}
              disabled={!isBettingOpen}
              className={`colour-btn-choice red ${selectedBetType === 'red' ? 'active' : ''}`}
            >
              <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.5px' }}>RED</div>
              <div style={{
                fontSize: '10.5px',
                fontWeight: 800,
                background: 'rgba(0,0,0,0.3)',
                padding: '2px 8px',
                borderRadius: '10px',
                marginTop: '3px'
              }}>
                2x Payout
              </div>
            </button>
          </div>
        </div>

        {/* Number Buttons (0-9) */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#a78bfa', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            2. Or Select Number (9x Payout)
          </div>
          <div className="colour-numbers-grid">
            {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => {
              const isSelected = selectedBetType === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => { sound.playClick(); setSelectedBetType(n); }}
                  disabled={!isBettingOpen}
                  className={`colour-num-btn ${isSelected ? 'active' : ''}`}
                  style={getNumberStyle(n, isSelected)}
                >
                  <div style={{ fontSize: '16px', lineHeight: 1 }}>{n}</div>
                  <div style={{ fontSize: '9px', opacity: 0.85, fontWeight: 700, marginTop: '2px' }}>9x</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wager Input, Chips & CONFIRM BET BUTTON */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <label style={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Wager Amount (₹ INR)
            </label>
            <span style={{ color: '#94a3b8' }}>
              Est Return: <strong style={{ color: '#00f59b', fontSize: '13.5px', textShadow: '0 0 10px rgba(0, 245, 155, 0.5)' }}>
                ₹{selectedBetType ? (
                  Number(selectedBetType) >= 0 ? (Number(betAmount || 0) * 9).toFixed(2) :
                  selectedBetType === 'violet' ? (Number(betAmount || 0) * 4.5).toFixed(2) :
                  (Number(betAmount || 0) * 2).toFixed(2)
                ) : '0.00'}
              </strong>
            </span>
          </div>

          <div className="colour-wager-row">
            <div style={{ position: 'relative', width: '95px', flexShrink: 0 }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a78bfa', fontWeight: 900, fontSize: '13px' }}>
                ₹
              </span>
              <input
                type="number"
                min="1"
                max="5000"
                className="glass-input font-mono"
                style={{
                  width: '100%',
                  fontSize: '15px',
                  fontWeight: 900,
                  padding: '7px 8px 7px 24px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(168, 85, 247, 0.4)',
                  background: 'rgba(15, 23, 42, 0.9)'
                }}
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={!isBettingOpen}
                placeholder="10"
              />
            </div>

            <div className="colour-chip-pills">
              {chips.map((c) => {
                const theme = chipThemes[c] || chipThemes['10'];
                const isSelected = betAmount === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { sound.playClick(); setBetAmount(c); }}
                    disabled={!isBettingOpen}
                    className={`colour-chip-btn ${isSelected ? 'active' : ''}`}
                    style={{
                      background: theme.bg,
                      borderColor: theme.border,
                      color: theme.color,
                      boxShadow: isSelected ? `0 0 16px ${theme.glow}, 0 4px 10px rgba(0,0,0,0.5)` : `0 2px 6px rgba(0,0,0,0.3)`
                    }}
                  >
                    ₹{c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prominent Eye-Catchy Bet Button */}
          <button
            type="button"
            onClick={handlePlaceBet}
            disabled={!isBettingOpen || submitting}
            className="colour-confirm-btn"
          >
            <Sparkles size={17} />
            {submitting ? 'Placing Bet...' : isBettingOpen ? `CONFIRM BET ₹${Number(betAmount || 0).toFixed(2)}` : 'BETTING CLOSED'}
          </button>
        </div>
      </div>

      {/* 3. Live Bets & My Wagers (Placed at the bottom) */}
      <div className="glass-panel" style={{ padding: '12px 14px', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
          <button
            type="button"
            onClick={() => { sound.playClick(); setActiveBetTab('live'); }}
            style={{
              background: activeBetTab === 'live' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)' : 'transparent',
              border: activeBetTab === 'live' ? '1.5px solid rgba(245, 158, 11, 0.5)' : '1.5px solid transparent',
              color: activeBetTab === 'live' ? '#fbbf24' : '#94a3b8',
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeBetTab === 'live' ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none'
            }}
          >
            <Flame size={13} color="#f59e0b" /> Live Round Bets ({liveBets.length})
          </button>

          <button
            type="button"
            onClick={() => { sound.playClick(); setActiveBetTab('my'); }}
            style={{
              background: activeBetTab === 'my' ? 'linear-gradient(135deg, rgba(0, 245, 155, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)' : 'transparent',
              border: activeBetTab === 'my' ? '1.5px solid rgba(0, 245, 155, 0.5)' : '1.5px solid transparent',
              color: activeBetTab === 'my' ? '#00f59b' : '#94a3b8',
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeBetTab === 'my' ? '0 0 12px rgba(0, 245, 155, 0.3)' : 'none'
            }}
          >
            <Coins size={13} color="#00f59b" /> My Wagers ({myBets.length})
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '130px', overflowY: 'auto' }}>
          {activeBetTab === 'live' ? (
            liveBets.length > 0 ? (
              liveBets.map((b, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  fontSize: '11.5px'
                }}>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>{b.username}</span>
                  <span style={{ textTransform: 'uppercase', color: '#c084fc', fontWeight: 800 }}>
                    {b.selection}
                  </span>
                  <span className="font-mono" style={{ fontWeight: 800, color: '#00f59b' }}>
                    ₹{Number(b.amount).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b', fontSize: '11.5px', textAlign: 'center', padding: '12px' }}>
                Waiting for incoming live bets...
              </div>
            )
          ) : (
            myBets.length > 0 ? (
              myBets.map((b, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  fontSize: '11.5px'
                }}>
                  <span style={{ color: '#94a3b8', fontWeight: 700 }}>#{b.roundNumber}</span>
                  <span style={{ textTransform: 'uppercase', fontWeight: 800, color: '#c084fc' }}>{b.selection}</span>
                  <span className="font-mono" style={{ fontWeight: 800, color: '#00f59b' }}>₹{Number(b.amount).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b', fontSize: '11.5px', textAlign: 'center', padding: '12px' }}>
                No wagers placed in this session yet.
              </div>
            )
          )}
        </div>
      </div>

      <ProvablyFairModal
        isOpen={isFairModalOpen}
        onClose={() => setIsFairModalOpen(false)}
        roundData={{ serverSeedHash, serverSeed }}
      />
    </div>
  );
};
