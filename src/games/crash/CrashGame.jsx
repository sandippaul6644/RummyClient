import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { socket } from '../../services/socket.js';
import { api } from '../../services/api.js';
import { sound } from '../../utils/sound.js';
import { ProvablyFairModal } from '../../components/ProvablyFairModal.jsx';
import { Plane, ShieldCheck, History, Flame, ArrowUpRight, CheckCircle, Zap, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CrashGame = () => {
  const { user, wallet, refreshWallet, setIsAuthModalOpen } = useAuth();
  const canvasRef = useRef(null);

  const [gameState, setGameState] = useState('betting');
  const [multiplier, setMultiplier] = useState(1.0);
  const [roundNumber, setRoundNumber] = useState(500);
  const [bettingSec, setBettingSec] = useState(8);
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [serverSeed, setServerSeed] = useState('');
  const [history, setHistory] = useState([]);

  const [betAmount, setBetAmount] = useState('10');
  const [autoCashout, setAutoCashout] = useState('2.00');
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashoutPayout, setCashoutPayout] = useState(0);
  const [activePlayers, setActivePlayers] = useState([]);
  const [isFairModalOpen, setIsFairModalOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const trajectoryRef = useRef([]);
  const particlesRef = useRef([]);
  const cloudsRef = useRef([]);

  // Initialize background floating speed stars/particles
  useEffect(() => {
    cloudsRef.current = Array.from({ length: 24 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 300,
      speed: 1.2 + Math.random() * 3.5,
      size: 1 + Math.random() * 2.5,
      opacity: 0.15 + Math.random() * 0.45,
    }));
  }, []);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await api.get('/games/crash');
        if (res.data?.success) {
          const { currentRound, history: hist } = res.data.data;
          if (currentRound) {
            setRoundNumber(currentRound.roundNumber);
            setServerSeedHash(currentRound.serverSeedHash);
            setGameState(currentRound.status === 'active' ? 'flying' : currentRound.status === 'betting' ? 'betting' : 'crashed');
            setMultiplier(res.data.data.currentMultiplier || 1.0);
          }
          if (hist) setHistory(hist);
        }
      } catch (err) {
        console.error('Error fetching crash game:', err);
      }
    };

    fetchGame();

    socket.emit('game:join', { gameSlug: 'crash' });

    socket.on('crash:betting_start', (data) => {
      setGameState('betting');
      setRoundNumber(data.roundNumber);
      setServerSeedHash(data.serverSeedHash);
      setBettingSec(data.bettingSec || 8);
      setMultiplier(1.0);
      setHasBet(false);
      setCashedOut(false);
      setCashoutPayout(0);
      setActivePlayers([]);
      trajectoryRef.current = [];
      particlesRef.current = [];
      sound.playBeep(true);
    });

    socket.on('crash:betting_tick', (data) => {
      setBettingSec(data.remainingSec);
    });

    socket.on('crash:flight_launched', (data) => {
      setGameState('flying');
      setMultiplier(1.0);
      trajectoryRef.current = [{ t: 0, m: 1.0 }];
      particlesRef.current = [];
      sound.playBeep(false);
    });

    socket.on('crash:flight_tick', (data) => {
      setGameState('flying');
      setMultiplier(data.multiplier);
      trajectoryRef.current.push({ t: data.elapsedSec, m: data.multiplier });
    });

    socket.on('crash:new_bet', (bet) => {
      setActivePlayers((prev) => [
        {
          userId: bet.userId,
          username: bet.username,
          amount: bet.amount,
          autoCashout: bet.autoCashout,
          status: 'pending',
          cashedOutMultiplier: null,
          payout: 0,
        },
        ...prev,
      ]);
    });

    socket.on('crash:player_cashout', (data) => {
      setActivePlayers((prev) =>
        prev.map((p) =>
          p.userId === data.userId
            ? { ...p, status: 'cashed_out', cashedOutMultiplier: data.multiplier, payout: data.payout }
            : p
        )
      );
      if (user && (user._id || user.id) === data.userId) {
        setCashedOut(true);
        setCashoutPayout(data.payout);
        sound.playCashout();
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.55 },
            colors: ['#00f59b', '#ffe066', '#ff4b63', '#ffffff']
          });
        } catch {}
        refreshWallet();
      }
    });

    socket.on('crash:crashed', (data) => {
      setGameState('crashed');
      setMultiplier(data.crashMultiplier);
      setServerSeed(data.serverSeed);
      setHistory((prev) => [
        {
          roundNumber: data.roundNumber,
          multiplier: data.crashMultiplier,
          serverSeed: data.serverSeed,
          serverSeedHash: data.serverSeedHash,
        },
        ...prev.slice(0, 19),
      ]);

      // Spawn crash explosion sparks
      const points = trajectoryRef.current;
      if (points.length > 0) {
        for (let i = 0; i < 40; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 6;
          particlesRef.current.push({
            x: 0,
            y: 0,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            size: 2.5 + Math.random() * 4.5,
            color: Math.random() > 0.4 ? '#ff4b63' : Math.random() > 0.5 ? '#f59e0b' : '#ffffff',
            isExplosion: true,
          });
        }
      }

      sound.playCrash();
      refreshWallet();
    });

    return () => {
      socket.emit('game:leave', { gameSlug: 'crash' });
      socket.off('crash:betting_start');
      socket.off('crash:betting_tick');
      socket.off('crash:flight_launched');
      socket.off('crash:flight_tick');
      socket.off('crash:new_bet');
      socket.off('crash:player_cashout');
      socket.off('crash:crashed');
    };
  }, [user, refreshWallet]);

  // Helper function to render a realistic aerodynamic Red Aeroplane
  const drawAeroplane = (ctx, x, y, angle, isCrash) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    if (isCrash) {
      // Draw burning debris / explosion burst
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 20;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#ff7849';
      ctx.shadowColor = '#ff7849';
      ctx.shadowBlur = 15;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      return;
    }

    // --- JET ENGINE AFTERBURNER & FLAME THRUST ---
    const flameFlicker = Math.random() * 8;
    const flameLength = 22 + flameFlicker;

    // Outer flame (Fiery Red-Orange trail)
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-18 - flameLength, -5 + (Math.random() * 2 - 1));
    ctx.lineTo(-28 - flameLength * 0.7, 0);
    ctx.lineTo(-18 - flameLength, 5 + (Math.random() * 2 - 1));
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 75, 99, 0.95)';
    ctx.shadowColor = '#ff4b63';
    ctx.shadowBlur = 16;
    ctx.fill();

    // Middle flame (Golden Orange)
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-18 - flameLength * 0.65, -3);
    ctx.lineTo(-22 - flameLength * 0.5, 0);
    ctx.lineTo(-18 - flameLength * 0.65, 3);
    ctx.closePath();
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 10;
    ctx.fill();

    // Inner plasma core (Pure Hot White-Yellow)
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-18 - flameLength * 0.35, -1.5);
    ctx.lineTo(-20 - flameLength * 0.3, 0);
    ctx.lineTo(-18 - flameLength * 0.35, 1.5);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // --- AEROPLANE BODY ---
    // Drop shadow for 3D depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    // Swept Red Racing Wings
    ctx.beginPath();
    ctx.moveTo(3, -2);
    ctx.lineTo(-8, -24);
    ctx.lineTo(-15, -24);
    ctx.lineTo(-6, -2);
    ctx.lineTo(-6, 2);
    ctx.lineTo(-15, 24);
    ctx.lineTo(-8, 24);
    ctx.lineTo(3, 2);
    ctx.closePath();
    const wingGrad = ctx.createLinearGradient(-15, 0, 3, 0);
    wingGrad.addColorStop(0, '#99001b');
    wingGrad.addColorStop(0.4, '#dc2626');
    wingGrad.addColorStop(1, '#ff4b63');
    ctx.fillStyle = wingGrad;
    ctx.fill();

    // Wing Racing Stripes (White / Platinum)
    ctx.beginPath();
    ctx.moveTo(-7, -18);
    ctx.lineTo(-9, -18);
    ctx.lineTo(-5, -6);
    ctx.lineTo(-3, -6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-7, 18);
    ctx.lineTo(-9, 18);
    ctx.lineTo(-5, 6);
    ctx.lineTo(-3, 6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();

    // Wingtip strobe lights (Red on left wing, Green on right wing)
    ctx.beginPath();
    ctx.arc(-12, -24, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4b63';
    ctx.shadowColor = '#ff4b63';
    ctx.shadowBlur = 6;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-12, 24, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00f59b';
    ctx.shadowColor = '#00f59b';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Fuselage (Sleek Red Aerodynamic Jet Body)
    ctx.beginPath();
    ctx.moveTo(25, 0); // Sharp Nose
    ctx.bezierCurveTo(16, -6, -5, -7, -20, -4.5); // Top fuselage curve
    ctx.lineTo(-20, 4.5); // Tail base
    ctx.bezierCurveTo(-5, 7, 16, 6, 25, 0); // Bottom fuselage curve
    ctx.closePath();
    
    const bodyGrad = ctx.createLinearGradient(-20, 0, 25, 0);
    bodyGrad.addColorStop(0, '#7f1d1d');
    bodyGrad.addColorStop(0.3, '#dc2626');
    bodyGrad.addColorStop(0.7, '#ef4444');
    bodyGrad.addColorStop(1, '#ff8095');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Red Tail Fin (Vertical Stabilizer)
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(-20, -13);
    ctx.lineTo(-24, -13);
    ctx.lineTo(-19, 0);
    ctx.closePath();
    const tailGrad = ctx.createLinearGradient(-24, 0, -11, 0);
    tailGrad.addColorStop(0, '#99001b');
    tailGrad.addColorStop(1, '#ff4b63');
    ctx.fillStyle = tailGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.stroke();

    // Cockpit Glass Canopy (Ruby-Amber tinted aero glass with gloss sheen)
    ctx.beginPath();
    ctx.ellipse(9, -1, 6, 3, -0.12, 0, Math.PI * 2);
    const glassGrad = ctx.createLinearGradient(3, -4, 15, 2);
    glassGrad.addColorStop(0, '#ffffff');
    glassGrad.addColorStop(0.4, '#ffe4e6');
    glassGrad.addColorStop(1, '#e11d48');
    ctx.fillStyle = glassGrad;
    ctx.shadowColor = '#ff4b63';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cockpit white glare highlight line
    ctx.beginPath();
    ctx.moveTo(6, -2.5);
    ctx.lineTo(12, -1);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  };

  // Canvas Render Loop with responsive coordinate scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Deep Space / Fiery Midnight Sky background
      const skyGrad = ctx.createRadialGradient(width * 0.5, height, 20, width * 0.5, height * 0.5, width * 0.8);
      skyGrad.addColorStop(0, '#1c0812');
      skyGrad.addColorStop(0.6, '#0d040a');
      skyGrad.addColorStop(1, '#050106');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Render floating background speed clouds / stars
      if (gameState === 'flying') {
        cloudsRef.current.forEach((cloud) => {
          cloud.x -= cloud.speed * (1 + multiplier * 0.15);
          if (cloud.x < 0) {
            cloud.x = width + 10;
            cloud.y = Math.random() * (height - 30);
          }
          ctx.globalAlpha = cloud.opacity;
          ctx.fillStyle = Math.random() > 0.3 ? '#ffffff' : '#fecdd3';
          ctx.beginPath();
          ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;
      }

      // Grid lines (Subtle reddish cyber grid)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.07)';
      ctx.lineWidth = 1;
      for (let x = 30; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 25);
        ctx.stroke();
      }
      for (let y = 20; y < height - 25; y += 40) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Coordinate Axes
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, 10);
      ctx.lineTo(30, height - 25);
      ctx.lineTo(width - 10, height - 25);
      ctx.stroke();

      const paddingLeft = 30;
      const paddingBottom = 25;
      const graphWidth = width - paddingLeft - 30;
      const graphHeight = height - paddingBottom - 30;

      if (gameState === 'flying' || gameState === 'crashed') {
        const points = trajectoryRef.current;
        if (points.length > 0) {
          const maxT = Math.max(8, points[points.length - 1].t);
          const maxM = Math.max(2, multiplier * 1.1);

          ctx.beginPath();
          ctx.moveTo(paddingLeft, height - paddingBottom);

          points.forEach((p) => {
            const px = paddingLeft + (p.t / maxT) * graphWidth;
            const py = height - paddingBottom - ((p.m - 1.0) / (maxM - 1.0)) * graphHeight;
            ctx.lineTo(px, py);
          });

          const isCrash = gameState === 'crashed';
          ctx.strokeStyle = isCrash ? '#991b1b' : '#ff3366';
          ctx.lineWidth = 4;
          ctx.shadowColor = isCrash ? 'rgba(153, 27, 27, 0.8)' : 'rgba(255, 51, 102, 0.9)';
          ctx.shadowBlur = 18;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Leading point coordinates
          const lastPoint = points[points.length - 1];
          const lx = paddingLeft + (lastPoint.t / maxT) * graphWidth;
          const ly = height - paddingBottom - ((lastPoint.m - 1.0) / (maxM - 1.0)) * graphHeight;

          // Fiery Red Area gradient under the flight curve
          const gradient = ctx.createLinearGradient(0, ly, 0, height - paddingBottom);
          gradient.addColorStop(0, isCrash ? 'rgba(153, 27, 27, 0.35)' : 'rgba(255, 51, 102, 0.35)');
          gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.12)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.lineTo(lx, height - paddingBottom);
          ctx.closePath();
          ctx.fillStyle = gradient;
          ctx.fill();

          // Calculate aerodynamic tangent angle of flight curve
          let angle = -0.35;
          if (points.length >= 2) {
            const prevPoint = points[Math.max(0, points.length - 4)];
            const px = paddingLeft + (prevPoint.t / maxT) * graphWidth;
            const py = height - paddingBottom - ((prevPoint.m - 1.0) / (maxM - 1.0)) * graphHeight;
            const dx = lx - px;
            const dy = ly - py;
            if (dx !== 0 || dy !== 0) {
              angle = Math.atan2(dy, dx);
            }
          }

          // Spawn jet contrail smoke / fiery sparks behind the red aeroplane
          if (gameState === 'flying' && Math.random() > 0.2) {
            const backDist = 20;
            const sparkX = lx - Math.cos(angle) * backDist + (Math.random() * 4 - 2);
            const sparkY = ly - Math.sin(angle) * backDist + (Math.random() * 4 - 2);
            particlesRef.current.push({
              x: sparkX,
              y: sparkY,
              vx: -Math.cos(angle) * (1.8 + Math.random() * 2.5) + (Math.random() * 1 - 0.5),
              vy: -Math.sin(angle) * (1.8 + Math.random() * 2.5) + (Math.random() * 1 - 0.5),
              alpha: 0.95,
              size: 2.5 + Math.random() * 3.5,
              color: Math.random() > 0.5 ? '#ff4b63' : Math.random() > 0.3 ? '#f97316' : '#ffe066',
              isExplosion: false,
            });
          }

          // Render & update particle smoke/exhaust
          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            if (p.isExplosion && p.x === 0) {
              p.x = lx;
              p.y = ly;
            }
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.isExplosion ? 0.025 : 0.035;

            if (p.alpha <= 0) {
              particlesRef.current.splice(i, 1);
            } else {
              ctx.save();
              ctx.globalAlpha = p.alpha;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              ctx.fillStyle = p.color;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 8;
              ctx.fill();
              ctx.restore();
            }
          }

          // DRAW THE RED AEROPLANE
          drawAeroplane(ctx, lx, ly, angle, isCrash);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [gameState, multiplier]);

  const handlePlaceBet = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const numAmount = Number(betAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAlertMsg('Enter valid bet amount');
      return;
    }
    if (wallet && numAmount > Number(wallet.balance)) {
      setAlertMsg('Insufficient balance');
      return;
    }

    sound.playClick();
    try {
      const res = await api.post('/games/crash/actions', {
        amount: numAmount,
        autoCashout: autoCashout ? Number(autoCashout) : null,
      });
      if (res.data?.success) {
        setHasBet(true);
        refreshWallet();
        sound.playCashout();
        setAlertMsg(`Bet of ₹${numAmount.toFixed(2)} accepted for Flight #${roundNumber}!`);
        setTimeout(() => setAlertMsg(''), 3000);
      }
    } catch (err) {
      setAlertMsg(err.response?.data?.message || err.message || 'Failed to place bet');
    }
  };

  const handleCashout = async () => {
    if (!user || !hasBet || cashedOut) return;
    sound.playClick();
    socket.emit('crash:cashout', { userId: user._id || user.id });
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

  const getHistoryBadgeColor = (m) => {
    const val = Number(m);
    if (val < 2.0) return { bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)', border: '#ef4444', text: '#fca5a5' };
    if (val < 10.0) return { bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(126, 34, 206, 0.15) 100%)', border: '#c084fc', text: '#e9d5ff' };
    return { bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(180, 83, 9, 0.2) 100%)', border: '#f59e0b', text: '#fde047', glow: '0 0 10px rgba(245, 158, 11, 0.4)' };
  };

  return (
    <div className="aviator-game-wrapper">
      {/* 1. Top Header & History Badges */}
      <div className="aviator-header-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #ff4b63 0%, #dc2626 50%, #991b1b 100%)',
            padding: '8px',
            borderRadius: '12px',
            boxShadow: '0 0 18px rgba(239, 68, 68, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
            border: '1.5px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Plane size={22} color="#ffffff" style={{ transform: 'rotate(-45deg)' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#ff7849', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              FLIGHT #{roundNumber}
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: 900, background: 'linear-gradient(135deg, #ffffff 0%, #fca5a5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.3px' }}>
              Aviator Red Flight
            </h1>
          </div>
        </div>

        {/* History Badges Bar */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '100%', padding: '2px 0' }}>
          {history.map((h, i) => {
            const style = getHistoryBadgeColor(h.multiplier);
            return (
              <div
                key={i}
                className="font-mono"
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: style.bg,
                  border: `1.5px solid ${style.border}`,
                  color: style.text,
                  fontSize: '11.5px',
                  fontWeight: 900,
                  boxShadow: style.glow || '0 2px 6px rgba(0,0,0,0.3)',
                  flexShrink: 0
                }}
              >
                {Number(h.multiplier).toFixed(2)}x
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => { sound.playClick(); setIsFairModalOpen(true); }}
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            color: '#fca5a5',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)'
          }}
        >
          <ShieldCheck size={14} /> Fair
        </button>
      </div>

      {/* 2. Main Canvas & Flight Arena (Fiery Red Sky) */}
      <div className="aviator-arena-card">
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Center Multiplier HUD */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          padding: '10px'
        }}>
          {gameState === 'betting' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#fca5a5', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>
                NEXT FLIGHT IN
              </div>
              <div className="font-mono" style={{ fontSize: 'clamp(40px, 9vw, 64px)', fontWeight: 900, color: '#ff4b63', textShadow: '0 0 25px rgba(255, 75, 99, 0.8)' }}>
                0:0{bettingSec}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#00f59b',
                fontWeight: 900,
                background: 'rgba(0, 245, 155, 0.15)',
                border: '1px solid rgba(0, 245, 155, 0.4)',
                padding: '3px 12px',
                borderRadius: '12px',
                display: 'inline-block',
                marginTop: '4px'
              }}>
                ● PLACE YOUR BETS NOW
              </div>
            </div>
          )}

          {gameState === 'flying' && (
            <div style={{ textAlign: 'center' }}>
              <div className="font-mono" style={{
                fontSize: 'clamp(46px, 12vw, 84px)',
                fontWeight: 900,
                color: '#ffffff',
                textShadow: '0 0 35px rgba(255, 75, 99, 0.9), 0 0 15px rgba(255, 255, 255, 0.6)',
                letterSpacing: '-1px'
              }}>
                {multiplier.toFixed(2)}x
              </div>
              <div style={{
                fontSize: '12px',
                color: '#ff7849',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                <Sparkles size={13} color="#ffe066" /> FLIGHT IN PROGRESS
              </div>
            </div>
          )}

          {gameState === 'crashed' && (
            <div style={{ textAlign: 'center' }}>
              <div className="font-mono" style={{
                fontSize: 'clamp(34px, 9vw, 68px)',
                fontWeight: 900,
                color: '#ff4b63',
                textShadow: '0 0 30px rgba(255, 75, 99, 0.9)'
              }}>
                FLEW AWAY @ {multiplier.toFixed(2)}x
              </div>
              <div style={{ fontSize: '13px', color: '#fca5a5', fontWeight: 800, marginTop: '4px' }}>
                Preparing next flight sequence...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Betting Controls & Active Passengers */}
      <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        {/* Left: Interactive Control Box (Red Theme) */}
        <div className="aviator-control-card">
          {alertMsg && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)',
              border: '1.5px solid rgba(239, 68, 68, 0.5)',
              color: '#fca5a5',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '12px',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
            }}>
              {alertMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#fca5a5', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Bet Amount (₹ INR)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#f87171', fontWeight: 900, fontSize: '14px' }}>
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
                    padding: '8px 8px 8px 24px',
                    borderRadius: '10px',
                    border: '1.5px solid rgba(239, 68, 68, 0.45)',
                    background: 'rgba(15, 23, 42, 0.9)'
                  }}
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={hasBet && gameState === 'flying'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#fca5a5', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Auto Cashout (e.g. 2.00x)
              </label>
              <input
                type="number"
                step="0.1"
                min="1.01"
                className="glass-input font-mono"
                style={{
                  width: '100%',
                  fontSize: '15px',
                  fontWeight: 900,
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(239, 68, 68, 0.45)',
                  background: 'rgba(15, 23, 42, 0.9)'
                }}
                placeholder="2.00"
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                disabled={hasBet && gameState === 'flying'}
              />
            </div>
          </div>

          {/* Quick Chip Presets */}
          <div className="no-scrollbar" style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', padding: '2px 0' }}>
            {chips.map((c) => {
              const theme = chipThemes[c] || chipThemes['10'];
              const isSelected = betAmount === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => { sound.playClick(); setBetAmount(c); }}
                  disabled={hasBet && gameState === 'flying'}
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

          {/* Action Button */}
          {gameState === 'flying' && hasBet && !cashedOut ? (
            <button
              type="button"
              onClick={handleCashout}
              className="aviator-cashout-btn"
            >
              <Zap size={18} />
              CASHOUT ₹{(Number(betAmount) * multiplier).toFixed(2)} ({multiplier.toFixed(2)}x)
            </button>
          ) : cashedOut ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 245, 155, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
              border: '2px solid #00f59b',
              boxShadow: '0 0 20px rgba(0, 245, 155, 0.4)',
              borderRadius: '12px',
              padding: '14px',
              textAlign: 'center',
              color: '#00f59b',
              fontWeight: 900,
              fontSize: '16px',
              letterSpacing: '0.4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <CheckCircle size={18} /> CASHED OUT ₹{cashoutPayout.toFixed(2)}!
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePlaceBet}
              disabled={gameState !== 'betting' || hasBet}
              className="aviator-bet-btn"
            >
              <Plane size={18} style={{ transform: 'rotate(-45deg)' }} />
              {hasBet
                ? 'BET PLACED — WAITING FOR FLIGHT'
                : gameState === 'betting'
                ? `PLACE BET ₹${Number(betAmount || 0).toFixed(2)}`
                : 'FLIGHT IN PROGRESS'}
            </button>
          )}
        </div>

        {/* Right: Active Flight Passengers Leaderboard */}
        <div className="aviator-control-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(239, 68, 68, 0.15)', paddingBottom: '8px' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', color: '#f8fafc' }}>
              <Flame size={16} color="#ff4b63" /> Live Passengers ({activePlayers.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '190px', overflowY: 'auto' }}>
            {activePlayers.length > 0 ? (
              activePlayers.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 10px',
                    background: p.status === 'cashed_out' ? 'rgba(0, 245, 155, 0.12)' : 'rgba(15, 23, 42, 0.7)',
                    border: p.status === 'cashed_out' ? '1.5px solid rgba(0, 245, 155, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>{p.username}</span>
                  <span className="font-mono" style={{ color: '#fca5a5', fontWeight: 800 }}>₹{Number(p.amount).toFixed(2)}</span>
                  {p.status === 'cashed_out' ? (
                    <span className="font-mono" style={{ color: '#00f59b', fontWeight: 900 }}>
                      +{p.cashedOutMultiplier?.toFixed(2)}x (₹{p.payout?.toFixed(2)})
                    </span>
                  ) : (
                    <span style={{ color: '#ff7849', fontSize: '11px', fontWeight: 800 }}>Flying 🚀</span>
                  )}
                </div>
              ))
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', padding: '24px' }}>
                Waiting for passengers to board...
              </div>
            )}
          </div>
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
