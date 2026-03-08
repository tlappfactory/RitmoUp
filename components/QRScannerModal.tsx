import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from './UIComponents';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (result: string) => void;
}

export const QRScannerModal = ({ isOpen, onClose, onScan }: QRScannerModalProps) => {
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        const checkPermission = async () => {
            if (!isOpen) return;

            if (Capacitor.isNativePlatform()) {
                try {
                    const status = await Camera.checkPermissions();

                    if (status.camera === 'granted') {
                        setHasPermission(true);
                    } else {
                        const request = await Camera.requestPermissions({ permissions: ['camera'] });
                        if (request.camera === 'granted') {
                            setHasPermission(true);
                        } else {
                            setError("Permissão da câmera negada. Habilite nas configurações.");
                        }
                    }
                } catch (e) {
                    console.error("Error checking camera permission", e);
                    // Fallback: try to load anyway, maybe it's not native or plugin failed
                    setHasPermission(true);
                }
            } else {
                // Web platform - browser will handle prompt
                setHasPermission(true);
            }
        };

        checkPermission();
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-sm flex flex-col items-center gap-6 animate-fade-in-up overflow-hidden">

                <div className="w-full p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <h3 className="font-bold text-white">Escanear QR Code</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="w-full aspect-square bg-black relative">
                    {!hasPermission && !error ? (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            Verificando permissões...
                        </div>
                    ) : (
                        <Scanner
                            onScan={(result) => {
                                if (result && result.length > 0) {
                                    onScan(result[0].rawValue);
                                }
                            }}
                            onError={(err) => {
                                console.error(err);
                                // Only show error if we thought we had permission
                                if (hasPermission) {
                                    setError("Erro ao acessar a câmera.");
                                }
                            }}
                            components={{
                                onOff: false,
                                torch: false,
                                finder: true
                            }}
                            styles={{
                                container: { width: '100%', height: '100%' }
                            }}
                        />
                    )}

                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center z-10">
                            <span className="material-symbols-outlined text-red-500 text-4xl mb-2">no_photography</span>
                            <p className="text-red-500 mb-4">{error}</p>
                            <Button size="sm" variant="outline" onClick={onClose}>Fechar</Button>
                        </div>
                    )}
                </div>

                <div className="p-4 w-full text-center">
                    <p className="text-sm text-gray-400">Aponte a câmera para o código do treinador</p>
                </div>
            </div>
        </div>,
        document.body
    );
};
