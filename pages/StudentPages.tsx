import React, { useState, useEffect } from 'react';
import { Browser } from '@capacitor/browser';
import { Card, Button } from '../components/UIComponents';
import { EnhancedStudentProgress } from '../components/Student/EnhancedStudentProgress';
import { PullToRefresh } from '../components/PullToRefresh';
import { useHaptics } from '../hooks/useHaptics';
// import { weightData, workoutsMock } from '../mockData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { EditProfileModal } from '../components/EditProfileModal';
import { UserRole } from '../types';
import { useToast } from '../ToastContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

import { DashboardLayout } from '../components/Layout';
import { BackButton } from '../components/BackButton';


import { StudentPaymentModal } from '../components/Financials/StudentPaymentModal';
import { studentService } from '../services/studentService';
import { scheduleService } from '../services/scheduleService';
import { workoutService } from '../services/workoutService';
import { connectionService } from '../services/connectionService';
import { gamificationService } from '../services/gamificationService';
import { LevelProgress, StreakCounter, AchievementList, XPCelebration, XPBreakdown } from '../components/Gamification/GamificationWidgets';
import { LevelUpModal } from '../components/Gamification/LevelUpModal';
import { GamificationProfile } from '../types';


import { RequestClassModal } from '../components/Schedule/RequestClassModal';

