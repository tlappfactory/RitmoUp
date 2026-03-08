
import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from './UIComponents';

interface ViewProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainer: any;
}

export const ViewProfileModal = ({ isOpen, onClose, trainer }: ViewProfileModalProps) => {
    if (!isOpen || !trainer) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-surface-dark rounded-t-2xl z-10 w-full">
                    <h3 className="font-bold text-lg text-white">Perfil do Treinador</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">

                    {/* Header Info */}
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                            <img
                                src={trainer.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(trainer.name)}&background=random`}
                                alt={trainer.name}
                                className="size-32 rounded-full border-4 border-primary object-cover shadow-[0_0_20px_rgba(0,255,136,0.2)]"
                            />
                            <div className="absolute bottom-0 right-0 bg-surface-dark rounded-full p-1.5 border border-white/10">
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-bold">
                                    <span className="material-symbols-outlined text-xs">star</span>
                                    {trainer.rating || '5.0'}
                                </div>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{trainer.name}</h2>
                        {trainer.gender && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1 flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-sm">person</span>
                                {trainer.gender}
                            </p>
                        )}
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                            {trainer.specialties && trainer.specialties.map((s: string, i: number) => (
                                <span key={i} className="text-xs bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full text-primary border border-primary/20">{s}</span>
                            ))}
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">description</span> Sobre
                        </h4>
                        <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                            {trainer.bio || 'Este treinador ainda não adicionou uma biografia.'}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/5 flex flex-col items-center">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{trainer.studentsCount || 0}</span>
                            <span className="text-xs text-gray-500 uppercase">Alunos Ativos</span>
                        </div>
                        <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/5 flex flex-col items-center">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{trainer.yearsExperience || 1}+</span>
                            <span className="text-xs text-gray-500 uppercase">Anos de Exp.</span>
                        </div>
                    </div>

                    {/* PIX Key (if available) */}
                    {trainer.pixKey && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">payments</span> Chave PIX
                            </h4>
                            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl">
                                <span className="font-mono text-sm text-gray-900 dark:text-white select-all">{trainer.pixKey}</span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(trainer.pixKey);
                                        // Ideally show a toast here, but we might not have access to hook.
                                        // Simple alert or just action is fine for now/modal context.
                                    }}
                                    className="text-primary hover:text-green-600 dark:hover:text-white transition-colors"
                                    title="Copiar"
                                >
                                    <span className="material-symbols-outlined text-lg">content_copy</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Certifications (if any) */}
                    {trainer.certifications && trainer.certifications.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">workspace_premium</span> Certificações
                            </h4>
                            <div className="space-y-2">
                                {trainer.certifications.map((cert: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
                                        <span className="material-symbols-outlined text-yellow-500">verified</span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{cert}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 mt-auto bg-surface-dark rounded-b-2xl">
                    <Button onClick={onClose} className="w-full">Fechar</Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

