import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { X, ArrowDownRight, Wallet, CheckCircle2, Sparkles, CreditCard, Coins } from 'lucide-react';
import { sound } from '../utils/sound.js';
import confetti from 'canvas-confetti';

export const DepositModal = () => {
  const { isDepositModalOpen, setIsDepositModalOpen, setWallet, refreshWallet } = useAuth();
  const [amount, setAmount] = useState('100');
  const [method, setMethod] = useState('upi');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  if (!isDepositModalOpen) return null;

  const quickAmounts = ['50', '100', '250', '500', '1000'];

  const handleDeposit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    sound.playClick();
    try {
      const res = await api.post('/wallet/deposit', {
        amount: Number(amount),
        paymentMethod: method,
      });

      if (res.data?.success) {
        setWallet(res.data.data.wallet);
        sound.playWin();
        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
        setSuccessMsg(`Successfully credited +₹${Number(amount).toFixed(2)} to your bankroll!`);
        setTimeout(() => {
          setIsDepositModalOpen(false);
          setSuccessMsg('');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsDepositModalOpen(false)}>
      <div
        className="glass-panel modal-content"
        style={{
          padding: '24px',
          borderRadius: '20px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { sound.playClick(); setIsDepositModalOpen(false); }}
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
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399'
          }}>
            <ArrowDownRight size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Deposit Funds</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Instant reload with zero network fees</p>
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

        <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
              Select Payment Method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                {
                  id: 'upi',
                  label: 'UPI',
                  subtitle: 'Instant Pay',
                  brandColor: '#10b981',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#F0B90B">
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
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '11px',
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M2.5 3.5L21.5 8L13.5 21.5L2.5 3.5Z" fill="#EF0027" stroke="#EF0027" strokeWidth="1" strokeLinejoin="round"/>
                      <path d="M2.5 3.5L13.5 10L13.5 21.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinejoin="round"/>
                      <path d="M21.5 8L9.5 12" stroke="#FFFFFF" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                  ),
                },
              ].map((m) => {
                const isSelected = method === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => {
                      sound.playClick();
                      setMethod(m.id);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: isSelected ? `1px solid ${m.brandColor}` : '1px solid rgba(255,255,255,0.08)',
                      background: isSelected ? `${m.brandColor}18` : 'rgba(15, 23, 42, 0.6)',
                      color: isSelected ? '#ffffff' : '#cbd5e1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: isSelected ? `0 0 12px ${m.brandColor}33` : 'none',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {m.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: '10px', color: isSelected ? m.brandColor : '#64748b' }}>
                        {m.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
              Deposit Amount (₹ INR)
            </label>
            <input
              type="number"
              min="1"
              max="50000"
              className="glass-input font-mono"
              style={{ width: '100%', fontSize: '18px', fontWeight: 700 }}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {quickAmounts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => { sound.playClick(); setAmount(q); }}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: amount === q ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.05)',
                  border: amount === q ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                +₹{q}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="btn-primary btn-green"
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            disabled={loading}
          >
            {loading ? 'Crediting Wallet...' : `Confirm Deposit ₹${Number(amount || 0).toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
};
