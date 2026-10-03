import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { sound } from '../utils/sound.js';
import {
  Crown,
  Sparkles,
  Flame,
  Star,
  Users,
  Layers,
  ChevronRight,
  Shield,
  Dices,
  Zap,
  Play,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
} from 'lucide-react';

/* =========================================================================
   3D & VECTOR ARTWORK COMPONENTS
   ========================================================================= */

// 1. 3D Golden Gift Box with Spilling Coins & Sparkles (Welcome Bonus Banner)
const GiftBoxPromoArt = () => (
  <div style={{ position: 'relative', width: '135px', height: '115px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg viewBox="0 0 160 140" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))' }}>
      <defs>
        <radialGradient id="goldGlowBurst" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe066" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="goldBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="25%" stopColor="#fde047" />
          <stop offset="60%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
        <linearGradient id="blueRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="40%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <radialGradient id="coinShine" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#fef08a" />
          <stop offset="75%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </radialGradient>
      </defs>

      <circle cx="80" cy="70" r="65" fill="url(#goldGlowBurst)" opacity="0.55" />

      <g filter="drop-shadow(0 3px 6px rgba(0,0,0,0.4))">
        <ellipse cx="26" cy="36" rx="12" ry="8" fill="url(#coinShine)" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(-25 26 36)" />
        <ellipse cx="134" cy="32" rx="13" ry="9" fill="url(#coinShine)" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(28 134 32)" />
        <ellipse cx="22" cy="84" rx="10" ry="7" fill="url(#coinShine)" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(18 22 84)" />
        <ellipse cx="138" cy="88" rx="11" ry="8" fill="url(#coinShine)" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(-18 138 88)" />
        <ellipse cx="44" cy="116" rx="14" ry="8" fill="url(#coinShine)" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(-12 44 116)" />
        <ellipse cx="116" cy="116" rx="13" ry="8" fill="url(#coinShine)" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(12 116 116)" />
      </g>

      <polygon points="38,18 41,25 48,28 41,31 38,38 35,31 28,28 35,25" fill="#ffffff" filter="drop-shadow(0 0 6px #fff)" />
      <polygon points="122,18 124,23 129,25 124,27 122,32 120,27 115,25 120,23" fill="#ffffff" filter="drop-shadow(0 0 6px #fff)" />

      <rect x="50" y="54" width="60" height="56" rx="7" fill="url(#goldBoxGrad)" stroke="#78350f" strokeWidth="1.2" />
      <ellipse cx="80" cy="54" rx="30" ry="8" fill="#451a03" />
      <rect x="74" y="54" width="12" height="56" fill="url(#blueRibbon)" />

      <g transform="translate(80, 42) rotate(-16) translate(-80, -42)">
        <rect x="44" y="32" width="72" height="15" rx="4" fill="url(#goldBoxGrad)" stroke="#78350f" strokeWidth="1.2" />
        <rect x="74" y="32" width="12" height="15" fill="url(#blueRibbon)" />
        <circle cx="80" cy="28" r="5.5" fill="url(#blueRibbon)" />
        <ellipse cx="72" cy="26" rx="9" ry="5.5" fill="url(#blueRibbon)" transform="rotate(-32 72 26)" />
        <ellipse cx="88" cy="26" rx="9" ry="5.5" fill="url(#blueRibbon)" transform="rotate(32 88 26)" />
      </g>
    </svg>
  </div>
);

