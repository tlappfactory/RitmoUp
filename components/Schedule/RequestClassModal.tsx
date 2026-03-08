import React, { useState, useEffect } from 'react';
import { Button } from '../UIComponents';
import { useAuth } from '../../AuthContext';
import { scheduleService } from '../../services/scheduleService';

interface RequestClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainerId: string; // The specific trainer to request from
}

export const RequestClassModal = ({ isOpen, onClose, trainerId }: RequestClassModalProps) => {
    const { user } = useAuth();
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState('Musculação');
    const [occupiedSlots, setOccupiedSlots] = useState<Date[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Fetch occupied slots when date changes
    useEffect(() => {
        if (!date || !trainerId) return;

        const loadSlots = async () => {
            setLoadingSlots(true);
            try {
                // Get all appointments for this trainer
                // Optimization: In real app, query by date range. 
                // For now, fetching all (cached/lightweight) or using existing service method if available.
                // scheduleService.getAppointmentsByDateRange is best.
                const selectedDate = new Date(date);
                const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
                const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

                const appointments = await scheduleService.getAppointmentsByDateRange(trainerId, startOfDay, endOfDay);

                // Map to occupied times
                const slots = appointments
                    .filter(app => app.status !== 'cancelled')
                    .map(app => app.date.toDate());

                setOccupiedSlots(slots);
            } catch (error) {
                console.error("Error loading slots", error);
            } finally {
                setLoadingSlots(false);
            }
        };

        loadSlots();
    }, [date, trainerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !date || !time) return;

        // Block if invalid (Double check)
        const requestedDateTime = new Date(`${date}T${time}`);
        const isConflict = occupiedSlots.some(slot => {
            const diff = Math.abs(slot.getTime() - requestedDateTime.getTime());
            return diff < 60 * 60 * 1000;
        });

        if (isConflict) {
            alert('Horário inválido ou ocupado.');
            return;
        }

        try {
            const requestedDateTime = new Date(`${date}T${time}`);

            // Validation: Check for overlap (assuming 1 hour duration)
            // If the difference between requested time and any occupied slot is less than 60 minutes, it's a conflict.
            const isTaken = occupiedSlots.some(slot => {
                const diff = Math.abs(slot.getTime() - requestedDateTime.getTime());
                return diff < 60 * 60 * 1000; // < 60 minutes
            });

            if (isTaken) {
                alert('Este horário já está ocupado ou conflita com outra aula. Por favor, escolha outro.');
                return;
            }

            await scheduleService.requestClass(
                user.id,
                user.name || 'Aluno',
                trainerId,
                requestedDateTime,
                type
            );

            alert('Solicitação enviada com sucesso! Aguarde a confirmação do seu treinador.');
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar solicitação.');
        }
    };

    if (!isOpen) return null;

    const isInvalidTime = React.useMemo(() => {
        if (!date || !time) return false;
        const requestedDateTime = new Date(`${date}T${time}`);
        return occupiedSlots.some(slot => {
            const diff = Math.abs(slot.getTime() - requestedDateTime.getTime());
            return diff < 60 * 60 * 1000;
        });
    }, [date, time, occupiedSlots]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-md animate-fade-in-up">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-white">Solicitar Nova Aula</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Data Preferida</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            required
                            className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Horário Disponível</label>
                        <input
                            type="time"
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            required
                            className={`w-full bg-[#2C2C2E] border rounded-xl h-12 px-4 text-white outline-none focus:border-primary ${isInvalidTime ? 'border-red-500' : 'border-white/10'}`}
                        />
                        {isInvalidTime && (
                            <p className="text-xs text-red-500 font-bold">⚠️ Este horário conflita com outra aula.</p>
                        )}
                        {loadingSlots && <p className="text-xs text-yellow-500">Verificando disponibilidade...</p>}
                        {!loadingSlots && date && occupiedSlots.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                                Horários ocupados: {occupiedSlots.map(d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })).join(', ')}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Tipo de Treino</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                        >
                            <option value="Musculação">Musculação</option>
                            <option value="Cardio">Cardio</option>
                            <option value="Funcional">Funcional</option>
                            <option value="Avaliação">Avaliação</option>
                        </select>
                    </div>

                    <div className="pt-2">
                        <Button type="submit" className="w-full" disabled={isInvalidTime}>
                            {isInvalidTime ? 'Horário Indisponível' : 'Solicitar Agendamento'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
