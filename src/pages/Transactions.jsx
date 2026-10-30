import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { sound } from '../utils/sound.js';
import {
  History, ArrowDownLeft, ArrowUpRight, Coins, Trophy, RefreshCw,
  Search, Wallet, Gamepad2, Sparkles, CheckCircle2, Clock, XCircle,
  TrendingUp, ShieldCheck, ChevronRight, PlusCircle
} from 'lucide-react';

const parseTxMeta = (tx) => {
  const type = tx.type || '';
  const desc = tx.description || '';
  const amt = Number(tx.amount) || 0;
  const isCredit = amt > 0 || type === 'deposit' || type === 'bet_won' || type === 'bonus' || type === 'bet_refund';

  let title = 'Transaction';
  let subtitle = desc;
  let category = 'GENERAL';
  let badgeColor = '#94a3b8';
  let badgeBg = 'rgba(148, 163, 184, 0.15)';

  if (type === 'deposit') {
    category = 'DEPOSIT';
    badgeColor = '#34d399';
    badgeBg = 'rgba(16, 185, 129, 0.16)';
    if (/tron|crypto|trx/i.test(desc)) {
      title = 'TRX Crypto Deposit';
      subtitle = 'Tron TRC-20 Blockchain';
    } else if (/upi|qr/i.test(desc)) {
      title = 'UPI Deposit';
      subtitle = 'Instant UPI Merchant Transfer';
    } else {
      title = 'Cash-In Deposit';
      subtitle = 'Wallet Balance Credit';
    }
  } else if (type === 'withdrawal') {
    category = 'WITHDRAWAL';
    badgeColor = '#f87171';
    badgeBg = 'rgba(239, 68, 68, 0.16)';
    if (/tron|crypto|trx/i.test(desc)) {
      title = 'TRX Crypto Payout';
      subtitle = 'Tron TRC-20 Cashout';
    } else if (/bank/i.test(desc)) {
      title = 'Bank Transfer Payout';
      subtitle = 'Direct IMPS / NEFT Settlement';
    } else {
      title = 'UPI Cashout';
      subtitle = 'Payout to Bank UPI';
    }
  } else if (type === 'bet_won') {
    category = 'WIN';
    badgeColor = '#fbbf24';
    badgeBg = 'rgba(251, 191, 36, 0.18)';
    title = 'Colour Prediction Win';
    subtitle = desc.replace(/^Credit:\s*[\+₹\d\.]*\s*/i, '').replace(/[\(\)]/g, '') || 'Multiplied Payout';
  } else if (type === 'bet_placed') {
    category = 'BET';
    badgeColor = '#c084fc';
    badgeBg = 'rgba(168, 85, 247, 0.18)';
    title = 'Colour Prediction Bet';
    subtitle = desc.replace(/^Debit:\s*[₹\d\.]*\s*/i, '').replace(/[\(\)]/g, '') || 'Live Round Wager';
  } else if (type === 'bet_refund') {
    category = 'REFUND';
    badgeColor = '#38bdf8';
    badgeBg = 'rgba(56, 189, 248, 0.16)';
    title = 'Wager Refund';
    subtitle = desc || 'Round Cancellation Refund';
  } else if (type === 'bonus') {
    category = 'BONUS';
    badgeColor = '#f472b6';
    badgeBg = 'rgba(244, 114, 182, 0.18)';
    title = 'Platform Bonus Credit';
    subtitle = desc || 'Promotional Reward';
  } else if (type === 'admin_adjustment') {
    category = 'ADJUSTMENT';
    badgeColor = '#fb923c';
    badgeBg = 'rgba(251, 146, 60, 0.18)';
    title = 'System Adjustment';
    subtitle = desc;
  }

  return { title, subtitle, category, badgeColor, badgeBg, isCredit };
};

const formatTxDate = (iso) => {
  if (!iso) return { date: '—', time: '' };
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  let dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (isToday) dateStr = 'Today';
  else if (isYesterday) dateStr = 'Yesterday';

  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { date: dateStr, time: timeStr };
};

