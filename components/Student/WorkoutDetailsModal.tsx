import React from 'react';
import { Button } from '../UIComponents';
import { Workout, WorkoutExercise } from '../../types';
// removed browser import

interface WorkoutDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    workout: Workout | null;
    onStart: (workout: Workout) => void;
}

export const WorkoutDetailsModal = ({ isOpen, onClose, workout, onStart }: WorkoutDetailsModalProps) => {
    if (!isOpen || !workout) return null;

    const groupedExercises: { [key: string]: WorkoutExercise[] } = {};
    const singleExercises: WorkoutExercise[] = [];

    // Group exercises by superset or keep generic
    if (workout.exercises) {
        workout.exercises.forEach((ex) => {
            if (ex.groupId) {
                if (!groupedExercises[ex.groupId]) {
                    groupedExercises[ex.groupId] = [];
                }
                groupedExercises[ex.groupId].push(ex);
            } else {
                singleExercises.push(ex);
            }
        });
    }

    const handleOpenVideo = async (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1a1a] dark:bg-[#1a1a1a] w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">{workout.title}</h2>
                            {workout.description && <p className="text-gray-400 text-sm">{workout.description}</p>}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-gray-400">close</span>
                        </button>
                    </div>

                    <div className="flex gap-4 mt-4 text-sm text-gray-300">
                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-sm text-primary">fitness_center</span>
                            {workout.exercises?.length || 0} Exercícios
                        </div>
                        {/* Add more metadata if available */}
                    </div>
                </div>

                {/* Content Scroll */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {!workout.exercises || workout.exercises.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            Nenhum exercício cadastrado neste treino.
                        </div>
                    ) : (
                        workout.exercises.map((exercise, index) => (
                            <div key={index} className="flex gap-4 items-start p-4 rounded-xl bg-white/5 border border-white/5">

                                {/* Image Thumb */}
                                <div className="size-16 rounded-lg bg-black/40 overflow-hidden shrink-0 border border-white/5 relative group">
                                    {exercise.imageUrl ? (
                                        <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-full object-cover opacity-80" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-gray-600">image</span>
                                        </div>
                                    )}
                                    {exercise.videoUrl && (
                                        <div
                                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                            onClick={(e) => handleOpenVideo(e, exercise.videoUrl!)}
                                        >
                                            <span className="material-symbols-outlined text-white">play_circle</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-lg text-white truncate">{exercise.name}</h4>
                                        {exercise.groupId && (
                                            <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded uppercase tracking-wider">Superset</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 truncate">{exercise.muscleGroup}</p>

                                    <div className="grid grid-cols-3 gap-2 mt-3">
                                        <div className="bg-black/20 rounded px-1 py-1 text-center flex flex-col justify-center">
                                            <span className="block text-[8px] text-gray-500 uppercase font-bold">Séries</span>
                                            <span className="font-mono text-xs font-bold text-white">{exercise.sets}</span>
                                        </div>
                                        <div className="bg-black/20 rounded px-1 py-1 text-center flex flex-col justify-center">
                                            <span className="block text-[8px] text-gray-500 uppercase font-bold text-center">{exercise.muscleGroup === 'Cardio' || exercise.type === 'Cardio' ? 'Min' : 'Reps'}</span>
                                            <span className="font-mono text-xs font-bold text-white text-center flex justify-center items-center h-full">{exercise.reps}</span>
                                        </div>
                                        {exercise.weight && (
                                            <div className="bg-black/20 rounded px-1 py-1 text-center flex flex-col justify-center overflow-hidden">
                                                <span className="block text-[8px] text-gray-500 uppercase font-bold">Carga</span>
                                                <span className="font-mono text-[10px] leading-tight font-bold text-white break-words line-clamp-3" title={exercise.weight}>
                                                    {exercise.weight}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-end mt-2">
                                        {(exercise.instructions && exercise.instructions.length > 0) ? (
                                            <p className="text-xs text-gray-500 line-clamp-1 italic flex-1 mr-2">{exercise.instructions[0]}</p>
                                        ) : <div className="flex-1"></div>}

                                        {exercise.videoUrl && (
                                            <div
                                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                                                onClick={(e) => handleOpenVideo(e, exercise.videoUrl!)}
                                            >
                                                <span className="material-symbols-outlined text-sm">play_circle</span> Vídeo
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/5 bg-[#1a1a1a]">
                    <Button variant="primary" className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" onClick={() => onStart(workout)}>
                        <span className="material-symbols-outlined mr-2">play_arrow</span>
                        Começar Treino
                    </Button>
                </div>

            </div>
        </div>
    );
};
