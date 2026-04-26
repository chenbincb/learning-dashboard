'use client';

import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

interface RadarAnalysisProps {
    subjects: any[];
    variant?: 'card' | 'plain';
}

export function RadarAnalysis({ subjects, variant = 'card' }: RadarAnalysisProps) {
    const [visible, setVisible] = React.useState({ personal: true, class: true });

    const subjectOrder = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];

    const radarData = subjects
        .filter(s => s.score !== null && subjectOrder.includes(s.subject))
        .sort((a, b) => subjectOrder.indexOf(a.subject) - subjectOrder.indexOf(b.subject))
        .map(s => {
            const fullScore = s.full_score || (['语文', '数学', '英语'].includes(s.subject) ? 150 : 100);
            
            // 个人得分率
            const personalRate = Math.round((s.score / fullScore) * 1000) / 10;

            // 班级平均得分率
            const classRate = s.class_avg 
                ? Math.round((s.class_avg / fullScore) * 1000) / 10 
                : 0;

            return {
                subject: s.subject,
                个人得分率: personalRate,
                班级均分: classRate,
                及格线: 60,
                fullMark: 100,
                rawScore: s.score,
                classAvg: s.class_avg,
                fullScore
            };
        });

    const CustomTooltip = ({ active, payload, coordinate }: any) => {
        if (active && payload && payload.length && coordinate) {
            const d = payload[0].payload;
            return (
                <div
                    className="bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xl rounded-lg text-xs"
                    style={{ transform: `translateY(${-coordinate.y}px)` }}
                >
                    <p className="font-bold text-slate-700 dark:text-slate-100 mb-2">{d.subject}（满分 {d.fullScore}）</p>
                    {payload.filter((p: any) => p.name !== '及格线').map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                            <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-100">
                                {p.name === '个人得分率' ? `${d.rawScore}分` : `${d.classAvg}分`}
                                <span className="font-normal text-slate-400 ml-1">({p.value}%)</span>
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={variant === 'card' ? "bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors" : "py-1"}>
            <div className={`flex items-center ${variant === 'card' ? 'justify-between mb-4' : 'justify-end mb-1 pr-4'}`}>
                {variant === 'card' && <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">学科均衡度</h3>}
                <div className="flex gap-3 text-[10px] font-sans">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-0.5 bg-red-500"></div>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">及格线</span>
                    </div>
                    <button
                        onClick={() => setVisible(prev => ({ ...prev, personal: !prev.personal }))}
                        className={`flex items-center gap-1 transition-opacity ${visible.personal ? 'opacity-100' : 'opacity-30'}`}
                    >
                        <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">个人</span>
                    </button>
                    <button
                        onClick={() => setVisible(prev => ({ ...prev, class: !prev.class }))}
                        className={`flex items-center gap-1 transition-opacity ${visible.class ? 'opacity-100' : 'opacity-30'}`}
                    >
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">班均</span>
                    </button>
                </div>
            </div>
            <div className={`w-full ${variant === 'card' ? 'h-[350px]' : 'h-[230px]'}`}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="85%" data={radarData}>
                        <PolarGrid stroke="rgb(var(--chart-grid))" className="opacity-40" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgb(var(--chart-text))', fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="及格线"
                            dataKey="及格线"
                            stroke="#ef4444"
                            fill="none"
                            fillOpacity={0}
                        />
                        {visible.class && (
                            <Radar
                                name="班级均分"
                                dataKey="班级均分"
                                stroke="#10b981"
                                fill="#10b981"
                                fillOpacity={0.2}
                            />
                        )}
                        {visible.personal && (
                            <Radar
                                name="个人得分率"
                                dataKey="个人得分率"
                                stroke="#4f46e5"
                                fill="#4f46e5"
                                fillOpacity={0.4}
                            />
                        )}
                        <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
