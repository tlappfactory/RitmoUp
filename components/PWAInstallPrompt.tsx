import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PWAInstallPromptProps {
  onInstallClick: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onInstallClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Detect Standalone (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if (isIOS && !isStandalone) {
      // Check if user dismissed it recently (optional, let's keep it simple for now)
      const dismissed = sessionStorage.getItem('pwaPromptDismissed');
      if (!dismissed) {
        // Show after a short delay
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwaPromptDismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 z-50 md:left-auto md:right-6 md:w-80"
        >
          <div className="bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-[#00ff88]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <img src="/favicon.png" alt="RitmoUp" className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm truncate">Instalar RitmoUp</h4>
              <p className="text-gray-400 text-xs">Adicione à tela de início para acesso rápido.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onInstallClick}
                className="bg-[#00ff88] text-black font-bold text-xs px-3 py-2 rounded-lg hover:bg-[#00cc6a] transition-all"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
