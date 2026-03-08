import React from 'react';
import { createRoot } from 'react-dom/client';

interface AlertProps {
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    onClose: () => void;
}

const CustomAlert: React.FC<AlertProps> = ({ title, message, type = 'info', onClose }) => {
    const [isVisible, setIsVisible] = React.useState(true);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
    };

    const getIcon = () => {
        switch (type) {
            case 'error': return 'error';
            case 'warning': return 'warning';
            case 'success': return 'check_circle';
            default: return 'info';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'error': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'warning': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'success': return 'text-green-500 bg-green-500/10 border-green-500/20';
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6 transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <div className="flex flex-col items-center text-center">
                    <div className={`mb-4 p-4 rounded-full ${getColor()} ring-1 ring-inset`}>
                        <span className="material-symbols-outlined text-3xl">{getIcon()}</span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        {message}
                    </p>

                    <button
                        onClick={handleClose}
                        className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded-xl transition-all active:scale-95"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);

    const closeHandler = () => {
        root.unmount();
        div.remove();
    };

    root.render(<CustomAlert title={title} message={message} type={type} onClose={closeHandler} />);
};
