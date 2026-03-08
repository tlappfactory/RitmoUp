
import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Button } from '../UIComponents';
import { checkAppVersion } from '../../utils/versionCheck';

export const VersionChecker = () => {
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [latestVersion, setLatestVersion] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    // Get current version from Vite env (injected from package.json)
    const currentVersion = import.meta.env.PACKAGE_VERSION || '0.0.0';

    const performCheck = async () => {
        // Only check on native platforms (Android/iOS)
        // Web users always get the latest version on refresh
        if (!Capacitor.isNativePlatform()) return;

        try {
            const result = await checkAppVersion(currentVersion);

            if (result.hasUpdate) {
                setLatestVersion(result.latestVersion);
                setNeedsUpdate(true);
                setIsVisible(true);
            }
        } catch (error) {
            console.error("Error in version checker:", error);
        }
    };

    useEffect(() => {
        performCheck();
    }, []);

    if (!needsUpdate || !isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in">
            <div className="bg-[#1e293b] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                <div className="size-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-3xl">system_update</span>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Atualização Disponível</h2>
                <p className="text-gray-400 mb-6">
                    Uma nova versão do RitmoUp está disponível! Atualize para aproveitar as novidades e correções.
                </p>

                <div className="bg-black/30 rounded-xl p-4 mb-6 flex justify-between items-center">
                    <div className="text-left">
                        <p className="text-xs text-gray-500 uppercase font-bold">Versão Atual</p>
                        <p className="font-mono text-gray-300">v{currentVersion}</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-600">arrow_forward</span>
                    <div className="text-right">
                        <p className="text-xs text-primary uppercase font-bold">Nova Versão</p>
                        <p className="font-mono text-primary font-bold">v{latestVersion}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <Button className="w-full" onClick={() => window.open('https://play.google.com/store/apps/details?id=com.ritmoup.app', '_system')}>
                        Atualizar Agora
                    </Button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                        Lembrar depois
                    </button>
                </div>
            </div>
        </div>
    );
};
