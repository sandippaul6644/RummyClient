/**
 * DepositModal — 3 Deposit Methods (UPI ID, Scan Active QR, TRX Coin)
 * Production Grade:
 * - Dynamic TRX conversion (1 TRX = X INR configured in Admin)
 * - Single Active UPI QR code enforced
 * - Real-time Socket status updates & instant wallet balance refresh on Admin approval/rejection
 * - Full manual approval lifecycle (PENDING -> APPROVED / REJECTED)
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  X, Copy, Check, ArrowDownLeft, Smartphone, QrCode,
  Coins, AlertTriangle, Upload, Loader, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api }     from '../services/api.js';
import { socket }  from '../services/socket.js';

const iStyle = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const lbl = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: '#94a3b8',
  textTransform: 'uppercase',
  marginBottom: '6px',
  letterSpacing: '0.5px',
};

// Toast notification helper
const showToast = (message, type = 'info') => {
  const event = new CustomEvent('app:toast', { detail: { message, type } });
  window.dispatchEvent(event);
};

export const DepositModal = () => {
  const {
    isDepositModalOpen,
    setIsDepositModalOpen,
    refreshWallet,
    wallet,
    user,
    setIsAuthModalOpen,
  } = useAuth();

  // 3 Supported Methods: 'upi' (UPI ID), 'qr' (Scan QR), 'crypto' (TRX Coin)
  const [tab, setTab] = useState('qr');
  const [cfg, setCfg] = useState(null);
  const [activeQr, setActiveQr] = useState(null);

  // Form inputs
  const [amount, setAmount] = useState('500');
  const [utrRef, setUtrRef] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [txnHash, setTxnHash] = useState('');
  const [cryptoAmt, setCryptoAmt] = useState('');

  // Status & loading
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [submittedDeposit, setSubmittedDeposit] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [liveAlert, setLiveAlert] = useState(null);

  const pollIntervalRef = useRef(null);

  // Fetch configs and active single QR on open
  useEffect(() => {
    if (!isDepositModalOpen) return;

    api.get('/payment-config')
      .then((r) => {
        if (r.data?.success) setCfg(r.data.data);
      })
      .catch(() => {});

    api.get('/deposit/upi-qr')
      .then((r) => {
        if (r.data?.success) setActiveQr(r.data.data);
      })
      .catch(() => {});

    // Listen to real-time socket updates for approvals / rejections
    const handleDepositStatus = (data) => {
      setLiveAlert(data);
      if (data.status === 'APPROVED') {
        showToast(data.message || `Deposit of ₹${data.amount} approved!`, 'success');
        refreshWallet?.();
      } else if (data.status === 'REJECTED') {
        showToast(data.message || `Deposit of ₹${data.amount} was rejected.`, 'error');
      }
    };

    socket.on('deposit:status', handleDepositStatus);

    return () => {
      socket.off('deposit:status', handleDepositStatus);
    };
  }, [isDepositModalOpen, refreshWallet]);

  // Keep TRX calculation synchronized with INR amount
  const trxRate = Number(cfg?.trxRateInInr) || 10.5;

  useEffect(() => {
    if (tab === 'crypto' && amount) {
      const computed = (Number(amount) / trxRate).toFixed(2);
      setCryptoAmt(computed);
    }
  }, [amount, trxRate, tab]);

  const handleTrxInputChange = (val) => {
    setCryptoAmt(val);
    if (val && !isNaN(val)) {
      setAmount((Number(val) * trxRate).toFixed(0));
    }
  };

  // Poll for deposit approval status if pollingId active
  const startPolling = (depositId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/deposits/${depositId}`);
        if (res.data?.success) {
          const deposit = res.data.data;
          if (deposit.status === 'APPROVED') {
            clearInterval(pollIntervalRef.current);
            showToast('✅ Your deposit has been approved! Wallet updated.', 'success');
            refreshWallet?.();
            setLiveAlert({ status: 'APPROVED', amount: deposit.amount });
          } else if (deposit.status === 'REJECTED') {
            clearInterval(pollIntervalRef.current);
            showToast(`❌ Deposit rejected: ${deposit.adminNote || 'Contact support'}`, 'error');
            setLiveAlert({ status: 'REJECTED', amount: deposit.amount, reason: deposit.adminNote });
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 10000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  if (!isDepositModalOpen) return null;

  if (!user) {
    return (
      <div className="modal-overlay" onClick={() => setIsDepositModalOpen(false)}>
        <div
          className="glass-panel modal-content"
          style={{ width: '100%', maxWidth: '420px', padding: '28px 24px', textAlign: 'center', margin: 'auto', position: 'relative', borderRadius: '24px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIsDepositModalOpen(false)}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
          <div
            style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0, 230, 118, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}
          >
            <ArrowDownLeft size={28} color="#00e676" />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Sign In to Deposit</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.5 }}>You must be logged in to deposit funds into your account.</p>
          <button
            onClick={() => {
              setIsDepositModalOpen(false);
              setIsAuthModalOpen(true);
            }}
            className="btn-primary btn-green"
            style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
          >
            Log In / Sign Up
          </button>
        </div>
      </div>
    );
  }

  const copyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  // Submit UPI (Direct ID) or QR
  const handleUpiOrQr = async (e) => {
    e.preventDefault();
    const num = Number(amount);
    const minAmt = cfg?.depositMinAmount || 50;
    if (!num || num < minAmt) {
      setError(`Minimum deposit is ₹${minAmt}`);
      return;
    }
    if (!utrRef.trim()) {
      setError('12-digit UTR or Transaction reference number is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('amount', num);
      fd.append('method', tab === 'qr' ? 'QR' : 'UPI');
      if (tab === 'qr' && activeQr?._id) {
        fd.append('upiQrId', activeQr._id);
      }
      fd.append('utrReference', utrRef.trim());
      if (screenshot) fd.append('screenshot', screenshot);

      const res = await api.post('/deposit/upi', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setDone(true);
        setSubmittedDeposit(res.data.data);
        startPolling(res.data.data.depositId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  // Submit TRX Coin Deposit
  const handleCrypto = async (e) => {
    e.preventDefault();
    const num = Number(amount);
    const minAmt = cfg?.depositMinAmount || 50;
    if (!num || num < minAmt) {
      setError(`Minimum deposit is ₹${minAmt}`);
      return;
    }
    if (!txnHash.trim()) {
      setError('Blockchain Transaction Hash (TXID) is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        amount: num,
        cryptoAmount: Number(cryptoAmt) || Number((num / trxRate).toFixed(2)),
        cryptoTxnHash: txnHash.trim(),
      };
      const res = await api.post('/deposit/crypto', payload);
      if (res.data?.success) {
        setDone(true);
        setSubmittedDeposit(res.data.data);
        startPolling(res.data.data.depositId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Crypto deposit submission failed');
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    stopPolling();
    setIsDepositModalOpen(false);
    setDone(false);
    setError('');
    setAmount('500');
    setUtrRef('');
    setTxnHash('');
    setCryptoAmt('');
    setScreenshot(null);
    setLiveAlert(null);
  };

  const QUICK = ['100', '250', '500', '1000', '2000', '5000'];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={close} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }} />
      <div style={{ position: 'relative', zIndex: 1, background: '#0e0b1f', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '22px', padding: 0, width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(168,85,247,0.2)' }}>

        {/* Modal Header */}
        <div style={{ padding: '18px 20px', background: 'linear-gradient(135deg, rgba(38,18,72,0.95), rgba(20,10,40,0.95))', borderBottom: '1px solid rgba(168,85,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownLeft size={20} color="#34d399" />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '16px', color: '#fff' }}>Deposit Funds</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Manual Review · Production Grade</div>
            </div>
          </div>
          <button onClick={close} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {done ? (
          /* Submission Confirmation & Live Tracker */
          <div style={{ padding: '32px 22px', textAlign: 'center' }}>
            <div style={{ fontSize: '46px', marginBottom: '12px' }}>
              {liveAlert?.status === 'APPROVED' ? '🎉' : liveAlert?.status === 'REJECTED' ? '❌' : '⏳'}
            </div>

            <h3 style={{ color: liveAlert?.status === 'APPROVED' ? '#34d399' : liveAlert?.status === 'REJECTED' ? '#f87171' : '#fbbf24', fontWeight: 900, fontSize: '19px', marginBottom: '8px' }}>
              {liveAlert?.status === 'APPROVED'
                ? 'Deposit Approved & Credited!'
                : liveAlert?.status === 'REJECTED'
                ? 'Deposit Request Rejected'
                : 'Deposit Request Submitted!'}
            </h3>

            <p style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.5, marginBottom: '16px' }}>
              {liveAlert?.status === 'APPROVED'
                ? `₹${liveAlert.amount} has been added to your live wallet balance.`
                : liveAlert?.status === 'REJECTED'
                ? `Reason: ${liveAlert.reason || 'Verification failed. Please contact admin.'}`
                : 'Your payment proof has been submitted. Admin verifies each request manually before crediting wallet.'}
            </p>

            {/* Status card */}
            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', marginBottom: '20px', textAlign: 'left', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Amount:</span>
                <span style={{ fontWeight: 800, color: '#34d399' }}>₹{submittedDeposit?.amount || amount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Status:</span>
                <span style={{ fontWeight: 800, color: liveAlert?.status === 'APPROVED' ? '#34d399' : liveAlert?.status === 'REJECTED' ? '#f87171' : '#fbbf24' }}>
                  {liveAlert?.status || 'PENDING ADMIN APPROVAL'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Tracking ID:</span>
                <span style={{ fontFamily: 'monospace', color: '#e2e8f0', fontSize: '11px' }}>
                  {submittedDeposit?.depositId?.slice(-8) || 'SUBMITTED'}
                </span>
              </div>
            </div>

            <button
              onClick={close}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Back to Game
            </button>
          </div>
        ) : (
          <div style={{ padding: '18px 20px 24px' }}>

            {/* 3 Method Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
              {[
                { id: 'qr', label: 'Scan QR', icon: <QrCode size={14} /> },
                { id: 'upi', label: 'UPI ID', icon: <Smartphone size={14} /> },
                { id: 'crypto', label: 'TRX Coin', icon: <Coins size={14} /> },
              ].map((m) => {
                const isSelected = tab === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setTab(m.id);
                      setError('');
                    }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '12px',
                      border: isSelected ? '1.5px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(168,85,247,0.25) 0%, rgba(236,72,153,0.18) 100%)'
                        : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#f3e8ff' : '#94a3b8',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 16px rgba(168,85,247,0.3)' : 'none',
                    }}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Deposit Amount Input */}
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Deposit Amount (₹ INR)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '12px', color: '#64748b', fontWeight: 800 }}>₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={cfg?.depositMinAmount || 50}
                  placeholder={`Min ₹${cfg?.depositMinAmount || 50}`}
                  style={{ ...iStyle, paddingLeft: '32px', fontWeight: 800, fontSize: '15px' }}
                />
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {QUICK.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      border: amount === v ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                      background: amount === v ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.03)',
                      color: amount === v ? '#f3e8ff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    ₹{v}
                  </button>
                ))}
              </div>
            </div>

            {/* ── METHOD 1: SCAN QR CODE (Single Active QR from Admin) ── */}
            {tab === 'qr' && (
              <form onSubmit={handleUpiOrQr} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {activeQr ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                      <img
                        src={activeQr.imageUrl}
                        alt="Active UPI QR"
                        style={{ width: 150, height: 150, objectFit: 'contain', display: 'block' }}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#f3e8ff' }}>{activeQr.label || 'Active Merchant QR'}</div>
                      {activeQr.holderName && (
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>A/C: {activeQr.holderName}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>{activeQr.upiId}</span>
                        <button
                          type="button"
                          onClick={() => copyText(activeQr.upiId, 'upi-qr')}
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          {copied === 'upi-qr' ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                          <span>{copied === 'upi-qr' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={15} /> No active QR code set by admin. Please select UPI ID or TRX.
                  </div>
                )}

                <div>
                  <label style={lbl}>12-Digit UTR / Transaction Reference *</label>
                  <input
                    type="text"
                    value={utrRef}
                    onChange={(e) => setUtrRef(e.target.value)}
                    required
                    placeholder="Enter 12-digit UTR from receipt"
                    style={{ ...iStyle, fontFamily: 'monospace', letterSpacing: '0.5px' }}
                  />
                </div>

                <div>
                  <label style={lbl}>Payment Screenshot Proof (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files[0])}
                    style={{ ...iStyle, padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}
                  />
                </div>

                {error && <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '12px' }}>{error}</div>}

                <button
                  type="submit"
                  disabled={loading || !activeQr}
                  style={{
                    padding: '13px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: (loading || !activeQr) ? 'not-allowed' : 'pointer',
                    opacity: (loading || !activeQr) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 0 20px rgba(16,185,129,0.35)',
                  }}
                >
                  <QrCode size={16} />
                  {loading ? 'Submitting Verification...' : `Submit ₹${amount || 0} QR Deposit`}
                </button>
              </form>
            )}

            {/* ── METHOD 2: DIRECT UPI ID ── */}
            {tab === 'upi' && (
              <form onSubmit={handleUpiOrQr} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(() => {
                  const targetUpiId = activeQr?.upiId || cfg?.upiHandles?.[0]?.handle || 'luckyplay@upi';
                  return (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '14px', padding: '14px' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>TRANSFER TO OFFICIAL UPI ID</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '10px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>{targetUpiId}</span>
                        <button
                          type="button"
                          onClick={() => copyText(targetUpiId, 'upi-id')}
                          style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          {copied === 'upi-id' ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                          <span>{copied === 'upi-id' ? 'Copied' : 'Copy UPI'}</span>
                        </button>
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                        Open GPay, PhonePe, Paytm, or BHIM. Send <strong>₹{amount}</strong> to the UPI ID above and enter the 12-digit UTR below.
                      </p>
                    </div>
                  );
                })()}

                <div>
                  <label style={lbl}>12-Digit UTR / Reference Number *</label>
                  <input
                    type="text"
                    value={utrRef}
                    onChange={(e) => setUtrRef(e.target.value)}
                    required
                    placeholder="Enter 12-digit UTR"
                    style={{ ...iStyle, fontFamily: 'monospace', letterSpacing: '0.5px' }}
                  />
                </div>

                <div>
                  <label style={lbl}>Payment Screenshot Proof (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files[0])}
                    style={{ ...iStyle, padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}
                  />
                </div>

                {error && <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '12px' }}>{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '13px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 0 20px rgba(16,185,129,0.35)',
                  }}
                >
                  <Smartphone size={16} />
                  {loading ? 'Submitting Verification...' : `Submit ₹${amount || 0} UPI Deposit`}
                </button>
              </form>
            )}

            {/* ── METHOD 3: TRX COIN (Dynamic 1 TRX = X INR) ── */}
            {tab === 'crypto' && (
              <form onSubmit={handleCrypto} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Dynamic TRX Exchange Rate Banner */}
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Coins size={16} color="#fbbf24" />
                    <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 800 }}>LIVE TRX RATE:</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff' }}>
                    1 TRX = <span style={{ color: '#38bdf8' }}>₹{trxRate.toFixed(2)} INR</span>
                  </div>
                </div>

                {/* Dual Two-Way TRX Calculator */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={lbl}>INR Amount (₹)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{ ...iStyle, fontWeight: 700 }}
                      placeholder="₹ Amount"
                    />
                  </div>
                  <div>
                    <label style={lbl}>Exact TRX Needed</label>
                    <input
                      type="number"
                      step="0.01"
                      value={cryptoAmt}
                      onChange={(e) => handleTrxInputChange(e.target.value)}
                      style={{ ...iStyle, fontWeight: 800, color: '#fbbf24' }}
                      placeholder="TRX Amount"
                    />
                  </div>
                </div>

                {/* TRX Wallet Address & QR Code */}
                {(() => {
                  const trxWallet = cfg?.cryptoWalletAddress || cfg?.tronWallet || '';
                  return (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '14px', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>OFFICIAL TRON (TRC-20) WALLET</span>
                        <span style={{ fontSize: '10px', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>TRC20 ONLY</span>
                      </div>

                      {cfg?.cryptoQrImageUrl && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                          <img
                            src={cfg.cryptoQrImageUrl}
                            alt="TRX QR"
                            style={{ width: 120, height: 120, objectFit: 'contain', background: '#fff', borderRadius: '10px', padding: '6px' }}
                          />
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '10px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#fbbf24', wordBreak: 'break-all', flex: 1 }}>
                          {trxWallet || 'Wallet not configured. Please contact admin.'}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(trxWallet, 'trx-addr')}
                          disabled={!trxWallet}
                          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: trxWallet ? 'pointer' : 'not-allowed', flexShrink: 0 }}
                        >
                          {copied === 'trx-addr' ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label style={lbl}>Blockchain Transaction Hash (TXID) *</label>
                  <input
                    type="text"
                    value={txnHash}
                    onChange={(e) => setTxnHash(e.target.value)}
                    required
                    placeholder="Enter TRON TXID from TronLink or exchange"
                    style={{ ...iStyle, fontFamily: 'monospace', fontSize: '12px' }}
                  />
                </div>

                {error && <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '12px' }}>{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '13px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 0 20px rgba(245,158,11,0.35)',
                  }}
                >
                  <Coins size={16} />
                  {loading ? 'Submitting Blockchain Proof...' : `Submit ${cryptoAmt || 0} TRX (₹${amount}) Deposit`}
                </button>
              </form>
            )}

            <p style={{ marginTop: '14px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
              Manual verification ensures 100% security · Live wallet credit upon admin approval
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositModal;
