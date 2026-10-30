/**
 * WithdrawModal — Multi-step withdrawal flow with method-specific fields, fee preview, and confirmation
 * FEAT-007: Complete withdrawal modal with all requirements
 */
import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, CheckCircle2, AlertTriangle, Info, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api }     from '../services/api.js';

const iStyle = { width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#fff', fontSize:'14px', outline:'none', boxSizing:'border-box' };
const lbl    = { display:'block', fontSize:'11px', fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:'6px', letterSpacing:'0.5px' };

const METHODS = {
  upi: {
    label: 'UPI', icon: '📱', fields: [
      { key: 'upiId', label: 'UPI ID', placeholder: 'username@bank', regex: /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/, error: 'Invalid UPI format (e.g., john@upi)' }
    ]
  },
  bank: {
    label: 'Bank', icon: '🏦', fields: [
      { key: 'accountNumber', label: 'Account Number', placeholder: 'XXXXXXXXXX', regex: /^\d{8,17}$/, error: 'Account number must be 8-17 digits' },
      { key: 'ifsc', label: 'IFSC Code', placeholder: 'HDFC0001234', regex: /^[A-Z]{4}0[A-Z0-9]{6}$/, error: 'Invalid IFSC format' },
      { key: 'holderName', label: 'Account Holder Name', placeholder: 'John Doe', regex: /^[a-zA-Z\s]{3,50}$/, error: 'Name must be 3-50 characters, letters only' },
      { key: 'accountType', label: 'Account Type', options: ['Savings', 'Checking', 'Current'], placeholder: 'Select type' }
    ]
  },
  crypto_trx: {
    label: 'TRX', icon: '₮', fields: [
      { key: 'walletAddress', label: 'TRC20 Wallet Address', placeholder: 'T...', regex: /^T[a-zA-Z0-9]{33}$/, error: 'Invalid TRC20 address (must start with T, 34 chars)' }
    ]
  }
};

export const WithdrawModal = () => {
  const { isWithdrawModalOpen, setIsWithdrawModalOpen, wallet, refreshWallet, user, setIsAuthModalOpen } = useAuth();
  const [step, setStep] = useState('amount'); // 'amount' | 'method' | 'confirm' | 'success'
  const [cfg, setCfg] = useState(null);
  const [method, setMethod] = useState('upi');
  const [amount, setAmount] = useState('');
  const [feeData, setFeeData] = useState(null);
  const [methodDetails, setMethodDetails] = useState({});
  const [tcChecked, setTcChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (!isWithdrawModalOpen) {
      setStep('amount');
      setAmount('');
      setMethod('upi');
      setMethodDetails({});
      setFeeData(null);
      setError('');
      setValidationErrors({});
      setTcChecked(false);
    }
  }, [isWithdrawModalOpen]);

  useEffect(() => {
    if (!isWithdrawModalOpen) return;
    api.get('/payment-config')
      .then(r => { if (r.data?.success) setCfg(r.data.data); })
      .catch(() => {});
  }, [isWithdrawModalOpen]);

  // Calculate fees when amount changes
  useEffect(() => {
    if (amount && Number(amount) > 0 && cfg) {
      calculateFees(Number(amount), method);
    }
  }, [amount, method, cfg]);

  const calculateFees = async (amt, mtd) => {
    setCalcLoading(true);
    try {
      const res = await api.post('/admin/withdrawals/calculate-fees', {
        amount: amt,
        paymentMethod: mtd
      });
      if (res.data?.success) {
        setFeeData(res.data.data);
      }
    } catch (err) {
      console.error('Fee calculation failed:', err);
    } finally {
      setCalcLoading(false);
    }
  };

  const validateField = (key, value, fieldDef) => {
    if (!value && key !== 'accountType') {
      return `${fieldDef.label} is required`;
    }
    if (fieldDef.regex && !fieldDef.regex.test(value)) {
      return fieldDef.error;
    }
    return '';
  };

  const validateMethodDetails = () => {
    const errors = {};
    const methodFields = METHODS[method].fields;
    
    methodFields.forEach(field => {
      const val = methodDetails[field.key] || '';
      const err = validateField(field.key, val, field);
      if (err) errors[field.key] = err;
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAmountNext = () => {
    const num = Number(amount) || 0;
    const minW = cfg?.withdrawalMinAmount || 100;
    const maxW = cfg?.withdrawalMaxAmount || 50000;
    const balance = wallet ? Number(wallet.balance) : 0;

    if (!amount || num === 0) {
      setError('Please enter an amount');
      return;
    }
    if (num < minW) {
      setError(`Minimum withdrawal is ₹${minW}`);
      return;
    }
    if (num > maxW) {
      setError(`Maximum withdrawal is ₹${maxW}`);
      return;
    }
    if (num > balance) {
      setError('Insufficient balance');
      return;
    }

    setError('');
    setStep('method');
  };

  const handleMethodNext = () => {
    if (!validateMethodDetails()) {
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleSubmit = async () => {
    if (!tcChecked) {
      setError('Please accept the terms and conditions');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Build accountDetails based on method
      let accountDetails = '';
      if (method === 'upi') {
        accountDetails = methodDetails.upiId;
      } else if (method === 'bank') {
        accountDetails = `${methodDetails.accountNumber}/${methodDetails.ifsc}/${methodDetails.holderName}/${methodDetails.accountType}`;
      } else if (method === 'crypto_trx') {
        accountDetails = methodDetails.walletAddress;
      }

      const res = await api.post('/withdrawals', {
        amount: Number(amount),
        paymentMethod: method,
        accountDetails
      });

      if (res.data?.success) {
        setStep('success');
        setTimeout(() => {
          refreshWallet?.();
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Withdrawal submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setIsWithdrawModalOpen(false);
  };

  if (!isWithdrawModalOpen) return null;

  if (!user) {
    return (
      <div className="modal-overlay" onClick={() => setIsWithdrawModalOpen(false)}>
        <div
          className="glass-panel modal-content"
          style={{ width: '100%', maxWidth: '420px', padding: '28px 24px', textAlign: 'center', margin: 'auto', position: 'relative', borderRadius: '24px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIsWithdrawModalOpen(false)}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
          <div
            style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}
          >
            <ArrowUpRight size={28} color="#ef4444" />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Sign In to Withdraw</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.5 }}>You must be logged in to request a withdrawal.</p>
          <button
            onClick={() => {
              setIsWithdrawModalOpen(false);
              setIsAuthModalOpen(true);
            }}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 800, background: 'linear-gradient(135deg, #00e676 0%, #059669 100%)', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            Log In / Sign Up
          </button>
        </div>
      </div>
    );
  }

  const balance = wallet ? Number(wallet.balance) : 0;
  const minW = cfg?.withdrawalMinAmount || 100;
  const maxW = cfg?.withdrawalMaxAmount || 50000;
  const num = Number(amount) || 0;

  const QUICK = ['100', '250', '500', '1000', '2000', '5000'];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div onClick={close} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }}/>
      <div style={{ position:'relative', zIndex:1, background:'#0c1120', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', width:'100%', maxWidth:'440px', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'20px 22px 16px', background:'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(249,115,22,0.08))', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:38, height:38, borderRadius:'10px', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ArrowUpRight size={18} color="#f87171"/>
            </div>
            <div>
              <div style={{ fontWeight:900, fontSize:'16px', color:'#fff' }}>Withdraw Funds</div>
              <div style={{ fontSize:'11px', color:'#64748b' }}>Balance: <span style={{ color:'#34d399', fontWeight:700 }}>₹{balance.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
            </div>
          </div>
          <button onClick={close} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b', padding:'7px', borderRadius:'8px', cursor:'pointer', display:'flex' }}><X size={16}/></button>
        </div>

        {/* Success Screen */}
        {step === 'success' && (
          <div style={{ padding:'40px 24px', textAlign:'center' }}>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>✅</div>
            <h3 style={{ color:'#34d399', fontWeight:900, fontSize:'18px', marginBottom:'8px' }}>Request Submitted!</h3>
            <p style={{ color:'#94a3b8', fontSize:'13px', lineHeight:1.6, marginBottom:'16px' }}>
              Your withdrawal request has been sent to our team. We'll process within <strong style={{ color:'#fbbf24' }}>24–48 hours</strong>.
            </p>
            {feeData && (
              <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', marginBottom:'20px', fontSize:'13px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}>
                  <span style={{ color:'#94a3b8' }}>Requested</span>
                  <span style={{ fontWeight:700, color:'#fff' }}>₹{feeData.amount}</span>
                </div>
                {feeData.feeAmount > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', color:'#f87171' }}>
                    <span>Fee ({feeData.feePercent}%)</span>
                    <span style={{ fontWeight:700 }}>-₹{feeData.feeAmount}</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderTop:'1px solid rgba(255,255,255,0.04)', marginTop:'6px' }}>
                  <span style={{ color:'#94a3b8' }}>You'll receive</span>
                  <span style={{ fontWeight:700, color:'#34d399' }}>₹{feeData.netAmount}</span>
                </div>
              </div>
            )}
            <button onClick={close} style={{ padding:'12px 24px', borderRadius:'12px', border:'none', background:'rgba(52,211,153,0.85)', color:'#fff', fontWeight:800, fontSize:'14px', cursor:'pointer' }}>Done</button>
          </div>
        )}

        {/* Amount Selection */}
        {step === 'amount' && (
          <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                <label style={lbl}>Withdrawal Amount (₹)</label>
                <button type="button" onClick={()=>setAmount(String(Math.min(balance, maxW).toFixed(0)))} style={{ background:'none', border:'none', color:'#818cf8', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>MAX ₹{Math.min(balance,maxW).toFixed(0)}</button>
              </div>
              <input type="number" min={minW} max={Math.min(balance,maxW)} value={amount} onChange={e=>setAmount(e.target.value)} placeholder={`Min ₹${minW}, Max ₹${maxW}`} style={iStyle}/>
            </div>

            {/* Quick select buttons */}
            <div>
              <label style={lbl}>Quick Select</label>
              <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                {QUICK.map(v=>(
                  <button key={v} type="button" onClick={()=>setAmount(v)} style={{ padding:'6px 12px', borderRadius:'10px', border:`1.5px solid ${amount===v?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.08)'}`, background:amount===v?'rgba(239,68,68,0.1)':'transparent', color:amount===v?'#f87171':'#64748b', fontSize:'12px', fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>
                    ₹{v}
                  </button>
                ))}
              </div>
            </div>

            {/* Fee preview */}
            {num > 0 && feeData && (
              <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', fontSize:'12px' }}>
                <div style={{ fontWeight:800, color:'#94a3b8', marginBottom:'8px', display:'flex', alignItems:'center', gap:'6px' }}>
                  <Info size={13} color="#64748b"/> Fee Breakdown
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color:'#475569' }}>Amount</span>
                  <span style={{ fontWeight:700, color:'#fff' }}>₹{feeData.amount.toFixed(2)}</span>
                </div>
                {feeData.feeAmount > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color:'#475569' }}>Fee ({feeData.feePercent}%)</span>
                    <span style={{ fontWeight:700, color:'#f87171' }}>-₹{feeData.feeAmount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0' }}>
                  <span style={{ color:'#94a3b8', fontWeight:700 }}>You Receive</span>
                  <span style={{ fontWeight:900, color:'#34d399', fontSize:'13px' }}>₹{feeData.netAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            {error && <div style={{ padding:'10px 14px', borderRadius:'10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:'12px', display:'flex', alignItems:'center', gap:'7px' }}><AlertTriangle size={13}/>{error}</div>}

            <button type="button" onClick={handleAmountNext} disabled={!amount || num === 0} style={{ padding:'14px', borderRadius:'12px', border:'none', background: (!amount || num === 0)?'rgba(255,255,255,0.05)':'rgba(239,68,68,0.85)', color:(!amount || num === 0)?'#334155':'#fff', fontWeight:900, fontSize:'15px', cursor:(!amount || num === 0)?'not-allowed':'pointer', transition:'all 0.2s' }}>
              Continue →
            </button>
          </div>
        )}

        {/* Method Selection */}
        {step === 'method' && (
          <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:'14px' }}>
            {/* Method tabs */}
            <div>
              <label style={lbl}>Withdrawal Method</label>
              <div style={{ display:'flex', gap:'6px', marginBottom:'14px' }}>
                {Object.entries(METHODS).map(([key, m]) => (
                  <button key={key} type="button" onClick={() => { setMethod(key); setMethodDetails({}); setValidationErrors({}); }}
                    style={{ flex:1, padding:'10px 6px', borderRadius:'12px', border:`1.5px solid ${method===key?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.08)'}`, background:method===key?'rgba(239,68,68,0.1)':'transparent', color:method===key?'#f87171':'#64748b', fontWeight:700, fontSize:'13px', cursor:'pointer', transition:'all 0.15s' }}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>

              {/* Method-specific fields */}
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {METHODS[method].fields.map(field => (
                  <div key={field.key}>
                    <label style={lbl}>{field.label} *</label>
                    {field.options ? (
                      <select value={methodDetails[field.key] || ''} onChange={e => setMethodDetails({...methodDetails, [field.key]: e.target.value})} style={{ ...iStyle, cursor:'pointer' }}>
                        <option value="">{field.placeholder}</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <input type="text" value={methodDetails[field.key] || ''} onChange={e => { setMethodDetails({...methodDetails, [field.key]: e.target.value}); if (validationErrors[field.key]) setValidationErrors({...validationErrors, [field.key]: ''}); }} placeholder={field.placeholder} style={{ ...iStyle, borderColor: validationErrors[field.key] ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)' }}/>
                        {validationErrors[field.key] && <p style={{ margin:'4px 0 0', fontSize:'11px', color:'#f87171' }}>✗ {validationErrors[field.key]}</p>}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && <div style={{ padding:'10px 14px', borderRadius:'10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:'12px', display:'flex', alignItems:'center', gap:'7px' }}><AlertTriangle size={13}/>{error}</div>}

            <div style={{ display:'flex', gap:'8px' }}>
              <button type="button" onClick={() => { setStep('amount'); setValidationErrors({}); }} style={{ flex:1, padding:'12px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'#94a3b8', fontWeight:800, fontSize:'14px', cursor:'pointer' }}>← Back</button>
              <button type="button" onClick={handleMethodNext} style={{ flex:1, padding:'12px', borderRadius:'12px', border:'none', background:'rgba(239,68,68,0.85)', color:'#fff', fontWeight:800, fontSize:'14px', cursor:'pointer' }}>Continue →</button>
            </div>
          </div>
        )}

        {/* Confirmation */}
        {step === 'confirm' && feeData && (
          <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={{ padding:'14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px' }}>
              <div style={{ fontSize:'12px', color:'#64748b', marginBottom:'8px', fontWeight:700 }}>WITHDRAWAL SUMMARY</div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color:'#94a3b8' }}>Method</span>
                <span style={{ fontWeight:700, color:'#fff' }}>{METHODS[method].label}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color:'#94a3b8' }}>Amount Requested</span>
                <span style={{ fontWeight:700, color:'#fff' }}>₹{feeData.amount.toFixed(2)}</span>
              </div>
              {feeData.feeAmount > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color:'#94a3b8' }}>Processing Fee</span>
                  <span style={{ fontWeight:700, color:'#f87171' }}>-₹{feeData.feeAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 6px', background:'rgba(52,211,153,0.05)', borderRadius:'8px', marginTop:'6px' }}>
                <span style={{ color:'#94a3b8', fontWeight:700 }}>Final Amount</span>
                <span style={{ fontWeight:900, color:'#34d399', fontSize:'14px' }}>₹{feeData.netAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* T&C Checkbox */}
            <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer' }}>
              <input type="checkbox" checked={tcChecked} onChange={e => setTcChecked(e.target.checked)} style={{ marginTop:'2px', cursor:'pointer', accentColor:'#34d399' }}/>
              <span style={{ fontSize:'12px', color:'#94a3b8', lineHeight:1.5 }}>
                I confirm that the withdrawal details are correct and accept that funds will be processed within 24–48 hours after approval.
              </span>
            </label>

            {error && <div style={{ padding:'10px 14px', borderRadius:'10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:'12px', display:'flex', alignItems:'center', gap:'7px' }}><AlertTriangle size={13}/>{error}</div>}

            <div style={{ display:'flex', gap:'8px' }}>
              <button type="button" onClick={() => setStep('method')} disabled={loading} style={{ flex:1, padding:'12px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'#94a3b8', fontWeight:800, fontSize:'14px', cursor:loading?'not-allowed':'pointer', opacity:loading?0.5:1 }}>← Back</button>
              <button type="button" onClick={handleSubmit} disabled={!tcChecked || loading} style={{ flex:1, padding:'12px', borderRadius:'12px', border:'none', background: (!tcChecked || loading)?'rgba(255,255,255,0.05)':'rgba(239,68,68,0.85)', color:(!tcChecked || loading)?'#334155':'#fff', fontWeight:800, fontSize:'14px', cursor:(!tcChecked || loading)?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                {loading?<><Loader size={14} className="animate-spin"/> Submitting...</>:'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
