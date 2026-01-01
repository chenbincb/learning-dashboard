import React, { useEffect, useState } from 'react';
import { Map, XCircle, Sparkles, Share2, Download, AlertCircle } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { AIConfirmModal } from './AIConfirmModal';

interface StrategyPlannerProps {
    latest: any;
    targetData?: any;
    trendData: any[];
    studentId: string;
    examId: number;
    isOpen: boolean;
    onClose: () => void;
}

export function StrategyPlanner({ latest, targetData, trendData, studentId, examId, isOpen, onClose }: StrategyPlannerProps) {
    const { diagnose, loading, error, hasKey } = useAI();
    const [result, setResult] = useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [loadingLineIndex, setLoadingLineIndex] = useState(0);

    const loadingLines = [
        `目标名次：年级前 ${targetData?.targetRank || 500}`,
        `目标总分：${targetData?.total_score || 0}分`,
        `当前状态：第 ${latest.grade_rank} 名 / ${latest.total_score}分`,
        `班级位次：第 ${latest.class_rank} 名`,
        ...latest.subjects.map((s: any) => `${s.subject}差距：${(targetData?.subjects?.[s.subject] || 0) - s.score}分`),
        "正在通过 Gemini Pro 进行三阶段战略建模...",
        "正在基于考情模型生成视觉化路线图...",
        "正在优化学习路径关键节点..."
    ];

    useEffect(() => {
        let interval: any;
        if (loading) {
            interval = setInterval(() => {
                setLoadingLineIndex(prev => (prev + 1) % loadingLines.length);
            }, 1000);
        } else {
            setLoadingLineIndex(0);
        }
        return () => clearInterval(interval);
    }, [loading, loadingLines.length]);

    useEffect(() => {
        setResult(null); // 切换学生/考试重置结果
    }, [studentId, examId]);

    useEffect(() => {
        if (isOpen && hasKey && !result && !loading) {
            handleGenerate(false); // 默认先查缓存
        }
    }, [isOpen, hasKey, studentId, examId]);

    const handleGenerate = async (forceRefresh: boolean = false) => {
        // 预处理数据：计算稳定性与进步率
        const processedTrends = latest.subjects.map((sub: any) => {
            const history = trendData.map(e => {
                const s = e.subjects.find((s: any) => s.subject === sub.subject);
                return { score: s?.score || 0, grade_avg: s?.grade_avg || 0 };
            }).filter(h => h.score > 0);

            const ratios = history.map(h => (h.score || 0) / (h.grade_avg || 1));
            const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
            const variance = ratios.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / ratios.length;
            const volatility = Math.sqrt(variance);

            const trend = ratios.length > 1 ? (ratios[0] - ratios[ratios.length - 1]) : 0;

            const scores = history.map(h => h.score);
            const avgScore = (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1);

            return {
                subject: sub.subject,
                stability: ratios.length > 2 ? (volatility < 0.1 ? 'STABLE' : 'VOLATILE') : 'UNCERTAIN',
                recent_trend: trend > 0.05 ? 'IMPROVING' : trend < -0.05 ? 'DECLINING' : 'STABLE',
                avg_score: avgScore,
                difficulty_history: history.map(h => h.grade_avg)
            };
        });

        const context = {
            latest_performance: {
                total_score: latest.total_score,
                grade_rank: latest.grade_rank,
                class_rank: latest.class_rank,
                subjects: latest.subjects.map((s: any) => ({
                    subject: s.subject,
                    score: s.score,
                    grade_rank: s.grade_rank,
                    class_rank: s.class_rank,
                    grade_avg: s.grade_avg,
                    class_avg: s.class_avg,
                    target_score: targetData?.subjects?.[s.subject] || 0
                }))
            },
            historical_insights: processedTrends,
            target_rank: targetData?.targetRank || 500,
            target_total_score: targetData?.total_score || 0
        };
        const res = await diagnose('STRATEGY', context, {
            overrideModel: 'IMAGE',
            studentId,
            examId,
            forceRefresh
        });
        if (res) {
            setResult(res);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 w-full max-w-7xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                    <XCircle className="w-8 h-8" />
                </button>

                {/* Content */}
                <div className="flex flex-col md:flex-row min-h-[500px]">

                    {/* Left Panel: Info */}
                    <div className="w-full md:w-80 p-8 bg-slate-800/50 border-r border-slate-700 flex flex-col justify-center space-y-6 shrink-0">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-400">
                                <Map className="w-6 h-6" />
                                <span className="font-bold tracking-wider uppercase text-sm">Strategy Roadmap</span>
                            </div>
                            <h2 className="text-3xl font-black text-white leading-tight">
                                您的专属<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">提分作战地图</span>
                            </h2>
                            <p className="text-slate-400 text-sm">
                                Powered by <strong className="text-indigo-300">Nano Banana Pro</strong>
                            </p>
                        </div>

                        <div className="space-y-4">
                            {result?.plan ? (
                                <div className="space-y-3">
                                    {[
                                        { label: 'P1', title: '基础巩固', content: result.plan.phase1 },
                                        { label: 'P2', title: '专项突破', content: result.plan.phase2 },
                                        { label: 'P3', title: '考前冲刺', content: result.plan.phase3 }
                                    ].map((phase, idx) => (
                                        <div key={idx} className="bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black bg-indigo-500 text-white px-1.5 rounded-md">{phase.label}</span>
                                                <span className="text-xs font-bold text-indigo-300">{phase.title}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                                                {phase.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    AI 根据您的薄弱学科和目标排名，为您生成了这张视觉化路径图。请保存并在复习时时刻对照。
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Image Display */}
                    <div className="flex-1 bg-slate-950 flex items-center justify-center p-0 relative overflow-hidden group">
                        {loading ? (
                            <div className="text-center space-y-6 p-12 relative z-10">
                                <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-8"></div>
                                <div className="space-y-3 h-20 flex flex-col justify-center">
                                    <p className="text-indigo-400 font-black tracking-widest uppercase text-xs animate-pulse">
                                        Data Processing
                                    </p>
                                    <div className="overflow-hidden">
                                        <p key={loadingLineIndex} className="text-slate-400 text-lg font-medium animate-in slide-in-from-bottom-4 duration-500 animate-pulse tracking-wide">
                                            {loadingLines[loadingLineIndex]}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-8">
                                    <div className="flex gap-1 justify-center">
                                        {loadingLines.map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 rounded-full transition-all duration-500 ${i === loadingLineIndex ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-800'}`}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : result?.image_url ? (
                            <div className="w-full h-full flex items-center justify-center relative">
                                <img
                                    src={result.image_url}
                                    alt="Strategy Roadmap"
                                    className="w-full h-full object-cover opacity-60 blur-2xl absolute inset-0 scale-110"
                                />
                                <img
                                    src={result.image_url}
                                    alt="Strategy Roadmap"
                                    className="relative max-h-full max-w-full object-contain shadow-2xl transition-transform duration-500 z-10"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20 z-20 pointer-events-none" />

                                <div className="absolute bottom-6 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                    <button
                                        onClick={() => setIsConfirmOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm shadow-lg hover:bg-indigo-700 cursor-pointer"
                                    >
                                        <Sparkles className="w-4 h-4" /> 重新生成
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-full font-bold text-sm shadow-lg hover:bg-slate-100 cursor-pointer">
                                        <Download className="w-4 h-4" /> 保存原图
                                    </button>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="text-center space-y-4">
                                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto opacity-80" />
                                <div className="space-y-1">
                                    <p className="text-rose-400 font-bold">生成失败</p>
                                    <p className="text-slate-500 text-xs max-w-xs">{error}</p>
                                </div>
                                <button
                                    onClick={() => handleGenerate(true)}
                                    className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                    重试
                                </button>
                            </div>
                        ) : (
                            <div className="text-center space-y-6 p-12">
                                <div className="space-y-4">
                                    <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-indigo-500/5">
                                        <Map className="w-12 h-12 text-indigo-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white">准备好生成您的地图了吗？</h3>
                                        <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                                            我们将结合您的{latest.subjects.length}门考试数据，为您绘制一张通往年级前{targetData?.targetRank || 500}名的视觉化战略路径。
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleGenerate(true)}
                                    className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-3 mx-auto cursor-pointer"
                                >
                                    <Sparkles className="w-6 h-6" /> 开启智能绘图
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <AIConfirmModal
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={() => handleGenerate(true)}
                    title="重新生成战略地图"
                    description="确定要重新生成提分作战地图吗？这将开启一次全新的 AI 绘图任务，并消耗额外的 AI 资源。"
                />
            </div>
        </div>
    );
}
