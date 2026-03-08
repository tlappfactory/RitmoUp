import React, { useState } from 'react';
import { SubscriptionPlan, PaymentMethod } from '../../types';

interface PaymentModalProps {
    plan: SubscriptionPlan;
    onClose: () => void;
    onConfirm: (method: PaymentMethod) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ plan, onClose, onConfirm }) => {
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [copied, setCopied] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText('00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913RitmoUp Ltda6008Sao Paulo62070503***6304E2CA');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePay = () => {
        if (!method) return;
        setProcessing(true);
        setTimeout(() => {
            onConfirm(method);
            setProcessing(false);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#333] shadow-2xl relative overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-2">Confirmar Assinatura</h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Você está assinando o <span className="text-white font-medium">{plan.title}</span> por <span className="text-purple-400 font-bold">R$ {plan.price.toFixed(2).replace('.', ',')}</span>/{plan.periodicity.toLowerCase().slice(0, 3)}
                    </p>

                    <div className="space-y-4 mb-6">
                        <button
                            onClick={() => setMethod('PIX')}
                            className={`w-full p-4 rounded-xl border flex items-center gap-3 transition-all ${method === 'PIX'
                                    ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                                    : 'border-[#333] bg-[#2a2a2a] hover:border-gray-500'
                                }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#333]">
                                <span className="material-symbols-outlined text-gray-300">qr_code</span>
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-white">PIX</p>
                                <p className="text-xs text-gray-500">Aprovação imediata</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setMethod('CREDIT_CARD')}
                            className={`w-full p-4 rounded-xl border flex items-center gap-3 transition-all ${method === 'CREDIT_CARD'
                                    ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                                    : 'border-[#333] bg-[#2a2a2a] hover:border-gray-500'
                                }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#333]">
                                <span className="material-symbols-outlined text-gray-300">credit_card</span>
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-white">Cartão de Crédito</p>
                                <p className="text-xs text-gray-500">Até 3x sem juros</p>
                            </div>
                        </button>
                    </div>

                    {method === 'PIX' && (
                        <div className="mb-6 bg-[#2a2a2a] p-4 rounded-xl border border-[#333]">
                            <div className="flex justify-center mb-4">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR Code PIX" className="w-32 h-32 rounded-lg bg-white p-1" />
                            </div>
                            <p className="text-center text-xs text-gray-400 mb-3">Escaneie o QR Code ou copie a chave abaixo</p>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value="00020126580014BR.GOV.BCB.PIX0136123e4567..."
                                    className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="bg-[#333] hover:bg-[#444] text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                                    title="Copiar código"
                                >
                                    {copied ? <span className="material-symbols-outlined text-green-500 text-sm">check</span> : <span className="material-symbols-outlined text-sm">content_copy</span>}
                                </button>
                            </div>
                        </div>
                    )}

                    {method === 'CREDIT_CARD' && (
                        <div className="mb-6 bg-[#2a2a2a] p-4 rounded-xl border border-[#333] space-y-3">
                            <input
                                placeholder="Número do Cartão"
                                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 placeholder-gray-600"
                            />
                            <div className="flex gap-3">
                                <input
                                    placeholder="MM/AA"
                                    className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 placeholder-gray-600"
                                />
                                <input
                                    placeholder="CVC"
                                    className="w-20 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 placeholder-gray-600"
                                />
                            </div>
                            <input
                                placeholder="Nome Impresso"
                                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 placeholder-gray-600"
                            />
                        </div>
                    )}

                    <button
                        onClick={handlePay}
                        disabled={!method || processing}
                        className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${!method || processing
                                ? 'bg-[#333] text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 shadow-lg shadow-purple-900/20'
                            }`}
                    >
                        {processing ? (
                            <>
                                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                                Processando...
                            </>
                        ) : method === 'PIX' ? 'Já fiz o pagamento' : `Pagar R$ ${plan.price.toFixed(2).replace('.', ',')}`}
                    </button>
                </div>
            </div>
        </div>
    );
};
