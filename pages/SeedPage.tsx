
import React, { useState } from 'react';
import { seedDatabase } from '../utils/seedDatabase';
import { workoutService } from '../services/workoutService';

export const SeedPage = () => {
    const [status, setStatus] = useState('Idle');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const patchConsole = () => {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            originalLog(...args);
            addLog(`INFO: ${args.join(' ')}`);
        };
        console.error = (...args) => {
            originalError(...args);
            addLog(`ERROR: ${args.join(' ')}`);
        };
        console.warn = (...args) => {
            originalWarn(...args);
            addLog(`WARN: ${args.join(' ')}`);
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
        };
    };

    const handleSeed = async () => {
        setLoading(true);
        setStatus('Seeding...');
        setLogs([]);
        const restore = patchConsole();

        try {
            await seedDatabase();
            setStatus('Seeding Completed Successfully!');
            addLog("DONE. Please check if duplicates are gone.");
        } catch (error) {
            console.error(error);
            setStatus('Error seeding database.');
        } finally {
            restore();
            setLoading(false);
        }
    };

    const handleSyncExercisesOnly = async () => {
        setLoading(true);
        setStatus('Syncing exercises...');
        setLogs([]);
        const restore = patchConsole();

        try {
            await workoutService.seedExercisesDatabase();
            setStatus('Exercises synced successfully!');
            addLog("DONE. Only exercises were added/updated. No other data was touched.");
        } catch (error) {
            console.error(error);
            setStatus('Error syncing exercises.');
        } finally {
            restore();
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-bold mb-8">Admin Seed Page</h1>
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-full max-w-2xl text-center">
                <p className="mb-6 text-gray-400">
                    Use the tools below to manage the database.
                </p>

                <div className="mb-6 font-mono text-sm bg-black/30 p-4 rounded-lg h-64 overflow-y-auto text-left whitespace-pre-wrap">
                    {logs.length === 0 ? <span className="text-gray-500">Logs will appear here...</span> : logs.map((log, i) => (
                        <div key={i} className={log.startsWith('ERROR') ? 'text-red-400' : log.startsWith('WARN') ? 'text-yellow-400' : 'text-green-400'}>
                            {log}
                        </div>
                    ))}
                </div>

                <div className="mb-6">
                    Status: <span className={status.includes('Error') ? 'text-red-400' : 'text-green-400 font-bold'}>{status}</span>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleSyncExercisesOnly}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-colors"
                    >
                        {loading ? 'Syncing...' : '🔄 Sincronizar Exercícios (Seguro)'}
                    </button>

                    <button
                        onClick={handleSeed}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-red-500/30 hover:bg-red-600/50 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-colors border border-red-500/50"
                    >
                        {loading ? 'Seeding...' : '⚠️ Full Seed (Apaga e Recria Tudo)'}
                    </button>
                </div>
            </div>
        </div>
    );
};
