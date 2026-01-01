'use client';

import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Award,
    BookOpen,
    ChevronRight,
    Calendar,
    RefreshCw,
    Loader2,
    Trophy,
    Star,
    Sun,
    Moon,
    Target,
    Zap,
    AlertTriangle,
    Swords,
    Plus,
    X,
    LayoutGrid,
    Flag,
    Compass,
    Lightbulb,
    Check,
    Download
} from 'lucide-react';
import { API } from '@/lib/api';
import { exportDashboardByElementId } from '@/lib/exportUtils';
import { StatCard } from '@/components/StatCard';
import { SubjectProgress } from '@/components/SubjectProgress';
import Link from 'next/link';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { getSubjectColor } from '@/lib/chartUtils';
import { RadarAnalysis } from '@/components/dashboard/RadarAnalysis';
import { ScoreComposition } from '@/components/dashboard/ScoreComposition';
import { ScoreGapAnalysis } from '@/components/dashboard/ScoreGapAnalysis';
import { QuadPerformanceChart } from '@/components/dashboard/QuadPerformanceChart';
import { SubjectInsightPanel } from '@/components/dashboard/SubjectInsightPanel';
import { MilestoneTimeline } from '@/components/dashboard/MilestoneTimeline';
import { StabilityScatter } from '@/components/dashboard/StabilityScatter';
import { AIBriefCard } from '@/components/ai/AIBriefCard';
import { AISettingsModal } from '@/components/ai/AISettingsModal';
import { SubjectDoctor } from '@/components/ai/SubjectDoctor';
import { StrategyPlanner } from '@/components/ai/StrategyPlanner';

