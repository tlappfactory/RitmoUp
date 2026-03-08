import React, { useState } from 'react';
import { Card, Button, Input, IconButton } from '../components/UIComponents';
// Mocks removed or commented out to ensure no usage
// import { studentsMock, exerciseCatalog, subscriptionPlansMock, financialRecordsMock } from '../mockData';
import { useToast } from '../ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../components/Layout';
import { PlanCard } from '../components/Financials/PlanCard';
import { TransactionHistory } from '../components/Financials/TransactionHistory';
import { SubscriptionPlan, UserRole, Student, WorkoutExercise, Exercise, Workout } from '../types';
import { workoutService } from '../services/workoutService';
import { aiService } from '../services/aiService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { ExerciseSelector } from '../components/Workouts/ExerciseSelector';

import { useAuth } from '../AuthContext';
import { EditProfileModal } from '../components/EditProfileModal';
import { StudentDetailsModal } from '../components/Trainer/StudentDetailsModal';
import { LogProgressModal } from '../components/Trainer/LogProgressModal';

import { AddTransactionModal } from '../components/Financials/AddTransactionModal';
import { financeService } from '../services/financeService';
import { studentService } from '../services/studentService';
import { scheduleService } from '../services/scheduleService';

import { SubscriptionContent } from '../components/Financials/SubscriptionContent';

