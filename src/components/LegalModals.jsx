import React from 'react';
import { X, ShieldAlert, FileText, Lock, AlertTriangle, CheckCircle, Scale, GraduationCap } from 'lucide-react';
import { sound } from '../utils/sound.js';

export const LegalModal = ({ type, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    sound.playClick();
    onClose();
  };

  const getContent = () => {
    switch (type) {
      case 'terms':
        return {
          title: 'Terms and Conditions',
          subtitle: 'Legal framework, mandatory eligibility & platform rules',
          icon: <FileText size={22} color="#818cf8" />,
          sections: [
            {
              title: '1. Age Eligibility (Strictly 18+)',
              badge: 'Mandatory',
              badgeColor: '#ef4444',
              text: 'Access to this platform is strictly restricted to individuals who are at least 18 years of age (or the legal age of majority in their respective jurisdiction). Any access or use of this simulation by persons under the age of 18 is strictly prohibited.',
            },
            {
              title: '2. Territorial Restrictions (Not For Indian Users)',
              badge: 'Restricted Territory',
              badgeColor: '#f97316',
              text: 'This website, software, and simulation are strictly NOT intended for, directed at, or available to citizens, residents, or persons located in the Republic of India, or any territory where simulated gambling, games of skill with wagering mechanics, or online prediction platforms are restricted by federal, state, or municipal statutory law. Users from these territories must immediately cease accessing this service.',
            },
            {
              title: '3. Educational & Experimental Purpose Only',
              badge: 'Research Prototype',
              badgeColor: '#38bdf8',
              text: 'LuckyPlay is an open-source, non-commercial software demonstration developed solely for educational, academic, and technological research purposes. It exists to showcase full-stack architectures (React, Node.js, WebSockets, MongoDB, and cryptographic SHA-256 provably fair algorithms). It is not a commercial enterprise or a licensed casino.',
            },
            {
              title: '4. Non-Monetary Nature (Not a Real Money Game)',
              badge: 'Zero Real Value',
              badgeColor: '#10b981',
              text: 'All balances, chips, tokens, multipliers, deposits, and payouts displayed anywhere on this platform are 100% fictional simulation points. They possess ZERO real-world monetary value, cannot be converted into fiat currencies, cryptocurrencies, prizes, or cash equivalents, and cannot be refunded or redeemed under any circumstances.',
            },
            {
              title: '5. Play At Your Own Risk & Limitation of Liability',
              badge: 'User Discretion',
              badgeColor: '#eab308',
              text: 'You participate in this simulation entirely at your own risk and discretion. The creators, developers, contributors, and hosting providers assume absolutely zero liability for any direct, indirect, incidental, or psychological consequences, virtual token losses, or data loss resulting from your use of this software.',
            },
            {
              title: '6. Cryptographic Fairness & Provably Fair System',
              badge: 'SHA-256 Verifiable',
              badgeColor: '#a855f7',
              text: 'Every game round operates on deterministic cryptographic hashing (Server Seed + Client Seed + Nonce). Players are empowered to independently inspect and verify the fair mathematical integrity of all historical rounds using our public verification tool.',
            },
          ],
        };

      case 'privacy':
        return {
          title: 'Privacy Policy',
          subtitle: 'How data and simulated sessions are handled',
          icon: <Lock size={22} color="#10b981" />,
          sections: [
            {
              title: '1. No Real Financial or Sensitive Data Stored',
              badge: 'Zero Sensitive Data',
              badgeColor: '#10b981',
              text: 'LuckyPlay does NOT collect, store, or process real credit cards, bank accounts, Aadhaar/SSN identification, or payment credentials. All payment methods shown in the wallet are mock simulations.',
            },
            {
              title: '2. Session & Local Data Storage',
              badge: 'Local Session',
              badgeColor: '#38bdf8',
              text: 'We store minimal simulated authentication credentials (hashed passwords via bcrypt, JWT tokens) and client-side preferences (sound settings, notification preferences) locally in your browser storage.',
            },
            {
              title: '3. Telemetry & WebSockets Communication',
              badge: 'Transient Real-Time',
              badgeColor: '#818cf8',
              text: 'Socket connections transmit in-game bets and round ticks in real-time. Transient game states are discarded after round resolution and recorded solely to the simulated ledger database.',
            },
            {
              title: '4. Third-Party Sharing',
              badge: 'Zero Third Parties',
              badgeColor: '#f59e0b',
              text: 'We do not sell, rent, monetize, or transmit user information to any third-party advertisers or data brokers.',
            },
          ],
        };

      case 'responsible':
      default:
        return {
          title: 'Responsible Gaming & Disclaimers',
          subtitle: 'Healthy gaming guidelines and risk awareness',
          icon: <ShieldAlert size={22} color="#ef4444" />,
          sections: [
            {
              title: '1. Simulation Awareness',
              badge: 'Educational Simulator',
              badgeColor: '#38bdf8',
              text: 'Simulated winning outcomes in games like Aviator, Dice, or Colour Prediction do not predict or reflect success in real-money gambling. Probability and randomness always favor mathematical house edges over time.',
            },
            {
              title: '2. Time Management & Healthy Habits',
              badge: 'Take Breaks',
              badgeColor: '#10b981',
              text: 'We encourage users to set strict time limits on their screens. Never let gaming simulations interfere with personal responsibilities, work, or education.',
            },
            {
              title: '3. Geographic Compliance & 18+ Enforcement',
              badge: 'Strict Policy',
              badgeColor: '#ef4444',
              text: 'If you are residing in India or any restricted state, or are under the age of 18, you must exit this platform immediately. We enforce zero tolerance for underage participation.',
            },
          ],
        };
    }
  };

  const modalData = getContent();

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="glass-panel modal-content"
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '88vh',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'linear-gradient(180deg, rgba(15, 20, 36, 0.98) 0%, rgba(8, 10, 20, 0.99) 100%)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 35px rgba(99, 102, 241, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
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
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {modalData.icon}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
                {modalData.title}
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {modalData.subtitle}
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
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

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '520px',
          }}
        >
          {modalData.sections.map((section, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                  {section.title}
                </h4>
                {section.badge && (
                  <span
                    style={{
                      background: `${section.badgeColor}18`,
                      border: `1px solid ${section.badgeColor}40`,
                      color: section.badgeColor,
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {section.badge}
                  </span>
                )}
              </div>

              <p style={{ margin: 0, fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
                {section.text}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Last revised: March 2026 • LuckyPlay Platform
          </span>

          <button
            onClick={handleClose}
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 14px rgba(99, 102, 241, 0.35)',
            }}
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
