import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'warning'
}) => {
    if (!isOpen) return null;

    const variantColors = {
        danger: 'bg-red-500/20 text-red-400 border-red-500/50',
        warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
        info: 'bg-blue-500/20 text-blue-400 border-blue-500/50'
    };

    const buttonColors = {
        danger: 'bg-red-500 hover:bg-red-600',
        warning: 'bg-yellow-500 hover:bg-yellow-600',
        info: 'bg-blue-500 hover:bg-blue-600'
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="glass-card max-w-md w-full p-6 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full ${variantColors[variant]} flex items-center justify-center mb-4`}>
                    <span className="material-symbols-outlined text-2xl">
                        {variant === 'danger' ? 'warning' : variant === 'warning' ? 'info' : 'help'}
                    </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold mb-2">{title}</h2>

                {/* Message */}
                <p className="text-gray-400 mb-6 whitespace-pre-line">{message}</p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg bg-surface-dark hover:bg-surface-light text-gray-300 font-bold transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg ${buttonColors[variant]} text-white font-bold transition-colors`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
