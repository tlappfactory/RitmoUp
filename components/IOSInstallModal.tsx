import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IOSInstallModal: React.FC<IOSInstallModalProps> = ({ isOpen, onClose }) => {
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-[#1e293b] border border-white/10 rounded-3xl p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#00ff88]/10 text-[#00ff88] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl">apple</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Instalar no iPhone</h3>
              <p className="text-gray-400 mt-2">Siga estes passos simples para ter o RitmoUp na sua tela inicial:</p>
            </div>
            
            <div className="space-y-6">
              {isSafari ? (
                <>
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-[#00ff88]">1</div>
                    <p className="text-gray-300">Toque no ícone de <span className="font-bold text-white italic">Compartilhar</span> <span className="material-symbols-outlined text-blue-400 inline align-bottom text-xl">ios_share</span> na barra inferior do Safari.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-[#00ff88]">2</div>
                    <p className="text-gray-300">Role a lista de opções para baixo e toque em <span className="font-bold text-white">"Adicionar à Tela de Início"</span> <span className="material-symbols-outlined text-white inline align-bottom text-xl">add_box</span>.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-[#00ff88]">1</div>
                    <p className="text-gray-300">Toque no ícone de <span className="font-bold text-white italic">Menu</span> ou <span className="font-bold text-white italic">Compartilhar</span> <span className="material-symbols-outlined text-blue-400 inline align-bottom text-xl">ios_share</span> na barra superior/inferior do seu navegador.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-[#00ff88]">2</div>
                    <p className="text-gray-300">Procure pela opção <span className="font-bold text-white">"Adicionar à Tela de Início"</span> <span className="material-symbols-outlined text-white inline align-bottom text-xl">add_box</span>.</p>
                  </div>
                </>
              )}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-[#00ff88]">3</div>
                <p className="text-gray-300">Confirme tocando em <span className="font-bold text-[#00ff88]">Adicionar</span> no canto superior direito.</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-full mt-8 py-4 rounded-full bg-[#00ff88] text-black font-bold text-lg hover:bg-[#00cc6a] transition-all shadow-lg hover:shadow-[#00ff88]/20 active:scale-95"
            >
              Entendido
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