// 2. 3D Neon Rocket Launching with Exhaust Flames (Aviator 100x Multiplier Banner)
const RocketPromoArt = () => (
  <div style={{ position: 'relative', width: '135px', height: '115px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg viewBox="0 0 160 140" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))' }}>
      <defs>
        <radialGradient id="rocketGlowBurst" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#e11d48" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#881337" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rocketBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#f8fafc" />
          <stop offset="70%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="rocketRedNose" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="40%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#9f1239" />
        </linearGradient>
        <linearGradient id="flameInner" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#fde047" />
          <stop offset="70%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <radialGradient id="cockpitGlass" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0e7490" />
        </radialGradient>
      </defs>

      {/* Radiant Aura */}
      <circle cx="80" cy="70" r="65" fill="url(#rocketGlowBurst)" opacity="0.6" />

      {/* Speed motion lines & smoke puffs */}
      <g opacity="0.75">
        <line x1="20" y1="95" x2="45" y2="108" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4" />
        <line x1="30" y1="120" x2="60" y2="128" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
        <line x1="110" y1="20" x2="140" y2="12" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="48" cy="118" r="9" fill="#f43f5e" opacity="0.4" />
        <circle cx="34" cy="108" r="6" fill="#fb923c" opacity="0.5" />
      </g>

      {/* Rocket Group rotated at -35 degrees */}
      <g transform="translate(82, 66) rotate(-35) translate(-82, -66)">
        {/* Exhaust Flame */}
        <polygon points="76,88 84,88 88,118 80,132 72,118" fill="url(#flameInner)" filter="drop-shadow(0 0 10px #f97316)" />
        <polygon points="78,88 82,88 84,106 80,118 76,106" fill="#ffffff" />

        {/* Fins / Wings */}
        <path d="M62 82 L74 62 L74 88 Z" fill="url(#rocketRedNose)" />
        <path d="M98 82 L86 62 L86 88 Z" fill="url(#rocketRedNose)" />

        {/* Main Body */}
        <path d="M80 20 C68 40 68 84 80 88 C92 84 92 40 80 20 Z" fill="url(#rocketBodyGrad)" stroke="#475569" strokeWidth="1" />

        {/* Nose Cone */}
        <path d="M80 20 C73 34 71 42 71 46 L89 46 C89 42 87 34 80 20 Z" fill="url(#rocketRedNose)" />

        {/* Cockpit Window */}
        <circle cx="80" cy="56" r="7.5" fill="url(#cockpitGlass)" stroke="#e2e8f0" strokeWidth="1.5" />
        <ellipse cx="78" cy="54" rx="2.5" ry="1.5" fill="#ffffff" opacity="0.8" />

        {/* Booster Nozzle */}
        <rect x="74" y="86" width="12" height="4" rx="1.5" fill="#334155" />
      </g>

      {/* Sparkles */}
      <polygon points="128,24 130,29 135,31 130,33 128,38 126,33 121,31 126,29" fill="#ffffff" filter="drop-shadow(0 0 6px #fff)" />
      <polygon points="32,42 34,46 38,48 34,50 32,54 30,50 26,48 30,46" fill="#fde047" filter="drop-shadow(0 0 6px #fde047)" />
    </svg>
  </div>
);

// 3. 3D Golden VIP Imperial Crown with Emerald & Diamonds (VIP Promo Banner)
const VIPCrownPromoArt = () => (
  <div style={{ position: 'relative', width: '135px', height: '115px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg viewBox="0 0 160 140" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))' }}>
      <defs>
        <radialGradient id="emeraldGlowBurst" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#059669" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vipCrownGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="25%" stopColor="#fde047" />
          <stop offset="60%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
        <radialGradient id="emeraldGem" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="40%" stopColor="#10b981" />
          <stop offset="80%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064e3b" />
        </radialGradient>
        <radialGradient id="rubyGem" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="40%" stopColor="#f43f5e" />
          <stop offset="80%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#881337" />
        </radialGradient>
        <radialGradient id="vipCoinShine" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#fef08a" />
          <stop offset="75%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </radialGradient>
      </defs>

      <circle cx="80" cy="70" r="65" fill="url(#emeraldGlowBurst)" opacity="0.6" />

      {/* Floating Gold Coins */}
      <g filter="drop-shadow(0 3px 6px rgba(0,0,0,0.4))">
        <ellipse cx="28" cy="40" rx="11" ry="7" fill="url(#vipCoinShine)" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(-22 28 40)" />
        <ellipse cx="132" cy="38" rx="12" ry="8" fill="url(#vipCoinShine)" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(25 132 38)" />
        <ellipse cx="24" cy="94" rx="10" ry="6" fill="url(#vipCoinShine)" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(15 24 94)" />
        <ellipse cx="136" cy="96" rx="11" ry="7" fill="url(#vipCoinShine)" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(-15 136 96)" />
      </g>

      {/* Crown Base & Spikes */}
      <g filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))">
        <path
          d="M40 88 L46 44 L64 66 L80 32 L96 66 L114 44 L120 88 Z"
          fill="url(#vipCrownGold)"
          stroke="#78350f"
          strokeWidth="1.2"
        />

        {/* Crown Rim Band */}
        <rect x="38" y="86" width="84" height="16" rx="5" fill="url(#vipCrownGold)" stroke="#78350f" strokeWidth="1.2" />

        {/* Jewels on Peaks */}
        <circle cx="46" cy="42" r="5" fill="url(#rubyGem)" stroke="#fff" strokeWidth="0.8" />
        <circle cx="80" cy="30" r="7" fill="url(#emeraldGem)" stroke="#fff" strokeWidth="1" filter="drop-shadow(0 0 6px #10b981)" />
        <circle cx="114" cy="42" r="5" fill="url(#rubyGem)" stroke="#fff" strokeWidth="0.8" />

        {/* Rim Gemstones */}
        <circle cx="56" cy="94" r="3.5" fill="url(#rubyGem)" />
        <circle cx="80" cy="94" r="5" fill="url(#emeraldGem)" stroke="#fff" strokeWidth="0.6" />
        <circle cx="104" cy="94" r="3.5" fill="url(#rubyGem)" />
      </g>

      {/* Sparkles */}
      <polygon points="80,12 82,18 88,20 82,22 80,28 78,22 72,20 78,18" fill="#ffffff" filter="drop-shadow(0 0 6px #fff)" />
      <polygon points="126,20 128,24 132,26 128,28 126,32 124,28 120,26 124,24" fill="#ffffff" filter="drop-shadow(0 0 6px #fff)" />
      <polygon points="34,22 36,26 40,28 36,30 34,34 32,30 28,28 32,26" fill="#fde047" filter="drop-shadow(0 0 6px #fde047)" />
    </svg>
  </div>
);

