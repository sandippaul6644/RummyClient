import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { Header } from './components/Header.jsx';
import { Footer } from './components/Footer.jsx';
import { BottomNav } from './components/BottomNav.jsx';

// Dedicated Page Files
import { Lobby } from './pages/Lobby.jsx';
import { ColorPredictionPage } from './pages/ColorPredictionPage.jsx';
import { AviatorPage } from './pages/AviatorPage.jsx';
import { DicePage } from './pages/DicePage.jsx';
import { WalletPage } from './pages/WalletPage.jsx';
import { PromotionsPage } from './pages/PromotionsPage.jsx';
import { VIPPage } from './pages/VIPPage.jsx';
import { ReferEarnPage } from './pages/ReferEarnPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { DisclaimersPage } from './pages/DisclaimersPage.jsx';

// Global Modals
import { AuthModal } from './components/AuthModal.jsx';
import { WalletModal } from './components/WalletModal.jsx';
import { NotificationModal } from './components/NotificationModal.jsx';
import { DepositModal } from './components/DepositModal.jsx';
import { WithdrawModal } from './components/WithdrawModal.jsx';
import { DailyRewardsModal } from './components/DailyRewardsModal.jsx';
import { ReferEarnModal } from './components/ReferEarnModal.jsx';
import { VIPModal } from './components/VIPModal.jsx';
import { ComingSoonModal } from './components/ComingSoonModal.jsx';

export const AppContent = () => {
  const navigate = useNavigate();

  // Modals state
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState(false);
  const [isReferOpen, setIsReferOpen] = useState(false);
  const [isVIPOpen, setIsVIPOpen] = useState(false);
  const [selectedComingSoonGame, setSelectedComingSoonGame] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        onOpenDailyRewards={() => setIsDailyRewardsOpen(true)}
        onOpenRefer={() => setIsReferOpen(true)}
        onOpenVIP={() => setIsVIPOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
      />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* 1. Home / Lobby */}
          <Route
            path="/"
            element={
              <Lobby
                onOpenDailyRewards={() => setIsDailyRewardsOpen(true)}
                onOpenRefer={() => setIsReferOpen(true)}
                onOpenVIP={() => setIsVIPOpen(true)}
                searchQuery={searchQuery}
                onSelectComingSoonGame={(game) => setSelectedComingSoonGame(game)}
              />
            }
          />
          <Route path="/lobby" element={<Navigate to="/" replace />} />

          {/* 2. Color Prediction (localhost:5173/colorprediction and /colour) */}
          <Route path="/colorprediction" element={<ColorPredictionPage />} />
          <Route path="/colour" element={<Navigate to="/colorprediction" replace />} />

          {/* 3. Aviator / Crash Rocket (localhost:5173/aviator and /crash) */}
          <Route path="/aviator" element={<AviatorPage />} />
          <Route path="/crash" element={<Navigate to="/aviator" replace />} />

          {/* 4. Classic Dice / Mines (localhost:5173/dice and /mines) */}
          <Route path="/dice" element={<DicePage />} />
          <Route path="/mines" element={<Navigate to="/dice" replace />} />

          {/* 5. Wallet & Transactions (localhost:5173/wallet and /transactions) */}
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/transactions" element={<Navigate to="/wallet" replace />} />

          {/* 6. Promotions & Daily Rewards (localhost:5173/promotions and /rewards) */}
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/rewards" element={<Navigate to="/promotions" replace />} />

          {/* 7. VIP Club (localhost:5173/vip) */}
          <Route path="/vip" element={<VIPPage />} />

          {/* 8. Refer & Earn (localhost:5173/refer and /invite) */}
          <Route path="/refer" element={<ReferEarnPage />} />
          <Route path="/invite" element={<Navigate to="/refer" replace />} />

          {/* 9. User Profile (localhost:5173/profile) */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* 10. Regulatory & Compliance Disclaimers (localhost:5173/disclaimers) */}
          <Route path="/disclaimers" element={<DisclaimersPage />} />
          <Route path="/compliance" element={<Navigate to="/disclaimers" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {/* Floating Bottom Navigation Bar */}
      <BottomNav
        onOpenPromotions={() => setIsDailyRewardsOpen(true)}
        onOpenWallet={() => navigate('/wallet')}
        onOpenProfile={() => navigate('/profile')}
      />

      {/* Global Modals */}
      <AuthModal />
      <WalletModal />
      <NotificationModal />
      <DepositModal />
      <WithdrawModal />
      <DailyRewardsModal
        isOpen={isDailyRewardsOpen}
        onClose={() => setIsDailyRewardsOpen(false)}
      />
      <ReferEarnModal
        isOpen={isReferOpen}
        onClose={() => setIsReferOpen(false)}
      />
      <VIPModal
        isOpen={isVIPOpen}
        onClose={() => setIsVIPOpen(false)}
      />
      <ComingSoonModal
        game={selectedComingSoonGame}
        isOpen={!!selectedComingSoonGame}
        onClose={() => setSelectedComingSoonGame(null)}
        onLaunchActiveGame={(gameType) => {
          setSelectedComingSoonGame(null);
          if (gameType === 'colour' || gameType === 'colorprediction') navigate('/colorprediction');
          else if (gameType === 'crash' || gameType === 'aviator') navigate('/aviator');
          else if (gameType === 'dice' || gameType === 'mines') navigate('/dice');
          else navigate('/');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
