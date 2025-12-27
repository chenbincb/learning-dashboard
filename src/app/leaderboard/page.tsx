'use client';

import React, { useEffect, useState } from 'react';
import {
    Trophy,
    Medal,
    Users,
    Calendar,
    ChevronLeft,
    Search,
    Filter,
    ArrowLeft,
    Sun,
    Moon,
    Award,
    Loader2,
    Crown,
    Star,
    Target,
    ArrowUp,
    Swords
} from 'lucide-react';
import { API } from '@/lib/api';
import Link from 'next/link';

export default function LeaderboardPage() {
    const [rankings, setRankings] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('总分');
    const [highlightStudentId, setHighlightStudentId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    const subjects = ['总分', '物化生', '物化地', '物化政', '史政地', '语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === 'dark') document.documentElement.classList.add('dark');
        }

        // 初始化数据
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            // 获取学生列表
            const studentList = await API.fetchStudentList();
            setStudents(studentList);

            // 获取考试列表 (借用第一个学生的 API)
            if (studentList.length > 0) {
                const scoresData = await API.fetchStudentScores(studentList[0].id);
                setExams(scoresData.exams || []);
                if (scoresData.latest) {
                    setSelectedExamId(scoresData.latest.exam_id.toString());
                }
            }
        } catch (err) {
            console.error('Failed to fetch initial data:', err);
        }
    };

    const fetchRankings = async () => {
        if (!selectedExamId) return;
        setLoading(true);
        try {
            const data = await API.fetchLeaderboard(selectedExamId, selectedSubject);
            setRankings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch rankings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRankings();
    }, [selectedExamId, selectedSubject]);

    // 定位到选中学生
    const scrollToSelected = () => {
        if (highlightStudentId) {
            const element = document.getElementById(`student-row-${highlightStudentId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    // 当高亮学生改变时，尝试滚动到对应位置
    useEffect(() => {
        scrollToSelected();
    }, [highlightStudentId]);

    // 回到顶部
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark');
    };

    const podium = rankings.slice(0, 3);
    const rest = rankings.slice(3);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-4 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Trophy className="w-6 h-6 text-amber-500" />
                                学情看板 · 排行榜
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">查看各科尖子生，向优秀看齐。</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/pk"
                            className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 dark:border-indigo-900/50 cursor-pointer"
                        >
                            <Swords className="w-4 h-4" />
                            进入 PK 场
                        </Link>
                        <button
                            onClick={toggleTheme}
                            className="group p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-slate-600 dark:text-slate-300 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
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

            <main className="max-w-5xl mx-auto p-4 md:p-8 relative">
                {/* Floating Navigation Widget - Fixed positioning, visually aligned to the container's side, anchored to bottom */}
                <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-5xl bottom-0 pointer-events-none z-[100]">
                    <div className="absolute right-4 lg:-right-16 bottom-10 flex flex-col gap-3 pointer-events-auto">
                        {/* Scroll to selected student */}
                        {highlightStudentId && (
                            <button
                                onClick={scrollToSelected}
                                className="group p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
                                title="定位到选中学生"
                            >
                                <Target className="w-5 h-5 group-hover:animate-pulse" />
                            </button>
                        )}

                        {/* Back to top */}
                        <button
                            onClick={scrollToTop}
                            className="group p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-lg text-slate-600 dark:text-slate-300 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
                            title="回到顶部"
                        >
                            <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm transition-all">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <select
                            className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 dark:text-slate-200 w-full cursor-pointer dark:bg-slate-900"
                            value={selectedExamId}
                            onChange={(e) => setSelectedExamId(e.target.value)}
                        >
                            {exams.map((e: any) => (
                                <option key={e.exam_id} value={e.exam_id} className="dark:bg-slate-800">{e.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm transition-all">
                        <Filter className="w-5 h-5 text-slate-400" />
                        <select
                            className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 dark:text-slate-200 w-full cursor-pointer dark:bg-slate-900"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                            {subjects.map(s => (
                                <option key={s} value={s} className="dark:bg-slate-800">{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className={`flex items-center gap-2 bg-white dark:bg-slate-900 border ${highlightStudentId ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-2xl px-4 py-3 shadow-sm transition-all`}>
                        <Search className="w-5 h-5 text-slate-400" />
                        <select
                            className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 dark:text-slate-200 w-full cursor-pointer dark:bg-slate-900"
                            value={highlightStudentId}
                            onChange={(e) => setHighlightStudentId(e.target.value)}
                        >
                            <option value="" className="dark:bg-slate-800">快速定位学生...</option>
                            {[...students].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')).map(s => (
                                <option key={s.id} value={s.id} className="dark:bg-slate-800">{s.name} ({s.id})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">正在获取排名数据...</p>
                    </div>
                ) : rankings.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800">
                        <Award className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">该查询条件下暂无数据</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Podium Section */}
                        <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-0 mt-8 mb-4">
                            {/* 2nd place */}
                            {podium[1] && (
                                <div className={`w-full md:w-1/3 flex flex-col items-center order-2 md:order-1 group transition-all duration-500 ${highlightStudentId === podium[1].id ? 'scale-105' : ''}`}>
                                    <div className="relative mb-4">
                                        <div className={`w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-4 ${highlightStudentId === podium[1].id ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-slate-300 dark:border-slate-600'} overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                            <span className="text-2xl font-black text-slate-400">{podium[1].name[0]}</span>
                                        </div>
                                        <div className="absolute -bottom-2 right-0 w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                            <span className="text-xs font-black text-white">2</span>
                                        </div>
                                    </div>
                                    <div className={`text-center bg-white dark:bg-slate-900 pt-6 pb-4 px-6 rounded-t-3xl border-x border-t ${highlightStudentId === podium[1].id ? 'border-indigo-500/50 bg-indigo-50/10 dark:bg-indigo-900/10' : 'border-slate-100 dark:border-slate-800'} w-full min-h-[140px] flex flex-col items-center shadow-lg shadow-slate-200/50 dark:shadow-none relative transition-colors`}>
                                        <div className="absolute -top-3 px-3 py-1 bg-slate-300 dark:bg-slate-600 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">亚军</div>
                                        <h3 className="font-bold text-slate-800 dark:text-white mb-1">{podium[1].name}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">学号: {podium[1].id}</p>
                                        <div className="text-2xl font-black text-slate-700 dark:text-slate-200">{podium[1].score}<span className="text-[10px] ml-1 font-bold">分</span></div>
                                    </div>
                                </div>
                            )}

                            {/* 1st place */}
                            {podium[0] && (
                                <div className={`w-full md:w-2/5 flex flex-col items-center order-1 md:order-2 z-10 group transition-all duration-500 ${highlightStudentId === podium[0].id ? 'scale-105' : ''}`}>
                                    <div className="relative mb-6">
                                        <Crown className="w-8 h-8 text-amber-400 absolute top-3 left-1/2 -translate-x-1/2 animate-bounce" />
                                        <div className={`w-28 h-28 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center border-4 ${highlightStudentId === podium[0].id ? 'border-indigo-500 ring-4 ring-indigo-500/20 animate-pulse' : 'border-amber-400'} overflow-hidden shadow-xl shadow-amber-200/50 dark:shadow-none group-hover:scale-110 transition-transform duration-500`}>
                                            <span className="text-4xl font-black text-amber-500">{podium[0].name[0]}</span>
                                        </div>
                                        <div className="absolute -bottom-2 right-2 w-10 h-10 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                            <span className="text-sm font-black text-white">1</span>
                                        </div>
                                    </div>
                                    <div className={`text-center bg-white dark:bg-slate-900 pt-8 pb-6 px-6 rounded-t-3xl border-x border-t ${highlightStudentId === podium[0].id ? 'border-indigo-500/50 bg-indigo-50/10 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-700'} w-full min-h-[180px] flex flex-col items-center shadow-[0_-10px_40px_-15px_rgba(251,191,36,0.3)] dark:shadow-none relative transition-colors`}>
                                        <div className="absolute -top-3 px-4 py-1.5 bg-amber-400 rounded-full text-xs font-bold text-white uppercase tracking-widest animate-pulse">冠军</div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{podium[0].name}</h3>
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">学号: {podium[0].id}</p>
                                        <div className="text-4xl font-black text-amber-500 drop-shadow-sm">{podium[0].score}<span className="text-xs ml-1 font-bold">分</span></div>
                                    </div>
                                </div>
                            )}

                            {/* 3rd place */}
                            {podium[2] && (
                                <div className={`w-full md:w-1/3 flex flex-col items-center order-3 md:order-3 group transition-all duration-500 ${highlightStudentId === podium[2].id ? 'scale-105' : ''}`}>
                                    <div className="relative mb-4">
                                        <div className={`w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center border-4 ${highlightStudentId === podium[2].id ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-orange-300 dark:border-orange-800/50'} overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                            <span className="text-2xl font-black text-orange-400">{podium[2].name[0]}</span>
                                        </div>
                                        <div className="absolute -bottom-2 right-0 w-8 h-8 rounded-full bg-orange-300 dark:bg-orange-800 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                            <span className="text-xs font-black text-white">3</span>
                                        </div>
                                    </div>
                                    <div className={`text-center bg-white dark:bg-slate-900 pt-6 pb-4 px-6 rounded-t-3xl border-x border-t ${highlightStudentId === podium[2].id ? 'border-indigo-500/50 bg-indigo-50/10 dark:bg-indigo-900/10' : 'border-slate-100 dark:border-slate-800'} w-full min-h-[140px] flex flex-col items-center shadow-lg shadow-slate-200/50 dark:shadow-none relative transition-colors`}>
                                        <div className="absolute -top-3 px-3 py-1 bg-orange-300 dark:bg-orange-800 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">季军</div>
                                        <h3 className="font-bold text-slate-800 dark:text-white mb-1">{podium[2].name}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">学号: {podium[2].id}</p>
                                        <div className="text-2xl font-black text-orange-400">{podium[2].score}<span className="text-[10px] ml-1 font-bold">分</span></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Results Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500" />
                                    全部排名
                                </h3>
                                <span className="text-xs font-bold text-slate-400 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full">共 {rankings.length} 名学生</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                                            <th className="px-8 py-4">排名</th>
                                            <th className="px-8 py-4">学生姓名</th>
                                            <th className="px-8 py-4">学号 (考号)</th>
                                            <th className="px-8 py-4 text-right">分数</th>
                                            <th className="px-8 py-4 text-right">级排</th>
                                            <th className="px-8 py-4 text-right">班排</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {rankings.map((student, index) => (
                                            <tr
                                                key={student.id}
                                                id={`student-row-${student.id}`}
                                                className={`group transition-all duration-500 ${highlightStudentId === student.id ? 'bg-indigo-50/50 dark:bg-indigo-900/20 ring-1 ring-inset ring-indigo-500/30' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/20'}`}
                                            >
                                                <td className="px-8 py-5">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-colors ${index === 0 ? 'bg-amber-400 text-white' :
                                                        index === 1 ? 'bg-slate-300 dark:bg-slate-600 text-white' :
                                                            index === 2 ? 'bg-orange-300 dark:bg-orange-800 text-white' :
                                                                highlightStudentId === student.id ? 'bg-indigo-600 text-white' : 'text-slate-400 dark:text-slate-600'
                                                        }`}>
                                                        {index + 1}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold transition-all duration-300 ${highlightStudentId === student.id ? 'text-indigo-600 dark:text-indigo-400 text-lg' : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>{student.name}</span>
                                                        {highlightStudentId === student.id && <span className="text-[10px] font-bold text-indigo-500 animate-pulse">SELECTED</span>}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`text-sm font-medium transition-colors ${highlightStudentId === student.id ? 'text-indigo-500 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>{student.id}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className={`text-lg font-black transition-all ${highlightStudentId === student.id ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-800 dark:text-slate-100'}`}>{student.score}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="text-xs font-bold text-slate-400">#{student.rank}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="text-xs font-bold text-slate-400">#{student.class_rank}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
