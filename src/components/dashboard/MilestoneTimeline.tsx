'use client';

import React from 'react';
import { Flag, Trophy, TrendingUp, TrendingDown } from 'lucide-react';

interface MilestoneTimelineProps {
    exams: any[];
}

export function MilestoneTimeline({ exams = [] }: MilestoneTimelineProps) {
    if (!exams || exams.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-3">
                    <Flag className="w-6 h-6 opacity-20" />
                </div>
                <p className="text-xs">暂无历史考试记录</p>
            </div>
        );
    }
    const displayExams = exams.slice(0, 5);

    return (
        <div className="space-y-0 py-4 px-2">
            {displayExams.map((e, i) => {
                const prevExam = exams[i + 1];
                const rankChange = prevExam ? prevExam.grade_rank - e.grade_rank : 0;
                const isImproved = rankChange > 0;
                const isTop = e.grade_rank <= 100;

                return (
                    <div key={e.exam_id} className="relative pl-8 pb-8 last:pb-0">
                        {i !== displayExams.length - 1 && (
                            <div className="absolute left-[11px] top-6 w-[2px] h-full bg-slate-200 dark:bg-slate-800"></div>
                        )}

                        <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-sm z-10 transition-colors ${isTop ? 'bg-amber-400' : 'bg-indigo-500'
                            }`}>
                            {isTop ? <Trophy className="w-2.5 h-2.5 text-white" /> : <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>

                        <div className="flex flex-col gap-1.5 group">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${i === 0
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                    {e.date ? e.date.replace(/-/g, '.') : '暂无日期'}
                                </span>
                                {i === 0 && (
                                    <span className="text-[9px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1 py-0.5 rounded-full font-bold">LATEST</span>
                                )}
                            </div>

                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {e.name}
                            </h4>

                            <div className="flex items-center gap-3 mt-0.5">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">总分</span>
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{e.total_score}</span>
                                </div>
                                <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">年排</span>
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">#{e.grade_rank}</span>
                                </div>

                                {prevExam && rankChange !== 0 && (
                                    <div className={`flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isImproved
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                                        }`}>
                                        {isImproved ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                                        {Math.abs(rankChange)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
