import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LevelUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    newLevel: number;
}

const motivationalMessages = [
    "Você está imparável! 💪",
    "Continue assim, campeão!",
    "A dedicação está valendo!",
    "Rumo ao topo! 🏆",
    "Cada treino conta!",
    "Evolução constante!",
    "Você é a inspiração!",
];

const Confetti = () => {
    const colors = ['#00ff88', '#00cc6a', '#ffd700', '#ff6b6b', '#4facfe', '#9b59b6'];
    const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
    }));

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {confettiPieces.map((piece) => (
                <div
                    key={piece.id}
                    className="absolute"
                    style={{
                        left: `${piece.left}%`,
                        top: '-20px',
                        width: piece.size,
                        height: piece.size,
                        backgroundColor: piece.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s forwards`,
                    }}
                />
            ))}
        </div>
    );
};

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ isOpen, onClose, newLevel }) => {
    const [showConfetti, setShowConfetti] = useState(false);
    const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true);
            // Vibrate on mobile if supported
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100, 50, 200]);
            }
            const timer = setTimeout(() => setShowConfetti(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {showConfetti && <Confetti />}
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                        className="bg-gradient-to-br from-surface-dark via-surface-dark to-primary/20 rounded-3xl p-8 max-w-sm w-full text-center border border-primary/30 shadow-[0_0_100px_rgba(0,255,136,0.3)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Trophy Icon */}
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mx-auto mb-6 size-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_40px_rgba(255,215,0,0.5)] animate-level-pulse"
                        >
                            <span className="material-symbols-outlined text-5xl text-white">emoji_events</span>
                        </motion.div>

                        {/* Level Up Text */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                        >
                            <h2 className="text-lg font-bold text-primary uppercase tracking-[0.3em] mb-2">Level Up!</h2>
                            <div className="text-7xl font-black text-white animate-level-glow mb-2">
                                {newLevel}
                            </div>
                            <p className="text-gray-400 text-sm uppercase tracking-wider">Novo Nível Alcançado</p>
                        </motion.div>

                        {/* Motivational Message */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mt-6 text-xl font-bold text-white"
                        >
                            {message}
                        </motion.p>

                        {/* Continue Button */}
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            onClick={onClose}
                            className="mt-8 w-full py-4 bg-primary text-black font-bold rounded-xl text-lg hover:bg-primary-hover transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_40px_rgba(0,255,136,0.3)]"
                        >
                            Continuar 🚀
                        </motion.button>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </>
    );
};
