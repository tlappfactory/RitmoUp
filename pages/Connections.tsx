import React, { useState, useEffect } from 'react';
import { ViewProfileModal } from '../components/ViewProfileModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { DashboardLayout } from '../components/Layout';
import { useAuth } from '../AuthContext';
import { UserRole } from '../types';
import { useToast } from '../ToastContext';
import { Button, IconButton } from '../components/UIComponents';
import { connectionService } from '../services/connectionService';
import { Navigate } from 'react-router-dom';

import { TrainerFilterModal } from '../components/TrainerFilterModal';

export const Connections = () => {
    const { user, updateUserProfile } = useAuth(); // Assuming updateUserProfile is available to refresh local user state
    const { showToast } = useToast();

    // Redirect Trainer to Dashboard (they manage connections there)
    if (user?.role === UserRole.TRAINER) {
        return <Navigate to="/trainer/dashboard" replace />;
    }

    const [searchTerm, setSearchTerm] = useState('');
    const [trainers, setTrainers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingIds, setPendingIds] = useState<string[]>([]);
    const [selectedTrainer, setSelectedTrainer] = useState<any>(null);

    // Disconnect Modal State
    const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
    const [trainerToDisconnect, setTrainerToDisconnect] = useState<any>(null);


    // Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        specialties: [] as string[],
        gender: 'Todos',
        minRating: 0
    });

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            try {
                const [trainersData, pendingRequests] = await Promise.all([
                    connectionService.getAvailableTrainers(),
                    connectionService.getStudentPendingRequests(user.id)
                ]);
                setTrainers(trainersData);
                setPendingIds(pendingRequests);
            } catch (error) {
                console.error("Failed to load data", error);
                showToast("Erro ao carregar dados", "error");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user]);

    const handleConnect = async (trainer: any) => {
        if (!user) return;
        try {
            await connectionService.sendRequest(user.id, user.name || 'Aluno', user.avatarUrl || '', trainer.id);
            setPendingIds(prev => [...prev, trainer.id]);
            showToast(`Solicitação enviada para ${trainer.name}`, 'success');
        } catch (e: any) {
            showToast(e.message || 'Erro ao enviar solicitação', 'error');
        }
    };


    const handleDisconnectClick = (trainer: any) => {
        setTrainerToDisconnect(trainer);
        setDisconnectModalOpen(true);
    };

    // Confirm Disconnect Logic
    const confirmDisconnect = async () => {
        if (!user) return;
        try {
            await connectionService.disconnect(user.id);
            // Update local user state if possible, or force reload/re-fetch.
            // For now, we assume simple UI update is enough or page refresh.
            //Ideally, useAuth would provide a refreshUser() method.
            showToast("Desconectado com sucesso", "success");

            // Optimistically update UI
            // This is tricky because user.trainerId is deep in context.
            // We'll rely on a window reload or assume auth context updates on navigation/refresh?
            // Best to just allow the user to see the change.
            window.location.reload();

        } catch (error) {
            console.error("Failed to disconnect", error);
            showToast("Erro ao desconectar", "error");
        }
    };

    // Calculate available specialties for filter
    const allSpecialties = Array.from(new Set(trainers.flatMap(t => t.specialties || [])));

    const filteredTrainers = trainers.filter(t => {
        // Text Search
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.specialties && t.specialties.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())));

        // Specialty Filter
        const matchesSpecialty = filters.specialties.length === 0 ||
            (t.specialties && filters.specialties.every((s: string) => t.specialties.includes(s)));

        // Gender Filter
        const matchesGender = filters.gender === 'Todos' || t.gender === filters.gender;

        // Rating Filter
        const matchesRating = (t.rating || 0) >= filters.minRating;

        return matchesSearch && matchesSpecialty && matchesGender && matchesRating;
    });

    return (
        <DashboardLayout
            title="Encontrar Personal"
            rightAction={
                <div className="flex gap-2">
                    <div className="relative">
                        <IconButton
                            icon="filter_list"
                            onClick={() => setIsFilterOpen(true)}
                            className={filters.specialties.length > 0 || filters.gender !== 'Todos' || filters.minRating > 0 ? 'text-primary' : ''}
                        />
                        {(filters.specialties.length > 0 || filters.gender !== 'Todos' || filters.minRating > 0) && (
                            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border border-background-dark"></div>
                        )}
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="glass p-4 rounded-xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400">search</span>
                    <input
                        type="text"
                        placeholder="Buscar por nome ou especialidade..."
                        className="bg-transparent border-none outline-none text-white w-full placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">Carregando treinadores...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTrainers.map(trainer => {
                            const isPending = pendingIds.includes(trainer.id);
                            // Also check if already connected (user.trainerId === trainer.id)
                            const isConnected = user?.trainerId === trainer.id;

                            return (
                                <div key={trainer.id} className={`glass-card p-0 overflow-hidden flex flex-col group transition-colors ${isConnected ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/50'}`}>
                                    <div className="p-6 flex flex-col items-center text-center gap-4">
                                        <div className="relative">
                                            <img src={trainer.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(trainer.name)}&background=random`} className={`size-24 rounded-full border-4 border-white/5 transition-colors object-cover ${isConnected ? 'border-primary' : 'group-hover:border-primary/50'}`} />
                                            <div className="absolute bottom-0 right-0 bg-surface-dark rounded-full p-1 border border-white/10">
                                                <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full text-[10px] font-bold">
                                                    <span className="material-symbols-outlined text-[10px]">star</span>
                                                    {trainer.rating || '5.0'}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{trainer.name}</h3>
                                            <div className="flex flex-wrap justify-center gap-1 mt-1">
                                                {trainer.specialties && trainer.specialties.slice(0, 2).map((s: string, i: number) => (
                                                    <span key={i} className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-gray-400">{s}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-400 line-clamp-2 min-h-[2.5em]">{trainer.bio || 'Sem biografia.'}</p>

                                        <div className="flex items-center gap-4 text-xs text-gray-400 bg-white/5 px-4 py-2 rounded-full w-full justify-center">
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">groups</span> {trainer.studentsCount || 0} alunos</span>
                                            <span className="w-px h-3 bg-white/20"></span>
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">verified</span> Certificado</span>
                                        </div>
                                    </div>
                                    <div className="mt-auto border-t border-white/5 p-4 bg-black/20">
                                        {isConnected ? (
                                            <Button
                                                variant="ghost"
                                                className="w-full text-green-500 hover:text-red-500 hover:bg-red-500/10 transition-colors group/btn"
                                                onClick={() => handleDisconnectClick(trainer)}
                                            >
                                                <span className="material-symbols-outlined mr-2 group-hover/btn:hidden">check_circle</span>
                                                <span className="hidden group-hover/btn:inline-flex items-center"><span className="material-symbols-outlined mr-2">close</span> Desconectar</span>
                                                <span className="group-hover/btn:hidden">Meu Treinador</span>
                                            </Button>
                                        ) : isPending ? (
                                            <Button variant="outline" className="w-full border-yellow-500/50 text-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10 cursor-default">
                                                <span className="material-symbols-outlined mr-2">hourglass_top</span> Pendente
                                            </Button>
                                        ) : (
                                            <Button className="w-full" onClick={() => handleConnect(trainer)}>Conectar</Button>
                                        )}
                                        <div className="pt-2">
                                            <Button variant="ghost" className="w-full text-sm text-gray-400 hover:text-white" onClick={() => setSelectedTrainer(trainer)}>
                                                Ver Perfil
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <ViewProfileModal
                isOpen={!!selectedTrainer}
                onClose={() => setSelectedTrainer(null)}
                trainer={selectedTrainer}
            />
            <ConfirmationModal
                isOpen={disconnectModalOpen}
                onClose={() => setDisconnectModalOpen(false)}
                onConfirm={confirmDisconnect}
                title="Desconectar do Treinador?"
                description={`Tem certeza que deseja remover ${trainerToDisconnect?.name} como seu treinador? Você perderá acesso aos treinos e acompanhamento.`}
                confirmText="Desconectar"
                variant="danger"
            />

            <TrainerFilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={(opts) => setFilters(opts)}
                initialFilters={filters}
                availableSpecialties={allSpecialties as string[]}
            />
        </DashboardLayout>
    );
};
