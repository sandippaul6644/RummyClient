import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ChevronLeft,
  AlertTriangle,
  FileCheck2,
  Lock,
  Cpu,
  HeartHandshake,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { sound } from '../utils/sound.js';

export const DisclaimersPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const disclaimerPoints = [
    {
      id: 'age',
      emoji: '🔞',
      badge: '18+ Only',
      badgeColor: '#ef4444',
      title: 'Player Must Be 18+',
      summary: 'Strict adult verification and prohibition of underage access.',
      detail:
        'This simulation platform is strictly intended for adults aged 18 and older (or the legal age of majority in your jurisdiction). Minors are strictly prohibited from creating accounts, accessing the platform, or simulating any games. We maintain a zero-tolerance policy regarding underage engagement.',
    },
    {
      id: 'geo',
      emoji: '🚫',
      badge: 'Not For Indian Users',
      badgeColor: '#f97316',
      title: 'Not for Indian Users',
      summary: 'Territorial restriction and legal compliance notice.',
      detail:
        'This website, its games, and all simulation components are explicitly NOT intended for, marketed to, or accessible by users residing in the Republic of India or any jurisdiction where online simulated gambling, wagering mechanics, or prediction games are restricted by central, state, or regional law. Users from these territories are legally required to exit immediately.',
    },
    {
      id: 'edu',
      emoji: '🎓',
      badge: 'Educational Only',
      badgeColor: '#38bdf8',
      title: 'Experimental & Educational Purpose',
      summary: 'Academic prototype and open-source systems architecture research.',
      detail:
        'LuckyPlay was engineered solely as an academic and technological demonstration of distributed real-time WebSockets, micro-transaction ledger consistency, and provably fair cryptographic state machines. It is not an active commercial gaming platform, casino, or gambling establishment.',
    },
    {
      id: 'nomoney',
      emoji: '🎮',
      badge: 'Zero Real Money',
      badgeColor: '#10b981',
      title: 'Not a Real Money Game',
      summary: 'All currencies, tokens, and chips have zero cash value.',
      detail:
        'All coins, tokens, balances, multipliers, wins, and withdrawals displayed across the entire platform are 100% fictional virtual simulation points. They possess ZERO fiat or real-world cash equivalence. Real currency cannot be deposited, wagered, won, exchanged, or cashed out under any circumstance.',
    },
    {
      id: 'risk',
      emoji: '⚠️',
      badge: 'Play At Own Risk',
      badgeColor: '#eab308',
      title: 'Play At Your Own Risk',
      summary: 'Assumption of risk, user discretion, and complete liability waiver.',
      detail:
        'Use of this software simulator is entirely voluntary and conducted at your own risk and discretion. The creators, developers, contributors, and hosting providers assume absolutely no legal, financial, or moral liability for any decisions made, time spent, emotional response, or simulated token outcomes.',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #060814 100%)',
        color: '#f8fafc',
        padding: '24px 16px 80px',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button
            onClick={() => {
              sound.playClick();
              navigate('/');
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              color: '#f8fafc',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronLeft size={16} /> Back to Lobby
          </button>

          <span
            style={{
              fontSize: '11px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '4px 12px',
              borderRadius: '14px',
              fontWeight: 800,
              letterSpacing: '0.4px',
            }}
          >
            LEGAL & REGULATORY NOTICE
          </span>
        </div>

        {/* Hero Header */}
        <div
          style={{
            padding: '28px 24px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={24} color="#f87171" />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '-0.4px',
                }}
              >
                Mandatory Regulatory & Simulation Disclaimers
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#fbbf24', fontWeight: 600 }}>
                Please review our platform requirements, territorial eligibility, and educational non-monetary charter.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            {disclaimerPoints.map((p) => (
              <span
                key={p.id}
                style={{
                  background: `${p.badgeColor}18`,
                  color: p.badgeColor,
                  border: `1px solid ${p.badgeColor}40`,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '11px',
                }}
              >
                {p.emoji} {p.badge}
              </span>
            ))}
          </div>
        </div>

        {/* Detailed 5 Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
          {disclaimerPoints.map((point, index) => (
            <div
              key={point.id}
              style={{
                padding: '22px 24px',
                borderRadius: '20px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                gap: '18px',
                alignItems: 'flex-start',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: `${point.badgeColor}18`,
                  border: `1px solid ${point.badgeColor}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {point.emoji}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>
                    {index + 1}. {point.title}
                  </h2>
                  <span
                    style={{
                      background: `${point.badgeColor}18`,
                      color: point.badgeColor,
                      border: `1px solid ${point.badgeColor}40`,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                    }}
                  >
                    {point.badge}
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                  {point.summary}
                </div>

                <p style={{ margin: 0, fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.65 }}>
                  {point.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Technical Architecture & Cryptographic Integrity Section */}
        <div
          style={{
            padding: '24px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            marginBottom: '32px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="#818cf8" /> Cryptographic Integrity & Algorithmic Disclosure
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.65, margin: '0 0 16px 0' }}>
            Every game outcome on LuckyPlay (Colour Prediction, Aviator Crash, and Classic Dice) is deterministically generated using industry-standard SHA-256 HMAC algorithms. The combination of a committed server seed, public client seed, and sequential nonce guarantees that neither the player nor the server can manipulate round outcomes after round commitments.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>Deterministic Seeds</div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Server seeds are pre-hashed and public before betting begins.</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', marginBottom: '4px' }}>Client Seed Entropy</div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Players can customize their client seed at any moment.</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>Double-Entry Ledger</div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>All virtual chip debits and credits maintain mathematical parity.</div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Revision 2026.1 • LuckyPlay Educational Simulation Sandbox
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                sound.playClick();
                navigate('/');
              }}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Return to Gaming Lobby <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimersPage;
