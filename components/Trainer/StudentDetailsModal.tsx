import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../UIComponents';
import { Student } from '../../types';
import { studentService } from '../../services/studentService';

interface StudentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({ isOpen, onClose, student }) => {
    const [activeTab, setActiveTab] = useState<'perfil' | 'historico'>('perfil');
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (isOpen && student && activeTab === 'historico') {
            loadHistory();
        }
    }, [isOpen, student, activeTab]);

    const loadHistory = async () => {
        if (!student) return;
        setLoadingHistory(true);
        try {
            const data = await studentService.getDetailedProgress(student.id);
            setHistory(data);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    if (!isOpen || !student) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="relative bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl animate-scale-in overflow-hidden flex flex-col max-h-[85vh]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-all border border-white/5 active:scale-95"
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>

                {/* Header */}
                <div className="pt-6 px-6 bg-[#1C1C1E] flex flex-col items-center border-b border-white/5 pb-6">
                    <div className="relative mb-3">
                        <img
                            src={student.avatarUrl || `https://ui-avatars.com/api/?name=${student.name}&background=random`}
                            alt={student.name}
                            className="size-20 rounded-full border-2 border-[#1C1C1E] shadow-xl object-cover ring-2 ring-[#00ff88]/20"
                        />
                        <span className={`absolute bottom-1 right-1 size-3 rounded-full border-2 border-[#1C1C1E] ${student.status === 'Ativo' ? 'bg-[#00ff88]' : 'bg-red-500'}`}></span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-0.5">{student.name}</h2>
                    <p className="text-gray-400 text-xs">{student.email || 'Email não cadastrado'}</p>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-[#2C2C2E] p-1 rounded-full mt-5 w-full max-w-[200px]">
                        <button
                            onClick={() => setActiveTab('perfil')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${activeTab === 'perfil' ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/20' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                        >
                            Perfil
                        </button>
                        <button
                            onClick={() => setActiveTab('historico')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${activeTab === 'historico' ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/20' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                        >
                            Histórico
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {activeTab === 'perfil' ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-[#2C2C2E] p-3 rounded-xl border border-white/5 text-center">
                                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Idade</span>
                                    <span className="text-lg font-bold text-white">{student.age || '--'} <span className="text-xs text-gray-500 font-normal">anos</span></span>
                                </div>
                                <div className="bg-[#2C2C2E] p-3 rounded-xl border border-white/5 text-center">
                                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Peso</span>
                                    <span className="text-lg font-bold text-white">{student.weight || '--'} <span className="text-xs text-gray-500 font-normal">kg</span></span>
                                </div>
                                <div className="bg-[#2C2C2E] p-3 rounded-xl border border-white/5 text-center">
                                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Altura</span>
                                    <span className="text-lg font-bold text-white">{student.height || '--'} <span className="text-xs text-gray-500 font-normal">m</span></span>
                                </div>
                            </div>

                            {/* Goal */}
                            <div className="bg-[#2C2C2E]/50 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-[#00ff88] text-sm">flag</span>
                                    <h3 className="font-bold text-white text-xs uppercase tracking-wide">Objetivo</h3>
                                </div>
                                <p className="text-gray-300 text-sm">{student.goal || 'Não definido'}</p>
                            </div>

                            {/* Injuries */}
                            {student.injuries && (
                                <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-red-400 text-sm">medical_services</span>
                                        <h3 className="font-bold text-red-400 text-xs uppercase tracking-wide">Lesões</h3>
                                    </div>
                                    <p className="text-red-200/80 text-sm">{student.injuries}</p>
                                </div>
                            )}


                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            {loadingHistory ? (
                                <div className="text-center py-8 text-gray-500">Carregando...</div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    Nenhum histórico encontrado.
                                </div>
                            ) : (
                                <div className="relative border-l border-white/10 ml-3 my-2 space-y-6">
                                    {history.map((log) => (
                                        <div key={log.id} className="ml-6 relative group">
                                            <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#1C1C1E] border-2 border-[#00ff88] z-10"></div>
                                            <div className="bg-[#2C2C2E] rounded-xl border border-white/5 overflow-hidden">
                                                {/* Header */}
                                                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                                    <span className="text-[#00ff88] font-bold text-sm uppercase">
                                                        {log.date?.toDate ? log.date.toDate().toLocaleDateString('pt-BR') : 'Data desc.'}
                                                    </span>
                                                    {log.weight && <span className="text-white font-bold">{log.weight}kg</span>}
                                                </div>

                                                <div className="p-4 space-y-4">
                                                    {/* Composition */}
                                                    {(log.bodyFat || log.muscleMass) && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {log.bodyFat && (
                                                                <div className="bg-black/20 p-2 rounded-lg text-center">
                                                                    <span className="text-[10px] text-gray-500 uppercase block">Gordura</span>
                                                                    <span className="text-white font-bold">{log.bodyFat}%</span>
                                                                </div>
                                                            )}
                                                            {log.muscleMass && (
                                                                <div className="bg-black/20 p-2 rounded-lg text-center">
                                                                    <span className="text-[10px] text-gray-500 uppercase block">Massa Musc.</span>
                                                                    <span className="text-white font-bold">{log.muscleMass}kg</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Measurements */}
                                                    {log.measurements && Object.keys(log.measurements).length > 0 && (
                                                        <div>
                                                            <h4 className="text-[10px] uppercase text-gray-500 font-bold mb-2 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[12px]">straighten</span> Medidas (cm)
                                                            </h4>
                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                {log.measurements.chest && <div className="flex justify-between bg-white/5 p-2 rounded"><span>Peitoral</span> <span className="text-white">{log.measurements.chest}</span></div>}
                                                                {log.measurements.waist && <div className="flex justify-between bg-white/5 p-2 rounded"><span>Cintura</span> <span className="text-white">{log.measurements.waist}</span></div>}
                                                                {log.measurements.hips && <div className="flex justify-between bg-white/5 p-2 rounded"><span>Quadril</span> <span className="text-white">{log.measurements.hips}</span></div>}
                                                                {log.measurements.armRight && <div className="flex justify-between bg-white/5 p-2 rounded"><span>Braço Dir.</span> <span className="text-white">{log.measurements.armRight}</span></div>}
                                                                {log.measurements.armLeft && <div className="flex justify-between bg-white/5 p-2 rounded"><span>Braço Esq.</span> <span className="text-white">{log.measurements.armLeft}</span></div>}
                                                                {log.measurements.thighRight && <div className="flex justify-between bg-white/5 p-2 rounded"><span>Coxa Dir.</span> <span className="text-white">{log.measurements.thighRight}</span></div>}
                                                                {log.measurements.thighLeft && <div className="flex justify-between bg-white/5 p-2 rounded"><span>Coxa Esq.</span> <span className="text-white">{log.measurements.thighLeft}</span></div>}
                                                                {log.measurements.calfRight && <div className="flex justify-between bg-white/5 p-2 rounded"><span>Panturrilha D.</span> <span className="text-white">{log.measurements.calfRight}</span></div>}
                                                                {log.measurements.calfLeft && <div className="flex justify-between bg-white/5 p-2 rounded"><span>Panturrilha E.</span> <span className="text-white">{log.measurements.calfLeft}</span></div>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Habits */}
                                                    {(log.sleepQuality || log.dailyEnergy || log.stressLevel || log.hydration) && (
                                                        <div>
                                                            <h4 className="text-[10px] uppercase text-gray-500 font-bold mb-2 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[12px]">favorite</span> Hábitos
                                                            </h4>
                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                {log.sleepQuality && <div className="flex justify-between bg-white/5 p-2 rounded"><span>Sono</span> <span className="text-white">{log.sleepQuality}/10</span></div>}
                                                                {log.dailyEnergy && <div className="flex justify-between bg-white/5 p-2 rounded"><span>Energia</span> <span className="text-white">{log.dailyEnergy}/10</span></div>}
                                                                {log.stressLevel && <div className="flex justify-between bg-white/5 p-2 rounded"><span>Estresse</span> <span className="text-white">{log.stressLevel}/10</span></div>}
                                                                {log.hydration && <div className="flex justify-between bg-white/5 p-2 rounded"><span>Água</span> <span className="text-white">{log.hydration}L</span></div>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Notes */}
                                                    {log.notes && (
                                                        <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                                                            <h4 className="text-[10px] uppercase text-yellow-500/80 font-bold mb-1 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[12px]">sticky_note_2</span> Notas
                                                            </h4>
                                                            <p className="text-yellow-100 text-xs italic leading-relaxed">"{log.notes}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 pt-0 bg-[#1C1C1E] border-t border-white/5 mt-auto">
                    <Button
                        className="w-full bg-[#00ff88] hover:bg-[#00cc6a] text-[#0f172a] font-bold py-3.5 rounded-xl shadow-lg shadow-[#00ff88]/10 transition-all active:scale-95 text-sm"
                        onClick={() => window.open(`mailto:${student.email}`)}
                    >
                        <span className="material-symbols-outlined mr-2 text-lg">mail</span> Enviar Mensagem
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
