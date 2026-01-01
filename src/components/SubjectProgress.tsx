import React from 'react';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

export function SubjectProgress({ name, score, total, color, gradeRank, classRank, prevGradeRank, prevClassRank, classAvg, onAIDiagnose, isDiagnosed }: any) {
    const percentage = (score / total) * 100;

    const renderTrend = (current: number, prev: number) => {
        if (!prev || current === prev) return null;
        const isImproved = current < prev; // 排名数字越小越好
        return isImproved ? (
            <TrendingUp className="w-2.5 h-2.5 ml-1 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
        ) : (
            <TrendingDown className="w-2.5 h-2.5 ml-1 text-rose-500 dark:text-rose-400 opacity-60" />
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                    <button
                        onClick={onAIDiagnose}
                        className="group/ai flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                        title={`${name} AI 深度诊断`}
                    >
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-lg group-hover/ai:text-indigo-600 transition-colors">{name}</span>
                        <div className={`p-1 rounded-md transition-all scale-75 group-hover/ai:scale-100 ${isDiagnosed ? 'bg-indigo-100 dark:bg-indigo-900/40 opacity-100' : 'bg-slate-100 dark:bg-slate-800 opacity-40 group-hover/ai:opacity-100'}`}>
                            <Sparkles className={`w-3.5 h-3.5 ${isDiagnosed ? 'text-indigo-600' : 'text-slate-400 group-hover/ai:text-indigo-500'}`} />
                        </div>
                    </button>
                    <div className="flex gap-2.5 font-sans">
                        {classRank && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded font-bold flex items-center group cursor-default shadow-sm border border-emerald-100/30 dark:border-emerald-800/30 shrink-0">
                                班{classRank}名
                                {renderTrend(classRank, prevClassRank)}
                            </span>
                        )}
                        {gradeRank && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded font-bold flex items-center group cursor-default shadow-sm border border-amber-100/30 dark:border-amber-800/30 shrink-0">
                                年{gradeRank}名
                                {renderTrend(gradeRank, prevGradeRank)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {classAvg && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold font-sans mt-0.5 whitespace-nowrap">
                            班均: {classAvg}
                        </span>
                    )}
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-sans tracking-tight">
                        <span className="text-slate-900 dark:text-slate-100 font-black text-xl mr-0.5">{score}</span>
                        / {total}
                    </span>
                </div>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-1000`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
