import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Info } from 'lucide-react';
import { TeenPattiGame } from '../games/teenpatti/TeenPattiGame.jsx';
import { api } from '../services/api.js';

// ── Lobby (shown when no tableId in query) ────────────────────────────────────
const TeenPattiLobby = () => {
  const navigate = useNavigate();
  const [tables,  setTables]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/games/teenpatti/tables');
        if (res.data?.success) setTables(res.data.data || []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const STATUS_COLOR = {
    WAITING: '#fbbf24',
    ACTIVE:  '#34d399',
    FULL:    '#f87171',
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>🃏 Teen Patti</div>
        <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>Select a table to join</div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(220,38,38,0.2)', borderTopColor: '#dc2626', animation: 'tpLobbySpinAnim 0.8s linear infinite' }}/>
        </div>
      ) : tables.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#334155', fontSize: '14px' }}>
          No tables available right now. Check back soon!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: '12px' }}>
          {tables.map(table => {
            const tableId = table._id || table.id;
            const sc = STATUS_COLOR[table.status] || '#94a3b8';
            return (
              <button key={tableId} type="button"
                onClick={() => navigate(`/teenpatti?tableId=${tableId}`)}
                style={{
                  background: 'linear-gradient(135deg,rgba(15,23,42,0.9),rgba(9,14,30,0.85))',
                  border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: '16px', padding: '16px',
                  cursor: 'pointer', textAlign: 'left',
                  color: '#fff', transition: 'border-color 0.15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#fcd34d' }}>
                    Table #{table.tableNumber}
                  </span>
                  <span style={{
                    fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 800,
                    background: `${sc}18`, border: `1px solid ${sc}40`, color: sc,
                  }}>
                    {table.status}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px' }}>👥</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                    {table.playerCount ?? 0} / {table.maxPlayers ?? 6} players
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                  Min Bet: <span style={{ color: '#34d399', fontWeight: 800 }}>₹{table.minBet ?? '—'}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes tpLobbySpinAnim { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ── Page wrapper ──────────────────────────────────────────────────────────────
export const TeenPattiPage = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const tableId        = searchParams.get('tableId');

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

      {/* ── Game sub-header bar ── */}
      <div style={{
        position: 'sticky',
        top: '61px',
        zIndex: 50,
        background: 'linear-gradient(135deg, #1a0505 0%, #180810 50%, #0a1020 100%)',
        borderBottom: '1px solid rgba(220,38,38,0.2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
      }}>

        {/* Left: Back button */}
        <button
          onClick={() => tableId ? navigate('/teenpatti') : navigate('/')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: '#cbd5e1',
            padding: '6px 12px',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            flexShrink: 0, transition: 'all 0.15s',
          }}>
          <ChevronLeft size={14} /> Back
        </button>

        {/* Centre: Game title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🃏</span>
            <span style={{
              fontSize: '14px', fontWeight: 900, letterSpacing: '0.3px',
              background: 'linear-gradient(90deg,#dc2626,#f59e0b,#16a34a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Teen Patti
            </span>
          </div>
          <span style={{ fontSize: '9px', color: '#475569', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '1px' }}>
            {tableId ? `Table · ${tableId.slice(-6).toUpperCase()}` : 'Live Card Game'}
          </span>
        </div>

        {/* Right: Live badge (in-game) or info icon (lobby) */}
        {tableId ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.35)',
            borderRadius: '20px', padding: '5px 10px', flexShrink: 0,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', animation: 'tpPagePulseAnim 1.5s infinite', display: 'inline-block' }}/>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', whiteSpace: 'nowrap' }}>LIVE</span>
          </div>
        ) : (
          <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '10px', flexShrink: 0 }}>
            <Info size={16} color="#fca5a5"/>
          </div>
        )}
      </div>

      {/* Accent gradient line */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg,#dc2626,#f59e0b,#16a34a,#dc2626)', opacity: 0.85 }}/>

      {/* Page content */}
      <div style={{ padding: tableId ? '10px 10px 24px' : '0 0 24px' }}>
        {tableId
          ? <TeenPattiGame tableId={tableId} />
          : <TeenPattiLobby />
        }
      </div>

      <style>{`
        @keyframes tpPagePulseAnim {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
};

export default TeenPattiPage;
