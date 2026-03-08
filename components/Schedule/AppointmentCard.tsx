import React from 'react';
import { Appointment } from '../../services/scheduleService';

interface AppointmentCardProps {
    appointment: Appointment;
    onEdit: () => void;
    onDelete: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onEdit, onDelete }) => {
    const aptDate = appointment.date.toDate();
    const timeStr = aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const statusColors = {
        scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
        completed: 'bg-green-500/20 text-green-400 border-green-500/50',
        cancelled: 'bg-red-500/20 text-red-400 border-red-500/50'
    };

    const typeIcons = {
        'Musculação': 'fitness_center',
        'Cardio': 'directions_run',
        'Avaliação': 'assignment',
        'Funcional': 'sports_gymnastics'
    };

    return (
        <div className="glass-card p-4 hover:border-primary/30 transition-all group">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-xl">
                            {typeIcons[appointment.type as keyof typeof typeIcons] || 'event'}
                        </span>
                    </div>
                    <div>
                        <h4 className="font-bold">{appointment.studentName}</h4>
                        <p className="text-sm text-gray-400">{timeStr} • {appointment.duration || 60} min</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onEdit}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                        title="Excluir"
                    >
                        <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
                    {appointment.type}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[appointment.status]}`}>
                    {appointment.status === 'scheduled' ? 'Agendado' :
                        appointment.status === 'completed' ? 'Concluído' : 'Cancelado'}
                </span>
            </div>

            {appointment.notes && (
                <p className="text-sm text-gray-400 mt-3 italic">"{appointment.notes}"</p>
            )}
        </div>
    );
};
