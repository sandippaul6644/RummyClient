import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Gift, Crown, Wallet, User } from 'lucide-react';
import { sound } from '../utils/sound.js';
import { useAuth } from '../context/AuthContext.jsx';

export const BottomNav = ({
  onOpenPromotions,
  onOpenWallet,
  onOpenProfile,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setIsAuthModalOpen, setIsDepositModalOpen, openWalletModal } = useAuth();

  const currentPath = location.pathname;

  const handleNavClick = (action) => {
    sound.playClick();
    action();
  };

  const isHomeActive = currentPath === '/' || currentPath === '/lobby';
  const isPromotionsActive = currentPath === '/promotions' || currentPath === '/rewards';
  const isWalletActive = currentPath === '/wallet' || currentPath === '/transactions';
  const isProfileActive = currentPath === '/profile';

  return (
    <nav className="bottom-nav-container">
      <div className="bottom-nav-bar">
        {/* 1. Home Button */}
        <button
          className={`bottom-nav-item ${isHomeActive ? 'active' : ''}`}
          onClick={() =>
            handleNavClick(() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            })
          }
          aria-label="Home"
        >
          <Home size={22} className="bottom-nav-icon" />
          <span className="bottom-nav-label">Home</span>
        </button>

        {/* 2. Promotions Button */}
        <button
          className={`bottom-nav-item ${isPromotionsActive ? 'active' : ''}`}
          onClick={() =>
            handleNavClick(() => {
              navigate('/promotions');
            })
          }
          aria-label="Promotions"
        >
          <Gift size={22} className="bottom-nav-icon" />
          <span className="bottom-nav-label">Promotions</span>
        </button>

        {/* 3. Center Elevated Glowing PLAY Button */}
        <div className="bottom-nav-center-wrapper">
          <button
            className="bottom-nav-center-btn"
            onClick={() =>
              handleNavClick(() => {
                if (currentPath !== '/' && currentPath !== '/lobby') {
                  navigate('/');
                  setTimeout(() => {
                    const el = document.getElementById('popular-games-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  const el = document.getElementById('popular-games-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              })
            }
            aria-label="Play Games"
          >
            <div className="center-btn-ring"></div>
            <div className="center-btn-inner">
              <Crown size={28} className="center-btn-crown" />
            </div>
          </button>
          <span className="bottom-nav-label center-label">Play</span>
        </div>

        {/* 4. Wallet Button */}
        <button
          className={`bottom-nav-item ${isWalletActive ? 'active' : ''}`}
          onClick={() =>
            handleNavClick(() => {
              if (openWalletModal) {
                openWalletModal('overview');
              } else {
                navigate('/wallet');
              }
            })
          }
          aria-label="Wallet"
        >
          <Wallet size={22} className="bottom-nav-icon" />
          <span className="bottom-nav-label">Wallet</span>
        </button>

        {/* 5. Profile Button */}
        <button
          className={`bottom-nav-item ${isProfileActive ? 'active' : ''}`}
          onClick={() =>
            handleNavClick(() => {
              if (!user) {
                setIsAuthModalOpen(true);
              } else {
                navigate('/profile');
              }
            })
          }
          aria-label="Profile"
        >
          <User size={22} className="bottom-nav-icon" />
          <span className="bottom-nav-label">{user ? user.username.slice(0, 6) : 'Profile'}</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
