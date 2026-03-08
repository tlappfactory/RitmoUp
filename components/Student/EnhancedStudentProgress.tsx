import React, { useState, useEffect } from 'react';
import { Card, Button } from '../UIComponents';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../ToastContext';
import { DashboardLayout } from '../Layout';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressEntry } from '../../types';

export const EnhancedStudentProgress = ({ embedded }: { embedded?: boolean }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState<'upper' | 'lower'>('upper');
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (user?.id) {
                try {
                    const { studentService } = await import('../../services/studentService');
                    const data: any[] = await studentService.getDetailedProgress(user.id);

                    // Normalize dates
                    const normalized = data.map(entry => {
                        let d = new Date();
                        if (entry.date?.toDate) d = entry.date.toDate();
                        else if (entry.date?.seconds) d = new Date(entry.date.seconds * 1000);

                        // Fix Timezone Issue: Interpret UTC date as Local date to avoid -1 day error
                        // This forces the displayed date to match the stored calendar date regardless of browser timezone
                        const localDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);

                        return { ...entry, dateObj: localDate };
                    }).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime()); // Ensure desc order

                    setProgressEntries(normalized);
                } catch (error) {
                    console.error("Failed to load progress", error);
                    showToast('Erro ao carregar progresso', 'error');
                } finally {
                    setLoading(false);
                }
            }
        };
        loadData();
    }, [user]);

    if (loading) {
        const loadingContent = (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500">Carregando sua evolução...</p>
            </div>
        );
        return embedded ? loadingContent : <DashboardLayout title="Minha Evolução">{loadingContent}</DashboardLayout>;
    }

    const latest = progressEntries[0] || {};
    const first = progressEntries[progressEntries.length - 1] || {};

    // Calculate Totals / Deltas
    const weightChange = latest.weight && first.weight ? (latest.weight - first.weight).toFixed(1) : '0';
    const muscleChange = latest.muscleMass && first.muscleMass ? (latest.muscleMass - first.muscleMass).toFixed(1) : '0';
    const fatChange = latest.bodyFat && first.bodyFat ? (latest.bodyFat - first.bodyFat).toFixed(1) : '0';

    // BMI Calculation
    const studentHeight = (user as any)?.height || 0;
    const currentBMI = studentHeight > 0 && latest.weight ? (latest.weight / (studentHeight * studentHeight)).toFixed(1) : 'N/A';

    const getBMIStatus = (bmi: string) => {
        const num = parseFloat(bmi);
        if (isNaN(num)) return { label: '-', color: 'gray' };
        if (num < 18.5) return { label: 'Abaixo do peso', color: 'blue' };
        if (num < 24.9) return { label: 'Peso normal', color: 'green' };
        if (num < 29.9) return { label: 'Sobrepeso', color: 'yellow' };
        return { label: 'Obesidade', color: 'red' };
    };

    const bmiStatus = getBMIStatus(currentBMI);

    // Prepare Chart Data (Time Ascending for Charts)
    const chartData = [...progressEntries].reverse().map(e => ({
        date: format(e.dateObj, 'dd/MM', { locale: ptBR }),
        weight: e.weight,
        bodyFat: e.bodyFat,
        muscleMass: e.muscleMass,
        // Upper Body
        chest: e.measurements?.chest,
        shoulders: e.measurements?.shoulders, // If available
        arms: ((e.measurements?.armRight || 0) + (e.measurements?.armLeft || 0)) / 2 || undefined,
        waist: e.measurements?.waist,
        // Lower Body
        hips: e.measurements?.hips,
        thighs: ((e.measurements?.thighRight || 0) + (e.measurements?.thighLeft || 0)) / 2 || undefined,
        calves: ((e.measurements?.calfRight || 0) + (e.measurements?.calfLeft || 0)) / 2 || undefined,
    }));

    const StatCard = ({ title, value, unit, icon, color, subtitle, trend }: any) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-card p-3 md:p-5 relative overflow-hidden group hover:border-${color}-500/50 transition-all duration-300`}
        >
            <div className={`absolute -right-4 -top-4 p-8 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-all`}></div>

            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className={`p-2 rounded-lg bg-${color}-500/20 text-${color}-400`}>
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${parseFloat(trend) > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {parseFloat(trend) > 0 ? '+' : ''}{trend}
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">{title}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{value ?? '-'}</span>
                    <span className="text-xs md:text-sm text-gray-500 font-medium">{unit}</span>
                </div>
                {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
        </motion.div>
    );

    const content = (
        <>
            <div className={`space-y-6 md:space-y-8 max-w-7xl mx-auto ${!embedded ? 'pb-10' : ''}`}>

                {/* Top Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    <StatCard
                        title="Peso Atual"
                        value={latest.weight}
                        unit="kg"
                        icon="monitor_weight"
                        color="blue"
                        trend={weightChange !== '0' ? `${weightChange} kg` : null}
                    />
                    <StatCard
                        title="Gordura"
                        value={latest.bodyFat}
                        unit="%"
                        icon="donut_small"
                        color="yellow"
                        trend={fatChange !== '0' ? `${fatChange}%` : null}
                    />
                    <StatCard
                        title="Massa Musc."
                        value={latest.muscleMass}
                        unit="kg"
                        icon="fitness_center"
                        color="red"
                        trend={muscleChange !== '0' ? `${muscleChange} kg` : null}
                    />
                    <StatCard
                        title="IMC"
                        value={currentBMI}
                        unit=""
                        icon="accessibility"
                        color={bmiStatus.color}
                        subtitle={bmiStatus.label}
                    />
                    <div className="hidden lg:block">
                        <StatCard
                            title="Registros"
                            value={progressEntries.length}
                            unit=""
                            icon="history"
                            color="purple"
                            subtitle="Total de aferições"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Composition Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6 lg:col-span-2 border border-white/5"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">analytics</span>
                                Composição Corporal
                            </h3>
                            <div className="flex gap-2">
                                {/* Future: Time range selector */}
                            </div>
                        </div>
                        <div className="h-[250px] md:h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorMuscle" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend iconType="circle" />
                                    <Area type="monotone" dataKey="weight" name="Peso Total (kg)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                                    <Area type="monotone" dataKey="muscleMass" name="Massa Muscular (kg)" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorMuscle)" />
                                    <Line type="monotone" dataKey="bodyFat" name="Gordura (%)" stroke="#eab308" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Additional Stats / Summary Column */}
                    <div className="space-y-6">
                        {/* Measurement Split Charts */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card p-6 border border-white/5 h-full flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-pink-400">straighten</span>
                                    Medidas (cm)
                                </h3>
                                <div className="bg-white/5 p-1 rounded-lg flex text-xs">
                                    <button
                                        onClick={() => setSelectedMetric('upper')}
                                        className={`px-3 py-1 rounded-md transition-all ${selectedMetric === 'upper' ? 'bg-primary text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Sup.
                                    </button>
                                    <button
                                        onClick={() => setSelectedMetric('lower')}
                                        className={`px-3 py-1 rounded-md transition-all ${selectedMetric === 'lower' ? 'bg-primary text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Inf.
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 w-full min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '10px' }} />

                                        {selectedMetric === 'upper' ? (
                                            <>
                                                <Line type="monotone" dataKey="chest" name="Peito" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="waist" name="Cintura" stroke="#d946ef" strokeWidth={2} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="arms" name="Braço" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                                            </>
                                        ) : (
                                            <>
                                                <Line type="monotone" dataKey="hips" name="Quadril" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="thighs" name="Coxa (méd)" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="calves" name="Panturrilha" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                                            </>
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Photos Gallery (If Any) */}
                {progressEntries.some(e => e.photos && e.photos.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-6"
                    >
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">photo_camera</span>
                            Galeria de Evolução
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {progressEntries.filter(e => e.photos && e.photos.length > 0).map((entry, idx) => (
                                <div key={idx} className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer" onClick={() => setSelectedPhoto(entry.photos![0])}>
                                    <img src={entry.photos![0]} alt={`Evolução ${format(entry.dateObj, 'dd/MM')}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white font-bold text-sm">{format(entry.dateObj, 'dd/MM/yy')}</p>
                                        <p className="text-gray-300 text-xs">{entry.weight} kg</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Detailed Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="glass-card overflow-hidden"
                >
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-lg">Histórico Detalhado</h3>
                        <Button variant="outline" className="text-xs h-8">Exportar PDF</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-500 bg-gray-50/50 dark:bg-white/5 uppercase text-xs">
                                <tr>
                                    <th className="px-3 py-3 md:px-6 md:py-4">Data</th>
                                    <th className="px-3 py-3 md:px-6 md:py-4">Peso</th>
                                    <th className="px-3 py-3 md:px-6 md:py-4">Gordura</th>
                                    <th className="hidden md:table-cell px-6 py-4">Sonolência</th>
                                    <th className="px-3 py-3 md:px-6 md:py-4">Medidas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5 text-gray-700 dark:text-gray-300">
                                {progressEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-3 py-3 md:px-6 md:py-4 font-medium flex items-center gap-2 text-xs md:text-sm">
                                            {format(entry.dateObj, 'dd/MM')}
                                            <span className="md:hidden">/</span>
                                            <span className="hidden md:inline">{format(entry.dateObj, '/yyyy')}</span>
                                            {entry.photos && entry.photos.length > 0 && <span className="material-symbols-outlined text-xs text-primary">photo</span>}
                                        </td>
                                        <td className="px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm">{entry.weight} kg</td>
                                        <td className="px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm">{entry.bodyFat}%</td>
                                        <td className="hidden md:table-cell px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <span className="text-yellow-400">★</span> {entry.sleepQuality}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500 font-mono text-[10px] md:text-xs whitespace-nowrap">
                                            {entry.measurements?.chest || '-'}/{entry.measurements?.waist || '-'}/{entry.measurements?.hips || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>

            {/* Photo Modal */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={selectedPhoto}
                            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                        />
                        <button className="absolute top-4 right-4 text-white hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-4xl">close</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );

    if (embedded) return content;

    return (
        <DashboardLayout title="Minha Evolução" showBack>
            {content}
        </DashboardLayout>
    );
};
