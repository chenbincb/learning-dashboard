import React, { useEffect, useState } from 'react';
import { Microscope, Brain, Target, AlertCircle, CheckCircle2, XCircle, ChevronRight, Activity, Sparkles } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { getSubjectColor } from '@/lib/chartUtils';
import { AIConfirmModal } from './AIConfirmModal';

interface SubjectDoctorProps {
    subject: any;
    studentId: string;
    examId: number;
    trendData?: any[]; // 历史趋势数据
    peerComparison?: string; // 可选：同水平同学表现
    onClose: () => void;
}

export function SubjectDoctor({ subject, studentId, examId, trendData, peerComparison, onClose }: SubjectDoctorProps) {
    const { diagnose, loading, error, hasKey } = useAI();
    const [result, setResult] = useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        if (hasKey && subject && !result && !loading) {
            handleDiagnose(false); // 默认先检查缓存
        }
    }, [hasKey, subject]);

    const handleDiagnose = async (forceRefresh: boolean = false) => {
        // 提取该学科的历史难度与表现
        const subjectHistory = trendData?.map(exam => {
            const sub = exam.subjects.find((s: any) => s.subject === subject.subject);
            return {
                exam_name: exam.name,
                score: sub?.score,
                grade_avg: sub?.grade_avg // 难度系数
            };
        }).filter(h => h.score !== undefined);

        // 计算难度归一化后的波动率 (Volatility)
        // 使用 (得分 / 年级均分) 的标准差来衡量稳定性，排除试卷难度的干扰
        let volatility = 0;
        if (subjectHistory && subjectHistory.length > 1) {
            const ratios = subjectHistory.map(h => (h.score || 0) / (h.grade_avg || 1));
            const mean = ratios.reduce((a: number, b: number) => a + b, 0) / ratios.length;
            const variance = ratios.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / ratios.length;
            volatility = Math.sqrt(variance); // 标准差越大，波动越大
        }

        const context = {
            subject: subject.subject,
            subject_metrics: {
                score: subject.score,
                class_avg: subject.class_avg,
                grade_avg: subject.grade_avg, // 当前难度
                grade_rank: subject.grade_rank,
                class_rank: subject.class_rank
            },
            history: subjectHistory, // 历史背景
            stability_index: {
                x: subject.score / (['语文', '数学', '英语'].includes(subject.subject) ? 150 : 100),
                y: Math.min(volatility * 2, 1) // 归一化到 0-1 范围，乘以系数放大细微波动
            },
            peer_comparison: peerComparison
        };

        // 强制使用 Pro 模型进行深度思考
        const res = await diagnose(`SUBJECT_DEEP_DIVE:${subject.subject}` as any, context, {
            overrideModel: 'PRO',
            studentId,
            examId,
            forceRefresh
        });
        if (res) {
            setResult(res);
        }
    };

    const color = getSubjectColor(subject.subject);

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="relative h-24 shrink-0 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-slate-900/10 z-10" />
                    <div className="absolute inset-0" style={{ backgroundColor: color, opacity: 0.1 }} />

                    <div className="absolute bottom-3 left-6 z-20 text-white">
                        <div className="flex items-center gap-2 mb-1 opacity-90">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-sm font-medium tracking-wide">AI 深度病理诊断</span>
                        </div>
                        <h2 className="text-3xl font-bold flex items-center gap-3">
                            {subject.subject}
                            <span className="text-xl font-normal opacity-80 bg-white/20 px-2 py-0.5 rounded-lg border border-white/20">
                                {subject.score}分
                            </span>
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-30 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors cursor-pointer"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto min-h-[300px]">
                    {!hasKey ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                                <Brain className="w-12 h-12 text-slate-400" />
                            </div>
                            <h3 className="text-slate-900 dark:text-slate-100 font-semibold">AI 大脑未连接</h3>
                            <p className="text-sm text-slate-500 max-w-xs">请先在看板首页配置 API Key，开启学科深度诊断功能。</p>
                        </div>
                    ) : loading ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 animate-pulse">
                                <Activity className="w-5 h-5 animate-spin" />
                                <span className="text-sm font-medium">Gemini Pro 正在会诊中...</span>
                            </div>
                            <div className="space-y-3">
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full animate-pulse" />
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-[90%] animate-pulse" />
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-[95%] animate-pulse" />
                            </div>
                        </div>
                    ) : result ? (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">

                            {/* 诊断结论 */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> 诊断报告
                                </h3>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                                        {result.diagnosis}
                                    </p>

                                    {/* 根因标签 */}
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {result.root_cause && (
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${result.root_cause === 'FOUNDATION_WEAK' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                result.root_cause === 'SKILL_ISSUE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    result.root_cause === 'MINDSET' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        'bg-slate-100 text-slate-700 border-slate-200'
                                                }`}>
                                                根因：{
                                                    result.root_cause === 'FOUNDATION_WEAK' ? '基础不牢' :
                                                        result.root_cause === 'SKILL_ISSUE' ? '技巧欠缺' :
                                                            result.root_cause === 'MINDSET' ? '考中心态' :
                                                                result.root_cause === 'EXAM_DIFFICULTY' ? '题目难度' :
                                                                    result.root_cause === 'INCONSISTENT_BY_DIFFICULTY' ? '难度适应性不均' :
                                                                        '综合因素'
                                                }
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>



                            {/* 处方建议 */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Target className="w-4 h-4" /> 提分处方
                                </h3>
                                <ul className="space-y-2">
                                    {result.suggestions.map((s: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                                                {i + 1}
                                            </div>
                                            <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-full">
                                <AlertCircle className="w-8 h-8 text-rose-500" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-slate-900 dark:text-slate-100 font-bold">诊断遇到问题</h3>
                                <p className="text-sm text-slate-500 max-w-xs">{error}</p>
                            </div>
                            <button
                                onClick={() => handleDiagnose(true)}
                                className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                                重试
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                                <Brain className="w-8 h-8 text-indigo-500" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-slate-900 dark:text-slate-100 font-bold">准备好开始了吗？</h3>
                                <p className="text-sm text-slate-500 max-w-xs">AI 老师将针对您的单科表现进行深度病理分析。</p>
                            </div>
                            <button
                                onClick={() => handleDiagnose(true)}
                                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                开始深度诊断
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        {result && !loading && (
                            <button
                                onClick={() => setIsConfirmOpen(true)}
                                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                                <Activity className="w-3.5 h-3.5" />
                                重新诊断
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                        完成会诊
                    </button>
                </div>
            </div>
            <AIConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => handleDiagnose(true)}
                title={`重新诊断 - ${subject.subject}`}
                description={`确定要对 ${subject.subject} 重新进行深度诊断吗？AI 将结合您的最新表现重新推演薄弱点与攻克建议。`}
            />
        </div>
    );
}
