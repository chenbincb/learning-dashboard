'use client';

import React from 'react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface StabilityScatterProps {
    trend: any[];
}

export function StabilityScatter({ trend }: StabilityScatterProps) {
    const data = trend.map((t, i) => ({
        x: i + 1,
        y: t.grade_rank,
        z: t.total_score,
        name: t.name
    }));

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">成绩稳定性</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--chart-grid))" />
                        <XAxis type="number" dataKey="x" name="考试场次" hide />
                        <YAxis type="number" dataKey="y" name="年级排名" reversed hide />
                        <ZAxis type="number" dataKey="z" range={[50, 400]} name="总分" />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload, coordinate }: any) => {
                                if (active && payload && payload.length && coordinate) {
                                    return (
                                        <div
                                            className="bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xl rounded-lg text-xs min-w-[150px]"
                                            style={{ transform: `translateY(${-coordinate.y}px)` }}
                                        >
                                            <p className="font-bold text-slate-700 dark:text-slate-100 mb-2">{payload[0].payload.name}</p>
                                            <div className="space-y-1 font-sans">
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-slate-500 dark:text-slate-400">年级排名:</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-100">{payload[0].payload.y}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-slate-500 dark:text-slate-400">总分:</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-100">{payload[0].payload.z}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Scatter name="历次考试" data={data} fill="#4f46e5" />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
                * 圆点越大代表总分越高，位置越靠上代表排名越靠前
            </p>
        </div>
    );
}
