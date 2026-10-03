import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { sound } from '../utils/sound.js';
import confetti from 'canvas-confetti';
import {
  Wallet,
  X,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Coins,
  CreditCard,
  Building2,
  Smartphone,
  ShieldCheck,
  History,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';

const GATEWAY_OPTIONS = [
  {
    id: 'upi',
    label: 'UPI',
    subtitle: 'Instant Pay',
    brandColor: '#10b981',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4.5 16.5L12 4.5L19.5 16.5" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 4.5V20" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'binance',
    label: 'Binance',
    subtitle: 'Crypto Pay',
    brandColor: '#F0B90B',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#F0B90B">
        <path d="M12 2.5L16.2 6.7L13.8 9.1L12 7.3L10.2 9.1L7.8 6.7L12 2.5Z" />
        <path d="M4.5 10L6.9 7.6L9.3 10L6.9 12.4L4.5 10Z" />
        <path d="M19.5 10L17.1 7.6L14.7 10L17.1 12.4L19.5 10Z" />
        <path d="M12 17.5L10.2 15.7L12 13.9L13.8 15.7L12 17.5Z" />
        <path d="M12 22.5L7.8 18.3L10.2 15.9L12 17.7L13.8 15.9L16.2 18.3L12 22.5Z" />
      </svg>
    ),
  },
  {
    id: 'dollar',
    label: 'Dollar',
    subtitle: 'USD / USDT',
    brandColor: '#22c55e',
    icon: (
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '12px',
          boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
        }}
      >
        $
      </div>
    ),
  },
  {
    id: 'tron',
    label: 'Tron',
    subtitle: 'TRX Network',
    brandColor: '#EF0027',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M2.5 3.5L21.5 8L13.5 21.5L2.5 3.5Z" fill="#EF0027" stroke="#EF0027" strokeWidth="1" strokeLinejoin="round"/>
        <path d="M2.5 3.5L13.5 10L13.5 21.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M21.5 8L9.5 12" stroke="#FFFFFF" strokeWidth="1.2" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export const WalletModal = () => {
  const {
    isWalletModalOpen,
    closeWalletModal,
    walletModalTab,
    setWalletModalTab,
    wallet,
    refreshWallet,
    setWallet,
    user,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [copiedId, setCopiedId] = useState(false);

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState('100');
  const [depositMethod, setDepositMethod] = useState('upi');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState('');
  const [depositError, setDepositError] = useState('');

  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = useState('100');
  const [withdrawMethod, setWithdrawMethod] = useState('upi');
  const [payoutAddress, setPayoutAddress] = useState('demo.player@okhdfcbank');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txFilter, setTxFilter] = useState('all');

  // Sync tab with external caller (e.g., if someone opened modal with 'deposit')
  useEffect(() => {
    if (walletModalTab) {
      setActiveTab(walletModalTab);
    }
  }, [walletModalTab, isWalletModalOpen]);

  // Load transactions when History tab opened
  useEffect(() => {
    if (isWalletModalOpen && activeTab === 'history') {
      fetchTransactions();
    }
  }, [isWalletModalOpen, activeTab]);

  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      const res = await api.get('/wallet/transactions?limit=50');
      if (res.data?.success) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setTxLoading(false);
    }
  };

  if (!isWalletModalOpen) return null;

  const currentBalance = wallet ? Number(wallet.balance) : 1250;

  const handleDeposit = async (e) => {
    e.preventDefault();
    setDepositError('');
    setDepositSuccess('');
    setDepositLoading(true);
    sound.playClick();

    try {
      const res = await api.post('/wallet/deposit', {
        amount: Number(depositAmount),
        paymentMethod: depositMethod,
      });

      if (res.data?.success) {
        setWallet(res.data.data.wallet);
        sound.playWin();
        try {
          confetti({
            particleCount: 70,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
        setDepositSuccess(`+₹${Number(depositAmount).toFixed(2)} credited instantly to your demo balance!`);
        setTimeout(() => {
          setDepositSuccess('');
          setActiveTab('overview');
        }, 1500);
      }
    } catch (err) {
      setDepositError(err.response?.data?.message || err.message || 'Deposit failed');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');

    const amt = Number(withdrawAmount);
    if (!amt || amt < 50) {
      setWithdrawError('Minimum withdrawal amount is ₹50');
      return;
    }
    if (amt > currentBalance) {
      setWithdrawError('Insufficient available demo balance');
      return;
    }

    setWithdrawLoading(true);
    sound.playClick();

    try {
      const res = await api.post('/wallet/withdraw', {
        amount: amt,
        payoutMethod: withdrawMethod,
        payoutDetails: { address: payoutAddress },
      });

      if (res.data?.success) {
        setWallet(res.data.data.wallet);
        sound.playCashout();
        setWithdrawSuccess(`Simulation withdrawal of ₹${amt.toFixed(2)} processed successfully!`);
        setTimeout(() => {
          setWithdrawSuccess('');
          setActiveTab('overview');
        }, 1500);
      }
    } catch (err) {
      setWithdrawError(err.response?.data?.message || err.message || 'Withdrawal failed');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const copyWalletId = () => {
    sound.playClick();
    const id = wallet?._id || wallet?.id || user?._id || 'demo-wallet-id';
    navigator.clipboard?.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const filteredTxs = transactions.filter((t) => {
    if (txFilter === 'all') return true;
    if (txFilter === 'deposits') return t.type === 'deposit';
    if (txFilter === 'withdrawals') return t.type === 'withdrawal';
    if (txFilter === 'bets') return t.type === 'bet_placed';
    if (txFilter === 'wins') return t.type === 'bet_won';
    return true;
  });

  return (
    <div className="modal-overlay" onClick={closeWalletModal}>
      <div
        className="glass-panel modal-content"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          borderRadius: '24px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          background: 'linear-gradient(180deg, rgba(13, 20, 36, 0.98) 0%, rgba(7, 10, 20, 0.99) 100%)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 45px rgba(16, 185, 129, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          margin: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(56, 189, 248, 0.25) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.25)',
              }}
            >
              <Wallet size={20} color="#34d399" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
                  LuckyPlay Wallet
                </h3>
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '10px',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                  }}
                >
                  SIMULATION
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Virtual Chips Bankroll & Instant Settlement
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                sound.playClick();
                refreshWallet();
              }}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title="Refresh Balance"
            >
              <RefreshCw size={15} />
            </button>

            <button
              onClick={closeWalletModal}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Balance Hero Card */}
        <div style={{ padding: '16px 20px 10px' }}>
          <div
            style={{
              padding: '16px 18px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(14, 165, 233, 0.12) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Available Bankroll
                </span>
                <div
                  className="font-mono"
                  style={{
                    fontSize: '28px',
                    fontWeight: 900,
                    color: '#ffffff',
                    marginTop: '2px',
                    letterSpacing: '-0.5px',
                    textShadow: '0 2px 12px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  ₹ {currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <button
                onClick={copyWalletId}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: copiedId ? '#34d399' : '#cbd5e1',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Copy Wallet ID"
              >
                {copiedId ? <Check size={12} /> : <Copy size={12} />}
                {copiedId ? 'Copied' : 'ID'}
              </button>
            </div>

            {/* Quick stats row */}
            <div
              style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Deposited</div>
                <div className="font-mono" style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
                  ₹{Number(wallet?.totalDeposited || 0).toFixed(0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Total Won</div>
                <div className="font-mono" style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>
                  ₹{Number(wallet?.totalWon || 0).toFixed(0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Wagered</div>
                <div className="font-mono" style={{ fontSize: '12px', fontWeight: 800, color: '#c084fc' }}>
                  ₹{Number(wallet?.totalWagered || 0).toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div
          style={{
            padding: '4px 20px 10px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
          }}
        >
          {[
            { id: 'overview', label: 'Overview', icon: <Wallet size={14} /> },
            { id: 'deposit', label: 'Deposit', icon: <ArrowDownRight size={14} /> },
            { id: 'withdraw', label: 'Withdraw', icon: <ArrowUpRight size={14} /> },
            { id: 'history', label: 'Ledger', icon: <History size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setActiveTab(tab.id);
                setDepositSuccess('');
                setDepositError('');
                setWithdrawSuccess('');
                setWithdrawError('');
              }}
              style={{
                padding: '8px 4px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
                border: activeTab === tab.id ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                background:
                  activeTab === tab.id
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)'
                    : 'rgba(255, 255, 255, 0.02)',
                color: activeTab === tab.id ? '#34d399' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 20px 20px',
            minHeight: '260px',
            maxHeight: '400px',
          }}
        >
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Quick Actions Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('deposit');
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '6px',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: 'rgba(16, 185, 129, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ArrowDownRight size={18} color="#34d399" />
                    </div>
                    <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 800 }}>FAST</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '14px', marginTop: '4px' }}>Deposit Chips</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Add virtual test credits instantly</div>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('withdraw');
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.08) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '6px',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ArrowUpRight size={18} color="#f87171" />
                    </div>
                    <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 800 }}>0% FEE</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '14px', marginTop: '4px' }}>Withdraw Chips</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Instant simulated bankout</div>
                </button>
              </div>

              {/* Simulation Safety Disclaimer Pill */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'rgba(255, 184, 0, 0.08)',
                  border: '1px solid rgba(255, 184, 0, 0.25)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '11px',
                  color: '#fef08a',
                  lineHeight: 1.45,
                }}
              >
                <AlertCircle size={18} color="#facc15" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Educational & Testing Sandbox:</strong> All chips and wallet balances are virtual simulation credits for game algorithm testing. No real money can be won or lost.
                </div>
              </div>

              {/* One-click Demo Refill */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>Quick Bankroll Refill</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Running low on demo chips? Refill with 1 click.</div>
                </div>

                <button
                  onClick={async () => {
                    sound.playClick();
                    try {
                      const res = await api.post('/wallet/deposit', { amount: 500, paymentMethod: 'instant_demo' });
                      if (res.data?.success) {
                        setWallet(res.data.data.wallet);
                        sound.playWin();
                      }
                    } catch {}
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  +₹500 Refill
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DEPOSIT */}
          {activeTab === 'deposit' && (
            <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {depositSuccess && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10b981',
                    color: '#34d399',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={16} /> {depositSuccess}
                </div>
              )}

              {depositError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #ef4444',
                    color: '#f87171',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} /> {depositError}
                </div>
              )}

              {/* Quick Preset Buttons */}
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                  Select Chip Amount (₹)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {['50', '100', '250', '500', '1000', '2500'].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => {
                        sound.playClick();
                        setDepositAmount(amt);
                      }}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        background: depositAmount === amt ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.04)',
                        border: depositAmount === amt ? '1px solid #34d399' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: depositAmount === amt ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                  Or Custom Amount
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '12px', color: '#64748b', fontWeight: 800 }}>₹</span>
                  <input
                    type="number"
                    min="10"
                    max="50000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 14px 11px 32px',
                      borderRadius: '12px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                    placeholder="Enter amount"
                    required
                  />
                </div>
              </div>

              {/* Simulation Payment Method */}
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                  Simulated Gateway
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {GATEWAY_OPTIONS.map((m) => {
                    const isSelected = depositMethod === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          sound.playClick();
                          setDepositMethod(m.id);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '12px',
                          background: isSelected ? `${m.brandColor}18` : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? `1px solid ${m.brandColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                          color: isSelected ? '#ffffff' : '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          boxShadow: isSelected ? `0 0 14px ${m.brandColor}33` : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {m.icon}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#ffffff' : '#e2e8f0', letterSpacing: '-0.2px' }}>
                            {m.label}
                          </div>
                          <div style={{ fontSize: '10px', color: isSelected ? m.brandColor : '#64748b', fontWeight: 600 }}>
                            {m.subtitle}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={depositLoading}
                style={{
                  padding: '13px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #00e676 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 900,
                  cursor: depositLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 0 20px rgba(0, 230, 118, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px',
                }}
              >
                {depositLoading ? 'Crediting Sandbox...' : `Deposit ₹${depositAmount || 0} Chips`}
              </button>
            </form>
          )}

          {/* TAB 3: WITHDRAW */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {withdrawSuccess && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10b981',
                    color: '#34d399',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={16} /> {withdrawSuccess}
                </div>
              )}

              {withdrawError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #ef4444',
                    color: '#f87171',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} /> {withdrawError}
                </div>
              )}

              {/* Amount input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Withdraw Amount (₹)
                  </label>
                  <span
                    onClick={() => setWithdrawAmount(Math.floor(currentBalance).toString())}
                    style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, cursor: 'pointer' }}
                  >
                    MAX: ₹{Math.floor(currentBalance)}
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '12px', color: '#64748b', fontWeight: 800 }}>₹</span>
                  <input
                    type="number"
                    min="50"
                    max={currentBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 14px 11px 32px',
                      borderRadius: '12px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                    placeholder="Min ₹50"
                    required
                  />
                </div>
              </div>

              {/* Payout Gateway Selection */}
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                  Payout Gateway
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {GATEWAY_OPTIONS.map((m) => {
                    const isSelected = withdrawMethod === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          sound.playClick();
                          setWithdrawMethod(m.id);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '12px',
                          background: isSelected ? `${m.brandColor}18` : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? `1px solid ${m.brandColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                          color: isSelected ? '#ffffff' : '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          boxShadow: isSelected ? `0 0 14px ${m.brandColor}33` : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {m.icon}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#ffffff' : '#e2e8f0', letterSpacing: '-0.2px' }}>
                            {m.label}
                          </div>
                          <div style={{ fontSize: '10px', color: isSelected ? m.brandColor : '#64748b', fontWeight: 600 }}>
                            {m.subtitle}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simulated Destination */}
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                  {withdrawMethod === 'upi' && 'Virtual UPI ID / VPA'}
                  {withdrawMethod === 'binance' && 'Binance Pay ID / BEP-20 Address'}
                  {withdrawMethod === 'dollar' && 'USDT / USD Wallet Address'}
                  {withdrawMethod === 'tron' && 'Tron (TRX) TRC-20 Address'}
                </label>
                <input
                  type="text"
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                  placeholder={
                    withdrawMethod === 'upi'
                      ? 'e.g. player@okhdfcbank or 9876543210@paytm'
                      : withdrawMethod === 'binance'
                      ? 'e.g. 182938472 or 0x71C...b29'
                      : withdrawMethod === 'dollar'
                      ? 'e.g. T... (TRC-20) or 0x... (ERC-20)'
                      : 'e.g. TLyqzVGLV1FCiJekaVJGhNOdW2yLTYp6p4'
                  }
                  required
                />
              </div>

              {/* Payout Summary Info */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: '#94a3b8' }}>Network Fee:</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>₹0.00 (Free Demo)</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={withdrawLoading || currentBalance < 50}
                style={{
                  padding: '13px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 900,
                  cursor: withdrawLoading || currentBalance < 50 ? 'not-allowed' : 'pointer',
                  boxShadow: '0 0 20px rgba(225, 29, 72, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px',
                }}
              >
                {withdrawLoading ? 'Processing Simulation...' : `Withdraw ₹${withdrawAmount || 0} Chips`}
              </button>
            </form>
          )}

          {/* TAB 4: HISTORY / LEDGER */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Filter pills */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
                {['all', 'deposits', 'withdrawals', 'bets', 'wins'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTxFilter(f)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: txFilter === f ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: txFilter === f ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.02)',
                      color: txFilter === f ? '#a5b4fc' : '#94a3b8',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {txLoading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading ledger transactions...
                </div>
              ) : filteredTxs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
                  No transactions recorded yet in this category.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredTxs.slice(0, 20).map((tx, idx) => {
                    const isCredit = tx.type === 'deposit' || tx.type === 'bet_won';
                    return (
                      <div
                        key={tx._id || idx}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              background: isCredit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isCredit ? (
                              <ArrowDownRight size={14} color="#34d399" />
                            ) : (
                              <ArrowUpRight size={14} color="#f87171" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', textTransform: 'capitalize' }}>
                              {tx.type ? tx.type.replace('_', ' ') : 'Transaction'}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>
                              {new Date(tx.createdAt || Date.now()).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        <div
                          className="font-mono"
                          style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            color: isCredit ? '#34d399' : '#f87171',
                          }}
                        >
                          {isCredit ? '+' : '-'}₹{Math.abs(Number(tx.amount)).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.25)',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={14} color="#10b981" /> Double-entry ledger protected
          </span>
          <span>18+ Virtual Sandbox</span>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
