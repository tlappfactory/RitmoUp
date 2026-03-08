import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button, Input, IconButton } from '../UIComponents';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../ToastContext';
import { Exercise } from '../../types';
import { workoutService } from '../../services/workoutService';

interface ExerciseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    exercise?: Exercise | null;
}

export const ExerciseModal = ({ isOpen, onClose, onSave, exercise }: ExerciseModalProps) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<Partial<Exercise>>({
        name: '',
        muscleGroup: '',
        equipment: '',
        level: 'Iniciante',
        description: '',
        instructions: [],
        tips: [],
        imageUrl: '',
        videoUrl: '',
        type: 'Força'
    });

    const [instructionsText, setInstructionsText] = useState('');
    const [tipsText, setTipsText] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (exercise) {
                setFormData(exercise);
                setInstructionsText(exercise.instructions?.join('\n') || '');
                setTipsText(exercise.tips?.join('\n') || '');
            } else {
                // Reset form for new exercise
                setFormData({
                    name: '',
                    muscleGroup: '',
                    equipment: '',
                    level: 'Iniciante',
                    description: '',
                    instructions: [],
                    tips: [],
                    imageUrl: '',
                    videoUrl: '',
                    type: 'Força'
                });
                setInstructionsText('');
                setTipsText('');
            }
        }
    }, [isOpen, exercise]);

    const handleChange = (key: keyof Exercise, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };



    const isRestricted = user?.role === 'TRAINER' && !!exercise;
    const canEditGlobal = user?.role === 'ADMIN' || user?.role === 'TRAINER' || !exercise;

    const handleSubmit = async () => {
        if (!formData.name || !formData.muscleGroup) {
            showToast('Nome e Grupo Muscular são obrigatórios', 'error');
            return;
        }

        setLoading(true);
        try {
            const exerciseId = exercise?.id || Date.now().toString();

            // 1. Save GLOBAL Exercise Data - ONLY if Admin or Creating New
            if (canEditGlobal) {
                const exerciseToSave: Exercise = {
                    id: exerciseId,
                    name: formData.name!,
                    muscleGroup: formData.muscleGroup!,
                    equipment: formData.equipment || '',
                    level: formData.level as any || 'Iniciante',
                    description: formData.description || '',
                    type: formData.type || 'Força',
                    imageUrl: formData.imageUrl || '',
                    videoUrl: '', // Always empty globally
                    instructions: instructionsText.split('\n').filter(line => line.trim() !== ''),
                    tips: tipsText.split('\n').filter(line => line.trim() !== '')
                };
                await workoutService.addExerciseToCatalog(exerciseToSave);
            }

            // 2. Save Trainer Video Override (if Trainer and video exists)
            if (user?.role === 'TRAINER' && formData.videoUrl) {
                await workoutService.saveTrainerVideo(user.id, exerciseId, formData.videoUrl);
            }

            showToast(`Exercício ${exercise ? 'atualizado' : 'criado'} com sucesso!`, 'success');
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Erro ao salvar exercício', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-surface-dark rounded-t-2xl z-10">
                    <h3 className="font-bold text-lg text-white">{exercise ? 'Editar Exercício' : 'Novo Exercício'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">

                    {/* Exercise Image - Read Only */}
                    {formData.imageUrl && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-full max-w-sm h-80 bg-black/40 rounded-xl overflow-hidden">
                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <p className="text-xs text-gray-400 text-center">
                                As imagens são gerenciadas pelo sistema
                            </p>
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-gray-400 ml-1 mb-1 block">Nome do Exercício *</label>
                            <Input
                                value={formData.name || ''}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Ex: Supino Reto"
                                disabled={isRestricted}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-400 ml-1 mb-1 block">Grupo Muscular *</label>
                            <select
                                className={`w-full bg-[#202020] border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={formData.muscleGroup || ''}
                                onChange={(e) => handleChange('muscleGroup', e.target.value)}
                                disabled={isRestricted}
                            >
                                <option value="" disabled>Selecione...</option>
                                {['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Cardio', 'Glúteos', 'Corpo Inteiro'].map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ... (rest of the form fields - omitting for brevity as they are unchanged) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-gray-400 ml-1 mb-1 block">Equipamento</label>
                            <Input
                                value={formData.equipment || ''}
                                onChange={(e) => handleChange('equipment', e.target.value)}
                                placeholder="Ex: Barra, Halteres"
                                disabled={isRestricted}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-400 ml-1 mb-1 block">Nível</label>
                            <select
                                className={`w-full bg-[#202020] border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={formData.level || 'Iniciante'}
                                onChange={(e) => handleChange('level', e.target.value)}
                                disabled={isRestricted}
                            >
                                <option value="Iniciante">Iniciante</option>
                                <option value="Intermediário">Intermediário</option>
                                <option value="Avançado">Avançado</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-400 ml-1 mb-1 block">Descrição</label>
                        <textarea
                            className={`w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all h-24 resize-none ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="Breve descrição do exercício..."
                            value={formData.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            disabled={isRestricted}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-400 ml-1 mb-1 block">Instruções (uma por linha)</label>
                        <textarea
                            className={`w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all h-32 resize-none ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="Passo 1...&#10;Passo 2...&#10;Passo 3..."
                            value={instructionsText}
                            onChange={(e) => setInstructionsText(e.target.value)}
                            disabled={isRestricted}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-400 ml-1 mb-1 block">Dicas (uma por linha)</label>
                        <textarea
                            className={`w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all h-24 resize-none ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="Dica importante..."
                            value={tipsText}
                            onChange={(e) => setTipsText(e.target.value)}
                            disabled={isRestricted}
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex justify-end gap-3 rounded-b-2xl bg-surface-dark">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Exercício'}
                    </Button>
                </div>

            </div>
        </div>,
        document.body
    );
};
