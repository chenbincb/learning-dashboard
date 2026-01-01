'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { getSubjectColor } from '@/lib/chartUtils';

interface ScoreCompositionProps {
    subjects: any[];
}

export function ScoreComposition({ subjects }: ScoreCompositionProps) {
    const subjectOrder = ['物理', '化学', '生物', '语文', '数学', '英语', '政治', '历史', '地理'];

    const sortedSubjects = [...subjects].sort((a, b) => {
        const indexA = subjectOrder.indexOf(a.subject);
        const indexB = subjectOrder.indexOf(b.subject);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    const data = [{
        name: '达成度',
        ...sortedSubjects.reduce((acc, s) => {
            const fullScore = ['语文', '数学', '英语'].includes(s.subject) ? 150 : 100;
            const percentage = Math.round((s.score / fullScore) * 1000) / 10;
            return { ...acc, [s.subject]: percentage };
        }, {})
    }];

    const CustomTooltip = ({ active, payload, coordinate }: any) => {
        if (active && payload && payload.length && coordinate) {
            return (
                <div
                    className="bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xl rounded-lg text-xs min-w-[240px]"
                    style={{ transform: `translateY(${-coordinate.y - 110}px)` }}
                >
                    <p className="font-bold text-slate-700 dark:text-slate-100 mb-2">各科达成度详情</p>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                        {payload.map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }}></div>
                                <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{p.name}:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-100">{p.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full">
            <div className="h-8 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 0, right: 0 }}>
                        <XAxis type="number" hide domain={[0, 'dataMax']} />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip
                            content={<CustomTooltip />}
                            allowEscapeViewBox={{ x: true, y: true }}
                        />
                        {sortedSubjects.map((s, i) => (
                            <Bar
                                key={s.subject}
                                dataKey={s.subject}
                                stackId="a"
                                fill={getSubjectColor(s.subject)}
                                radius={i === 0 ? [4, 0, 0, 4] : i === sortedSubjects.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5">
                {sortedSubjects.map((s) => (
                    <div key={s.subject} className="flex items-center gap-1 text-[9px] text-slate-400">
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: getSubjectColor(s.subject) }}></div>
                        {s.subject}
                    </div>
                ))}
            </div>
        </div>
    );
}
