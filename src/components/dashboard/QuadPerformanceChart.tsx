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
    ResponsiveContainer,
    Cell,
    ReferenceLine
} from 'recharts';
import { getSubjectColor } from '@/lib/chartUtils';

interface QuadPerformanceChartProps {
    subjects: any[];
    prevSubjects?: any[];
}

export function QuadPerformanceChart({ subjects, prevSubjects }: QuadPerformanceChartProps) {
    const data = subjects.map(s => {
        const ps = prevSubjects?.find(p => p.subject === s.subject);
        const fullScore = ['语文', '数学', '英语'].includes(s.subject) ? 150 : 100;
        const scoreRate = (s.score / fullScore) * 100;
        const stability = ps ? (ps.grade_rank - s.grade_rank) : 0;

        return {
            name: s.subject,
            x: scoreRate,
            y: stability,
            z: s.score
        };
    });

    const xValues = data.map(d => d.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const domainX = [Math.floor(minX - 5), Math.ceil(maxX + 5)];
    const midX = (domainX[0] + domainX[1]) / 2;

    const yValues = data.map(d => d.y);
    const minY = Math.min(...yValues, 0);
    const maxY = Math.max(...yValues, 0);
    const domainY = [Math.floor(minY - 10), Math.ceil(maxY + 10)];

    return (
        <div className="w-full aspect-square max-h-[300px] mx-auto">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis
                        type="number"
                        dataKey="x"
                        domain={domainX}
                        hide={false}
                        axisLine={false}
                        tick={{ fontSize: 9 }}
                        label={{ value: '得分率 %', position: 'insideBottom', offset: -10, fontSize: 9 }}
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        domain={domainY}
                        axisLine={false}
                        tick={{ fontSize: 9 }}
                        label={{ value: '排名波动', angle: -90, position: 'insideLeft', fontSize: 9 }}
                    />
                    <ZAxis type="number" dataKey="z" range={[60, 400]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                                <div className="bg-white dark:bg-slate-900 p-2 border border-slate-100 dark:border-slate-800 shadow-xl rounded-lg text-[10px]">
                                    <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">{d.name}</p>
                                    <p className="text-slate-500">得分率: <span className="font-bold text-slate-800 dark:text-slate-100">{d.x.toFixed(1)}%</span></p>
                                    <p className="text-slate-500">名次变动: <span className={`font-bold ${d.y >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{d.y > 0 ? '+' : ''}{d.y}</span></p>
                                </div>
                            );
                        }
                        return null;
                    }} />
                    <ReferenceLine x={midX} stroke="#94a3b8" strokeDasharray="3 3" />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                    <Scatter name="学科" data={data}>
                        {data.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={getSubjectColor(entry.name)} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
