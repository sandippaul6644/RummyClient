import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { socket } from '../services/socket.js';

const DEFAULT_CONFIG = {
  siteName: 'LuckyPlay',
  tagline: 'Play · Enjoy · Win',
  shortName: 'LuckyPlay',
  supportEmail: 'support@luckyplay.com',
  supportTelegram: '',
  copyrightText: '© 2026 LuckyPlay Gaming Platform. Strictly for experimental and educational testing.',
  currencySymbol: '₹',
};

const SiteConfigContext = createContext({
  siteConfig: DEFAULT_CONFIG,
  siteName: DEFAULT_CONFIG.siteName,
  tagline: DEFAULT_CONFIG.tagline,
  shortName: DEFAULT_CONFIG.shortName,
  supportEmail: DEFAULT_CONFIG.supportEmail,
  copyrightText: DEFAULT_CONFIG.copyrightText,
  currencySymbol: DEFAULT_CONFIG.currencySymbol,
  refreshSiteConfig: () => Promise.resolve(),
});

export const SiteConfigProvider = ({ children }) => {
  const [siteConfig, setSiteConfig] = useState(DEFAULT_CONFIG);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/settings/site');
      if (res.data?.success && res.data?.data) {
        setSiteConfig((prev) => ({
          ...prev,
          ...res.data.data,
        }));
      }
    } catch {
      // Keep defaults gracefully if server is unreachable
    }
  };

  useEffect(() => {
    fetchConfig();

    // Listen for live site configuration updates pushed from admin panel!
    const handleConfigUpdated = (newConfig) => {
      if (newConfig) {
        setSiteConfig((prev) => ({
          ...prev,
          ...newConfig,
        }));
      }
    };

    socket.on('site:config:updated', handleConfigUpdated);

    return () => {
      socket.off('site:config:updated', handleConfigUpdated);
    };
  }, []);

  // Update browser tab document title dynamically
  useEffect(() => {
    if (siteConfig.siteName) {
      document.title = `${siteConfig.siteName} — ${siteConfig.tagline || 'Play More · Win More'} | Provably Fair Gaming`;
    }
  }, [siteConfig.siteName, siteConfig.tagline]);

  const value = {
    siteConfig,
    siteName: siteConfig.siteName || 'LuckyPlay',
    tagline: siteConfig.tagline || 'Play · Enjoy · Win',
    shortName: siteConfig.shortName || siteConfig.siteName || 'LuckyPlay',
    supportEmail: siteConfig.supportEmail || '',
    copyrightText: siteConfig.copyrightText || `© 2026 ${siteConfig.siteName} Gaming Platform. Strictly for experimental and educational testing.`,
    currencySymbol: siteConfig.currencySymbol || '₹',
    refreshSiteConfig: fetchConfig,
  };

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => useContext(SiteConfigContext);
export default SiteConfigContext;
