import React, { useState } from 'react';
import { DashboardLayout } from '../components/Layout';
import { EnhancedStudentProgress } from '../components/Student/EnhancedStudentProgress';
import { AnalyticsPage } from './AnalyticsPage';
import { useHaptics } from '../hooks/useHaptics';

export const StudentStatsPage = () => {
    const [activeSection, setActiveSection] = useState<'body' | 'performance'>('performance');
    const { hapticSelectionChanged } = useHaptics();

    return (
        <DashboardLayout title="Meu Desempenho" showBack>
            <div className="flex flex-col h-full">
                {/* Main Tabs */}
                <div className="flex p-1 bg-surface-dark rounded-2xl mx-auto mb-6 w-full max-w-md border border-white/5 relative">
                    <button
                        onClick={() => { hapticSelectionChanged(); setActiveSection('performance'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${activeSection === 'performance' ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined">bar_chart</span>
                        Treinos
                    </button>
                    <button
                        onClick={() => { hapticSelectionChanged(); setActiveSection('body'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${activeSection === 'body' ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined">accessibility_new</span>
                        Corpo
                    </button>

                    {/* Sliding Background */}
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-xl transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${activeSection === 'performance' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeSection === 'performance' ? (
                        <div key="performance">
                            <AnalyticsPage embedded />
                        </div>
                    ) : (
                        <div key="body">
                            <EnhancedStudentProgress embedded />
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};
