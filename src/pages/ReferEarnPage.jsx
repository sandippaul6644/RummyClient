import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Copy, Check, Share2, Award, ArrowRight } from 'lucide-react';
import { sound } from '../utils/sound.js';
import { useAuth } from '../context/AuthContext.jsx';

export const ReferEarnPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = user ? `LUCKY_${user.username.toUpperCase()}_888` : 'LUCKY_PLAY_888';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const handleCopy = () => {
    sound.playClick();
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', padding: '10px 12px 30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <button
          onClick={() => {
            sound.playClick();
            navigate('/');
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            color: '#f8fafc',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ChevronLeft size={16} /> Lobby
        </button>

        <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={20} color="#10b981" /> Refer & Earn
        </h1>
      </div>

      {/* Main Promo Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #042f2e 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.45)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          marginBottom: '14px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '4px' }}>🎁</div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', margin: '0 0 6px' }}>
          Invite Friends & Earn ₹250
        </h2>
        <p style={{ fontSize: '12px', color: '#a7f3d0', margin: '0 0 16px', lineHeight: 1.4 }}>
          Plus receive <strong>5% lifetime revenue commission</strong> on every bet your invited players place.
        </p>

        {/* Copy Link Field */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            padding: '4px 6px 4px 12px',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '12px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {referralLink}
          </span>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#10b981' : 'linear-gradient(135deg, #ffe066, #ffb800)',
              border: 'none',
              borderRadius: '8px',
              color: copied ? '#fff' : '#1e1402',
              fontWeight: 800,
              fontSize: '12px',
              padding: '8px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Referral Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ background: '#13192c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Total Friends Invited</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>0</div>
        </div>
        <div style={{ background: '#13192c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Commission Earned</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>₹0.00</div>
        </div>
      </div>
    </div>
  );
};

export default ReferEarnPage;
