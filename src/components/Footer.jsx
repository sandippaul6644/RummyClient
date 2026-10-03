import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Award,
  HeartHandshake,
  Crown,
  Sparkles,
  AlertTriangle,
  FileText,
  Scale,
  Ban,
  GraduationCap,
  Coins,
  Cpu,
  CheckCircle,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { LegalModal } from './LegalModals.jsx';
import { sound } from '../utils/sound.js';
import { useNavigate } from 'react-router-dom';

export const Footer = () => {
  const navigate = useNavigate();
  const [legalModalType, setLegalModalType] = useState(null);

  const openLegalModal = (type) => {
    sound.playClick();
    setLegalModalType(type);
  };

  return (
    <>
      <footer
        style={{
          marginTop: '12px',
          padding: '18px 16px calc(65px + env(safe-area-inset-bottom, 8px))',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(8, 12, 24, 0.98) 0%, rgba(4, 6, 14, 1) 100%)',
          fontSize: '13px',
          color: '#94a3b8',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >


          {/* 2. Main Navigation Columns */}
          <div className="footer-main-layout">
            {/* Column 1: Brand & Mission */}
            <div className="footer-brand-col">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ffe066 0%, #ffb800 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(255, 184, 0, 0.45)',
                    flexShrink: 0,
                  }}
                >
                  <Crown size={18} color="#1e1402" />
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: '#f8fafc', fontSize: '17px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                    LuckyPlay
                  </div>
                  <div style={{ fontSize: '11px', color: '#ffb800', fontWeight: 700 }}>
                    Provably Fair Gaming Simulation
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.55, margin: '0 0 12px 0' }}>
                The open-source real-time gaming simulator engineered for seamless concurrency, mathematical transparency, and cryptographic auditability.
              </p>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', color: '#cbd5e1' }}>
                <Cpu size={13} color="#818cf8" /> Powered by Socket.io & SHA-256
              </div>
            </div>

            {/* Sub-container for two columns: renders as a single row with 2 columns on mobile */}
            <div className="footer-two-columns-row">
              {/* Column 2: Legal & Governance */}
              <div>
                <h5
                  className="footer-col-title"
                  style={{ color: '#ffffff', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}
                >
                  Legal & Governance
                </h5>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                  <li>
                    <button
                      onClick={() => openLegalModal('terms')}
                      className="footer-link-text"
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#cbd5e1',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        textAlign: 'left',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
                    >
                      <FileText size={13} color="#818cf8" style={{ flexShrink: 0 }} /> Terms & Conditions
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openLegalModal('privacy')}
                      className="footer-link-text"
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#cbd5e1',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        textAlign: 'left',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#10b981')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
                    >
                      <Lock size={13} color="#10b981" style={{ flexShrink: 0 }} /> Privacy Policy
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openLegalModal('responsible')}
                      className="footer-link-text"
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#cbd5e1',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        textAlign: 'left',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
                    >
                      <HeartHandshake size={13} color="#f87171" style={{ flexShrink: 0 }} /> Responsible Gaming
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        sound.playClick();
                        navigate('/disclaimers');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="footer-link-text"
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#fbbf24',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        textAlign: 'left',
                        fontWeight: 700,
                      }}
                    >
                      <AlertTriangle size={13} color="#fbbf24" style={{ flexShrink: 0 }} /> Disclaimers Page
                    </button>
                  </li>
                </ul>
              </div>

              {/* Column 3: Cryptographic Fair Play Badges */}
              <div>
                <h5
                  className="footer-col-title"
                  style={{ color: '#ffffff', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}
                >
                  Fair Play & Security
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  <div className="footer-link-text" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                    <Shield size={14} color="#ffb800" style={{ flexShrink: 0 }} />
                    <span>SHA-256 Verifiable RNG</span>
                  </div>
                  <div className="footer-link-text" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                    <Lock size={14} color="#10b981" style={{ flexShrink: 0 }} />
                    <span>Double-Entry Ledger</span>
                  </div>
                  <div className="footer-link-text" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                    <Award size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
                    <span>Algorithmic Transparency</span>
                  </div>
                  <div className="footer-link-text" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                    <GraduationCap size={14} color="#c084fc" style={{ flexShrink: 0 }} />
                    <span>Academic License</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Bottom Row: Copyright & Simulation Affirmation */}
          <div className="footer-bottom-row">
            <div className="footer-bottom-copy">
              © 2026 LuckyPlay Gaming Platform. Strictly for experimental and educational testing.
            </div>

            <div className="footer-bottom-links">
              <span
                onClick={() => openLegalModal('terms')}
                style={{ color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.target.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.target.style.color = '#94a3b8')}
              >
                Terms
              </span>
              <span>•</span>
              <span
                onClick={() => openLegalModal('privacy')}
                style={{ color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.target.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.target.style.color = '#94a3b8')}
              >
                Privacy
              </span>
              <span>•</span>
              <span
                onClick={() => openLegalModal('responsible')}
                style={{ color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.target.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.target.style.color = '#94a3b8')}
              >
                18+ Compliance
              </span>
              <span>•</span>
              <div style={{ color: '#ffb800', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> Game On, Happiness Always!
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Legal Modals */}
      <LegalModal
        type={legalModalType}
        isOpen={!!legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </>
  );
};

export default Footer;
