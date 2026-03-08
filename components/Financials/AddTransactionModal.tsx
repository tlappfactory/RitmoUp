import React, { useState } from 'react';
import { Student, FinancialRecord, PaymentMethod } from '../../types';
import { Timestamp } from 'firebase/firestore';
import { addMonths } from 'date-fns';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: any | any[], id?: string) => Promise<void>;
    students: Student[];
    trainerId: string;
    initialData?: FinancialRecord | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSave, students, trainerId, initialData }) => {
    const [studentId, setStudentId] = useState(initialData?.studentId || '');
    const [manualStudentName, setManualStudentName] = useState('');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [date, setDate] = useState(
        initialData?.date
            ? (initialData.date.toDate ? initialData.date.toDate().toISOString().split('T')[0] : new Date(initialData.date).toISOString().split('T')[0])
            : new Date().toISOString().split('T')[0]
    );
    const [status, setStatus] = useState<'Pago' | 'Pendente'>(initialData?.status as 'Pago' | 'Pendente' || 'Pendente');
    const [method, setMethod] = useState<PaymentMethod | 'DINHEIRO'>(initialData?.method || 'PIX');

    // Recurring State
    const [chargeType, setChargeType] = useState<'avulso' | 'recorrente'>('avulso');
    const [periodicity, setPeriodicity] = useState<'Mensal' | 'Trimestral' | 'Semestral' | 'Anual'>('Mensal');
    const [occurrences, setOccurrences] = useState(12);

    const [loading, setLoading] = useState(false);

    // Update state when initialData changes
    React.useEffect(() => {
        if (isOpen) {
            setStudentId(initialData?.studentId || '');
            setAmount(initialData?.amount?.toString() || '');
            setDescription(initialData?.description || '');
            setDate(
                initialData?.date
                    ? (initialData.date.toDate ? initialData.date.toDate().toISOString().split('T')[0] : new Date(initialData.date).toISOString().split('T')[0])
                    : new Date().toISOString().split('T')[0]
            );
            setStatus(initialData?.status as 'Pago' | 'Pendente' || 'Pendente');
            setMethod(initialData?.method || 'PIX');
            setChargeType('avulso'); // Default to single when editing or new
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const student = students.find(s => s.id === studentId);

        const isManual = studentId === 'manual';
        const finalStudentName = isManual ? manualStudentName : (student ? student.name : 'Aluno Avulso');
        const finalAvatarUrl = isManual
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(manualStudentName)}&background=random`
            : student?.avatarUrl;

        const baseRecord = {
            trainerId,
            studentId: isManual ? 'manual' : (studentId || 'avulso'),
            studentName: finalStudentName,
            amount: parseFloat(amount.replace(',', '.')),
            description,
            status,
            method: method as any,
            type: 'income',
            avatarUrl: finalAvatarUrl
        };

        try {
            if (chargeType === 'recorrente' && !initialData) {
                const records = [];
                const startDate = new Date(date);
                const recurrenceId = Date.now().toString();

                for (let i = 0; i < occurrences; i++) {
                    let nextDate = new Date(startDate);
                    if (periodicity === 'Mensal') nextDate = addMonths(startDate, i);
                    else if (periodicity === 'Trimestral') nextDate = addMonths(startDate, i * 3);
                    else if (periodicity === 'Semestral') nextDate = addMonths(startDate, i * 6);
                    else if (periodicity === 'Anual') nextDate = addMonths(startDate, i * 12);

                    records.push({
                        ...baseRecord,
                        date: Timestamp.fromDate(nextDate),
                        recurrenceId,
                        description: `${description} (${i + 1}/${occurrences})`
                    });
                }
                await onSave(records);
            } else {
                await onSave({
                    ...baseRecord,
                    date: Timestamp.fromDate(new Date(date))
                }, initialData?.id);
            }

            onClose();
            // Reset form
            setStudentId('');
            setAmount('');
            setDescription('');
            setStatus('Pendente');
            setChargeType('avulso');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#333] shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-[#333] flex justify-between items-center">
                    <h2 className="text-xl font-bold">{initialData ? 'Editar Transação' : 'Nova Transação'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {!initialData && (
                        <div className="flex bg-[#2a2a2a] p-1 rounded-lg mb-4">
                            <button
                                type="button"
                                onClick={() => setChargeType('avulso')}
                                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${chargeType === 'avulso' ? 'bg-[#333] text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                Avulsa
                            </button>
                            <button
                                type="button"
                                onClick={() => setChargeType('recorrente')}
                                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${chargeType === 'recorrente' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                Recorrente
                            </button>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Aluno</label>
                        <select
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            required
                            className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        >
                            <option value="">Selecione um aluno...</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} {s.isRegistered ? '📱' : '(Manual)'}
                                </option>
                            ))}
                            <option value="manual">+ Outro (Inserir Manualmente)</option>
                        </select>
                    </div>

                    {studentId === 'manual' && (
                        <div className="animate-fade-in">
                            <label className="block text-xs text-gray-400 mb-1">Nome do Aluno</label>
                            <input
                                type="text"
                                value={manualStudentName}
                                onChange={(e) => setManualStudentName(e.target.value)}
                                placeholder="Nome do aluno"
                                required
                                className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Descrição</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Mensalidade"
                            required
                            className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0,00"
                                required
                                className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">
                                {chargeType === 'recorrente' ? 'Início' : 'Data'}
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>

                    {chargeType === 'recorrente' && !initialData && (
                        <div className="grid grid-cols-2 gap-4 bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                            <div>
                                <label className="block text-xs text-purple-300 mb-1">Periodicidade</label>
                                <select
                                    value={periodicity}
                                    onChange={(e) => setPeriodicity(e.target.value as any)}
                                    className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                >
                                    <option value="Mensal">Mensal</option>
                                    <option value="Trimestral">Trimestral</option>
                                    <option value="Semestral">Semestral</option>
                                    <option value="Anual">Anual</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-purple-300 mb-1">Repetições</label>
                                <input
                                    type="number"
                                    min="2"
                                    max="60"
                                    value={occurrences}
                                    onChange={(e) => setOccurrences(parseInt(e.target.value))}
                                    className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="col-span-2 text-xs text-purple-300/70 text-center">
                                Será cobrado {occurrences}x {periodicity.toLowerCase()}.
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                            >
                                <option value="Pendente">Pendente</option>
                                <option value="Pago">Pago</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Forma de Pagto</label>
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value as any)}
                                className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                            >
                                <option value="PIX">PIX</option>
                                <option value="CREDIT_CARD">Cartão de Crédito</option>
                                <option value="DINHEIRO">Dinheiro</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
