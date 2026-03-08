import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

// ─── Diagnostic Log System ───
export interface DiagnosticEntry {
    timestamp: string;
    step: string;
    status: 'info' | 'success' | 'warn' | 'error';
    detail?: string;
}

const createTimestamp = () => new Date().toISOString().split('T')[1].replace('Z', '');

/**
 * Hook híbrido de reconhecimento de voz COM DIAGNÓSTICO E MODO DE SEGURANÇA.
 * 
 * - Detecta crashes nativos anteriores via localStorage.
 * - Permite alternar manualmente entre Nativo e Web.
 */
export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [supported, setSupported] = useState(false);
    const [diagnosticLogs, setDiagnosticLogs] = useState<DiagnosticEntry[]>([]);

    // Mode Management - Defaulting to WEB for Android stability as requested
    const [mode, setMode] = useState<'native' | 'web'>('web');
    const [isSafeMode, setIsSafeMode] = useState(false);

    const recognitionRef = useRef<any>(null);

    const addLog = useCallback((step: string, status: DiagnosticEntry['status'], detail?: string) => {
        const entry: DiagnosticEntry = {
            timestamp: createTimestamp(),
            step,
            status,
            detail: detail?.substring(0, 500) // cap detail length
        };
        console.log(`[SpeechDiag] [${status.toUpperCase()}] ${step}${detail ? ': ' + detail : ''}`);
        setDiagnosticLogs(prev => [...prev.slice(-49), entry]); // keep last 50
    }, []);

    const clearLogs = useCallback(() => {
        setDiagnosticLogs([]);
    }, []);

    // ─── Crash Detection & Init ───
    useEffect(() => {
        const init = async () => {
            // Check if we crashed last time
            const lastSessionCrashed = localStorage.getItem('speech_crash_detected');

            if (lastSessionCrashed) {
                addLog('init', 'warn', 'CRASH DETECTED in previous session! Forcing Safe Mode (Web API).');
                setIsSafeMode(true);
                setMode('web'); // Force Web API
                setError('O app recuperou de um erro crítico no microfone. Usando modo de segurança (Web).');
                // Optional: clear flag after safe start? No, keep it until user explicitly clears or reinstalls potentially
                // or maybe clear it so if they retry native and it works, good. if it crashes again, flag comes back.
                // Let's clear it ONLY if they manually switch back to native.
            } else {
                addLog('init', 'info', `Platform: ${Capacitor.getPlatform()}, Mode: ${mode}`);
            }

            // Check support based on determined mode
            if (mode === 'native') {
                try {
                    const { available } = await SpeechRecognition.available();
                    setSupported(available);
                    if (!available) {
                        // Fallback immediately if native reports unavailable
                        setMode('web');
                        setSupported(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
                    }
                } catch (e) {
                    setSupported(false);
                    setMode('web'); // Fallback on error
                }
            } else {
                setSupported(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
            }
        };
        init();
    }, []); // Run once on mount

    // ─── Native (Capacitor) Speech Recognition ───
    const startListeningNative = useCallback(async (): Promise<boolean> => {
        setError(null);
        setTranscript('');

        // MARK CRASH FLAG START
        // If the app dies during SpeechRecognition.start(), this flag remains 'true'
        localStorage.setItem('speech_crash_detected', 'true');

        try {
            // Step 1: Check availability
            try {
                const { available } = await SpeechRecognition.available();
                if (!available) {
                    addLog('native.start', 'warn', 'Native not available, signaling fallback');
                    localStorage.removeItem('speech_crash_detected'); // Safe
                    return false;
                }
            } catch (e) {
                localStorage.removeItem('speech_crash_detected'); // Safe (error before start)
                return false;
            }

            // Step 2: Request permissions
            try {
                const permStatus = await SpeechRecognition.requestPermissions();
                if (permStatus.speechRecognition !== 'granted') {
                    setError('Permissão negada.');
                    localStorage.removeItem('speech_crash_detected'); // Safe
                    return true;
                }
            } catch (e) {
                localStorage.removeItem('speech_crash_detected'); // Safe
                return false;
            }

            setIsListening(true);
            addLog('native.3-start', 'info', 'Calling SpeechRecognition.start()...');

            // Step 3: Start recognition (CRITICAL SECTION)
            try {
                const result = await SpeechRecognition.start({
                    language: 'pt-BR',
                    maxResults: 1,
                    popup: true,
                    partialResults: false,
                });

                // If we got here, we didn't crash!
                localStorage.removeItem('speech_crash_detected');

                addLog('native.result', 'success', `Result: ${JSON.stringify(result)}`);

                if (result.matches && result.matches.length > 0) {
                    setTranscript(result.matches[0]);
                } else {
                    setError('Nenhuma fala detectada.');
                }
            } catch (e: any) {
                // If we caught an error, we didn't crash hard.
                localStorage.removeItem('speech_crash_detected');

                const msg = e?.message || String(e);
                addLog('native.error', 'error', msg);

                if (msg.includes('not implemented') || msg.includes('plugin_not_installed')) {
                    return false; // Force fallback
                }
                setError('Erro no reconhecimento.');
            } finally {
                setIsListening(false);
            }

            return true; // Handled natively
        } catch (e) {
            // Unexpected wrapper error
            localStorage.removeItem('speech_crash_detected');
            return false;
        }
    }, [addLog]);

    const stopListeningNative = useCallback(async () => {
        try {
            await SpeechRecognition.stop();
        } catch (e) { }
        setIsListening(false);
    }, []);

    // ─── Web Speech API ───
    const startListeningWeb = useCallback(async () => {
        setError(null);
        setTranscript('');

        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setError('Web Speech API indisponível.');
            return;
        }

        try {
            const recognition = new SpeechRecognitionAPI();
            recognition.lang = 'pt-BR';
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => setIsListening(true);

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) finalTranscript += result[0].transcript;
                }
                if (finalTranscript) {
                    setTranscript(finalTranscript);
                    addLog('web.result', 'success', finalTranscript);
                }
            };

            recognition.onerror = (event: any) => {
                addLog('web.error', 'error', event.error);
                setError(event.error === 'not-allowed' ? 'Permissão negada (Web).' : 'Erro no reconhecimento (Web).');
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
                recognitionRef.current = null;
            };

            recognitionRef.current = recognition;
            recognition.start();

        } catch (e: any) {
            setError('Erro ao iniciar Web Speech API.');
            setIsListening(false);
        }
    }, [addLog]);

    const stopListeningWeb = useCallback(async () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
    }, []);

    // ─── API ───
    const startListening = useCallback(async () => {
        addLog('start', 'info', `Starting in ${mode.toUpperCase()} mode...`);
        if (mode === 'native') {
            const handled = await startListeningNative();
            if (!handled) {
                addLog('fallback', 'warn', 'Native failed, trying Web...');
                setMode('web'); // Switch for next time too? Maybe.
                await startListeningWeb();
            }
        } else {
            await startListeningWeb();
        }
    }, [mode, startListeningNative, startListeningWeb, addLog]);

    const stopListening = useCallback(async () => {
        if (mode === 'native') await stopListeningNative();
        else await stopListeningWeb();
    }, [mode, stopListeningNative, stopListeningWeb]);

    const toggleListening = useCallback(async () => {
        if (isListening) await stopListening();
        else await startListening();
    }, [isListening, startListening, stopListening]);

    const toggleMode = useCallback(() => {
        const newMode = mode === 'native' ? 'web' : 'native';
        setMode(newMode);
        addLog('mode_change', 'info', `Switched to ${newMode.toUpperCase()} mode manually.`);

        // If switching BACK to native, we should clear the crash flag (give it another chance)
        if (newMode === 'native') {
            localStorage.removeItem('speech_crash_detected');
            setIsSafeMode(false);
        }
    }, [mode, addLog]);

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        toggleListening,
        supported,
        diagnosticLogs,
        clearLogs,
        mode,
        toggleMode,
        isSafeMode
    };
};
