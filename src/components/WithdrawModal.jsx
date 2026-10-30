/**
 * WithdrawModal.jsx — Production-Grade Las Vegas Neon Velvet Cashier Modal
 * Features:
 * - Dynamic 3-Method Withdrawal: UPI ID, Bank Transfer (IMPS), Tron TRX (TRC-20)
 * - Dynamic TRX Conversion Rate (1 TRX = X INR) fetched live from Admin Payment Config
 * - Dynamic Amount Chips + Quick MAX selector
 * - Real-time Fee & Net Payout Calculation
 * - Live Cashout History with Status Badges (Pending, Approved, Completed, Rejected, Cancelled)
 * - Self-Service Instant Cancellation & Refund for Pending Withdrawals
 * - Production-Grade Validation, Las Vegas Neon Velvet styling, and sound effects
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader,
  Smartphone,
  Building2,
  Coins,
  History,
  Clock,
  Check,
  XCircle,
  RotateCcw,
  Zap,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { sound } from '../utils/sound.js';

const METHODS = {
  upi: {
    id: 'upi',
    name: 'UPI Instant',
    label: 'UPI',
    icon: Smartphone,
    color: '#34d399',
    glow: 'rgba(52, 211, 153, 0.4)',
    border: 'rgba(52, 211, 153, 0.4)',
    bg: 'rgba(52, 211, 153, 0.12)',
    desc: 'Instant settlement to any UPI ID / VPA (Google Pay, PhonePe, Paytm)',
  },
  bank: {
    id: 'bank',
    name: 'Bank Transfer (IMPS)',
    label: 'Bank',
    icon: Building2,
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.4)',
    border: 'rgba(56, 189, 248, 0.4)',
    bg: 'rgba(56, 189, 248, 0.12)',
    desc: 'Direct NEFT / IMPS transfer to your Indian bank savings/current account',
  },
  crypto_trx: {
    id: 'crypto_trx',
    name: 'TRX Crypto (TRC-20)',
    label: 'TRX Coin',
    icon: Coins,
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.4)',
    border: 'rgba(239, 68, 68, 0.4)',
    bg: 'rgba(239, 68, 68, 0.12)',
    desc: 'Fast decentralized crypto payout directly to your Tron TRC-20 wallet',
  },
};

const QUICK_AMOUNTS = ['200', '500', '1000', '2500', '5000'];

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '13.5px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 800,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  marginBottom: '6px',
};

export const WithdrawModal = () => {
  const {
    isWithdrawModalOpen,
    setIsWithdrawModalOpen,
    wallet,
    refreshWallet,
    user,
    setIsAuthModalOpen,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('request'); // 'request' | 'history'
  const [cfg, setCfg] = useState(null);
  const [method, setMethod] = useState('upi');
  const [amount, setAmount] = useState('500');
  const [feeData, setFeeData] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Form Fields
  const [upiId, setUpiId] = useState('');
  const [bankAcc, setBankAcc] = useState('');
  const [confirmBankAcc, setConfirmBankAcc] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [tronAddress, setTronAddress] = useState('');

  // Execution states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // History state
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // Fetch payment config on open
  useEffect(() => {
    if (!isWithdrawModalOpen) return;
    api
      .get('/payment-config')
      .then((r) => {
        if (r.data?.success) setCfg(r.data.data);
      })
      .catch(() => {});
  }, [isWithdrawModalOpen]);

  // Fetch history when tab changes to 'history'
  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const res = await api.get('/withdrawals?limit=30');
      if (res.data?.success) {
        setHistoryList(res.data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isWithdrawModalOpen && activeTab === 'history') {
      fetchHistory();
    }
  }, [isWithdrawModalOpen, activeTab, fetchHistory]);

  // Real-time synchronization when withdrawal status updates
  useEffect(() => {
    const handleUpdate = () => {
      fetchHistory();
      refreshWallet?.();
    };
    window.addEventListener('withdrawal:update', handleUpdate);
    return () => window.removeEventListener('withdrawal:update', handleUpdate);
  }, [fetchHistory, refreshWallet]);

  // Pre-fill UPI with user phone if available
  useEffect(() => {
    if (user?.phone && !upiId) {
      setUpiId(`${user.phone}@upi`);
    }
    if (user?.name && !bankHolder) {
      setBankHolder(user.name);
    }
  }, [user]);

  // Real-time fee & TRX conversion calculation
  useEffect(() => {
    const num = Number(amount);
    if (!num || num <= 0 || !cfg) {
      setFeeData(null);
      return;
    }

    const mKey = method === 'crypto_trx' ? 'crypto' : method;
    const methodCfg = cfg.withdrawalFeesConfig?.[mKey] || {};
    const feePct = methodCfg.percent ?? cfg.withdrawalFeePercent ?? 0;
    const minFee = methodCfg.min ?? 0;
    const maxFee = methodCfg.max ?? 50000;

    let feeAmt = Number(((num * feePct) / 100).toFixed(2));
    feeAmt = Math.max(feeAmt, minFee);
    feeAmt = Math.min(feeAmt, maxFee);

    const net = Number((num - feeAmt).toFixed(2));
    const trxRate = cfg.trxRateInInr || 10.5;
    const cryptoAmt = method === 'crypto_trx' ? Number((net / trxRate).toFixed(2)) : 0;

    setFeeData({
      amount: num,
      feePercent: feePct,
      feeAmount: feeAmt,
      netAmount: net,
      trxRate,
      cryptoAmount: cryptoAmt,
    });
  }, [amount, method, cfg]);

  const handleQuickAmount = (val) => {
    sound.playClick();
    setAmount(val);
    setError('');
  };

  const handleMaxAmount = () => {
    sound.playClick();
    const balance = Number(wallet?.balance || 0);
    const maxW = cfg?.withdrawalMaxAmount || 50000;
    const cap = Math.min(balance, maxW);
    setAmount(String(Math.floor(cap)));
    setError('');
  };

  const handleCancelPending = async (withdrawalId) => {
    sound.playClick();
    if (!window.confirm('Cancel this pending withdrawal and refund the amount back to your balance?')) {
      return;
    }

    setCancellingId(withdrawalId);
    try {
      const res = await api.post(`/withdrawals/${withdrawalId}/cancel`);
      if (res.data?.success) {
        sound.playCashout();
        refreshWallet?.();
        fetchHistory();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel withdrawal');
    } finally {
      setCancellingId(null);
    }
  };

  const handleSubmitWithdrawal = async (e) => {
    e.preventDefault();
    sound.playClick();
    setError('');
    setSuccessMsg('');

    const num = Number(amount);
    const balance = Number(wallet?.balance || 0);
    const minW = cfg?.withdrawalMinAmount || 100;
    const maxW = cfg?.withdrawalMaxAmount || 50000;

    if (!num || num < minW) {
      setError(`Minimum withdrawal amount is ₹${minW}`);
      return;
    }
    if (num > maxW) {
      setError(`Maximum withdrawal amount is ₹${maxW}`);
      return;
    }
    if (num > balance) {
      setError(`Insufficient balance. You currently have ₹${balance.toFixed(2)}.`);
      return;
    }

    // Validate method details
    let accountPayload = '';
    if (method === 'upi') {
      const cleanUpi = upiId.trim();
      if (!cleanUpi || !cleanUpi.includes('@')) {
        setError('Please enter a valid UPI ID (e.g. mobile@upi or username@okhdfcbank)');
        return;
      }
      accountPayload = cleanUpi;
    } else if (method === 'bank') {
      const acc = bankAcc.trim();
      const ifsc = bankIfsc.trim().toUpperCase();
      const holder = bankHolder.trim();

      if (!acc || acc.length < 8) {
        setError('Please enter a valid Bank Account Number (at least 8 digits)');
        return;
      }
      if (acc !== confirmBankAcc.trim()) {
        setError('Account numbers do not match. Please verify.');
        return;
      }
      if (!ifsc || ifsc.length !== 11) {
        setError('Please enter a valid 11-character Bank IFSC Code (e.g. HDFC0001234)');
        return;
      }
      if (!holder) {
        setError('Account holder name is required');
        return;
      }

      accountPayload = `${acc} | ${ifsc} | ${holder}${bankName ? ` | ${bankName.trim()}` : ''}`;
    } else if (method === 'crypto_trx') {
      const addr = tronAddress.trim();
      if (!addr || !/^T[a-zA-Z0-9]{33}$/.test(addr)) {
        setError('Please enter a valid Tron (TRC-20) address (starts with "T" and 34 characters)');
        return;
      }
      accountPayload = addr;
    }

    setLoading(true);
    try {
      const res = await api.post('/withdrawals', {
        amount: num,
        paymentMethod: method,
        accountDetails: accountPayload,
      });

      if (res.data?.success) {
        sound.playCashout();
        setSuccessMsg(
          `Withdrawal request of ₹${num.toFixed(2)} submitted successfully! Status: Pending verification.`
        );
        refreshWallet?.();
        setTimeout(() => {
          setActiveTab('history');
          fetchHistory();
        }, 1800);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Withdrawal submission failed');
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    sound.playClick();
    setIsWithdrawModalOpen(false);
    setError('');
    setSuccessMsg('');
  };

  if (!isWithdrawModalOpen) return null;

  const balance = Number(wallet?.balance || 0);
  const minW = cfg?.withdrawalMinAmount || 100;
  const maxW = cfg?.withdrawalMaxAmount || 50000;
  const trxRate = cfg?.trxRateInInr || 10.5;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
      }}
    >
      {/* Backdrop with Las Vegas Velvet Ambient Lighting */}
      <div
        onClick={close}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(8, 3, 18, 0.85)',
          backdropFilter: 'blur(10px)',
        }}
      />

      {/* Main Cashier Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '480px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(155deg, rgba(30, 14, 58, 0.96) 0%, rgba(16, 7, 34, 0.98) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(168, 85, 247, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
            background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.12) 0%, rgba(236, 72, 153, 0.08) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(168, 85, 247, 0.2) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
              }}
            >
              <ArrowUpRight size={20} color="#f87171" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.2px' }}>
                Withdrawal Cashier
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Available:</span>
                <span style={{ color: '#34d399', fontWeight: 900, fontFamily: 'monospace' }}>
                  ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={close}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher: Request Cashout / History */}
        <div style={{ display: 'flex', padding: '10px 20px 0', gap: '8px' }}>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('request');
            }}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: '12px',
              border: activeTab === 'request' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid transparent',
              background: activeTab === 'request' ? 'rgba(168, 85, 247, 0.22)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'request' ? '#f3e8ff' : '#94a3b8',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Zap size={14} color={activeTab === 'request' ? '#c084fc' : '#94a3b8'} />
            Request Cashout
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('history');
            }}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: '12px',
              border: activeTab === 'history' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid transparent',
              background: activeTab === 'history' ? 'rgba(168, 85, 247, 0.22)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'history' ? '#f3e8ff' : '#94a3b8',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <History size={14} color={activeTab === 'history' ? '#c084fc' : '#94a3b8'} />
            Cashout History
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ overflowY: 'auto', padding: '16px 20px 24px', flex: 1 }}>
          {!user ? (
            /* Auth required state */
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <ArrowUpRight size={26} color="#f87171" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
                Sign In to Withdraw
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
                Please log in to your account to securely request payouts.
              </p>
              <button
                onClick={() => {
                  close();
                  setIsAuthModalOpen(true);
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                Sign In / Register
              </button>
            </div>
          ) : activeTab === 'request' ? (
            /* TAB 1: WITHDRAWAL FORM */
            <form onSubmit={handleSubmitWithdrawal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Method Selector Tabs */}
              <div>
                <label style={labelStyle}>Select Cashout Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                  {Object.values(METHODS).map((m) => {
                    const isSelected = method === m.id;
                    const IconComp = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setMethod(m.id);
                          setError('');
                        }}
                        style={{
                          padding: '12px 8px',
                          borderRadius: '14px',
                          border: `1.5px solid ${isSelected ? m.border : 'rgba(255, 255, 255, 0.08)'}`,
                          background: isSelected ? m.bg : 'rgba(255, 255, 255, 0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? `0 0 16px ${m.glow}` : 'none',
                        }}
                      >
                        <IconComp size={20} color={isSelected ? m.color : '#94a3b8'} />
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: isSelected ? '#ffffff' : '#94a3b8',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic TRX Exchange Rate Alert */}
              {method === 'crypto_trx' && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Coins size={16} color="#f87171" />
                    <span style={{ fontSize: '12px', color: '#fca5a5', fontWeight: 700 }}>
                      Live TRX Rate:
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 900,
                      color: '#ffffff',
                      fontFamily: 'monospace',
                    }}
                  >
                    1 TRX = ₹{trxRate.toFixed(2)} INR
                  </span>
                </div>
              )}

              {/* Amount Input & Quick Chips */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Amount (₹)</label>
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    style={{
                      background: 'rgba(168, 85, 247, 0.18)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      color: '#c084fc',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    MAX: ₹{Math.min(balance, maxW).toFixed(0)}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '18px',
                      fontWeight: 900,
                      color: '#94a3b8',
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    min={minW}
                    max={Math.min(balance, maxW)}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError('');
                    }}
                    placeholder={`Min ₹${minW}, Max ₹${maxW}`}
                    style={{
                      ...inputStyle,
                      paddingLeft: '32px',
                      fontSize: '18px',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      color: '#34d399',
                    }}
                  />
                </div>

                {/* Quick Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {QUICK_AMOUNTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleQuickAmount(q)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: amount === q ? '1px solid rgba(52, 211, 153, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: amount === q ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        color: amount === q ? '#34d399' : '#94a3b8',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      ₹{q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method-Specific Destination Fields */}
              {method === 'upi' && (
                <div>
                  <label style={labelStyle}>Your UPI ID / VPA *</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobile@upi or username@okhdfcbank"
                    style={inputStyle}
                    required
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Payouts are credited instantly via UPI 24×7
                  </span>
                </div>
              )}

              {method === 'bank' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Bank Account Number *</label>
                    <input
                      type="text"
                      value={bankAcc}
                      onChange={(e) => setBankAcc(e.target.value)}
                      placeholder="e.g. 109283748291"
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm Account Number *</label>
                    <input
                      type="text"
                      value={confirmBankAcc}
                      onChange={(e) => setConfirmBankAcc(e.target.value)}
                      placeholder="Re-enter Account Number"
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={labelStyle}>IFSC Code *</label>
                      <input
                        type="text"
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                        placeholder="e.g. HDFC0001234"
                        style={{ ...inputStyle, textTransform: 'uppercase' }}
                        maxLength={11}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Account Holder Name *</label>
                    <input
                      type="text"
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                      placeholder="Name as registered with bank"
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>
              )}

              {method === 'crypto_trx' && (
                <div>
                  <label style={labelStyle}>TRON (TRC-20) Wallet Address *</label>
                  <input
                    type="text"
                    value={tronAddress}
                    onChange={(e) => setTronAddress(e.target.value.trim())}
                    placeholder="e.g. TLyqzVGLV1FCiJekaVJGhNOdW2yLTYp6p4"
                    style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '13px' }}
                    required
                  />
                  <span style={{ fontSize: '11px', color: '#f87171', marginTop: '4px', display: 'block' }}>
                    Ensure the destination address is on the TRON TRC-20 network (starts with T).
                  </span>
                </div>
              )}

              {/* Settlement Summary & Fee Breakdown Card */}
              {feeData && feeData.amount > 0 && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>Requested Amount:</span>
                    <span style={{ color: '#ffffff', fontWeight: 800 }}>₹{feeData.amount.toFixed(2)}</span>
                  </div>
                  {feeData.feeAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#94a3b8' }}>Processing Fee ({feeData.feePercent}%):</span>
                      <span style={{ color: '#f87171', fontWeight: 800 }}>-₹{feeData.feeAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#f3e8ff' }}>
                      Final Payout:
                    </span>
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: 900,
                        color: '#34d399',
                        fontFamily: 'monospace',
                      }}
                    >
                      ₹{feeData.netAmount.toFixed(2)}
                    </span>
                  </div>

                  {method === 'crypto_trx' && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        marginTop: '4px',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#fca5a5' }}>
                        TRX Coins You Receive:
                      </span>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 900,
                          color: '#ffffff',
                          fontFamily: 'monospace',
                        }}
                      >
                        ~{feeData.cryptoAmount} TRX
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Status & Error Messages */}
              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={16} flexShrink={0} />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={16} flexShrink={0} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || balance < minW}
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  background:
                    balance < minW
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: '1px solid rgba(52, 211, 153, 0.5)',
                  color: balance < minW ? '#64748b' : '#ffffff',
                  fontSize: '14px',
                  fontWeight: 900,
                  cursor: balance < minW || loading ? 'not-allowed' : 'pointer',
                  boxShadow: balance < minW ? 'none' : '0 8px 24px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Submitting Cashout...
                  </>
                ) : (
                  <>
                    <ArrowUpRight size={17} strokeWidth={2.5} />
                    Confirm Withdrawal of ₹{amount || 0}
                  </>
                )}
              </button>
            </form>
          ) : (
            /* TAB 2: CASHOUT HISTORY */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8' }}>
                  Recent Cashout Requests ({historyList.length})
                </span>
                <button
                  type="button"
                  onClick={fetchHistory}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c084fc',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RotateCcw size={12} /> Refresh
                </button>
              </div>

              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
                  <Loader size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <span style={{ fontSize: '12px' }}>Loading your cashouts...</span>
                </div>
              ) : historyList.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '36px 16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <History size={32} color="#475569" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>
                    No withdrawal requests found
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Your requested payouts will appear here in real-time.
                  </div>
                </div>
              ) : (
                historyList.map((item) => {
                  const isPending = item.status === 'pending';
                  const isApproved = item.status === 'approved' || item.status === 'processing';
                  const isCompleted = item.status === 'completed';
                  const isRejected = item.status === 'rejected';
                  const isCancelled = item.status === 'cancelled';

                  const badgeColor = isPending
                    ? '#fbbf24'
                    : isCompleted
                    ? '#34d399'
                    : isApproved
                    ? '#38bdf8'
                    : isRejected
                    ? '#f87171'
                    : '#94a3b8';

                  const badgeBg = isPending
                    ? 'rgba(251, 191, 36, 0.14)'
                    : isCompleted
                    ? 'rgba(52, 211, 153, 0.14)'
                    : isApproved
                    ? 'rgba(56, 189, 248, 0.14)'
                    : isRejected
                    ? 'rgba(239, 68, 68, 0.14)'
                    : 'rgba(148, 163, 184, 0.14)';

                  return (
                    <div
                      key={item._id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: badgeBg,
                              color: badgeColor,
                              border: `1px solid ${badgeColor}33`,
                            }}
                          >
                            {item.status}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {new Date(item.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '15px',
                            fontWeight: 900,
                            color: '#ffffff',
                            fontFamily: 'monospace',
                          }}
                        >
                          ₹{Number(item.amount).toFixed(2)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Method: <strong style={{ color: '#cbd5e1' }}>{String(item.paymentMethod).toUpperCase()}</strong>
                        </span>
                        {item.cryptoAmount > 0 && (
                          <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 800 }}>
                            ≈ {item.cryptoAmount} TRX
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '11px', color: '#94a3b8', wordBreak: 'break-all' }}>
                        To: {item.accountDetails}
                      </div>

                      {item.transactionRef && (
                        <div
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: 'rgba(52, 211, 153, 0.08)',
                            border: '1px solid rgba(52, 211, 153, 0.2)',
                            fontSize: '11px',
                            color: '#34d399',
                            fontFamily: 'monospace',
                          }}
                        >
                          UTR/Ref: {item.transactionRef}
                        </div>
                      )}

                      {item.reviewNote && (
                        <div style={{ fontSize: '11px', color: isRejected ? '#fca5a5' : '#94a3b8' }}>
                          Note: {item.reviewNote}
                        </div>
                      )}

                      {/* Cancel Button for Pending Withdrawals */}
                      {isPending && (
                        <button
                          type="button"
                          disabled={cancellingId === item._id}
                          onClick={() => handleCancelPending(item._id)}
                          style={{
                            marginTop: '4px',
                            alignSelf: 'flex-start',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#f87171',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {cancellingId === item._id ? (
                            <Loader size={11} className="animate-spin" />
                          ) : (
                            <XCircle size={12} />
                          )}
                          Cancel & Refund to Balance
                        </button>
                      )}
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

export default WithdrawModal;
