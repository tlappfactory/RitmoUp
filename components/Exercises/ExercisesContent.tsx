import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../AuthContext';
import { Input } from '../UIComponents';
import { Exercise } from '../../types';
import { workoutService } from '../../services/workoutService';
import { useToast } from '../../ToastContext';
import { ExerciseModal } from './ExerciseModal';
import { UserRole } from '../../types';

interface ExercisesContentProps {
    embedded?: boolean;
}

import { ImageViewerModal } from '../UIComponents/ImageViewerModal';

export const ExercisesContent = ({ embedded = false }: ExercisesContentProps) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState<string>('Todos');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

    // Image Viewer State
    const [viewImage, setViewImage] = useState<string | null>(null);

    const loadExercises = async () => {
        setLoading(true);
        try {
            const data = await workoutService.getExercises(user?.role === UserRole.TRAINER ? user.id : undefined);
            setExercises(data);
        } catch (error) {
            console.error("Error loading exercises:", error);
            showToast("Erro ao carregar exercícios", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadExercises();
    }, []);

    const filteredExercises = useMemo(() => {
        let result = [...exercises];

        if (searchTerm) {
            const lowerInfo = searchTerm.toLowerCase();
            result = result.filter(ex =>
                ex.name.toLowerCase().includes(lowerInfo) ||
                ex.muscleGroup.toLowerCase().includes(lowerInfo)
            );
        }

        if (selectedMuscle !== 'Todos') {
            result = result.filter(ex => ex.muscleGroup === selectedMuscle);
        }

        // Bulletproof Portuguese alphabetical sorting
        return result.sort((a, b) => {
            const normalize = (str: string) => {
                return str.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');
            };
            const nameA = normalize(a.name);
            const nameB = normalize(b.name);
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
    }, [exercises, searchTerm, selectedMuscle]);

    // Removed handleEdit and handleCreate to disable editing/creation in this view

    const handleSave = () => {
        loadExercises(); // Refresh list
    };

    const handleImageClick = (e: React.MouseEvent, imageUrl: string) => {
        e.stopPropagation();
        setViewImage(imageUrl);
    };

    const muscleGroups = ['Todos', ...Array.from(new Set(exercises.map(ex => ex.muscleGroup))).sort()];

    return (
        <>
            <ExerciseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                exercise={selectedExercise}
            />

            <ImageViewerModal
                isOpen={!!viewImage}
                imageUrl={viewImage}
                onClose={() => setViewImage(null)}
            />

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar exercício..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon="search"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <select
                            className="w-full h-[50px] bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 text-text-light dark:text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                            value={selectedMuscle}
                            onChange={(e) => setSelectedMuscle(e.target.value)}
                        >
                            {muscleGroups.map(group => (
                                <option key={group} value={group} className="bg-white dark:bg-[#1a1a1a]">{group}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Carregando exercícios...</div>
                ) : filteredExercises.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">fitness_center</span>
                        <p className="text-gray-500">Nenhum exercício encontrado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredExercises.map(exercise => (
                            <div
                                key={exercise.id}
                                className="glass-card group relative p-0 overflow-hidden flex flex-col h-full hover:border-primary/50 transition-all"
                            >

                                {/* Image / Placeholder */}
                                <div
                                    className="h-80 bg-gray-100 dark:bg-black/40 relative overflow-hidden cursor-zoom-in"
                                    onClick={(e) => exercise.imageUrl ? handleImageClick(e, exercise.imageUrl) : undefined}
                                >
                                    {exercise.imageUrl ? (
                                        <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                            <span className="material-symbols-outlined text-4xl mb-1 opacity-50">fitness_center</span>
                                            <span className="text-xs">Sem imagem</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4 pointer-events-none">
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-black uppercase tracking-wider">
                                                    {exercise.muscleGroup}
                                                </span>
                                            </div>
                                            {/* Eye icon as a visual hint for expansion/viewing */}
                                            <div className="size-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">
                                                <span className="material-symbols-outlined text-sm">visibility</span>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mt-1 truncate">{exercise.name}</h3>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
                                        {exercise.description || "Sem descrição."}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-white/5">
                                        {exercise.equipment && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">fitness_center</span>
                                                {exercise.equipment}
                                            </span>
                                        )}
                                        {exercise.level && (
                                            <span className="flex items-center gap-1 ml-auto">
                                                <span className="material-symbols-outlined text-sm">leaderboard</span>
                                                {exercise.level}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