export default function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState('66641354');
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [targetRank, setTargetRank] = useState(500); // 默认目标名次 500
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [showGradeRank, setShowGradeRank] = useState(true);
    const [showClassRank, setShowClassRank] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
    const [isStrategyOpen, setIsStrategyOpen] = useState(false);
    const [diagnosingSubject, setDiagnosingSubject] = useState<any>(null);
    const [diagnosedIntents, setDiagnosedIntents] = useState<string[]>([]);

    const fetchDiagnosedIntents = async () => {
        if (!selectedStudentId || !selectedExamId) return;
        try {
            const res = await fetch(`/api/diagnose?studentId=${selectedStudentId}&examId=${selectedExamId}`);
            if (res.ok) {
                const data = await res.json();
                setDiagnosedIntents(data);
            }
        } catch (err) {
            console.error('Failed to fetch diagnosed intents:', err);
        }
    };

    useEffect(() => {
        fetchDiagnosedIntents();
    }, [selectedStudentId, selectedExamId]);
    const [trendRankType, setTrendRankType] = useState<'grade' | 'class' | 'both'>('both'); // Legacy, can be derived or removed if fully replaced
    const [trendMultiSelect, setTrendMultiSelect] = useState(false);
    const [trendVisibleSubjects, setTrendVisibleSubjects] = useState<Record<string, boolean>>({
        '总分': true,
        '语文': false, '数学': false, '英语': false,
        '物理': false, '化学': false, '生物': false,
        '政治': false, '历史': false, '地理': false
    });

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            }
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const fetchData = async (studentId: string, examId?: string | null, tr?: number) => {
        if (!data) setLoading(true);
        try {
            const currentTR = tr || targetRank;
            const json = await API.fetchStudentScores(studentId, examId, currentTR);
            setData(json);
            if (!examId && json.latest) {
                setSelectedExamId(json.latest.exam_id.toString());
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // 监听目标排名变化
    useEffect(() => {
        if (selectedStudentId) {
            fetchData(selectedStudentId, selectedExamId, targetRank);
        }
    }, [targetRank]);

    useEffect(() => {
        // 加载学生列表
        API.fetchStudentList().then(setStudents);

        fetchData(selectedStudentId);
    }, []);

    const handleStudentSelect = (id: string) => {
        setSelectedStudentId(id);
        setSelectedExamId(null); // 切换学生时重置考试选择，默认显示最新
        fetchData(id, null);
    };

    const handleExamSelect = (id: string) => {
        setSelectedExamId(id);
        fetchData(selectedStudentId, id);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const { examName, examDate, data } = json;

                await API.importExamData({ examName, examDate, data });

                alert(`成功导入考试: ${examName}`);
                window.location.reload(); // 简单处理：导入后刷新页面
            } catch (err: any) {
                alert(`导入失败: ${err.message || '未知错误'}`);
            }
        };
        reader.readAsText(file);
    };



    if (!data || !data.latest) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-200 dark:bg-slate-950 transition-colors duration-300">
                <p className="text-slate-500 dark:text-slate-400">暂无成绩数据，请先抓取成绩。</p>
            </div>
        );
    }

    const { latest, trend, exams, targetData } = data;
    const subjects = latest.subjects || [];
    const physicsScore = subjects.find((s: any) => s.subject === '物理');

    return (
        <div className="min-h-screen bg-slate-200 dark:bg-slate-950 transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-md py-4 border-b border-slate-300/50 dark:border-slate-800/50 px-4 md:px-8 transition-colors w-full">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">学情看板</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">欢迎回来，{latest.student_name}。这是您的学业概览。</p>
                        </div>


                        {/* Student Selector */}
                        <div className={`flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all no-print`}>
                            <Users className="w-4 h-4 text-slate-400" />
                            <select
                                className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer min-w-[100px] disabled:cursor-not-allowed"
                                value={selectedStudentId}
                                onChange={(e) => handleStudentSelect(e.target.value)}
                            >
                                {students.map((s: any) => (
                                    <option key={s.id} value={s.id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Exam Selector */}
                        <div className={`flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all no-print`}>
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <select
                                className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer min-w-[140px] disabled:cursor-not-allowed"
                                value={selectedExamId || ''}
                                onChange={(e) => handleExamSelect(e.target.value)}
                            >
                                {exams.map((e: any) => (
                                    <option key={e.exam_id} value={e.exam_id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                                        {e.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 dark:border-emerald-900/50 cursor-pointer no-print">
                            <Plus className="w-4 h-4" />
                            导入数据
                            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                        </label>
                        <Link
                            href="/leaderboard"
                            className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 hover:text-white transition-all border border-amber-100 dark:border-amber-900/50 no-print"
                        >
                            <Trophy className="w-4 h-4" />
                            排行榜
                        </Link>
                        <Link
                            href="/pk"
                            className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 dark:border-indigo-900/50 no-print"
                        >
                            <Swords className="w-4 h-4" />
                            进入 PK 场
                        </Link>
                        <button
                            onClick={toggleTheme}
                            className="group p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-slate-600 dark:text-slate-300 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer no-print"
                            title={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
                        >
                            {theme === 'light' ? (
                                <Moon className="w-5 h-5 group-hover:text-indigo-500 group-hover:rotate-12 transition-all duration-300" />
                            ) : (
                                <Sun className="w-5 h-5 group-hover:text-amber-500 group-hover:rotate-45 transition-all duration-300" />
                            )}
                        </button>
                        <button
                            onClick={async () => {
                                setIsExporting(true);
                                const studentName = students.find(s => s.student_id === selectedStudentId)?.name || '学生';
                                const examName = data?.latest?.exam_name || '诊断报告';
                                await exportDashboardByElementId('report-content', `${studentName}_${examName}_深度诊断报告.pdf`);
                                setIsExporting(false);
                            }}
                            disabled={isExporting || !data}
                            className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-700 dark:hover:bg-slate-200 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isExporting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {isExporting ? '生成中...' : '下载报告'}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 md:p-8" id="report-content">
                <style jsx global>{`
                    @media print {
                        .no-print {
                            display: none !important;
                        }
                    }
                `}</style>

                {/* AI Settings Modal */}
                <AISettingsModal
                    isOpen={isAISettingsOpen}
                    onClose={() => setIsAISettingsOpen(false)}
                />

                {/* AI Strategy Planner Modal */}
                <StrategyPlanner
                    isOpen={isStrategyOpen}
                    studentId={selectedStudentId}
                    examId={trend && trend.length > 0
                        ? trend.reduce((max: any, curr: any) => curr.exam_id > max.exam_id ? curr : max, trend[0]).exam_id
                        : Number(selectedExamId)} // 优先使用该学生最新的考试ID，而非当前选中的历史ID
                    onClose={() => {
                        setIsStrategyOpen(false);
                        fetchDiagnosedIntents(); // 刷新状态
                    }}
                    latest={trend && trend.length > 0
                        ? trend.reduce((max: any, curr: any) => curr.exam_id > max.exam_id ? curr : max, trend[0])
                        : latest} // 同样，传入最新的考试数据作为规划基准
                    targetData={targetData}
                    trendData={trend.map((exam: any) => ({
                        name: exam.name,
                        date: exam.date,
                        total_score: exam.total_score,
                        subjects: exam.subjects.map((s: any) => ({
                            subject: s.subject,
                            score: s.score,
                            grade_avg: s.grade_avg
                        }))
                    }))}
                />

                {/* AI Subject Doctor Modal */}
                {diagnosingSubject && (
                    <SubjectDoctor
                        subject={diagnosingSubject}
                        studentId={selectedStudentId}
                        examId={Number(selectedExamId)}
                        trendData={trend.map((exam: any) => ({
                            name: exam.name,
                            date: exam.date,
                            subjects: exam.subjects.map((s: any) => ({
                                subject: s.subject,
                                score: s.score,
                                grade_avg: s.grade_avg
                            }))
                        }))}
                        onClose={() => {
                            setDiagnosingSubject(null);
                            fetchDiagnosedIntents(); // 刷新状态
                        }}
                    />
                )}

                {/* AI 总评卡片 */}
                <div className="mb-8 no-print">
                    <AIBriefCard
                        examResult={latest}
                        trend={trend}
                        onOpenSettings={() => setIsAISettingsOpen(true)}
                        onOpenStrategy={() => setIsStrategyOpen(true)}
                    />
                </div>

                {/* Section 1: 本次考试深度诊断 (Single Exam Focus) */}
                <section className="space-y-6 mb-12">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">本次考试深度诊断 ({latest.exam_name})</h2>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {(() => {
                            const totalFull = subjects.reduce((acc: number, s: any) => acc + (['语文', '数学', '英语'].includes(s.subject) ? 150 : 100), 0);
                            const classAvgTotal = subjects.reduce((acc: number, s: any) => acc + (s.class_avg || 0), 0);

                            // 优劣分析
                            const sortedByRank = [...subjects].filter((s: any) => s.grade_rank).sort((a: any, b: any) => a.grade_rank - b.grade_rank);
                            const bestSub = sortedByRank[0]?.subject || '无';
                            const worstSub = sortedByRank[sortedByRank.length - 1]?.subject || '无';

                            // 进步/退步分析
                            const improvements = subjects.map((s: any) => {
                                const ps = data.prevSubjects?.find((p: any) => p.subject === s.subject);
                                if (!ps || !s.grade_rank || !ps.grade_rank) return null;
                                return { subject: s.subject, change: ps.grade_rank - s.grade_rank };
                            }).filter((x: any): x is { subject: string; change: number } => x !== null);

                            const mostImproved = [...improvements].sort((a, b) => b.change - a.change)[0];
                            const mostDecayed = [...improvements].sort((a, b) => a.change - b.change)[0];

                            return (
                                <>
                                    <StatCard
                                        title="总分"
                                        value={`${latest.total_score}`}
                                        subValue={`/  ${totalFull}`}
                                        extra={
                                            <span className="text-blue-600 dark:text-blue-400">班均: {classAvgTotal.toFixed(1)}分</span>
                                        }
                                        icon={<TrendingUp className="text-indigo-600" />}
                                    />
                                    <StatCard
                                        title="年级排名"
                                        value={`${latest.grade_rank}`}
                                        subValue="(全校)"
                                        extra={
                                            <span className="text-emerald-600 dark:text-emerald-400">班级排名   {latest.class_rank}</span>
                                        }
                                        icon={<Award className="text-amber-500" />}
                                    />
                                    <StatCard
                                        title="优势科目"
                                        value={bestSub}
                                        subValue="(实力最强)"
                                        extra={
                                            mostImproved && mostImproved.change > 0 && (
                                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                                    <Zap className="w-3 h-3" /> 进步王: {mostImproved.subject} (+{mostImproved.change}名)
                                                </span>
                                            )
                                        }
                                        icon={<Trophy className="text-emerald-500" />}
                                    />
                                    <StatCard
                                        title="劣势科目"
                                        value={worstSub}
                                        subValue="(亟待加强)"
                                        extra={
                                            mostDecayed && mostDecayed.change < 0 ? (
                                                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                                                    <AlertTriangle className="w-3 h-3" /> 退步王: {mostDecayed.subject} ({mostDecayed.change}名)
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">暂无退步预警</span>
                                            )
                                        }
                                        icon={<Target className="text-rose-500" />}
                                    />
                                </>
                            );
                        })()}
                    </div>

                    {/* Subject Details - Full Width 3x3 Grid */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">各科得分详情</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8">
                            {[
                                ['语文', '数学', '英语'],
                                ['物理', '化学', '生物'],
                                ['政治', '历史', '地理']
                            ].map((group, groupIdx) => (
                                <React.Fragment key={groupIdx}>
                                    {group.map(subName => {
                                        const s = latest.subjects.find((item: any) => item.subject === subName);
                                        const ps = data.prevSubjects?.find((item: any) => item.subject === subName);
                                        if (!s) return <div key={subName} />;
                                        return (
                                            <SubjectProgress
                                                key={s.subject}
                                                name={s.subject}
                                                score={s.score}
                                                total={['语文', '数学', '英语'].includes(s.subject) ? 150 : 100}
                                                gradeRank={s.grade_rank}
                                                classRank={s.class_rank}
                                                prevGradeRank={ps?.grade_rank}
                                                prevClassRank={ps?.class_rank}
                                                classAvg={s.class_avg}
                                                color={s.score >= (['语文', '数学', '英语'].includes(s.subject) ? 120 : 80) ? 'bg-emerald-500' : s.score >= (['语文', '数学', '英语'].includes(s.subject) ? 90 : 60) ? 'bg-blue-500' : 'bg-rose-500'}
                                                onAIDiagnose={() => setDiagnosingSubject({ ...s, subjects: latest.subjects })}
                                                isDiagnosed={diagnosedIntents.includes(`SUBJECT_DEEP_DIVE:${s.subject}`)}
                                            />
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                        <RadarAnalysis subjects={latest.subjects} />
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 transition-colors font-sans">
                            <div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">各科达成度 (百分制)</h3>
                                <ScoreComposition subjects={latest.subjects} />
                            </div>
                            <div className="pt-5 border-t border-slate-50 dark:border-slate-800">
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">离均差分析 (vs 班级)</h3>
                                <ScoreGapAnalysis subjects={latest.subjects} />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full transition-colors">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                                <Award className="w-5 h-5 text-indigo-600" />
                                荣誉榜
                            </h3>
                            <div className="flex-1 space-y-4">
                                {/* 年级先锋 */}
                                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-800/20">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">年级先锋</span>
                                        <Trophy className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                                            {latest.subjects.filter((s: any) => s.grade_rank && s.grade_rank <= 200).length}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-500">门进入年级前 200</span>
                                    </div>
                                </div>

                                {/* 班级尖子 */}
                                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-800/20">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">班级尖子</span>
                                        <Star className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                                            {latest.subjects.filter((s: any) => s.class_rank && s.class_rank <= 10).length}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-500">门进入班级前 10</span>
                                    </div>
                                </div>

                                {/* 进步之星 */}
                                {(() => {
                                    const prevSubjects = data.prevSubjects;
                                    if (!prevSubjects || prevSubjects.length === 0) return null;

                                    const improvements = latest.subjects
                                        .map((s: any) => {
                                            const prevSubject = prevSubjects.find((ps: any) => ps.subject === s.subject);
                                            if (s.grade_rank && prevSubject?.grade_rank) {
                                                return {
                                                    subject: s.subject,
                                                    gain: prevSubject.grade_rank - s.grade_rank
                                                };
                                            }
                                            return null;
                                        })
                                        .filter(Boolean)
                                        .sort((a: any, b: any) => b.gain - a.gain);

                                    const best = improvements[0];
                                    if (!best || best.gain <= 0) return null;

                                    return (
                                        <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100/50 dark:border-amber-800/20">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">进步之星</span>
                                                <TrendingUp className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{best.subject}</span>
                                                <span className="text-sm text-slate-500 dark:text-slate-500">年级排名进步</span>
                                                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{best.gain}</span>
                                                <span className="text-sm text-slate-500 dark:text-slate-500">名</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                    {/* 追加：深度诊断区域 (双栏布局) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-stretch">
                        {/* 左栏：表现力 & 稳定性象限 */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">表现力 & 稳定性象限</h3>
                                    <p className="text-xs text-slate-400">基于得分率与排名波动的战略分析</p>
                                </div>
                                <Compass className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
                                <div className="flex-1 w-full min-h-[220px]">
                                    <QuadPerformanceChart subjects={latest.subjects} prevSubjects={data.prevSubjects} />
                                </div>
                                <div className="grid grid-cols-1 gap-2 w-full md:w-32 flex-shrink-0">
                                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                                        <span className="font-bold text-emerald-600 block text-xs mb-0.5">右上 (霸主)</span>
                                        <span className="text-[10px] text-slate-500 font-medium">高分+稳定进步</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/20">
                                        <span className="font-bold text-indigo-600 block text-xs mb-0.5">左上 (潜力)</span>
                                        <span className="text-[10px] text-slate-500 font-medium">低分+稳定进步</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                                        <span className="font-bold text-amber-600 block text-xs mb-0.5">右下 (爆发)</span>
                                        <span className="text-[10px] text-slate-500 font-medium">高分但有波动</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20">
                                        <span className="font-bold text-rose-600 block text-xs mb-0.5">左下 (危机)</span>
                                        <span className="text-[10px] text-slate-500 font-medium">低分且波动大</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 右栏：深度洞察与建议 */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors flex flex-col h-full overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">学科洞察与建议</h3>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={targetRank}
                                        onChange={(e) => setTargetRank(Number(e.target.value))}
                                        className="bg-slate-50 dark:bg-slate-800 border-none rounded-md px-2 py-0.5 text-xs font-bold text-indigo-600 outline-none cursor-pointer"
                                    >
                                        {[200, 300, 400, 500, 600, 700, 800].map(rank => (
                                            <option key={rank} value={rank}>前{rank}名</option>
                                        ))}
                                    </select>
                                    <Lightbulb className="w-5 h-5 text-indigo-500" />
                                    ```
                                </div>
                            </div>

                            <SubjectInsightPanel
                                subjects={latest.subjects}
                                prevSubjects={data.prevSubjects}
                                totalScore={latest.total_score}
                                targetData={data.targetData}
                                targetRank={targetRank}
                                diagnosedIntents={diagnosedIntents}
                                onAIDiagnose={(sub) => setDiagnosingSubject({ ...sub, subjects: latest.subjects })}
                            />
                        </div>
                    </div>
                </section>

                {/* Section 2: 历史表现与趋势 (Multi-Exam Focus) */}
                <section className="space-y-6 mb-12">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">历史表现与趋势</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Ranking Trend Chart */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">排名趋势分析</h3>
                                <div className="flex items-center gap-4">
                                    {/* Subject Mode Toggle (Radio Style) */}
                                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 mr-2">
                                        <button
                                            onClick={() => setTrendMultiSelect(false)}
                                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${!trendMultiSelect
                                                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                                }`}
                                        >
                                            单科聚焦
                                        </button>
                                        <button
                                            onClick={() => setTrendMultiSelect(true)}
                                            className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${trendMultiSelect
                                                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                                }`}
                                        >
                                            多选对比
                                            {trendMultiSelect && <Check className="w-2.5 h-2.5" />}
                                        </button>
                                    </div>

                                    <div className="h-3 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                                    <div className="flex gap-4 text-[10px] font-bold text-slate-500">
                                        <div
                                            className={`flex items-center gap-1.5 cursor-pointer transition-all ${showGradeRank ? 'opacity-100' : 'opacity-30 hover:opacity-50'}`}
                                            onClick={() => setShowGradeRank(!showGradeRank)}
                                        >
                                            <div className="w-8 h-0.5 bg-slate-400"></div>
                                            <span>年级排名</span>
                                        </div>
                                        <div
                                            className={`flex items-center gap-1.5 cursor-pointer transition-all ${showClassRank ? 'opacity-100' : 'opacity-30 hover:opacity-50'}`}
                                            onClick={() => setShowClassRank(!showClassRank)}
                                        >
                                            <div className="w-8 h-0.5 border-t-2 border-dashed border-slate-400 opacity-60"></div>
                                            <span>班级排名</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 w-full h-[250px] min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={trend?.map((t: any) => {
                                            const item: any = { name: t.name, date: t.date };
                                            if (t.subjects) {
                                                t.subjects.forEach((s: any) => {
                                                    item[`${s.subject}_grade`] = s.grade_rank;
                                                    item[`${s.subject}_class`] = s.class_rank;
                                                });
                                            }
                                            item['总分_grade'] = t.grade_rank;
                                            item['总分_class'] = t.class_rank;
                                            return item;
                                        }) || []}
                                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--chart-grid))" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'rgb(var(--chart-text))', fontSize: 10 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            reversed
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'rgb(var(--chart-text))', fontSize: 10 }}
                                            width={40}
                                            label={{ value: '年级排名', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            reversed
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'rgb(var(--chart-text))', fontSize: 10 }}
                                            width={40}
                                            label={{ value: '班级排名', angle: 90, position: 'insideRight', fontSize: 10, fill: '#94a3b8' }}
                                        />
                                        <Tooltip
                                            content={({ active, payload, label }: any) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xl rounded-lg text-xs">
                                                            <p className="font-bold text-slate-800 dark:text-slate-100 mb-2">{label}</p>
                                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                                {payload.map((p: any, i: number) => {
                                                                    // Filter out duplicate legend items based on name logic or unique data keys
                                                                    const isGrade = p.dataKey.endsWith('_grade');
                                                                    const subj = p.name.split(' ')[0]; // Extract subject from "Subject (Suffix)"
                                                                    return (
                                                                        <div key={i} className="flex items-center gap-2">
                                                                            <div className={`w-2 h-2 rounded-full ${!isGrade ? 'opacity-60' : ''}`} style={{ backgroundColor: p.stroke }}></div>
                                                                            <span className="text-slate-500">{subj} {isGrade ? '年' : '班'}:</span>
                                                                            <span className="font-bold text-slate-800 dark:text-slate-100">{p.value}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        {['总分', '语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'].map(subject => {
                                            if (!trendVisibleSubjects[subject]) return null;
                                            const color = getSubjectColor(subject);
                                            return (
                                                <React.Fragment key={subject}>
                                                    {showGradeRank && (
                                                        <Line
                                                            yAxisId="left"
                                                            type="monotone"
                                                            dataKey={`${subject}_grade`}
                                                            stroke={color}
                                                            strokeWidth={subject === '总分' ? 3 : 2}
                                                            dot={{ r: 3, fill: color, strokeWidth: 0 }}
                                                            activeDot={{ r: 5 }}
                                                            name={`${subject} (年级)`}
                                                            connectNulls
                                                        />
                                                    )}
                                                    {showClassRank && (
                                                        <Line
                                                            yAxisId="right"
                                                            type="monotone"
                                                            dataKey={`${subject}_class`}
                                                            stroke={color}
                                                            strokeWidth={1} // Thinner line
                                                            strokeOpacity={0.6} // Semi-transparent
                                                            dot={{ r: 2, fill: color, strokeWidth: 0, fillOpacity: 0.6 }} // Smaller, lighter dots
                                                            activeDot={{ r: 4 }}
                                                            name={`${subject} (班级)`}
                                                            connectNulls
                                                        />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-slate-50 dark:border-slate-800 pt-4 px-4">
                                <div className="flex flex-wrap justify-center gap-2">
                                    {['总分', '语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'].map(subject => (
                                        <button
                                            key={subject}
                                            onClick={() => {
                                                if (trendMultiSelect) {
                                                    setTrendVisibleSubjects(prev => ({ ...prev, [subject]: !prev[subject] }));
                                                } else {
                                                    // 单选模式：重置其他，只选当前
                                                    const newState: Record<string, boolean> = {
                                                        '总分': false, '语文': false, '数学': false, '英语': false,
                                                        '物理': false, '化学': false, '生物': false,
                                                        '政治': false, '历史': false, '地理': false
                                                    };
                                                    newState[subject] = true;
                                                    setTrendVisibleSubjects(newState);
                                                }
                                            }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer hover:opacity-80 active:scale-95 ${trendVisibleSubjects[subject]
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700'
                                                : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 grayscale opacity-60'
                                                }`}
                                        >
                                            <div
                                                className="w-2.5 h-2.5 rounded-full shadow-sm"
                                                style={{ backgroundColor: getSubjectColor(subject) }}
                                            ></div>
                                            {subject}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors h-full flex flex-col">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
                                进化里程碑
                                <Flag className="w-4 h-4 text-rose-500" />
                            </h3>
                            <div className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 flex-1 min-h-0">
                                <MilestoneTimeline exams={exams} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <StabilityScatter trend={trend} />
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center transition-colors">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-500 mb-4">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">进步趋势分析</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
                                您的年级排名在过去三次考试中呈现稳步上升趋势。
                                保持当前的复习节奏，重点突破薄弱科目，有望在下次考试中进入年级前 800 名。
                            </p>
                        </div>
                    </div>
                </section>


                {/* Section 3: 学业提升建议 (Full Width at Bottom) */}
                <section className="pb-12">
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-700 dark:from-indigo-700 dark:to-blue-900 p-8 rounded-2xl shadow-lg text-white">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="max-w-3xl">
                                <h3 className="text-2xl font-bold mb-3">学业提升建议</h3>
                                <p className="text-indigo-100 dark:text-indigo-200 text-base leading-relaxed">
                                    基于最近的综合表现，您的{latest.subjects.sort((a: any, b: any) => (b.grade_rank || 0) - (a.grade_rank || 0))[0]?.subject}学科仍有较大提升空间。
                                    建议针对该学科的薄弱知识点进行专项复习，并参考班级前十名的学习方法。同时，您的{latest.subjects.sort((a: any, b: any) => (a.grade_rank || 999) - (b.grade_rank || 999))[0]?.subject}学科表现优异，建议继续保持并尝试带动其他科目。
                                </p>
                            </div>
                            <div className="flex gap-4 shrink-0 font-sans">
                                <button className="bg-white dark:bg-slate-100 text-indigo-600 px-8 py-3 rounded-xl text-sm font-bold hover:bg-indigo-50 dark:hover:bg-white transition-colors shadow-md">
                                    查看提分计划
                                </button>
                                <button className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-xl text-sm font-medium transition-colors border border-white/30">
                                    错题分析
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

// --- 追加的新视觉组件 ---




function ExamItem({ name, date, score }: any) {
    return (
        <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <BookOpen className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{name}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-sans">{date}</p>
                </div>
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-sans">{score}分</span>
        </div>
    );
}
