import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { socket } from '../../services/socket.js';
import { api }    from '../../services/api.js';

// ── Card helpers ───────────────────────────────────────────────────────────────
const RANK_ORDER  = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const SUIT_SYMBOL = { S:'♠', H:'♥', D:'♦', C:'♣' };
const SUIT_COLOR  = { S:'#94a3b8', H:'#f87171', D:'#f87171', C:'#94a3b8' };

function normalizeRank(r) {
  const s = String(r).toUpperCase();
  return s === '10' ? 'T' : s;
}

function evaluateHand(cards) {
  if (!cards || cards.length < 3) return null;
  const ranks = cards.map(c => normalizeRank(c.rank));
  const suits  = cards.map(c => String(c.suit).toUpperCase());
  const ri     = ranks.map(r => RANK_ORDER.indexOf(r)).sort((a, b) => a - b);
  const flush  = suits[0] === suits[1] && suits[1] === suits[2];

  // Trail / Set
  if (ranks[0] === ranks[1] && ranks[1] === ranks[2]) return { name: 'Trail / Set',    color: '#fcd34d' };

  // Sequence check: normal + A-2-3 + K-A-2
  const isSeq =
    (ri[2] - ri[1] === 1 && ri[1] - ri[0] === 1) ||
    (ri[0] === 0 && ri[1] === 1  && ri[2] === 12) ||   // A-2-3
    (ri[0] === 0 && ri[1] === 11 && ri[2] === 12);     // K-A-2

  if (isSeq && flush) return { name: 'Pure Sequence', color: '#a78bfa' };
  if (isSeq)          return { name: 'Sequence',      color: '#60a5fa' };
  if (flush)          return { name: 'Flush / Color', color: '#34d399' };

  const hasPair = ranks.some((r, i) => ranks.indexOf(r) !== i);
  if (hasPair)        return { name: 'Pair',          color: '#f97316' };

  return              { name: 'High Card',             color: '#94a3b8' };
}

// ── Seat positions around oval (% of container width / height) ────────────────
const SEAT_POS = [
  { left: '15%', top: '10%' }, // 0 – top-left
  { left: '50%', top:  '4%' }, // 1 – top-center
  { left: '85%', top: '10%' }, // 2 – top-right
  { left: '85%', top: '83%' }, // 3 – bottom-right
  { left: '50%', top: '92%' }, // 4 – bottom-center
  { left: '15%', top: '83%' }, // 5 – bottom-left
];

