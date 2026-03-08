import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './UIComponents';

interface FilterCriteria {
    specialties: string[];
    gender: string;
    minRating: number;
}

interface TrainerFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterCriteria) => void;
    initialFilters: FilterCriteria;
    availableSpecialties: string[];
}

export const TrainerFilterModal = ({ isOpen, onClose, onApply, initialFilters, availableSpecialties }: TrainerFilterModalProps) => {
    const [filters, setFilters] = useState<FilterCriteria>(initialFilters);

    if (!isOpen) return null;

    const toggleSpecialty = (specialty: string) => {
        setFilters(prev => {
            const newSpecialties = prev.specialties.includes(specialty)
                ? prev.specialties.filter(s => s !== specialty)
                : [...prev.specialties, specialty];
            return { ...prev, specialties: newSpecialties };
        });
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleClear = () => {
        const cleared = { specialties: [], gender: 'Todos', minRating: 0 };
        setFilters(cleared);
        onApply(cleared); // Optional: apply immediately on clear? Or just clear state? Let's clear state.
        // Actually, "Clear" usually resets the form. "Apply" is needed to commit.
        // But users might expect "Clear All" to reset results. I'll just reset local state for now.
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <h3 className="font-bold text-white text-lg">Filtrar Treinadores</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Specialties */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-300 mb-3 block">Especialidades</h4>
                        <div className="flex flex-wrap gap-2">
                            {availableSpecialties.map(spec => (
                                <button
                                    key={spec}
                                    onClick={() => toggleSpecialty(spec)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${filters.specialties.includes(spec)
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {spec}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gender */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-300 mb-3 block">Gênero</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {['Todos', 'Homem', 'Mulher'].map(gender => (
                                <button
                                    key={gender}
                                    onClick={() => setFilters(prev => ({ ...prev, gender }))}
                                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${filters.gender === gender
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {gender}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rating */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-300 mb-3 flex justify-between">
                            Avaliação Mínima
                            <span className="text-primary">{filters.minRating > 0 ? filters.minRating.toFixed(1) + '+' : 'Qualquer'}</span>
                        </h4>
                        <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={filters.minRating}
                            onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                            className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>0</span>
                            <span>2.5</span>
                            <span>5.0</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 bg-black/20 flex gap-3">
                    <Button variant="ghost" onClick={handleClear} className="flex-1">Limpar</Button>
                    <Button onClick={handleApply} className="flex-1">Aplicar Filtros</Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
