
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Input } from '../UIComponents';

interface LogProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    onSave: (data: any) => Promise<void>;
}

// Helper to render input with label
const LabeledInput = ({ label, ...props }: any) => (
    <div className="space-y-1 group">
        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 block group-focus-within:text-[#00ff88] transition-colors">{label}</label>
        <Input {...props} className={props.className || "bg-[#2C2C2E] border-white/5 focus:border-[#00ff88]/50 focus:ring-[#00ff88]/20"} />
    </div>
);

export const LogProgressModal: React.FC<LogProgressModalProps> = ({ isOpen, onClose, studentName, onSave }) => {
    const [activeTab, setActiveTab] = useState<'geral' | 'medidas' | 'habitos' | 'notas'>('geral');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today

    // General Stats
    // const [progress, setProgress] = useState('0'); // Removed
    const [weight, setWeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    const [muscleMass, setMuscleMass] = useState('');

    // Habits
    const [habits, setHabits] = useState({
        sleepQuality: '',
        dailyEnergy: '',
        stressLevel: '',
        hydration: '',
        progressSatisfaction: ''
    });

    // Measurements
    const [measurements, setMeasurements] = useState({
        chest: '',
        armRight: '',
        armLeft: '',
        waist: '',
        hips: '',
        thighRight: '',
        thighLeft: '',
        calfRight: '',
        calfLeft: '',
    });

    // Notes
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const data = {
                date: date, // Pass selected date
                // progress: parseInt(progress), // Removed
                weight: weight ? parseFloat(weight) : undefined,
                bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
                muscleMass: muscleMass ? parseFloat(muscleMass) : undefined,
                sleepQuality: habits.sleepQuality ? parseInt(habits.sleepQuality) : undefined,
                dailyEnergy: habits.dailyEnergy ? parseInt(habits.dailyEnergy) : undefined,
                stressLevel: habits.stressLevel ? parseInt(habits.stressLevel) : undefined,
                hydration: habits.hydration ? parseFloat(habits.hydration) : undefined,
                progressSatisfaction: habits.progressSatisfaction ? parseInt(habits.progressSatisfaction) : undefined,
                measurements: Object.fromEntries(
                    Object.entries(measurements).map(([k, v]) => [k, v ? parseFloat(v as string) : undefined]).filter(([_, v]) => v !== undefined)
                ),
                notes: notes || undefined
            };

            await onSave(data);
            onClose();
            // Reset forms
            // setProgress('0');
            setWeight('');
            setBodyFat('');
            setMuscleMass('');
            setHabits({ sleepQuality: '', dailyEnergy: '', stressLevel: '', hydration: '', progressSatisfaction: '' });
            setNotes('');
            setMeasurements({
                chest: '', armRight: '', armLeft: '', waist: '', hips: '', thighRight: '', thighLeft: '', calfRight: '', calfLeft: ''
            });
            setActiveTab('geral');
            setDate(new Date().toISOString().split('T')[0]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMeasurementChange = (field: keyof typeof measurements, value: string) => {
        setMeasurements(prev => ({ ...prev, [field]: value }));
    };

    const handleHabitChange = (field: keyof typeof habits, value: string) => {
        setHabits(prev => ({ ...prev, [field]: value }));
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
                <div className="p-6 pb-2 border-b border-white/5">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-bold mb-1 text-white">Nova Evolução</h2>
                            <p className="text-sm text-gray-400">Aluno: <span className="text-[#00ff88]">{studentName}</span></p>
                        </div>
                        {/* Date Picker */}
                        <div className="flex flex-col items-end">
                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Data da Avaliação</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-[#2C2C2E] text-white text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-[#00ff88] outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-6 gap-6 mt-4 overflow-x-auto no-scrollbar">
                    {['geral', 'medidas', 'habitos', 'notas'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-3 text-sm font-bold capitalize transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-[#00ff88]' : 'text-gray-500 hover:text-white'}`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#00ff88] shadow-[0_0_10px_#00ff88] rounded-t-full" />}
                        </button>
                    ))}
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {activeTab === 'geral' && (
                        <div className="space-y-6 animate-fade-in">


                            <h3 className="text-xs uppercase text-gray-500 font-bold ml-1">Composição Corporal</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <LabeledInput label="Peso (kg)" placeholder="0.0" type="number" value={weight} onChange={(e: any) => setWeight(e.target.value)} />
                                <LabeledInput label="Gordura (%)" placeholder="0.0" type="number" value={bodyFat} onChange={(e: any) => setBodyFat(e.target.value)} />
                                <LabeledInput label="Massa Musc. (kg)" placeholder="0.0" type="number" value={muscleMass} onChange={(e: any) => setMuscleMass(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'medidas' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-[#2C2C2E]/30 p-4 rounded-xl border border-white/5">
                                <h3 className="text-xs uppercase text-[#00ff88] font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">accessibility_new</span> Membros Superiores (cm)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <LabeledInput label="Peitoral" placeholder="0" type="number" value={measurements.chest} onChange={(e: any) => handleMeasurementChange('chest', e.target.value)} />
                                    <LabeledInput label="Cintura" placeholder="0" type="number" value={measurements.waist} onChange={(e: any) => handleMeasurementChange('waist', e.target.value)} />
                                    <LabeledInput label="Braço Dir." placeholder="0" type="number" value={measurements.armRight} onChange={(e: any) => handleMeasurementChange('armRight', e.target.value)} />
                                    <LabeledInput label="Braço Esq." placeholder="0" type="number" value={measurements.armLeft} onChange={(e: any) => handleMeasurementChange('armLeft', e.target.value)} />
                                </div>
                            </div>

                            <div className="bg-[#2C2C2E]/30 p-4 rounded-xl border border-white/5">
                                <h3 className="text-xs uppercase text-[#00ff88] font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">directions_walk</span> Membros Inferiores (cm)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <LabeledInput label="Quadril" placeholder="0" type="number" value={measurements.hips} onChange={(e: any) => handleMeasurementChange('hips', e.target.value)} />
                                    <div />
                                    <LabeledInput label="Coxa Dir." placeholder="0" type="number" value={measurements.thighRight} onChange={(e: any) => handleMeasurementChange('thighRight', e.target.value)} />
                                    <LabeledInput label="Coxa Esq." placeholder="0" type="number" value={measurements.thighLeft} onChange={(e: any) => handleMeasurementChange('thighLeft', e.target.value)} />
                                    <LabeledInput label="Panturrilha Dir." placeholder="0" type="number" value={measurements.calfRight} onChange={(e: any) => handleMeasurementChange('calfRight', e.target.value)} />
                                    <LabeledInput label="Panturrilha Esq." placeholder="0" type="number" value={measurements.calfLeft} onChange={(e: any) => handleMeasurementChange('calfLeft', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'habitos' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <LabeledInput label="Qualidade Sono (0-10)" placeholder="0-10" type="number" min="0" max="10" value={habits.sleepQuality} onChange={(e: any) => handleHabitChange('sleepQuality', e.target.value)} />
                                <LabeledInput label="Energia Diária (0-10)" placeholder="0-10" type="number" min="0" max="10" value={habits.dailyEnergy} onChange={(e: any) => handleHabitChange('dailyEnergy', e.target.value)} />
                                <LabeledInput label="Nível Estresse (0-10)" placeholder="0-10" type="number" min="0" max="10" value={habits.stressLevel} onChange={(e: any) => handleHabitChange('stressLevel', e.target.value)} />
                                <LabeledInput label="Satisfação (0-10)" placeholder="0-10" type="number" min="0" max="10" value={habits.progressSatisfaction} onChange={(e: any) => handleHabitChange('progressSatisfaction', e.target.value)} />
                                <LabeledInput label="Hidratação Diária (L)" placeholder="0.0" type="number" value={habits.hydration} onChange={(e: any) => handleHabitChange('hydration', e.target.value)} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'notas' && (
                        <div className="animate-fade-in h-full flex flex-col">
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-2 block">Observações Gerais</label>
                            <textarea
                                className="w-full flex-1 bg-[#2C2C2E] border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-[#00ff88]/50 resize-dashed transition-colors placeholder-gray-600 text-sm leading-relaxed"
                                placeholder="Registre aqui detalhes importantes sobre a evolução do aluno, feedback sobre treinos ou pontos de atenção..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-3 p-6 border-t border-white/5 bg-[#1C1C1E] rounded-b-3xl">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1 border-white/10 hover:bg-white/5">
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-[#00ff88] hover:bg-[#00cc6a] text-[#0f172a] font-bold shadow-lg shadow-[#00ff88]/10">
                        {isSubmitting ? 'Salvando...' : 'Salvar Evolução'}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