export const StudentDashboard = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hapticImpact, hapticSelectionChanged } = useHaptics();
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Helper to force re-fetch
  const [weightHistory, setWeightHistory] = React.useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = React.useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = React.useState({ count: 0, minutes: 0, calories: 0 });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [gamificationProfile, setGamificationProfile] = React.useState<GamificationProfile | null>(null);

  const loadData = async () => {
    if (user?.id) {
      // Load Weight History
      try {
        const history = await studentService.getWeightHistory(user.id);
        setWeightHistory(history);
      } catch (error) {
        console.error("Error loading weight history", error);
      }

      // Load Upcoming Sessions
      try {
        const sessions = await scheduleService.getStudentDashboardUpcoming(user.id);

        // Sanitize and format data
        const safeSessions = sessions.map((s: any) => {
          let dateObj = new Date();
          if (s.date?.toDate) {
            dateObj = s.date.toDate();
          } else if (s.date?.seconds) {
            dateObj = new Date(s.date.seconds * 1000);
          }

          return {
            ...s,
            id: s.id || Math.random().toString(),
            dateObj: dateObj,
            day: dateObj.getDate(),
            weekday: dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
            time: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            type: s.type || 'Treino',
            trainerName: s.trainerName || 'Personal'
          };
        });
        setUpcomingSessions(safeSessions);
      } catch (error) {
        console.error("Error loading sessions", error);
      }

      // Load Weekly Stats
      try {
        const stats = await workoutService.getWeeklyStats(user.id);
        setWeeklyStats(stats);
      } catch (error) {
        console.error("Error loading weekly stats", error);
      }

      // Load Gamification Profile
      try {
        const profile = await gamificationService.checkAndInitProfile(user.id);
        setGamificationProfile(profile);
      } catch (error) {
        console.error("Error loading gamification profile", error);
      }
    }
  };

  React.useEffect(() => {
    loadData();
  }, [user, refreshTrigger]);

  const handleRefresh = async () => {
    hapticImpact();
    await loadData();
    showToast('Dados atualizados', 'success');
  };

  // Calculate progress
  const weeklyTarget = (user as any)?.weeklyGoal || 5; // Default target 5 as requested
  const progressPercent = Math.min(100, Math.round((weeklyStats.count / weeklyTarget) * 100));
  const studentGoal = (user as any)?.goal || 'Geral';

  return (
    <DashboardLayout title={user?.name ? `Olá, ${user.name}!` : 'Olá!'}>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-8">

          {/* Hero Ring / Focus */}
          <div className="glass-card flex items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none"></div>

            <div className="relative size-24 shrink-0">
              {/* Simplified Progress Ring */}
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="text-primary" strokeDasharray={`${progressPercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xl font-bold">{progressPercent}%</span>
              </div>
            </div>

            <div className="flex-1 z-10">
              <h2 className="text-xl font-bold mb-1">Foco de Hoje: {studentGoal}</h2>
              <p className="text-gray-400 text-sm mb-3">
                Você completou {weeklyStats.count} de {weeklyTarget} treinos esta semana. {weeklyStats.count === 0 ? 'Vamos começar a semana com tudo?' : weeklyStats.count >= weeklyTarget ? 'Meta batida! Parabéns!' : 'Continue assim!'}
              </p>
              <button className="text-sm font-bold text-primary hover:underline" onClick={() => { hapticImpact(); navigate('/student/workouts'); }}>Ver Treinos</button>
            </div>
          </div>

          {/* Gamification Bar */}
          {gamificationProfile && (
            <div className="glass-card p-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <LevelProgress
                  level={gamificationProfile.level}
                  currentXp={gamificationProfile.currentXp}
                  nextLevelXp={gamificationProfile.nextLevelXp}
                />
              </div>
              <StreakCounter streak={gamificationProfile.currentStreak} />
            </div>
          )}

          {/* Quick Actions Grid */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">bolt</span> Ações Rápidas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="glass p-3 md:p-4 rounded-xl flex flex-col items-center gap-3 hover:bg-white/5 transition-all group" onClick={() => { hapticImpact(); navigate('/student/workouts'); }}>
                <div className="size-10 md:size-12 rounded-full bg-primary/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">play_arrow</span>
                </div>
                <span className="font-medium">Iniciar Treino</span>
              </button>
              <button className="glass p-3 md:p-4 rounded-xl flex flex-col items-center gap-3 hover:bg-white/5 transition-all group" onClick={() => { hapticImpact(); navigate('/student/progress'); }}>
                <div className="size-10 md:size-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">bar_chart</span>
                </div>
                <span className="font-medium">Progresso</span>
              </button>
              <button className="glass p-3 md:p-4 rounded-xl flex flex-col items-center gap-3 hover:bg-white/5 transition-all group" onClick={() => { hapticImpact(); navigate('/student/schedule'); }}>
                <div className="size-10 md:size-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">calendar_add_on</span>
                </div>
                <span className="font-medium">Agenda</span>
              </button>
              <button className="glass p-3 md:p-4 rounded-xl flex flex-col items-center gap-3 hover:bg-white/5 transition-all group" onClick={() => { hapticImpact(); setIsPaymentModalOpen(true); }}>
                <div className="size-10 md:size-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <span className="font-medium">Pagamentos</span>
              </button>
            </div>
          </div>

          <StudentPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} />

          {/* Stats Row - Enhanced */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-primary/20 rounded-xl text-primary shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-2xl">fitness_center</span>
                </div>
                <span className="text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full font-medium">Semana</span>
              </div>
              <p className="text-sm text-gray-400">Treinos Feitos</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-4xl font-bold text-white">{weeklyStats.count}</p>
                <span className="text-sm text-gray-500">/ {weeklyTarget}</span>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 shadow-lg shadow-blue-500/20">
                  <span className="material-symbols-outlined text-2xl">timer</span>
                </div>
                <span className="text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full font-medium">Média</span>
              </div>
              <p className="text-sm text-gray-400">Minutos / Treino</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-4xl font-bold text-white">{weeklyStats.count > 0 ? Math.round(weeklyStats.minutes / weeklyStats.count) : 0}</p>
                <span className="text-sm text-gray-500">min</span>
              </div>
            </Card>
          </div>

          {/* Weight Chart - Compact */}
          <Card className="h-40 flex flex-col relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
            <div className="flex justify-between items-center mb-2 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                  <span className="material-symbols-outlined text-lg">monitoring</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Evolução do Peso</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-xl font-bold text-white">{weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : '-'} kg</h2>
                    <span className="text-primary text-xs font-bold flex items-center"><span className="material-symbols-outlined text-xs">trending_up</span></span>
                  </div>
                </div>
              </div>
              <button className="text-primary text-xs hover:underline" onClick={() => navigate('/student/progress')}>Ver Completo</button>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-20 w-full opacity-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightHistory}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="weight" stroke="#00ff88" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Upcoming */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Próximas Sessões</h3>
              <button className="text-primary text-sm hover:underline" onClick={() => navigate('/student/schedule')}>Ver Todas</button>
            </div>
            <div className="space-y-3">
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session: any) => (
                  <div key={session.id} className="glass-card flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex flex-col items-center bg-surface-dark border border-white/10 p-3 rounded-lg min-w-[4rem]">
                      <span className="text-xs font-bold text-primary uppercase">
                        {session.weekday}
                      </span>
                      <span className="text-2xl font-bold">
                        {session.day}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{session.type}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {session.time}
                        <span>•</span>
                        <span className="material-symbols-outlined text-sm">person</span> {session.trainerName}
                      </div>
                    </div>
                    <button className="glass-button rounded-full !p-3">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="glass-card p-6 text-center text-gray-500">
                  <p>Nenhuma sessão agendada.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PullToRefresh>
    </DashboardLayout >
  );
};

import { ExercisesContent } from '../components/Exercises/ExercisesContent';
import { WorkoutDetailsModal } from '../components/Student/WorkoutDetailsModal';

export const StudentWorkouts = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth(); // Add user hook
  const { hapticSelectionChanged, hapticImpact } = useHaptics();
  const [workouts, setWorkouts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'workouts' | 'catalog'>('workouts');
  const [selectedWorkout, setSelectedWorkout] = React.useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);

  React.useEffect(() => {
    const loadWorkouts = async () => {
      if (user?.id) {
        try {
          // 1. Fetch Workouts
          const workoutsData = await workoutService.getWorkoutsByStudent(user.id);

          // 2. Fetch Catalog (with trainerId for custom videos)
          // We need the trainerId to check for custom videos. 
          const studentTrainerId = (user as any)?.trainerId;
          const catalog = await workoutService.getExerciseCatalog(studentTrainerId);
          const catalogMap = new Map(catalog.map(ex => [ex.id, ex]));

          // Helper for robust matching: lowercase, remove accents, collapse whitespace
          const normalize = (s: string) => s ? s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ').trim() : "";

          // 3. Hydrate Workouts
          const hydratedWorkouts = workoutsData.map(wk => {
            const freshExercises = wk.exercises?.map((ex: any) => {
              // Try match by ID first, then name (normalized)
              const catalogEx = catalogMap.get(ex.id) || catalog.find(c => normalize(c.name) === normalize(ex.name));

              if (catalogEx) {
                return {
                  ...ex,
                  imageUrl: catalogEx.imageUrl, // Fresh Image from catalog always
                  videoUrl: ex.videoUrl || catalogEx.videoUrl, // Prefer Workout-Specific Video, then Catalog
                  // Keep other runtime values like sets/reps unless you want catalog defaults (usually runtime is preserved)
                  // Instructions/Tips might update too
                  instructions: catalogEx.instructions,
                  tips: catalogEx.tips
                };
              }
              return ex;
            });
            return { ...wk, exercises: freshExercises };
          });

          console.log("DEBUG: StudentWorkouts Hydration", {
            studentId: user.id,
            trainerId: studentTrainerId,
            catalogSize: catalog.length,
            sampleExercise: hydratedWorkouts[0]?.exercises?.[0],
            sampleImageUrl: hydratedWorkouts[0]?.exercises?.[0]?.imageUrl,
            sampleVideoUrl: hydratedWorkouts[0]?.exercises?.[0]?.videoUrl,
            catalogSample: catalog[0]
          });

          setWorkouts(hydratedWorkouts);
        } catch (e) {
          console.error(e);
          showToast('Erro ao carregar treinos', 'error');
        } finally {
          setLoading(false);
        }
      }
    };
    if (activeTab === 'workouts') {
      loadWorkouts();
    }
  }, [user, activeTab]);

  // Helper to calculate total duration
  const calculateDuration = (exercises: any[]) => {
    if (!exercises || exercises.length === 0) return 0;

    let totalMinutes = 0;

    exercises.forEach(ex => {
      // If Cardio and has reps akin to "10 min"
      if (ex.muscleGroup === 'Cardio' || ex.type === 'Cardio') {
        const match = ex.reps?.toString().match(/(\d+)/);
        if (match) {
          totalMinutes += parseInt(match[0]);
        } else {
          totalMinutes += 10; // Default estimate
        }
      } else {
        // Strength estimation: (Sets * Reps * 3s + Rest) or simplified (Sets * 2 min)
        // Let's assume average set takes 1 min + 1 min rest = 2 min per set
        const sets = parseInt(ex.sets as string) || 3;
        totalMinutes += sets * 2; // Conservative estimate
      }
    });

    return totalMinutes;
  };

  // Helper to calculate average intensity level
  const calculateLevel = (exercises: any[]) => {
    if (!exercises || exercises.length === 0) return 'Iniciante';

    let score = 0;
    exercises.forEach(ex => {
      if (ex.level === 'Avançado') score += 3;
      else if (ex.level === 'Intermediário') score += 2;
      else score += 1;
    });

    const avg = score / exercises.length;
    if (avg >= 2.5) return 'Avançado';
    if (avg >= 1.5) return 'Intermediário';
    return 'Iniciante';
  };

  const handleStartWorkout = (id: string, title: string) => {
    navigate(`/student/workout/${id}`);
    showToast(`Iniciando ${title}...`, 'success');
  };

  const handleOpenDetails = (workout: any) => {
    setSelectedWorkout(workout);
    setIsDetailsModalOpen(true);
  };

  return (
    <DashboardLayout title="Treinos">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-glass-border overflow-x-auto mb-6 scrollbar-hide">
        {[
          { id: 'workouts', label: 'Meus Treinos' },
          { id: 'catalog', label: <span>Catálogo <span className="hidden md:inline">de Exercícios</span></span> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { hapticSelectionChanged(); setActiveTab(tab.id as any); }}
            className={`pb-3 px-4 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === tab.id ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
          </button>
        ))}
      </div>

      {activeTab === 'catalog' ? (
        <ExercisesContent embedded />
      ) : (
        loading ? <div className="p-8 text-center text-gray-500">Carregando treinos...</div> :
          <div className="space-y-4">
            {workouts.map(workout => (
              <div key={workout.id} className="glass-card flex flex-col gap-4 group hover:border-primary/50 transition-colors">
                <div className="flex gap-4">
                  <div className="size-14 bg-surface-dark rounded-2xl border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="material-symbols-outlined text-2xl">fitness_center</span>
                  </div>
                  <div className="flex-1 py-1">
                    <h3 className="font-bold text-lg leading-tight">{workout.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md">
                        <span className="material-symbols-outlined text-sm">signal_cellular_alt</span>
                        {calculateLevel(workout.exercises)}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md">
                        <span className="material-symbols-outlined text-sm">timer</span>
                        {calculateDuration(workout.exercises)} min
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    className="flex-1 h-12 text-base shadow-none border-t border-white/5 rounded-t-none bg-white/5 hover:bg-white/10 text-white"
                    onClick={() => handleOpenDetails(workout)}
                  >
                    <span className="material-symbols-outlined mr-2">visibility</span>
                    Ver Detalhes
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 h-12 text-base shadow-none border-t border-white/5 rounded-t-none hover:scale-[1.02] transition-all"
                    onClick={() => { hapticImpact(); handleStartWorkout(workout.id, workout.title); }}
                  >
                    Começar
                  </Button>
                </div>
              </div>
            ))}

            <WorkoutDetailsModal
              isOpen={isDetailsModalOpen}
              onClose={() => setIsDetailsModalOpen(false)}
              workout={selectedWorkout}
              onStart={(wk) => {
                setIsDetailsModalOpen(false);
                handleStartWorkout(wk.id, wk.title);
              }}
            />
            {workouts.length === 0 && (
              <div className="text-center py-10 text-gray-500">Nenhum treino disponível.</div>
            )}
          </div>
      )
      }
    </DashboardLayout >
  )
}