// ─────────────────────────────────────────────────────────────────────────────
export const TeenPattiGame = ({ tableId }) => {
  const { user, wallet, refreshWallet } = useAuth();

  const [tableState,        setTableState]        = useState(null);
  const [seats,             setSeats]             = useState([]);
  const [myCards,           setMyCards]           = useState([]);
  const [myHand,            setMyHand]            = useState(null);
  const [potAmount,         setPotAmount]         = useState(0);
  const [currentStake,      setCurrentStake]      = useState(0);
  const [currentTurnUserId, setCurrentTurnUserId] = useState(null);
  const [isMyTurn,          setIsMyTurn]          = useState(false);
  const [cardsVisible,      setCardsVisible]      = useState(false);
  const [roundHistory,      setRoundHistory]      = useState([]);
  const [sideshowPending,   setSideshowPending]   = useState(null);  // eslint-disable-line no-unused-vars
  const [lastWinner,        setLastWinner]        = useState(null);
  const [submitting,        setSubmitting]        = useState(false);
  const [alertMsg,          setAlertMsg]          = useState(null);
  const [alertError,        setAlertError]        = useState(false);
  const [activeTab,         setActiveTab]         = useState('game');

  const userId = user?._id || user?.id;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showAlert = useCallback((msg, isError = false) => {
    setAlertMsg(msg);
    setAlertError(isError);
    setTimeout(() => setAlertMsg(null), 3500);
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get(`/games/teenpatti/tables/${tableId}/history?limit=20`);
      if (res.data?.success) setRoundHistory(res.data.data || []);
    } catch {}
  }, [tableId]);

  const loadTable = useCallback(async () => {
    try {
      const res = await api.get(`/games/teenpatti/tables/${tableId}`);
      if (res.data?.success) {
        const t = res.data.data;
        setTableState(t);
        setSeats(t.seats || []);
        setPotAmount(t.potAmount || 0);
        setCurrentStake(t.currentStake || 0);
        setCurrentTurnUserId(t.currentTurnUserId || null);
        setIsMyTurn(!!userId && t.currentTurnUserId === userId);
      }
    } catch {}
  }, [tableId, userId]);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tableId) return;

    loadTable();
    loadHistory();

    socket.emit('tp:table:join', { tableId });
    if (userId) socket.emit('user:join', { userId });

    const onRoundStarted = (d) => {
      setPotAmount(0);
      setCurrentStake(d.currentStake || 0);
      setIsMyTurn(false);
      setCardsVisible(false);
      setMyCards([]);
      setMyHand(null);
      setLastWinner(null);
      setSideshowPending(null);
      setSeats(d.seats || []);
      setTableState(prev => prev ? { ...prev, ...d, status: 'ACTIVE' } : d);
    };

    const onYourCards = (d) => {
      setMyCards(d.cards || []);
      setMyHand(null);
    };

    const onCardsDealt = (d) => {
      setSeats(prev => prev.map(s => {
        const upd = (d.seats || []).find(u => u.userId === s.userId);
        return upd ? { ...s, ...upd } : s;
      }));
    };

    const onTurnStart = (d) => {
      setCurrentTurnUserId(d.userId);
      setIsMyTurn(!!userId && d.userId === userId);
      setTableState(prev => prev ? { ...prev, currentTurnUserId: d.userId, timeoutSec: d.timeoutSec } : null);
    };

    const onPlayerBlind = (d) => {
      setPotAmount(p => p + (d.amount || 0));
      setSeats(prev => prev.map(s => s.userId === d.userId ? { ...s, lastAction: 'BLIND' } : s));
    };

    const onPlayerChaal = (d) => {
      setPotAmount(p => p + (d.amount || 0));
      if (d.stake) setCurrentStake(d.stake);
      setSeats(prev => prev.map(s => s.userId === d.userId ? { ...s, lastAction: 'CHAAL' } : s));
    };

    const onPlayerPacked = (d) => {
      setTableState(prev => {
        if (!prev) return prev;
        const newOrder = (prev.activePlayerOrder || []).filter(id => id !== d.userId);
        return { ...prev, activePlayerOrder: newOrder };
      });
      setSeats(prev => prev.map(s =>
        s.userId === d.userId ? { ...s, isPacked: true, lastAction: 'PACK' } : s
      ));
    };

    const onSideshowResult = (d) => {
      setSideshowPending(null);
      showAlert(
        d.result === 'win' ? '🎯 Sideshow: you win — opponent packed!' : '😞 Sideshow: you lose',
        d.result !== 'win',
      );
    };

    const onRoundShowdown = (d) => {
      setTableState(prev => prev ? { ...prev, status: 'SHOWDOWN', showdownData: d } : prev);
    };

    const onRoundSettled = (d) => {
      setLastWinner(d.winner || null);
      setTableState(prev => prev ? { ...prev, status: 'SETTLED', serverSeed: d.serverSeed } : prev);
      showAlert(
        d.winner ? `🏆 ${d.winner.displayName || 'Player'} wins!` : 'Round settled',
        false,
      );
      refreshWallet();
      loadHistory();
    };

    const onTurnTimeout  = () => showAlert('⏱ Turn timed out', true);
    const onRoundCancelled = () => {
      setTableState(prev => prev ? { ...prev, status: 'CANCELLED' } : prev);
      showAlert('⚠️ Round cancelled — not enough players', true);
    };

    socket.on('tp:round:started',   onRoundStarted);
    socket.on('tp:your:cards',      onYourCards);
    socket.on('tp:cards:dealt',     onCardsDealt);
    socket.on('tp:turn:start',      onTurnStart);
    socket.on('tp:player:blind',    onPlayerBlind);
    socket.on('tp:player:chaal',    onPlayerChaal);
    socket.on('tp:player:packed',   onPlayerPacked);
    socket.on('tp:sideshow:result', onSideshowResult);
    socket.on('tp:round:showdown',  onRoundShowdown);
    socket.on('tp:round:settled',   onRoundSettled);
    socket.on('tp:turn:timeout',    onTurnTimeout);
    socket.on('tp:round:cancelled', onRoundCancelled);

    return () => {
      socket.emit('tp:table:leave', { tableId });
      [
        'tp:round:started','tp:your:cards','tp:cards:dealt','tp:turn:start',
        'tp:player:blind','tp:player:chaal','tp:player:packed','tp:sideshow:result',
        'tp:round:showdown','tp:round:settled','tp:turn:timeout','tp:round:cancelled',
      ].forEach(ev => socket.off(ev));
    };
  }, [tableId, userId, loadTable, loadHistory, showAlert, refreshWallet]);

  // ── Action sender ─────────────────────────────────────────────────────────
  const sendAction = async (action, extra = {}) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const idempotencyKey = `${tableId}-${action}-${Date.now()}`;
      const res = await api.post(`/games/teenpatti/tables/${tableId}/action`, {
        action, idempotencyKey, ...extra,
      });
      if (!res.data?.success) showAlert(res.data?.message || 'Action failed', true);
    } catch (err) {
      showAlert(err.response?.data?.message || 'Action failed', true);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePeek = () => {
    const next = !cardsVisible;
    setCardsVisible(next);
    if (next && myCards.length === 3) setMyHand(evaluateHand(myCards));
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const isSeen      = cardsVisible;
  const activeCount = (tableState?.activePlayerOrder || []).length;
  const roundStatus = tableState?.status || 'WAITING';
  const serverSeedHash = tableState?.serverSeedHash || '';

  const STATUS_COLORS = {
    ACTIVE: '#34d399', WAITING: '#fbbf24', SHOWDOWN: '#a78bfa',
    SETTLED: '#60a5fa', CANCELLED: '#f87171',
  };
  const statusColor = STATUS_COLORS[roundStatus] || '#94a3b8';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#fff' }}>

      {/* ═══════════════════════════════════════════════════════════════
          (a) ROUND HEADER
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(220,38,38,0.15),rgba(146,64,14,0.12),rgba(6,78,59,0.15))',
        border: '1px solid rgba(220,38,38,0.25)',
        borderRadius: '18px', padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(10px)',
      }}>
        <div>
          <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            🃏 TABLE #{tableState?.tableNumber ?? '—'}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>
            Round #{tableState?.roundNumber ?? '—'}
          </div>
          <span style={{
            fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: 800,
            background: `${statusColor}18`,
            border: `1px solid ${statusColor}40`,
            color: statusColor,
          }}>
            ● {roundStatus}
          </span>
        </div>

        {serverSeedHash && (
          <div style={{ textAlign: 'right', maxWidth: '140px' }}>
            <div style={{ fontSize: '9px', color: '#475569', fontWeight: 700, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Seed Hash
            </div>
            <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#334155', wordBreak: 'break-all' }}>
              {serverSeedHash.slice(0, 16)}…
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          (b) TABLE OVAL with 6 SEAT SLOTS
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', paddingTop: '62%' }}>
        {/* Oval felt */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, #0f2820 0%, #0a1a14 60%, #070e0c 100%)',
          border: '3px solid rgba(220,38,38,0.3)',
          borderRadius: '50%',
          boxShadow: '0 0 40px rgba(220,38,38,0.08), inset 0 0 60px rgba(0,0,0,0.5)',
          overflow: 'visible',
        }}>
          {/* Inner ring decorations */}
          <div style={{ position: 'absolute', inset: '8%', borderRadius: '50%', border: '1.5px solid rgba(16,185,129,0.12)', pointerEvents: 'none' }}/>
          <div style={{ position: 'absolute', inset: '22%', borderRadius: '50%', border: '1px solid rgba(16,185,129,0.07)', pointerEvents: 'none' }}/>

          {/* Pot display centred on table */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            textAlign: 'center', pointerEvents: 'none',
          }}>
            <div style={{ fontSize: '9px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>POT</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#fcd34d', lineHeight: 1.1 }}>
              ₹{potAmount.toLocaleString('en-IN')}
            </div>
          </div>

          {/* 6 Seats */}
          {SEAT_POS.map((pos, idx) => {
            const seat = seats[idx];
            const isMe = seat?.userId === userId;
            const packed = !!seat?.isPacked;
            return (
              <div key={idx} style={{
                position: 'absolute',
                left: pos.left, top: pos.top,
                transform: 'translate(-50%,-50%)',
                width: '68px',
                zIndex: 2,
              }}>
                {seat?.userId ? (
                  <div style={{
                    background: isMe
                      ? 'linear-gradient(135deg,rgba(220,38,38,0.3),rgba(146,64,14,0.2))'
                      : 'rgba(10,20,34,0.88)',
                    border: isMe ? '1px solid rgba(220,38,38,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', padding: '5px 4px',
                    textAlign: 'center', backdropFilter: 'blur(8px)',
                    opacity: packed ? 0.35 : 1,
                    position: 'relative',
                    transition: 'opacity 0.3s',
                  }}>
                    {packed && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: 'rgba(0,0,0,0.45)', fontSize: '14px' }}>
                        ❌
                      </div>
                    )}
                    {seat.isBot && (
                      <div style={{ fontSize: '7px', color: '#a78bfa', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '1px' }}>BOT</div>
                    )}
                    <div style={{ fontSize: '9px', fontWeight: 700, color: isMe ? '#fcd34d' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60px' }}>
                      {seat.displayName || `P${idx + 1}`}
                    </div>
                    {seat.lastAction && !packed && (
                      <div style={{ fontSize: '7px', marginTop: '2px', padding: '1px 4px', borderRadius: '6px', background: 'rgba(255,255,255,0.07)', color: '#64748b', fontWeight: 700 }}>
                        {seat.lastAction}
                      </div>
                    )}
                    {/* Turn indicator dot */}
                    {seat.userId === currentTurnUserId && (
                      <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', animation: 'tpPulse 1.2s infinite' }}/>
                    )}
                  </div>
                ) : (
                  <div style={{ background: 'rgba(15,23,42,0.25)', border: '1px dashed rgba(255,255,255,0.04)', borderRadius: '12px', padding: '5px 4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: '#1e293b', fontWeight: 700 }}>EMPTY</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          (c) POT + CURRENT STAKE DISPLAY
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          { label: 'Pot Amount',    value: `₹${potAmount.toLocaleString('en-IN')}`,    color: '#fcd34d' },
          { label: 'Current Stake', value: `₹${currentStake.toLocaleString('en-IN')}`, color: '#34d399' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px', padding: '10px 12px', textAlign: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontSize: '9px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          (d) MY CARDS SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(180deg,rgba(15,23,42,0.7),rgba(9,14,30,0.8))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px', padding: '16px',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Cards</div>
            {myHand && (
              <div style={{ fontSize: '11px', fontWeight: 800, color: myHand.color, marginTop: '2px' }}>{myHand.name}</div>
            )}
          </div>
          <button type="button" onClick={handlePeek}
            disabled={myCards.length === 0}
            style={{
              padding: '6px 14px', borderRadius: '10px',
              background: cardsVisible
                ? 'linear-gradient(135deg,rgba(220,38,38,0.25),rgba(146,64,14,0.15))'
                : 'rgba(255,255,255,0.06)',
              border: cardsVisible ? '1px solid rgba(220,38,38,0.45)' : '1px solid rgba(255,255,255,0.1)',
              color: cardsVisible ? '#fca5a5' : '#94a3b8',
              fontSize: '11px', fontWeight: 800,
              cursor: myCards.length ? 'pointer' : 'not-allowed',
              opacity: myCards.length ? 1 : 0.4,
              transition: 'all 0.15s',
            }}>
            {cardsVisible ? '🙈 Hide' : '👁 Peek'}
          </button>
        </div>

        {/* 3 card slots */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {[0, 1, 2].map(i => {
            const card = myCards[i];
            const suit  = card ? String(card.suit).toUpperCase() : null;
            const rank  = card ? normalizeRank(card.rank) : null;
            const sColor  = suit ? (SUIT_COLOR[suit] || '#94a3b8') : '#94a3b8';
            const sSymbol = suit ? (SUIT_SYMBOL[suit] || '?') : '?';
            const showCard = cardsVisible && !!card;

            return (
              <div key={i} style={{
                width: 64, height: 90,
                borderRadius: '12px',
                border: showCard ? `1.5px solid ${sColor}50` : '1.5px solid rgba(255,255,255,0.1)',
                background: showCard
                  ? 'linear-gradient(145deg,#1e2a3a,#151f2e)'
                  : 'linear-gradient(145deg,rgba(30,20,45,0.9),rgba(15,10,25,0.85))',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '2px',
                boxShadow: showCard ? `0 0 14px ${sColor}22` : '0 2px 8px rgba(0,0,0,0.4)',
                transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
              }}>
                {showCard ? (
                  <>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: sColor, position: 'absolute', top: 5, left: 7 }}>{rank}</div>
                    <div style={{ fontSize: '24px', color: sColor, lineHeight: 1 }}>{sSymbol}</div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>{rank}</div>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: sColor, position: 'absolute', bottom: 5, right: 7, transform: 'rotate(180deg)' }}>{rank}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '22px', color: 'rgba(220,38,38,0.35)', lineHeight: 1 }}>🃏</div>
                    <div style={{ fontSize: '7px', color: '#1e293b', fontWeight: 700 }}>{card ? 'HIDDEN' : 'WAIT'}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          (e) BET CONTROLS
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'rgba(15,23,42,0.6)',
        border: isMyTurn ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px', padding: '16px',
        backdropFilter: 'blur(8px)',
        transition: 'border-color 0.3s',
      }}>
        {isMyTurn && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '12px', padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'tpPulse 1.2s infinite' }}/>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>Your Turn!</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>

          {/* Blind */}
          <button type="button"
            onClick={() => sendAction('blind')}
            disabled={!isMyTurn || submitting || isSeen}
            style={{
              padding: '12px 8px', borderRadius: '14px',
              background: isMyTurn && !isSeen
                ? 'linear-gradient(135deg,rgba(220,38,38,0.22),rgba(146,64,14,0.15))'
                : 'rgba(255,255,255,0.03)',
              border: isMyTurn && !isSeen
                ? '1px solid rgba(220,38,38,0.4)' : '1px solid rgba(255,255,255,0.06)',
              color: isMyTurn && !isSeen ? '#fca5a5' : '#334155',
              fontSize: '12px', fontWeight: 800,
              cursor: isMyTurn && !isSeen && !submitting ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            }}>
            <span style={{ fontSize: '16px' }}>🙈</span>
            <span>Blind</span>
            <span style={{ fontSize: '9px', opacity: 0.55 }}>
              {currentStake > 0 ? `₹${currentStake}` : 'Min bet'}
            </span>
          </button>

          {/* Chaal */}
          <button type="button"
            onClick={() => sendAction('chaal', { isSeen })}
            disabled={!isMyTurn || submitting}
            style={{
              padding: '12px 8px', borderRadius: '14px',
              background: isMyTurn
                ? 'linear-gradient(135deg,rgba(16,185,129,0.22),rgba(5,150,105,0.15))'
                : 'rgba(255,255,255,0.03)',
              border: isMyTurn ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.06)',
              color: isMyTurn ? '#6ee7b7' : '#334155',
              fontSize: '12px', fontWeight: 800,
              cursor: isMyTurn && !submitting ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            }}>
            <span style={{ fontSize: '16px' }}>💰</span>
            <span>Chaal</span>
            <span style={{ fontSize: '9px', opacity: 0.55 }}>
              {isSeen ? `₹${currentStake * 2}` : `₹${currentStake}`}
            </span>
          </button>

          {/* Pack */}
          <button type="button"
            onClick={() => sendAction('pack')}
            disabled={!isMyTurn || submitting}
            style={{
              padding: '12px 8px', borderRadius: '14px',
              background: isMyTurn ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
              border: isMyTurn ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.06)',
              color: isMyTurn ? '#f87171' : '#334155',
              fontSize: '12px', fontWeight: 800,
              cursor: isMyTurn && !submitting ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            }}>
            <span style={{ fontSize: '16px' }}>❌</span>
            <span>Pack</span>
            <span style={{ fontSize: '9px', opacity: 0.55 }}>Fold</span>
          </button>

          {/* Sideshow (≥3 active, isSeen) — or Show (2 active) */}
          {activeCount === 2 ? (
            <button type="button"
              onClick={() => sendAction('show')}
              disabled={!isMyTurn || submitting}
              style={{
                padding: '12px 8px', borderRadius: '14px',
                background: isMyTurn
                  ? 'linear-gradient(135deg,rgba(245,158,11,0.28),rgba(217,119,6,0.18))'
                  : 'rgba(255,255,255,0.03)',
                border: isMyTurn ? '1px solid rgba(245,158,11,0.45)' : '1px solid rgba(255,255,255,0.06)',
                color: isMyTurn ? '#fcd34d' : '#334155',
                fontSize: '12px', fontWeight: 800,
                cursor: isMyTurn && !submitting ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              }}>
              <span style={{ fontSize: '16px' }}>🤝</span>
              <span>Show</span>
              <span style={{ fontSize: '9px', opacity: 0.55 }}>Reveal</span>
            </button>
          ) : (
            <button type="button"
              onClick={() => sendAction('sideshow')}
              disabled={!isMyTurn || submitting || !isSeen || activeCount < 3}
              style={{
                padding: '12px 8px', borderRadius: '14px',
                background: isMyTurn && isSeen && activeCount >= 3
                  ? 'rgba(168,85,247,0.14)' : 'rgba(255,255,255,0.03)',
                border: isMyTurn && isSeen && activeCount >= 3
                  ? '1px solid rgba(168,85,247,0.35)' : '1px solid rgba(255,255,255,0.06)',
                color: isMyTurn && isSeen && activeCount >= 3 ? '#c084fc' : '#334155',
                fontSize: '12px', fontWeight: 800,
                cursor: isMyTurn && isSeen && activeCount >= 3 && !submitting ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              }}>
              <span style={{ fontSize: '16px' }}>🔀</span>
              <span>Sideshow</span>
              <span style={{ fontSize: '9px', opacity: 0.55 }}>Compare</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          (f) ALERT STRIP
      ═══════════════════════════════════════════════════════════════ */}
      {alertMsg && (
        <div style={{
          padding: '10px 14px', borderRadius: '12px',
          fontSize: '12px', fontWeight: 700, textAlign: 'center',
          background: alertError ? 'rgba(239,68,68,0.12)' : 'rgba(52,211,153,0.12)',
          border: `1px solid ${alertError ? 'rgba(239,68,68,0.4)' : 'rgba(52,211,153,0.4)'}`,
          color: alertError ? '#f87171' : '#34d399',
          animation: 'tpFadeIn 0.2s ease',
        }}>
          {alertMsg}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          (g) TABS: Game Info / Round History
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { key: 'game',    label: 'Game Info' },
            { key: 'history', label: 'History'   },
          ].map(({ key, label }) => {
            const act = activeTab === key;
            return (
              <button key={key} type="button"
                onClick={() => { setActiveTab(key); if (key === 'history') loadHistory(); }}
                style={{
                  flex: 1, padding: '12px 4px', background: 'none', border: 'none',
                  borderBottom: act ? '2px solid #dc2626' : '2px solid transparent',
                  color: act ? '#fca5a5' : '#64748b',
                  fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                  transition: 'color 0.15s',
                }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ padding: '12px', maxHeight: '280px', overflowY: 'auto' }}>

          {/* ── Game Info ── */}
          {activeTab === 'game' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { label: 'Min Bet',  value: tableState ? `₹${tableState.minBet  ?? '—'}` : '—' },
                  { label: 'Max Bet',  value: tableState ? `₹${tableState.maxBet  ?? '—'}` : '—' },
                  { label: 'Players',  value: `${seats.filter(s => s?.userId).length} / 6`         },
                  { label: 'Active',   value: String(activeCount)                                   },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '9px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#94a3b8', marginTop: '2px' }}>{value}</div>
                  </div>
                ))}
              </div>

              {lastWinner && (
                <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(252,211,77,0.07)', border: '1px solid rgba(252,211,77,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#92400e', fontWeight: 700, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Winner</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#fcd34d' }}>🏆 {lastWinner.displayName || 'Player'}</div>
                </div>
              )}

              {wallet && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '11px', color: '#334155', fontWeight: 700 }}>Balance</span>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#94a3b8' }}>
                    ₹{Number(wallet.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Round History ── */}
          {activeTab === 'history' && (
            roundHistory.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#334155', fontSize: '12px', padding: '20px 0' }}>
                No rounds yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {roundHistory.map((r, i) => (
                  <div key={r.roundId || i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>
                      #{r.roundNumber ?? i + 1}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#fcd34d' }}>
                      {r.winner?.displayName || '—'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#334155' }}>
                      {r.winner?.amount != null ? `₹${r.winner.amount}` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes tpPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.75); }
        }
        @keyframes tpFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TeenPattiGame;
