import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Model from 'react-body-highlighter';

interface MuscleHeatmapProps {
    data: Record<string, number>; // Muscle Name -> Volume/Frequency
    gender?: string;
}

export const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({ data, gender }) => {
    const [view, setView] = useState<'anterior' | 'posterior'>('anterior');

    // Mapeamento de músculos em português para o formato do react-body-highlighter
    const muscleMap: Record<string, string[]> = {
        'Peito': ['chest'],
        'Ombros': ['front-deltoids', 'back-deltoids'],
        'Bíceps': ['biceps'],
        'Tríceps': ['triceps'],
        'Braços': ['biceps', 'triceps', 'forearm'],
        'Antebraço': ['forearm'],
        'Abdômen': ['abs', 'obliques'],
        'Core': ['abs', 'obliques', 'lower-back'],
        'Pernas': ['quadriceps', 'hamstring', 'calves', 'gluteal', 'adductor', 'abductors'],
        'Quadríceps': ['quadriceps'],
        'Posterior de Coxa': ['hamstring'],
        'Panturrilhas': ['calves'],
        'Glúteos': ['gluteal'],
        'Costas': ['upper-back', 'lower-back', 'trapezius'],
        'Dorsais': ['upper-back'],
        'Lombar': ['lower-back'],
        'Trapézio': ['trapezius']
    };

    const modelData = useMemo(() => {
        const result: Record<string, number> = {};

        // Aggregate frequencies
        Object.entries(data).forEach(([ptMuscle, freq]) => {
            const numFreq = typeof freq === 'number' ? freq : 0;
            const enMuscles = muscleMap[ptMuscle] || [];
            enMuscles.forEach(enMuscle => {
                const current = result[enMuscle] || 0;
                result[enMuscle] = current + numFreq;
            });
        });

        return Object.entries(result).map(([muscle, freq]) => ({
            name: 'Workout',
            muscles: [muscle],
            frequency: Math.round(freq) // It requires integer frequency for the color index
        }));
    }, [data]);

    // O pacote indexa as cores com base na frequência (array[frequency-1]).
    // Vamos gerar o array preenchendo as cores proporcionais ao max frequency.
    const maxFreq = Math.max(1, ...modelData.map(d => d.frequency));

    const highlightedColors = useMemo(() => {
        const colors = [];
        for (let i = 1; i <= maxFreq; i++) {
            const intensity = i / maxFreq;
            const minL = 20;
            const maxL = 60;
            const l = minL + (maxL - minL) * intensity;
            colors.push(`hsl(152, 100%, ${l}%)`);
        }
        return colors.length > 0 ? colors : ['hsl(152, 100%, 20%)'];
    }, [maxFreq]);

    return (
        <div className="flex flex-col items-center justify-center p-4 md:p-6 bg-surface-dark rounded-xl shadow-lg w-full max-w-sm mx-auto relative overflow-hidden backdrop-blur-md border border-white/5">
            <div className="flex flex-col sm:flex-row justify-between w-full items-center mb-4 z-10 gap-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">accessibility_new</span>
                    Mapa Muscular
                </h3>
                <div className="flex bg-black/20 p-1 rounded-lg shrink-0">
                    <button
                        onClick={() => setView('anterior')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === 'anterior' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Frente
                    </button>
                    <button
                        onClick={() => setView('posterior')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === 'posterior' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Costas
                    </button>
                </div>
            </div>

            <div className="relative w-full h-[360px] flex items-center justify-center z-0">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{
                            opacity: 1,
                            scale: view === 'posterior' ? 0.9 : 1,
                            y: view === 'posterior' ? -15 : 0
                        }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="relative h-full drop-shadow-[0_0_15px_rgba(0,255,136,0.15)] flex items-center justify-center transform-gpu"
                    >
                        <Model
                            data={modelData}
                            type={view}
                            bodyColor="#3D3D3D"
                            highlightedColors={highlightedColors}
                            style={{ height: '340px' }}
                            svgStyle={{ overflow: 'visible' }}
                        />
                        {/* Overlay para Mãos e Pés (estético) */}
                        <svg
                            viewBox="0 0 100 200"
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            style={{ height: '340px', overflow: 'visible' }}
                            preserveAspectRatio="xMidYMid meet"
                        >
                            <g fill="#3D3D3D">
                                {view === 'anterior' ? (
                                    <>
                                        {/* Mãos Anterior */}
                                        <path d="M0,100 C-4,106 -1,113 4,112 C7,111 8,105 7,101 Z" />
                                        <path d="M100,100 C104,106 101,113 96,112 C93,111 92,105 93,101 Z" />
                                        {/* Pés Anterior */}
                                        <path d="M21,195 C15,200 13,205 24,206 C29,206 29,200 27,194 Z" />
                                        <path d="M79,195 C85,200 87,205 76,206 C71,206 71,200 73,194 Z" />
                                    </>
                                ) : (
                                    <>
                                        {/* Mãos Posterior */}
                                        <path d="M0,105 C-4,111 -1,118 4,117 C7,116 8,110 7,106 Z" />
                                        <path d="M100,105 C104,111 101,118 96,117 C93,116 92,110 93,106 Z" />
                                        {/* Pós Posterior (calcanhares estendidos para cobrir o soleus) */}
                                        <path d="M26,195 C23,205 26,223 31,223 C35,223 34,205 31,195 Z" />
                                        <path d="M74,195 C77,205 74,223 69,223 C65,223 66,205 69,195 Z" />
                                    </>
                                )}
                            </g>
                        </svg>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Legend / Intensity Scale */}
            <div className="flex justify-between w-full text-xs text-gray-400 px-2 mt-4 items-center">
                <span className="whitespace-nowrap">Descanso</span>
                <div className="h-1.5 flex-1 mx-2 rounded-full bg-gradient-to-r from-gray-700 via-green-900 to-primary shadow-sm border border-white/5"></div>
                <span className="text-primary font-bold whitespace-nowrap">Fadiga Max</span>
            </div>
        </div>
    );
};
