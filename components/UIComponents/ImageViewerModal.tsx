import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ImageViewerModalProps {
    isOpen: boolean;
    imageUrl: string | null;
    altText?: string;
    onClose: () => void;
}

import { useState } from 'react';

export const ImageViewerModal = ({ isOpen, imageUrl, altText = 'Imagem', onClose }: ImageViewerModalProps) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            setIsLoading(true); // Reset loading state on open
            window.addEventListener('keydown', handleEsc);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !imageUrl) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-[10000]"
            >
                <span className="material-symbols-outlined text-3xl">close</span>
            </button>

            <div
                className="relative max-w-[95vw] max-h-[95vh] p-2 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()} // Prevent close when clicking the image wrapper
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
                    </div>
                )}
                <img
                    src={imageUrl}
                    alt={altText}
                    className={`max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100 animate-scale-in'}`}
                    onLoad={() => setIsLoading(false)}
                />
            </div>
        </div>,
        document.body
    );
};
