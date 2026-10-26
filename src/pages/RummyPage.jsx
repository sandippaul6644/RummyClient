import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Info } from 'lucide-react';
import { RummyGame } from '../games/rummy/RummyGame.jsx';
import { useAuth }   from '../context/AuthContext.jsx';
import { api }       from '../services/api.js';
import { socket }    from '../services/socket.js';

// ── Lobby ──────────────────────────────────────────────────────────────────────
const RummyLobby = () => {
  const navigate = useNavigate();
  const { user, setIsAuthModalOpen } = useAuth();
  const [tables,  setTables]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/games/rummy/tables');
        if (res.data?.success) setTables(res.data.data?.tables || res.data.data || []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
    const tid = setInterval(load, 8000);

    // Join global rummy room for real-time table updates
    if (socket) {
      socket.emit('game:join', { gameSlug: 'rummy' });
      const onTableCreated = (data) => {
        if (!data?.tableId) return;
        setTables(prev => {
          if (prev.some(t => (t.tableId || t._id) === data.tableId)) return prev;
          return [data, ...prev];
        });
      };
      socket.on('rummy:table:created', onTableCreated);
      return () => {
        clearInterval(tid);
        socket.emit('game:leave', { gameSlug: 'rummy' });
        socket.off('rummy:table:created', onTableCreated);
      };
    }

    return () => clearInterval(tid);
  }, []);

  const joinAndNavigate = async (tableId) => {
    if (!user) { setIsAuthModalOpen?.(true); return; }
    try {
      await api.post(`/games/rummy/tables/${tableId}/join`);
    } catch (e) {
      // If already joined (409) or some other error, still navigate — game view will handle it
      if (e.response?.status !== 409) {
        // Non-seat-conflict error — show flash and abort
        console.error('[RummyLobby] join failed:', e.response?.data?.message || e.message);
        return;
      }
    }
    navigate(`/rummy?tableId=${tableId}`);
  };

  const createAndJoin = async () => {
    if (!user) { setIsAuthModalOpen?.(true); return; }
    setCreating(true);
    try {
      const res = await api.post('/games/rummy/tables', {
        displayName: user.username || user.name || 'Player',
      });
      if (res.data?.success) {
        const tableId = res.data.data?.table?.tableId || res.data.data?.tableId;
        if (tableId) navigate(`/rummy?tableId=${tableId}`);
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Could not create table');
    } finally { setCreating(false); }
  };

  const STATUS_COLOR = { WAITING: '#fbbf24', ACTIVE: '#34d399', SETTLING: '#a855f7', COMPLETED: '#64748b', CANCELLED: '#f87171' };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>🃏 Indian Rummy</div>
          <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>13-card points rummy — join or create a table</div>
        </div>
        <button
          onClick={createAndJoin}
          disabled={creating}
          style={{
            padding: '10px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '12px',
            cursor: creating ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg,rgba(52,211,153,0.2),rgba(16,185,129,0.15))',
            border: '1px solid rgba(52,211,153,0.4)', color: '#34d399',
          }}>
          {creating ? '…' : '+ New Table'}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(52,211,153,0.2)', borderTopColor: '#34d399', animation: 'rummyLobbySpinAnim 0.8s linear infinite' }}/>
        </div>
      ) : tables.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#334155', fontSize: '14px' }}>
          No tables available. Create one to start!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: '12px' }}>
          {tables.map(table => {
            const tableId = table.tableId || table._id;
            const sc = STATUS_COLOR[table.status] || '#94a3b8';
            const playerCount = Array.isArray(table.players) ? table.players.length : (table.playerCount ?? 0);
            return (
              <button key={tableId} type="button"
                onClick={() => joinAndNavigate(tableId)}
                style={{
                  background: 'linear-gradient(135deg,rgba(15,23,42,0.9),rgba(9,14,30,0.85))',
                  border: '1px solid rgba(52,211,153,0.15)',
                  borderRadius: '16px', padding: '16px',
                  cursor: 'pointer', textAlign: 'left',
                  color: '#fff',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#34d399' }}>
                    Table #{table.tableId ? table.tableId.slice(-6).toUpperCase() : '——'}
                  </span>
                  <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 800, background: `${sc}18`, border: `1px solid ${sc}40`, color: sc }}>
                    {table.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px' }}>👥</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                    {Array.isArray(table.seats) ? table.seats.length : (table.playerCount ?? 0)}
                    {' '}/ {table.configSnapshot?.maxPlayers ?? table.config?.maxPlayers ?? 6} players
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                  Entry: <span style={{ color: '#fbbf24', fontWeight: 800 }}>₹{table.configSnapshot?.entryFee ?? table.config?.entryFee ?? '—'}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* How to play */}
      <div style={{ marginTop: '24px', background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.12)', borderRadius: '14px', padding: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', marginBottom: '10px' }}>How to Play</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#64748b' }}>
          <span>🃏 13 cards are dealt to each player.</span>
          <span>♻️ Take turns drawing (deck or open pile) and discarding.</span>
          <span>🎯 Form valid melds: at least 2 sequences (1 must be pure).</span>
          <span>✅ Declare to win — be the first to arrange all cards into valid melds.</span>
          <span>🚪 Drop early (20 pts) or mid-game (40 pts) if your hand is weak.</span>
        </div>
      </div>

      <style>{`
        @keyframes rummyLobbySpinAnim { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ── Page wrapper ───────────────────────────────────────────────────────────────
export const RummyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const tableId        = searchParams.get('tableId');

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

      {/* Sub-header */}
      <div style={{
        position: 'sticky', top: '61px', zIndex: 50,
        background: 'linear-gradient(135deg, #030e07 0%, #051509 50%, #04100a 100%)',
        borderBottom: '1px solid rgba(52,211,153,0.2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
      }}>

        {/* Back */}
        <button onClick={() => tableId ? navigate('/rummy') : navigate('/')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#cbd5e1', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          <ChevronLeft size={14} /> Back
        </button>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🃏</span>
            <span style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.3px', background: 'linear-gradient(90deg,#34d399,#22d3ee,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Indian Rummy
            </span>
          </div>
          <span style={{ fontSize: '9px', color: '#475569', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '1px' }}>
            {tableId ? `Table · ${tableId.slice(-6).toUpperCase()}` : '13-Card Points Rummy'}
          </span>
        </div>

        {/* Live / info badge */}
        {tableId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)', borderRadius: '20px', padding: '5px 10px', flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', animation: 'rummyPagePulse 1.5s infinite', display: 'inline-block' }}/>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', whiteSpace: 'nowrap' }}>LIVE</span>
          </div>
        ) : (
          <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '10px', flexShrink: 0 }}>
            <Info size={16} color="#6ee7b7"/>
          </div>
        )}
      </div>

      {/* Accent strip */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg,#34d399,#22d3ee,#10b981,#34d399)', opacity: 0.85 }}/>

      {/* Content */}
      <div style={{ padding: tableId ? '10px 10px 24px' : '0 0 24px' }}>
        {tableId ? <RummyGame tableId={tableId} /> : <RummyLobby />}
      </div>

      <style>{`
        @keyframes rummyPagePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
};

export default RummyPage;
