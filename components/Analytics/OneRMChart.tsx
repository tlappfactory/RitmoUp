
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OneRMChartProps {
    data: { date: string; oneRM: number; weight: number; reps: number }[];
    exerciseName: string;
}

export const OneRMChart: React.FC<OneRMChartProps> = ({ data, exerciseName }) => {
    if (!data || data.length === 0) {
        return (
            <div className="bg-surface-dark rounded-xl p-6 text-center text-muted h-64 flex items-center justify-center">
                <p>Sem dados suficientes para {exerciseName}</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;
            return (
                <div className="bg-surface-dark border border-glass-border p-3 rounded-lg shadow-xl backdrop-blur-md">
                    <p className="text-main font-bold">{label}</p>
                    <p className="text-primary font-bold">{point.oneRM} kg (1RM Est.)</p>
                    <p className="text-xs text-muted">
                        Baseado em: {point.weight}kg x {point.reps} reps
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-surface-dark rounded-xl p-4 shadow-lg border border-glass-border">
            <h3 className="text-lg font-bold text-main mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">trending_up</span>
                Evolução de Carga: {exerciseName}
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                        <XAxis
                            dataKey="date"
                            stroke="var(--text-secondary)"
                            fontSize={12}
                            tickMargin={10}
                        />
                        <YAxis
                            stroke="var(--text-secondary)"
                            fontSize={12}
                            domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="oneRM"
                            stroke="#00ff88"
                            strokeWidth={3}
                            dot={{ fill: '#00ff88', r: 4 }}
                            activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