export const TrainerFinancials = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    // const [plans, setPlans] = useState<SubscriptionPlan[]>([]); // Future implementation
    const [transactions, setTransactions] = useState<any[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'transactions' | 'subscription'>('transactions');

    const loadData = async () => {
        if (!user) return;
        // Load Financials
        try {
            const fetchedTransactions = await financeService.getFinancialRecords(user.id);
            setTransactions(fetchedTransactions);
        } catch (error) {
            console.error("Failed to load financials", error);
            showToast("Erro ao carregar dados financeiros", "error");
        }

        // Load Students (Independent)
        try {
            const fetchedStudents = await studentService.getStudentsByTrainer(user.id);
            setStudents(fetchedStudents);
        } catch (error) {
            console.error("Failed to load students", error);
            showToast("Erro ao carregar lista de alunos", "error");
        }

        setLoading(false);
    };

    React.useEffect(() => {
        loadData();
    }, [user]);

    const handleSaveTransaction = async (recordOrRecords: any | any[], id?: string) => {
        try {
            if (Array.isArray(recordOrRecords)) {
                // Batch create
                await financeService.addFinancialRecordBatch(recordOrRecords);
                showToast(`${recordOrRecords.length} transações geradas com sucesso!`, 'success');
            } else if (id) {
                // Update existing
                await financeService.updateFinancialRecord(id, recordOrRecords);
                showToast('Transação atualizada com sucesso!', 'success');
            } else {
                // Create single
                await financeService.addFinancialRecord(recordOrRecords);
                showToast('Transação registrada com sucesso!', 'success');
            }
            loadData(); // Refresh list
            setEditingTransaction(null);
        } catch (error) {
            console.error(error);
            showToast('Erro ao salvar transação', 'error');
        }
    };

    const handleEdit = (transaction: any) => {
        setEditingTransaction(transaction);
        setIsAddModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await financeService.deleteFinancialRecord(deleteId);
            setTransactions(prev => prev.filter(t => t.id !== deleteId));
            showToast('Transação excluída', 'success');
        } catch (error) {
            console.error(error);
            showToast('Erro ao excluir transação', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const handleConfirmPayment = async (id: string) => {
        try {
            await financeService.confirmPaymentByTrainer(id);
            showToast('Pagamento confirmado com sucesso!', 'success');

            // Optimistic update
            setTransactions(prev => prev.map(t =>
                t.id === id ? { ...t, status: 'Pago', statusColor: 'green' } : t
            ));
        } catch (error) {
            console.error(error);
            showToast('Erro ao confirmar pagamento', 'error');
        }
    };

    const totalRevenue = transactions.reduce((acc, curr) => curr.status === 'Pago' && curr.type === 'income' ? acc + curr.amount : acc, 0);
    const pendingRevenue = transactions.reduce((acc, curr) => curr.status === 'Pendente' && curr.type === 'income' ? acc + curr.amount : acc, 0);

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando financeiro...</div>;

    return (
        <DashboardLayout title="Finanças">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-glass-border overflow-x-auto mb-6">
                {[
                    { id: 'transactions', label: 'Transações & Fluxo' },
                    { id: 'subscription', label: 'Minha Assinatura' }
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

            {activeTab === 'subscription' ? (
                <SubscriptionContent embedded />
            ) : (
                <>
                    <ConfirmModal
                        isOpen={!!deleteId}
                        onClose={() => setDeleteId(null)}
                        onConfirm={confirmDelete}
                        title="Excluir Transação"
                        message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
                        confirmText="Excluir"
                        cancelText="Cancelar"
                        variant="danger"
                    />
                    <div className="space-y-8">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-card">
                                <p className="text-gray-400 text-sm">Faturamento Total</p>
                                <p className="text-3xl font-bold mt-1 text-green-400">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
                            </div>
                            <div className="glass-card">
                                <p className="text-gray-400 text-sm">A Receber</p>
                                <p className="text-3xl font-bold mt-1 text-yellow-400">R$ {pendingRevenue.toFixed(2).replace('.', ',')}</p>
                            </div>
                            <div className="glass-card">
                                <p className="text-gray-400 text-sm">Transações</p>
                                <p className="text-3xl font-bold mt-1 text-blue-400">{transactions.length}</p>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <h2 className="text-xl font-bold">Transações Recentes</h2>
                                <Button className="w-full sm:w-auto" onClick={() => { setEditingTransaction(null); setIsAddModalOpen(true); }}>
                                    <span className="material-symbols-outlined mr-2">add</span> Nova Cobrança
                                </Button>
                            </div>
                            <TransactionHistory
                                transactions={transactions}
                                onConfirmPayment={handleConfirmPayment}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        </div>

                        <AddTransactionModal
                            isOpen={isAddModalOpen}
                            onClose={() => { setIsAddModalOpen(false); setEditingTransaction(null); }}
                            onSave={handleSaveTransaction}
                            students={students}
                            trainerId={user?.id || ''}
                            initialData={editingTransaction}
                        />
                    </div>
                </>
            )}
        </DashboardLayout>
    );
};

import { Timestamp } from 'firebase/firestore';

import { SimpleInputModal } from '../components/SimpleInputModal';
import { CreateWorkoutModal } from '../components/Workouts/CreateWorkoutModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Calendar } from '../components/Schedule/Calendar';
import { AppointmentModal } from '../components/Schedule/AppointmentModal';
import { AppointmentCard } from '../components/Schedule/AppointmentCard';
import { Appointment } from '../services/scheduleService';
import { AddClassModal } from '../components/Schedule/AddClassModal';

import { connectionService, ConnectionRequest } from '../services/connectionService';

import { TrainerQRCode } from '../components/TrainerQRCode';

export const TrainerDashboard = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [stats, setStats] = useState({
        studentsCount: 0,
        todayClassesCount: 0,
        estimatedRevenue: 0
    });
    const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
    const [paymentNotifications, setPaymentNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [rescheduleRequests, setRescheduleRequests] = useState<any[]>([]);
    const [classRequests, setClassRequests] = useState<any[]>([]);

    // Student Details Modal State
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const refreshRequests = async () => {
        // Manual refresh still useful for other non-subscribed items (like schedule currently)
        if (!user) return;
        try {
            const reschedules = await scheduleService.getPendingRescheduleRequests(user.id);
            setRescheduleRequests(reschedules);

            const classReqs = await scheduleService.getPendingClassRequests(user.id);
            setClassRequests(classReqs);
        } catch (error: any) {
            console.error("Refresh failed", error);
        }
    };


    // 1. Real-time Subscriptions
    React.useEffect(() => {
        if (!user) return;

        // Connections
        const unsubscribeConnections = connectionService.subscribeToPendingRequests(user.id, (requests) => {
            setPendingRequests(requests);
        });

        // Payments
        const unsubscribePayments = financeService.subscribeToPendingConfirmations(user.id, (records) => {
            setPaymentNotifications(records);
        });

        return () => {
            unsubscribeConnections();
            unsubscribePayments();
        };
    }, [user]);

    // 2. Effect for Dashboard Metrics
    React.useEffect(() => {
        if (!user) return;

        const loadMetrics = async () => {
            try {
                console.log("Loading dashboard stats for user:", user.id);
                // Wrap specifically the student fetch to catch its specific error
                let students: any[] = [];
                try {
                    students = await studentService.getStudentsByTrainerSafe(user.id);
                } catch (innerErr: any) {
                    console.error("Student fetch specific error:", innerErr);
                    throw innerErr;
                }

                console.log("Students fetched:", students);
                setStudents(students); // Store students to use in modal


                if (students.length === 0) {
                    console.warn("No students found.");
                }

                // Try to fetch schedule data (non-blocking)
                let todayClassesCount = 0;
                try {
                    const todayClasses = await scheduleService.getTodayClasses(user.id);
                    // Use robust dashboard query
                    const upcoming = await scheduleService.getDashboardUpcoming(user.id);
                    const reschedules = await scheduleService.getPendingRescheduleRequests(user.id);
                    const classReqs = await scheduleService.getPendingClassRequests(user.id);

                    todayClassesCount = todayClasses.length;
                    setUpcomingClasses(upcoming);
                    setRescheduleRequests(reschedules);
                    setClassRequests(classReqs);
                } catch (schedErr: any) {
                    console.warn("Schedule fetch failed (non-fatal):", schedErr);
                }

                // FETCH REAL REVENUE
                let monthlyRevenue = 0;
                try {
                    const records = await financeService.getFinancialRecords(user.id);
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();

                    monthlyRevenue = records.reduce((acc, curr) => {
                        if (curr.type !== 'income' || curr.status !== 'Pago') return acc;

                        // Handle date format (Timestamp or Date)
                        const recordDate = curr.date?.toDate ? curr.date.toDate() : (curr.date ? new Date(curr.date) : new Date());

                        if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
                            return acc + curr.amount;
                        }
                        return acc;
                    }, 0);

                } catch (finErr) {
                    console.error("Error calculating revenue:", finErr);
                }

                // UPDATE STATS
                setStats(prev => ({
                    ...prev,
                    studentsCount: students.length,
                    estimatedRevenue: monthlyRevenue,
                    todayClassesCount: todayClassesCount
                }));

            } catch (error: any) {
                console.error("Dashboard stats load failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadMetrics();
    }, [user]);

    const handleRespond = async (requestId: string, status: 'accepted' | 'rejected') => {
        try {
            await connectionService.respondToRequest(requestId, status);
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));

            if (status === 'accepted') {
                showToast('Solicitação aceita! Aluno vinculado.', 'success');
                // Update stats locally to reflect change immediately (optional, simplified)
                setStats(prev => ({ ...prev, studentsCount: prev.studentsCount + 1 }));
            } else {
                showToast('Solicitação rejeitada.', 'info');
            }
        } catch (e) {
            showToast('Erro ao responder solicitação', 'error');
        }
    };

    const handleRespondReschedule = async (request: any, status: 'accepted' | 'rejected') => {
        try {
            await scheduleService.respondToRescheduleRequest(request.id, request.appointmentId, request.requestedDate, status);
            setRescheduleRequests(prev => prev.filter(r => r.id !== request.id));
            showToast(status === 'accepted' ? 'Troca aceita e agenda atualizada' : 'Troca recusada', status === 'accepted' ? 'success' : 'info');
            if (status === 'accepted') {
                // Refresh upcoming to show change
                const upcoming = await scheduleService.getDashboardUpcoming(user!.id);
                setUpcomingClasses(upcoming);
            }
        } catch (e) {
            console.error(e);
            showToast('Erro ao processar solicitação', 'error');
        }
    };

    const handleRespondClassRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
        try {
            await scheduleService.respondToClassRequest(requestId, status);
            setClassRequests(prev => prev.filter(r => r.id !== requestId));
            showToast(status === 'accepted' ? 'Aula agendada com sucesso!' : 'Solicitação recusada', 'success');
            if (status === 'accepted') {
                refreshRequests(); // Refresh all to be safe and update dashboard
            }
        } catch (error) {
            console.error(error);
            showToast('Erro ao responder solicitação', 'error');
        }
    };

    const handleScheduleClass = async (studentId: string, studentName: string, date: Date | Date[], type: string) => {
        try {
            const dates = Array.isArray(date) ? date : [date];

            // Create all appointments
            await Promise.all(dates.map(d => scheduleService.createClass({
                trainerId: user?.id || '',
                trainerName: user?.name || 'Personal',
                studentId,
                studentName,
                type,
                status: 'scheduled',
                date: Timestamp.fromDate(d)
            })));

            const message = dates.length > 1
                ? `${dates.length} aulas agendadas com sucesso!`
                : `Aula agendada para ${studentName}`;

            showToast(message, 'success');
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            console.error(e);
            showToast('Erro ao agendar aula', 'error');
        }
    };

    const handleViewStudentProfile = async (studentId: string) => {
        try {
            // Try to get student from local list first if available, else fetch
            let student = students.find(s => s.id === studentId);
            if (!student) {
                // If not in local list (maybe not yet connected properly or list not passed), fetch
                // Note: getStudentById might return null if permission denied, but for a requester component we might strictly need to handle it.
                // However, user service usually allows fetching basic profile.
                // We'll mock a full fetch or rely on what we have + a fetch
                // Actually, let's use userService logic if studentService wraps it.
                // For now, assuming studentService.getStudentById works.
                // If the student is not YOUR student yet preventing access, this might fail depending on rules. But let's try.
                // Actually connection requests usually imply basic profile access.
                // We will simply display what we have in the request if fetch fails? No, we want details.
                // Let's assume we can fetch public profile or "user" profile.
                const doc = await studentService.getStudentById(studentId);
                student = doc;
            }
            if (student) {
                setSelectedStudent(student);
                setIsDetailsModalOpen(true);
            } else {
                showToast('Não foi possível carregar o perfil do aluno', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar perfil', 'error');
        }
    };

    const handleConfirmPaymentNotification = async (id: string) => {
        try {
            await financeService.confirmPaymentByTrainer(id);
            showToast('Pagamento confirmado!', 'success');
            // Optimistic update handled by subscription
        } catch (error) {
            showToast('Erro ao confirmar', 'error');
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando painel...</div>;

    return (
        <DashboardLayout title="Painel do Treinador">
            <AddClassModal
                isOpen={isAddClassModalOpen}
                onClose={() => setIsAddClassModalOpen(false)}
                students={students}
                onSchedule={handleScheduleClass}
            />

            {isQRModalOpen && <TrainerQRCode onClose={() => setIsQRModalOpen(false)} />}

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-light dark:text-white">Olá, {user?.name?.split(' ')[0] || 'Treinador'}!</h1>
                        <p className="text-gray-500 dark:text-gray-400">Aqui está o resumo do seu dia.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setIsQRModalOpen(true)}
                            className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                        >
                            <span className="material-symbols-outlined mr-2">qr_code</span>
                            Meu QR Code
                        </Button>


                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => showToast(`Total de ${stats.studentsCount} alunos ativos`, 'info')}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform"><span className="material-symbols-outlined">groups</span></div>
                            <span className="text-green-600 dark:text-green-500 text-xs font-bold flex items-center bg-green-500/10 px-2 py-1 rounded-full">+0 novos</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Alunos Ativos</p>
                        <p className="text-4xl font-bold mt-1 text-text-light dark:text-white">{stats.studentsCount}</p>
                    </div>

                    <div className="glass-card hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => showToast(`${stats.todayClassesCount} aulas hoje`, 'info')}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform"><span className="material-symbols-outlined">calendar_today</span></div>
                            <span className="text-blue-500 dark:text-blue-400 text-xs font-bold flex items-center bg-blue-500/10 px-2 py-1 rounded-full">Hoje</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Aulas Agendadas</p>
                        <p className="text-4xl font-bold mt-1 text-text-light dark:text-white">{stats.todayClassesCount}</p>
                    </div>

                    <div className="glass-card hover:border-primary/50 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl group-hover:scale-110 transition-transform"><span className="material-symbols-outlined">payments</span></div>
                            <span className="text-gray-500 dark:text-gray-400 text-xs font-bold flex items-center bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full">Estimado</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Faturamento Mensal</p>
                        <p className="text-4xl font-bold mt-1 text-text-light dark:text-white">R$ {stats.estimatedRevenue.toFixed(0)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-card">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-text-light dark:text-white">Próximas Aulas</h2>
                            <button className="text-primary text-sm font-bold hover:underline" onClick={() => setIsAddClassModalOpen(true)}>+ Agendar</button>
                        </div>
                        <div className="space-y-4">
                            {upcomingClasses.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">Nenhuma aula agendada.</p>
                            ) : upcomingClasses.map((cls, i) => (
                                <div key={cls.id || i} className="flex gap-4 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-glass-border">
                                    <div className="flex flex-col items-center justify-center min-w-[3.5rem] bg-gray-100 dark:bg-white/5 rounded-lg p-2 group-hover:bg-primary/10 group-hover:text-primary transition-colors text-text-light dark:text-white">
                                        <span className="font-bold text-lg">{cls.date.toDate().getHours().toString().padStart(2, '0')}:{cls.date.toDate().getMinutes().toString().padStart(2, '0')}</span>
                                    </div>
                                    <div className="flex-1 flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center font-bold text-xs text-text-light dark:text-white">{cls.studentName.substring(0, 2).toUpperCase()}</div>
                                        <div>
                                            <h4 className="font-bold text-text-light dark:text-white">{cls.type}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{cls.studentName} • {cls.date.toDate().toLocaleDateString()}</p>
                                        </div>
                                    </div >
                                    <button className="size-8 rounded-full border border-glass-border flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-primary dark:hover:text-white"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                                </div >
                            ))}
                        </div >
                    </div >

                    <div className="glass-card">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-text-light dark:text-white">Solicitações Pendentes</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={refreshRequests} className="text-gray-400 hover:text-primary dark:hover:text-white" title="Atualizar Lista">
                                    <span className="material-symbols-outlined">refresh</span>
                                </button>
                                <div className={`size-2 rounded-full ${pendingRequests.length > 0 || rescheduleRequests.length > 0 || paymentNotifications.length > 0 ? 'bg-primary animate-pulse' : 'bg-gray-500'}`}></div>
                            </div>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto">
                            {pendingRequests.length === 0 && rescheduleRequests.length === 0 && classRequests.length === 0 && paymentNotifications.length === 0 ? (
                                <p className="text-center text-gray-500 py-6">Você não tem novas solicitações no momento.</p>
                            ) : (
                                <>
                                    {/* Connection Requests */}
                                    {pendingRequests.map(req => (
                                        <div key={req.id} className="flex gap-4 p-3 bg-white dark:bg-white/5 border border-glass-border rounded-xl items-center hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                            <div className="relative group cursor-pointer" onClick={() => handleViewStudentProfile(req.studentId)}>
                                                <img src={req.studentAvatarUrl || `https://ui-avatars.com/api/?name=${req.studentName}`} className="size-10 rounded-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="material-symbols-outlined text-white text-xs">visibility</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 cursor-pointer" onClick={() => handleViewStudentProfile(req.studentId)}>
                                                <p className="font-bold text-sm text-text-light dark:text-white">{req.studentName}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Quer conectar com você</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRespond(req.id, 'accepted')}
                                                    className="size-9 flex items-center justify-center bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500 rounded-lg hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors"
                                                    title="Aceitar"
                                                >
                                                    <span className="material-symbols-outlined text-lg">check</span>
                                                </button>
                                                <button
                                                    onClick={() => handleRespond(req.id, 'rejected')}
                                                    className="size-9 flex items-center justify-center bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                                                    title="Rejeitar"
                                                >
                                                    <span className="material-symbols-outlined text-lg">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Payment Notifications */}
                                    {paymentNotifications.map(notif => (
                                        <div key={notif.id} className="flex gap-4 p-3 bg-yellow-50 dark:bg-yellow-500/5 border border-yellow-200 dark:border-yellow-500/20 rounded-xl items-center hover:bg-yellow-100 dark:hover:bg-yellow-500/10 transition-colors">
                                            <div className="size-10 rounded-full bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                                                <span className="material-symbols-outlined">attach_money</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-text-light dark:text-white">{notif.studentName}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                                    Pagamento de <span className="font-bold">R$ {notif.amount}</span> aguardando confirmação.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleConfirmPaymentNotification(notif.id!)}
                                                className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors"
                                            >
                                                Confirmar
                                            </button>
                                        </div>
                                    ))}

                                    {/* Class Requests (New) */}
                                    {classRequests.map(req => (
                                        <div key={req.id} className="flex gap-4 p-3 bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/20 rounded-xl items-center hover:bg-purple-100 dark:hover:bg-purple-500/10 transition-colors">
                                            <div className="size-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                                <span className="material-symbols-outlined">event_available</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-text-light dark:text-white">{req.studentName}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                                    Solicitação de Aula: <span className="text-text-light dark:text-white font-bold">{req.requestedDate?.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                </p>
                                                <p className="text-[10px] text-gray-500">{req.type}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRespondClassRequest(req.id, 'accepted')}
                                                    className="size-9 flex items-center justify-center bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500 rounded-lg hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors"
                                                    title="Aprovar Aula"
                                                >
                                                    <span className="material-symbols-outlined text-lg">check</span>
                                                </button>
                                                <button
                                                    onClick={() => handleRespondClassRequest(req.id, 'rejected')}
                                                    className="size-9 flex items-center justify-center bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                                                    title="Recusar"
                                                >
                                                    <span className="material-symbols-outlined text-lg">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Reschedule Requests */}
                                    {rescheduleRequests.map(req => (
                                        <div key={req.id} className="flex gap-4 p-3 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl items-center hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors">
                                            <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <span className="material-symbols-outlined">update</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-text-light dark:text-white">{req.studentName}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                                    Trocar para: <span className="text-text-light dark:text-white font-bold">{req.requestedDate?.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                </p>
                                                <p className="text-[10px] text-gray-500">
                                                    De: {req.oldDate?.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRespondReschedule(req, 'accepted')}
                                                    className="size-9 flex items-center justify-center bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors"
                                                    title="Aprovar Troca"
                                                >
                                                    <span className="material-symbols-outlined text-lg">check</span>
                                                </button>
                                                <button
                                                    onClick={() => handleRespondReschedule(req, 'rejected')}
                                                    className="size-9 flex items-center justify-center bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                                                    title="Recusar"
                                                >
                                                    <span className="material-symbols-outlined text-lg">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div >
            </div >
            <CreateWorkoutModal
                isOpen={isWorkoutModalOpen}
                onClose={() => setIsWorkoutModalOpen(false)}
                onSuccess={() => { }}
            />

            <StudentDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                student={selectedStudent}
            />
        </DashboardLayout >
    );
};

export const TrainerStudents = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Pendente' | 'Inativo'>('Todos');

    const [deleteConfirm, setDeleteConfirm] = useState<{ studentId: string, studentName: string } | null>(null);

    // Modal States
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [studentToLog, setStudentToLog] = useState<{ id: string, name: string } | null>(null);

    const handleAddStudent = async (name: string) => {
        try {
            const newStudent: any = {
                id: Date.now().toString(),
                name,
                status: 'Ativo',
                goal: 'Definir objetivo',
                progress: 0,
                isRegistered: false,
                trainerId: user.id,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
            };
            await studentService.saveStudent(newStudent);
            setStudents(prev => [...prev, newStudent]);
            showToast('Aluno adicionado com sucesso', 'success');
        } catch (error) {
            console.error(error);
            showToast('Erro ao adicionar aluno', 'error');
        }
    };

    const handleDeleteStudent = async (studentId: string, studentName: string) => {
        setDeleteConfirm({ studentId, studentName });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            await studentService.deleteStudent(deleteConfirm.studentId);
            setStudents(prev => prev.filter(s => s.id !== deleteConfirm.studentId));
            showToast('Aluno excluído com sucesso', 'success');
        } catch (error) {
            console.error(error);
            showToast('Erro ao excluir aluno', 'error');
        } finally {
            setDeleteConfirm(null);
        }
    };

    const handleOpenDetails = (student: any) => {
        setSelectedStudent(student);
        setIsDetailsModalOpen(true);
    };

    const handleOpenLog = (id: string, name: string) => {
        setStudentToLog({ id, name });
        setIsLogModalOpen(true);
    };

    const handleSaveProgress = async (data: any) => {
        if (!studentToLog) return;
        try {
            await studentService.addProgress(studentToLog.id, data);

            // For now just update the local state if weight changed to reflect in UI immediately
            setStudents(prev => prev.map(s => s.id === studentToLog.id ? {
                ...s,
                weight: data.weight || s.weight,
                progress: data.progress !== undefined ? data.progress : s.progress
            } : s));
            showToast(`Progresso registrado para ${studentToLog.name}`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Erro ao salvar progresso', 'error');
        }
    };



    React.useEffect(() => {
        if (!user) return;
        const loadStudents = async () => {
            try {
                const data = await studentService.getStudentsByTrainer(user.id);
                setStudents(data);
            } catch (error) {
                console.error("Failed to load students", error);
                showToast("Erro ao carregar lista de alunos", "error");
            } finally {
                setLoading(false);
            }
        };
        loadStudents();
    }, [user]);

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando alunos...</div>;

    return (
        <DashboardLayout title="Meus Alunos" rightAction={
            <div className="flex gap-2">
                <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                    <span className="material-symbols-outlined text-sm md:mr-2">add</span>
                    <span className="hidden md:inline">Novo Aluno</span>
                </Button>
                <IconButton
                    icon="tune"
                    onClick={() => {
                        const statuses: ('Todos' | 'Ativo' | 'Pendente' | 'Inativo')[] = ['Todos', 'Ativo', 'Pendente', 'Inativo'];
                        const nextIndex = (statuses.indexOf(statusFilter) + 1) % statuses.length;
                        const nextStatus = statuses[nextIndex];
                        setStatusFilter(nextStatus);
                        showToast(`Filtrando por: ${nextStatus === 'Todos' ? 'Todos os alunos' : nextStatus}`, 'info');
                    }}
                />
            </div>
        }>
            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Excluir Aluno"
                message={`Tem certeza que deseja excluir ${deleteConfirm?.studentName}?\n\nEsta ação não pode ser desfeita.`}
                confirmText="Excluir"
                cancelText="Cancelar"
                variant="danger"
            />
            <SimpleInputModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddStudent}
                title="Adicionar Aluno"
                label="Nome do Aluno"
                placeholder="Ex: João Silva"
                confirmText="Adicionar"
            />

            <StudentDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                student={selectedStudent}
            />

            <LogProgressModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                studentName={studentToLog?.name || ''}
                onSave={handleSaveProgress}
            />

            <div className="space-y-6">
                <div className="glass p-4 rounded-xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-500">search</span>
                    <input
                        type="text"
                        placeholder="Buscar por nome, objetivo..."
                        className="bg-transparent border-none outline-none text-text-light dark:text-white w-full placeholder-gray-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {(['Todos', 'Ativo', 'Pendente', 'Inativo'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${statusFilter === status
                                ? 'bg-primary text-black border-primary'
                                : 'bg-white/5 text-gray-400 border-glass-border hover:bg-white/10'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                        const filtered = students.filter(student => {
                            const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                student.goal.toLowerCase().includes(searchQuery.toLowerCase());

                            if (statusFilter === 'Todos') return matchesSearch;

                            const studentStatus = (student.status || '').trim().toLowerCase();
                            const filterStatus = statusFilter.toLowerCase();

                            return matchesSearch && studentStatus === filterStatus;
                        });

                        if (filtered.length === 0) {
                            return (
                                <div className="col-span-full py-12 text-center text-gray-500 glass rounded-2xl">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20 block">person_search</span>
                                    Nenhum aluno encontrado.
                                </div>
                            );
                        }

                        return filtered.map(student => (
                            <div key={student.id} className="glass-card hover:border-primary/30 transition-all p-0 overflow-hidden border border-glass-border">
                                <div className="p-4 md:p-5 flex items-start gap-4">
                                    <img src={student.avatarUrl} className="size-12 md:size-14 rounded-full border-2 border-glass-border" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg text-text-light dark:text-white">{student.name}</h3>
                                                {!student.isRegistered && (
                                                    <span className="text-[10px] bg-gray-200 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full border border-glass-border" title="Aluno adicionado manualmente">
                                                        Sem App
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${(student.status || 'Ativo').toLowerCase() === 'ativo'
                                                ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500'
                                                : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-500'}`
                                            }>
                                                {student.status || 'Ativo'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{student.goal}</p>


                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:flex border-t border-glass-border divide-x divide-glass-border bg-gray-50 dark:bg-black/20">
                                    <button className="flex-1 py-3 text-sm font-bold text-primary hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-b lg:border-b-0 border-glass-border" onClick={() => navigate('/trainer/create-workout')}>Novo Treino</button>
                                    <button className="flex-1 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-b lg:border-b-0" onClick={() => handleOpenLog(student.id, student.name)}>Evolução</button>
                                    <button className="flex-1 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors" onClick={() => handleOpenDetails(student)}>Perfil</button>
                                    {!student.isRegistered && (
                                        <button
                                            className="flex-1 py-3 text-sm font-bold text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                            onClick={() => handleDeleteStudent(student.id, student.name)}
                                        >
                                            Excluir
                                        </button>
                                    )}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>
        </DashboardLayout>
    )
}

// Placeholder for future Workout Management page
// Placeholder for future Workout Management page
export const CreateWorkout = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const [title, setTitle] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

    // AI & Voice State
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);


    const { isListening, transcript, toggleListening, supported: voiceSupported } = useSpeechRecognition();

    const handleMicClick = () => {
        toggleListening();
    };

    const [activeStudents, setActiveStudents] = useState<Student[]>([]);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTemplate, setIsTemplate] = useState(false);

    // Sync voice transcript to input
    React.useEffect(() => {
        if (transcript) {
            setAiPrompt(transcript);
        }
    }, [transcript]);

    // Load template if passed
    React.useEffect(() => {
        if (location.state && (location.state as any).fromTemplate) {
            const tmpl = (location.state as any).fromTemplate as Workout;
            setTitle(`${tmpl.title} (Cópia)`);
            setExercises(tmpl.exercises || []);
            showToast("Modelo carregado!", "success");
        }
    }, [location.state]);

    React.useEffect(() => {
        if (!user) return;

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
    }, [user]);

    const handleAddExercise = (ex: Exercise) => {
        const isCardio = ex.muscleGroup === 'Cardio' || ex.type === 'cardio';

        const newEx: WorkoutExercise = {
            ...ex,
            sets: isCardio ? 1 : 3,
            reps: isCardio ? '10 min' : '10',
            weight: '',
            notes: '',
            rest: isCardio ? '0s' : '60s'
        };
        setExercises(prev => [...prev, newEx]);
        setIsSelectorOpen(false);
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
        const promptToUse = aiPrompt.trim();
        if (!promptToUse) return showToast('Descreva o treino que deseja gerar', 'warning');

        setIsGenerating(true);
        try {
            const catalog = await workoutService.getExercises();
            const generatedExercises = await aiService.generateWorkout(promptToUse, catalog);

            if (generatedExercises.length === 0) {
                showToast('Não encontrei exercícios específicos. Tente descrever o grupo muscular.', 'warning');
            } else {
                setExercises(generatedExercises);
                showToast(`Treino gerado com ${generatedExercises.length} exercícios!`, 'success');
                if (!title) setTitle(`Treino - ${promptToUse.charAt(0).toUpperCase() + promptToUse.slice(1).substring(0, 25)}...`);
            }
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
            await workoutService.createWorkout({
                title,
                studentId: selectedStudentId || 'template',
                trainerId: user.id,
                exercises,
                isTemplate,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            showToast("Treino criado com sucesso!", "success");
            navigate('/trainer/dashboard');
        } catch (error) {
            console.error("Save workout", error);
            showToast("Erro ao salvar treino", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout title="Criar Novo Treino" showBack>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Basic Info */}
                <Card className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-500 dark:text-gray-400">Título do Treino</label>
                        <Input
                            placeholder="Ex: Treino A - Peito e Tríceps"
                            value={title}
                            onChange={(e: any) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-gray-500 dark:text-gray-400">Aluno</label>
                        <select
                            className="w-full bg-white dark:bg-[#2C2C2E] border border-glass-border rounded-xl h-12 px-4 outline-none focus:border-primary transition-colors text-text-light dark:text-white appearance-none cursor-pointer"
                            value={selectedStudentId}
                            onChange={e => setSelectedStudentId(e.target.value)}
                        >
                            <option value="">Selecione um aluno...</option>
                            {activeStudents.map(st => (
                                <option key={st.id} value={st.id}>{st.name}</option>
                            ))}
                        </select>
                    </div>
                </Card>

                {/* AI Assistant Section */}
                <div className="p-1 rounded-2xl bg-gradient-to-r from-primary/50 to-purple-500/50">
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-xl relative overflow-hidden">
                        <div className="flex items-center gap-2 text-primary mb-4">
                            <span className="material-symbols-outlined">auto_awesome</span>
                            <h3 className="font-bold text-sm uppercase tracking-wide">RitmoAI - Assistente Inteligente</h3>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <textarea
                                    placeholder={isListening ? "Ouvindo..." : "Descreva o treino (ex: 'Pernas com foco em glúteo')..."}
                                    value={aiPrompt}
                                    onChange={(e: any) => {
                                        setAiPrompt(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    rows={3}
                                    onKeyDown={(e: any) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleGenerateAI();
                                        }
                                    }}
                                    className={`w-full bg-gray-50 dark:bg-[#2C2C2E] border border-glass-border rounded-xl px-4 py-3 pr-12 outline-none focus:border-primary transition-colors text-text-light dark:text-white resize-none overflow-hidden min-h-[100px] ${isListening ? "border-red-500 animate-pulse" : ""}`}
                                    style={{ height: 'auto' }}
                                />
                                {voiceSupported && (
                                    <>
                                        <button
                                            onClick={handleMicClick}
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-primary'}`}
                                            title="Comando de voz"
                                        >
                                            <span className="material-symbols-outlined">{isListening ? 'mic_off' : 'mic'}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                            <Button onClick={handleGenerateAI} disabled={isGenerating} className="px-6">
                                {isGenerating ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Gerar'}
                            </Button>
                        </div>
                        {isListening && <p className="text-xs text-red-500 dark:text-red-400 mt-2 animate-pulse">Ouvindo... Fale agora.</p>}
                    </div>
                </div>



                {/* Exercises List */}
                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-text-light dark:text-white">Exercícios ({exercises.length})</h3>
                        <Button variant="ghost" onClick={() => setIsSelectorOpen(true)}>
                            <span className="material-symbols-outlined mr-2">add</span> Adicionar Manualmente
                        </Button>
                    </div>

                    {exercises.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-glass-border rounded-xl text-gray-500">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">fitness_center</span>
                            <p>Nenhum exercício adicionado.<br />Use a IA ou adicione manualmente.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(() => {
                                // Group exercises by groupId for visual container rendering
                                const renderGroups: React.ReactElement[] = [];
                                let i = 0;
                                while (i < exercises.length) {
                                    const ex = exercises[i];
                                    // Check if this exercise starts a group
                                    if (ex.groupId) {
                                        // Find all consecutive exercises with same groupId
                                        const groupExercises: { ex: WorkoutExercise; idx: number }[] = [];
                                        let j = i;
                                        while (j < exercises.length && exercises[j].groupId === ex.groupId) {
                                            groupExercises.push({ ex: exercises[j], idx: j });
                                            j++;
                                        }

                                        if (groupExercises.length > 1) {
                                            // Render grouped exercises in a container
                                            renderGroups.push(
                                                <div key={`group-${ex.groupId}`} className="relative">
                                                    {/* Superset Group Header */}
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-green-400 text-black text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-primary/30">
                                                            <span className="material-symbols-outlined text-sm">link</span>
                                                            SUPERSET ({groupExercises.length} exercícios)
                                                        </div>
                                                        <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
                                                    </div>

                                                    {/* Grouped Exercises Container */}
                                                    <div className="relative pl-4 border-l-4 border-primary rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                                                        <div className="space-y-3 py-3">
                                                            {groupExercises.map(({ ex: gEx, idx: gIdx }, groupIndex) => (
                                                                <div key={gIdx} className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-primary/20 hover:border-primary/40 transition-colors ml-2 mr-2">
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-primary font-bold text-sm">{groupIndex + 1}.</span>
                                                                                <h4 className="font-bold text-lg text-text-light dark:text-white">{gEx.name}</h4>
                                                                            </div>
                                                                            <div className="flex gap-2 text-xs mt-1 ml-5">
                                                                                <span className="text-primary bg-primary/10 px-2 py-0.5 rounded">{gEx.muscleGroup}</span>
                                                                                {gEx.level && <span className="text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-white/5 px-2 py-0.5 rounded">{gEx.level}</span>}
                                                                            </div>
                                                                            {gEx.description && <p className="text-xs text-gray-500 mt-1 ml-5">{gEx.description}</p>}
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            {gIdx < exercises.length - 1 && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const updated = [...exercises];
                                                                                        const currentEx = updated[gIdx];
                                                                                        const nextEx = updated[gIdx + 1];

                                                                                        if (currentEx.groupId && currentEx.groupId === nextEx.groupId) {
                                                                                            nextEx.groupId = undefined;
                                                                                            const stillGrouped = updated.some((e, eIdx) => eIdx !== gIdx && e.groupId === currentEx.groupId);
                                                                                            if (!stillGrouped) currentEx.groupId = undefined;
                                                                                        } else {
                                                                                            const newGroupId = currentEx.groupId || `group-${Date.now()}`;
                                                                                            currentEx.groupId = newGroupId;
                                                                                            nextEx.groupId = newGroupId;
                                                                                        }
                                                                                        setExercises(updated);
                                                                                    }}
                                                                                    className={`p-2 rounded-lg transition-colors ${gEx.groupId && exercises[gIdx + 1]?.groupId === gEx.groupId
                                                                                        ? 'text-primary bg-primary/10 hover:bg-primary/20'
                                                                                        : 'text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10'
                                                                                        }`}
                                                                                    title={gEx.groupId && exercises[gIdx + 1]?.groupId === gEx.groupId ? 'Desagrupar do próximo' : 'Agrupar com próximo (Superset)'}
                                                                                >
                                                                                    <span className="material-symbols-outlined text-lg">link</span>
                                                                                </button>
                                                                            )}
                                                                            <button onClick={() => removeExercise(gIdx)} className="text-red-500 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                                                                <span className="material-symbols-outlined">delete</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Inputs for grouped exercise */}
                                                                    {(gEx.muscleGroup === 'Cardio' || gEx.type === 'cardio') ? (
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div>
                                                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Tempo / Duração</label>
                                                                                <div className="relative">
                                                                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">timer</span>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={gEx.reps}
                                                                                        onChange={e => updateExercise(gIdx, 'reps', e.target.value)}
                                                                                        placeholder="Ex: 15 min"
                                                                                        className="w-full bg-white dark:bg-black/20 border border-glass-border rounded-lg pl-9 pr-3 py-2 outline-none text-text-light dark:text-white focus:ring-1 focus:ring-primary/50"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Descanso (opcional)</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={gEx.rest}
                                                                                    onChange={e => updateExercise(gIdx, 'rest', e.target.value)}
                                                                                    className="w-full bg-white dark:bg-black/20 border border-glass-border rounded-lg p-2 outline-none text-text-light dark:text-white text-center focus:ring-1 focus:ring-primary/50"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                            <div>
                                                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Séries</label>
                                                                                <input
                                                                                    type="number"
                                                                                    value={gEx.sets}
                                                                                    onChange={e => updateExercise(gIdx, 'sets', parseInt(e.target.value))}
                                                                                    className="w-full bg-white dark:bg-black/20 border border-glass-border rounded-lg p-2 outline-none text-text-light dark:text-white text-center focus:ring-1 focus:ring-primary/50"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Reps</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={gEx.reps}
                                                                                    onChange={e => updateExercise(gIdx, 'reps', e.target.value)}
                                                                                    className="w-full bg-white dark:bg-black/20 border border-glass-border rounded-lg p-2 outline-none text-text-light dark:text-white text-center focus:ring-1 focus:ring-primary/50"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Carga (kg)</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={gEx.weight}
                                                                                    onChange={e => updateExercise(gIdx, 'weight', e.target.value)}
                                                                                    className="w-full bg-white dark:bg-black/20 border border-glass-border rounded-lg p-2 outline-none text-text-light dark:text-white text-center focus:ring-1 focus:ring-primary/50"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Descanso</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={gEx.rest}
                                                                                    onChange={e => updateExercise(gIdx, 'rest', e.target.value)}
                                                                                    className="w-full bg-white dark:bg-black/20 border border-glass-border rounded-lg p-2 outline-none text-text-light dark:text-white text-center focus:ring-1 focus:ring-primary/50"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Video URL Input - Prominent */}
                                                                    <div className="mt-3 pt-3 border-t border-glass-border">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="material-symbols-outlined text-primary text-sm">videocam</span>
                                                                            <label className="text-xs text-primary font-bold">Vídeo de Execução (Opcional)</label>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={gEx.videoUrl || ''}
                                                                            onChange={e => updateExercise(gIdx, 'videoUrl', e.target.value)}
                                                                            className="w-full bg-white dark:bg-black/20 border border-glass-border rounded-lg p-2 outline-none text-text-light dark:text-white text-sm focus:ring-1 focus:ring-primary/50 placeholder-gray-500"
                                                                            placeholder="Cole aqui o link do YouTube, Vimeo, etc."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                            i = j; // Skip to after the group
                                            continue;
                                        }
                                    }

                                    // Render single (ungrouped) exercise
                                    const idx = i;
                                    renderGroups.push(
                                        <div key={idx} className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-glass-border hover:border-primary/30 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-lg text-text-light dark:text-white">{ex.name}</h4>
                                                    <div className="flex gap-2 text-xs mt-1">
                                                        <span className="text-primary bg-primary/10 px-2 py-0.5 rounded">{ex.muscleGroup}</span>
                                                        {ex.level && <span className="text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-white/5 px-2 py-0.5 rounded">{ex.level}</span>}
                                                    </div>
                                                    {ex.description && <p className="text-xs text-gray-500 mt-1">{ex.description}</p>}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {idx < exercises.length - 1 && (
                                                        <button
                                                            onClick={() => {
                                                                const updated = [...exercises];
                                                                const currentEx = updated[idx];
                                                                const nextEx = updated[idx + 1];

                                                                if (currentEx.groupId && currentEx.groupId === nextEx.groupId) {
                                                                    nextEx.groupId = undefined;
                                                                    const stillGrouped = updated.some((e, eIdx) => eIdx !== idx && e.groupId === currentEx.groupId);
                                                                    if (!stillGrouped) currentEx.groupId = undefined;
                                                                } else {
                                                                    const newGroupId = currentEx.groupId || `group-${Date.now()}`;
                                                                    currentEx.groupId = newGroupId;
                                                                    nextEx.groupId = newGroupId;
                                                                }
                                                                setExercises(updated);
                                                            }}
                                                            className={`p-2 rounded-lg transition-colors ${ex.groupId && exercises[idx + 1]?.groupId === ex.groupId
                                                                ? 'text-primary bg-primary/10 hover:bg-primary/20'
                                                                : 'text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10'
                                                                }`}
                                                            title={ex.groupId && exercises[idx + 1]?.groupId === ex.groupId ? 'Desagrupar do próximo' : 'Agrupar com próximo (Superset)'}
                                                        >
                                                            <span className="material-symbols-outlined text-lg">link</span>
                                                        </button>
                                                    )}
                                                    <button onClick={() => removeExercise(idx)} className="text-red-500 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Conditional Inputs based on Type */}
                                            {(ex.muscleGroup === 'Cardio' || ex.type === 'cardio') ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Tempo / Duração</label>
                                                        <div className="relative">
                                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">timer</span>
                                                            <input
                                                                type="text"
                                                                value={ex.reps}
                                                                onChange={e => updateExercise(idx, 'reps', e.target.value)}
                                                                placeholder="Ex: 15 min"
                                                                className="w-full bg-white dark:bg-black/20 border border-glass-border rounded-lg pl-9 pr-3 py-2 outline-none text-text-light dark:text-white focus:ring-1 focus:ring-primary/50"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Descanso (opcional)</label>
                                                        <input
                                                            type="text"
                                                            value={ex.rest}
                                                            onChange={e => updateExercise(idx, 'rest', e.target.value)}
                                                            className="w-full bg-white dark:bg-black/20 border border-glass-border rounded-lg p-2 outline-none text-text-light dark:text-white text-center focus:ring-1 focus:ring-primary/50"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Séries</label>
                                                        <input
                                                            type="number"
                                                            value={ex.sets}
                                                            onChange={e => updateExercise(idx, 'sets', parseInt(e.target.value))}
                                                            className="w-full bg-white dark:bg-black/20 border border-glass-border rounded-lg p-2 outline-none text-text-light dark:text-white text-center focus:ring-1 focus:ring-primary/50"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Reps</label>
                                                        <input
                                                            type="text"
                                                            value={ex.reps}
                                                            onChange={e => updateExercise(idx, 'reps', e.target.value)}
                                                            className="w-full bg-white dark:bg-black/20 border border-glass-border rounded-lg p-2 outline-none text-text-light dark:text-white text-center focus:ring-1 focus:ring-primary/50"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Carga (kg)</label>
                                                        <input
                                                            type="text"
                                                            value={ex.weight}
                                                            onChange={e => updateExercise(idx, 'weight', e.target.value)}
                                                            className="w-full bg-white dark:bg-black/20 border border-glass-border rounded-lg p-2 outline-none text-text-light dark:text-white text-center focus:ring-1 focus:ring-primary/50"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Descanso</label>
                                                        <input
                                                            type="text"
                                                            value={ex.rest}
                                                            onChange={e => updateExercise(idx, 'rest', e.target.value)}
                                                            className="w-full bg-white dark:bg-black/20 border border-glass-border rounded-lg p-2 outline-none text-text-light dark:text-white text-center focus:ring-1 focus:ring-primary/50"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Video URL Input - Prominent */}
                                            <div className="mt-3 pt-3 border-t border-glass-border">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="material-symbols-outlined text-primary text-sm">videocam</span>
                                                    <label className="text-xs text-primary font-bold">Vídeo de Execução (Opcional)</label>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={ex.videoUrl || ''}
                                                    onChange={e => updateExercise(idx, 'videoUrl', e.target.value)}
                                                    className="w-full bg-white dark:bg-black/20 border border-glass-border rounded-lg p-2 outline-none text-text-light dark:text-white text-sm focus:ring-1 focus:ring-primary/50 placeholder-gray-500"
                                                    placeholder="Cole aqui o link do YouTube, Vimeo, etc."
                                                />
                                            </div>
                                        </div>
                                    );
                                    i++;
                                }
                                return renderGroups;
                            })()}
                        </div>
                    )}
                </Card>

                <div className="flex gap-4 pt-4 border-t border-glass-border items-center">
                    <label className="flex items-center gap-2 cursor-pointer group mr-auto">
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

                    <Button variant="ghost" className="flex-1" onClick={() => navigate('/trainer/dashboard')}>Cancelar</Button>
                    <Button variant="primary" className="flex-1" onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? 'Salvando...' : 'Criar Treino'}
                    </Button>
                </div>
            </div>

            {isSelectorOpen && (
                <ExerciseSelector
                    onSelect={handleAddExercise}
                    onClose={() => setIsSelectorOpen(false)}
                />
            )}
        </DashboardLayout>
    );
};

export const TrainerSchedule = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);

    // Load students and appointments
    React.useEffect(() => {
        if (!user) return;
        const loadData = async () => {
            // Load students separately - more critical for modal
            try {
                const studentsData = await studentService.getStudentsByTrainerSafe(user.id);
                console.log("Loaded students for schedule:", studentsData);
                setStudents(studentsData);
            } catch (studentError) {
                console.error('Failed to load students:', studentError);
                showToast('Erro ao carregar alunos', 'error');
            }

            // Load appointments separately - non-blocking
            try {
                const appointmentsData = await scheduleService.getClasses(user.id);
                setAppointments(appointmentsData as Appointment[]);
            } catch (appointmentError) {
                console.error('Failed to load appointments:', appointmentError);
                // Don't toast - calendar still usable
            }

            setLoading(false);
        };
        loadData();
    }, [user]);

    const handleCreateAppointment = async (data: Omit<Appointment, 'id' | 'trainerId'>) => {
        if (!user) return;
        try {
            const id = await scheduleService.createClass({
                ...data,
                trainerId: user.id,
                trainerName: user.name
            });

            // Optimistically update UI
            setAppointments([...appointments, { ...data, id, trainerId: user.id, trainerName: user.name }]);
            showToast('Aula agendada com sucesso!', 'success');
        } catch (error) {
            console.error('Failed to create appointment', error);
            showToast('Erro ao criar aula', 'error');
        }
    };

    const handleUpdateAppointment = async (data: Omit<Appointment, 'id' | 'trainerId'>) => {
        if (!editingAppointment) return;
        try {
            await scheduleService.updateAppointment(editingAppointment.id!, data);

            setAppointments(appointments.map(apt =>
                apt.id === editingAppointment.id ? { ...apt, ...data } : apt
            ));
            showToast('Aula atualizada com sucesso!', 'success');
            setEditingAppointment(null);
        } catch (error) {
            console.error('Failed to update appointment', error);
            showToast('Erro ao atualizar aula', 'error');
        }
    };

    const handleDeleteAppointment = async () => {
        if (!deleteConfirm) return;
        try {
            await scheduleService.deleteAppointment(deleteConfirm.id);

            setAppointments(appointments.filter(apt => apt.id !== deleteConfirm.id));
            showToast('Aula excluída com sucesso!', 'success');
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete appointment', error);
            showToast('Erro ao excluir aula', 'error');
        }
    };

    const handleScheduleClass = async (studentId: string, studentName: string, date: Date | Date[], type: string) => {
        try {
            const dates = Array.isArray(date) ? date : [date];

            // Create all appointments
            const createdIds = await Promise.all(dates.map(d => scheduleService.createClass({
                trainerId: user?.id || '',
                trainerName: user?.name || 'Personal',
                studentId,
                studentName,
                type,
                status: 'scheduled',
                date: Timestamp.fromDate(d)
            })));

            // Refresh appointments logic or optimistic update
            // Since we don't have IDs easily for all, reloading or re-fetching might be safer. 
            // But let's try to optimistic add if simple.
            // Actually, re-fetching or just adding with temp ID is fine. 
            // Let's just create temp objects for UI update (simplified)

            const newAppointments = dates.map((d, i) => ({
                id: createdIds[i] || Date.now().toString() + i,
                trainerId: user?.id || '',
                studentId,
                studentName,
                type,
                status: 'scheduled',
                date: Timestamp.fromDate(d),
                duration: 60 // Default
            } as Appointment));

            setAppointments(prev => [...prev, ...newAppointments]);

            const message = dates.length > 1
                ? `${dates.length} aulas agendadas com sucesso!`
                : `Aula agendada para ${studentName}`;

            showToast(message, 'success');
        } catch (e) {
            console.error(e);
            showToast('Erro ao agendar aula', 'error');
        }
    };

    const selectedDateAppointments = selectedDate
        ? appointments.filter(apt => {
            const aptDate = apt.date.toDate();
            return aptDate.toDateString() === selectedDate.toDateString();
        }).sort((a, b) => a.date.toMillis() - b.date.toMillis())
        : [];

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando agenda...</div>;

    return (
        <DashboardLayout
            title="Agenda"
            rightAction={
                <Button variant="primary" onClick={() => setIsAddClassModalOpen(true)}>
                    <span className="material-symbols-outlined text-sm mr-2">add</span>
                    Nova Aula
                </Button>
            }
        >
            {/* Modals */}
            {console.log("Students being passed to modal:", students)}

            <AddClassModal
                isOpen={isAddClassModalOpen}
                onClose={() => setIsAddClassModalOpen(false)}
                students={students}
                onSchedule={handleScheduleClass}
            />

            <AppointmentModal
                isOpen={!!editingAppointment}
                onClose={() => {
                    setEditingAppointment(null);
                }}
                onSubmit={handleUpdateAppointment}
                appointment={editingAppointment}
                students={students.map(s => ({ id: s.id, name: s.name }))}
            />

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDeleteAppointment}
                title="Excluir Aula"
                message={`Tem certeza que deseja excluir a aula com ${deleteConfirm?.name}?`}
                confirmText="Excluir"
                variant="danger"
            />

            <div className="space-y-6">
                {/* View Toggle */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setView('calendar')}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${view === 'calendar'
                            ? 'bg-primary text-black'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        <span className="material-symbols-outlined mr-2 text-sm align-middle">calendar_month</span>
                        Calendário
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${view === 'list'
                            ? 'bg-primary text-black'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        <span className="material-symbols-outlined mr-2 text-sm align-middle">list</span>
                        Lista
                    </button>
                </div>

                {view === 'calendar' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Calendar */}
                        <div className="lg:col-span-2">
                            <Calendar
                                appointments={appointments}
                                onDateSelect={setSelectedDate}
                                selectedDate={selectedDate}
                            />
                        </div>

                        {/* Appointments List for Selected Date */}
                        <div className="space-y-4">
                            <div className="glass-card p-4">
                                <h3 className="font-bold text-lg mb-1">
                                    {selectedDate?.toLocaleDateString('pt-BR', {
                                        day: 'numeric',
                                        month: 'long'
                                    })}
                                </h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    {selectedDateAppointments.length} aula{selectedDateAppointments.length !== 1 ? 's' : ''}
                                </p>

                                {selectedDateAppointments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <span className="material-symbols-outlined text-4xl text-gray-600 mb-2">event_available</span>
                                        <p className="text-gray-500 text-sm">Nenhuma aula neste dia</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedDateAppointments.map(apt => (
                                            <AppointmentCard
                                                key={apt.id}
                                                appointment={apt}
                                                onEdit={() => setEditingAppointment(apt)}
                                                onDelete={() => setDeleteConfirm({
                                                    id: apt.id!,
                                                    name: apt.studentName
                                                })}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* List View - Grouped by Day */}
                        {appointments.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-5xl text-gray-600 mb-4">event_busy</span>
                                <h3 className="text-xl font-bold text-white">Nenhuma aula agendada</h3>
                                <p className="text-gray-400 mt-2">Use o botão "Nova Aula" para começar.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {appointments.map(apt => (
                                    <AppointmentCard
                                        key={apt.id}
                                        appointment={apt}
                                        onEdit={() => setEditingAppointment(apt)}
                                        onDelete={() => setDeleteConfirm({
                                            id: apt.id!,
                                            name: apt.studentName
                                        })}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

import { ErrorBoundary } from '../components/ErrorBoundary';

const TrainerProfileContent = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [realStudentsCount, setRealStudentsCount] = useState(0);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);

    React.useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            try {
                // Load Students Count
                const students = await studentService.getStudentsByTrainer(user.id);
                setRealStudentsCount(students.length);

                // Load Monthly Revenue
                const records = await financeService.getFinancialRecords(user.id);

                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const revenue = records.reduce((acc, curr) => {
                    if (curr.type !== 'income' || curr.status !== 'Pago') return acc;
                    const recordDate = curr.date?.toDate ? curr.date.toDate() : (curr.date ? new Date(curr.date) : new Date());
                    if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
                        return acc + curr.amount;
                    }
                    return acc;
                }, 0);

                setMonthlyRevenue(revenue);
            } catch (error) {
                console.error("Error fetching profile data", error);
            }
        };
        loadData();
    }, [user]);

    // Fields that are specific to trainer, safely accessed
    const specialties = user?.specialties || [];
    const certifications = user?.certifications || [];
    const bio = user?.bio || 'Sem biografia definida.';
    const pixKey = user?.pixKey || 'Não cadastrada';
    const experienceYears = user?.experienceYears || 0;
    const rating = user?.rating || 5.0;
    const studentsCount = realStudentsCount;

    const handleLogout = () => {
        logout();
        navigate('/');
        showToast('Você saiu da conta.', 'info');
    };

    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editFields, setEditFields] = React.useState<any[]>([]);
    const [editTitle, setEditTitle] = React.useState('');

    const openEditModal = (fields: any[], title: string) => {
        setEditFields(fields);
        setEditTitle(title);
        setIsEditModalOpen(true);
    };

    if (!user) return null;

    return (
        <DashboardLayout title="Meu Perfil Profissional" showBack>
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                fields={editFields}
                title={editTitle}
            />

            <div className="flex flex-col gap-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center gap-6 py-8">
                    <div className="relative">
                        <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt="Profile" className="size-32 rounded-full border-4 border-primary shadow-[0_0_30px_rgba(0,255,136,0.3)] object-cover" />
                        <button
                            className="absolute bottom-0 right-0 p-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-full text-primary hover:bg-gray-50 dark:hover:bg-white/10"
                            onClick={() => openEditModal([
                                { key: 'name', label: 'Nome Profissional', type: 'text' },
                                { key: 'avatarUrl', label: 'Foto de Perfil', type: 'file' },
                                { key: 'gender', label: 'Gênero', type: 'select', options: ['Mulher', 'Homem', 'Não binário / Outro', 'Prefiro não informar'] },
                                { key: 'bio', label: 'Biografia', type: 'textarea' }
                            ], 'Editar Perfil')}
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                            <h2 className="text-3xl font-bold text-text-light dark:text-white">{user.name}</h2>
                            <span className="px-2 py-0.5 bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 rounded text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto md:mx-0">
                                <span className="material-symbols-outlined text-xs">star</span> {rating}
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-1">{user.email}</p>
                        {user.gender && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-3 flex items-center gap-1 md:justify-start justify-center">
                                <span className="material-symbols-outlined text-sm">person</span>
                                {user.gender}
                            </p>
                        )}
                        <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xl">{bio}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Professional Info */}
                    <Card className="space-y-6">
                        <div className="flex justify-between items-center border-b border-glass-border pb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-text-light dark:text-white"><span className="material-symbols-outlined text-primary">workspace_premium</span> Profissional</h3>
                            <button
                                className="text-xs text-primary hover:underline"
                                onClick={() => openEditModal([
                                    { key: 'specialties', label: 'Especialidades (separe por vírgula)', type: 'text', placeholder: 'Ex: Musculação, Crossfit', isArray: true },
                                    { key: 'certifications', label: 'Certificações (separe por vírgula)', type: 'text', placeholder: 'Ex: CREF 123456-G/SP', isArray: true },
                                    { key: 'experienceYears', label: 'Anos de Experiência', type: 'number' }
                                ], 'Editar Info Profissional')}
                            >
                                Editar
                            </button>
                        </div>

                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-2">Especialidades</p>
                            <div className="flex flex-wrap gap-2">
                                {(Array.isArray(specialties) && specialties.length > 0) ? specialties.map((spec: any, idx: number) => (
                                    <span key={`spec-${idx}`} className="px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-sm border border-glass-border text-gray-700 dark:text-gray-300">{String(spec)}</span>
                                )) : <span className="text-gray-500 italic text-sm">Nenhuma especialidade cadastrada</span>}
                            </div>
                        </div>

                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-2">Certificações</p>
                            <ul className="space-y-2">
                                {(Array.isArray(certifications) && certifications.length > 0) ? certifications.map((cert: any, idx: number) => (
                                    <li key={`cert-${idx}`} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <span className="material-symbols-outlined text-primary text-sm mt-0.5">verified</span>
                                        {String(cert)}
                                    </li>
                                )) : <span className="text-gray-500 italic text-sm">Nenhuma certificação cadastrada</span>}
                            </ul>
                        </div>

                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-2">Experiência</p>
                            <p className="text-text-light dark:text-white text-lg font-bold">{String(experienceYears)} <span className="text-sm text-gray-500 font-normal">anos de atuação</span></p>
                        </div>
                    </Card>

                    {/* Financial & Reach */}
                    <Card className="space-y-6">
                        <div className="flex justify-between items-center border-b border-glass-border pb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-text-light dark:text-white"><span className="material-symbols-outlined text-primary">payments</span> Financeiro e Alcance</h3>
                            <button
                                className="text-xs text-primary hover:underline"
                                onClick={() => openEditModal([
                                    { key: 'pixKey', label: 'Chave PIX', type: 'text' }
                                ], 'Editar Financeiro')}
                            >
                                Editar
                            </button>
                        </div>

                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Chave PIX</p>
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-surface-dark border border-glass-border p-3 rounded-lg justify-between">
                                <span className="font-mono text-sm text-text-light dark:text-white">{String(pixKey)}</span>
                                <button className="text-gray-400 hover:text-primary" onClick={() => { navigator.clipboard.writeText(pixKey); showToast('Chave PIX copiada', 'success'); }}>
                                    <span className="material-symbols-outlined text-sm">content_copy</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Visível para alunos pagarem via PIX direto.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-center border border-glass-border">
                                <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 mb-1">groups</span>
                                <p className="text-2xl font-bold text-text-light dark:text-white">{String(studentsCount)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Alunos Ativos</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-center border border-glass-border">
                                <span className="material-symbols-outlined text-green-500 dark:text-green-400 mb-1">paid</span>
                                <p className="text-2xl font-bold text-text-light dark:text-white">R$ {monthlyRevenue.toFixed(2).replace('.', ',')}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Faturamento/mês</p>
                            </div>
                        </div>
                    </Card>

                </div>

                <div className="space-y-3 pt-4">
                    <Button variant="secondary" className="w-full justify-between h-14 bg-white dark:bg-white/5 !text-gray-900 dark:!text-white border border-gray-200 dark:border-glass-border hover:bg-gray-50 dark:hover:bg-white/10" onClick={() => navigate('/settings')}>
                        <span className="flex items-center gap-3"><span className="material-symbols-outlined">settings</span> Configurações da Conta</span>
                        <span className="material-symbols-outlined text-gray-500">chevron_right</span>
                    </Button>
                    <Button variant="danger" className="w-full h-14" onClick={handleLogout}>Sair da Conta</Button>
                </div>
            </div >
        </DashboardLayout >
    );


};

export const TrainerProfile = () => (
    <ErrorBoundary>
        <TrainerProfileContent />
    </ErrorBoundary>
);