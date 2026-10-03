import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { sound } from '../utils/sound.js';
import { History, ArrowDownRight, ArrowUpRight, Coins, Trophy, RefreshCw, Filter } from 'lucide-react';

export const Transactions = () => {
  const { user, wallet } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchTxs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wallet/transactions?limit=100');
      if (res.data?.success) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTxs();
    }
  }, [user]);

  const filtered = transactions.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'deposits') return t.type === 'deposit';
    if (filter === 'withdrawals') return t.type === 'withdrawal';
    if (filter === 'bets') return t.type === 'bet_placed';
    if (filter === 'wins') return t.type === 'bet_won';
    return true;
  });

  const getTypeBadge = (type) => {
    switch (type) {
      case 'deposit':
        return <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>DEPOSIT</span>;
      case 'withdrawal':
        return <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>WITHDRAWAL</span>;
      case 'bet_won':
        return <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>BET WON</span>;
      case 'bet_placed':
        return <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>BET PLACED</span>;
      default:
        return <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>{type}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px 10px 36px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Available Balance</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 900, color: '#34d399', marginTop: '4px' }}>
            ₹{wallet ? Number(wallet.balance).toFixed(2) : '0.00'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Total Deposited</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 900, color: '#818cf8', marginTop: '4px' }}>
            ₹{wallet ? Number(wallet.totalDeposited || 0).toFixed(2) : '0.00'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Total Wagered</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 900, color: '#cbd5e1', marginTop: '4px' }}>
            ₹{wallet ? Number(wallet.totalWagered || 0).toFixed(2) : '0.00'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Total Won</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 900, color: '#fbbf24', marginTop: '4px' }}>
            ₹{wallet ? Number(wallet.totalWon || 0).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={18} color="#818cf8" /> Transaction Ledger
            </h2>
          </div>

          <div className="no-scrollbar" style={{ display: 'flex', gap: '6px', alignItems: 'center', overflowX: 'auto', maxWidth: '100%', paddingBottom: '2px' }}>
            {['all', 'deposits', 'withdrawals', 'bets', 'wins'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => { sound.playClick(); setFilter(f); }}
                style={{
                  flex: '1 0 auto',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: filter === f ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.05)',
                  border: filter === f ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                  color: filter === f ? '#fff' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {f}
              </button>
            ))}

            <button
              type="button"
              onClick={() => { sound.playClick(); fetchTxs(); }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#818cf8',
                padding: '5px 8px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              title="Refresh Ledger"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 6px' }}>Type</th>
                <th style={{ padding: '8px 6px' }}>Description</th>
                <th style={{ padding: '8px 6px' }}>Amount</th>
                <th style={{ padding: '8px 6px' }}>After</th>
                <th style={{ padding: '8px 6px' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((t) => {
                  const isPositive = Number(t.amount) > 0;
                  return (
                    <tr
                      key={t._id || t.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <td style={{ padding: '8px 6px' }}>{getTypeBadge(t.type)}</td>
                      <td style={{ padding: '8px 6px', color: '#cbd5e1' }}>{t.description}</td>
                      <td className="font-mono" style={{ padding: '8px 6px', fontWeight: 800, color: isPositive ? '#34d399' : '#f87171' }}>
                        {isPositive ? '+' : ''}₹{Math.abs(Number(t.amount)).toFixed(2)}
                      </td>
                      <td className="font-mono" style={{ padding: '8px 6px', color: '#fff', fontWeight: 700 }}>
                        ₹{Number(t.balanceAfter || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 6px', color: '#64748b', fontSize: '11px' }}>
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    {loading ? 'Loading ledger...' : 'No transaction records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
