import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../ToastContext';
import { studentService } from '../../services/studentService';
import { workoutService } from '../../services/workoutService';
import { aiService } from '../../services/aiService';
import { ExerciseSelector } from './ExerciseSelector';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Student, WorkoutExercise, Exercise, Workout } from '../../types';

interface CreateWorkoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Workout | null;
}

export const CreateWorkoutModal: React.FC<CreateWorkoutModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

    // AI State
    // AI State
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Speech Recognition
    // Speech Recognition
    const { isListening, transcript, toggleListening, supported: speechSupported, error: speechError } = useSpeechRecognition();

    useEffect(() => {
        if (speechError) {
            showToast(speechError, 'error');
        }
    }, [speechError, showToast]);

    useEffect(() => {
        if (transcript) {
            setAiPrompt(prev => {
                // If the previous prompt ends with a space, just append. If not, add a space.
                // Or simply replace if it was empty. 
                // Let's replace for now to keep it simple or append if user pauses?
                // The hook usually returns the *full* transcript of the current session.
                // But since we might want to edit, let's just use the transcript as the value if active, 
                // OR append it. 
                // Actually, a common pattern: if listening, show transcript.
                // But the hook might restart. 
                // Let's try appending if the transcript is new and different.
                // Simpler approach for this version: When listening, the input value IS the transcript? 
                // No, user might have typed something.
                // Better: When transcript updates, append it to the *end* if it's a new sentence?
                // The provided hook seems to clear transcript on start.
                return transcript;
            });
        }
    }, [transcript]);

    const [activeStudents, setActiveStudents] = useState<Student[]>([]);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTemplate, setIsTemplate] = useState(false);
    const [swapIndex, setSwapIndex] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title || '');
            setDescription(initialData.description || '');
            setExercises(initialData.exercises || []);
            setSelectedStudentId(initialData.studentId === 'template' ? '' : initialData.studentId || '');
            setIsTemplate(initialData.isTemplate || initialData.studentId === 'template');
        } else if (isOpen) {
            // Reset if opening new
            setTitle('');
            setDescription('');
            setExercises([]);
            setSelectedStudentId('');
            setIsTemplate(false);
            setAiPrompt('');
        }
    }, [isOpen, initialData]);


    useEffect(() => {
        if (!isOpen || !user) return;

        const loadStudents = async () => {
            try {
                const students = await studentService.getStudentsByTrainer(user.id);
                setActiveStudents(students);
            } catch (err) {
                console.error("Error loading students", err);
                showToast("Erro ao carregar lista de alunos", "error");
            }
        };
        loadStudents();
    }, [isOpen, user]);

    // ... (rest of useEffects/handlers if needed, but we are replacing targeted block)

    // Wait, be careful not to delete handleAddExercise etc if I replace too much.
    // I will only replace the top block down to handleSave start if possible, or just inject state.
    // Or better, use multi_replace for safety.

    // Let's use multi_replace to be precise.
    // Chunk 1: Add state
    // Chunk 2: Update handleSave
    // Chunk 3 (Already done in step 51): Footer checkbox. 

    // Changing tool to multi_replace.


    const handleAddExercise = (ex: Exercise) => {
        const newEx: WorkoutExercise = {
            ...ex,
            sets: 3,
            reps: '10',
            weight: '',
            notes: '',
            rest: '60s'
        };

        if (swapIndex !== null) {
            // Swap existing
            setExercises(prev => {
                const updated = [...prev];
                // Keep existing settings if possible? No, usually swap means new exercise with default or new settings.
                // But maybe keep sets/reps? The user asked to "trocar", usually means the exercise itself.
                // Let's keep the user's focus on the new exercise but maybe preserve sets/reps if they want? 
                // Standard behavior: replace completely but maybe keep basic structural info? 
                // Let's replace with newEx but we could arguably keep sets/reps from the old one?
                // For now, full replace with defaults is safer to avoid mismatch (e.g. swapping barbell press for running).
                updated[swapIndex] = newEx;
                return updated;
            });
            setSwapIndex(null);
        } else {
            // Add new
            setExercises(prev => [...prev, newEx]);
        }
        setIsSelectorOpen(false);
    };

    const handleOpenSelector = () => {
        setSwapIndex(null);
        setIsSelectorOpen(true);
    };

    const handleSwapCall = (index: number) => {
        setSwapIndex(index);
        setIsSelectorOpen(true);
    };

    const updateExercise = (index: number, field: keyof WorkoutExercise, value: any) => {
        const updated = [...exercises];
        updated[index] = { ...updated[index], [field]: value };
        setExercises(updated);
    };

    const removeExercise = (index: number) => {
        setExercises(exercises.filter((_, i) => i !== index));
    };

    const handleGenerateAI = async () => {
        if (!aiPrompt.trim()) return showToast('Descreva o treino que deseja gerar (ex: "Peito e Tríceps")', 'warning');

        setIsGenerating(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            const catalog = await workoutService.getExercises();
            // Find selected student
            const selectedStudent = activeStudents.find(s => s.id === selectedStudentId);

            // Use the enhanced AI service
            const generatedExercises = await aiService.generateWorkout(aiPrompt, catalog, selectedStudent);

            if (generatedExercises.length === 0) {
                // Fallback if AI returned nothing (should rarely happen with new logic, but handled inside service mostly)
                // The service now returns [] if no tokens, but handles fallbacks inside. 
                // If it returns empty, it means invalid prompt.
                showToast('Não entendi o pedido. Tente usar nomes de músculos ou objetivos (ex: "Força").', 'warning');
                return;
            }

            setExercises(generatedExercises);
            showToast('Treino gerado com sucesso!', 'success');

            if (!title) setTitle(`Treino - ${aiPrompt.charAt(0).toUpperCase() + aiPrompt.slice(1).substring(0, 20)}...`);

        } catch (e) {
            console.error(e);
            showToast('Erro ao gerar treino', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        if (!title) return showToast("Digite um título para o treino", "warning");
        if (!isTemplate && !selectedStudentId) return showToast("Selecione um aluno", "warning");
        if (exercises.length === 0) return showToast("Adicione pelo menos um exercício", "warning");

        setIsSubmitting(true);
        try {
            const workoutData: any = {
                title,
                description,
                trainerId: user.id,
                studentId: isTemplate ? 'template' : selectedStudentId,
                exercises,
                isTemplate,
                updatedAt: new Date()
            };

            if (initialData && initialData.id) {
                // Update existing
                await workoutService.saveWorkoutWithId({ ...initialData, ...workoutData });
                showToast("Treino atualizado com sucesso!", "success");
            } else {
                // Create new
                workoutData.createdAt = new Date();
                await workoutService.createWorkout(workoutData);
                showToast("Treino criado com sucesso!", "success");
            }

            onSuccess();
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setExercises([]);
            setSelectedStudentId('');
            setAiPrompt('');
        } catch (error) {
            console.error("Save workout", error);
            showToast("Erro ao salvar treino", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4">
            <div className="bg-[#1C1C1E] rounded-2xl w-full max-w-2xl border border-white/10 max-h-[90vh] flex flex-col relative">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1C1C1E] rounded-t-2xl z-10">
                    <h2 className="text-2xl font-bold font-display">{initialData ? 'Editar Treino' : 'Novo Treino'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Título</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-primary transition-colors text-white placeholder-gray-500"
                                placeholder="Ex: Treino A - Peito e Tríceps"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Aluno</label>
                            <select
                                className="w-full bg-[#2C2C2E] border border-white/10 rounded-lg p-3 outline-none focus:border-primary transition-colors text-white"
                                value={selectedStudentId}
                                onChange={e => setSelectedStudentId(e.target.value)}
                            >
                                <option value="">Selecione...</option>
                                {activeStudents.map(st => (
                                    <option key={st.id} value={st.id}>{st.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* AI Assistant Section */}
                    <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4 relative overflow-hidden">
                        <div className="flex items-center gap-2 text-primary">
                            <span className="material-symbols-outlined">auto_awesome</span>
                            <h3 className="font-bold text-sm uppercase tracking-wide">Assistente RitmoAI</h3>
                        </div>
                        <p className="text-xs text-gray-400">Descreva o objetivo (ex: "Treino forte de pernas e glúteo") e a IA montará uma sugestão.</p>

                        <div className="relative">
                            <div className="flex gap-2 items-center">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        className={`w-full bg-black/20 border ${isListening ? 'border-primary animate-pulse' : 'border-white/10'} rounded-lg h-[46px] pl-3 pr-10 text-sm text-white outline-none focus:border-primary placeholder-gray-500 transition-all`}
                                        placeholder={isListening ? "Ouvindo..." : "Descreva o treino..."}
                                        value={aiPrompt}
                                        onChange={e => setAiPrompt(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleGenerateAI()}
                                    />
                                    {/* Mic Button inside input */}
                                    {speechSupported && (
                                        <button
                                            onClick={toggleListening}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-500 scale-110' : 'text-gray-400 hover:text-primary hover:bg-white/5'}`}
                                            title="Usar voz"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">{isListening ? 'mic_off' : 'mic'}</span>
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={handleGenerateAI}
                                    disabled={isGenerating}
                                    className="bg-primary text-black font-bold rounded-lg px-4 h-[46px] flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 shrink-0"
                                >
                                    {isGenerating ? (
                                        <span className="material-symbols-outlined animate-spin">refresh</span>
                                    ) : (
                                        <span className="material-symbols-outlined">send</span>
                                    )}
                                </button>
                            </div>
                            {isListening && <p className="text-[10px] text-primary/80 mt-1 ml-1 animate-pulse">Gravando...</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Descrição (Opcional)</label>
                        <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-primary transition-colors h-20 resize-none text-white placeholder-gray-500"
                            placeholder="Instruções gerais..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Exercises List */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Exercícios ({exercises.length})</h3>
                            <button
                                onClick={handleOpenSelector}
                                className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                Adicionar
                            </button>
                        </div>

                        {exercises.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl text-gray-500">
                                Nenhum exercício adicionado.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {exercises.map((ex, idx) => (
                                    <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-bold text-white">{ex.name}</h4>
                                                <div className="flex gap-2 text-xs mt-1">
                                                    <span className="text-primary">{ex.muscleGroup}</span>
                                                    {ex.equipment && <span className="text-gray-400">• {ex.equipment}</span>}
                                                    {ex.level && <span className={`px-1.5 rounded ${ex.level === 'Iniciante' ? 'bg-green-500/10 text-green-500' :
                                                        ex.level === 'Intermediário' ? 'bg-yellow-500/10 text-yellow-500' :
                                                            'bg-red-500/10 text-red-500'
                                                        }`}>{ex.level}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleSwapCall(idx)} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs font-bold" title="Trocar exercício">
                                                    <span className="material-symbols-outlined text-base">swap_horiz</span>
                                                    Trocar
                                                </button>
                                                <button onClick={() => removeExercise(idx)} className="text-red-500 hover:text-red-400" title="Excluir exercício">
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <label className="text-xs text-gray-400 block mb-1">Séries</label>
                                                <input
                                                    type="number"
                                                    value={ex.sets}
                                                    onChange={e => updateExercise(idx, 'sets', parseInt(e.target.value))}
                                                    className="w-full bg-black/20 rounded p-2 outline-none text-white text-center"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400 block mb-1">Reps</label>
                                                <input
                                                    type="text"
                                                    value={ex.reps}
                                                    onChange={e => updateExercise(idx, 'reps', e.target.value)}
                                                    className="w-full bg-black/20 rounded p-2 outline-none text-white text-center"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs text-gray-400 block mb-1">Descanso</label>
                                                <input
                                                    type="text"
                                                    value={ex.rest}
                                                    onChange={e => updateExercise(idx, 'rest', e.target.value)}
                                                    className="w-full bg-black/20 rounded p-2 outline-none text-white text-center"
                                                />
                                            </div>
                                            {/* Hide Weight for Mobility/Stretching */}
                                            {!['Mobilidade', 'Alongamento', 'Cardio'].includes(ex.muscleGroup) && !['Mobilidade', 'Alongamento', 'Cardio'].includes(ex.type || '') && (
                                                <div>
                                                    <label className="text-xs text-gray-400 block mb-1">Carga (kg)</label>
                                                    <input
                                                        type="text"
                                                        value={ex.weight}
                                                        onChange={e => updateExercise(idx, 'weight', e.target.value)}
                                                        className="w-full bg-black/20 rounded p-2 outline-none text-white text-center"
                                                        placeholder="-"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {/* Video URL Input - Prominent */}
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="material-symbols-outlined text-primary text-sm">videocam</span>
                                                <label className="text-xs text-primary font-bold">Vídeo de Execução (Opcional)</label>
                                            </div>
                                            <input
                                                type="text"
                                                value={ex.videoUrl || ''}
                                                onChange={e => updateExercise(idx, 'videoUrl', e.target.value)}
                                                className="w-full bg-primary/5 border border-primary/20 rounded p-2 outline-none text-white text-sm focus:border-primary transition-colors placeholder-gray-500"
                                                placeholder="Cole aqui o link do YouTube, Vimeo, etc."
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-between items-center bg-[#1C1C1E] rounded-b-2xl z-10">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isTemplate ? 'bg-primary border-primary' : 'border-gray-500 group-hover:border-primary'}`}>
                            {isTemplate && <span className="material-symbols-outlined text-black text-sm font-bold">check</span>}
                        </div>
                        <input
                            type="checkbox"
                            checked={isTemplate}
                            onChange={e => setIsTemplate(e.target.checked)}
                            className="hidden"
                        />
                        <span className={`text-sm ${isTemplate ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`}>Salvar como Modelo</span>
                    </label>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-bold text-white">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="px-6 py-3 rounded-xl bg-primary text-black font-bold hover:brightness-110 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Criar Treino')}
                        </button>
                    </div>
                </div>

                {/* Nested Selector Modal */}
                {
                    isSelectorOpen && (
                        <ExerciseSelector
                            onSelect={handleAddExercise}
                            onClose={() => { setIsSelectorOpen(false); setSwapIndex(null); }}
                        />
                    )
                }
            </div >
        </div >
    );
};
