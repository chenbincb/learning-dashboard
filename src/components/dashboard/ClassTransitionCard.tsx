import React from 'react';
import { TrendingUp, TrendingDown, History, Target, ArrowRight } from 'lucide-react';

interface ComparisonData {
    history: {
        avgScore: number;
        avgFullScore: number;
        avgGradeRank: number;
        examCount: number;
    };
    current: {
        score: number;
        fullScore: number;
        gradeRank: number;
        class: string;
    };
    rankChange: number;
    scoreChange: number;
}

interface ClassTransitionCardProps {
    data: ComparisonData | null;
}

export const ClassTransitionCard: React.FC<ClassTransitionCardProps> = ({ data }) => {
    if (!data) return null;

    const isRankImproved = data.rankChange <= 0;
    const absRankChange = Math.round(Math.abs(data.rankChange));
    const avgRank = Math.round(data.history.avgGradeRank);

    // 计算得分率，这比绝对分更有说服力
    const historyRate = (data.history.avgScore / (data.history.avgFullScore || 750)) * 100;
    const currentRate = (data.current.score / (data.current.fullScore || 750)) * 100;
    const rateChange = currentRate - historyRate;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md flex flex-col h-full">
            <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">环境适应性分析</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    样本量: {data.history.examCount} 场
                </span>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                {/* 核心对比区 */}
                <div className="relative flex items-center justify-between gap-4">
                    {/* 19班 - 过去 */}
                    <div className="flex-1 text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 relative">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-400 text-white text-[8px] font-bold rounded-full">BEFORE</div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">19班平均水平</p>
                        <div className="text-3xl font-black text-slate-700 dark:text-slate-200 leading-none">
                            {historyRate.toFixed(1)}<span className="text-sm ml-0.5">%</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-2 font-sans">
                            {Math.round(data.history.avgScore)} <span className="opacity-60">/ {data.history.avgFullScore}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 font-sans font-bold"># {avgRank}</div>
                    </div>

                    {/* 变化指示器 */}
                    <div className="shrink-0 flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${isRankImproved ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}>
                            {isRankImproved ? (
                                <TrendingUp className="w-6 h-6 text-white" />
                            ) : (
                                <TrendingDown className="w-6 h-6 text-white" />
                            )}
                        </div>
                        <div className={`mt-2 text-[10px] font-black uppercase tracking-tighter ${isRankImproved ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isRankImproved ? 'Performance' : 'Adapting'}
                        </div>
                    </div>

                    {/* 当前班级 - 现在 */}
                    <div className="flex-1 text-center p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/30 relative">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-bold rounded-full">NOW</div>
                        <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase mb-2">{data.current.class}</p>
                        <div className="text-3xl font-black text-slate-900 dark:text-slate-100 leading-none">
                            {currentRate.toFixed(1)}<span className="text-sm ml-0.5">%</span>
                        </div>
                        <div className="text-[10px] text-indigo-400 dark:text-indigo-300 mt-2 font-sans">
                            {data.current.score} <span className="opacity-60">/ {data.current.fullScore}</span>
                        </div>
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 font-sans font-bold"># {data.current.gradeRank}</div>
                    </div>
                </div>

                {/* 关键位移大卡 */}
                <div className={`p-4 rounded-2xl border-2 border-dashed flex items-center justify-between ${isRankImproved ? 'bg-emerald-50/30 border-emerald-200/50 dark:bg-emerald-950/10' : 'bg-amber-50/30 border-amber-200/50 dark:bg-amber-950/10'}`}>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-black tracking-tighter ${isRankImproved ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isRankImproved ? '+' : '-'}{absRankChange}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase">位次波动</span>
                    </div>
                    <div className="max-w-[180px] text-right">
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                            {isRankImproved
                                ? `效能提升 ${rateChange.toFixed(1)}%。你在新班级的竞争强度下表现出了更强的韧性。`
                                : `效能波动 ${Math.abs(rateChange).toFixed(1)}%。新环境竞争节奏尚在适应中，不必过度焦虑。`}
                        </p>
                    </div>
                </div>

                {/* AI 结论导語 */}
                <div className="pt-2">
                    <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl italic text-center whitespace-pre-wrap">
                        {`"通过横向对比发现，你在 ${data.current.class} 的发挥效率较 19 班时期${isRankImproved ? '有显著提升' : '稍显滞后'}。\n建议保持当前的复习节奏，继续深化知识点的颗粒度。"`}
                    </p>
                </div>
            </div>
        </div>
    );
};