export const Transactions = () => {
  const {
    user,
    wallet,
    refreshWallet,
    setIsAuthModalOpen,
    setIsDepositModalOpen,
    openWalletModal,
  } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTxs = async () => {
    setLoading(true);
    try {
      const [res] = await Promise.all([
        api.get('/wallet/transactions?limit=100'),
        refreshWallet?.(),
      ]);
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

  // Auth Guard Card
  if (!user) {
    return (
      <div
        style={{
          maxWidth: '460px',
          margin: '40px auto',
          textAlign: 'center',
          padding: '40px 24px',
          borderRadius: '24px',
          background: 'linear-gradient(145deg, rgba(32, 16, 62, 0.92) 0%, rgba(18, 9, 36, 0.98) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(168, 85, 247, 0.2)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.2) 100%)',
            border: '1.5px solid rgba(168, 85, 247, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 30px rgba(168, 85, 247, 0.35)',
          }}
        >
          <Coins size={34} color="#f3e8ff" />
        </div>

        <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', margin: '0 0 10px' }}>
          Sign In to Access Wallet & Ledger
        </h3>
        <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '0 0 26px', lineHeight: 1.6 }}>
          Log in or create your platform account to view your balance, verified deposits, withdrawals, and full transaction history.
        </p>

        <button
          onClick={() => {
            sound.playClick();
            setIsAuthModalOpen(true);
          }}
          style={{
            padding: '14px 24px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
          }}
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  // Filtered & Searched transactions
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // Type category matching
      if (filter === 'deposits' && t.type !== 'deposit') return false;
      if (filter === 'withdrawals' && t.type !== 'withdrawal') return false;
      if (filter === 'bets' && t.type !== 'bet_placed') return false;
      if (filter === 'wins' && t.type !== 'bet_won') return false;

      // Text Search matching
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const type = (t.type || '').toLowerCase();
        const amt = String(t.amount || '');
        if (!desc.includes(q) && !type.includes(q) && !amt.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, filter, searchTerm]);

  // Counts for pills
  const counts = useMemo(() => {
    const c = { all: transactions.length, deposits: 0, withdrawals: 0, bets: 0, wins: 0 };
    transactions.forEach((t) => {
      if (t.type === 'deposit') c.deposits++;
      else if (t.type === 'withdrawal') c.withdrawals++;
      else if (t.type === 'bet_placed') c.bets++;
      else if (t.type === 'bet_won') c.wins++;
    });
    return c;
  }, [transactions]);

  const balance = Number(wallet?.balance || 0);
  const totalDeposited = Number(wallet?.totalDeposited || 0);
  const totalWagered = Number(wallet?.totalWagered || 0);
  const totalWon = Number(wallet?.totalWon || 0);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ═══════════════════════════════════════════════════════════════
          1. LAS VEGAS NEON VELVET OVERVIEW KPI CARDS (2 Boxes Per Row)
      ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '10px',
        }}
      >
        {/* Card 1: Available Balance */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(38, 18, 72, 0.90) 0%, rgba(20, 10, 42, 0.95) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            borderRadius: '18px',
            padding: '14px 14px',
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.55), 0 0 16px rgba(16, 185, 129, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '100px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Available Balance
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(16, 185, 129, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wallet size={15} color="#34d399" />
            </div>
          </div>
          <div className="font-mono" style={{ fontSize: 'clamp(18px, 4.2vw, 24px)', fontWeight: 900, color: '#34d399', textShadow: '0 0 14px rgba(16, 185, 129, 0.45)', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
            Active Game Balance
          </div>
        </div>

        {/* Card 2: Total Deposited */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(32, 16, 62, 0.90) 0%, rgba(18, 9, 38, 0.95) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '18px',
            padding: '14px 14px',
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.55), 0 0 16px rgba(56, 189, 248, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '100px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Deposited
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'rgba(56, 189, 248, 0.18)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ArrowDownLeft size={15} color="#38bdf8" />
            </div>
          </div>
          <div className="font-mono" style={{ fontSize: 'clamp(18px, 4.2vw, 24px)', fontWeight: 900, color: '#38bdf8', textShadow: '0 0 14px rgba(56, 189, 248, 0.45)', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            ₹{totalDeposited.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
            Lifetime Verified
          </div>
        </div>

        {/* Card 3: Total Wagered */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(32, 16, 62, 0.90) 0%, rgba(18, 9, 38, 0.95) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '18px',
            padding: '14px 14px',
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.55), 0 0 16px rgba(168, 85, 247, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '100px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Wagered
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'rgba(168, 85, 247, 0.18)', border: '1px solid rgba(168, 85, 247, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Gamepad2 size={15} color="#c084fc" />
            </div>
          </div>
          <div className="font-mono" style={{ fontSize: 'clamp(18px, 4.2vw, 24px)', fontWeight: 900, color: '#f3e8ff', textShadow: '0 0 14px rgba(168, 85, 247, 0.35)', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            ₹{totalWagered.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
            Gaming Turnover
          </div>
        </div>

        {/* Card 4: Total Won */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(32, 16, 62, 0.90) 0%, rgba(18, 9, 38, 0.95) 100%)',
            border: '1px solid rgba(251, 191, 36, 0.4)',
            borderRadius: '18px',
            padding: '14px 14px',
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.55), 0 0 16px rgba(251, 191, 36, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '100px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Won
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'rgba(251, 191, 36, 0.18)', border: '1px solid rgba(251, 191, 36, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trophy size={15} color="#fbbf24" />
            </div>
          </div>
          <div className="font-mono" style={{ fontSize: 'clamp(18px, 4.2vw, 24px)', fontWeight: 900, color: '#fbbf24', textShadow: '0 0 14px rgba(251, 191, 36, 0.45)', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            ₹{totalWon.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
            Player Winnings
          </div>
        </div>
      </div>

      {/* Quick Cashier Action Bar (Deposit & Withdraw) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
        <button
          onClick={() => {
            sound.playClick();
            setIsDepositModalOpen(true);
          }}
          style={{
            padding: '12px 14px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: '1px solid rgba(52, 211, 153, 0.6)',
            color: '#ffffff',
            fontSize: '13.5px',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
            transition: 'transform 0.15s ease',
          }}
        >
          <PlusCircle size={17} /> Deposit Funds
        </button>

        <button
          onClick={() => {
            sound.playClick();
            if (openWalletModal) openWalletModal('withdraw');
          }}
          style={{
            padding: '12px 14px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.28) 0%, rgba(126, 34, 206, 0.32) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.55)',
            color: '#f3e8ff',
            fontSize: '13.5px',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 6px 20px rgba(168, 85, 247, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
            transition: 'transform 0.15s ease',
          }}
        >
          <ArrowUpRight size={17} /> Withdraw
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. LAS VEGAS NEON VELVET TRANSACTION LEDGER CONTAINER
      ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: 'linear-gradient(155deg, rgba(28, 14, 54, 0.90) 0%, rgba(16, 8, 34, 0.96) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          borderRadius: '22px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(168, 85, 247, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.18)',
          overflow: 'hidden',
          backdropFilter: 'blur(24px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >

        {/* Ledger Header & Search Controls */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(168, 85, 247, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(236, 72, 153, 0.2) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 14px rgba(168, 85, 247, 0.25)',
              }}
            >
              <History size={18} color="#f3e8ff" />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.2px' }}>
                Transaction Ledger
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                {filtered.length} {filtered.length === 1 ? 'record' : 'records'} found
              </div>
            </div>
          </div>

          {/* Search Box & Refresh Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 0 240px', maxWidth: '380px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search amount, method..."
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={() => {
                sound.playClick();
                fetchTxs();
              }}
              style={{
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                color: '#f3e8ff',
                padding: '7px 11px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 800,
                transition: 'all 0.2s',
              }}
              title="Refresh ledger"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span className="mobile-hide">Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Navigation Pills */}
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            overflowX: 'auto',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          {[
            { id: 'all', label: 'All Activity', count: counts.all },
            { id: 'deposits', label: 'Deposits', count: counts.deposits, color: '#34d399' },
            { id: 'withdrawals', label: 'Withdrawals', count: counts.withdrawals, color: '#f87171' },
            { id: 'bets', label: 'Game Bets', count: counts.bets, color: '#c084fc' },
            { id: 'wins', label: 'Game Wins', count: counts.wins, color: '#fbbf24' },
          ].map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setFilter(tab.id);
                }}
                style={{
                  padding: '7px 13px',
                  borderRadius: '12px',
                  border: isSelected ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.2) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: isSelected ? 900 : 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 0 14px rgba(168, 85, 247, 0.3)' : 'none',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                {tab.color && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: tab.color,
                      boxShadow: `0 0 6px ${tab.color}`,
                    }}
                  />
                )}
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    color: isSelected ? '#ffffff' : '#64748b',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            3. LUXURY FINTECH TRANSACTION ROWS
        ═══════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.length > 0 ? (
            filtered.map((t, idx) => {
              const meta = parseTxMeta(t);
              const { date, time } = formatTxDate(t.createdAt);
              const absAmount = Math.abs(Number(t.amount || 0));

              return (
                <div
                  key={t._id || t.id || idx}
                  style={{
                    padding: '14px 18px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(168, 85, 247, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Left: 3D Glossy Icon + Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    {/* 3D Round Icon */}
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '14px',
                        background:
                          meta.category === 'DEPOSIT'
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)'
                            : meta.category === 'WITHDRAWAL'
                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)'
                            : meta.category === 'WIN'
                            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)'
                            : 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(126, 34, 206, 0.15) 100%)',
                        border: `1.5px solid ${meta.badgeColor}50`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: `0 0 14px ${meta.badgeColor}25`,
                      }}
                    >
                      {meta.category === 'DEPOSIT' && <ArrowDownLeft size={20} color="#34d399" />}
                      {meta.category === 'WITHDRAWAL' && <ArrowUpRight size={20} color="#f87171" />}
                      {meta.category === 'WIN' && <Trophy size={19} color="#fbbf24" />}
                      {meta.category === 'BET' && <Gamepad2 size={19} color="#c084fc" />}
                      {!['DEPOSIT', 'WITHDRAWAL', 'WIN', 'BET'].includes(meta.category) && <Coins size={19} color="#38bdf8" />}
                    </div>

                    {/* Title, Category Badge & Subtitle */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff', whiteSpace: 'nowrap' }}>
                          {meta.title}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: meta.badgeBg,
                            color: meta.badgeColor,
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {meta.category}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '11px', color: '#94a3b8' }}>
                        <span style={{ color: '#cbd5e1', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                          {meta.subtitle}
                        </span>
                        <span>·</span>
                        <span style={{ color: '#64748b' }}>{date}, {time}</span>
                        {t.balanceAfter != null && (
                          <>
                            <span>·</span>
                            <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                              Bal: ₹{Number(t.balanceAfter).toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Status Badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                    <div
                      className="font-mono"
                      style={{
                        fontWeight: 900,
                        fontSize: '16px',
                        color: meta.isCredit ? '#34d399' : '#f87171',
                        textShadow: meta.isCredit ? '0 0 14px rgba(16, 185, 129, 0.4)' : 'none',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      {meta.isCredit ? '+' : '-'} ₹{absAmount.toFixed(2)}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '5px',
                          background: t.status === 'failed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                          color: t.status === 'failed' ? '#f87171' : '#34d399',
                          border: `1px solid ${t.status === 'failed' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`,
                          letterSpacing: '0.4px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {t.status || 'COMPLETED'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* Empty State */
            <div style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '18px',
                  background: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <History size={26} color="#c084fc" />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                {loading ? 'Fetching ledger records...' : 'No Transactions Found'}
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '320px', margin: 0, lineHeight: 1.5 }}>
                {searchTerm
                  ? `No transactions matching "${searchTerm}". Try another keyword or clear search.`
                  : filter === 'all'
                  ? 'Your account has no transactions recorded yet. Make a deposit to get started!'
                  : `No ${filter} found in your account history.`}
              </p>
              {!searchTerm && filter === 'all' && (
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsDepositModalOpen(true);
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 0 18px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  Make First Deposit
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
