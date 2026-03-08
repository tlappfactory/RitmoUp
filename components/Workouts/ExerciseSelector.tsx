import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { workoutService } from '../../services/workoutService';
import { Exercise } from '../../types';

interface ExerciseSelectorProps {
    onSelect: (exercise: Exercise) => void;
    onClose: () => void;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ onSelect, onClose }) => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [search, setSearch] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState<string>('Todos');
    const [loading, setLoading] = useState(true);

    const muscleGroups = ['Todos', 'Peito', 'Costas', 'Pernas', 'Glúteos', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Cardio', 'Mobilidade', 'Alongamento'];

    useEffect(() => {
        const load = async () => {
            const data = await workoutService.getExercises();
            setExercises(data);
            setLoading(false);
        };
        load();
    }, []);

    const filtered = exercises.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
        const matchesMuscle = selectedMuscle === 'Todos' || ex.muscleGroup.includes(selectedMuscle); // flexible match
        return matchesSearch && matchesMuscle;
    }).sort((a, b) => a.name.trim().toLowerCase().localeCompare(b.name.trim().toLowerCase(), 'pt-BR', { sensitivity: 'base' }));

    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setExpandedId(expandedId === id ? null : id);
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1C1C1E] p-6 rounded-2xl w-full max-w-lg border border-white/10 h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Selecionar Exercício</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex gap-2 mb-4">
                    <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar exercício..."
                            className="bg-transparent outline-none w-full text-white"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                    {muscleGroups.map(group => (
                        <button
                            key={group}
                            onClick={() => setSelectedMuscle(group)}
                            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${selectedMuscle === group ? 'bg-primary text-black font-bold' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                        >
                            {group}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {loading ? (
                        <p className="text-center text-gray-500 py-8">Carregando catálogo...</p>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Nenhum exercício encontrado.</p>
                    ) : (
                        filtered.map(ex => (
                            <div key={ex.id} className="bg-white/5 rounded-lg overflow-hidden border border-white/5 hover:border-white/10 transition-colors">
                                <div
                                    className="p-3 flex justify-between items-center cursor-pointer hover:bg-white/5"
                                    onClick={() => onSelect(ex)}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-white">{ex.name}</p>
                                            <button
                                                onClick={(e) => toggleExpand(e, ex.id)}
                                                className="text-gray-400 hover:text-primary"
                                                title="Ver detalhes"
                                            >
                                                <span className="material-symbols-outlined text-sm pt-1">info</span>
                                            </button>
                                        </div>
                                        <div className="flex gap-2 text-xs text-gray-400 mt-1 flex-wrap">
                                            <span className="bg-white/10 px-2 py-0.5 rounded">{ex.muscleGroup}</span>
                                            {ex.equipment && <span className="bg-white/10 px-2 py-0.5 rounded">{ex.equipment}</span>}
                                            {ex.level && <span className={`px-2 py-0.5 rounded ${ex.level === 'Iniciante' ? 'bg-green-500/20 text-green-400' :
                                                ex.level === 'Intermediário' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>{ex.level}</span>}
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-primary">add_circle</span>
                                </div>

                                {expandedId === ex.id && (
                                    <div className="px-3 pb-3 pt-0 text-xs text-gray-300 bg-black/20 border-t border-white/5">
                                        {ex.imageUrl && (
                                            <div className="mt-3 mb-2 rounded-lg overflow-hidden border border-white/10 relative aspect-video">
                                                <img
                                                    src={ex.imageUrl}
                                                    alt={ex.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                        <div className="mt-2">
                                            <p className="italic text-gray-400 mb-2">{ex.description}</p>

                                            {ex.instructions && ex.instructions.length > 0 && (
                                                <div className="mb-2">
                                                    <p className="font-bold text-gray-500 mb-1">Instruções:</p>
                                                    <ol className="list-decimal list-inside space-y-0.5 pl-1">
                                                        {ex.instructions.slice(0, 3).map((inst, i) => (
                                                            <li key={i}>{inst}</li>
                                                        ))}
                                                    </ol>
                                                </div>
                                            )}

                                            {ex.tips && ex.tips.length > 0 && (
                                                <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/10">
                                                    <p className="font-bold text-yellow-500 mb-1 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-xs">lightbulb</span> Dica
                                                    </p>
                                                    <p className="text-yellow-100/80">{ex.tips[0]}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
