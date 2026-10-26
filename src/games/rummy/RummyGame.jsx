/**
 * RummyGame.jsx — Indian Rummy table UI component.
 *
 * Renders the active game table for a given tableId:
 *  - Shows all seated players and their card counts
 *  - Shows the current player's 13 cards
 *  - Draw from closed pile / open pile
 *  - Discard selected card
 *  - Declare (opens declare modal)
 *  - Drop from current round
 *
 * Real-time updates via Socket.IO (rummy:* events).
 * API prefix: /api/v1/games/rummy
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { socket }  from '../../services/socket.js';
import { api }     from '../../services/api.js';

// ── Card helpers ──────────────────────────────────────────────────────────────
const SUIT_SYMBOL = { SPADES: '♠', HEARTS: '♥', DIAMONDS: '♦', CLUBS: '♣', JOKER: '🃏' };
const SUIT_COLOR  = {
  HEARTS: '#ef4444', DIAMONDS: '#ef4444',
  SPADES: '#f1f5f9', CLUBS:    '#f1f5f9',
  JOKER:  '#fbbf24',
};

const CardFace = ({ card, selected, faceDown, onClick, compact }) => {
  if (faceDown || !card) {
    return (
      <div onClick={onClick}
        style={{
          width: compact ? 36 : 52, height: compact ? 52 : 74,
          borderRadius: 8,
          background: 'linear-gradient(135deg,#1e293b,#0f172a)',
          border: '2px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: compact ? 14 : 20, color: '#334155',
          cursor: onClick ? 'pointer' : 'default',
          flexShrink: 0,
        }}>
        🂠
      </div>
    );
  }
  const color  = SUIT_COLOR[card.suit]  || '#f1f5f9';
  const symbol = SUIT_SYMBOL[card.suit] || card.suit;
  const rank   = card.rank === 'JOKER' ? '' : card.rank;
  return (
    <div onClick={onClick}
      style={{
        width: compact ? 36 : 52, height: compact ? 52 : 74,
        borderRadius: 8,
        background: selected
          ? 'linear-gradient(135deg,#1e3a5f,#1e2e48)'
          : 'linear-gradient(135deg,#1e293b,#162032)',
        border: selected
          ? '2px solid #60a5fa'
          : `2px solid ${color}33`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: selected
          ? '0 0 14px rgba(96,165,250,0.5)'
          : `0 2px 8px rgba(0,0,0,0.4)`,
        gap: 2, cursor: onClick ? 'pointer' : 'default',
        transform: selected ? 'translateY(-8px)' : 'none',
        transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
        flexShrink: 0,
        userSelect: 'none',
      }}>
      <span style={{ fontSize: compact ? 11 : 16, fontWeight: 900, color, lineHeight: 1 }}>{rank}</span>
      <span style={{ fontSize: compact ? 12 : 18, lineHeight: 1, color }}>{symbol}</span>
    </div>
  );
};

// ── Meld badge ────────────────────────────────────────────────────────────────
const MELD_COLORS = {
  PURE_SEQUENCE:   { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.35)', color: '#34d399', label: 'Pure Seq' },
  IMPURE_SEQUENCE: { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.35)', color: '#60a5fa', label: 'Seq' },
  SET:             { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.35)', color: '#c084fc', label: 'Set' },
};

// ─────────────────────────────────────────────────────────────────────────────
export const RummyGame = ({ tableId }) => {
  const { user, wallet, refreshWallet } = useAuth();

  const [tableState,  setTableState]  = useState(null);
  const [myHand,      setMyHand]      = useState([]);
  const [openCard,    setOpenCard]    = useState(null);   // top of open pile
  const [myTurn,      setMyTurn]      = useState(false);
  const [hasDrawn,    setHasDrawn]    = useState(false);  // drawn this turn?
  const [roundStatus, setRoundStatus] = useState(null);
  const [roundResult, setRoundResult] = useState(null);

  const [selectedCards, setSelectedCards] = useState(new Set()); // indices
  const [discardCardId, setDiscardCardId] = useState(null);      // stable cardId selection (immune to hand reloads)

  // Declare modal
  const [showDeclare, setShowDeclare] = useState(false);
  const [declareGroups, setDeclareGroups] = useState([[], [], [], []]);

  // Settlement state — populated by rummy:round:settled socket event.
  // Canonical F4 field names: settlement.winner (string userId), settlement.payouts.winnerPayout.
  const [settlement, setSettlement] = useState(null);
  const [phase,      setPhase]      = useState('waiting');

  const [loading,   setLoading]   = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [msg,       setMsg]       = useState({ text: '', error: false });

  const pollingRef = useRef(null);

  const flash = (text, error = false) => {
    setMsg({ text, error });
    setTimeout(() => setMsg({ text: '', error: false }), 5000);
  };

  // ── Load table state ────────────────────────────────────────────────────────
  const loadTable = useCallback(async () => {
    try {
      const res = await api.get(`/games/rummy/tables/${tableId}`);
      if (res.data?.success) {
        const t = res.data.data;
        setTableState(t);
        setOpenCard(t.openPileTop || null);
        setRoundStatus(t.roundStatus || t.status);
        if (t.roundResult) setRoundResult(t.roundResult);
      }
    } catch {}
  }, [tableId]);

  // ── Load my hand ────────────────────────────────────────────────────────────
  const loadHand = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get(`/games/rummy/tables/${tableId}/hand`);
      if (res.data?.success) {
        setMyHand(res.data.data?.cards || []);
        setHasDrawn(res.data.data?.drawnThisTurn || false);
      }
    } catch {}
  }, [tableId, user]);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadTable(), loadHand()]);
      setLoading(false);
    };
    init();
  }, [loadTable, loadHand]);

  // ── Polling (fallback) ──────────────────────────────────────────────────────
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      loadTable();
      if (user) loadHand();
    }, 5000);
    return () => clearInterval(pollingRef.current);
  }, [loadTable, loadHand, user]);

  // ── Socket.IO events ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    socket.emit('rummy:join:table', { tableId });

    const onRoundStarted = (data) => {
      setRoundStatus('IN_PROGRESS');
      setRoundResult(null);
      setSelectedCards(new Set());
      setDiscardCardId(null);
      setHasDrawn(false);
      loadHand();
      loadTable();
    };

    const onTurnStarted = (data) => {
      const isMe = String(data?.userId) === String(user?._id || user?.id);
      setMyTurn(isMe);
      setHasDrawn(false);
      loadTable();
    };

    const onPlayerDrew = (data) => {
      if (String(data?.userId) === String(user?._id || user?.id)) {
        loadHand();
        setHasDrawn(true);
      }
      // Use explicit undefined check so null (empty pile) correctly clears openCard
      // instead of falling through to the stale value via the || operator.
      setOpenCard(data?.newOpenTop !== undefined ? data.newOpenTop : openCard);
      loadTable();
    };

    const onPlayerDiscarded = (data) => {
      setOpenCard(data?.card !== undefined ? data.card : openCard);
      if (String(data?.userId) === String(user?._id || user?.id)) {
        loadHand();
        setMyTurn(false);
        setHasDrawn(false);
      }
      loadTable();
    };

    const onRoundResult = (data) => {
      setRoundStatus('SETTLING');
      setRoundResult(data);
      loadTable();
      refreshWallet?.();
    };

    const onRoundSettled = (data) => {
      // data.winner — string userId of winner (F4 canonical field)
      // data.payouts.winnerPayout — winner's net payout (F4 canonical field)
      setSettlement(data);
      setPhase('settled');
      setRoundStatus('SETTLED');
      loadTable();
      refreshWallet?.();
    };

    const onDeclareInvalid = (data) => {
      flash(
        `Invalid declaration: ${data?.reason || 'melds not valid'} — ${data?.penalty ?? 80}-pt penalty applied`,
        true,
      );
    };

    socket.on('rummy:round:started',    onRoundStarted);
    socket.on('rummy:turn:started',     onTurnStarted);
    socket.on('rummy:player:drew',      onPlayerDrew);
    socket.on('rummy:player:discarded', onPlayerDiscarded);
    socket.on('rummy:round:result',     onRoundResult);
    socket.on('rummy:round:settled',    onRoundSettled);
    socket.on('rummy:declare:invalid',  onDeclareInvalid);

    return () => {
      socket.emit('rummy:leave:table', { tableId });
      socket.off('rummy:round:started',    onRoundStarted);
      socket.off('rummy:turn:started',     onTurnStarted);
      socket.off('rummy:player:drew',      onPlayerDrew);
      socket.off('rummy:player:discarded', onPlayerDiscarded);
      socket.off('rummy:round:result',     onRoundResult);
      socket.off('rummy:round:settled',    onRoundSettled);
      socket.off('rummy:declare:invalid',  onDeclareInvalid);
    };
  }, [tableId, user, openCard, loadTable, loadHand, refreshWallet]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const drawCard = async (source) => {
    if (actionBusy || hasDrawn) return;
    setActionBusy(true);
    // Normalise to server enum values ('open' | 'closed')
    const serverSource = source === 'OPEN_PILE' ? 'open' : 'closed';
    try {
      const res = await api.post(`/games/rummy/tables/${tableId}/draw`, { source: serverSource });
      if (res.data?.success) {
        setHasDrawn(true);
        setMyHand(res.data.data?.hand || myHand);
        if (source === 'OPEN_PILE' || source === 'open') setOpenCard(res.data.data?.newOpenTop || null);
      }
    } catch (e) {
      flash(e.response?.data?.message || 'Draw failed', true);
    } finally { setActionBusy(false); }
  };

  const discardCard = async () => {
    if (actionBusy || !hasDrawn || discardCardId === null) return;
    setActionBusy(true);
    try {
      const card = myHand.find(c => c.cardId === discardCardId);
      if (!card) { flash('Selected card no longer in hand — re-select', true); setDiscardCardId(null); setActionBusy(false); return; }
      const res = await api.post(`/games/rummy/tables/${tableId}/discard`, {
        card: { cardId: card.cardId, suit: card.suit, rank: card.rank },
      });
      if (res.data?.success) {
        setDiscardCardId(null);
        setMyHand(res.data.data?.hand || myHand);
        setOpenCard(card);
        setMyTurn(false);
        setHasDrawn(false);
      }
    } catch (e) {
      flash(e.response?.data?.message || 'Discard failed', true);
    } finally { setActionBusy(false); }
  };

  const dropFromRound = async () => {
    if (!window.confirm('Drop from this round? You will receive a penalty.')) return;
    setActionBusy(true);
    try {
      const res = await api.post(`/games/rummy/tables/${tableId}/drop`);
      if (res.data?.success) {
        flash('You have dropped from this round');
        setMyTurn(false);
        loadTable();
      }
    } catch (e) {
      flash(e.response?.data?.message || 'Drop failed', true);
    } finally { setActionBusy(false); }
  };

  const submitDeclare = async () => {
    const flatCards = declareGroups.flat();
    if (flatCards.length !== myHand.length) {
      flash(`Arrange all ${myHand.length} cards into groups first`, true);
      return;
    }
    setActionBusy(true);
    try {
      const melds = declareGroups.filter(g => g.length > 0).map(g => ({
        cards: g.map(c => ({ cardId: c.cardId, rank: c.rank, suit: c.suit, isJoker: c.isJoker ?? false })),
      }));
      const res = await api.post(`/games/rummy/tables/${tableId}/declare`, { melds });
      if (res.data?.success) {
        setShowDeclare(false);
        flash('Declaration submitted!');
        loadTable();
        loadHand();
      }
    } catch (e) {
      flash(e.response?.data?.message || 'Declaration failed', true);
    } finally { setActionBusy(false); }
  };

  // ── Card selection ────────────────────────────────────────────────────────
  const toggleDiscard = (idx) => {
    setDiscardCardId(prev => prev === myHand[idx]?.cardId ? null : myHand[idx]?.cardId);
  };

  // ── Determine my status in round ─────────────────────────────────────────
  const myId = String(user?._id || user?.id || '');
  const myPlayer = tableState?.players?.find(p => String(p.userId) === myId);
  const isDropped = myPlayer?.status === 'DROPPED';

  // ── Start round button ────────────────────────────────────────────────────
  const startRound = async () => {
    setActionBusy(true);
    try {
      const res = await api.post(`/games/rummy/tables/${tableId}/start`);
      if (res.data?.success) { flash('Round started!'); loadTable(); loadHand(); }
    } catch (e) {
      flash(e.response?.data?.message || 'Start failed', true);
    } finally { setActionBusy(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(52,211,153,0.15)', borderTopColor: '#34d399', animation: 'rummySpinAnim 0.7s linear infinite' }}/>
        <style>{`@keyframes rummySpinAnim { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isWaiting    = !roundStatus || roundStatus === 'WAITING' || roundStatus === 'WAITING_FOR_PLAYERS';
  const isInProgress = roundStatus === 'IN_PROGRESS' || roundStatus === 'DEALING' || roundStatus === 'ACTIVE';
  const isSettled    = roundStatus === 'SETTLED' || roundStatus === 'SETTLING' || roundStatus === 'COMPLETED' || roundStatus === 'FINISHED';
  const players      = tableState?.players || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px', margin: '0 auto' }}>

      {/* Flash message */}
      {msg.text && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: msg.error ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)', border: `1px solid ${msg.error ? 'rgba(239,68,68,0.25)' : 'rgba(52,211,153,0.25)'}`, color: msg.error ? '#f87171' : '#34d399', fontSize: '12px', fontWeight: 600 }}>
          {msg.text}
        </div>
      )}

      {/* Players row */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0' }}>
        {players.map((p, i) => {
          const isMe = String(p.userId) === myId;
          return (
            <div key={i} style={{
              background: isMe ? 'rgba(52,211,153,0.08)' : 'rgba(15,23,42,0.8)',
              border: `1px solid ${isMe ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '10px', padding: '8px 12px', flexShrink: 0,
              textAlign: 'center', minWidth: '80px',
            }}>
              <div style={{ fontSize: '16px', marginBottom: '3px' }}>
                {p.status === 'DROPPED' ? '🚪' : isMe ? '🙋' : '🧑'}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: isMe ? '#34d399' : '#94a3b8', maxWidth: '72px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isMe ? 'You' : (p.displayName || p.username || '—')}
              </div>
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '3px' }}>
                {p.cardCount ?? '?'} cards
              </div>
            </div>
          );
        })}
      </div>

      {/* Game area */}
      <div style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.95),rgba(10,16,30,0.9))', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>

        {/* Piles + status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>

          {/* Closed pile */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <CardFace card={null} faceDown onClick={myTurn && !hasDrawn && !isDropped ? () => drawCard('CLOSED_PILE') : undefined} />
            <span style={{ fontSize: '9px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Deck</span>
          </div>

          {/* Status badge */}
          <div style={{ textAlign: 'center' }}>
            {isWaiting && (
              <div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Waiting for players…</div>
                {user && tableState && (() => {
                  const myPlayer = players.find(p => String(p.userId) === myId);
                  return myPlayer?.seatNumber === 1; // only the creator (seat 1) can start
                })() && (
                  <button onClick={startRound} disabled={actionBusy || players.length < 2}
                    style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: actionBusy || players.length < 2 ? 'not-allowed' : 'pointer', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }}>
                    Start Round
                  </button>
                )}
              </div>
            )}
            {isInProgress && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '12px', padding: '5px 12px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'rummyPulse 1.5s infinite' }}/>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>
                  {myTurn ? 'YOUR TURN' : 'IN PROGRESS'}
                </span>
              </div>
            )}
            {isSettled && (roundResult || settlement) && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#fbbf24', marginBottom: '4px' }}>
                  Round Settled
                </div>
                {/* Prefer canonical settlement.winner (string userId) from rummy:round:settled */}
                {settlement?.winner && (
                  <>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Winner:{' '}
                      <span style={{ color: '#34d399', fontWeight: 700 }}>
                        {settlement.winner === myId ? 'You' : settlement.winner}
                      </span>
                    </div>
                    {settlement.payouts?.winnerPayout != null && (
                      <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '4px' }}>
                        Payout: ₹{settlement.payouts.winnerPayout}
                      </div>
                    )}
                  </>
                )}
                {/* Fallback to roundResult when settlement not yet available */}
                {!settlement?.winner && roundResult?.winner && (
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Winner:{' '}
                    <span style={{ color: '#34d399', fontWeight: 700 }}>
                      {String(roundResult.winner.userId || roundResult.winner) === myId
                        ? 'You'
                        : roundResult.winner.displayName || String(roundResult.winner.userId || roundResult.winner)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Open pile */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <CardFace card={openCard} onClick={myTurn && !hasDrawn && !isDropped ? () => drawCard('OPEN_PILE') : undefined} />
            <span style={{ fontSize: '9px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Open</span>
          </div>
        </div>

        {/* My hand */}
        {myHand.length > 0 && (
          <div>
            <div style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Your Hand ({myHand.length} cards)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
              {myHand.map((card, idx) => (
                <CardFace
                  key={idx}
                  card={card}
                  selected={discardCardId === card?.cardId}
                  onClick={() => hasDrawn && !isDropped ? toggleDiscard(idx) : undefined}
                />
              ))}
            </div>

            {/* Action buttons */}
            {myTurn && !isDropped && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {!hasDrawn && (
                  <>
                    <button onClick={() => drawCard('CLOSED_PILE')} disabled={actionBusy}
                      style={{ padding: '8px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '11px', cursor: actionBusy ? 'not-allowed' : 'pointer', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa' }}>
                      Draw Deck
                    </button>
                    <button onClick={() => drawCard('OPEN_PILE')} disabled={actionBusy || !openCard}
                      style={{ padding: '8px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '11px', cursor: (actionBusy || !openCard) ? 'not-allowed' : 'pointer', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc' }}>
                      Pick Open
                    </button>
                  </>
                )}
                {hasDrawn && (
                  <>
                    <button onClick={discardCard} disabled={actionBusy || discardCardId === null}
                      style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '11px', cursor: (actionBusy || discardCardId === null) ? 'not-allowed' : 'pointer', background: discardCardId !== null ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.02)', border: `1px solid ${discardCardId !== null ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)'}`, color: discardCardId !== null ? '#fbbf24' : '#475569' }}>
                      {discardCardId !== null ? `Discard ${myHand.find(c=>c.cardId===discardCardId)?.rank}${SUIT_SYMBOL[myHand.find(c=>c.cardId===discardCardId)?.suit]||''}` : 'Select to Discard'}
                    </button>
                    <button onClick={() => setShowDeclare(true)} disabled={actionBusy}
                      style={{ padding: '8px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '11px', cursor: actionBusy ? 'not-allowed' : 'pointer', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }}>
                      Declare
                    </button>
                  </>
                )}
                <button onClick={dropFromRound} disabled={actionBusy}
                  style={{ padding: '8px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '11px', cursor: actionBusy ? 'not-allowed' : 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                  Drop
                </button>
              </div>
            )}
          </div>
        )}

        {/* Not seated */}
        {user && myHand.length === 0 && !players.some(p => String(p.userId) === myId) && isInProgress && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#475569', fontSize: '12px' }}>
            You are not in this round. Wait for the next round.
          </div>
        )}
      </div>

      {/* ── Declare modal ── */}
      {showDeclare && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowDeclare(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'linear-gradient(135deg,#0f172a,#0a1020)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px 16px 0 0', padding: '20px', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>🃏 Declare — Arrange Cards into Melds</span>
              <button onClick={() => setShowDeclare(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '14px' }}>
              Drag cards below or select them and tap a group to assign. Need ≥2 sequences (1 pure).
            </div>

            {/* Unassigned cards */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Unassigned Cards</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {myHand.map((card, idx) => {
                  const assigned = declareGroups.some(g => g.some(c => c === card));
                  return !assigned ? (
                    <CardFace key={idx} card={card} compact
                      selected={selectedCards.has(idx)}
                      onClick={() => {
                        const next = new Set(selectedCards);
                        if (next.has(idx)) next.delete(idx); else next.add(idx);
                        setSelectedCards(next);
                      }}
                    />
                  ) : null;
                })}
              </div>
            </div>

            {/* Groups */}
            {declareGroups.map((group, gi) => {
              const meldColor = Object.values(MELD_COLORS)[gi % 3];
              return (
                <div key={gi} style={{ background: meldColor.bg, border: `1px solid ${meldColor.border}`, borderRadius: '10px', padding: '10px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: meldColor.color, textTransform: 'uppercase' }}>Group {gi + 1}</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => {
                        if (selectedCards.size === 0) return;
                        const newGroups = declareGroups.map((g, i) => i === gi ? [...g, ...Array.from(selectedCards).map(si => myHand[si])] : g);
                        setDeclareGroups(newGroups);
                        setSelectedCards(new Set());
                      }} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '5px', cursor: 'pointer', background: meldColor.bg, border: `1px solid ${meldColor.border}`, color: meldColor.color, fontWeight: 700 }}>
                        + Add Selected
                      </button>
                      <button onClick={() => {
                        const newGroups = declareGroups.map((g, i) => i === gi ? [] : g);
                        setDeclareGroups(newGroups);
                      }} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '5px', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                        Clear
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', minHeight: '52px' }}>
                    {group.map((card, ci) => (
                      <CardFace key={ci} card={card} compact onClick={() => {
                        const newGroups = declareGroups.map((g, i) => i === gi ? g.filter((_, j) => j !== ci) : g);
                        setDeclareGroups(newGroups);
                      }} />
                    ))}
                  </div>
                </div>
              );
            })}

            <button onClick={submitDeclare} disabled={actionBusy}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: 900, fontSize: '14px', cursor: actionBusy ? 'not-allowed' : 'pointer', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399', marginTop: '8px' }}>
              {actionBusy ? 'Submitting…' : '✓ Submit Declaration'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes rummyPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.8); } }
      `}</style>
    </div>
  );
};

export default RummyGame;
