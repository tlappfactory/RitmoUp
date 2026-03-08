import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
    onClick?: () => void;
    className?: string;
    variant?: 'default' | 'absolute';
    icon?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
    onClick,
    className = '',
    variant = 'default',
    icon = 'arrow_back'
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(-1);
        }
    };

    const baseStyles = "p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center";
    const absoluteStyles = variant === 'absolute' ? "absolute top-6 left-6 z-20 glass border border-white/5" : "";

    return (
        <button
            onClick={handleClick}
            className={`${baseStyles} ${absoluteStyles} ${className}`}
            type="button"
        >
            <span className="material-symbols-outlined">{icon}</span>
        </button>
    );
};
