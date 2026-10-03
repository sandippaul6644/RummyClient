import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { X, ArrowUpRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/sound.js';

export const WithdrawModal = () => {
  const { isWithdrawModalOpen, setIsWithdrawModalOpen, wallet, setWallet } = useAuth();
  const [amount, setAmount] = useState('50');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  if (!isWithdrawModalOpen) return null;

  const currentBalance = wallet ? Number(wallet.balance) : 0;

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    sound.playClick();
    try {
      const res = await api.post('/wallet/withdraw', {
        amount: Number(amount),
        accountDetails: address,
        paymentMethod: 'crypto_usdt',
      });

      if (res.data?.success) {
        setWallet(res.data.data.wallet);
        sound.playWin();
        setSuccessMsg(`Withdrawal request for ₹${Number(amount).toFixed(2)} submitted for security processing!`);
        setTimeout(() => {
          setIsWithdrawModalOpen(false);
          setSuccessMsg('');
        }, 1800);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsWithdrawModalOpen(false)}>
      <div
        className="glass-panel modal-content"
        style={{
          padding: '24px',
          borderRadius: '20px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { sound.playClick(); setIsWithdrawModalOpen(false); }}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8'
          }}>
            <ArrowUpRight size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Request Withdrawal</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Available Balance: <span style={{ color: '#34d399', fontWeight: 700 }}>₹{currentBalance.toFixed(2)}</span></p>
          </div>
        </div>

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                Withdrawal Amount (₹ INR)
              </label>
              <button
                type="button"
                onClick={() => setAmount(String(Math.floor(currentBalance)))}
                style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Max (₹{currentBalance.toFixed(2)})
              </button>
            </div>
            <input
              type="number"
              min="10"
              max={currentBalance}
              className="glass-input font-mono"
              style={{ width: '100%', fontSize: '18px', fontWeight: 700 }}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
              UPI ID / Bank IFSC Account / Crypto Address
            </label>
            <input
              type="text"
              className="glass-input font-mono"
              style={{ width: '100%', fontSize: '13px' }}
              placeholder="e.g. user@okhdfcbank or Bank A/C + IFSC"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
            <ShieldCheck size={14} style={{ color: '#10b981' }} /> Automatic compliance check and rapid payout processing
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            disabled={loading || currentBalance < 10 || Number(amount) > currentBalance}
          >
            {loading ? 'Submitting...' : `Withdraw ₹${Number(amount || 0).toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
};
