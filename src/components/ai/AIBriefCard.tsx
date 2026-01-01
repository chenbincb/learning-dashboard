import React, { useEffect, useState } from 'react';
import { Sparkles, Activity, AlertTriangle, TrendingUp, TrendingDown, Settings, Map, AlertCircle } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { AIConfirmModal } from './AIConfirmModal';
import { StrategyPlanner } from '@/components/ai/StrategyPlanner';

interface AIBriefCardProps {
    examResult: any;
    trend: any[];
    onOpenSettings: () => void;
    onOpenStrategy: () => void;
}

export function AIBriefCard({ examResult, trend, onOpenSettings, onOpenStrategy }: AIBriefCardProps) {
    const { diagnose, loading, error, hasKey } = useAI();
    const [result, setResult] = useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // 检查是否有缓存
    // 0. 识别学生最新的考试 ID (基于 Trend 也就是时间轴)
    // Trend 是按时间升序的，所以最后一个即为最新
    const latestExamId = trend.length > 0 ? trend[trend.length - 1].exam_id : examResult?.exam_id;
    const isLatestView = examResult?.exam_id === latestExamId;

    // 检查是否有缓存
    useEffect(() => {
        setResult(null); // 切换学生重置结果
        if (examResult?.student_id && latestExamId) {
            checkCache();
        }
    }, [examResult?.student_id, latestExamId]);

    const checkCache = async () => {
        // 尝试获取缓存 (使用最新考试ID，确保跨历史查看时总评一致)
        await handleDiagnose(false);
    }

    const handleDiagnose = async (forceRefresh: boolean = false) => {
        if (!examResult || !latestExamId) return;

        // 保护机制：如果不是查看最新考试，且尝试强制刷新(生成)，则阻止
        // 原因：生成需要基于最新考试的详细 Context，而查看历史时可能只有部分数据
        if (forceRefresh && !isLatestView) {
            alert("请切换到最近一次考试页面进行重新诊断");
            return;
        }

        // 1. 组装总评 Context
        // 计算班级均分总和作为难度基准
        const classAvgTotal = examResult.subjects.reduce((acc: number, curr: any) => acc + (curr.class_avg || 0), 0);

        // 提取排名前 5 次趋势
        const rankTrend = trend.slice(0, 5).map(t => ({
            name: t.name,
            grade_rank: t.grade_rank,
            class_rank: t.class_rank
        }));

        const context = {
            current_exam: {
                grade_rank: examResult.grade_rank,
                class_rank: examResult.class_rank,
                grade_total: 1200,
            },
            rank_trend: rankTrend,
            macro_environment: {
                class_avg_total: Math.round(classAvgTotal)
            }
        };

        // 关键修改：此时传入的是 latestExamId，而非当前查看的 exam_id
        // 从而实现：无论看哪次考试，获取的都是该学生"最新状态"的诊断
        const res = await diagnose('OVERVIEW', context, {
            studentId: examResult.student_id,
            examId: latestExamId, // <--- Key Change
            forceRefresh
        });

        if (res) {
            setResult(res);
        }
    };

    if (!hasKey) {
        return (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">AI 智能诊断未开启</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">配置 Gemini API Key，获取深度学情分析</p>
                    </div>
                </div>
                <button
                    onClick={onOpenSettings}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                    <Settings className="w-3.5 h-3.5" />
                    去配置
                </button>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow py-3 flex items-center">
            {/* 顶部装饰条 indicator */}
            <div className={`h - full w - 1 absolute top - 0 left - 0 bg - gradient - to - b 
                ${result?.trend_tag === 'RISING_STAR' ? 'from-emerald-400 to-teal-500' :
                    result?.trend_tag === 'SLIPPING' ? 'from-amber-400 to-orange-500' :
                        result?.trend_tag === 'CRISIS' ? 'from-rose-500 to-red-600' :
                            'from-indigo-400 to-purple-500'
                } `}
            />

            <div className="flex-1 flex items-center px-4 gap-4 min-w-0">
                {/* 1. Icon & Status */}
                <div className="shrink-0">
                    {loading ? (
                        <div className="animate-spin text-indigo-500 p-2 bg-indigo-50 dark:bg-slate-800 rounded-xl">
                            <Sparkles className="w-5 h-5" />
                        </div>
                    ) : result ? (
                        <div className={`p - 2 rounded - xl shadow - sm ${result.trend_tag === 'RISING_STAR' ? 'bg-emerald-50 text-emerald-600' :
                            result.trend_tag === 'CRISIS' ? 'bg-rose-50 text-rose-600' :
                                'bg-indigo-50 text-indigo-600'
                            } `}>
                            {result.trend_tag === 'RISING_STAR' && <TrendingUp className="w-5 h-5" />}
                            {result.trend_tag === 'SLIPPING' && <Activity className="w-5 h-5" />}
                            {result.trend_tag === 'CRISIS' && <AlertTriangle className="w-5 h-5" />}
                            {result.trend_tag === 'STABLE' && <Sparkles className="w-5 h-5" />}
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-slate-400">
                            <Sparkles className="w-5 h-5" />
                        </div>
                    )}
                </div>

                {/* 2. Content Area */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            AI 诊断总评
                        </h3>
                        {result && (
                            <span className="text-[10px] px-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                历史分析:{trend.length}
                            </span>
                        )}
                        {result?.confidence_score && (
                            <span className={`text-[10px] flex items-center gap-1 whitespace-nowrap font-medium ${result.confidence_score > 80 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${result.confidence_score > 80 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                置信度{result.confidence_score}%
                            </span>
                        )}
                        {error && (
                            <span className="text-[10px] text-rose-500 bg-rose-50 px-1 rounded truncate max-w-[120px]">
                                {error}
                            </span>
                        )}
                    </div>

                    <div className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed tracking-wide mt-1.5">
                        {loading ? (
                            "正在分析此次考试数据..."
                        ) : result ? (
                            result.summary
                        ) : (
                            "AI 就绪。点击右侧开始深度诊断。"
                        )}
                    </div>
                </div>

                {/* 3. Actions Area */}
                <div className="shrink-0 flex items-center gap-2">
                    <button
                        onClick={onOpenStrategy}
                        className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-indigo-100 dark:border-slate-800 cursor-pointer"
                        title="查看提分作战地图"
                    >
                        <Map className="w-4 h-4" />
                    </button>

                    {!loading && !result && (
                        <button
                            onClick={() => handleDiagnose(true)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Sparkles className="w-3 h-3" />
                            开始诊断
                        </button>
                    )}

                    {result && !loading && (
                        <button
                            onClick={() => setIsConfirmOpen(true)}
                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-indigo-100 cursor-pointer"
                            title="重新诊断"
                        >
                            <Sparkles className="w-4 h-4" />
                        </button>
                    )}

                    <button
                        onClick={onOpenSettings}
                        className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="设置"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>

                <AIConfirmModal
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={() => handleDiagnose(true)}
                    title="重新进行 AI 诊断"
                    description="确定要重新进行 AI 诊断吗？这将会深入分析本次考试的所有科目数据，并消耗额外的 AI 资源。"
                />
            </div>
        </div>
    );
}
