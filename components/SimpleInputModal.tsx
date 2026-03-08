import React, { useState, useEffect } from 'react';
import { Button, Input } from './UIComponents';

interface SimpleInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (value: string) => void;
    title: string;
    label?: string;
    placeholder?: string;
    initialValue?: string;
    confirmText?: string;
}

export const SimpleInputModal = ({
    isOpen,
    onClose,
    onSubmit,
    title,
    label,
    placeholder,
    initialValue = '',
    confirmText = 'Confirmar'
}: SimpleInputModalProps) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) setValue(initialValue);
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(value);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-background-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        {title}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        {label && <label className="text-sm text-gray-400 ml-1">{label}</label>}
                        <Input
                            value={value}
                            onChange={(e: any) => setValue(e.target.value)}
                            placeholder={placeholder}
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" className="flex-1" disabled={!value.trim()}>
                            {confirmText}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