// 4. 3D Golden Trophy with Rupee & Friendship Stars (Refer & Earn Promo Banner)
const ReferralPromoArt = () => (
  <div style={{ position: 'relative', width: '135px', height: '115px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg viewBox="0 0 160 140" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))' }}>
      <defs>
        <radialGradient id="blueGlowBurst" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#2563eb" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="trophyGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="25%" stopColor="#fde047" />
          <stop offset="60%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
        <linearGradient id="trophyBase" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <radialGradient id="refCoinShine" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#fef08a" />
          <stop offset="75%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </radialGradient>
      </defs>

      <circle cx="80" cy="70" r="65" fill="url(#blueGlowBurst)" opacity="0.6" />

      {/* Floating Coins */}
      <g filter="drop-shadow(0 3px 6px rgba(0,0,0,0.4))">
        <ellipse cx="26" cy="34" rx="12" ry="8" fill="url(#refCoinShine)" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(-20 26 34)" />
        <ellipse cx="134" cy="36" rx="12" ry="8" fill="url(#refCoinShine)" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(22 134 36)" />
        <ellipse cx="30" cy="98" rx="10" ry="6" fill="url(#refCoinShine)" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(12 30 98)" />
        <ellipse cx="130" cy="96" rx="11" ry="7" fill="url(#refCoinShine)" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(-15 130 96)" />
      </g>

      {/* Trophy Handles */}
      <path d="M54 44 C34 44 34 68 56 72" fill="none" stroke="url(#trophyGold)" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M106 44 C126 44 126 68 104 72" fill="none" stroke="url(#trophyGold)" strokeWidth="5.5" strokeLinecap="round" />

      {/* Main Trophy Cup */}
      <g filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))">
        <path d="M52 30 L108 30 C108 30 106 72 80 78 C54 72 52 30 52 30 Z" fill="url(#trophyGold)" stroke="#78350f" strokeWidth="1.2" />
        <ellipse cx="80" cy="30" rx="28" ry="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
        
        {/* Star Badge on Trophy */}
        <circle cx="80" cy="52" r="10" fill="#ffffff" opacity="0.25" />
        <polygon points="80,44 82.5,49 88,50 84,54 85,60 80,57 75,60 76,54 72,50 77.5,49" fill="#1e3a8a" />

        {/* Stem & Base */}
        <path d="M74 76 L86 76 L84 94 L76 94 Z" fill="url(#trophyGold)" stroke="#78350f" strokeWidth="1" />
        <rect x="62" y="94" width="36" height="14" rx="4" fill="url(#trophyBase)" stroke="#475569" strokeWidth="1.2" />
        <rect x="66" y="97" width="28" height="3" rx="1" fill="#fde047" />
      </g>

      {/* Sparkles */}
      <polygon points="120,18 122,23 127,25 122,27 120,32 118,27 113,25 118,23" fill="#ffffff" filter="drop-shadow(0 0 6px #fff)" />
      <polygon points="40,20 42,24 46,26 42,28 40,32 38,28 34,26 38,24" fill="#ffffff" filter="drop-shadow(0 0 6px #fff)" />
    </svg>
  </div>
);

