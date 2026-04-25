import React from 'react';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { getSubjectTotal } from '@/lib/constants';

export function SubjectProgress({ name, score, scaledScore, targetScore, total, color, gradeRank, gradeTotal, classRank, artsScienceRank, prevGradeRank, prevClassRank, classAvg, onAIDiagnose, isDiagnosed }: any) {
    const subjectTotal = getSubjectTotal(name, gradeTotal);
    // 进度条百分比基于最终分（赋分优先，否则原始分）
    const finalScore = (scaledScore && scaledScore > 0) ? scaledScore : score;
    const percentage = (finalScore / total) * 100;

    // 计算目标差距
    const targetGap = targetScore ? (finalScore - targetScore) : null;

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
        <div className="group/subject">
            <div className="flex justify-between items-start mb-1.5 md:mb-2">
                <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={onAIDiagnose}
                            className="group/ai flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                            title={`${name} AI 深度诊断`}
                        >
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-base md:text-lg group-hover/ai:text-indigo-600 transition-colors">{name}</span>
                            <div className={`p-1 rounded-md transition-all scale-75 group-hover/ai:scale-90 ${isDiagnosed ? 'bg-indigo-100 dark:bg-indigo-900/40 opacity-100' : 'bg-slate-100 dark:bg-slate-800 opacity-40 group-hover/ai:opacity-100'}`}>
                                <Sparkles className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isDiagnosed ? 'text-indigo-600' : 'text-slate-400 group-hover/ai:text-indigo-500'}`} />
                            </div>
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1 md:gap-1.5 font-sans">
                        {classRank && (
                            <span className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1 py-0.5 rounded font-bold flex items-center group cursor-default shrink-0">
                                班{classRank}
                                {renderTrend(classRank, prevClassRank)}
                            </span>
                        )}
                        {gradeRank && (
                            <span className="text-[10px] md:text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.5 rounded font-bold flex items-center group cursor-default shrink-0">
                                年{gradeRank} / {subjectTotal}
                                {renderTrend(gradeRank, prevGradeRank)}
                            </span>
                        )}
                        {artsScienceRank && (
                            <span className="text-[10px] md:text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-1 py-0.5 rounded font-bold flex items-center group cursor-default shrink-0">
                                组{artsScienceRank}
                            </span>
                        )}
                        {scaledScore && scaledScore > 0 && scaledScore !== score && (
                            <span className="text-[10px] md:text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1 py-0.5 rounded font-bold flex items-center group cursor-default shrink-0">
                                原{score}
                            </span>
                        )}
                        {classAvg && (
                            <span className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 px-1 py-0.5 font-bold shrink-0">
                                均:{classAvg}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-1">
                            <span className="text-slate-900 dark:text-slate-100 font-black text-xl md:text-2xl tracking-tighter">
                                {finalScore}
                            </span>
                            <span className="text-[10px] md:text-xs font-semibold text-slate-400 dark:text-slate-500 font-sans">
                                / {total}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 -mt-1">
                            {targetGap !== null && (
                                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${targetGap >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {targetGap >= 0 ? '+' : ''}{targetGap.toFixed(1)}
                                    <span className="text-[8px] opacity-70 font-normal">对标分差</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.05)]`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

