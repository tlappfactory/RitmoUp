import React, { useEffect, useState } from 'react';
import { GamificationProfile } from '../../types';

interface LevelProgressProps {
    level: number;
    currentXp: number;
    nextLevelXp: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ level, currentXp, nextLevelXp }) => {
    const progress = Math.min(100, (currentXp / nextLevelXp) * 100);
    const xpRemaining = nextLevelXp - currentXp;
    const isCloseToLevelUp = progress >= 80;

    return (
        <div className="flex flex-col gap-2 w-full max-w-[220px]">
            {/* Level Badge */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`size-8 rounded-lg bg-gradient-to-br from-primary to-green-400 flex items-center justify-center font-black text-black text-sm shadow-lg ${isCloseToLevelUp ? 'animate-level-pulse' : ''}`}>
                        {level}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Nível</span>
                </div>
                <span className="text-xs font-medium text-gray-500">
                    {currentXp}/{nextLevelXp} XP
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-white/10 rounded-full overflow-hidden relative">
                <div
                    className={`h-full bg-gradient-to-r from-primary via-green-400 to-primary transition-all duration-1000 ease-out relative ${isCloseToLevelUp ? 'shimmer-effect' : ''}`}
                    style={{ width: `${progress}%` }}
                >
                    {/* Glow effect */}
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-white/50 blur-sm" />
                </div>
            </div>

            {/* XP Remaining */}
            <div className="flex justify-between items-center text-xs">
                <span className={`font-medium ${isCloseToLevelUp ? 'text-primary animate-pulse' : 'text-gray-500'}`}>
                    {isCloseToLevelUp ? '🔥 Quase lá!' : `Faltam ${xpRemaining} XP`}
                </span>
                <span className="text-gray-600">{Math.round(progress)}%</span>
            </div>
        </div>
    );
};

interface XPCelebrationProps {
    xpGained: number;
    show: boolean;
    onComplete?: () => void;
}

export const XPCelebration: React.FC<XPCelebrationProps> = ({ xpGained, show, onComplete }) => {
    const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number }>>([]);

    useEffect(() => {
        if (show) {
            // Create particles
            const newParticles = Array.from({ length: 12 }, (_, i) => ({
                id: i,
                x: (Math.random() - 0.5) * 100,
                delay: Math.random() * 0.3,
            }));
            setParticles(newParticles);

            // Vibrate on mobile
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 30, 50]);
            }

            // Cleanup
            const timer = setTimeout(() => {
                setParticles([]);
                onComplete?.();
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            {/* Main XP Text */}
            <div className="relative animate-xp-float">
                <span className="text-5xl font-black text-primary drop-shadow-[0_0_20px_rgba(0,255,136,0.8)]">
                    +{xpGained} XP
                </span>
            </div>

            {/* Particles */}
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute animate-xp-float"
                    style={{
                        left: `calc(50% + ${particle.x}px)`,
                        animationDelay: `${particle.delay}s`,
                    }}
                >
                    <span className="text-xl text-primary/60">✦</span>
                </div>
            ))}
        </div>
    );
};

interface StreakCounterProps {
    streak: number;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({ streak }) => {
    const isHotStreak = streak >= 7;
    const isLegendary = streak >= 30;

    const getBgColor = () => {
        if (isLegendary) return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30';
        if (isHotStreak) return 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30';
        return 'bg-orange-500/10 border-orange-500/20';
    };

    const getIconColor = () => {
        if (isLegendary) return 'text-purple-400';
        if (isHotStreak) return 'text-red-400';
        return 'text-orange-500';
    };

    return (
        <div
            className={`flex items-center gap-2 ${getBgColor()} border px-3 py-1.5 rounded-full transition-all duration-300`}
            title="Dias seguidos de treino"
        >
            <span className={`material-symbols-outlined ${getIconColor()} fill-current ${streak > 0 ? 'animate-pulse' : ''}`}>
                {isLegendary ? 'whatshot' : 'local_fire_department'}
            </span>
            <span className={`font-bold ${isLegendary ? 'text-purple-400' : isHotStreak ? 'text-red-400' : 'text-orange-400'}`}>
                {streak}
                <span className="text-[10px] uppercase font-bold opacity-70 ml-1">
                    {streak === 1 ? 'Dia' : 'Dias'}
                </span>
            </span>
            {isHotStreak && !isLegendary && (
                <span className="text-[10px] bg-red-500/30 text-red-300 px-1.5 py-0.5 rounded-full font-bold">🔥 HOT</span>
            )}
            {isLegendary && (
                <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full font-bold">👑 LENDA</span>
            )}
        </div>
    );
};

interface AchievementListProps {
    achievements: GamificationProfile['achievements'];
}

export const AchievementList: React.FC<AchievementListProps> = ({ achievements }) => {
    if (!achievements || achievements.length === 0) return null;

    return (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {achievements.map((badge, index) => (
                <div
                    key={badge.id}
                    className="size-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 flex items-center justify-center shrink-0 relative group tooltip-container hover:scale-110 transition-transform cursor-pointer shadow-lg"
                    style={{ animationDelay: `${index * 0.1}s` }}
                >
                    <span className="material-symbols-outlined text-yellow-400 text-2xl">{badge.icon}</span>

                    {/* Glow ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-yellow-400/0 group-hover:border-yellow-400/50 transition-all group-hover:scale-125 group-hover:opacity-0 duration-500" />

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-max max-w-[160px] bg-surface-dark/95 backdrop-blur-sm p-3 rounded-xl text-xs hidden group-hover:block z-50 pointer-events-none shadow-xl border border-white/10">
                        <p className="font-bold text-white text-sm">{badge.title}</p>
                        <p className="text-gray-400 mt-1">{badge.description}</p>
                        {badge.unlockedAt && (
                            <p className="text-primary text-[10px] mt-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                Desbloqueado
                            </p>
                        )}
                        {/* Arrow */}
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface-dark/95 rotate-45 border-r border-b border-white/10" />
                    </div>
                </div>
            ))}
        </div>
    );
};

// XP Breakdown component for workout summary
interface XPBreakdownProps {
    baseXp: number;
    bonusXp: number;
    totalXp: number;
}

export const XPBreakdown: React.FC<XPBreakdownProps> = ({ baseXp, bonusXp, totalXp }) => {
    return (
        <div className="bg-white/5 rounded-xl p-4 space-y-2 w-full max-w-xs">
            <div className="flex justify-between text-sm text-gray-400">
                <span>XP Base</span>
                <span>+{baseXp}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
                <span>Bônus de Tempo</span>
                <span className="text-blue-400">+{bonusXp}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-primary text-lg">+{totalXp} XP</span>
            </div>
        </div>
    );
};