// Category Icons
const CatFlameIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="catFlameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="45%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#fde047" />
      </linearGradient>
    </defs>
    <path
      d="M12 2C10.6 4.6 11 6.8 9.5 8.5C8 10.2 6.2 11 6.2 14C6.2 17.3 8.8 20 12 20C15.2 20 17.8 17.3 17.8 14C17.8 9 14.5 7 14.5 7C14.5 7 14 9.5 12.5 10.5C11.5 11.2 10.5 10.5 11 9C11.6 7 13.5 5 12 2Z"
      fill="url(#catFlameGrad)"
      filter="drop-shadow(0 0 6px rgba(249, 115, 22, 0.75))"
    />
  </svg>
);

const CatCasinoIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#c084fc" : "#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L4 5.5V11.5C4 16.8 7.5 21.8 12 23C16.5 21.8 20 16.8 20 11.5V5.5L12 2Z" />
    <circle cx="12" cy="12" r="3.5" />
    <circle cx="12" cy="12" r="1" fill={active ? "#c084fc" : "#94a3b8"} />
  </svg>
);

const CatPopularIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#fde047" : "none"} stroke={active ? "#fde047" : "#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const CatLiveIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#c084fc" : "#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="4" />
    <circle cx="12" cy="10" r="3" />
    <path d="M7 17C7 14.8 9.2 13 12 13C14.8 13 17 14.8 17 17" />
  </svg>
);

const CatCardIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#c084fc" : "#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="5.5" width="11" height="15" rx="2" transform="rotate(-8 3.5 5.5)" />
    <rect x="9.5" y="4.5" width="11" height="15" rx="2" transform="rotate(8 9.5 4.5)" />
  </svg>
);

const CatSlotsIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#c084fc" : "#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="6" width="16" height="14" rx="2.5" />
    <line x1="9.3" y1="6" x2="9.3" y2="20" />
    <line x1="14.7" y1="6" x2="14.7" y2="20" />
    <line x1="4" y1="13" x2="20" y2="13" />
    <path d="M10 2H14V6H10V2Z" />
    <circle cx="21" cy="9" r="1.5" fill={active ? "#c084fc" : "#94a3b8"} />
  </svg>
);

/* =========================================================================
   WINNERS DATA POOL
   ========================================================================= */
const INDIAN_WINNERS_POOL = [
  { name: 'Vikram_Rathore', game: 'Aviator', mult: '6.40x', amount: 2450 },
  { name: 'Aarav_Sharma', game: 'Color Prediction', mult: '4.50x', amount: 1800 },
  { name: 'Pooja_Patel', game: 'Classic Dice', mult: '9.80x', amount: 4900 },
  { name: 'Rohit_Verma', game: 'Aviator', mult: '14.20x', amount: 7100 },
  { name: 'Sneha_Kulkarni', game: 'Color Prediction', mult: '9.00x', amount: 9000 },
  { name: 'Amit_Singh', game: 'Classic Dice', mult: '2.50x', amount: 1250 },
  { name: 'Ananya_Mehta', game: 'Aviator', mult: '3.75x', amount: 3750 },
  { name: 'Deepak_Yadav', game: 'Color Prediction', mult: '2.00x', amount: 800 },
  { name: 'Neha_Gupta', game: 'Classic Dice', mult: '19.60x', amount: 9800 },
  { name: 'Karan_Malhotra', game: 'Aviator', mult: '8.50x', amount: 4250 },
];

/* =========================================================================
   MAIN LOBBY COMPONENT
   ========================================================================= */

