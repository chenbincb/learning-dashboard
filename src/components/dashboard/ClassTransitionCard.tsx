import React from 'react';
import { TrendingUp, TrendingDown, History, Target, ArrowRight } from 'lucide-react';

interface ComparisonData {
    history: {
        avgScore: number;
        avgGradeRank: number;
        examCount: number;
    };
    current: {
        score: number;
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

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
            <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">419环境适应性分析</h3>
                </div>
                <div className="text-[10px] text-slate-400 font-medium bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                    基于前 {data.history.examCount} 次考试均值
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* 排名位移视角 */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>年级排名位移</span>
                        </div>
                        
                        <div className="flex items-end gap-3">
                            <div className={`text-4xl font-black ${isRankImproved ? 'text-emerald-500' : 'text-rose-500'} flex items-center`}>
                                {isRankImproved ? (
                                    <TrendingUp className="w-8 h-8 mr-1 rotate-0" />
                                ) : (
                                    <TrendingDown className="w-8 h-8 mr-1" />
                                )}
                                {isRankImproved ? '提升' : '下降'}
                                <span className="ml-1 text-5xl">{absRankChange}</span>
                                <span className="text-xl ml-1 self-end mb-1">名</span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">
                            {isRankImproved 
                                ? `进入 ${data.current.class} 后，相较于原 19 班时期的平均水平，你的年级竞争力有了显著增长。`
                                : `分班后环境变化较大，目前年级位次较 19 班平均水平有所波动，建议关注新班级的教学节奏适配。`}
                        </p>
                    </div>

                    {/* 对比详情 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
                            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1">
                                <Target className="w-3 h-3" /> 19班时期均值
                            </div>
                            <div className="text-lg font-bold text-slate-700 dark:text-slate-200">{Math.round(data.history.avgScore)}分</div>
                            <div className="text-xs text-slate-400">年级排 #{avgRank}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/30 dark:border-indigo-800/20">
                            <div className="text-[10px] text-indigo-400 dark:text-indigo-500 font-bold uppercase mb-1 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" /> 当前 ({data.current.class})
                            </div>
                            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{data.current.score}分</div>
                            <div className="text-xs text-slate-500">年级排 #{data.current.gradeRank}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
