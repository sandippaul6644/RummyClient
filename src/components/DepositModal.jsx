/**
 * DepositModal — UPI QR Code or Crypto (TRX) deposit request
 */
import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ArrowDownLeft, Smartphone, Bitcoin, AlertTriangle, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api }     from '../services/api.js';

const iStyle = { width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#fff', fontSize:'14px', outline:'none', boxSizing:'border-box' };
const lbl    = { display:'block', fontSize:'11px', fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:'6px', letterSpacing:'0.5px' };

export const DepositModal = () => {
  const { isDepositModalOpen, setIsDepositModalOpen, refreshWallet } = useAuth();
  const [tab,        setTab]        = useState('upi');
  const [cfg,        setCfg]        = useState(null);
  const [activeQr,   setActiveQr]   = useState(null);
  const [amount,     setAmount]     = useState('');
  const [utrRef,     setUtrRef]     = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [txnHash,    setTxnHash]    = useState('');
  const [cryptoAmt,  setCryptoAmt]  = useState('');
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState('');
  const [copied,     setCopied]     = useState('');

  useEffect(() => {
    if (!isDepositModalOpen) return;
    api.get('/payment-config').then(r => { if (r.data?.success) setCfg(r.data.data); }).catch(() => {});
    api.get('/deposit/upi-qr').then(r => { if (r.data?.success) setActiveQr(r.data.data); }).catch(() => {});
  }, [isDepositModalOpen]);

  if (!isDepositModalOpen) return null;

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleUpi = async (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num < (cfg?.depositMinAmount || 50)) { setError(`Minimum deposit is ₹${cfg?.depositMinAmount || 50}`); return; }
    if (!utrRef.trim()) { setError('UTR/reference number is required'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('amount', num);
      fd.append('upiQrId', activeQr?._id || '');
      fd.append('utrReference', utrRef.trim());
      if (screenshot) fd.append('screenshot', screenshot);
      const res = await api.post('/deposit/upi', fd, { headers:{ 'Content-Type':'multipart/form-data' }});
      if (res.data?.success) { setDone(true); }
    } catch (err) { setError(err.response?.data?.message || 'Submission failed'); }
    finally { setLoading(false); }
  };

  const handleCrypto = async (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num < (cfg?.depositMinAmount || 50)) { setError(`Minimum deposit is ₹${cfg?.depositMinAmount || 50}`); return; }
    if (!txnHash.trim()) { setError('Transaction hash is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/deposit/crypto', { amount: num, cryptoAmount: Number(cryptoAmt)||0, cryptoTxnHash: txnHash.trim() });
      if (res.data?.success) { setDone(true); }
    } catch (err) { setError(err.response?.data?.message || 'Submission failed'); }
    finally { setLoading(false); }
  };

  const close = () => {
    setIsDepositModalOpen(false);
    setDone(false); setError(''); setAmount(''); setUtrRef(''); setTxnHash(''); setCryptoAmt(''); setScreenshot(null);
  };

  const QUICK = ['100','250','500','1000','2000','5000'];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div onClick={close} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }}/>
      <div style={{ position:'relative', zIndex:1, background:'#0c1120', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', padding:'0', width:'100%', maxWidth:'420px', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'20px 22px 16px', background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(52,211,153,0.08))', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:38, height:38, borderRadius:'10px', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ArrowDownLeft size={18} color="#34d399"/>
            </div>
            <div>
              <div style={{ fontWeight:900, fontSize:'16px', color:'#fff' }}>Deposit Funds</div>
              <div style={{ fontSize:'11px', color:'#64748b' }}>Admin-reviewed · Secure</div>
            </div>
          </div>
          <button onClick={close} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b', padding:'7px', borderRadius:'8px', cursor:'pointer', display:'flex' }}><X size={16}/></button>
        </div>

        {done ? (
          <div style={{ padding:'40px 24px', textAlign:'center' }}>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>✅</div>
            <h3 style={{ color:'#34d399', fontWeight:900, fontSize:'18px', marginBottom:'8px' }}>Request Submitted!</h3>
            <p style={{ color:'#94a3b8', fontSize:'13px', lineHeight:1.6, marginBottom:'20px' }}>
              Your deposit request has been sent to our team. We typically process within <strong style={{ color:'#fbbf24' }}>15–30 minutes</strong>. Your wallet will be credited once approved.
            </p>
            <button onClick={close} style={{ padding:'12px 24px', borderRadius:'12px', border:'none', background:'rgba(52,211,153,0.85)', color:'#fff', fontWeight:800, fontSize:'14px', cursor:'pointer' }}>Done</button>
          </div>
        ) : (
          <div style={{ padding:'20px 22px' }}>

            {/* Method tabs */}
            <div style={{ display:'flex', gap:'8px', marginBottom:'18px' }}>
              {[['upi','📱 UPI / QR'],['crypto','₮ TRX Crypto']].map(([key,label])=>(
                <button key={key} onClick={()=>{ setTab(key); setError(''); }}
                  style={{ flex:1, padding:'10px', borderRadius:'12px', border:`1.5px solid ${tab===key?'rgba(16,185,129,0.5)':'rgba(255,255,255,0.08)'}`, background:tab===key?'rgba(16,185,129,0.1)':'transparent', color:tab===key?'#34d399':'#64748b', fontWeight:700, fontSize:'13px', cursor:'pointer', transition:'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div style={{ marginBottom:'14px' }}>
              <label style={lbl}>Deposit Amount (₹)</label>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} min={cfg?.depositMinAmount||50} placeholder={`Min ₹${cfg?.depositMinAmount||50}`} style={iStyle}/>
              <div style={{ display:'flex', gap:'5px', marginTop:'8px', flexWrap:'wrap' }}>
                {QUICK.map(v=>(
                  <button key={v} onClick={()=>setAmount(v)} style={{ padding:'4px 10px', borderRadius:'20px', border:`1px solid ${amount===v?'rgba(16,185,129,0.5)':'rgba(255,255,255,0.08)'}`, background:amount===v?'rgba(16,185,129,0.1)':'transparent', color:amount===v?'#34d399':'#64748b', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>
                    ₹{v}
                  </button>
                ))}
              </div>
            </div>

            {/* UPI tab */}
            {tab === 'upi' && (
              <form onSubmit={handleUpi} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                {activeQr ? (
                  <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'14px', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
                    <img src={activeQr.imageUrl} alt="UPI QR" style={{ width:160, height:160, objectFit:'contain', background:'#fff', borderRadius:'10px', padding:'8px' }}/>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:'12px', color:'#64748b' }}>{activeQr.label}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'4px' }}>
                        <span style={{ fontFamily:'monospace', fontSize:'14px', fontWeight:700, color:'#fff' }}>{activeQr.upiId}</span>
                        <button type="button" onClick={()=>copyText(activeQr.upiId,'upi')} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b', padding:'4px 8px', borderRadius:'6px', cursor:'pointer', fontSize:'10px', display:'flex', alignItems:'center', gap:'3px' }}>
                          {copied==='upi'?<Check size={11} color="#34d399"/>:<Copy size={11}/>}
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize:'11px', color:'#475569', textAlign:'center' }}>
                      Scan this QR or copy the UPI ID. Pay the amount and note the <strong style={{ color:'#fbbf24' }}>UTR/Reference number</strong>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding:'16px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:'10px', fontSize:'12px', color:'#f87171', display:'flex', alignItems:'center', gap:'8px' }}>
                    <AlertTriangle size={14}/> No active UPI QR available. Please try Crypto.
                  </div>
                )}

                <div>
                  <label style={lbl}>UTR / Reference Number *</label>
                  <input type="text" value={utrRef} onChange={e=>setUtrRef(e.target.value)} required placeholder="12-digit UTR or reference" style={iStyle}/>
                  <p style={{ margin:'4px 0 0', fontSize:'10px', color:'#334155' }}>Find this in your bank app's payment receipt</p>
                </div>

                <div>
                  <label style={lbl}>Payment Screenshot (optional)</label>
                  <input type="file" accept="image/*" onChange={e=>setScreenshot(e.target.files[0])} style={{ width:'100%', padding:'8px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', color:'#94a3b8', fontSize:'12px', cursor:'pointer', boxSizing:'border-box' }}/>
                </div>

                {error && <div style={{ padding:'10px 14px', borderRadius:'10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:'12px' }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ padding:'14px', borderRadius:'12px', border:'none', background:'rgba(16,185,129,0.85)', color:'#fff', fontWeight:900, fontSize:'15px', cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  <Smartphone size={16}/>{loading?'Submitting…':'Submit UPI Deposit'}
                </button>
              </form>
            )}

            {/* Crypto tab */}
            {tab === 'crypto' && (
              <form onSubmit={handleCrypto} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                {cfg?.cryptoWalletAddress ? (
                  <div style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:'14px', padding:'14px' }}>
                    <div style={{ fontSize:'11px', color:'#475569', marginBottom:'8px', fontWeight:700 }}>SEND TO THIS {cfg.cryptoCurrency} ADDRESS ({cfg.cryptoNetwork})</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(0,0,0,0.3)', padding:'10px 12px', borderRadius:'10px' }}>
                      <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#fbbf24', wordBreak:'break-all', flex:1 }}>{cfg.cryptoWalletAddress}</span>
                      <button type="button" onClick={()=>copyText(cfg.cryptoWalletAddress,'addr')} style={{ background:'rgba(255,255,255,0.06)', border:'none', color:'#94a3b8', padding:'6px', borderRadius:'6px', cursor:'pointer', flexShrink:0 }}>
                        {copied==='addr'?<Check size={14} color="#34d399"/>:<Copy size={14}/>}
                      </button>
                    </div>
                    <div style={{ marginTop:'8px', fontSize:'11px', color:'#475569' }}>
                      ⚠ Only send <strong style={{ color:'#fbbf24' }}>{cfg.cryptoCurrency}</strong> on <strong style={{ color:'#fbbf24' }}>{cfg.cryptoNetwork}</strong> network. Other networks will result in permanent loss.
                    </div>
                  </div>
                ) : (
                  <div style={{ padding:'16px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:'10px', fontSize:'12px', color:'#f87171', display:'flex', alignItems:'center', gap:'8px' }}>
                    <AlertTriangle size={14}/> Crypto deposits not configured. Contact support.
                  </div>
                )}

                <div>
                  <label style={lbl}>{cfg?.cryptoCurrency||'TRX'} Amount Sent</label>
                  <input type="number" min="0" step="0.01" value={cryptoAmt} onChange={e=>setCryptoAmt(e.target.value)} placeholder="0.00" style={iStyle}/>
                </div>
                <div>
                  <label style={lbl}>Transaction Hash / ID *</label>
                  <input type="text" value={txnHash} onChange={e=>setTxnHash(e.target.value)} required placeholder="0x... or TRON txn hash" style={{ ...iStyle, fontFamily:'monospace', fontSize:'12px' }}/>
                  <p style={{ margin:'4px 0 0', fontSize:'10px', color:'#334155' }}>Find this on Tronscan.org after your transaction is confirmed</p>
                </div>

                {error && <div style={{ padding:'10px 14px', borderRadius:'10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:'12px' }}>{error}</div>}
                <button type="submit" disabled={loading||!cfg?.cryptoWalletAddress} style={{ padding:'14px', borderRadius:'12px', border:'none', background:'rgba(251,191,36,0.85)', color:'#fff', fontWeight:900, fontSize:'15px', cursor:(loading||!cfg?.cryptoWalletAddress)?'not-allowed':'pointer', opacity:loading?0.6:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  <Bitcoin size={16}/>{loading?'Submitting…':'Submit Crypto Deposit'}
                </button>
              </form>
            )}

            <p style={{ marginTop:'12px', fontSize:'11px', color:'#1e293b', textAlign:'center' }}>
              Deposits are reviewed within 30 minutes · Funds credited after approval
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