export const Lobby = ({
  setCurrentView,
  onOpenDailyRewards,
  onOpenRefer,
  onOpenVIP,
  searchQuery = '',
  onSelectComingSoonGame,
}) => {
  const navigate = useNavigate();
  const { user, setIsDepositModalOpen } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  const [isTickerFading, setIsTickerFading] = useState(false);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // 4 Themed Promo Carousel Sliders
  const promoSlides = useMemo(
    () => [
      {
        id: 'welcome',
        badge: 'WELCOME BONUS',
        titleMain: 'Get ₹500',
        titleHighlight: 'FREE',
        subtitle: 'Play Live Games & Win Real Cash!',
        art: <GiftBoxPromoArt />,
        bgGradient: 'linear-gradient(135deg, #4a044e 0%, #3b0764 45%, #1e1b4b 100%)',
        border: '1.5px solid rgba(217, 70, 239, 0.45)',
        boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.7), 0 0 30px rgba(192, 38, 211, 0.25)',
        btnBg: 'linear-gradient(135deg, rgba(217, 70, 239, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
        btnBorder: '1.5px solid rgba(217, 70, 239, 0.6)',
        btnShadow: '0 0 14px rgba(217, 70, 239, 0.6)',
        action: () => {
          sound.playClick();
          setIsDepositModalOpen(true);
        },
      },
      {
        id: 'aviator',
        badge: 'MEGA MULTIPLIER',
        titleMain: 'Win 100x',
        titleHighlight: 'CASH',
        subtitle: 'Fly High in Realtime Crash & Cash Out!',
        art: <RocketPromoArt />,
        bgGradient: 'linear-gradient(135deg, #881337 0%, #4c0519 45%, #1e1b4b 100%)',
        border: '1.5px solid rgba(244, 63, 94, 0.45)',
        boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.7), 0 0 30px rgba(244, 63, 94, 0.25)',
        btnBg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.3) 0%, rgba(225, 29, 72, 0.3) 100%)',
        btnBorder: '1.5px solid rgba(244, 63, 94, 0.6)',
        btnShadow: '0 0 14px rgba(244, 63, 94, 0.6)',
        action: () => {
          sound.playClick();
          navigate('/aviator');
        },
      },
      {
        id: 'vip',
        badge: 'VIP CLUB PASS',
        titleMain: '100% MATCH',
        titleHighlight: 'BONUS',
        subtitle: 'Instant Deposit Match & VIP Level Perks!',
        art: <VIPCrownPromoArt />,
        bgGradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 45%, #022c22 100%)',
        border: '1.5px solid rgba(52, 211, 153, 0.45)',
        boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.25)',
        btnBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)',
        btnBorder: '1.5px solid rgba(52, 211, 153, 0.6)',
        btnShadow: '0 0 14px rgba(16, 185, 129, 0.6)',
        action: () => {
          sound.playClick();
          if (onOpenVIP) onOpenVIP();
          else navigate('/vip');
        },
      },
      {
        id: 'refer',
        badge: 'REFER & EARN',
        titleMain: 'Earn ₹200',
        titleHighlight: 'PER FRIEND',
        subtitle: 'Instant Bonus for Every Active Invite!',
        art: <ReferralPromoArt />,
        bgGradient: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 45%, #0f172a 100%)',
        border: '1.5px solid rgba(96, 165, 250, 0.45)',
        boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.7), 0 0 30px rgba(59, 130, 246, 0.25)',
        btnBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.3) 100%)',
        btnBorder: '1.5px solid rgba(96, 165, 250, 0.6)',
        btnShadow: '0 0 14px rgba(59, 130, 246, 0.6)',
        action: () => {
          sound.playClick();
          if (onOpenRefer) onOpenRefer();
          else navigate('/refer');
        },
      },
    ],
    [navigate, onOpenVIP, onOpenRefer, setIsDepositModalOpen]
  );

  // Auto-slide carousel timer (every 4.5 seconds when not paused or dragging)
  useEffect(() => {
    if (isPaused || isDragging) return;
    const promoTimer = setInterval(() => {
      setActivePromoIndex((prev) => (prev + 1) % promoSlides.length);
    }, 4500);

    return () => clearInterval(promoTimer);
  }, [promoSlides.length, isPaused, isDragging]);

  const handleNextPromo = (e) => {
    if (e) e.stopPropagation();
    sound.playClick();
    setActivePromoIndex((prev) => (prev + 1) % promoSlides.length);
  };

  const handlePrevPromo = (e) => {
    if (e) e.stopPropagation();
    sound.playClick();
    setActivePromoIndex((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 40) {
      handlePrevPromo();
    } else if (deltaX < -40) {
      handleNextPromo();
    }
    setTouchStartX(null);
  };

  // Live ticker updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTickerFading(true);
      setTimeout(() => {
        setCurrentWinnerIndex((prev) => (prev + 1) % INDIAN_WINNERS_POOL.length);
        setIsTickerFading(false);
      }, 350);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const categories = [
    { id: 'all', label: 'All', renderIcon: (active) => <CatFlameIcon active={active} /> },
    { id: 'popular', label: 'Popular', renderIcon: (active) => <CatPopularIcon active={active} /> },
    { id: 'live', label: 'Live', renderIcon: (active) => <CatLiveIcon active={active} /> },
    { id: 'casino', label: 'Casino', renderIcon: (active) => <CatCasinoIcon active={active} /> },
    { id: 'card', label: 'Card', renderIcon: (active) => <CatCardIcon active={active} /> },
    { id: 'slots', label: 'Slots', renderIcon: (active) => <CatSlotsIcon active={active} /> },
  ];

  // 1. MASTER 3 ACTIVE PLAYABLE GAMES
  const activePlayableGames = [
    {
      id: 'colour',
      slug: 'colour',
      route: '/colorprediction',
      name: 'Colour Prediction',
      subtitle: 'WinGo 30s Realtime',
      tag: '🔴🟢🟣 30s LIVE',
      tagBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      tagShadow: '0 0 10px rgba(16, 185, 129, 0.8)',
      payout: '2x - 9x Payout',
      badge: '100% Provably Fair',
      image: '/images/game_color_prediction.jpg',
      borderColor: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.25)',
      categories: ['all', 'popular', 'live', 'casino'],
      isLive: true,
      description: 'Predict colors & numbers in live 30-second rounds with instant wallet payouts.',
    },
    {
      id: 'crash',
      slug: 'crash',
      route: '/aviator',
      name: 'Aviator Rocket',
      subtitle: 'Crash Multiplier',
      tag: '🚀 LIVE FLIGHT',
      tagBg: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
      tagShadow: '0 0 10px rgba(244, 63, 94, 0.8)',
      payout: '1.01x - 100x+',
      badge: 'Auto Cashout',
      image: '/images/game_aviator_neon.jpg',
      borderColor: '#f43f5e',
      bgGlow: 'rgba(244, 63, 94, 0.25)',
      categories: ['all', 'popular', 'live', 'casino'],
      isLive: true,
      description: 'Watch the rocket soar upwards and cash out before the crash for huge multipliers.',
    },
    {
      id: 'dice',
      slug: 'dice',
      route: '/dice',
      name: 'Classic Dice',
      subtitle: 'Over / Under Slider',
      tag: '🎲 INSTANT ROLL',
      tagBg: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
      tagShadow: '0 0 10px rgba(168, 85, 247, 0.8)',
      payout: 'Up to 990x',
      badge: '99% RTP',
      image: '/images/game_mines.jpg',
      borderColor: '#38bdf8',
      bgGlow: 'rgba(56, 189, 248, 0.25)',
      categories: ['all', 'popular', 'casino'],
      isLive: true,
      description: 'Provably fair instant dice roll with customizable win chances & payouts up to 990x.',
    },
  ];

  // 2. COMING SOON / ADDITIONAL GAMES
  const additionalGames = [
    {
      id: 'casino-live',
      name: 'Casino Live',
      displayName: 'Live Roulette',
      categoryTitle: 'Live Casino',
      rtp: '98.8%',
      isLive: true,
      action: () => onSelectComingSoonGame && onSelectComingSoonGame({ title: 'Casino Live', category: 'Live Casino', rtp: '98.8%' }),
      image: '/images/game_casino_live.jpg',
      borderColor: 'rgba(217, 70, 239, 0.45)',
      categories: ['all', 'popular', 'live', 'casino'],
    },
    {
      id: 'dragon-tiger',
      name: 'Dragon vs Tiger',
      displayName: 'Dragon vs Tiger',
      categoryTitle: 'Card Games',
      rtp: '97.2%',
      action: () => onSelectComingSoonGame && onSelectComingSoonGame({ title: 'Dragon vs Tiger', category: 'Card Games', rtp: '97.2%' }),
      image: '/images/game_dragon_tiger.jpg',
      borderColor: 'rgba(56, 189, 248, 0.45)',
      categories: ['all', 'popular', 'card'],
    },
    {
      id: 'teen-patti',
      name: 'Teen Patti',
      displayName: 'Teen Patti 3 Card',
      categoryTitle: 'Card Games',
      rtp: '96.5%',
      action: () => onSelectComingSoonGame && onSelectComingSoonGame({ title: 'Teen Patti', category: 'Card Games', rtp: '96.5%' }),
      image: '/images/game_teen_patti.jpg',
      borderColor: 'rgba(168, 85, 247, 0.55)',
      categories: ['all', 'popular', 'card'],
    },
    {
      id: 'slots',
      name: 'Golden 777 Slots',
      displayName: 'Slots',
      categoryTitle: 'Slots',
      rtp: '96.8%',
      action: () => onSelectComingSoonGame && onSelectComingSoonGame({ title: 'Golden 777 Slots', category: 'Slots', rtp: '96.8%' }),
      image: '/images/game_slots.jpg',
      borderColor: 'rgba(255, 214, 0, 0.55)',
      categories: ['all', 'popular', 'slots', 'casino'],
    },
    {
      id: 'andar-bahar',
      name: 'Andar Bahar',
      displayName: 'Andar Bahar',
      categoryTitle: 'Card Games',
      rtp: '97.5%',
      action: () => onSelectComingSoonGame && onSelectComingSoonGame({ title: 'Andar Bahar', category: 'Card Games', rtp: '97.5%' }),
      image: '/images/game_andar_bahar.jpg',
      borderColor: 'rgba(244, 63, 94, 0.45)',
      categories: ['all', 'card'],
    },
    {
      id: 'rummy',
      name: 'Indian Rummy',
      displayName: 'Rummy',
      categoryTitle: 'Card Games',
      rtp: '98.1%',
      action: () => onSelectComingSoonGame && onSelectComingSoonGame({ title: 'Indian Rummy', category: 'Card Games', rtp: '98.1%' }),
      image: '/images/game_rummy.jpg',
      borderColor: 'rgba(16, 185, 129, 0.45)',
      categories: ['all', 'card'],
    },
  ];

  // Filtered games based on Category & Search
  const filteredActiveGames = useMemo(() => {
    return activePlayableGames.filter((game) => {
      const matchesCategory = selectedCategory === 'all' || game.categories.includes(selectedCategory);
      const matchesSearch =
        !searchQuery ||
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.slug.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const filteredAdditionalGames = useMemo(() => {
    return additionalGames.filter((game) => {
      const matchesCategory = selectedCategory === 'all' || game.categories.includes(selectedCategory);
      const matchesSearch =
        !searchQuery ||
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (game.displayName && game.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleLaunchGame = (route) => {
    sound.playClick();
    navigate(route);
  };

  return (
    <div
      style={{
        maxWidth: '560px',
        margin: '0 auto',
        padding: '10px 12px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. HERO PROMO BANNER CAROUSEL SLIDER (LEFT TO RIGHT ONLY SLIDE EFFECT) */}
      <div
        className="promo-slider-container"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="promo-slider-viewport">
          <div
            key={activePromoIndex}
            className="promo-slide-ltr-enter"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="promo-bonus-banner"
              onClick={promoSlides[activePromoIndex].action}
              style={{
                cursor: 'pointer',
                background: promoSlides[activePromoIndex].bgGradient,
                border: promoSlides[activePromoIndex].border,
                boxShadow: promoSlides[activePromoIndex].boxShadow,
              }}
            >
              {promoSlides[activePromoIndex].art}
              <div style={{ flex: 1, minWidth: 0, zIndex: 2 }}>
                <div className="promo-bonus-badge">{promoSlides[activePromoIndex].badge}</div>
                <div className="promo-bonus-title">
                  {promoSlides[activePromoIndex].titleMain} <span style={{ color: '#ffe066' }}>{promoSlides[activePromoIndex].titleHighlight}</span>
                </div>
                <div className="promo-bonus-subtitle">{promoSlides[activePromoIndex].subtitle}</div>
              </div>
              <button
                type="button"
                className="promo-nav-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPromo();
                }}
                style={{
                  background: promoSlides[activePromoIndex].btnBg,
                  border: promoSlides[activePromoIndex].btnBorder,
                  boxShadow: promoSlides[activePromoIndex].btnShadow,
                }}
                aria-label={`Next from slide ${activePromoIndex + 1}`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Pagination Indicator Dots */}
        <div className="promo-carousel-dots">
          {promoSlides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                setActivePromoIndex(idx);
              }}
              className={`promo-dot ${activePromoIndex === idx ? 'active' : ''}`}
              aria-label={`Go to slide ${idx + 1}: ${slide.badge}`}
            />
          ))}
        </div>
      </div>

      {/* 2. CATEGORY FILTER TABS */}
      <div className="category-filter-row">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                sound.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`category-card-btn ${isActive ? 'active' : ''}`}
            >
              <div className="category-card-icon">{cat.renderIcon(isActive)}</div>
              <span className="category-card-label">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. FEATURED LIVE REALTIME GAMES (THE 3 ACTIVE GAMES) */}
      <div id="featured-games-section" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="section-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 12px #10b981',
                display: 'inline-block',
                animation: 'pulse 1.5s infinite',
              }}
            />
            <span className="section-title-text" style={{ fontSize: '17px', fontWeight: 900, color: '#f8fafc' }}>
              Live Multiplayer Games
            </span>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '3px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            3 ACTIVE NOW
          </span>
        </div>

        {/* 3 HERO ACTIVE GAME CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredActiveGames.map((game) => (
            <div
              key={game.id}
              onClick={() => handleLaunchGame(game.route)}
              style={{
                position: 'relative',
                borderRadius: '18px',
                background: 'rgba(19, 15, 42, 0.85)',
                border: `1.5px solid ${game.borderColor}`,
                boxShadow: `0 10px 28px rgba(0,0,0,0.6), 0 0 20px ${game.bgGlow}`,
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'stretch',
                minHeight: '110px',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 14px 34px rgba(0,0,0,0.7), 0 0 28px ${game.bgGlow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 10px 28px rgba(0,0,0,0.6), 0 0 20px ${game.bgGlow}`;
              }}
            >
              {/* Game Thumbnail Image (Left) */}
              <div
                style={{
                  width: '125px',
                  minWidth: '125px',
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#090616',
                }}
              >
                <img
                  src={game.image}
                  alt={game.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.3s ease',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to right, transparent 60%, rgba(19, 15, 42, 0.95) 100%)',
                  }}
                />
              </div>

              {/* Game Details & CTA (Right) */}
              <div
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minWidth: 0,
                  zIndex: 2,
                }}
              >
                <div>
                  {/* Status Tag */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: game.tagBg,
                        color: '#ffffff',
                        fontSize: '9px',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        letterSpacing: '0.4px',
                        boxShadow: game.tagShadow,
                      }}
                    >
                      {game.tag}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#facc15' }}>
                      {game.payout}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3
                    style={{
                      margin: '0',
                      fontSize: '16px',
                      fontWeight: 900,
                      color: '#ffffff',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    {game.name}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {game.description}
                  </div>
                </div>

                {/* Bottom Row: Provably Fair Badge + PLAY NOW button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1', fontSize: '10px', fontWeight: 700 }}>
                    <Shield size={12} color="#34d399" />
                    <span>{game.badge}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLaunchGame(game.route);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #ffe066 0%, #ffb800 60%, #d97706 100%)',
                      color: '#1c1106',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '6px 14px',
                      fontSize: '11px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 0 14px rgba(255, 224, 102, 0.6)',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <Play size={12} fill="#1c1106" /> PLAY NOW
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. ALL GAMES & POPULAR GRID (3x2 Grid) */}
      <div id="popular-games-section" style={{ marginTop: '6px' }}>
        <div className="section-header-row">
          <span className="section-title-text">All Casino & Card Games</span>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
            {filteredActiveGames.length + filteredAdditionalGames.length} Games Available
          </span>
        </div>

        {/* Combined Games Grid */}
        <div className="popular-games-grid">
          {/* Active Playable Games in Grid */}
          {filteredActiveGames.map((game) => (
            <div
              key={`grid-${game.id}`}
              onClick={() => handleLaunchGame(game.route)}
              className="lucky-card-item"
              style={{
                borderColor: game.borderColor,
                boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 16px ${game.borderColor}60`,
                cursor: 'pointer',
              }}
            >
              <img
                src={game.image}
                alt={game.name}
                className="lucky-card-img"
                loading="eager"
              />
              <div
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  background: game.tagBg,
                  color: '#fff',
                  fontSize: '8px',
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  boxShadow: '0 0 8px rgba(0,0,0,0.8)',
                  zIndex: 3,
                }}
              >
                LIVE
              </div>
              <div className="lucky-card-label-overlay">
                <span className="lucky-card-name-text">{game.name}</span>
              </div>
            </div>
          ))}

          {/* Additional / Coming Soon Games */}
          {filteredAdditionalGames.map((game) => (
            <div
              key={game.id}
              onClick={game.action}
              className="lucky-card-item"
              style={{
                borderColor: game.borderColor,
                boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 16px ${game.borderColor}40`,
                cursor: 'pointer',
              }}
            >
              <img
                src={game.image}
                alt={game.name}
                className="lucky-card-img"
                loading="eager"
              />
              <div className="lucky-card-label-overlay">
                {game.isLive ? (
                  <>
                    <span className="lucky-card-name-text">Casino</span>
                    <span className="live-pill-tag">LIVE</span>
                  </>
                ) : (
                  <span className="lucky-card-name-text">{game.displayName || game.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. LIVE WINNERS TICKER BAR */}
      <div
        style={{
          marginTop: '6px',
          padding: '8px 12px',
          background: 'rgba(19, 15, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#cbd5e1',
          boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', flexShrink: 0 }} />
          <span style={{ fontWeight: 800, color: '#ffe066', flexShrink: 0 }}>Recent Win:</span>
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              opacity: isTickerFading ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            <strong style={{ color: '#fff' }}>{INDIAN_WINNERS_POOL[currentWinnerIndex].name}</strong> won{' '}
            <strong style={{ color: '#10b981' }}>+₹{INDIAN_WINNERS_POOL[currentWinnerIndex].amount}</strong> on{' '}
            {INDIAN_WINNERS_POOL[currentWinnerIndex].game}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
