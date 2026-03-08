import React, { useState } from 'react';
import { Appointment } from '../../services/scheduleService';
import { Timestamp } from 'firebase/firestore';

interface CalendarProps {
    appointments: Appointment[];
    onDateSelect: (date: Date) => void;
    selectedDate?: Date;
}

export const Calendar: React.FC<CalendarProps> = ({ appointments, onDateSelect, selectedDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const getAppointmentsForDate = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return appointments.filter(apt => {
            const aptDate = apt.date.toDate();
            return aptDate.getDate() === day &&
                aptDate.getMonth() === currentMonth.getMonth() &&
                aptDate.getFullYear() === currentMonth.getFullYear();
        });
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear();
    };

    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        return day === selectedDate.getDate() &&
            currentMonth.getMonth() === selectedDate.getMonth() &&
            currentMonth.getFullYear() === selectedDate.getFullYear();
    };

    return (
        <div className="glass-card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-sm font-bold text-gray-400 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayAppointments = getAppointmentsForDate(day);
                    const today = isToday(day);
                    const selected = isSelected(day);

                    return (
                        <button
                            key={day}
                            onClick={() => onDateSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                            className={`
                                aspect-square rounded-lg border transition-all relative p-1 flex flex-col
                                ${selected ? 'bg-primary/20 border-primary' :
                                    today ? 'bg-white/10 border-white/30' :
                                        'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}
                            `}
                        >
                            <span className={`text-sm font-bold ${today ? 'text-primary' : ''}`}>
                                {day}
                            </span>
                            {dayAppointments.length > 0 && (
                                <div className="mt-auto flex gap-0.5 flex-wrap">
                                    {dayAppointments.slice(0, 3).map((apt, idx) => (
                                        <div
                                            key={idx}
                                            className="w-1.5 h-1.5 rounded-full bg-primary"
                                            title={apt.studentName}
                                        />
                                    ))}
                                    {dayAppointments.length > 3 && (
                                        <span className="text-[10px] text-primary">+{dayAppointments.length - 3}</span>
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
