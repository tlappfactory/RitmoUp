import React from 'react';
import { FinancialRecord } from '../../types';

interface TransactionHistoryProps {
    transactions: FinancialRecord[];
    onConfirmPayment?: (id: string) => void;
    onEdit?: (record: FinancialRecord) => void;
    onDelete?: (id: string) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, onConfirmPayment, onEdit, onDelete }) => {
    const getStatusColor = (status: FinancialRecord['status']) => {
        switch (status) {
            case 'Pago': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'Pendente': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            case 'Atrasado': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'Aguardando Confirmação': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getMethodIcon = (status: FinancialRecord['status']) => {
        if (status === 'Pago') return <span className="material-symbols-outlined text-green-500 text-sm">north_east</span>;
        return <span className="material-symbols-outlined text-yellow-500 text-sm">schedule</span>;
    };

    return (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-glass-border overflow-hidden">
            <div className="p-4 border-b border-glass-border flex flex-col sm:flex-row gap-4 justify-between items-center">
                <h3 className="text-lg font-bold text-text-light dark:text-white">Histórico de Transações</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <span className="material-symbols-outlined w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm leading-none flex items-center justify-center">search</span>
                        <input
                            type="text"
                            placeholder="Buscar transação..."
                            className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-[#333] rounded-lg py-2 pl-10 pr-4 text-sm text-text-light dark:text-gray-200 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                {/* Desktop Table */}
                <table className="hidden md:table w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-[#111] text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                            <th className="p-4 font-medium">Nome / Plano</th>
                            <th className="p-4 font-medium">Data</th>
                            <th className="p-4 font-medium">Método</th>
                            <th className="p-4 font-medium">Valor</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-[#333]">
                        {transactions.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-[#333]/30 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {record.avatarUrl && (
                                            <img src={record.avatarUrl} alt={record.studentName} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#333]" />
                                        )}
                                        <div>
                                            <p className="text-text-light dark:text-white font-medium text-sm">{record.studentName}</p>
                                            <p className="text-gray-500 text-xs">{record.description}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-300 text-sm">
                                    {record.date && typeof record.date.toDate === 'function'
                                        ? record.date.toDate().toLocaleDateString('pt-BR')
                                        : (record.date ? new Date(record.date).toLocaleDateString('pt-BR') : '-')}
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-300 text-sm">{record.method === 'CREDIT_CARD' ? 'Cartão de Crédito' : record.method}</td>
                                <td className="p-4 text-text-light dark:text-white font-medium text-sm">R$ {record.amount.toFixed(2).replace('.', ',')}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(record.status)}`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        {record.status === 'Aguardando Confirmação' && onConfirmPayment && (
                                            <button
                                                onClick={() => record.id && onConfirmPayment(record.id)}
                                                className="text-xs font-bold text-green-600 dark:text-green-400 hover:text-green-500 bg-green-100 dark:bg-green-500/10 hover:bg-green-200 dark:hover:bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-500/20 transition-all flex items-center gap-1"
                                                title="Confirmar Recebimento"
                                            >
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                            </button>
                                        )}
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(record)}
                                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 bg-blue-100 dark:bg-blue-500/10 hover:bg-blue-200 dark:hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/20 transition-all flex items-center gap-1"
                                                title="Editar"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => record.id && onDelete(record.id)}
                                                className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-500 bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/20 transition-all flex items-center gap-1"
                                                title="Excluir"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-gray-200 dark:divide-[#333]">
                    {transactions.map((record) => (
                        <div key={record.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#333]/30 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    {record.avatarUrl && (
                                        <img src={record.avatarUrl} alt={record.studentName} className="size-10 rounded-full bg-gray-200 dark:bg-[#333] shrink-0" />
                                    )}
                                    <div>
                                        <p className="text-text-light dark:text-white font-medium text-sm">{record.studentName}</p>
                                        <p className="text-gray-500 text-xs">{record.description}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-medium border ${getStatusColor(record.status)}`}>
                                    {record.status}
                                </span>
                            </div>

                            <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-3 rounded-lg mb-3">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500">Valor</span>
                                    <span className="font-bold text-base text-text-light dark:text-white">R$ {record.amount.toFixed(2).replace('.', ',')}</span>
                                </div>
                                <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-2"></div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-gray-500">Data</span>
                                    <span className="font-medium text-sm text-text-light dark:text-white">
                                        {record.date && typeof record.date.toDate === 'function'
                                            ? record.date.toDate().toLocaleDateString('pt-BR')
                                            : (record.date ? new Date(record.date).toLocaleDateString('pt-BR') : '-')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                {record.status === 'Aguardando Confirmação' && onConfirmPayment && (
                                    <button
                                        onClick={() => record.id && onConfirmPayment(record.id)}
                                        className="flex-1 py-2 text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20"
                                    >
                                        Confirmar
                                    </button>
                                )}
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(record)}
                                        className="px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20"
                                    >
                                        Editar
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => record.id && onDelete(record.id)}
                                        className="px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20"
                                    >
                                        Excluir
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {transactions.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    Nenhuma transação encontrada.
                </div>
            )}
        </div>
    );
};
