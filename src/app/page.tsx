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
    Check
} from 'lucide-react';
import { API } from '@/lib/api';
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
    ResponsiveContainer,
    BarChart,
    Bar,
    ReferenceLine,
    Cell,
    PieChart,
    Pie,
    ScatterChart,
    Scatter,
    ZAxis,
    Label,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis
} from 'recharts';

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

    const { latest, trend, exams } = data;
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
                        <div className={`flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all`}>
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
                        <div className={`flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all`}>
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
                        <label className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 dark:border-emerald-900/50 cursor-pointer">
                            <Plus className="w-4 h-4" />
                            导入数据
                            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                        </label>
                        <Link
                            href="/leaderboard"
                            className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 hover:text-white transition-all border border-amber-100 dark:border-amber-900/50"
                        >
                            <Trophy className="w-4 h-4" />
                            排行榜
                        </Link>
                        <Link
                            href="/pk"
                            className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 dark:border-indigo-900/50"
                        >
                            <Swords className="w-4 h-4" />
                            进入 PK 场
                        </Link>
                        <button
                            onClick={toggleTheme}
                            className="group p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-slate-600 dark:text-slate-300 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
                            title={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
                        >
                            {theme === 'light' ? (
                                <Moon className="w-5 h-5 group-hover:text-indigo-500 group-hover:rotate-12 transition-all duration-300" />
                            ) : (
                                <Sun className="w-5 h-5 group-hover:text-amber-500 group-hover:rotate-45 transition-all duration-300" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 md:p-8">

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
                                </div>
                            </div>

                            <SubjectInsightPanel
                                subjects={latest.subjects}
                                prevSubjects={data.prevSubjects}
                                totalScore={latest.total_score}
                                targetData={data.targetData}
                                targetRank={targetRank}
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



/**
 * 深度诊断洞察面板
 */
function SubjectInsightPanel({
    subjects,
    prevSubjects,
    totalScore,
    targetData,
    targetRank
}: {
    subjects: any[],
    prevSubjects?: any[],
    totalScore: number,
    targetData?: any,
    targetRank: number
}) {
    // 1. 计算名次变动
    const insights = subjects.map(s => {
        const ps = prevSubjects?.find(p => p.subject === s.subject);
        const gain = ps ? (ps.grade_rank - s.grade_rank) : 0;
        const fullScore = ['语文', '数学', '英语'].includes(s.subject) ? 150 : 100;
        const scoreRate = (s.score / fullScore) * 100;

        return { ...s, gain, scoreRate };
    });

    const gainers = [...insights].filter(i => i.gain > 0).sort((a, b) => b.gain - a.gain).slice(0, 2);
    const decliners = [...insights].filter(i => i.gain < 0).sort((a, b) => a.gain - b.gain).slice(0, 2);

    // 2. 目标差异分析 + 加权计算 (使用难度系数)
    const isGoalReached = targetData ? totalScore >= targetData.total_score : false;
    const totalGap = targetData ? Math.max(0, targetData.total_score - totalScore).toFixed(1) : null;

    // 所有9科加权提分建议
    const ALL_SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
    const subjectSuggestions = ALL_SUBJECTS.map(subName => {
        const s = subjects.find(sub => sub.subject === subName);
        if (!s) return { subject: subName, gap: 0, weight: 0, difficulty: 0 };

        const fullScore = ['语文', '数学', '英语'].includes(subName) ? 150 : 100;
        const targetValue = targetData?.subjects[subName] || 0;
        const rawGap = Math.max(0, targetValue - s.score);

        // 难度系数：年级平均分越低，该科越难
        const gradeAvg = targetData?.difficulty?.[subName] || fullScore * 0.6;
        const difficultyRatio = gradeAvg / fullScore; // 0-1，越低越难

        // 学生能力系数：与班级平均分对比
        const classAvg = s.class_avg || gradeAvg;
        const capabilityRatio = s.score / classAvg; // >1 表示优于班级

        // 加权分数 = 原始差距 × 难度因子 × 能力因子
        // 难度高(difficultyRatio低)的科目建议提分少，能力弱(capabilityRatio低)的科目建议提分多
        const weight = rawGap * (1 + (1 - difficultyRatio) * 0.3) * (1 + (1 - capabilityRatio) * 0.5);

        return {
            subject: subName,
            gap: isGoalReached ? 0 : Math.round(rawGap * 10) / 10,
            weight: isGoalReached ? 0 : Math.round(weight * 10) / 10,
            difficulty: Math.round(difficultyRatio * 100)
        };
    }).sort((a, b) => b.weight - a.weight);

    // 3. 智能分析引擎 (规则：排名变动 + 象限得分率 + 目标缺口)
    const topGainer = [...insights].filter(i => i.gain > 0).sort((a, b) => b.gain - a.gain)[0];
    const topDecliner = [...insights].filter(i => i.gain < 0).sort((a, b) => a.gain - b.gain)[0];
    const criticalSubject = subjectSuggestions[0];

    const generateSmartInsight = () => {
        if (!targetData) return '当前表现均衡，建议继续保持优势科目。';

        if (isGoalReached) {
            return `您已达到前 ${targetRank} 名的目标水平（对标分数 ${targetData.total_score}），表现优异！建议继续保持优势学科，均衡各科发展。`;
        }

        let analysis = `距前 ${targetRank} 名还差 ${totalGap} 分。`;

        if (topGainer && topGainer.gain > 30) {
            analysis += `${topGainer.subject}排名大幅跃升，是本次冲榜的「核心动力」；`;
        } else if (topGainer) {
            analysis += `${topGainer.subject}稳步进步，对总分贡献显著；`;
        }

        if (topDecliner && topDecliner.scoreRate < 60) {
            analysis += `但${topDecliner.subject}出现「系统性瓶颈」，得分率偏低，`;
        } else if (topDecliner) {
            analysis += `需关注${topDecliner.subject}的排名波动，`;
        }

        if (criticalSubject && criticalSubject.gap > 0) {
            analysis += `建议优先攻克${criticalSubject.subject}（缺口${criticalSubject.gap}分）。`;
        }

        return analysis;
    };

    const smartInsight = generateSmartInsight();

    return (
        <div className="flex-1 flex flex-col justify-between py-2 min-h-0 overflow-hidden">
            {/* 智能分析 - 顶部高亮 */}
            <div className="p-2 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 rounded-lg border border-indigo-100/50 dark:border-indigo-800/30">
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-snug">
                    {smartInsight}
                </p>
            </div>

            {/* 升降榜单 - 极致压缩 */}
            <div className="grid grid-cols-2 gap-5 pt-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">本场之星</span>
                    </div>
                    <div className="space-y-1">
                        {gainers.length > 0 ? gainers.map(g => (
                            <div key={g.subject} className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 min-w-[2.5rem]">{g.subject}</span>
                                <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${g.scoreRate}%` }} />
                                </div>
                                <span className="text-sm font-mono text-emerald-600 font-bold">+{g.gain}</span>
                            </div>
                        )) : <p className="text-xs text-slate-400">稳定发挥</p>}
                    </div>
                </div>

                <div className="space-y-1 pt-2">
                    <div className="flex items-center gap-1.5 mb-1">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">重点关注</span>
                    </div>
                    <div className="space-y-1">
                        {decliners.length > 0 ? decliners.map(d => (
                            <div key={d.subject} className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 min-w-[2.5rem]">{d.subject}</span>
                                <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${d.scoreRate}%` }} />
                                </div>
                                <span className="text-sm font-mono text-rose-600 font-bold">{d.gain}</span>
                            </div>
                        )) : <p className="text-xs text-slate-400">名次稳健</p>}
                    </div>
                </div>
            </div>

            {/* 科学提分路线 - 3x3 九宫格 */}
            <div className="space-y-1 pt-2">
                <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">科学提分路线 (对标 {targetRank} 名)</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                    {subjectSuggestions.map(s => (
                        <div
                            key={s.subject}
                            className={`flex items-center justify-between px-2 py-1 rounded-md border transition-colors ${s.gap > 0
                                ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/60'
                                : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-800/30'
                                }`}
                        >
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{s.subject}</span>
                            <span className={`text-[11px] font-black ${s.gap > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {s.gap > 0 ? `+${s.gap}` : '✓'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 底部总计差距 */}
            <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[12px] font-bold text-slate-500 uppercase">
                    {isGoalReached ? '当前目标状态' : '距目标建议提分'}
                </span>
                <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-black ${isGoalReached ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {isGoalReached ? '已达标' : (totalGap ? `+${totalGap}` : '--')}
                    </span>
                    {!isGoalReached && <span className="text-[10px] font-bold text-slate-400">分</span>}
                </div>
            </div>
        </div>

    );
}



/**
 * 学科表现四象限分布图
 */
/**
 * 学科表现四象限分布图
 */
function QuadPerformanceChart({ subjects, prevSubjects }: { subjects: any[], prevSubjects?: any[] }) {
    const data = subjects.map(s => {
        const ps = prevSubjects?.find(p => p.subject === s.subject);
        const fullScore = ['语文', '数学', '英语'].includes(s.subject) ? 150 : 100;
        const scoreRate = (s.score / fullScore) * 100;
        const stability = ps ? (ps.grade_rank - s.grade_rank) : 0;

        return {
            name: s.subject,
            x: scoreRate,
            y: stability,
            z: s.score
        };
    });

    // 动态计算 X 轴范围
    const xValues = data.map(d => d.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const domainX = [Math.floor(minX - 5), Math.ceil(maxX + 5)];
    const midX = (domainX[0] + domainX[1]) / 2;

    // 动态计算 Y 轴范围 (确保 0 点在中间或范围内)
    const yValues = data.map(d => d.y);
    const minY = Math.min(...yValues, 0);
    const maxY = Math.max(...yValues, 0);
    const domainY = [Math.floor(minY - 10), Math.ceil(maxY + 10)];

    return (
        <div className="w-full aspect-square max-h-[300px] mx-auto">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis
                        type="number"
                        dataKey="x"
                        domain={domainX}
                        hide={false}
                        axisLine={false}
                        tick={{ fontSize: 9 }}
                        label={{ value: '得分率 %', position: 'insideBottom', offset: -10, fontSize: 9 }}
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        domain={domainY}
                        axisLine={false}
                        tick={{ fontSize: 9 }}
                        label={{ value: '排名波动', angle: -90, position: 'insideLeft', fontSize: 9 }}
                    />
                    <ZAxis type="number" dataKey="z" range={[60, 400]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                                <div className="bg-white dark:bg-slate-900 p-2 border border-slate-100 dark:border-slate-800 shadow-xl rounded-lg text-[10px]">
                                    <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">{d.name}</p>
                                    <p className="text-slate-500">得分率: <span className="font-bold text-slate-800 dark:text-slate-100">{d.x.toFixed(1)}%</span></p>
                                    <p className="text-slate-500">名次变动: <span className={`font-bold ${d.y >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{d.y > 0 ? '+' : ''}{d.y}</span></p>
                                </div>
                            );
                        }
                        return null;
                    }} />
                    <ReferenceLine x={midX} stroke="#94a3b8" strokeDasharray="3 3" />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                    <Scatter name="学科" data={data}>
                        {data.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={getSubjectColor(entry.name)} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}

/**
 * 荣誉里程碑时间轴
 */
/**
 * 荣誉里程碑时间轴 (Enhanced)
 */
function MilestoneTimeline({ exams = [] }: { exams: any[] }) {
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
    // 展示最近5次。exams 本身是按时间倒序 (最新 -> 最旧)
    const displayExams = exams.slice(0, 5);

    return (
        <div className="space-y-0 py-4 px-2">
            {displayExams.map((e, i) => {
                // 对比对象是时间轴上的"下一个"（即时间上的"前一个"）
                // 使用 exams[i + 1] 以确保即使是列表最后一个展示项，也能尝试和更早的考试对比
                const prevExam = exams[i + 1];
                const rankChange = prevExam ? prevExam.grade_rank - e.grade_rank : 0;
                const isImproved = rankChange > 0;
                const isTop = e.grade_rank <= 100;

                return (
                    <div key={e.exam_id} className="relative pl-8 pb-8 last:pb-0">
                        {/* 连接线 */}
                        {i !== displayExams.length - 1 && (
                            <div className="absolute left-[11px] top-6 w-[2px] h-full bg-slate-200 dark:bg-slate-800"></div>
                        )}

                        {/* 圆点 */}
                        <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-sm z-10 transition-colors ${isTop ? 'bg-amber-400' : 'bg-indigo-500'
                            }`}>
                            {isTop ? <Trophy className="w-2.5 h-2.5 text-white" /> : <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>

                        {/* 内容卡片 */}
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

                                {/* 排名变化指示 */}
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

// 辅助函数：根据科目获取颜色
const getSubjectColor = (name: string) => {
    if (name === '总分') return '#2563eb'; // Blue-600
    if (name === '语文') return '#4f46e5';
    if (name === '数学') return '#6366f1';
    if (name === '英语') return '#818cf8';
    if (name === '物理') return '#059669';
    if (name === '化学') return '#10b981';
    if (name === '生物') return '#34d399';
    if (name === '政治') return '#d97706';
    if (name === '历史') return '#f59e0b';
    if (name === '地理') return '#fbbf24';
    return '#94a3b8';
};

function RadarAnalysis({ subjects }: { subjects: any[] }) {
    const [visible, setVisible] = React.useState({ personal: true, class: true });

    const radarData = subjects
        .filter(s => ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'].includes(s.subject))
        .map(s => {
            const fullScore = ['语文', '数学', '英语'].includes(s.subject) ? 150 : 100;
            return {
                subject: s.subject,
                个人得分: Math.round((s.score / fullScore) * 1000) / 10,
                班级平均: s.class_avg ? Math.round((s.class_avg / fullScore) * 1000) / 10 : 0,
                及格线: 60,
                fullMark: 100,
                rawScore: s.score,
                rawAvg: s.class_avg
            };
        });

    const CustomTooltip = ({ active, payload, coordinate }: any) => {
        if (active && payload && payload.length && coordinate) {
            return (
                <div
                    className="bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xl rounded-lg text-xs"
                    style={{ transform: `translateY(${-coordinate.y}px)` }}
                >
                    <p className="font-bold text-slate-700 dark:text-slate-100 mb-2">{payload[0].payload.subject}</p>
                    {payload.filter((p: any) => p.name !== '及格线').map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                            <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-100">{p.value}%</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">学科均衡度</h3>
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
                        <span className="text-slate-500 dark:text-slate-400 font-medium">班级</span>
                    </button>
                </div>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="rgb(var(--chart-grid))" className="opacity-40" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgb(var(--chart-text))', fontSize: 12 }} />
                        <Radar
                            name="及格线"
                            dataKey="及格线"
                            stroke="#ef4444"
                            fill="none"
                            fillOpacity={0}
                        />
                        {visible.class && (
                            <Radar
                                name="班级平均"
                                dataKey="班级平均"
                                stroke="#10b981"
                                fill="#10b981"
                                fillOpacity={0.2}
                            />
                        )}
                        {visible.personal && (
                            <Radar
                                name="个人得分"
                                dataKey="个人得分"
                                stroke="#4f46e5"
                                fill="#4f46e5"
                                fillOpacity={0.5}
                            />
                        )}
                        <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function ScoreComposition({ subjects }: { subjects: any[] }) {
    const subjectOrder = ['物理', '化学', '生物', '语文', '数学', '英语', '政治', '历史', '地理'];

    const sortedSubjects = [...subjects].sort((a, b) => {
        const indexA = subjectOrder.indexOf(a.subject);
        const indexB = subjectOrder.indexOf(b.subject);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    const data = [{
        name: '达成度',
        ...sortedSubjects.reduce((acc, s) => {
            const fullScore = ['语文', '数学', '英语'].includes(s.subject) ? 150 : 100;
            const percentage = Math.round((s.score / fullScore) * 1000) / 10;
            return { ...acc, [s.subject]: percentage };
        }, {})
    }];


    const CustomTooltip = ({ active, payload, coordinate }: any) => {
        if (active && payload && payload.length && coordinate) {
            return (
                <div
                    className="bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xl rounded-lg text-xs min-w-[240px]"
                    style={{ transform: `translateY(${-coordinate.y - 110}px)` }}
                >
                    <p className="font-bold text-slate-700 dark:text-slate-100 mb-2">各科达成度详情</p>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                        {payload.map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }}></div>
                                <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{p.name}:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-100">{p.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full">
            <div className="h-8 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 0, right: 0 }}>
                        <XAxis type="number" hide domain={[0, 'dataMax']} />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip
                            content={<CustomTooltip />}
                            allowEscapeViewBox={{ x: true, y: true }}
                        />
                        {sortedSubjects.map((s, i) => (
                            <Bar
                                key={s.subject}
                                dataKey={s.subject}
                                stackId="a"
                                fill={getSubjectColor(s.subject)}
                                radius={i === 0 ? [4, 0, 0, 4] : i === sortedSubjects.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5">
                {sortedSubjects.map((s, i) => (
                    <div key={s.subject} className="flex items-center gap-1 text-[9px] text-slate-400">
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: getSubjectColor(s.subject) }}></div>
                        {s.subject}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ScoreGapAnalysis({ subjects }: { subjects: any[] }) {
    const data = subjects
        .filter(s => s.class_avg !== null)
        .map(s => ({
            subject: s.subject,
            gap: Math.round((s.score - s.class_avg) * 10) / 10
        }))
        .sort((a, b) => b.gap - a.gap);

    return (
        <div className="w-full">
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 30, right: 20 }}>
                        <XAxis type="number" hide domain={['dataMin - 2', 'dataMax + 2']} />
                        <YAxis
                            dataKey="subject"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            width={75}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload, coordinate }: any) => {
                                if (active && payload && payload.length && coordinate) {
                                    return (
                                        <div
                                            className="bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xl rounded-lg text-xs min-w-[140px]"
                                            style={{ transform: `translateY(${-coordinate.y}px)` }}
                                        >
                                            <p className="font-bold text-slate-700 dark:text-slate-100 mb-2">{payload[0].payload.subject}</p>
                                            <div className="flex items-center gap-2 font-sans">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].value >= 0 ? '#10b981' : '#ef4444' }}></div>
                                                <span className="text-slate-500 dark:text-slate-400">领先/落后:</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-100">{payload[0].value > 0 ? '+' : ''}{payload[0].value}分</span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <ReferenceLine x={0} stroke="#e2e8f0" />
                        <Bar
                            dataKey="gap"
                            radius={[0, 2, 2, 0]}
                            barSize={12}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.gap >= 0 ? '#10b981' : '#ef4444'}
                                    fillOpacity={0.7}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function StabilityScatter({ trend }: { trend: any[] }) {
    const data = trend.map((t, i) => ({
        x: i + 1,
        y: t.grade_rank,
        z: t.total_score,
        name: t.name
    }));

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">成绩稳定性</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--chart-grid))" />
                        <XAxis type="number" dataKey="x" name="考试场次" hide />
                        <YAxis type="number" dataKey="y" name="年级排名" reversed hide />
                        <ZAxis type="number" dataKey="z" range={[50, 400]} name="总分" />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload, coordinate }: any) => {
                                if (active && payload && payload.length && coordinate) {
                                    return (
                                        <div
                                            className="bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xl rounded-lg text-xs min-w-[150px]"
                                            style={{ transform: `translateY(${-coordinate.y}px)` }}
                                        >
                                            <p className="font-bold text-slate-700 dark:text-slate-100 mb-2">{payload[0].payload.name}</p>
                                            <div className="space-y-1 font-sans">
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-slate-500 dark:text-slate-400">年级排名:</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-100">{payload[0].payload.y}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-slate-500 dark:text-slate-400">总分:</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-100">{payload[0].payload.z}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Scatter name="历次考试" data={data} fill="#4f46e5" />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
                * 圆点越大代表总分越高，位置越靠上代表排名越靠前
            </p>
        </div>
    );
}


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
