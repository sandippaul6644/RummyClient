import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { socket } from "../../services/socket.js";
import { api } from "../../services/api.js";
import { sound } from "../../utils/sound.js";
import {
  ShieldCheck,
  Clock,
  Zap,
  Lock,
  AlertTriangle,
  Minus,
  Plus,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  CheckCircle2,
  HelpCircle,
  Copy,
} from "lucide-react";

// ── Dynamic Colour Definitions ────────────────────────────────────────────────
export const DEFAULT_COLOR_OPTIONS = [
  {
    id: "GREEN",
    label: "GREEN",
    solid: "#38db0f",
    glow: "16,185,129",
    grad: "linear-gradient(135deg, #00f59b 0%, #059669 60%, #047857 100%)",
    emoji: "🟢",
    mult: "2.0×",
    payout: 2.0,
    tag: "Double Win",
    desc: "Double Payout",
  },
  {
    id: "VIOLET",
    label: "VIOLET",
    solid: "#a855f7",
    glow: "168,85,247",
    grad: "linear-gradient(135deg, #ff4ef9 0%, #a855f7 55%, #7c3aed 100%)",
    emoji: "🟣",
    mult: "4.5×",
    payout: 4.5,
    tag: "Jackpot 4.5×",
    desc: "Super Multiplier",
  },
  {
    id: "RED",
    label: "RED",
    solid: "#ef4444",
    glow: "239,68,68",
    grad: "linear-gradient(135deg, #ff4b63 0%, #ef4444 55%, #b91c1c 100%)",
    emoji: "🔴",
    mult: "2.0×",
    payout: 2.0,
    tag: "Double Win",
    desc: "Double Payout",
  },
];

// Helper map for quick ID lookup
export const COLOR_MAP = DEFAULT_COLOR_OPTIONS.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {});

export const resultGrad = (colors = [], customColorMap = null) => {
  const map = customColorMap || COLOR_MAP;
  const c = colors.map((x) => String(x).toUpperCase());
  if (c.includes("RED") && c.includes("VIOLET")) {
    const rCol = map.RED?.solid || "#ff4b63";
    const vCol = map.VIOLET?.solid || "#a855f7";
    return `linear-gradient(135deg, ${rCol} 50%, ${vCol} 50%)`;
  }
  if (c.includes("GREEN") && c.includes("VIOLET")) {
    const gCol = map.GREEN?.solid || "#00f59b";
    const vCol = map.VIOLET?.solid || "#a855f7";
    return `linear-gradient(135deg, ${gCol} 50%, ${vCol} 50%)`;
  }
  if (c.includes("GREEN")) return map.GREEN?.grad || `linear-gradient(135deg, ${map.GREEN?.solid || "#10b981"} 0%, #047857 100%)`;
  if (c.includes("RED")) return map.RED?.grad || `linear-gradient(135deg, ${map.RED?.solid || "#ef4444"} 0%, #b91c1c 100%)`;
  if (c.includes("VIOLET")) return map.VIOLET?.grad || `linear-gradient(135deg, ${map.VIOLET?.solid || "#a855f7"} 0%, #7c3aed 100%)`;
  return "linear-gradient(135deg, #10b981 0%, #a855f7 100%)";
};

const CHIPS = [
  {
    v: "10",
    label: "₹10",
    bg: "linear-gradient(145deg, #1e3a8a, #0f172a)",
    ring: "#3b82f6",
    text: "#93c5fd",
  },
  {
    v: "50",
    label: "₹50",
    bg: "linear-gradient(145deg, #065f46, #022c22)",
    ring: "#10b981",
    text: "#6ee7b7",
  },
  {
    v: "100",
    label: "₹100",
    bg: "linear-gradient(145deg, #581c87, #2e1065)",
    ring: "#a855f7",
    text: "#d8b4fe",
  },
  {
    v: "500",
    label: "₹500",
    bg: "linear-gradient(145deg, #881337, #4c0519)",
    ring: "#f43f5e",
    text: "#fda4af",
  },
  {
    v: "1000",
    label: "₹1K",
    bg: "linear-gradient(145deg, #78350f, #451a03)",
    ring: "#f59e0b",
    text: "#fde68a",
  },
  {
    v: "5000",
    label: "₹5K",
    bg: "linear-gradient(145deg, #164e63, #083344)",
    ring: "#06b6d4",
    text: "#67e8f9",
  },
];

