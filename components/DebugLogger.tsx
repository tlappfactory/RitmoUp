import React, { useState, useEffect } from 'react';

interface LogEntry {
    timestamp: string;
    type: 'info' | 'success' | 'error';
    message: string;
}

// Global log storage
const logEntries: LogEntry[] = [];
const listeners: Set<(logs: LogEntry[]) => void> = new Set();

// Override console methods to capture logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

export const captureAuthLogs = () => {
    console.log = (...args: any[]) => {
        originalConsoleLog(...args);
        const message = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');

        // Only capture [Auth] logs
        if (message.includes('[Auth]')) {
            const entry: LogEntry = {
                timestamp: new Date().toLocaleTimeString(),
                type: message.includes('✗') ? 'error' : message.includes('✓') ? 'success' : 'info',
                message: message.replace('[Auth]', '').trim()
            };
            logEntries.push(entry);
            // Keep only last 20 logs
            if (logEntries.length > 20) logEntries.shift();
            listeners.forEach(fn => fn([...logEntries]));
        }
    };

    console.error = (...args: any[]) => {
        originalConsoleError(...args);
        const message = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');

        if (message.includes('[Auth]')) {
            const entry: LogEntry = {
                timestamp: new Date().toLocaleTimeString(),
                type: 'error',
                message: message.replace('[Auth]', '').trim()
            };
            logEntries.push(entry);
            if (logEntries.length > 20) logEntries.shift();
            listeners.forEach(fn => fn([...logEntries]));
        }
    };
};

export const DebugLogger: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([...logEntries]);
    const [tapCount, setTapCount] = useState(0);

    useEffect(() => {
        // Initialize log capturing
        captureAuthLogs();

        // Subscribe to log updates
        const updateLogs = (newLogs: LogEntry[]) => setLogs(newLogs);
        listeners.add(updateLogs);
        return () => {
            listeners.delete(updateLogs);
        };
    }, []);

    // Triple tap on logo to show/hide debug panel
    useEffect(() => {
        if (tapCount === 3) {
            setIsVisible(!isVisible);
            setTapCount(0);
        }
        const timer = setTimeout(() => setTapCount(0), 1000);
        return () => clearTimeout(timer);
    }, [tapCount, isVisible]);

    const clearLogs = () => {
        logEntries.length = 0;
        setLogs([]);
    };

    const copyLogs = () => {
        const text = logs.map(l => `[${l.timestamp}] ${l.message}`).join('\n');
        navigator.clipboard?.writeText(text).then(() => {
            alert('Logs copiados!');
        }).catch(() => {
            alert('Não foi possível copiar. Logs:\n\n' + text);
        });
    };

    if (!isVisible) {
        return (
            <div
                onClick={() => setTapCount(c => c + 1)}
                className="fixed bottom-4 right-4 bg-gray-900/80 text-white text-xs px-2 py-1 rounded"
                style={{ zIndex: 9999 }}
            >
                🐛 Debug ({logs.length})
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col text-white">
            {/* Header */}
            <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700">
                <h2 className="font-bold text-lg">🐛 Debug Logger - Auth</h2>
                <div className="flex gap-2">
                    <button
                        onClick={copyLogs}
                        className="px-3 py-1 bg-blue-600 rounded text-sm"
                    >
                        Copiar
                    </button>
                    <button
                        onClick={clearLogs}
                        className="px-3 py-1 bg-red-600 rounded text-sm"
                    >
                        Limpar
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="px-3 py-1 bg-gray-700 rounded text-sm"
                    >
                        Fechar
                    </button>
                </div>
            </div>

            {/* Logs Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
                {logs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                        Nenhum log de autenticação ainda...
                        <br />
                        <br />
                        Tente fazer login com Google para ver os logs aqui.
                    </div>
                ) : (
                    logs.map((log, idx) => (
                        <div
                            key={idx}
                            className={`p-2 rounded ${log.type === 'error' ? 'bg-red-900/30 border-l-4 border-red-500' :
                                    log.type === 'success' ? 'bg-green-900/30 border-l-4 border-green-500' :
                                        'bg-gray-800 border-l-4 border-blue-500'
                                }`}
                        >
                            <div className="text-gray-400 text-[10px] mb-1">{log.timestamp}</div>
                            <div className="whitespace-pre-wrap break-all">{log.message}</div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer hint */}
            <div className="bg-gray-900 p-2 text-center text-gray-500 text-xs border-t border-gray-700">
                Clique 3x no badge "Debug" para abrir/fechar
            </div>
        </div>
    );
};
