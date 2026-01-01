'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell
} from 'recharts';

interface ScoreGapAnalysisProps {
    subjects: any[];
}

export function ScoreGapAnalysis({ subjects }: ScoreGapAnalysisProps) {
    const data = subjects
        .filter(s => s.class_avg !== null)
        .map(s => ({
            subject: s.subject,
            gap: Math.round((s.score - s.class_avg) * 10) / 10
        }))
        .sort((a, b) => b.gap - a.gap);

    return (
        <div className="w-full">
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 30, right: 20 }}>
                        <XAxis type="number" hide domain={['dataMin - 2', 'dataMax + 2']} />
                        <YAxis
                            dataKey="subject"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            width={75}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload, coordinate }: any) => {
                                if (active && payload && payload.length && coordinate) {
                                    return (
                                        <div
                                            className="bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xl rounded-lg text-xs min-w-[140px]"
                                            style={{ transform: `translateY(${-coordinate.y}px)` }}
                                        >
                                            <p className="font-bold text-slate-700 dark:text-slate-100 mb-2">{payload[0].payload.subject}</p>
                                            <div className="flex items-center gap-2 font-sans">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].value >= 0 ? '#10b981' : '#ef4444' }}></div>
                                                <span className="text-slate-500 dark:text-slate-400">领先/落后:</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-100">{payload[0].value > 0 ? '+' : ''}{payload[0].value}分</span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <ReferenceLine x={0} stroke="#e2e8f0" />
                        <Bar
                            dataKey="gap"
                            radius={[0, 2, 2, 0]}
                            barSize={12}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.gap >= 0 ? '#10b981' : '#ef4444'}
                                    fillOpacity={0.7}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
