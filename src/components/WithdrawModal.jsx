/**
 * WithdrawModal — method selection + dynamic fee breakdown + submission
 */
import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api }     from '../services/api.js';

const iStyle = { width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#fff', fontSize:'14px', outline:'none', boxSizing:'border-box' };
const lbl    = { display:'block', fontSize:'11px', fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:'6px', letterSpacing:'0.5px' };

const METHODS = [
  { key:'upi',        label:'UPI', icon:'📱', placeholder:'user@upi / PhonePe / GPay ID' },
  { key:'bank',       label:'Bank',icon:'🏦', placeholder:'Account No + IFSC (e.g. 9876543210/HDFC0001234)' },
  { key:'crypto_trx', label:'TRX', icon:'₮',  placeholder:'TRC20 wallet address' },
];

export const WithdrawModal = () => {
  const { isWithdrawModalOpen, setIsWithdrawModalOpen, wallet, refreshWallet } = useAuth();
  const [cfg,      setCfg]    = useState(null);
  const [method,   setMethod] = useState('upi');
  const [amount,   setAmount] = useState('');
  const [address,  setAddress]= useState('');
  const [loading,  setLoading]= useState(false);
  const [done,     setDone]   = useState(false);
  const [error,    setError]  = useState('');

  useEffect(() => {
    if (!isWithdrawModalOpen) return;
    api.get('/payment-config').then(r => { if (r.data?.success) setCfg(r.data.data); }).catch(() => {});
  }, [isWithdrawModalOpen]);

  if (!isWithdrawModalOpen) return null;

  const balance    = wallet ? Number(wallet.balance) : 0;
  const num        = Number(amount) || 0;
  const feePercent = cfg?.withdrawalFeePercent || 0;
  const feeAmount  = Number(((num * feePercent) / 100).toFixed(2));
  const netAmount  = Number((num - feeAmount).toFixed(2));
  const minW       = cfg?.withdrawalMinAmount || 100;
  const maxW       = cfg?.withdrawalMaxAmount || 50000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (num < minW) { setError(`Minimum withdrawal is ₹${minW}`); return; }
    if (num > maxW) { setError(`Maximum withdrawal is ₹${maxW}`); return; }
    if (num > balance) { setError('Insufficient balance'); return; }
    if (!address.trim()) { setError('Account details required'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/wallet/withdraw', {
        amount: num,
        accountDetails: address.trim(),
        paymentMethod: method,
      });
      if (res.data?.success) {
        setDone(true);
        refreshWallet?.();
      }
    } catch (err) { setError(err.response?.data?.message || 'Withdrawal failed'); }
    finally { setLoading(false); }
  };

  const close = () => {
    setIsWithdrawModalOpen(false);
    setDone(false); setError(''); setAmount(''); setAddress('');
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div onClick={close} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }}/>
      <div style={{ position:'relative', zIndex:1, background:'#0c1120', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', width:'100%', maxWidth:'420px', overflow:'hidden' }}>

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

        {done ? (
          <div style={{ padding:'40px 24px', textAlign:'center' }}>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>🎉</div>
            <h3 style={{ color:'#34d399', fontWeight:900, fontSize:'18px', marginBottom:'8px' }}>Withdrawal Requested!</h3>
            <p style={{ color:'#94a3b8', fontSize:'13px', lineHeight:1.6, marginBottom:'8px' }}>
              ₹{num} has been deducted from your wallet.
            </p>
            {feeAmount > 0 && (
              <p style={{ color:'#fbbf24', fontSize:'12px', marginBottom:'8px' }}>
                Fee: ₹{feeAmount} ({feePercent}%) · You receive: ₹{netAmount}
              </p>
            )}
            <p style={{ color:'#64748b', fontSize:'12px', marginBottom:'20px' }}>Processing time: 1–24 hours</p>
            <button onClick={close} style={{ padding:'12px 24px', borderRadius:'12px', border:'none', background:'rgba(52,211,153,0.85)', color:'#fff', fontWeight:800, fontSize:'14px', cursor:'pointer' }}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:'14px' }}>

            {/* Method */}
            <div>
              <label style={lbl}>Withdrawal Method</label>
              <div style={{ display:'flex', gap:'6px' }}>
                {METHODS.map(m=>(
                  <button key={m.key} type="button" onClick={()=>{ setMethod(m.key); setAddress(''); }}
                    style={{ flex:1, padding:'9px 4px', borderRadius:'10px', border:`1.5px solid ${method===m.key?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.08)'}`, background:method===m.key?'rgba(239,68,68,0.1)':'transparent', color:method===m.key?'#f87171':'#64748b', fontWeight:700, fontSize:'12px', cursor:'pointer' }}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                <label style={lbl}>Amount (₹)</label>
                <button type="button" onClick={()=>setAmount(String(Math.min(balance, maxW).toFixed(0)))} style={{ background:'none', border:'none', color:'#818cf8', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>MAX ₹{Math.min(balance,maxW).toFixed(0)}</button>
              </div>
              <input type="number" min={minW} max={Math.min(balance,maxW)} value={amount} onChange={e=>setAmount(e.target.value)} placeholder={`₹${minW} – ₹${maxW}`} style={iStyle} required/>
            </div>

            {/* Account details */}
            <div>
              <label style={lbl}>{METHODS.find(m=>m.key===method)?.label} Details</label>
              <input type="text" value={address} onChange={e=>setAddress(e.target.value)} placeholder={METHODS.find(m=>m.key===method)?.placeholder} style={iStyle} required/>
            </div>

            {/* Fee breakdown */}
            {num > 0 && (
              <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', fontSize:'12px' }}>
                <div style={{ fontWeight:800, color:'#94a3b8', marginBottom:'8px', display:'flex', alignItems:'center', gap:'6px' }}>
                  <Info size={13} color="#64748b"/> Breakdown
                </div>
                {[
                  ['Requested',  `₹${num.toFixed(2)}`,     '#fff'],
                  feeAmount > 0 ? [`Fee (${feePercent}%)`, `-₹${feeAmount.toFixed(2)}`, '#f87171'] : null,
                  ['You receive', `₹${netAmount.toFixed(2)}`, '#34d399'],
                ].filter(Boolean).map(([label,val,color])=>(
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color:'#475569' }}>{label}</span>
                    <span style={{ fontWeight:700, color }}>{val}</span>
                  </div>
                ))}
              </div>
            )}

            {error && <div style={{ padding:'10px 14px', borderRadius:'10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:'12px', display:'flex', alignItems:'center', gap:'7px' }}><AlertTriangle size={13}/>{error}</div>}

            <button type="submit" disabled={loading||!amount||!address} style={{ padding:'14px', borderRadius:'12px', border:'none', background: (loading||!amount||!address)?'rgba(255,255,255,0.05)':'rgba(239,68,68,0.85)', color:(loading||!amount||!address)?'#334155':'#fff', fontWeight:900, fontSize:'15px', cursor:(loading||!amount||!address)?'not-allowed':'pointer', transition:'all 0.2s' }}>
              {loading?'Submitting…':`Withdraw ₹${num.toFixed(2)}${feeAmount>0?` (fee ₹${feeAmount})`:''}`}
            </button>
            <p style={{ textAlign:'center', fontSize:'11px', color:'#1e293b' }}>Processed within 1–24 hours · Requires KYC verification</p>
          </form>
        )}
      </div>
    </div>
  );
};
