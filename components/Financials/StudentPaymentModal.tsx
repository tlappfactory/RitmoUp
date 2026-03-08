import React, { useEffect, useState } from 'react';
import { FinancialRecord } from '../../types';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../ToastContext';
import { Button } from '../UIComponents';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const StudentPaymentModal: React.FC<StudentPaymentModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [payments, setPayments] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && user?.id) {
            loadPayments();
        }
    }, [isOpen, user]);

    const loadPayments = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const { financeService } = await import('../../services/financeService');
            const data = await financeService.getStudentPendingPayments(user.id);
            setPayments(data);
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar pagamentos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async (recordId: string) => {
        setProcessingId(recordId);
        try {
            const { financeService } = await import('../../services/financeService');
            await financeService.confirmPaymentByStudent(recordId);
            showToast('Pagamento informado! Aguarde a confirmação do personal.', 'success');
            // Optimistic update
            setPayments(prev => prev.map(p =>
                p.id === recordId ? { ...p, status: 'Aguardando Confirmação' as const } : p
            ));
        } catch (error) {
            console.error(error);
            showToast('Erro ao informar pagamento', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#2C2C2E]">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">payments</span>
                        Pagamentos Pendentes
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">check_circle</span>
                            <p>Tudo em dia! Nenhum pagamento pendente.</p>
                        </div>
                    ) : (
                        payments.map(item => {
                            const isPending = item.status === 'Pendente';
                            const dateObj = item.date?.toDate ? item.date.toDate() : (item.date ? new Date(item.date) : new Date());

                            return (
                                <div key={item.id} className="bg-surface-dark border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-white text-lg">{item.description}</p>
                                            <p className="text-sm text-gray-400">{format(dateObj, "d 'de' MMMM", { locale: ptBR })}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary text-lg">R$ {item.amount.toFixed(2).replace('.', ',')}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isPending ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>

                                    {isPending ? (
                                        <Button
                                            className="w-full mt-2"
                                            onClick={() => item.id && handleConfirmPayment(item.id)}
                                            disabled={!!processingId}
                                        >
                                            {processingId === item.id ? 'Processando...' : 'Informar Pagamento Realizado'}
                                        </Button>
                                    ) : (
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3 mt-2">
                                            <span className="material-symbols-outlined text-blue-400 text-sm mt-0.5">info</span>
                                            <p className="text-xs text-blue-200">
                                                Você informou o pagamento. Assim que seu personal confirmar, o status mudará para "Pago".
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
