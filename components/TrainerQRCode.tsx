import React from 'react';
import QRCode from "react-qr-code";
import { useAuth } from '../AuthContext';
import { Button } from './UIComponents';

interface TrainerQRCodeProps {
    onClose: () => void;
}

export const TrainerQRCode = ({ onClose }: TrainerQRCodeProps) => {
    const { user } = useAuth();

    if (!user) return null;

    // The data payload for the QR Code
    // We'll use a JSON format to be flexible for future additions
    const qrData = JSON.stringify({
        type: 'connect',
        trainerId: user.id,
        name: user.name
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-sm p-6 flex flex-col items-center gap-6 animate-fade-in-up shadow-[0_0_50px_rgba(0,255,136,0.1)]">

                <div className="text-center space-y-1">
                    <h3 className="text-xl font-bold text-white">Seu Link de Conexão</h3>
                    <p className="text-gray-400 text-sm">Peça para o aluno apontar a câmera</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-lg">
                    <QRCode
                        value={qrData}
                        size={200}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        viewBox={`0 0 256 256`}
                    />
                </div>

                <div className="w-full space-y-3 text-center">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Seu ID</p>
                        <p className="font-mono text-primary text-sm select-all">{user.id}</p>
                    </div>
                    <Button variant="ghost" onClick={onClose} className="w-full">
                        Fechar
                    </Button>
                </div>
            </div>
        </div>
    );
};
