import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { UserRole } from '../types';
import { useToast } from '../ToastContext';
import { Button } from '../components/UIComponents';
import { paymentService } from '../services/paymentService';


export const PricingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();



    const handleSubscribe = async () => {
        if (!user) {
            showToast("Crie uma conta ou faça login para assinar.", "info");
            navigate('/register');
            return;
        }

        if (user.role !== 'TRAINER') {
            showToast("Este plano é exclusivo para Personal Trainers.", "warning");
            return;
        }

        showToast("Iniciando pagamento seguro...", "info");
        try {
            await paymentService.initiatePayment();
            navigate('/payment/success');
        } catch (error) {
            console.error(error);
            showToast("Pagamento cancelado ou falhou", "error");
        }
    };

    return (
        <div className="min-h-screen py-32 px-6 flex flex-col items-center bg-[#0f172a] text-white">
            <button onClick={() => navigate(user ? '/trainer/dashboard' : '/login')} className="fixed top-6 left-6 p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all z-50">
                <span className="material-symbols-outlined">arrow_back</span>
            </button>

            <h1 className="text-4xl font-bold mb-4 text-center">Planos para Personal Trainers</h1>
            <p className="text-gray-400 mb-16 text-center max-w-lg">
                Comece com 7 dias grátis. Cancele quando quiser.
            </p>

            <div className="flex flex-col md:flex-row gap-8 max-w-4xl w-full">
                {/* Free Tier (Implicit in message, usually purely trial or limited) - Let's just show the main Pro plan */}
                <div className="flex-1 relative border-[#00ff88]/50 shadow-2xl shadow-[#00ff88]/10 bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8">
                    <div className="absolute top-0 right-0 bg-[#00ff88] text-black text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                        MAIS POPULAR
                    </div>

                    <h3 className="text-2xl font-bold mb-2">Pro Trainer</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-bold">R$ 12,99</span>
                        <span className="text-gray-400">/mês</span>
                    </div>

                    <ul className="space-y-4 mb-8 text-gray-300">
                        <li className="flex items-center gap-3"><span className="text-[#00ff88] material-symbols-outlined text-sm">check</span> Alunos Ilimitados</li>
                        <li className="flex items-center gap-3"><span className="text-[#00ff88] material-symbols-outlined text-sm">check</span> Criação de Treinos com IA</li>
                        <li className="flex items-center gap-3"><span className="text-[#00ff88] material-symbols-outlined text-sm">check</span> Templates Personalizados</li>
                        <li className="flex items-center gap-3"><span className="text-[#00ff88] material-symbols-outlined text-sm">check</span> Gestão Financeira Completa</li>
                    </ul>

                    <button
                        onClick={handleSubscribe}
                        className="w-full py-4 text-lg bg-[#00ff88] text-[#0f172a] font-bold rounded-xl hover:bg-[#00cc6a] transition-all shadow-lg hover:shadow-[#00ff88]/20 active:scale-95"
                    >
                        {user ? 'Assinar Agora' : 'Começar Teste Grátis de 7 Dias'}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-4">Compra segura via Stripe.</p>
                </div>
            </div>
        </div>
    );
};
