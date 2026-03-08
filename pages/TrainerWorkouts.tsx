import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { workoutService } from '../services/workoutService';
import { Workout } from '../types';
import { DashboardLayout } from '../components/Layout';
import { useToast } from '../ToastContext';
import { studentService } from '../services/studentService';
import { ExercisesContent } from '../components/Exercises/ExercisesContent';
import { Button } from '../components/UIComponents';
import { CreateWorkoutModal } from '../components/Workouts/CreateWorkoutModal';

export const TrainerWorkouts = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if initial tab passed in state or query
    const [activeTab, setActiveTab] = useState<'history' | 'templates' | 'exercises'>('history');
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [templates, setTemplates] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentMap, setStudentMap] = useState<Record<string, string>>({});
    const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
    const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        // Don't reload everyone if just switching to exercises, but keeping it simple
        if (activeTab !== 'exercises') {
            loadData();
        }
    }, [user, activeTab]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            if (activeTab === 'history') {
                const data = await workoutService.getWorkoutsByTrainer(user.id);
                setWorkouts(data);

                // Load student names
                const studentIds = Array.from(new Set(data.map(w => w.studentId).filter(id => id && id !== 'template')));
                const allStudents = await studentService.getStudentsByTrainer(user.id);
                const map: Record<string, string> = {};
                allStudents.forEach(s => map[s.id] = s.name);
                setStudentMap(map);

            } else if (activeTab === 'templates') {
                const data = await workoutService.getTrainerTemplates(user.id);
                setTemplates(data);
            }
        } catch (error) {
            console.error("Error loading workouts", error);
            showToast("Erro ao carregar treinos", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUseTemplate = (template: Workout) => {
        // Use navigate to create new from template
        navigate('/trainer/create-workout', { state: { fromTemplate: template } });
    };

    const handleEditWorkout = (workout: Workout) => {
        setEditingWorkout(workout);
        setIsWorkoutModalOpen(true);
    };

    const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Tem certeza que deseja excluir este modelo?")) return;
        showToast("Função de excluir em desenvolvimento", "info");
    };

    return (
        <DashboardLayout title="Treinos"
            rightAction={
                // Desktop only button
                <Button variant="primary" onClick={() => { setEditingWorkout(null); setIsWorkoutModalOpen(true); }} className="hidden md:flex">
                    <span className="material-symbols-outlined text-sm mr-2">add_circle</span>
                    Novo Treino
                </Button>
            }
        >
            <div className="space-y-6 pb-20 md:pb-0">
                {/* Tabs */}
                <div className="flex gap-4 border-b border-glass-border overflow-x-auto scrollbar-hide w-full max-w-[100vw]">
                    {[
                        { id: 'history', label: 'Histórico' },
                        { id: 'templates', label: 'Meus Modelos' },
                        { id: 'exercises', label: <span>Catálogo <span className="hidden md:inline">de Exercícios</span></span> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-3 px-4 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === tab.id ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                        >
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'exercises' ? (
                    <ExercisesContent embedded />
                ) : (
                    loading ? (
                        <div className="py-12 text-center text-gray-500">
                            <span className="material-symbols-outlined animate-spin text-3xl mb-2">refresh</span>
                            <p>Carregando...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeTab === 'history' ? (
                                workouts.length === 0 ? (
                                    <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-glass-border rounded-xl">
                                        <span className="material-symbols-outlined text-4xl mb-2 opacity-30">history</span>
                                        <p>Nenhum treino encontrado no histórico.</p>
                                    </div>
                                ) : (
                                    workouts.map(workout => (
                                        <div key={workout.id} className="glass p-4 md:p-5 rounded-xl border border-glass-border hover:border-primary/30 transition-all group relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg text-white truncate pr-6">{workout.title}</h3>
                                                <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded-full whitespace-nowrap">
                                                    {workout.createdAt?.toDate ? workout.createdAt.toDate().toLocaleDateString('pt-BR') : 'Data desc.'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 mb-4">
                                                <span className="material-symbols-outlined text-xs align-middle mr-1">person</span>
                                                {studentMap[workout.studentId] || 'Aluno desconhecido'}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                                                    {workout.exercises?.length || 0} exercícios
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => handleUseTemplate(workout)}
                                                className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-lg text-primary"
                                                title="Reutilizar este treino"
                                            >
                                                <span className="material-symbols-outlined">content_copy</span>
                                            </button>
                                            <button
                                                onClick={() => handleEditWorkout(workout)}
                                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-lg text-primary"
                                                title="Editar Treino"
                                            >
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                        </div>
                                    ))
                                )
                            ) : (
                                templates.length === 0 ? (
                                    <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-glass-border rounded-xl">
                                        <span className="material-symbols-outlined text-4xl mb-2 opacity-30">post_add</span>
                                        <p>Nenhum modelo salvo.</p>
                                        <button onClick={() => { setEditingWorkout(null); setIsWorkoutModalOpen(true); }} className="text-primary hover:underline mt-2">Criar novo treino</button>
                                    </div>
                                ) : (
                                    templates.map(template => (
                                        <div key={template.id} className="glass p-5 rounded-xl border border-glass-border hover:border-primary/50 transition-all cursor-pointer group" onClick={() => handleUseTemplate(template)}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary text-xl">bookmark</span>
                                                    <h3 className="font-bold text-lg text-white truncate">{template.title}</h3>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditWorkout(template); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-lg text-primary"
                                                    title="Editar Modelo"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                            </div>
                                            {template.description && <p className="text-sm text-gray-400 mb-4 line-clamp-2">{template.description}</p>}

                                            <div className="flex items-center justify-between mt-4">
                                                <span className="bg-white/5 text-gray-300 px-2 py-1 rounded text-xs">
                                                    {template.exercises?.length || 0} exercícios
                                                </span>
                                                <span className="text-primary text-xs font-bold uppercase flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                    Usar Modelo <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    )
                )}

                {/* Mobile FAB */}
                <button
                    onClick={() => { setEditingWorkout(null); setIsWorkoutModalOpen(true); }}
                    className="md:hidden fixed bottom-24 right-4 z-50 size-14 bg-primary text-black rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-black"
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>

                {isWorkoutModalOpen && (
                    <CreateWorkoutModal
                        isOpen={isWorkoutModalOpen}
                        onClose={() => { setIsWorkoutModalOpen(false); setEditingWorkout(null); }}
                        onSuccess={() => { loadData(); }}
                        initialData={editingWorkout}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};
