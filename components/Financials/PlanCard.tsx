import React from 'react';
import { SubscriptionPlan } from '../../types';

interface PlanCardProps {
    plan: SubscriptionPlan;
    onAction: (plan: SubscriptionPlan) => void;
    isCurrent?: boolean;
    actionLabel?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onAction, isCurrent, actionLabel = 'Assinar' }) => {
    return (
        <div className={`bg-[#2a2a2a] rounded-xl p-6 border ${isCurrent ? 'border-purple-500 ring-1 ring-purple-500' : 'border-[#333]'} flex flex-col h-full hover:border-purple-500/50 transition-colors`}>
            <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-2">{plan.title}</h3>
                <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-purple-400">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                    <span className="text-gray-400 text-sm mb-1">/{plan.periodicity.toLowerCase().slice(0, 3)}</span>
                </div>
            </div>

            <div className="flex-1 space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check</span>
                        <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={() => onAction(plan)}
                disabled={isCurrent}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${isCurrent
                        ? 'bg-purple-500/20 text-purple-400 cursor-default'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 shadow-lg shadow-purple-900/20'
                    }`}
            >
                {isCurrent ? 'Plano Atual' : actionLabel}
            </button>
        </div>
    );
};