import { useParams } from 'react-router-dom';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';



export const WorkoutSession = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { speak, cancel, supported: audioSupported } = useSpeechSynthesis();
  const [isAudioEnabled, setIsAudioEnabled] = React.useState(true); // Default ON
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isFinished, setIsFinished] = React.useState(false);
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [isTimerRunning, setIsTimerRunning] = React.useState(true);
  const [workout, setWorkout] = React.useState<any>(null);
  const [exercises, setExercises] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [xpData, setXpData] = React.useState<any>(null);
  const [showLevelUpModal, setShowLevelUpModal] = React.useState(false);

  const [showXpCelebration, setShowXpCelebration] = React.useState(false);


  // Audio Effect
  React.useEffect(() => {
    if (loading || !workout || exercises.length === 0 || isFinished) return;

    if (isAudioEnabled && audioSupported) {
      const currentEx = exercises[currentStep];
      if (currentEx) {
        // Construct natural phrase
        const isCardio = currentEx.muscleGroup === 'Cardio' || currentEx.type === 'Cardio';
        const quantity = isCardio ? currentEx.reps : `${currentEx.sets} séries de ${currentEx.reps}`;

        let text = `Exercício ${currentStep + 1}: ${currentEx.name}. ${quantity}.`;

        // Add weight if applicable
        if (currentEx.weight && !isCardio && currentEx.weight !== 'Peso do Corpo') {
          text += ` Carga: ${currentEx.weight}.`;
        }

        // Add superset context
        if (currentEx.groupId) {
          const nextEx = exercises[currentStep + 1];
          if (nextEx && nextEx.groupId === currentEx.groupId) {
            text += ` Superset com ${nextEx.name}.`;
          }
        }

        // Delay slightly to allow transition
        const timer = setTimeout(() => {
          speak(text);
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [currentStep, isAudioEnabled, audioSupported, exercises, loading, isFinished]);

  // Finish Audio
  React.useEffect(() => {
    if (isFinished && isAudioEnabled && audioSupported) {
      speak("Parabéns! Você concluiu o treino. Bom trabalho!");
    }
  }, [isFinished]);


  React.useEffect(() => {
    const loadSession = async () => {
      if (!id) return;
      try {
        // We need the trainerId to get custom videos. 
        // Best source is the user profile itself if linked.
        const trainerId = (user as any)?.trainerId;

        // Pass trainerId to getWorkoutById to hydrate exercises correctly with overrides
        const wk = await workoutService.getWorkoutById(id, trainerId);

        // Fetch current catalog also with trainer overrides for consistency
        const catalog = await workoutService.getExerciseCatalog(trainerId);
        const catalogMap = new Map(catalog.map(ex => [ex.id, ex])); // Use ID for better matching, fallback to name if needed

        if (wk) {
          setWorkout(wk);

          if (wk.exercises && wk.exercises.length > 0) {
            const normalize = (s: string) => s ? s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ').trim() : "";

            // Merge with catalog to refresh imageUrl and VALIDATE videoUrl
            const refreshedExercises = wk.exercises?.map((ex: any) => {
              // Try match by ID first, then name
              const catalogEx = catalogMap.get(ex.id) || catalog.find(c => normalize(c.name) === normalize(ex.name));

              if (catalogEx) {
                return {
                  ...ex,
                  imageUrl: catalogEx.imageUrl,
                  videoUrl: ex.videoUrl || catalogEx.videoUrl, // Prefer Workout-Specific Video, then Catalog
                  instructions: catalogEx.instructions,
                  tips: catalogEx.tips,
                  muscleGroup: catalogEx.muscleGroup,
                  type: catalogEx.type,
                  level: catalogEx.level,
                };
              }
              return ex;
            });
            setExercises(refreshedExercises);
          } else {
            // Fallback
            setExercises(catalog.slice(0, 4).map(ex => ({ ...ex, sets: 3, reps: 12, weight: '10kg' })));
          }

          console.log("DEBUG: Session Hydration", {
            trainerId: trainerId,
            exercisesCount: wk.exercises?.length,
            sampleVideo: wk.exercises?.[0]?.videoUrl
          });
        }
      } catch (e) {
        console.error(e);
        showToast('Erro ao carregar sessão', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, [id, user]);

  React.useEffect(() => {
    let interval: any;
    if (isTimerRunning && !isFinished) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isFinished]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    setIsFinished(true);
    setIsTimerRunning(false);

    if (user?.id && workout) {
      try {
        await workoutService.logWorkoutCompletion(user.id, workout.id, elapsedTime, workout.title);

        // Gamification Award
        const minutes = Math.ceil(elapsedTime / 60); // Use ceil to be generous
        const result = await gamificationService.processWorkoutCompletion({
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          trainerId: (user as any).trainerId // Assuming trainerId exists on user
        }, minutes);
        setXpData(result);

        // Trigger XP celebration animation
        setShowXpCelebration(true);

        // Show level up modal if leveled up
        if (result.levelUp) {
          setTimeout(() => {
            setShowLevelUpModal(true);
          }, 1500); // Delay to let XP celebration finish
        }

      } catch (e) {
        console.error("Error logging workout", e);
        showToast('Treino finalizado, mas houve erro ao salvar histórico.', 'warning');
      }
    }
  };

  const handleNext = () => {
    if (currentStep < exercises.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (isFinished) {
    const minutes = Math.ceil(elapsedTime / 60);
    const baseXp = 10;
    const bonusXp = minutes * 2;

    return (
      <DashboardLayout title="Resumo do Treino">
        {/* XP Celebration Overlay */}
        {xpData && (
          <XPCelebration
            xpGained={xpData.xpGained}
            show={showXpCelebration}
            onComplete={() => setShowXpCelebration(false)}
          />
        )}

        {/* Level Up Modal */}
        {xpData?.levelUp && (
          <LevelUpModal
            isOpen={showLevelUpModal}
            onClose={() => setShowLevelUpModal(false)}
            newLevel={xpData.newLevel}
          />
        )}

        <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
          {/* Trophy with Animated Ring */}
          <div className="relative">
            <div className="size-32 rounded-full bg-gradient-to-br from-primary/30 to-green-400/20 flex items-center justify-center text-primary shadow-[0_0_60px_rgba(0,255,136,0.4)] animate-level-pulse">
              <span className="material-symbols-outlined text-6xl">emoji_events</span>
            </div>
            {/* Rotating ring */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" style={{ animationDuration: '3s' }} />
          </div>

          {/* Completion Message */}
          <div>
            <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Treino Concluído!
            </h2>
            <p className="text-gray-400">Você detonou hoje. Continue assim! 🔥</p>
          </div>

          {/* XP Section */}
          {xpData && (
            <div className="space-y-4 w-full max-w-sm">
              {/* XP Earned Display */}
              <div className="py-4">
                <div className="text-5xl font-black text-primary animate-counter-pulse drop-shadow-[0_0_20px_rgba(0,255,136,0.5)]">
                  +{xpData.xpGained} XP
                </div>
                {xpData.levelUp && (
                  <div className="mt-2 inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full font-bold animate-bounce">
                    <span className="material-symbols-outlined">arrow_upward</span>
                    Nível {xpData.newLevel} Alcançado!
                  </div>
                )}
                {xpData.newBadges && (
                  <div className="mt-2 inline-flex items-center gap-2 bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full font-bold animate-badge-pop">
                    <span className="material-symbols-outlined">workspace_premium</span>
                    Nova Conquista!
                  </div>
                )}
              </div>

              {/* XP Breakdown */}
              <XPBreakdown baseXp={baseXp} bonusXp={bonusXp} totalXp={xpData.xpGained} />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <Card className="flex flex-col items-center bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
              <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-2">
                <span className="material-symbols-outlined">timer</span>
              </div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">Tempo Total</span>
              <span className="text-2xl font-bold mt-1 text-white">{formatTime(elapsedTime)}</span>
            </Card>
            <Card className="flex flex-col items-center bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
              <div className="size-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
                <span className="material-symbols-outlined">fitness_center</span>
              </div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">Exercícios</span>
              <span className="text-2xl font-bold mt-1 text-white">{exercises.length}</span>
            </Card>
          </div>

          {/* Continue Button */}
          <Button
            className="w-full max-w-sm mt-4 h-14 text-lg font-bold shadow-[0_10px_40px_rgba(0,255,136,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={() => navigate('/student/dashboard')}
          >
            <span className="material-symbols-outlined mr-2">home</span>
            Voltar ao Início
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const currentExercise = exercises[currentStep];
  if (!currentExercise) return <div className="p-8 text-center text-gray-500">Nenhum exercício encontrado.</div>;

  const progress = ((currentStep) / exercises.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-white flex flex-col pb-24 relative overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div className="px-4 pb-4 pt-[calc(env(safe-area-inset-top)+2rem)] flex items-center justify-between relative z-10 glass border-b border-gray-200 dark:border-white/5">
        <BackButton onClick={() => navigate(-1)} icon="close" />
        <div className="font-mono text-xl font-bold text-primary tracking-widest">{formatTime(elapsedTime)}</div>
        <div className="flex gap-2">
          {audioSupported && (
            <button
              className={`p-2 rounded-full transition-colors ${isAudioEnabled ? 'text-primary bg-primary/10' : 'text-gray-400 hover:bg-white/10'}`}
              onClick={() => {
                if (isAudioEnabled) cancel();
                setIsAudioEnabled(!isAudioEnabled);
              }}
            >
              <span className="material-symbols-outlined">{isAudioEnabled ? 'volume_up' : 'volume_off'}</span>
            </button>
          )}

          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10" onClick={() => setIsTimerRunning(!isTimerRunning)}>
            <span className="material-symbols-outlined">{isTimerRunning ? 'pause' : 'play_arrow'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-white/10 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-green-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,255,136,0.5)]"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center relative z-10 space-y-8">
        <div>
          {/* Superset Badge */}
          {currentExercise.groupId && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/30">
                <span className="material-symbols-outlined text-sm">link</span>
                SUPERSET
              </span>
              {/* Show count of exercises in this group */}
              <span className="text-xs text-gray-500">
                ({exercises?.filter((e: any) => e.groupId === currentExercise.groupId).length || 0} exercícios)
              </span>
            </div>
          )}
          <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 opacity-80">Exercício {currentStep + 1} de {exercises?.length || 0}</p>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{currentExercise.name}</h2>

          {/* Next in Superset Preview */}
          {currentExercise.groupId && exercises[currentStep + 1]?.groupId === currentExercise.groupId && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-400">
              <span className="material-symbols-outlined text-base">arrow_right_alt</span>
              Próximo no superset: <span className="text-primary font-medium">{exercises[currentStep + 1]?.name}</span>
            </div>
          )}
        </div>

        {/* Media Section: Image AND Video Card if available */}
        <div className="w-full max-w-sm space-y-4">

          {/* Main Visual: Image (Priority) or Fallback */}
          {currentExercise.imageUrl ? (
            <div className="w-full aspect-square relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-white/5 group">
              <img
                src={currentExercise.imageUrl}
                alt={currentExercise.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white text-left">
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-black mb-1 drop-shadow-sm">Visualização</p>
                <p className="text-base font-medium opacity-90 leading-tight">Mantenha a postura correta</p>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-square rounded-3xl border-4 border-gray-200 dark:border-white/5 flex items-center justify-center bg-white dark:bg-surface-dark shadow-2xl relative">
              <div className="flex flex-col items-center">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">{currentExercise.reps?.replace ? currentExercise.reps.replace(' min', '') : currentExercise.reps}</span>
                <span className="text-sm text-gray-500 uppercase tracking-wide">
                  {(currentExercise.muscleGroup === 'Cardio' || currentExercise.type === 'Cardio') ? 'Minutos' : 'Repetições'}
                </span>
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin-slow" style={{ animationDuration: '3s' }}></div>
            </div>
          )}

          {/* Optional Video Card */}
          {currentExercise.videoUrl && (
            <div className="glass-card p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-center gap-4 cursor-pointer hover:bg-primary/10 transition-colors group" onClick={() => Browser.open({ url: currentExercise.videoUrl })}>
              <div className="size-12 rounded-full bg-primary text-black flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-2xl">play_arrow</span>
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-bold text-white leading-tight">Vídeo de Execução</h4>
                <p className="text-xs text-gray-400 mt-0.5">Ver orientação do personal</p>
              </div>
              <span className="material-symbols-outlined text-gray-500 group-hover:translate-x-1 transition-transform">open_in_new</span>
            </div>
          )}

          {/* Embedded Video Player (Optional - if user wants to see it directly here, but card was requested. Keeping generic player hidden or as secondary option? User asked for a CARD. A clickable card opening the video is cleaner, or an embedded player in a card.) */}
          {/* Let's stick to the card that opens it or plays it. Actually, the previous implementation replaced the image with the video. 
              The user said "create a card to display the video". 
              Better yet: Embedded video card below image.
          */}

        </div>

        {/* Conditional Stats Grid */}
        {(currentExercise.muscleGroup === 'Cardio' || currentExercise.type === 'Cardio') ? (
          <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
            <div className="flex flex-col items-center p-5 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
              <span className="text-3xl font-black text-gray-900 dark:text-white">{currentExercise.reps}</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-60">Tempo / Duração</span>
            </div>
          </div>
        ) : (
          <div className={`grid ${(['Mobilidade', 'Alongamento'].includes(currentExercise.muscleGroup) || ['Mobilidade', 'Alongamento'].includes(currentExercise.type)) ? 'grid-cols-2' : 'grid-cols-3'} gap-3 w-full max-w-sm`}>
            <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm h-28">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{currentExercise.reps}</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-60">Reps</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm h-28">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{currentExercise.sets}</span>
              <span className="text--[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-60">Séries</span>
            </div>
            {/* Hide Weight for Mobility/Stretching */}
            {!['Mobilidade', 'Alongamento'].includes(currentExercise.muscleGroup) && !['Mobilidade', 'Alongamento'].includes(currentExercise.type) && (
              <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group h-28">
                <div className="absolute top-0 right-0 p-1">
                  <div className="size-1.5 rounded-full bg-primary/40 animate-pulse"></div>
                </div>
                <div className="flex-1 flex items-center justify-center w-full px-1">
                  <span className="font-bold text-gray-900 dark:text-white text-center leading-tight break-words line-clamp-3 text-[10px] md:text-xs" title={currentExercise.weight}>
                    {currentExercise.weight ? (currentExercise.weight.toString().includes('kg') || currentExercise.weight.toString().length > 5 ? currentExercise.weight : `${currentExercise.weight}kg`) : '-'}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 opacity-60">Carga</span>
              </div>
            )}
          </div>
        )}

        {/* Exercise Details */}
        <div className="w-full max-w-sm space-y-4 text-left">
          {(currentExercise.instructions && currentExercise.instructions.length > 0) && (
            <div className="glass shadow-sm p-6 rounded-3xl border border-gray-200 dark:border-white/5 bg-white/40 dark:bg-white/[0.02]">
              <h4 className="text-primary font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-3">
                <div className="size-6 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">event_note</span>
                </div>
                Instruções
              </h4>
              <ul className="space-y-3">
                {currentExercise.instructions.map((inst: string, idx: number) => (
                  <li key={idx} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="size-1.5 rounded-full bg-primary mt-2 shrink-0"></span>
                    <span className="leading-relaxed">{inst}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(currentExercise.tips && currentExercise.tips.length > 0) && (
            <div className="glass shadow-sm p-6 rounded-3xl border border-gray-200 dark:border-white/5 bg-white/40 dark:bg-white/[0.02]">
              <h4 className="text-amber-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-3">
                <div className="size-6 bg-amber-400/20 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                </div>
                Dicas de Execução
              </h4>
              <ul className="space-y-3">
                {currentExercise.tips.map((tip: string, idx: number) => (
                  <li key={idx} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="size-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentExercise.description && (
            <p className="text-xs text-center text-gray-500 italic mt-4">{currentExercise.description}</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent flex gap-4">
        {currentStep > 0 && (
          <Button
            variant="ghost"
            className="flex-1 h-16 text-lg font-black uppercase tracking-widest border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            onClick={handleBack}
          >
            <span className="material-symbols-outlined mr-2 scale-125">chevron_left</span>
            Anterior
          </Button>
        )}
        <Button
          className="flex-[2] h-16 text-lg font-black uppercase tracking-widest shadow-[0_20px_40px_rgba(0,255,136,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all font-black"
          onClick={handleNext}
        >
          {currentStep < exercises.length - 1 ? 'Próximo' : 'Finalizar Treino'}
          <span className="material-symbols-outlined ml-2 scale-125">chevron_right</span>
        </Button>
      </div>
      {/* AI Coach Overlay */}


    </div>
  );
};



// import { currentStudentProfileMock } from '../mockData';

export const StudentProfile = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  // Cast user to any to access student specific fields
  const student = user as any;

  if (!student) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
    showToast('Você saiu da conta.', 'info');
  };

  // Calculate BMI
  const bmi = (student.weight && student.height)
    ? (student.weight / (student.height * student.height)).toFixed(1)
    : 'N/A';

  const [weeklyStats, setWeeklyStats] = useState({ count: 0, minutes: 0, calories: 0 });

  useEffect(() => {
    const loadStats = async () => {
      if (student?.id) {
        try {
          const stats = await workoutService.getWeeklyStats(student.id);
          setWeeklyStats(stats);
        } catch (error) {
          console.error("Error loading stats", error);
        }
      }
    };
    loadStats();
  }, [student?.id]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFields, setEditFields] = useState<any[]>([]);
  const [editTitle, setEditTitle] = useState('');

  const openEditModal = (fields: any[], title: string) => {
    setEditFields(fields);
    setEditTitle(title);
    setIsEditModalOpen(true);
  };

  // Import EditProfileModal dynamically or use direct import if added to top
  // To avoid circular or weird import issues with lazy loading in same file, assuming top level import works
  // But wait, I need to add the import first. 
  // For now I will inline the import or just rely on correct top level import insertion in next step.
  // Actually, let's assume I will add `import { EditProfileModal } from '../components/EditProfileModal';` at the top.

  return (
    <DashboardLayout title="Meu Perfil" showBack>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 py-8">
          <div className="relative">
            <img src={student.avatarUrl} alt="Profile" className="size-32 rounded-full border-4 border-primary shadow-[0_0_30px_rgba(0,255,136,0.3)] object-cover" />
            <button
              className="absolute bottom-0 right-0 p-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-full text-primary hover:bg-gray-100 dark:hover:bg-white/10"
              onClick={() => openEditModal([
                { key: 'name', label: 'Nome Completo', type: 'text', placeholder: 'Seu nome' },
                { key: 'avatarUrl', label: 'Foto de Perfil', type: 'file' },
                { key: 'gender', label: 'Gênero', type: 'select', options: ['Mulher', 'Homem', 'Não binário / Outro', 'Prefiro não informar'] },
                { key: 'email', label: 'E-mail', type: 'text', placeholder: 'O e-mail não pode ser alterado aqui' }, // Optionally disabled logic in modal later
              ], 'Editar Perfil Principal')}
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
          </div>

          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{student.name}</h2>
            <p className="text-gray-500 dark:text-gray-400">{student.email}</p>
            <span className="inline-block mt-2 bg-primary/20 text-primary px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">Aluno</span>
            {student.gender && (
              <span className="inline-block mt-2 ml-2 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 px-4 py-1 rounded-full text-sm text-transform capitalize">
                {student.gender}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Biometrics */}
          <Card className="h-full flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-white/5 pb-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><span className="material-symbols-outlined text-primary">accessibility_new</span> Biometria</h3>
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => openEditModal([
                  { key: 'weight', label: 'Peso (kg)', type: 'number', placeholder: 'Ex: 75.5' },
                  { key: 'height', label: 'Altura (m)', type: 'number', placeholder: 'Ex: 1.75' },
                  { key: 'age', label: 'Idade', type: 'number', placeholder: 'Ex: 28' },
                ], 'Editar Biometria')}
              >
                Editar
              </button>
            </div>

            {/* Content wrapper with flex-grow for proportional distribution */}
            <div className="flex flex-col gap-4 flex-grow">
              {/* Weight/Height/Age Grid */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 flex flex-col justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-xs uppercase">Peso</p>
                  <p className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{student.weight} <span className="text-xs text-gray-500">kg</span></p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 flex flex-col justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-xs uppercase">Altura</p>
                  <p className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{student.height} <span className="text-xs text-gray-500">m</span></p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 flex flex-col justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-xs uppercase">Idade</p>
                  <p className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{student.age} <span className="text-xs text-gray-500">anos</span></p>
                </div>
              </div>

              {/* BMI Section */}
              <div className="p-4 bg-gray-100 dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 flex-grow flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase">IMC Calculado</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{bmi}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-bold ${Number(bmi) < 25 ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                    {Number(bmi) < 18.5 ? 'Abaixo' : Number(bmi) < 25 ? 'Normal' : Number(bmi) < 30 ? 'Sobrepeso' : 'Obesidade'}
                  </div>
                </div>

                {/* Visual Bar */}
                <div className="relative h-2 bg-gray-700/30 rounded-full overflow-hidden mt-3">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-500 opacity-80" />
                  {/* Indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    style={{ left: `${Math.min(100, Math.max(0, ((Number(bmi) - 15) / (35 - 15)) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                  <span>15</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>35+</span>
                </div>
              </div>

              {/* BMR Section (Basal Metabolic Rate) */}
              <div className="p-4 bg-gray-100 dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 flex-grow flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                    Taxa Metabólica Basal
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                    {(() => {
                      // Mifflin-St Jeor Equation
                      // Men: 10W + 6.25H - 5A + 5
                      // Women: 10W + 6.25H - 5A - 161
                      const w = student.weight || 0;
                      const h = (student.height || 0) * 100; // cm
                      const a = student.age || 0;
                      let base = (10 * w) + (6.25 * h) - (5 * a);

                      if (student.gender === 'Homem') base += 5;
                      else base -= 161; // Default to female/other base for safety or use average

                      return Math.round(base);
                    })()} <span className="text-sm font-normal text-gray-500">kcal/dia</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Goals & Health */}
          <Card className="h-full flex flex-col">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><span className="material-symbols-outlined text-primary">flag</span> Objetivos</h3>
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => openEditModal([
                  { key: 'goal', label: 'Objetivo Principal', type: 'text', placeholder: 'Ex: Hipertrofia' },
                  { key: 'weeklyGoal', label: 'Meta Semanal de Treinos', placeholder: 'Ex: 5', type: 'number' },
                  { key: 'injuries', label: 'Histórico de Lesões', type: 'textarea', placeholder: 'Descreva lesões anteriores...' },
                ], 'Editar Objetivos')}
              >
                Editar
              </button>
            </div>

            <div className="flex flex-col gap-4 h-full">
              {/* Main Goal - Full Width */}
              <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 flex flex-col justify-center min-h-[100px]">
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">Objetivo Principal</p>
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-xl">
                  <span className="material-symbols-outlined text-primary">target</span>
                  {student.goal}
                </div>
              </div>

              {/* Weekly Goal - Full Width with Progress */}
              <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 flex flex-col justify-center min-h-[120px]">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">Meta Semanal</p>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-lg">
                      <span className="material-symbols-outlined text-primary">calendar_today</span>
                      {(student as any).weeklyGoal || 5} treinos
                    </div>
                  </div>
                  <span className="text-sm text-gray-400 bg-gray-200 dark:bg-white/10 px-2 py-1 rounded-md">
                    {weeklyStats.count} / {(student as any).weeklyGoal || 5}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${weeklyStats.count >= ((student as any).weeklyGoal || 5) ? 'bg-primary' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, (weeklyStats.count / ((student as any).weeklyGoal || 5)) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-right">
                  {weeklyStats.count >= ((student as any).weeklyGoal || 5) ? 'Meta atingida! 🚀' : 'Continue treinando!'}
                </p>
              </div>

              {/* Injuries Section - Full Width */}
              <div className="p-4 bg-red-500/5 dark:bg-red-500/10 rounded-xl border border-red-500/10 dark:border-red-500/20 flex-grow flex flex-col justify-center min-h-[100px]">
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-red-400">medical_services</span>
                  Histórico de Lesões
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {student.injuries || 'Nenhuma lesão registrada.'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-3 pt-4">
          <Button variant="secondary" className="w-full justify-between h-14" onClick={() => navigate('/settings')}>
            <span className="flex items-center gap-3"><span className="material-symbols-outlined">settings</span> Configurações da Conta</span>
            <span className="material-symbols-outlined text-gray-500">chevron_right</span>
          </Button>
          <Button variant="danger" className="w-full h-14" onClick={handleLogout}>Sair da Conta</Button>
        </div>
      </div>
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        fields={editFields}
        title={editTitle}
      />
    </DashboardLayout>
  )
}

// Basic Reschedule Modal Component (Internal)
const RescheduleModalInternal = ({ isOpen, onClose, onSubmit, currentDate }: any) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    onSubmit(new Date(`${date}T${time}`));
    onClose();
    setDate('');
    setTime('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Solicitar Troca</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-gray-400">O horário atual é: <span className="text-white font-bold">{currentDate?.toLocaleString()}</span></p>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Nova Data</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Novo Horário</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary" />
          </div>
          <Button type="submit" className="w-full h-12">Enviar Solicitação</Button>
        </form>
      </div>
    </div>
  );
};



export const StudentSchedule = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [trainerId, setTrainerId] = React.useState<string | null>(null);

  // Reschedule State
  const [rescheduleData, setRescheduleData] = React.useState<any>(null); // { id, title, currentDate, trainerId }

  // Request Class State
  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);

  React.useEffect(() => {
    const loadSchedule = async () => {
      if (user?.id) {
        try {
          const data = await scheduleService.getStudentAppointments(user.id);
          setAppointments(data);

          // Try to find trainerId from existing appointments or connection
          // For now, assuming distinct trainer per student or taking from first appointment/connection service
          // A better way is fetching student's connection info
          if (data.length > 0) {
            setTrainerId(data[0].trainerId);
          } else {
            // Fetch from connection service if no appointments yet
            const trainers = await connectionService.getMyTrainers(user.id);
            if (trainers.length > 0) {
              setTrainerId(trainers[0].id);
            }
          }

        } catch (e) {
          console.error(e);
          showToast('Erro ao carregar agenda', 'error');
        } finally {
          setLoading(false);
        }
      }
    };
    loadSchedule();
  }, [user]);

  const handleCancel = async (id: string, title: string) => {
    try {
      await scheduleService.deleteAppointment(id);
      setAppointments(prev => prev.filter(app => app.id !== id));
      showToast(`Agendamento "${title || 'Aula'}" cancelado`, 'info');
    } catch (e) {
      console.error(e);
      showToast('Erro ao cancelar agendamento', 'error');
    }
  };

  const handleRescheduleSubmit = async (newDate: Date) => {
    if (!user || !rescheduleData) return;
    try {
      await scheduleService.requestReschedule(
        rescheduleData.id,
        user.id,
        user.name,
        rescheduleData.trainerId,
        rescheduleData.currentDate, // Pass Timestamp or handle conversion if currently Date object
        newDate
      );
      showToast('Solicitação enviada ao seu treinador!', 'success');
      setRescheduleData(null);
    } catch (e) {
      console.error(e);
      showToast('Erro ao enviar solicitação', 'error');
    }
  };



  const handleOpenRequestModal = () => {
    if (!trainerId) {
      showToast('Você precisa estar conectado a um personal para agendar.', 'warning');
      return;
    }
    setIsRequestModalOpen(true);
  };

  return (
    <DashboardLayout title="Minha Agenda">
      <RescheduleModalInternal
        isOpen={!!rescheduleData}
        onClose={() => setRescheduleData(null)}
        onSubmit={handleRescheduleSubmit}
        currentDate={rescheduleData?.currentDate?.toDate ? rescheduleData.currentDate.toDate() : null}
      />

      {trainerId && (
        <RequestClassModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          trainerId={trainerId}
        />
      )}

      <div className="space-y-6">
        <div className="glass-card flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Próximas Sessões</h3>
            <p className="text-gray-400 text-sm">Gerencie seus horários e check-ins</p>
          </div>
          <Button onClick={handleOpenRequestModal}>
            <span className="material-symbols-outlined mr-2">add</span>
            Solicitar Aula
          </Button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando agenda...</div>
          ) : appointments.map(app => (
            <div key={app.id} className="glass-card p-4 flex flex-col md:flex-row items-center gap-4">
              <div className="flex flex-col items-center min-w-[4rem] p-2 bg-surface-dark rounded-xl border border-white/5">
                <span className="text-xs uppercase font-bold text-gray-500">
                  {app.date?.toDate ? app.date.toDate().toLocaleDateString('pt-BR', { weekday: 'short' }) : 'DATA'}
                </span>
                <span className="text-xl font-bold">
                  {app.date?.toDate ? app.date.toDate().getDate() : '--'}
                </span>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h4 className="font-bold text-lg">{app.type || 'Sessão'}</h4>
                <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-gray-400 mt-1">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">person</span> {app.trainerName || 'Personal'}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {app.date?.toDate ? app.date.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto flex-wrap justify-center">

                <Button
                  variant="outline"
                  className={`text-xs px-3 ${app.status === 'reschedule_pending'
                    ? 'border-yellow-500/20 text-yellow-500 cursor-not-allowed opacity-70'
                    : 'border-blue-500/20 text-blue-500 hover:bg-blue-500/10 hover:text-blue-500'
                    }`}
                  disabled={app.status === 'reschedule_pending'}
                  onClick={() => {
                    if (app.status !== 'reschedule_pending') {
                      setRescheduleData({ id: app.id, title: app.type, currentDate: app.date, trainerId: app.trainerId });
                    }
                  }}
                >
                  {app.status === 'reschedule_pending' ? 'Solicitado' : 'Reagendar'}
                </Button>
                <Button
                  variant="outline"
                  className="text-xs px-3 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  onClick={() => handleCancel(app.id, app.title)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ))}

          {appointments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
              <p>Nenhum agendamento encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout >
  );
};

export const StudentProgress = EnhancedStudentProgress;


