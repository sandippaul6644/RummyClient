/**
 * CrashGame.jsx — Premier Aviator / Crash Rocket Luxury Experience
 * Fully responsive mobile-first architecture:
 * - Supersonic Crimson Jet with dynamic twin plasma afterburners and trailing sparks
 * - Exponential trajectory curve that flows smoothly without crossing through multiplier numbers
 * - Multiplier container with soft radial dark glass backing for crystal-clear readability
 * - Full-width cockpit action button (Never clipped or squeezed!)
 * - Capsule mode switch (Bet / Auto) with clean Auto-Cashout toggle
 * - Color-coded multiplier history pills (Blue <2x, Purple 2-10x, Hot Pink 10-50x, Gold 50x+)
 * - Provably Fair HMAC-SHA256 modal
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Rocket,
  ShieldCheck,
  History,
  TrendingUp,
  Users,
  X,
  Flame,
  Award,
  CheckCircle2,
  Minus,
  Plus,
  Lock,
  Volume2,
  VolumeX,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { socket } from '../../services/socket.js';
import { api } from '../../services/api.js';
import { sound } from '../../utils/sound.js';

// ── Multiplier Formula (Synchronized with Server K=0.00006) ───────────────────
const K = 0.00006;
function calcMultiplier(elapsedMs) {
  return Math.max(1.0, Math.floor(Math.exp(K * elapsedMs) * 100) / 100);
}

// ── Iconic Aviator Multiplier Color Coding ────────────────────────────────────
function getMultiplierColor(m) {
  if (m < 2.0) return '#ffffff'; // Crisp ice white with cyan ambient
  if (m < 10.0) return '#c084fc'; // Signature Aviator Purple (2x-10x)
  if (m < 50.0) return '#f43f5e'; // Hot Crimson Rose (10x-50x)
  return '#fbbf24'; // Radiant Solar Gold (50x+)
}

function getPillClass(cp) {
  if (!cp || cp < 2.0) return 'tier-blue';
  if (cp < 10.0) return 'tier-purple';
  if (cp < 50.0) return 'tier-fire';
  return 'tier-gold';
}

// ─────────────────────────────────────────────────────────────────────────────
export const CrashGame = () => {
  const { user, wallet, refreshWallet, setIsAuthModalOpen, setIsDepositModalOpen } = useAuth();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const flyStartRef = useRef(0);

  // ── Game State ──────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState('WAITING');
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [roundNum, setRoundNum] = useState(null);
  const [seedHash, setSeedHash] = useState('');

  // ── Bet State ───────────────────────────────────────────────────────────────
  const [mode, setMode] = useState('bet'); // 'bet' | 'auto'
  const [betInput, setBetInput] = useState('10');
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);
  const [autoTarget, setAutoTarget] = useState('2.00');
  const [hasBet, setHasBet] = useState(false);
  const [betAmount, setBetAmount] = useState(0);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashoutMult, setCashoutMult] = useState(null);
  const [cashoutPay, setCashoutPay] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [cashingOut, setCashingOut] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Community & History ─────────────────────────────────────────────────────
  const [livePlayers, setLivePlayers] = useState([]);
  const [history, setHistory] = useState([]);
  const [myBetsHistory, setMyBetsHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my' | 'top'
  const [selectedPillModal, setSelectedPillModal] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);

  // ── Canvas Particles & Physics State Refs ────────────────────────────────────
  const starsRef = useRef(
    Array.from({ length: 65 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.8 + 0.3,
      opacity: Math.random() * 0.7 + 0.3,
    }))
  );

  const exhaustSparksRef = useRef([]);
  const explosionRef = useRef({ active: false, x: 0, y: 0, progress: 0, particles: [] });

  // ── Toast Notification ──────────────────────────────────────────────────────
  const flash = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3600);
  }, []);

  // ── Load Initial History ────────────────────────────────────────────────────
  useEffect(() => {
    api
      .get('/games/crash/history?limit=30')
      .then((r) => r.data?.success && setHistory(r.data.data || []))
      .catch(() => {});
  }, []);

  // ── Fetch Current Round on Mount (Reconnect) ────────────────────────────────
  useEffect(() => {
    api
      .get('/games/crash/current-round')
      .then((r) => {
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
          flyStartRef.current = Date.now();
          setMultiplier(rd.currentMultiplier || 1.0);
        } else {
          setPhase('WAITING');
        }
      })
      .catch(() => {});
  }, []);

  // ── Socket Events ───────────────────────────────────────────────────────────
  useEffect(() => {
    socket.emit('game:join', { gameSlug: 'crash' });

    const onWaiting = ({ roundNumber, serverSeedHash }) => {
      sound.stopFlightSound();
      setPhase('WAITING');
      setMultiplier(1.0);
      setCrashPoint(null);
      setRoundNum(roundNumber);
      setSeedHash(serverSeedHash);
      setHasBet(false);
      setCashedOut(false);
      setCashoutMult(null);
      setCashoutPay(null);
      setLivePlayers([]);
      explosionRef.current = { active: false, x: 0, y: 0, progress: 0, particles: [] };
    };

    const onBetting = ({ roundNumber, betEndsAt }) => {
      sound.stopFlightSound();
      setPhase('BETTING');
      setRoundNum(roundNumber);
      const rem = Math.max(0, Math.ceil((new Date(betEndsAt) - Date.now()) / 1000));
      setCountdown(rem);
      sound.playBeep(false);
    };

    const onFlying = ({ roundNumber, startedAt }) => {
      setPhase('FLYING');
      flyStartRef.current = new Date(startedAt).getTime();
      setMultiplier(1.0);
      setCountdown(0);
      explosionRef.current = { active: false, x: 0, y: 0, progress: 0, particles: [] };
      sound.startFlightSound();
    };

    const onTick = ({ multiplier: m }) => {
      setMultiplier(m);
      sound.updateFlightPitch(m);
    };

    const onCrashed = ({ roundNumber, crashPoint: cp }) => {
      sound.stopFlightSound();
      setPhase('CRASHED');
      setCrashPoint(cp);
      setMultiplier(cp);
      sound.playCrash();

      // Trigger explosion at crash point
      explosionRef.current = {
        active: true,
        progress: 0,
        particles: Array.from({ length: 32 }, () => ({
          dx: (Math.random() - 0.5) * 14,
          dy: (Math.random() - 0.5) * 14,
          size: Math.random() * 4 + 2,
          color: Math.random() > 0.4 ? '#ef4444' : '#ff9500',
          life: 1.0,
        })),
      };

      setHistory((prev) =>
        [{ roundNumber, crashPoint: cp, settledAt: new Date(), serverSeedHash: seedHash }, ...prev].slice(0, 30)
      );

      setLivePlayers((prev) => prev.map((p) => (p.cashedOut ? p : { ...p, lost: true })));

      if (hasBet && !cashedOut) {
        flash(`Flew Away at ${cp.toFixed(2)}× — ₹${betAmount} lost`, 'error');
        setMyBetsHistory((prev) => [
          { roundNumber, amount: betAmount, won: false, multiplier: cp, payout: 0, time: new Date() },
          ...prev,
        ]);
        refreshWallet?.();
      }
    };

    const onSettled = () => {
      sound.stopFlightSound();
      setPhase('WAITING');
    };

    const onBetPlaced = ({ username, amount, autoCashout }) => {
      setLivePlayers((prev) => {
        if (prev.find((p) => p.username === username)) return prev;
        return [...prev, { username, amount, autoCashout, cashedOut: false, lost: false }];
      });
    };

    const onCashout = ({ userId, multiplier: m, payout }) => {
      setLivePlayers((prev) =>
        prev.map((p) =>
          p.userId === String(userId) || p.username === String(userId)
            ? { ...p, cashedOut: true, cashoutMult: m, payout }
            : p
        )
      );

      if (user && String(userId) === String(user._id || user.id)) {
        setCashedOut(true);
        setCashoutMult(m);
        setCashoutPay(payout);
        sound.playCashout();
        sound.playWin();
        flash(`Cashed out at ${m}× — Won ₹${payout.toFixed(2)}!`, 'win');
        setMyBetsHistory((prev) => [
          { roundNumber: roundNum, amount: betAmount, won: true, multiplier: m, payout, time: new Date() },
          ...prev,
        ]);
        refreshWallet?.();
      }
    };

    socket.on('crash:round:waiting', onWaiting);
    socket.on('crash:round:betting', onBetting);
    socket.on('crash:round:flying', onFlying);
    socket.on('crash:tick', onTick);
    socket.on('crash:round:crashed', onCrashed);
    socket.on('crash:round:settled', onSettled);
    socket.on('crash:bet:placed', onBetPlaced);
    socket.on('crash:cashout', onCashout);

    return () => {
      sound.stopFlightSound();
      socket.emit('game:leave', { gameSlug: 'crash' });
      socket.off('crash:round:waiting', onWaiting);
      socket.off('crash:round:betting', onBetting);
      socket.off('crash:round:flying', onFlying);
      socket.off('crash:tick', onTick);
      socket.off('crash:round:crashed', onCrashed);
      socket.off('crash:round:settled', onSettled);
      socket.off('crash:bet:placed', onBetPlaced);
      socket.off('crash:cashout', onCashout);
    };
  }, [user, hasBet, betAmount, cashedOut, roundNum, seedHash, flash, refreshWallet]);

  // ── Countdown Tick ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'BETTING') return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // ── High-Performance Canvas Rendering (Supersonic Aviator Crimson Jet) ───────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const getDims = () => {
      const rect = canvas.getBoundingClientRect();
      const W = Math.max(rect.width || canvas.width || 320, 120);
      const H = Math.max(rect.height || canvas.height || 240, 100);
      const PAD_L = 36;
      const PAD_B = 28;
      const PAD_T = 24;
      const PAD_R = 36;
      const cW = Math.max(20, W - PAD_L - PAD_R);
      const cH = Math.max(20, H - PAD_T - PAD_B);
      return { W, H, PAD_L, PAD_B, PAD_T, PAD_R, cW, cH };
    };

    const multToY = (m, cH, PAD_T) => {
      const logM = Math.log(Math.max(1, m));
      const logMax = Math.log(Math.max(2, multiplier * 1.25));
      return PAD_T + cH - (logM / logMax) * cH;
    };

    // Draw Supersonic Aviator Jet with Delta Wings & Animated Twin Afterburners
    const drawSupersonicAviatorJet = (x, y, angle) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Subtle aerodynamic floating motion
      const bob = Math.sin(Date.now() * 0.005) * 1.8;
      ctx.translate(0, bob);

      // 1. Afterburner Flame Exhaust (Twin Engine Plasma Jet)
      const flamePulse = 0.85 + 0.3 * Math.sin(Date.now() * 0.04);
      const flameLen = 28 * flamePulse;

      // Outer roaring orange plasma flame
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#ff4500';
      ctx.fillStyle = '#ff3300';
      ctx.beginPath();
      ctx.moveTo(-16, -5);
      ctx.lineTo(-16 - flameLen, 0);
      ctx.lineTo(-16, 5);
      ctx.closePath();
      ctx.fill();

      // Mid incandescent yellow flame
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.moveTo(-16, -3);
      ctx.lineTo(-16 - flameLen * 0.65, 0);
      ctx.lineTo(-16, 3);
      ctx.closePath();
      ctx.fill();

      // Core white-hot plasma
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-16, -1.5);
      ctx.lineTo(-16 - flameLen * 0.35, 0);
      ctx.lineTo(-16, 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // 2. Delta Swept Wings in Ruby Red
      const wingGrad = ctx.createLinearGradient(0, -22, 0, 22);
      wingGrad.addColorStop(0, '#991b1b');
      wingGrad.addColorStop(0.5, '#dc2626');
      wingGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = wingGrad;

      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-8, -24);
      ctx.lineTo(-14, -22);
      ctx.lineTo(-8, -5);
      ctx.lineTo(-8, 5);
      ctx.lineTo(-14, 22);
      ctx.lineTo(-8, 24);
      ctx.closePath();
      ctx.fill();

      // Wing Edge Specular Bevel
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-8, -24);
      ctx.moveTo(8, 0);
      ctx.lineTo(-8, 24);
      ctx.stroke();

      // Wingtip LED Beacons
      ctx.fillStyle = '#22c55e'; // Green starboard
      ctx.beginPath();
      ctx.arc(-8, -24, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444'; // Red port
      ctx.beginPath();
      ctx.arc(-8, 24, 2, 0, Math.PI * 2);
      ctx.fill();

      // 3. Main Aerodynamic Fuselage
      const bodyGrad = ctx.createLinearGradient(0, -6, 0, 6);
      bodyGrad.addColorStop(0, '#ef4444');
      bodyGrad.addColorStop(0.35, '#f87171');
      bodyGrad.addColorStop(0.7, '#dc2626');
      bodyGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = bodyGrad;

      ctx.beginPath();
      ctx.moveTo(24, 0); // Needle nose
      ctx.quadraticCurveTo(12, -6, -14, -5);
      ctx.lineTo(-16, 0);
      ctx.lineTo(-14, 5);
      ctx.quadraticCurveTo(12, 6, 24, 0);
      ctx.closePath();
      ctx.fill();

      // 4. Cockpit Canopy (Sleek Tinted Cyan Glass)
      const glassGrad = ctx.createLinearGradient(10, -3, 0, 3);
      glassGrad.addColorStop(0, '#e0f2fe');
      glassGrad.addColorStop(0.5, '#38bdf8');
      glassGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.moveTo(14, -1);
      ctx.quadraticCurveTo(6, -4, 0, -3);
      ctx.lineTo(2, 0);
      ctx.quadraticCurveTo(6, 2, 14, 1);
      ctx.closePath();
      ctx.fill();

      // Cockpit glass specular shine
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12, -0.8);
      ctx.lineTo(4, -2.5);
      ctx.stroke();

      // 5. Twin Tail Vertical Stabilizers
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(-10, -4);
      ctx.lineTo(-18, -12);
      ctx.lineTo(-20, -11);
      ctx.lineTo(-14, -3);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-10, 4);
      ctx.lineTo(-18, 12);
      ctx.lineTo(-20, 11);
      ctx.lineTo(-14, 3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    const draw = () => {
      const { W, H, PAD_L, PAD_B, PAD_T, PAD_R, cW, cH } = getDims();
      if (!ctx || W <= 0 || H <= 0 || cW <= 0 || cH <= 0) return;
      ctx.clearRect(0, 0, W, H);

      // Deep atmospheric cosmic backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#060913');
      bgGrad.addColorStop(0.65, '#0c1120');
      bgGrad.addColorStop(1, '#05070f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Ambient radial climb glow (safe radius guards)
      const glowR0 = 10;
      const glowR1 = Math.max(30, cW * 0.8);
      const radialGlow = ctx.createRadialGradient(
        PAD_L + cW * 0.7,
        PAD_T + cH * 0.4,
        glowR0,
        PAD_L + cW * 0.7,
        PAD_T + cH * 0.4,
        glowR1
      );
      radialGlow.addColorStop(0, 'rgba(225, 29, 72, 0.12)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, W, H);

      // Drifting stars simulation
      const isFlying = phase === 'FLYING';
      ctx.fillStyle = '#ffffff';
      starsRef.current.forEach((s) => {
        if (isFlying) {
          s.y = (s.y + s.speed * 0.0025) % 1;
          s.x = (s.x - s.speed * 0.0035 + 1) % 1;
        }
        ctx.globalAlpha = s.opacity * (0.6 + 0.4 * Math.sin(Date.now() * 0.002 + s.x * 10));
        ctx.fillRect(s.x * W, s.y * H, s.size, s.size);
      });
      ctx.globalAlpha = 1.0;

      // Altitude reference grid lines (Logarithmic)
      ctx.lineWidth = 1;
      const refMultipliers = [1.5, 2, 3, 5, 10, 20, 50, 100];
      refMultipliers.forEach((m) => {
        if (m > multiplier * 1.45) return;
        const y = multToY(m, cH, PAD_T);
        if (y < PAD_T || y > H - PAD_B) return;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(PAD_L, y);
        ctx.lineTo(W - PAD_R, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = '700 10px monospace';
        ctx.fillText(`${m}×`, 6, y + 3.5);
      });

      // Bottom baseline runway axis
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PAD_L, H - PAD_B);
      ctx.lineTo(W - PAD_R, H - PAD_B);
      ctx.stroke();

      if (phase === 'WAITING' || phase === 'BETTING') {
        // Idle runway baseline
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PAD_L, H - PAD_B);
        ctx.lineTo(PAD_L + cW * 0.25, H - PAD_B);
        ctx.stroke();

        // Idle jet sitting on the runway
        drawSupersonicAviatorJet(PAD_L + 25, H - PAD_B - 6, 0);
        return;
      }

      // Elapsed flight progression
      const elapsedMs = phase === 'FLYING' ? Date.now() - flyStartRef.current : 99999;
      const steps = Math.min(240, Math.max(10, Math.floor(elapsedMs / 50)));

      // Authentic Flight Dynamics: The plane advances smoothly across the screen
      // Starting from bottom-left and cruising towards the right
      const flightProgress = Math.min(1, elapsedMs / 14000); // reaches 85% width in 14s
      const currentPlaneX = PAD_L + Math.max(cW * 0.2, flightProgress * (cW * 0.82));
      const currentPlaneY = multToY(phase === 'CRASHED' ? crashPoint : multiplier, cH, PAD_T);

      const curveColor = phase === 'CRASHED' ? '#ef4444' : '#ff334b';

      ctx.beginPath();
      let lastX = PAD_L;
      let lastY = H - PAD_B;
      let prevX = lastX;
      let prevY = lastY;

      for (let i = 0; i <= steps; i++) {
        const ratio = i / steps;
        const x = PAD_L + ratio * (currentPlaneX - PAD_L);
        // Exponential parabolic curve: starts low, bends smoothly upward
        const expRatio = Math.pow(ratio, 1.9);
        const y = H - PAD_B - expRatio * (H - PAD_B - currentPlaneY);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        prevX = lastX;
        prevY = lastY;
        lastX = x;
        lastY = y;
      }

      // Parabolic Glowing Red/Flame Trajectory
      ctx.shadowBlur = 18;
      ctx.shadowColor = curveColor;
      ctx.strokeStyle = curveColor;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Area fill underneath the curve (Radiant Sunset Crimson Gradient)
      ctx.lineTo(lastX, H - PAD_B);
      ctx.lineTo(PAD_L, H - PAD_B);
      ctx.closePath();

      const areaFill = ctx.createLinearGradient(0, currentPlaneY, 0, H - PAD_B);
      areaFill.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
      areaFill.addColorStop(0.65, 'rgba(239, 68, 68, 0.08)');
      areaFill.addColorStop(1, 'transparent');
      ctx.fillStyle = areaFill;
      ctx.fill();

      // Plane Banking Angle
      const deltaX = lastX - prevX || 1;
      const deltaY = lastY - prevY || 0;
      const angle = Math.atan2(deltaY, deltaX);

      // Exhaust Spark Particles
      if (phase === 'FLYING' && Math.random() > 0.3) {
        exhaustSparksRef.current.push({
          x: lastX - Math.cos(angle) * 18,
          y: lastY - Math.sin(angle) * 18,
          dx: -Math.cos(angle) * (Math.random() * 3 + 2) + (Math.random() - 0.5) * 1.5,
          dy: -Math.sin(angle) * (Math.random() * 3 + 2) + (Math.random() - 0.5) * 1.5,
          size: Math.random() * 2.5 + 1.2,
          life: 1.0,
          color: Math.random() > 0.5 ? '#fde047' : '#ff5500',
        });
      }

      // Update and draw exhaust sparks
      exhaustSparksRef.current.forEach((sp) => {
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = sp.life;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        sp.x += sp.dx;
        sp.y += sp.dy;
        sp.life -= 0.05;
      });
      exhaustSparksRef.current = exhaustSparksRef.current.filter((sp) => sp.life > 0);
      ctx.globalAlpha = 1.0;

      // Render Supersonic Jet
      if (phase === 'FLYING') {
        drawSupersonicAviatorJet(lastX, lastY, angle);
      }

      // Dramatic Explosion on Crash
      if (phase === 'CRASHED' && explosionRef.current.active) {
        const exp = explosionRef.current;
        const crashX = lastX;
        const crashY = lastY;

        ctx.save();
        ctx.translate(crashX, crashY);

        // Shockwave expansion ring
        ctx.strokeStyle = `rgba(239, 68, 68, ${Math.max(0, 1 - exp.progress * 0.03)})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, exp.progress * 2.8, 0, Math.PI * 2);
        ctx.stroke();

        // Core explosion fireball
        const burstGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 32);
        burstGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        burstGrad.addColorStop(0.35, 'rgba(255, 120, 0, 0.85)');
        burstGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = burstGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fill();

        // Incandescent debris embers
        exp.particles.forEach((p) => {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(p.dx * exp.progress * 0.16, p.dy * exp.progress * 0.16, p.size, 0, Math.PI * 2);
          ctx.fill();
          p.life = Math.max(0, p.life - 0.02);
        });
        ctx.globalAlpha = 1.0;
        ctx.restore();

        exp.progress += 1;
        if (exp.progress > 45) {
          exp.active = false;
        }
      }
    };

    const loop = () => {
      draw();
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [phase, multiplier, crashPoint]);

  // ── Bet Handlers ─────────────────────────────────────────────────────────────
  const handlePlaceBet = async () => {
    if (!user) {
      setIsAuthModalOpen?.(true);
      return;
    }
    if (hasBet || phase !== 'BETTING' || placing) return;

    const amt = parseFloat(betInput);
    const auto = autoCashoutEnabled ? parseFloat(autoTarget) || 0 : 0;
    if (isNaN(amt) || amt <= 0) {
      flash('Please enter a valid bet amount', 'error');
      return;
    }

    // Client-side balance check to prevent unnecessary failed network requests & server errors
    const currentBal = Number(wallet?.balance ?? user?.balance ?? 0);
    if (currentBal < amt) {
      sound.playWarning();
      flash(`⚠️ Insufficient wallet balance (₹${currentBal.toFixed(2)}). Please deposit to place ₹${amt.toFixed(2)} bet.`, 'error');
      setIsDepositModalOpen?.(true);
      return;
    }

    sound.playClick();
    setPlacing(true);
    try {
      const res = await api.post('/games/crash/bets', {
        amount: amt,
        autoCashout: auto >= 1.01 ? auto : null,
      });
      if (res.data?.success) {
        setHasBet(true);
        setBetAmount(amt);
        flash(`Bet placed: ₹${amt}${auto >= 1.01 ? ` (Auto @ ${auto}×)` : ''}`, 'info');
        setLivePlayers((prev) => [
          {
            username: user.username,
            amount: amt,
            autoCashout: auto >= 1.01 ? auto : null,
            cashedOut: false,
            lost: false,
            self: true,
          },
          ...prev.filter((p) => p.username !== user.username),
        ]);
        refreshWallet?.();
      }
    } catch (e) {
      sound.playWarning();
      const errMsg = e.response?.data?.message || 'Failed to place bet';
      flash(errMsg, 'error');
      if (errMsg.toLowerCase().includes('balance') || errMsg.toLowerCase().includes('insufficient')) {
        setIsDepositModalOpen?.(true);
      }
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
        sound.playCashout();
        sound.playWin();
        flash(`Cashed out at ${d.multiplier}× — Won ₹${d.payout?.toFixed(2)}!`, 'win');
        refreshWallet?.();
      }
    } catch (e) {
      flash(e.response?.data?.message || 'Cashout failed', 'error');
    } finally {
      setCashingOut(false);
    }
  };

  const setQuickBet = (v) => {
    sound.playClick();
    setBetInput(String(v));
  };

  const toggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
    if (!next) {
      sound.stopFlightSound();
    } else if (phase === 'FLYING') {
      sound.startFlightSound();
      sound.updateFlightPitch(multiplier);
    }
  };

  const multColor = phase === 'CRASHED' ? '#ef4444' : getMultiplierColor(multiplier);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="aviator-game-wrapper" ref={containerRef}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '13px',
            backdropFilter: 'blur(12px)',
            background:
              toast.type === 'win'
                ? 'rgba(16, 185, 129, 0.94)'
                : toast.type === 'error'
                ? 'rgba(239, 68, 68, 0.94)'
                : 'rgba(20, 26, 40, 0.96)',
            border: `1px solid ${
              toast.type === 'win' ? '#10b981' : toast.type === 'error' ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'
            }`,
            color: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {toast.type === 'win' && <Award size={16} color="#fff" />}
          {toast.type === 'error' && <X size={16} color="#fff" />}
          {toast.msg}
        </div>
      )}

      {/* ── 1. Top Multiplier History Ribbon ── */}
      <div className="aviator-history-ribbon">
        <span
          style={{
            fontSize: '10px',
            fontWeight: 900,
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            paddingRight: '6px',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <History size={12} color="#ff5500" />
          ROUNDS
        </span>
        {history.map((h, i) => (
          <div
            key={i}
            className={`aviator-pill ${getPillClass(h.crashPoint)}`}
            onClick={() => setSelectedPillModal(h)}
            title="Click to verify Provably Fair"
          >
            {Number(h.crashPoint).toFixed(2)}×
          </div>
        ))}
        {history.length === 0 && (
          <span style={{ color: '#475569', fontSize: '11px', padding: '0 8px' }}>Waiting for flight data...</span>
        )}
      </div>

      {/* ── 2. Flight Arena Canvas Card (High-Tech HUD) ── */}
      <div className="aviator-arena-card">
        {/* Hardware Accelerated Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />

        {/* HUD Top Meta Bar */}
        <div className="aviator-hud-top-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {roundNum && <span className="aviator-hud-round-pill">#{roundNum}</span>}
            <button
              onClick={toggleSound}
              style={{
                background: 'rgba(10, 14, 24, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color: soundEnabled ? '#34d399' : '#64748b',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontWeight: 800,
              }}
              title="Toggle Audio"
            >
              {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="aviator-hud-round-pill" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={11} color="#38bdf8" />
              <span>{livePlayers.length} In Flight</span>
            </span>
            {seedHash && (
              <span
                className="aviator-hud-round-pill"
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  setSelectedPillModal({
                    roundNumber: roundNum,
                    serverSeedHash: seedHash,
                    crashPoint: crashPoint || multiplier,
                  })
                }
                title="Verify Provably Fair HMAC-SHA256"
              >
                <Lock size={10} color="#fbbf24" />
              </span>
            )}
          </div>
        </div>

        {/* HUD Center Dynamic Multiplier / Status Overlay */}
        <div className="aviator-hud-overlay">
          {phase === 'WAITING' && (
            <div style={{ textAlign: 'center' }}>
              <div className="aviator-status-badge" style={{ color: '#94a3b8' }}>
                Preparing Next Flight...
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                Next flight departing shortly
              </div>
            </div>
          )}

          {phase === 'BETTING' && (
            <div className="aviator-countdown-container">
              <div className="aviator-status-badge" style={{ color: '#fbbf24' }}>
                Takeoff Imminent
              </div>
              <div className="aviator-countdown-timer">{countdown}s</div>
              <div className="aviator-countdown-bar-wrap">
                <div
                  className="aviator-countdown-bar-fill"
                  style={{ width: `${Math.max(5, (countdown / 6) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {(phase === 'FLYING' || phase === 'CRASHED') && (
            <div style={{ textAlign: 'center' }}>
              {phase === 'CRASHED' ? (
                <div>
                  <div className="aviator-flew-away-text">FLEW AWAY!</div>
                  <div
                    style={{
                      fontSize: 'clamp(32px, 7vw, 48px)',
                      fontWeight: 900,
                      color: '#ef4444',
                      fontFamily: 'monospace',
                      marginTop: '4px',
                    }}
                  >
                    @ {Number(crashPoint || multiplier).toFixed(2)}×
                  </div>
                </div>
              ) : (
                <div className="aviator-multiplier-container">
                  <div
                    className="aviator-multiplier-huge"
                    style={{
                      color: multColor,
                    }}
                  >
                    {multiplier.toFixed(2)}×
                  </div>

                  {/* Live Potential Payout Indicator */}
                  {hasBet && !cashedOut && (
                    <div className="aviator-potential-badge">
                      Potential Cashout: ₹{(betAmount * multiplier).toFixed(2)}
                    </div>
                  )}

                  {/* Cashed Out Success Pill */}
                  {cashedOut && cashoutMult && (
                    <div
                      className="aviator-potential-badge"
                      style={{
                        background: 'rgba(16, 185, 129, 0.25)',
                        borderColor: '#10b981',
                      }}
                    >
                      ✓ Cashed @ {cashoutMult}× — Won ₹{cashoutPay?.toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Authentic Aviator Cockpit Betting Panel (Full-Width, Zero Clipping) ── */}
      <div className={`aviator-bet-panel ${hasBet ? 'active-bet' : ''}`}>
        {/* Panel Top Bar: Mode Switch & Wallet Balance */}
        <div className="aviator-panel-top-bar">
          <div className="aviator-mode-switch">
            <button
              type="button"
              className={`aviator-mode-btn ${mode === 'bet' ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setMode('bet');
              }}
            >
              Bet
            </button>
            <button
              type="button"
              className={`aviator-mode-btn ${mode === 'auto' ? 'active' : ''}`}
              onClick={() => {
                sound.playClick();
                setMode('auto');
              }}
            >
              Auto
            </button>
          </div>

          {user && wallet ? (
            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              Balance:{' '}
              <strong style={{ color: '#fbbf24', fontSize: '13px' }}>
                ₹{Number(wallet.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsAuthModalOpen?.(true);
              }}
              style={{
                fontSize: '11px',
                color: '#38bdf8',
                fontWeight: 800,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '8px',
                padding: '3px 10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Lock size={11} /> Log in to play
            </button>
          )}
        </div>

        {/* Bet Amount Stepper & Quick Presets */}
        <div className="aviator-amount-section">
          <div className="aviator-amount-stepper">
            <button
              type="button"
              className="aviator-stepper-touch-btn"
              onClick={() => {
                const val = Math.max(1, (parseFloat(betInput) || 10) - 10);
                setBetInput(String(val));
              }}
              disabled={hasBet || phase === 'FLYING' || phase === 'CRASHED'}
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              min="1"
              step="1"
              value={betInput}
              onChange={(e) => setBetInput(e.target.value)}
              disabled={hasBet || phase === 'FLYING' || phase === 'CRASHED'}
              className="aviator-amount-input"
            />
            <button
              type="button"
              className="aviator-stepper-touch-btn"
              onClick={() => {
                const val = (parseFloat(betInput) || 10) + 10;
                setBetInput(String(val));
              }}
              disabled={hasBet || phase === 'FLYING' || phase === 'CRASHED'}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Quick Preset Chips */}
          <div className="aviator-chips-grid">
            {[10, 50, 100, 500].map((v) => (
              <button
                key={v}
                type="button"
                className="aviator-chip-tag"
                onClick={() => setQuickBet(v)}
                disabled={hasBet && phase === 'FLYING'}
              >
                ₹{v}
              </button>
            ))}
          </div>
        </div>

        {/* Auto Cashout Strip (Clean row with toggle switch) */}
        <div className="aviator-auto-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              className={`aviator-toggle-switch ${autoCashoutEnabled ? 'on' : ''}`}
              onClick={() => {
                sound.playClick();
                setAutoCashoutEnabled(!autoCashoutEnabled);
              }}
            >
              <div className="aviator-toggle-knob" />
            </div>
            <span style={{ fontWeight: 800, color: autoCashoutEnabled ? '#ffffff' : '#64748b' }}>
              Auto Cashout
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="number"
              step="0.1"
              min="1.01"
              value={autoTarget}
              onChange={(e) => setAutoTarget(e.target.value)}
              disabled={!autoCashoutEnabled || hasBet}
              style={{
                width: '64px',
                padding: '4px 6px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: autoCashoutEnabled ? '#080c14' : 'rgba(255, 255, 255, 0.03)',
                color: autoCashoutEnabled ? '#fbbf24' : '#64748b',
                fontWeight: 900,
                fontSize: '12px',
                textAlign: 'center',
                outline: 'none',
              }}
            />
            <span style={{ fontWeight: 800, color: autoCashoutEnabled ? '#fbbf24' : '#64748b' }}>×</span>
          </div>
        </div>

        {/* Giant Full-Width Action Button (Never Squeezed or Clipped!) */}
        {(!hasBet || phase === 'WAITING' || phase === 'CRASHED') && (() => {
          if (!user) {
            return (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsAuthModalOpen?.(true);
                }}
                className="aviator-hero-action-btn btn-auth-prompt"
              >
                <Lock size={19} />
                <span style={{ fontSize: '16px', fontWeight: 900 }}>
                  LOG IN / SIGN UP TO PLAY
                </span>
              </button>
            );
          }

          const currentBal = Number(wallet?.balance ?? user?.balance ?? 0);
          const currentBetAmt = parseFloat(betInput) || 10;
          const isInsufficient = Boolean(currentBal < currentBetAmt);

          return (
            <button
              type="button"
              onClick={handlePlaceBet}
              disabled={phase !== 'BETTING' || placing || hasBet}
              className={`aviator-hero-action-btn ${
                phase === 'BETTING' && !hasBet
                  ? isInsufficient
                    ? 'btn-insufficient'
                    : 'btn-bet'
                  : 'btn-idle'
              }`}
            >
              {phase === 'BETTING' ? (
                isInsufficient ? (
                  <>
                    <AlertTriangle size={20} />
                    <span style={{ fontSize: '15px', fontWeight: 900 }}>
                      RECHARGE WALLET (BAL: ₹{currentBal.toFixed(2)})
                    </span>
                  </>
                ) : (
                  <>
                    <Rocket size={20} />
                    <span style={{ fontSize: '17px', fontWeight: 900 }}>
                      {placing ? 'PLACING BET...' : `BET ₹ ${currentBetAmt.toFixed(2)}`}
                    </span>
                  </>
                )
              ) : (
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#64748b' }}>
                  {phase === 'CRASHED' ? 'ROUND ENDED — WAITING NEXT ROUND' : 'WAITING FOR NEXT ROUND...'}
                </span>
              )}
            </button>
          );
        })()}

        {hasBet && phase === 'BETTING' && (
          <button
            type="button"
            disabled
            className="aviator-hero-action-btn btn-bet-confirmed"
          >
            <CheckCircle2 size={20} />
            <span style={{ fontSize: '16px', fontWeight: 900 }}>
              BET CONFIRMED (READY FOR TAKEOFF IN {countdown}S)
            </span>
          </button>
        )}

        {hasBet && phase === 'FLYING' && !cashedOut && (
          <button
            type="button"
            onClick={handleCashout}
            disabled={cashingOut}
            className="aviator-hero-action-btn btn-cashout"
          >
            <Flame size={22} fill="#ffffff" />
            <span style={{ fontSize: '18px', fontWeight: 900 }}>
              {cashingOut ? 'CASHING OUT...' : `CASH OUT ₹ ${(betAmount * multiplier).toFixed(2)}`}
            </span>
          </button>
        )}

        {hasBet && cashedOut && (
          <div
            className="aviator-hero-action-btn"
            style={{
              background: 'rgba(16, 185, 129, 0.18)',
              border: '1.5px solid #10b981',
              color: '#34d399',
            }}
          >
            <Award size={20} />
            <span style={{ fontSize: '16px', fontWeight: 900 }}>
              WON +₹{cashoutPay?.toFixed(2)} (CASHED @ {cashoutMult}×)
            </span>
          </div>
        )}
      </div>

      {/* ── 4. Activity & Bets Section (Tabbed, Responsive Underneath) ── */}
      <div className="aviator-activity-card">
        <div className="aviator-tab-header">
          <button
            type="button"
            className={`aviator-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Users size={12} />
            <span>All Bets ({livePlayers.length})</span>
          </button>
          <button
            type="button"
            className={`aviator-tab-btn ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            <TrendingUp size={12} />
            <span>My Bets ({myBetsHistory.length})</span>
          </button>
          <button
            type="button"
            className={`aviator-tab-btn ${activeTab === 'top' ? 'active' : ''}`}
            onClick={() => setActiveTab('top')}
          >
            <Award size={12} />
            <span>Top Multipliers</span>
          </button>
        </div>

        <div className="aviator-players-list">
          {activeTab === 'all' && (
            <div>
              {livePlayers.length === 0 ? (
                <div style={{ padding: '24px 16px', color: '#475569', fontSize: '12px', textAlign: 'center' }}>
                  No live bets placed this round yet
                </div>
              ) : (
                livePlayers.map((p, idx) => (
                  <div
                    key={idx}
                    className={`aviator-player-item ${p.cashedOut ? 'cashed' : p.lost ? 'lost' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: p.self ? 'linear-gradient(135deg,#ff5200,#ff9500)' : '#1e293b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#fff',
                        }}
                      >
                        {(p.username || 'U')[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: p.self ? '#fbbf24' : '#f1f5f9',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {p.username} {p.self && '(You)'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>₹{p.amount}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {p.cashedOut ? (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 900, color: '#34d399' }}>
                            {p.cashoutMult?.toFixed(2)}×
                          </div>
                          <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>
                            +₹{p.payout?.toFixed(0)}
                          </div>
                        </div>
                      ) : p.lost ? (
                        <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700 }}>CRASHED</span>
                      ) : p.autoCashout ? (
                        <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 800 }}>
                          Auto @ {p.autoCashout}×
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>In Flight</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'my' && (
            <div>
              {myBetsHistory.length === 0 ? (
                <div style={{ padding: '24px 16px', color: '#475569', fontSize: '12px', textAlign: 'center' }}>
                  Your session bets will appear here
                </div>
              ) : (
                myBetsHistory.map((b, idx) => (
                  <div key={idx} className={`aviator-player-item ${b.won ? 'cashed' : 'lost'}`}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                        Round #{b.roundNumber}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Bet: ₹{b.amount}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 900,
                          color: b.won ? '#34d399' : '#ef4444',
                        }}
                      >
                        {b.multiplier?.toFixed(2)}×
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: b.won ? '#34d399' : '#ef4444' }}>
                        {b.won ? `+₹${b.payout?.toFixed(2)}` : `-₹${b.amount}`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'top' && (
            <div>
              {history
                .filter((h) => Number(h.crashPoint) >= 5)
                .slice(0, 15)
                .map((h, idx) => (
                  <div key={idx} className="aviator-player-item cashed">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={14} color="#fbbf24" />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                          Round #{h.roundNumber}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Provably Fair Record</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#fbbf24' }}>
                        {Number(h.crashPoint).toFixed(2)}×
                      </div>
                      <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 800 }}>MEGA WIN</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Provably Fair Modal ── */}
      {selectedPillModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setSelectedPillModal(null)}
        >
          <div
            style={{
              background: '#0d1322',
              border: '1.5px solid rgba(255, 90, 0, 0.4)',
              boxShadow: '0 20px 48px rgba(0,0,0,0.85), 0 0 24px rgba(255, 90, 0, 0.25)',
              borderRadius: '18px',
              padding: '20px',
              maxWidth: '420px',
              width: '100%',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <ShieldCheck size={18} color="#34d399" />
                <span style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>
                  Round #{selectedPillModal.roundNumber} Result
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPillModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                textAlign: 'center',
                padding: '14px',
                background: 'rgba(16, 22, 34, 0.8)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '14px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>CRASH MULTIPLIER</span>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 900,
                  color: getMultiplierColor(selectedPillModal.crashPoint),
                  fontFamily: 'monospace',
                  marginTop: '4px',
                }}
              >
                {Number(selectedPillModal.crashPoint).toFixed(2)}×
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px' }}>
              <div>
                <span style={{ color: '#64748b', fontWeight: 800 }}>SERVER SEED HASH (SHA-256)</span>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    color: '#cbd5e1',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px',
                    borderRadius: '8px',
                    wordBreak: 'break-all',
                    marginTop: '3px',
                  }}
                >
                  {selectedPillModal.serverSeedHash || seedHash || '0x49f2b8c9d1e34a...'}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontWeight: 800 }}>PROVABLY FAIR VERIFICATION</span>
                <p style={{ margin: '4px 0 0', color: '#94a3b8', lineHeight: 1.4, fontSize: '11px' }}>
                  The crash point is generated cryptographically prior to round takeoff using HMAC-SHA256.
                  Neither the player nor the platform can manipulate flight outcomes once the round initiates.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPillModal(null)}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg,#ff5200,#ff9500)',
                color: '#fff',
                fontWeight: 900,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrashGame;
