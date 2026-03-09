import { useState, useCallback, useRef } from 'react';

// ─── Diagnostic Log System ───
export interface DiagnosticEntry {
    timestamp: string;
    step: string;
    status: 'info' | 'success' | 'warn' | 'error';
    detail?: string;
}

const createTimestamp = () => new Date().toISOString().split('T')[1].replace('Z', '');

/**
 * Hook de reconhecimento de voz (Web Speech API Pura)
 */
export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [supported] = useState(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
    const [diagnosticLogs, setDiagnosticLogs] = useState<DiagnosticEntry[]>([]);

    // Mode is always web now, kept for interface compatibility if used elsewhere
    const mode = 'web';
    const isSafeMode = true;

    const recognitionRef = useRef<any>(null);

    const addLog = useCallback((step: string, status: DiagnosticEntry['status'], detail?: string) => {
        const entry: DiagnosticEntry = {
            timestamp: createTimestamp(),
            step,
            status,
            detail: detail?.substring(0, 500)
        };
        console.log(`[SpeechDiag] [${status.toUpperCase()}] ${step}${detail ? ': ' + detail : ''}`);
        setDiagnosticLogs(prev => [...prev.slice(-49), entry]);
    }, []);

    const clearLogs = useCallback(() => {
        setDiagnosticLogs([]);
    }, []);


    // ─── Web Speech API ───
    const startListening = useCallback(async () => {
        setError(null);
        setTranscript('');

        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setError('Web Speech API indisponível neste navegador.');
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
                setError(event.error === 'not-allowed' ? 'Permissão de microfone negada (Web).' : 'Erro no reconhecimento (Web).');
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

    const stopListening = useCallback(async () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
    }, []);

    const toggleListening = useCallback(async () => {
        if (isListening) await stopListening();
        else await startListening();
    }, [isListening, startListening, stopListening]);

    const toggleMode = useCallback(() => {
        // No-op for PWA
        addLog('mode_change', 'info', `Mode change disabled in Web PWA.`);
    }, [addLog]);

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
