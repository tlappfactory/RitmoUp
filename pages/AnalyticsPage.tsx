
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/Layout';
import { useAuth } from '../AuthContext';
import { workoutService } from '../services/workoutService';
import { analyticsService } from '../services/analyticsService';
import { MuscleHeatmap } from '../components/Analytics/MuscleHeatmap';
import { OneRMChart } from '../components/Analytics/OneRMChart';
import { Card } from '../components/UIComponents';
import { useToast } from '../ToastContext';
import { Workout } from '../types';

export const AnalyticsPage = ({ embedded }: { embedded?: boolean }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'evolution'>('overview');

    // Stats
    const [totalVolume, setTotalVolume] = useState(0);
    const [muscleFreq, setMuscleFreq] = useState<Record<string, number>>({});
    const [selectedExercise, setSelectedExercise] = useState<string>('');
    const [exercisesList, setExercisesList] = useState<string[]>([]);
    const [oneRMData, setOneRMData] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!user?.id) return;
            try {
                // 1. Fetch History (Completed logs)
                const historyData = await workoutService.getWorkoutHistory(user.id);
                setHistory(historyData);

                // 2. Fetch Workout Definitions (Templates assigned)
                // We use this to know WHAT was inside those workouts (approximate)
                const workoutsData = await workoutService.getWorkoutsByStudent(user.id);
                setWorkouts(workoutsData);

                // 3. Process Data for Analytics
                processAnalytics(historyData, workoutsData);

            } catch (e) {
                console.error("Error loading analytics:", e);
                showToast("Erro ao carregar estatísticas", "error");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    const processAnalytics = (historyData: any[], workoutsData: Workout[]) => {
        const workoutMap = new Map(workoutsData.map(w => [w.id, w]));

        // Reconstruct "Performed Workouts" by merging history with definition
        // This is an approximation since we don't store snapshots yet
        const performedWorkouts: Workout[] = historyData.map(h => {
            const def = workoutMap.get(h.workoutId);
            if (!def) return null;
            return {
                ...def,
                createdAt: h.completedAt // Override date with completion date
            };
        }).filter(Boolean) as Workout[];

        // A. Frequency / Heatmap Process
        const freq = analyticsService.getMuscleFrequency(performedWorkouts);
        setMuscleFreq(freq);

        // B. Total Volume Calculation
        const volMap = analyticsService.getVolumeByMuscleGroup(performedWorkouts);
        const totalVol = Object.values(volMap).reduce((a, b) => a + b, 0);
        setTotalVolume(totalVol);

        // C. Evolution Data Preparation
        // Get all unique exercise names
        const allExercises = new Set<string>();
        workoutsData.forEach(w => w.exercises?.forEach(e => allExercises.add(e.name)));
        const exerciseArray = Array.from(allExercises).sort();
        setExercisesList(exerciseArray);

        if (exerciseArray.length > 0) {
            setSelectedExercise(exerciseArray[0]);
        }
    };

    // Effect to update chart when selected exercise changes
    useEffect(() => {
        if (!selectedExercise || workouts.length === 0) return;

        // Re-construct performed workouts for this calculation
        // (If strictly needed, we could memoize `performedWorkouts` above)
        const workoutMap = new Map(workouts.map(w => [w.id, w]));
        const performedWorkouts: Workout[] = history.map(h => {
            const def = workoutMap.get(h.workoutId);
            if (!def) return null;
            return { ...(def as Workout), createdAt: h.completedAt };
        }).filter(Boolean) as Workout[];

        // Generate Progression Data
        // Since templates are static, we might get a flat line.
        // For demonstration, let's keep it real (flat line) but add a "Simulated" message if needed
        const data = analyticsService.getOneRMProgression(performedWorkouts, selectedExercise);
        setOneRMData(data);

    }, [selectedExercise, history, workouts]);


    if (loading) {
        const loadingContent = (
            <div className="flex bg-background-light dark:bg-background-dark h-screen items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
        return embedded ? loadingContent : <DashboardLayout title="Estatísticas">{loadingContent}</DashboardLayout>;
    }

    const maxFrequency = Math.max(...(Object.values(muscleFreq) as number[]), 1);

    const content = (
        <>
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-surface-dark rounded-xl mb-6">
                {(['overview', 'heatmap', 'evolution'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab
                            ? 'bg-primary/20 text-primary shadow-lg'
                            : 'text-muted hover:text-main hover:bg-white/5'
                            }`}
                    >
                        {tab === 'overview' ? 'Resumo' : tab === 'heatmap' ? 'Mapa' : 'Evolução'}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary">fitness_center</span>
                                <span className="text-sm text-muted">Treinos Totais</span>
                            </div>
                            <p className="text-3xl font-black text-main">{history.length}</p>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-blue-400">weight</span>
                                <span className="text-sm text-muted">Volume Total</span>
                            </div>
                            <p className="text-3xl font-black text-main">{(totalVolume / 1000).toFixed(1)}k <span className="text-xs">kg</span></p>
                        </Card>
                    </div>

                    <Card>
                        <h3 className="font-bold mb-4">Músculos Mais Treinados (Top 3)</h3>
                        <div className="space-y-3">
                            {Object.entries(muscleFreq)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .slice(0, 3)
                                .map(([muscle, count], idx) => (
                                    <div key={muscle} className="flex items-center gap-3">
                                        <div className="font-black text-lg text-gray-600 w-4">#{idx + 1}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-bold text-main">{muscle}</span>
                                                <span className="text-primary">{count} treinos</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${((count as number) / maxFrequency) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                            {Object.keys(muscleFreq).length === 0 && (
                                <p className="text-muted text-center py-4">Nenhum dado registrado ainda.</p>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Heatmap Tab */}
            {activeTab === 'heatmap' && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    <MuscleHeatmap data={muscleFreq} gender={user?.gender} />
                    <p className="text-center text-muted text-sm mt-4 max-w-xs transition-colors">
                        Este mapa mostra a intensidade de treino por grupo muscular baseado no seu volume total histórico.
                        Áreas mais verdes indicam maior foco.
                    </p>
                </div>
            )}

            {/* Evolution Tab */}
            {activeTab === 'evolution' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    {/* Exercise Selector */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-muted">Selecione o Exercício</label>
                        <select
                            value={selectedExercise}
                            onChange={(e) => setSelectedExercise(e.target.value)}
                            className="bg-input-bg text-main border border-glass-border rounded-xl p-3 outline-none focus:border-primary transition-colors"
                        >
                            {exercisesList.map(ex => (
                                <option key={ex} value={ex}>{ex}</option>
                            ))}
                        </select>
                    </div>

                    {/* Chart */}
                    <OneRMChart data={oneRMData} exerciseName={selectedExercise} />

                    {oneRMData.length < 2 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 items-start transition-colors">
                            <span className="material-symbols-outlined text-yellow-500">info</span>
                            <p className="text-sm text-yellow-800 dark:text-yellow-200/80">
                                Poucos dados para exibir gráfico de tendência. Continue treinando para ver sua evolução!
                            </p>
                        </div>
                    )}
                </div>
            )}
        </>
    );

    if (embedded) return content;

    return (
        <DashboardLayout title="Estatísticas">
            {content}
        </DashboardLayout>
    );
};
