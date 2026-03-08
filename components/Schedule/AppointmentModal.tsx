import React, { useState, useEffect } from 'react';
import { Appointment } from '../../services/scheduleService';
import { Timestamp } from 'firebase/firestore';
import { Button, Input } from '../UIComponents';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Appointment, 'id' | 'trainerId'>) => void;
    appointment?: Appointment | null;
    students: { id: string; name: string }[];
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    appointment,
    students
}) => {
    const [formData, setFormData] = useState({
        studentId: '',
        studentName: '',
        date: '',
        time: '',
        duration: 60,
        type: 'Musculação',
        status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled' | 'reschedule_pending',
        notes: '',
        location: ''
    });

    useEffect(() => {
        if (appointment) {
            const aptDate = appointment.date.toDate();
            setFormData({
                studentId: appointment.studentId || '',
                studentName: appointment.studentName,
                date: aptDate.toISOString().split('T')[0],
                time: aptDate.toTimeString().slice(0, 5),
                duration: appointment.duration || 60,
                type: appointment.type,
                status: appointment.status,
                notes: appointment.notes || '',
                location: appointment.location || ''
            });
        } else {
            // Reset to defaults
            const now = new Date();
            setFormData({
                studentId: '',
                studentName: '',
                date: now.toISOString().split('T')[0],
                time: '09:00',
                duration: 60,
                type: 'Musculação',
                status: 'scheduled',
                notes: '',
                location: ''
            });
        }
    }, [appointment, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Combine date and time
        const dateTime = new Date(`${formData.date}T${formData.time}`);

        onSubmit({
            studentId: formData.studentId || undefined,
            studentName: formData.studentName,
            date: Timestamp.fromDate(dateTime),
            duration: formData.duration,
            type: formData.type,
            status: formData.status,
            notes: formData.notes || undefined,
            location: formData.location || undefined
        });
        onClose();
    };

    const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const student = students.find(s => s.id === e.target.value);
        setFormData({
            ...formData,
            studentId: e.target.value,
            studentName: student?.name || ''
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-background-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                        {appointment ? 'Editar Aula' : 'Nova Aula'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Student Selection */}
                        <div className="col-span-2">
                            <label className="text-sm text-gray-400 ml-1 mb-2 block">Aluno</label>
                            <select
                                value={formData.studentId}
                                onChange={handleStudentChange}
                                className="w-full glass-input"
                                required
                            >
                                <option value="">Selecione um aluno</option>
                                {students.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="text-sm text-gray-400 ml-1 mb-2 block">Data</label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e: any) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        {/* Time */}
                        <div>
                            <label className="text-sm text-gray-400 ml-1 mb-2 block">Hora</label>
                            <Input
                                type="time"
                                value={formData.time}
                                onChange={(e: any) => setFormData({ ...formData, time: e.target.value })}
                                required
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="text-sm text-gray-400 ml-1 mb-2 block">Tipo</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full glass-input"
                            >
                                <option>Musculação</option>
                                <option>Cardio</option>
                                <option>Funcional</option>
                                <option>Avaliação</option>
                                <option>Outro</option>
                            </select>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="text-sm text-gray-400 ml-1 mb-2 block">Duração (min)</label>
                            <Input
                                type="number"
                                value={formData.duration}
                                onChange={(e: any) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                min="15"
                                step="15"
                            />
                        </div>

                        {/* Status (only when editing) */}
                        {appointment && (
                            <div className="col-span-2">
                                <label className="text-sm text-gray-400 ml-1 mb-2 block">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full glass-input"
                                >
                                    <option value="scheduled">Agendado</option>
                                    <option value="completed">Concluído</option>
                                    <option value="cancelled">Cancelado</option>
                                    <option value="reschedule_pending">Troca Solicitada</option>
                                </select>
                            </div>
                        )}

                        {/* Location */}
                        <div className="col-span-2">
                            <label className="text-sm text-gray-400 ml-1 mb-2 block">Local (opcional)</label>
                            <Input
                                value={formData.location}
                                onChange={(e: any) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Ex: Academia XYZ"
                            />
                        </div>

                        {/* Notes */}
                        <div className="col-span-2">
                            <label className="text-sm text-gray-400 ml-1 mb-2 block">Observações (opcional)</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full glass-input min-h-[80px] resize-y"
                                placeholder="Notas sobre a aula..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" className="flex-1">
                            {appointment ? 'Salvar Alterações' : 'Criar Aula'}
                        </Button>
                    </div>
                </form>
            </div >
        </div >
    );
};
