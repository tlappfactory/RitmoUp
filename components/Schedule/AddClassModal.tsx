import React, { useState } from 'react';
import { Student } from '../../types';

interface AddClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: Student[];
    onSchedule: (studentId: string, studentName: string, date: Date | Date[], type: string) => Promise<void>;
}

export const AddClassModal: React.FC<AddClassModalProps> = ({ isOpen, onClose, students, onSchedule }) => {
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState('Musculação');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Recurrence state
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
    const [weekendMode, setWeekendMode] = useState('weekdays'); // 'weekdays', 'include_weekend', 'only_saturday', 'sat_sun'


    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !date || !time) return;
        if (isRecurring && !recurrenceEndDate) return;

        setIsSubmitting(true);
        try {
            const student = students.find(s => s.id === selectedStudentId);
            if (!student) return;

            const startDateTime = new Date(`${date}T${time}`);
            let datesToSchedule: Date[] = [startDateTime];

            if (isRecurring && recurrenceEndDate) {
                const endDateTime = new Date(`${recurrenceEndDate}T${time}`);
                let currentDate = new Date(startDateTime);
                currentDate.setDate(currentDate.getDate() + 1); // Start checking from tomorrow

                while (currentDate <= endDateTime) {
                    const day = currentDate.getDay(); // 0 = Sun, 6 = Sat
                    let shouldAdd = false;

                    // Logic based on user request:
                    // "Default" (implied week days only? No, user only gave 3 options for recurrence: include weekend, only sat, sat & sun)
                    // Let's assume the base is Mon-Fri.

                    if (day >= 1 && day <= 5) {
                        shouldAdd = true; // Always include weekdays
                    } else if (day === 6) {
                        // Saturday
                        if (weekendMode === 'only_saturday' || weekendMode === 'sat_sun' || weekendMode === 'include_weekend' || weekendMode === 'every_saturday') shouldAdd = true;
                    } else if (day === 0) {
                        // Sunday
                        if (weekendMode === 'sat_sun' || weekendMode === 'include_weekend') shouldAdd = true;
                    }

                    if (shouldAdd) {
                        datesToSchedule.push(new Date(currentDate));
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }

            await onSchedule(student.id, student.name, datesToSchedule, type);
            onClose();
            // Reset form
            setSelectedStudentId('');
            setDate('');
            setTime('');
            setType('Musculação');
            setIsRecurring(false);
            setRecurrenceEndDate('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Agendar Aula</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Aluno</label>
                        <select
                            className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl h-12 px-4 outline-none focus:border-primary transition-colors text-white appearance-none cursor-pointer"
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            required
                        >
                            <option value="">Selecione um aluno</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Data Início</label>
                            <input
                                type="date"
                                className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl h-12 px-4 outline-none focus:border-primary transition-colors text-white scheme-dark"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Hora</label>
                            <input
                                type="time"
                                className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl h-12 px-4 outline-none focus:border-primary transition-colors text-white scheme-dark"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Recurrence Toggle */}
                    <div className="flex items-center gap-3 py-2">
                        <input
                            type="checkbox"
                            id="recurring"
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                            className="w-5 h-5 accent-primary rounded cursor-pointer"
                        />
                        <label htmlFor="recurring" className="text-sm text-gray-300 font-bold cursor-pointer select-none">
                            Aula Recorrente (Diária)
                        </label>
                    </div>

                    {isRecurring && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Repetir até</label>
                                <input
                                    type="date"
                                    className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl h-12 px-4 outline-none focus:border-primary transition-colors text-white scheme-dark"
                                    value={recurrenceEndDate}
                                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                    min={date}
                                    required={isRecurring}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Dias da Semana</label>
                                <select
                                    className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl h-12 px-4 outline-none focus:border-primary transition-colors text-white appearance-none cursor-pointer"
                                    value={weekendMode}
                                    onChange={(e) => setWeekendMode(e.target.value)}
                                >
                                    <option value="weekdays">Apenas Dias Úteis (Seg-Sex)</option>
                                    <option value="include_weekend">Incluir Final de Semana (Todos os dias)</option>
                                    <option value="only_saturday">Somente Sábado (Seg-Sáb)</option>
                                    <option value="sat_sun">Sábado e Domingo (Todos os dias)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Tipo de Treino</label>
                        <select
                            className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl h-12 px-4 outline-none focus:border-primary transition-colors text-white appearance-none cursor-pointer"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="Musculação">Musculação</option>
                            <option value="Cardio">Cardio</option>
                            <option value="Avaliação">Avaliação</option>
                            <option value="Funcional">Funcional</option>
                            <option value="Crossfit">Crossfit</option>
                            <option value="Pilates">Pilates</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 rounded-xl font-bold bg-primary text-black hover:brightness-110 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Agendando...' : 'Agendar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
