import React from 'react';
import { useAuth } from '../../AuthContext';
import { Card, Button } from '../../components/UIComponents';
import { useToast } from '../../ToastContext';

export const SubscriptionContent = ({ embedded = false }: { embedded?: boolean }) => {
    const { user, logout } = useAuth();
    const { showToast } = useToast();

    // Real data from user profile (updated by Stripe Webhook)
    const status = user?.subscriptionStatus;
    const isActive = status === 'active';

    // Helper to safely parse date (Timestamp or Date string/obj)
    const parseDate = (date: any): Date | null => {
        if (!date) return null;
        if (date.toDate && typeof date.toDate === 'function') return date.toDate();
        if (date.seconds) return new Date(date.seconds * 1000);
        if (date instanceof Date) return date;
        if (typeof date === 'string') return new Date(date);
        return null;
    };

    const createdAtDate = parseDate(user?.createdAt);
    // If no created date, don't default to now, default to null so we know it's missing
    const trialEndDate = createdAtDate ? new Date(createdAtDate.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
    const now = new Date();
    const isWithinTrialPeriod = trialEndDate ? now < trialEndDate : false;

    // Is trial if explicitly set OR implicitly within date range (and not active)
    const isTrial = status === 'trial' || (!isActive && isWithinTrialPeriod);
    const isLocked = !isActive && !isTrial; // This handles undefined/past_due/canceled

    const trialDaysRemaining = trialEndDate
        ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    // Calculate expiration date priority:
    // 1. Explicit subscriptionExpiresAt from Stripe (stored in user profile)
    // 2. Legacy fallback: updatedAt + 30 days if active
    // 3. Trial end date
    // 4. Fallback to today ONLY if truly unknown (visual placeholder)
    let expirationDate = parseDate(user?.subscriptionExpiresAt);

    if (!expirationDate) {
        if (isActive && user?.updatedAt) {
            const updatedAt = parseDate(user?.updatedAt);
            if (updatedAt) expirationDate = new Date(updatedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else if (isTrial || trialEndDate) {
            expirationDate = trialEndDate;
        }
    }

    // Final fallback if absolutely nothing exists
    if (!expirationDate) expirationDate = new Date();

    // Stripe Link
    const STRIPE_LINK = "https://buy.stripe.com/5kQ5kEblQ2az2QU0R800000";

    const handleManageSubscription = async () => {
        const url = `${STRIPE_LINK}?prefilled_email=${encodeURIComponent(user?.email || '')}`;
        window.location.href = url;
        showToast('Redirecionando para o portal de pagamento...', 'success');
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">

            {/* Lock Warning Banner */}
            {isLocked && (
                <div className="bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-100 border border-red-200 dark:border-red-500/50 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 animate-pulse-slow">
                    <div className="size-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-500">lock</span>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
                        <p className="opacity-90">
                            Sua assinatura está vencida. Para voltar a ter acesso total aos seus alunos, treinos e funcionalidades do aplicativo, é necessário realizar a renovação do seu plano.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <Button onClick={handleManageSubscription} className="bg-red-600 hover:bg-red-700 text-white w-full border-none">
                            Renovar Acesso Agora
                        </Button>
                        <Button variant="outline" onClick={logout} className="w-full border-red-200 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/20">
                            Sair da Conta
                        </Button>
                    </div>
                </div>
            )}

            {/* Status Section */}
            <section>
                <div className="bg-white dark:bg-surface-dark border border-glass-border rounded-2xl p-6 shadow-sm">

                    {/* Status Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-glass-border pb-6">
                        <div className="flex items-start gap-4">
                            <div className={`size-12 rounded-full flex items-center justify-center ${isTrial ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'}`}>
                                <span className="material-symbols-outlined text-2xl">
                                    {isTrial ? 'history_toggle_off' : 'verified'}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-light dark:text-white">
                                    {isActive ? 'Assinatura Pro Ativa' : (isTrial ? 'Período de Teste' : 'Assinatura Inativa')}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {isActive
                                        ? 'Sua assinatura está ativa. Aproveite todos os recursos!'
                                        : (isTrial
                                            ? `Você tem ${trialDaysRemaining} dias restantes do seu período gratuito.`
                                            : 'Sua assinatura expirou. Renove para continuar acessando.')}
                                </p>
                            </div>
                        </div>

                        <Button variant={isActive ? 'outline' : 'primary'} onClick={handleManageSubscription}>
                            {isActive ? 'Portal do Assinante' : 'Assinar Agora'}
                        </Button>
                    </div>

                    {/* Plan Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-glass-border">
                            <p className="text-xs uppercase text-gray-500 mb-1">Valor da Assinatura</p>
                            <p className="text-2xl font-bold text-text-light dark:text-white">R$ 12,99 <span className="text-sm font-normal text-gray-500">/mês</span></p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-glass-border">
                            <p className="text-xs uppercase text-gray-500 mb-1">{isActive ? 'Renovação' : (isTrial ? 'Fim do Teste' : 'Expirou em')}</p>
                            <p className="text-2xl font-bold text-text-light dark:text-white">
                                {expirationDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>

                </div>
            </section>

            {/* Subscription Details (Plan Info) */}
            <section>
                <div className="bg-white dark:bg-surface-dark border border-glass-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="size-10 rounded-lg bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <span className="material-symbols-outlined">star</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-text-light dark:text-white">Plano Pro Trainer</h3>
                            <p className="text-sm text-gray-500">Plano completo para personal trainers.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            "Alunos Ilimitados",
                            "Criação de Treinos com IA",
                            "Gestão Financeira Completa",
                            "Agendamento de Aulas",
                            "App do Aluno Premium",
                            "Suporte Prioritário"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                <span className="text-gray-600 dark:text-gray-300 font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer Actions */}
            <section className="bg-gray-50 dark:bg-white/5 border border-glass-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h4 className="font-bold text-text-light dark:text-white mb-1">Precisa de ajuda com sua assinatura?</h4>
                    <p className="text-sm text-gray-500">Entre em contato com nosso suporte para dúvidas sobre cobrança ou cancelamento.</p>
                </div>
                <Button variant="outline" onClick={() => window.open('mailto:suporte@ritmoup.com')}>
                    Falar com Suporte
                </Button>
            </section>

        </div>
    );
};