export const ColourGame = ({ colors: propColors, onColorsChange } = {}) => {
  const {
    user,
    wallet,
    refreshWallet,
    setIsAuthModalOpen,
    setIsDepositModalOpen,
  } = useAuth();

  const [gameConfig, setGameConfig] = useState(null);
  const [payoutConfig, setPayoutConfig] = useState(null);
  const [serverColorOptions, setServerColorOptions] = useState(null);

  // Dynamic colors list — merges live server payout multipliers with configured palette
  const rawColors =
    propColors && propColors.length > 0
      ? propColors
      : (serverColorOptions || gameConfig?.colorOptions || DEFAULT_COLOR_OPTIONS);

  const colorOptions = useMemo(() => {
    return rawColors.map((c) => {
      const cfg = payoutConfig?.[c.id];
      const payoutVal =
        cfg?.payoutMultiplier != null
          ? Number(cfg.payoutMultiplier)
          : c.payout != null
          ? Number(c.payout)
          : 2.0;
      const mult = `${payoutVal.toFixed(1)}×`;
      return {
        ...c,
        payout: payoutVal,
        mult,
      };
    });
  }, [rawColors, payoutConfig]);

  const activeColorMap = useMemo(() => {
    return colorOptions.reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {});
  }, [colorOptions]);

  const maxMultiplier = useMemo(() => {
    const max = Math.max(...colorOptions.map((c) => Number(c.payout) || 2.0));
    return `${max.toFixed(1)}×`;
  }, [colorOptions]);

  // Notify parent pages (e.g. ColorPredictionPage header) of active dynamic colors
  useEffect(() => {
    if (colorOptions && colorOptions.length > 0) {
      onColorsChange?.(colorOptions);
    }
  }, [colorOptions, onColorsChange]);

  const [roundId, setRoundId] = useState(null);
  const [roundNumber, setRoundNumber] = useState(null);
  const [roundStatus, setRoundStatus] = useState("OPEN");
  const [betCloseTime, setBetCloseTime] = useState(null);
  const [serverSeedHash, setServerSeedHash] = useState("");
  const [remainingSec, setRemainingSec] = useState(30);
  const [isBettingOpen, setIsBettingOpen] = useState(true);

  const [lastResult, setLastResult] = useState(null);
  const [revealedSeed, setRevealedSeed] = useState(null);
  const [history, setHistory] = useState([]);
  const [myBets, setMyBets] = useState([]);
  const [liveBets, setLiveBets] = useState([]);

  const [selectedBet, setSelectedBet] = useState(null);
  const [betAmount, setBetAmount] = useState("10");
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertError, setAlertError] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  const [showVerify, setShowVerify] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);

  const countdownRef = useRef(null);

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadGame = useCallback(async () => {
    try {
      const [gr, hr] = await Promise.all([
        api.get("/games/colour"),
        api.get("/games/colour/history?limit=20"),
      ]);
      if (gr.data?.success) {
        setGameConfig(gr.data.data);
        if (gr.data.data.payoutConfig) {
          setPayoutConfig(gr.data.data.payoutConfig);
        }
        if (gr.data.data.colorOptions && Array.isArray(gr.data.data.colorOptions)) {
          setServerColorOptions(gr.data.data.colorOptions);
        }
        const r = gr.data.data.currentRound;
        if (r) {
          setRoundId(r.roundId);
          setRoundNumber(r.roundNumber);
          setRoundStatus(r.status);
          setServerSeedHash(r.serverSeedHash);
          setBetCloseTime(r.betCloseTime);
          setIsBettingOpen(r.status === "OPEN");
          setRemainingSec(r.remainingSec || 0);
        }
      }
      if (hr.data?.success) setHistory(hr.data.data || []);
    } catch {}
  }, []);

  const loadMyBets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get("/games/colour/my-bets?limit=30");
      if (res.data?.success) setMyBets(res.data.data?.bets || []);
    } catch {}
  }, [user]);

  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (!betCloseTime) return;
    const tick = () => {
      const rem = Math.max(
        0,
        Math.ceil((new Date(betCloseTime) - Date.now()) / 1000),
      );
      setRemainingSec(rem);
      setIsBettingOpen(rem > 0);

      // Audio countdown cue for final 5 seconds
      if (rem > 0 && rem <= 5) {
        sound.playBeep(rem <= 2);
      }
    };
    tick();
    countdownRef.current = setInterval(tick, 500);
    return () => clearInterval(countdownRef.current);
  }, [betCloseTime]);

  useEffect(() => {
    loadGame();
    socket.emit("game:join", { gameSlug: "colour" });

    socket.on("colour:round:open", (d) => {
      setRoundId(d.roundId);
      setRoundNumber(d.roundNumber);
      setRoundStatus("OPEN");
      setServerSeedHash(d.serverSeedHash);
      setBetCloseTime(d.betCloseTime);
      setIsBettingOpen(true);
      setLiveBets([]);
      setLastResult(null);
      setRevealedSeed(null);
      setShowVerify(false);
      sound.playClick();
    });

    socket.on("colour:round:created", (d) =>
      setServerSeedHash(d.serverSeedHash),
    );
    socket.on("colour:round:closed", () => {
      setIsBettingOpen(false);
      setRoundStatus("CLOSED");
      sound.playBeep(true);
    });

    socket.on("colour:round:result", (d) => {
      const res = d.result || d.resultData;
      setLastResult(res);
      setRoundStatus("RESULT_GENERATED");
      sound.playWin();

      if (res?.colors) {
        try {
          const confetti = window.__confetti;
          if (confetti) {
            confetti({
              particleCount: 75,
              spread: 85,
              origin: { y: 0.45 },
              colors: ["#00f59b", "#d946ef", "#ff4b63", "#fbbf24"],
            });
          }
        } catch {}
      }
    });

    socket.on("colour:round:settled", (d) => {
      setRoundStatus("SETTLED");
      setRevealedSeed(d.serverSeed || null);
      setHistory((prev) => [
        {
          roundId: d.roundId,
          roundNumber: d.roundNumber,
          result: d.result,
          serverSeedHash: d.serverSeedHash,
        },
        ...prev.slice(0, 19),
      ]);
      refreshWallet?.();
      loadMyBets();
    });

    socket.on("colour:bet:placed", (bet) =>
      setLiveBets((prev) => [bet, ...prev.slice(0, 19)]),
    );

    socket.on("colour:config:updated", (data) => {
      if (data?.colorOptions && Array.isArray(data.colorOptions)) {
        setServerColorOptions(data.colorOptions);
      }
      if (data?.payoutConfig) {
        setPayoutConfig(data.payoutConfig);
      }
    });

    return () => {
      socket.emit("game:leave", { gameSlug: "colour" });
      [
        "colour:round:open",
        "colour:round:created",
        "colour:round:tick",
        "colour:round:closed",
        "colour:round:result",
        "colour:round:settled",
        "colour:bet:placed",
        "colour:config:updated",
      ].forEach((ev) => socket.off(ev));
    };
  }, [loadGame, loadMyBets, refreshWallet]);

  useEffect(() => {
    if (user) loadMyBets();
  }, [user, loadMyBets]);

  // ── Bet Placement ─────────────────────────────────────────────────────────
  const handlePlaceBet = async () => {
    if (!user) {
      sound.playClick();
      setIsAuthModalOpen?.(true);
      return;
    }
    if (!selectedBet) {
      sound.playWarning();
      showAlert("Please select a colour first", true);
      return;
    }

    const num = Number(betAmount);
    if (isNaN(num) || num <= 0) {
      sound.playWarning();
      showAlert("Please enter a valid bet amount", true);
      return;
    }

    const currentBal = Number(wallet?.balance ?? user?.balance ?? 0);
    if (currentBal < num) {
      sound.playWarning();
      showAlert(
        `⚠️ Insufficient balance (₹${currentBal.toFixed(2)}). Please recharge to play.`,
        true,
      );
      setIsDepositModalOpen?.(true);
      return;
    }

    if (!isBettingOpen) {
      sound.playWarning();
      showAlert("Betting window is closed for this round", true);
      return;
    }

    sound.playClick();
    setSubmitting(true);
    try {
      const res = await api.post("/games/colour/bets", {
        prediction: selectedBet,
        amount: num,
        idempotencyKey: `${user._id || user.id}:${roundId}:${selectedBet}:${Date.now()}`,
      });
      if (res.data?.success) {
        sound.playCashout();
        showAlert(
          `Bet Confirmed: ₹${num.toFixed(0)} on ${selectedBet} ✓`,
          false,
        );
        setMyBets((prev) => [res.data.data, ...prev]);
        refreshWallet?.();
      }
    } catch (err) {
      sound.playWarning();
      const msg = err.response?.data?.message || "Failed to place bet";
      showAlert(msg, true);
      if (
        msg.toLowerCase().includes("balance") ||
        msg.toLowerCase().includes("insufficient")
      ) {
        setIsDepositModalOpen?.(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showAlert = (msg, isError) => {
    setAlertMsg(msg);
    setAlertError(isError);
    setTimeout(() => setAlertMsg(""), 3500);
  };

  const toggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
  };

  const countdown = remainingSec;
  const cdColor =
    countdown <= 5 ? "#ef4444" : countdown <= 10 ? "#f59e0b" : "#10b981";
  const timerPct = Math.min(100, (countdown / 25) * 100);

  // Selected prediction metadata (fully dynamic)
  const selColor = activeColorMap[selectedBet] || null;
  const selGrad =
    selColor?.grad || "linear-gradient(135deg, #10b981 0%, #059669 100%)";
  const selGlow = selColor?.glow || "16,185,129";
  const selMult = selColor?.mult || "2.0×";
  const selPayout = Number(selColor?.payout || 2.0);

  const userBal = Number(wallet?.balance ?? user?.balance ?? 0);
  const currentNum = Number(betAmount) || 10;
  const isInsufficient = Boolean(user && userBal < currentNum);

  return (
    <div className="colour-game-container">
      {/* ═══════════════════════════════════════════════════════════════
          1. TOP ROUND & CASINO DIGITAL COUNTDOWN HUD
      ═══════════════════════════════════════════════════════════════ */}
      <div className="colour-top-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "clamp(11px, 3vw, 13px)",
                  fontWeight: 900,
                  color: "#fbbf24",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  textShadow: "0 0 12px rgba(251, 191, 36, 0.6)",
                }}
              >
                <Trophy size={14} color="#fbbf24" /> WIN GO 30S
              </span>
              <span style={{ fontSize: "11px", color: "#64748b" }}>·</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#c084fc",
                  fontFamily: "monospace",
                  letterSpacing: "0.5px",
                }}
              >
                #{roundNumber ?? "—"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "10.5px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontWeight: 800,
                  background: isBettingOpen
                    ? "rgba(16, 185, 129, 0.18)"
                    : "rgba(239, 68, 68, 0.18)",
                  border: `1.5px solid ${isBettingOpen ? "rgba(16, 185, 129, 0.45)" : "rgba(239, 68, 68, 0.45)"}`,
                  color: isBettingOpen ? "#34d399" : "#f87171",
                  boxShadow: isBettingOpen
                    ? "0 0 10px rgba(16, 185, 129, 0.25)"
                    : "none",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: isBettingOpen ? "#10b981" : "#ef4444",
                    boxShadow: `0 0 8px ${isBettingOpen ? "#10b981" : "#ef4444"}`,
                    animation: isBettingOpen ? "pulse 1.5s infinite" : "none",
                  }}
                />
                {isBettingOpen
                  ? "BETTING OPEN"
                  : roundStatus === "SETTLED"
                    ? "ROUND SETTLED"
                    : "CALCULATING RESULT..."}
              </span>
            </div>
          </div>

          {/* Right Action Icons & Digital LED Scoreboard Clock */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "3px",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                Time Remaining
              </span>
              <div
                className={`colour-digital-clock ${countdown <= 5 ? "danger" : ""}`}
              >
                <span className="clock-digit">0</span>
                <span className="clock-digit">0</span>
                <span className="clock-colon">:</span>
                <span className="clock-digit">
                  {Math.floor(countdown / 10)}
                </span>
                <span className="clock-digit">{countdown % 10}</span>
              </div>
            </div>

            {/* Utility Buttons */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <button
                type="button"
                onClick={toggleSound}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: soundEnabled ? "#34d399" : "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                title="Toggle Audio"
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>

              <button
                type="button"
                onClick={() => setShowVerify(!showVerify)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "8px",
                  background: showVerify
                    ? "rgba(168, 85, 247, 0.3)"
                    : "rgba(255, 255, 255, 0.08)",
                  border: showVerify
                    ? "1px solid #a855f7"
                    : "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#c084fc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                title="Verify Fairness"
              >
                <ShieldCheck size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Provably Fair Drawer ── */}
        {showVerify && (
          <div
            style={{
              marginTop: "10px",
              padding: "10px 12px",
              borderRadius: "12px",
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(168, 85, 247, 0.25)",
              fontSize: "11px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span style={{ color: "#c084fc", fontWeight: 800 }}>
                PROVABLY FAIR ROUND HASH
              </span>
              <span style={{ color: "#64748b", fontSize: "9.5px" }}>
                HMAC-SHA256
              </span>
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "10px",
                color: "#94a3b8",
                wordBreak: "break-all",
                background: "rgba(0,0,0,0.3)",
                padding: "6px 8px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "6px",
              }}
            >
              <span>
                {serverSeedHash || "Hash generated prior to round..."}
              </span>
              {serverSeedHash && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(serverSeedHash);
                    showAlert("Server seed hash copied ✓", false);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#38bdf8",
                    cursor: "pointer",
                    padding: "2px",
                  }}
                >
                  <Copy size={12} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. LAST RESULT CELEBRATION (PURE COLOR OUTCOME)
      ═══════════════════════════════════════════════════════════════ */}
      {lastResult && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "14px 16px",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(26, 18, 48, 0.95) 0%, rgba(15, 23, 42, 0.96) 100%)",
            border: "1.5px solid rgba(251, 191, 36, 0.5)",
            boxShadow:
              "0 12px 32px rgba(0, 0, 0, 0.65), 0 0 20px rgba(251, 191, 36, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.25)",
            animation: "fadeInCalc 0.3s ease-out",
          }}
        >
          {/* Luminous 3D Gemstone Orb */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: resultGrad(lastResult.colors || [], activeColorMap),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              flexShrink: 0,
              border: "2.5px solid #ffffff",
              boxShadow:
                "0 0 22px rgba(251, 191, 36, 0.85), inset 0 2px 4px rgba(255, 255, 255, 0.6)",
              position: "relative",
            }}
          >
            <span style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))" }}>
              {(activeColorMap[lastResult.colors?.[0]] || COLOR_MAP[lastResult.colors?.[0]])?.emoji || "💎"}
            </span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Trophy size={14} color="#fbbf24" />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 900,
                  color: "#fbbf24",
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                }}
              >
                ROUND #{roundNumber} WINNER
              </span>
            </div>
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginTop: "4px",
                flexWrap: "wrap",
              }}
            >
              {lastResult.colors?.map((c) => {
                const isV = c === "VIOLET";
                const colMeta = activeColorMap[c] || COLOR_MAP[c];
                return (
                  <span
                    key={c}
                    style={{
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 900,
                      color: "#ffffff",
                      background: colMeta?.solid || "#6366f1",
                      boxShadow: `0 0 12px ${colMeta?.solid || "#6366f1"}`,
                      letterSpacing: "0.4px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                    }}
                  >
                    <span>{colMeta?.emoji || "💎"}</span>
                    <span>{c}</span>
                    <span style={{ opacity: 0.85, fontSize: "9.5px" }}>
                      ({colMeta?.mult || (isV ? "4.5×" : "2.0×")})
                    </span>
                  </span>
                );
              })}
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "2px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: "#34d399",
                fontWeight: 900,
                background: "rgba(16, 185, 129, 0.16)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                padding: "2px 8px",
                borderRadius: "8px",
                letterSpacing: "0.4px",
              }}
            >
              SETTLED ✓
            </span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          3. VIBRANT DYNAMIC COLOUR PREDICTION ARENA
      ═══════════════════════════════════════════════════════════════ */}
      <div className="colour-betting-arena">
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "6px",
            padding: "0 2px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={14} color="#fbbf24" />
            <span
              style={{
                fontSize: "13px",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
              }}
            >
              Select Prediction
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span
              style={{
                fontSize: "9.5px",
                fontWeight: 900,
                padding: "3px 8px",
                borderRadius: "7px",
                background: "rgba(251, 191, 36, 0.16)",
                color: "#fbbf24",
                border: "1px solid rgba(251, 191, 36, 0.4)",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fbbf24", boxShadow: "0 0 6px #fbbf24" }} />
              HIGH PAYOUT
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {colorOptions.map((c, i) => (
                <React.Fragment key={c.id}>
                  {i > 0 && <span style={{ color: "#475569", fontSize: "10px" }}>·</span>}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: c.solid,
                      textShadow: `0 0 8px rgba(${c.glow || '255,255,255'}, 0.5)`,
                      letterSpacing: "0.3px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.label}: {c.mult}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Radiant Join Buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${colorOptions.length}, minmax(0, 1fr))`,
            gap: "10px",
          }}
        >
          {colorOptions.map((c) => {
            const isSelected = selectedBet === c.id;
            const isViolet = c.id === "VIOLET";
            const actionText = c.actionText || `Join ${c.label || c.id}`;

            return (
              <button
                key={c.id}
                type="button"
                className={`colour-join-btn ${c.id.toLowerCase()} ${isSelected ? "active" : ""}`}
                style={{
                  ...(c.grad ? { background: c.grad } : {}),
                  ...(c.solid && isSelected
                    ? {
                        borderColor: "#ffffff",
                        boxShadow: `0 0 35px rgba(${c.glow || "255,255,255"}, 0.95)`,
                      }
                    : {}),
                }}
                onClick={() => {
                  sound.playClick();
                  setSelectedBet(isSelected ? null : c.id);
                }}
              >
                {/* Active Selected Checkmark */}
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      background: "rgba(0, 0, 0, 0.85)",
                      border: "1.5px solid #ffffff",
                      borderRadius: "10px",
                      padding: "1px 5px",
                      fontSize: "8px",
                      fontWeight: 900,
                      color: "#ffffff",
                      letterSpacing: "0.3px",
                      zIndex: 3,
                    }}
                  >
                    ✓
                  </div>
                )}

                {/* 3D Emoji Icon */}
                <div
                  style={{
                    fontSize: "clamp(26px, 6.5vw, 34px)",
                    filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))",
                    transform: isSelected ? "scale(1.12)" : "scale(1)",
                    transition:
                      "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {c.emoji}
                </div>

                {/* Action Title */}
                <span
                  style={{
                    fontSize: "clamp(13px, 3.6vw, 16.5px)",
                    fontWeight: 900,
                    letterSpacing: "0.4px",
                    marginTop: "4px",
                    color: "#ffffff",
                    textShadow: "0 2px 6px rgba(0,0,0,0.7)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {actionText}
                </span>

                {/* Multiplier Tag */}
                <div
                  style={{
                    marginTop: "6px",
                    padding: "3px clamp(6px, 1.8vw, 12px)",
                    borderRadius: "12px",
                    fontSize: "clamp(10px, 2.7vw, 12px)",
                    fontWeight: 900,
                    background: isViolet
                      ? "linear-gradient(135deg, rgba(251, 191, 36, 0.4) 0%, rgba(213, 0, 249, 0.45) 100%)"
                      : "rgba(0, 0, 0, 0.45)",
                    color: isViolet ? "#fef08a" : "#ffffff",
                    border: isViolet
                      ? "1.5px solid rgba(251, 191, 36, 0.6)"
                      : "1px solid rgba(255, 255, 255, 0.3)",
                    boxShadow: isViolet
                      ? "0 0 12px rgba(251, 191, 36, 0.45)"
                      : "none",
                    letterSpacing: "0.3px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {isViolet && <span>⭐</span>}
                  <span>{c.mult}</span>
                </div>

                {/* Subtitle */}
                <span
                  style={{
                    fontSize: "clamp(8.5px, 2.4vw, 10px)",
                    fontWeight: 700,
                    color: "rgba(255, 255, 255, 0.8)",
                    marginTop: "4px",
                    letterSpacing: "0.2px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.tag || "Double Win"}
                </span>
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            4. THEMED BET SLIP (OPENS ON COLOR SELECT)
        ═══════════════════════════════════════════════════════════════ */}
        {selectedBet && selColor ? (
          <div
            className={`colour-bet-slip ${selColor.id.toLowerCase()}-theme`}
            style={{
              background: `linear-gradient(180deg, rgba(${selGlow}, 0.22) 0%, rgba(10, 14, 26, 0.98) 100%)`,
              border: `1.5px solid rgba(${selGlow}, 0.45)`,
              boxShadow: `0 16px 40px rgba(0, 0, 0, 0.7), 0 0 28px rgba(${selGlow}, 0.2)`,
            }}
          >
            {/* Slip Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                paddingBottom: "10px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span style={{ fontSize: "24px" }}>{selColor.emoji}</span>
                <div>
                  <div
                    style={{
                      fontSize: "clamp(13px, 3.5vw, 15px)",
                      fontWeight: 900,
                      color: "#ffffff",
                      letterSpacing: "0.4px",
                    }}
                  >
                    Select Amount for {selColor.label}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#fbbf24",
                      fontWeight: 800,
                    }}
                  >
                    Payout Multiplier: {selColor.mult}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBet(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "#94a3b8",
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Contract Money Pills (Responsive 6-Grid) */}
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#cbd5e1",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginBottom: "6px",
                }}
              >
                Contract Money
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                  gap: "6px",
                }}
              >
                {["10", "50", "100", "500", "1000", "5000"].map((val) => {
                  const isActive = betAmount === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setBetAmount(val);
                      }}
                      className={`colour-contract-btn ${isActive ? "active" : ""}`}
                    >
                      ₹{val >= 1000 ? `${val / 1000}K` : val}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Number Multiplier & Stepper (Ergonomic Two-Row Layout on Mobile) */}
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#cbd5e1",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginBottom: "6px",
                }}
              >
                Wager Amount
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {/* Row 1: Tactile Stepper & Amount Input */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <button
                    type="button"
                    className="colour-stepper-btn"
                    onClick={() => {
                      sound.playClick();
                      const cur = parseFloat(betAmount) || 10;
                      setBetAmount(String(Math.max(1, cur - 10)));
                    }}
                  >
                    <Minus size={18} />
                  </button>

                  <div style={{ position: "relative", flex: 1 }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "11px",
                        color: "#94a3b8",
                        fontWeight: 900,
                        fontSize: "16px",
                        pointerEvents: "none",
                      }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      min={gameConfig?.minimumBet || 1}
                      max={gameConfig?.maximumBet || 100000}
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      style={{
                        width: "100%",
                        height: 44,
                        borderRadius: "12px",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        background: "rgba(0, 0, 0, 0.6)",
                        color: "#ffffff",
                        fontWeight: 900,
                        fontSize: "18px",
                        paddingLeft: "32px",
                        paddingRight: "12px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className="colour-stepper-btn"
                    onClick={() => {
                      sound.playClick();
                      const cur = parseFloat(betAmount) || 10;
                      setBetAmount(String(cur + 10));
                    }}
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Row 2: Ergonomic Quick Multipliers (5-Column Grid) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "6px",
                  }}
                >
                  {[
                    [
                      "½",
                      () =>
                        setBetAmount((s) =>
                          String(
                            Math.max(1, Math.floor((Number(s) || 10) / 2)),
                          ),
                        ),
                    ],
                    [
                      "2×",
                      () => setBetAmount((s) => String((Number(s) || 10) * 2)),
                    ],
                    [
                      "5×",
                      () => setBetAmount((s) => String((Number(s) || 10) * 5)),
                    ],
                    [
                      "10×",
                      () => setBetAmount((s) => String((Number(s) || 10) * 10)),
                    ],
                    [
                      "MAX",
                      () =>
                        wallet &&
                        setBetAmount(
                          String(Math.floor(Number(wallet.balance || 0))),
                        ),
                    ],
                  ].map(([lbl, fn]) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        fn();
                      }}
                      className="colour-mult-pill"
                      style={{
                        height: 38,
                        color: lbl === "MAX" ? "#fbbf24" : "#ffffff",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contract Calculation & Return Strip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "12px",
                background: "rgba(0, 0, 0, 0.45)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                  Wallet Balance:{" "}
                  <strong style={{ color: user ? "#fbbf24" : "#64748b" }}>
                    {user
                      ? `₹${Number(wallet?.balance || 0).toFixed(2)}`
                      : "Not Logged In"}
                  </strong>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#e2e8f0",
                    marginTop: "2px",
                  }}
                >
                  Total Contract:{" "}
                  <strong style={{ color: "#fff" }}>₹{currentNum}</strong>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "9.5px",
                    fontWeight: 800,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                  }}
                >
                  Potential Return
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 900,
                    color: "#34d399",
                    letterSpacing: "0.3px",
                  }}
                >
                  ₹{(currentNum * selPayout).toFixed(2)}
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#6ee7b7",
                      marginLeft: "4px",
                      fontWeight: 700,
                    }}
                  >
                    (+₹{(currentNum * (selPayout - 1)).toFixed(2)})
                  </span>
                </div>
              </div>
            </div>

            {/* Alert Message Toast */}
            {alertMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 800,
                  textAlign: "center",
                  background: alertError
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(16, 185, 129, 0.2)",
                  border: `1.5px solid ${alertError ? "rgba(239, 68, 68, 0.5)" : "rgba(16, 185, 129, 0.5)"}`,
                  color: alertError ? "#f87171" : "#34d399",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                {alertError ? (
                  <AlertTriangle size={15} />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                {alertMsg}
              </div>
            )}

            {/* Action Confirm Button */}
            {(() => {
              if (!user) {
                return (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setIsAuthModalOpen?.(true);
                    }}
                    className="colour-hero-action-btn btn-auth-prompt"
                  >
                    <Lock size={19} />
                    <span style={{ fontSize: "16px", fontWeight: 900 }}>
                      LOG IN / SIGN UP TO PLAY
                    </span>
                  </button>
                );
              }

              if (!isBettingOpen) {
                return (
                  <button
                    type="button"
                    disabled
                    className="colour-hero-action-btn btn-idle"
                  >
                    <Lock size={18} />
                    <span style={{ fontSize: "14.5px", fontWeight: 900 }}>
                      BETTING CLOSED — SETTLING...
                    </span>
                  </button>
                );
              }

              if (isInsufficient) {
                return (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setIsDepositModalOpen?.(true);
                    }}
                    className="colour-hero-action-btn btn-insufficient"
                  >
                    <AlertTriangle size={19} />
                    <span style={{ fontSize: "15px", fontWeight: 900 }}>
                      INSUFFICIENT BALANCE · TOP UP ₹{currentNum}
                    </span>
                  </button>
                );
              }

              const estWin = (currentNum * selPayout).toFixed(2);

              return (
                <button
                  type="button"
                  onClick={handlePlaceBet}
                  disabled={submitting}
                  className="colour-hero-action-btn btn-ready"
                  style={{
                    background: selGrad,
                    boxShadow: `0 8px 30px rgba(${selGlow}, 0.7), inset 0 1px 2px rgba(255, 255, 255, 0.5)`,
                  }}
                >
                  {submitting ? (
                    <>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: "2px solid rgba(255,255,255,0.4)",
                          borderTopColor: "#fff",
                          animation: "spin 0.7s linear infinite",
                        }}
                      />
                      <span style={{ fontSize: "16px", fontWeight: 900 }}>
                        CONFIRMING BET...
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          lineHeight: 1.15,
                        }}
                      >
                        <span style={{ fontSize: "16.5px", fontWeight: 900 }}>
                          CONFIRM BET ₹{currentNum} ON {selColor.label}
                        </span>
                        <span
                          style={{
                            fontSize: "11.5px",
                            color: "rgba(255, 255, 255, 0.95)",
                            fontWeight: 800,
                          }}
                        >
                          WINNING PAYOUT: ₹{estWin}
                        </span>
                      </div>
                    </>
                  )}
                </button>
              );
            })()}
          </div>
        ) : (
          /* Empty Selection Guide Card */
          <div
            style={{
              padding: "16px",
              borderRadius: "16px",
              background: "rgba(0, 0, 0, 0.25)",
              border: "1px dashed rgba(255, 255, 255, 0.15)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {/* Luminous 3D Glossy Color Spheres */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "2px" }}>
              {colorOptions.map((c) => (
                <div
                  key={c.id}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: c.grad || c.solid,
                    boxShadow: `0 0 14px rgba(${c.glow || '255,255,255'}, 0.85), inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -2px 3px rgba(0,0,0,0.5)`,
                    border: '1.5px solid rgba(255, 255, 255, 0.45)',
                    transition: 'all 0.3s ease',
                  }}
                  title={c.label}
                />
              ))}
            </div>

            <span
              style={{ fontSize: "13px", fontWeight: 800, color: "#cbd5e1" }}
            >
              Tap{" "}
              {colorOptions.map((c, i) => (
                <React.Fragment key={c.id}>
                  {i > 0 && (i === colorOptions.length - 1 ? ", or " : ", ")}
                  <strong
                    style={{
                      color: c.solid,
                      textShadow: `0 0 10px rgba(${c.glow || '255,255,255'}, 0.5)`,
                    }}
                  >
                    {c.actionText || `Join ${c.label}`}
                  </strong>
                </React.Fragment>
              ))}{" "}
              to start betting!
            </span>

            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
              {colorOptions.map((c, i) => (
                <React.Fragment key={c.id}>
                  {i > 0 && <span style={{ color: "#475569", fontSize: "11px" }}>·</span>}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: c.solid,
                      letterSpacing: "0.3px",
                      background: `rgba(${c.glow || '255,255,255'}, 0.1)`,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: `1px solid rgba(${c.glow || '255,255,255'}, 0.25)`,
                    }}
                  >
                    {c.label}: {c.mult}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          5. TABBED ACTIVITY CARD (HISTORY, LIVE BETS, MY BETS)
      ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.65)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "18px",
          overflow: "hidden",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Tab Headers */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(0, 0, 0, 0.2)",
          }}
        >
          {[
            { key: "history", label: "History", badge: history.length },
            { key: "live", label: "Live Bets", badge: liveBets.length },
            { key: "mine", label: "My Bets", badge: myBets.length },
          ].map(({ key, label, badge }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveTab(key);
                  if (key === "mine") loadMyBets();
                }}
                style={{
                  flex: 1,
                  padding: "11px 8px",
                  background: "none",
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid #a855f7"
                    : "2px solid transparent",
                  color: isActive ? "#fff" : "#64748b",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                {label}
                <span
                  style={{
                    fontSize: "9.5px",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    background: isActive
                      ? "rgba(168, 85, 247, 0.25)"
                      : "rgba(255, 255, 255, 0.05)",
                    color: isActive ? "#c084fc" : "#64748b",
                    fontWeight: 700,
                  }}
                >
                  {badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panes */}
        <div style={{ maxHeight: 340, overflowY: "auto" }}>
          {/* History Tab (Pure Color Badges) */}
          {activeTab === "history" && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {history.length === 0 ? (
                <div
                  style={{
                    padding: "36px 16px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  No round history available
                </div>
              ) : (
                history.map((r, i) => {
                  const colors = r.result?.colors || [];
                  const main = colors[0] || "GREEN";
                  const c = activeColorMap[main] || COLOR_MAP[main];
                  const bg = resultGrad(colors, activeColorMap);
                  const isLatest = i === 0;

                  return (
                    <div
                      key={r.roundId || i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 14px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                        background: isLatest
                          ? "rgba(168, 85, 247, 0.08)"
                          : "transparent",
                        borderLeft: `3px solid ${isLatest ? "#a855f7" : "transparent"}`,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: bg,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          border: isLatest
                            ? "2px solid #fbbf24"
                            : "1px solid rgba(255,255,255,0.2)",
                          boxShadow: `0 0 10px rgba(${c?.glow || "168,85,247"}, ${isLatest ? 0.6 : 0.25})`,
                        }}
                      >
                        {c?.emoji || "💎"}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "5px",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        {isLatest && (
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "8.5px",
                              fontWeight: 900,
                              background: "rgba(168, 85, 247, 0.3)",
                              color: "#c084fc",
                            }}
                          >
                            LATEST
                          </span>
                        )}
                        {colors.map((cl) => {
                          const clMeta = activeColorMap[cl] || COLOR_MAP[cl];
                          return (
                            <span
                              key={cl}
                              style={{
                                padding: "2px 8px",
                                borderRadius: "20px",
                                fontSize: "10px",
                                fontWeight: 800,
                                background: `rgba(${clMeta?.glow || "168,85,247"}, 0.16)`,
                                color: clMeta?.solid || "#c084fc",
                                border: `1px solid rgba(${clMeta?.glow || "168,85,247"}, 0.35)`,
                              }}
                            >
                              {clMeta?.emoji || "💎"} {cl}
                            </span>
                          );
                        })}
                      </div>

                      <span
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        #{r.roundNumber}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Live Bets Tab */}
          {activeTab === "live" && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {liveBets.length === 0 ? (
                <div
                  style={{
                    padding: "36px 16px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  No live bets placed this round yet
                </div>
              ) : (
                liveBets.map((b, i) => {
                  const pred = b.prediction || b.selection || "?";
                  const c = activeColorMap[pred] || COLOR_MAP[pred];
                  const glow = c?.glow || "168,85,247";
                  const solid = c?.solid || "#c084fc";

                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "9px 14px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                        fontSize: "12px",
                      }}
                    >
                      <span
                        style={{
                          color: "#94a3b8",
                          fontWeight: 700,
                          fontSize: "11px",
                        }}
                      >
                        Player #{String(b.userId || i).slice(-4)}
                      </span>

                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "10.5px",
                          fontWeight: 800,
                          background: `rgba(${glow}, 0.14)`,
                          color: solid,
                          border: `1px solid rgba(${glow}, 0.3)`,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {c?.emoji} {pred}
                      </span>

                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 900,
                          color: "#fbbf24",
                          flexShrink: 0,
                        }}
                      >
                        ₹{Number(b.amount).toFixed(0)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* My Bets Tab */}
          {activeTab === "mine" && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {!user ? (
                <div
                  style={{
                    padding: "36px 16px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  Please log in to view your bet history
                </div>
              ) : myBets.length === 0 ? (
                <div
                  style={{
                    padding: "36px 16px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  No bets placed yet. Make your first prediction above!
                </div>
              ) : (
                myBets.map((b, i) => {
                  const pred = b.prediction || "?";
                  const c = activeColorMap[pred] || COLOR_MAP[pred];
                  const glow = c?.glow || "168,85,247";
                  const solid = c?.solid || "#c084fc";
                  const isWon = b.status === "WON";
                  const isLost = b.status === "LOST";

                  return (
                    <div
                      key={b._id || i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 14px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                        background: isWon
                          ? "rgba(16, 185, 129, 0.06)"
                          : isLost
                            ? "rgba(239, 68, 68, 0.04)"
                            : "transparent",
                        borderLeft: `3px solid ${isWon ? "#10b981" : isLost ? "#ef4444" : "transparent"}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          fontWeight: 700,
                          flexShrink: 0,
                          minWidth: 32,
                        }}
                      >
                        #{b.roundNumber}
                      </span>

                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "10.5px",
                          fontWeight: 800,
                          background: `rgba(${glow}, 0.14)`,
                          color: solid,
                          border: `1px solid rgba(${glow}, 0.3)`,
                          flexShrink: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {c?.emoji} {pred}
                      </span>

                      <span
                        style={{ fontSize: "12px", color: "#94a3b8", flex: 1 }}
                      >
                        ₹{Number(b.amount).toFixed(0)}
                      </span>

                      <span
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 900,
                          flexShrink: 0,
                          color: isWon
                            ? "#34d399"
                            : isLost
                              ? "#f87171"
                              : b.status === "REFUNDED"
                                ? "#fbbf24"
                                : "#64748b",
                        }}
                      >
                        {isWon
                          ? `+₹${Number(b.payout || 0).toFixed(0)}`
                          : isLost
                            ? "LOST"
                            : b.status === "REFUNDED"
                              ? "REFUND"
                              : "PENDING"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColourGame;
