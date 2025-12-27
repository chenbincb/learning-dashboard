'use client';

import React, { useEffect, useState } from 'react';
import {
    Users,
    Calendar,
    Sun,
    Moon,
    Plus,
    X,
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Swords,
    Trophy
} from 'lucide-react';
import { API } from '@/lib/api';
import { SubjectProgress } from '@/components/SubjectProgress';
import Link from 'next/link';

export default function PKPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(['66641354', '66641353']); // 默认：陈泓宇 & 陈尔东
    const [studentsData, setStudentsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === 'dark') document.documentElement.classList.add('dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        }

        // 加载学生列表和考试列表
        Promise.all([
            API.fetchStudentList(),
            API.fetchStudentScores('66641354') // 用第一个学生初始化考试列表
        ]).then(([studentList, scoresRes]) => {
            setStudents(studentList);
            setExams(scoresRes.exams || []);
            if (scoresRes.latest) {
                setSelectedExamId(scoresRes.latest.exam_id.toString());
            }
        });
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark');
    };

    const fetchAllData = async () => {
        if (!selectedExamId) return;
        if (studentsData.length === 0) setLoading(true); // 仅在初次或无数据时遮罩，确保添加学生时即时看到占位
        try {
            const promises = selectedStudentIds.map(id =>
                id ? API.fetchStudentScores(id, selectedExamId) : Promise.resolve(null)
            );
            const results = await Promise.all(promises);
            setStudentsData(results);
        } catch (err) {
            console.error('Fetch PK data error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [selectedExamId, selectedStudentIds]);

    const addStudent = () => {
        if (selectedStudentIds.length < 4) {
            setSelectedStudentIds([...selectedStudentIds, '']);
        }
    };

    const removeStudent = (index: number) => {
        if (selectedStudentIds.length > 2) {
            const newIds = [...selectedStudentIds];
            newIds.splice(index, 1);
            setSelectedStudentIds(newIds);
        }
    };

    const updateStudentId = (index: number, id: string) => {
        const newIds = [...selectedStudentIds];
        newIds[index] = id;
        setSelectedStudentIds(newIds);
    };

    return (
        <div className="min-h-screen bg-slate-200 dark:bg-slate-950 transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-md py-4 border-b border-slate-300/50 dark:border-slate-800/50 px-4 md:px-8 transition-colors w-full">
                <div className={`${selectedStudentIds.length === 4 ? 'max-w-[1600px]' : 'max-w-7xl'} mx-auto flex flex-col gap-6`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">学情看板 · PK 场</h1>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">横向对比，竞争中共同进步。</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Exam Selector */}
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <select
                                    className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer min-w-[140px]"
                                    value={selectedExamId || ''}
                                    onChange={(e) => setSelectedExamId(e.target.value)}
                                >
                                    {exams.map((e: any) => (
                                        <option key={e.exam_id} value={e.exam_id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                                            {e.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Link
                                href="/leaderboard"
                                className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 hover:text-white transition-all border border-amber-100 dark:border-amber-900/50 cursor-pointer"
                            >
                                <Trophy className="w-4 h-4" />
                                排行榜
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

                    {/* Student Selectors Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        {selectedStudentIds.map((sid, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                                <Users className="w-4 h-4 text-slate-400" />
                                <select
                                    className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer min-w-[100px]"
                                    value={sid}
                                    onChange={(e) => updateStudentId(idx, e.target.value)}
                                >
                                    <option value="" className="text-slate-300">选择学生...</option>
                                    {students.map((s: any) => {
                                        const isSelected = selectedStudentIds.includes(s.id) && s.id !== sid;
                                        return (
                                            <option
                                                key={s.id}
                                                value={s.id}
                                                disabled={isSelected}
                                                className={`dark:bg-slate-900 ${isSelected ? 'text-slate-300 dark:text-slate-700' : 'text-slate-900 dark:text-slate-200'}`}
                                            >
                                                {s.name} {isSelected ? '(已选)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                {selectedStudentIds.length > 2 && (
                                    <button onClick={() => removeStudent(idx)} className="ml-1 text-slate-400 hover:text-rose-500">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {selectedStudentIds.length < 4 && (
                            <button
                                onClick={addStudent}
                                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-sm font-medium shadow-sm transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                添加学生
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className={`${selectedStudentIds.length === 4 ? 'max-w-[1600px]' : 'max-w-7xl'} mx-auto p-4 md:p-8`}>
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className={`grid grid-cols-1 ${selectedStudentIds.length === 1 ? 'lg:grid-cols-1 max-w-2xl mx-auto w-full' :
                        selectedStudentIds.length === 2 ? 'lg:grid-cols-[1fr_120px_1fr]' :
                            selectedStudentIds.length === 3 ? 'lg:grid-cols-3' :
                                'lg:grid-cols-4'
                        } gap-6 transition-all`}>
                        {(() => {
                            const SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];

                            // 预计算胜负统计
                            const winStats = selectedStudentIds.map((sid, idx) => {
                                if (!sid || !studentsData[idx]?.latest) return { id: sid, wins: 0 };
                                let wins = 0;
                                const currentScores = studentsData[idx].latest.subjects || [];

                                SUBJECTS.forEach(sub => {
                                    const score = currentScores.find((s: any) => s.subject === sub)?.score || 0;
                                    const isLeading = studentsData.every((other, oIdx) => {
                                        if (oIdx === idx || !selectedStudentIds[oIdx] || !other?.latest) return true;
                                        const otherScore = other.latest.subjects?.find((s: any) => s.subject === sub)?.score || 0;
                                        return score > otherScore;
                                    });
                                    if (isLeading && score > 0) wins++;
                                });
                                return { id: sid, wins };
                            });

                            // 预计算每科最高分
                            const topScores: Record<string, number> = {};
                            SUBJECTS.forEach(sub => {
                                let max = 0;
                                studentsData.forEach(data => {
                                    const s = data?.latest?.subjects?.find((item: any) => item.subject === sub);
                                    if (s && s.score > max) max = s.score;
                                });
                                topScores[sub] = max;
                            });

                            const statsPanel = selectedStudentIds.filter(id => id).length >= 2 && (
                                <div key="stats-panel" className="col-span-full bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-4 flex flex-wrap justify-center items-center gap-8 mb-2 shadow-sm animate-in fade-in slide-in-from-top-4">
                                    <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
                                        <Trophy className="w-5 h-5 text-amber-500" />
                                        <span className="font-bold">胜负平衡统计</span>
                                    </div>
                                    <div className="h-6 w-px bg-indigo-200 dark:bg-indigo-800 hidden sm:block"></div>
                                    <div className="flex flex-wrap justify-center gap-6">
                                        {winStats.map((stat, idx) => {
                                            const name = studentsData[idx]?.latest?.student_name;
                                            if (!name) return null;
                                            return (
                                                <div key={`stat-${idx}`} className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                                    <div className={`w-2 h-2 rounded-full ${['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'][idx]}`}></div>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{name}</span>
                                                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{stat.wins} <span className="text-[10px] text-slate-400 font-normal">领先科目</span></span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );

                            const studentCards = selectedStudentIds.map((sid, idx) => {
                                const data = studentsData[idx];
                                if (!sid || !data || !data.latest) {
                                    // 渲染空面板 / 待选面板
                                    return (
                                        <div key={`empty-${idx}`} className="bg-white/50 dark:bg-slate-900/30 rounded-2xl shadow-sm border border-dashed border-slate-300 dark:border-slate-800 flex flex-col overflow-hidden min-h-[400px]">
                                            <div className="h-[144px] px-6 border-b border-dashed border-slate-200 dark:border-slate-800/50 flex flex-col justify-center items-center text-center">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                                                    <Users className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-400 dark:text-slate-500">待选择学生</p>
                                            </div>
                                            <div className="flex-1 flex flex-col">
                                                {SUBJECTS.map((_, sIdx) => (
                                                    <div
                                                        key={`empty-row-${sIdx}`}
                                                        className={`h-[72px] px-6 flex items-center justify-center ${sIdx % 2 !== 0 ? 'bg-slate-50/30 dark:bg-slate-800/10' : ''} ${sIdx !== SUBJECTS.length - 1 ? 'border-b border-slate-50 dark:border-slate-800/20' : ''}`}
                                                    >
                                                        <div className="w-8 h-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden">
                                        <div className="h-[144px] px-6 border-b border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                <div className={`w-1.5 h-6 rounded-full ${['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'][idx]}`}></div>
                                                {data.latest?.student_name}
                                            </h3>
                                            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-2">
                                                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">总分: {data.latest?.total_score || '--'}</span>
                                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">年级 #{data.latest?.grade_rank || '--'}</span>
                                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">班级 #{data.latest?.class_rank || '--'}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            {SUBJECTS.map((subName, sIdx) => {
                                                const s = data.latest?.subjects?.find((item: any) => item.subject === subName);
                                                const ps = data.prevSubjects?.find((item: any) => item.subject === subName);
                                                return (
                                                    <div
                                                        key={subName}
                                                        className={`h-[72px] px-6 flex flex-col justify-center relative ${sIdx % 2 !== 0 ? 'bg-slate-100/80 dark:bg-slate-800/20' : ''} ${sIdx !== SUBJECTS.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/40' : ''}`}
                                                    >
                                                        {s ? (
                                                            <SubjectProgress
                                                                name={subName}
                                                                score={s.score}
                                                                total={['语文', '数学', '英语'].includes(subName) ? 150 : 100}
                                                                gradeRank={s.grade_rank}
                                                                classRank={s.class_rank}
                                                                prevGradeRank={ps?.grade_rank}
                                                                prevClassRank={ps?.class_rank}
                                                                classAvg={s.class_avg}
                                                                color={s.score >= (['语文', '数学', '英语'].includes(subName) ? 120 : 80) ? 'bg-emerald-500' : s.score >= (['语文', '数学', '英语'].includes(subName) ? 90 : 60) ? 'bg-blue-500' : 'bg-rose-500'}
                                                            />
                                                        ) : (
                                                            <div className="text-slate-300 dark:text-slate-700 text-xs text-center">暂无数据</div>
                                                        )}
                                                        {s && s.score > 0 && s.score === topScores[subName] && selectedStudentIds.filter(id => id).length >= 2 && (
                                                            <div className="absolute left-0 top-5 animate-bounce">
                                                                <span className="text-lg" title="单科状元">🥇</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            });

                            const finalElements = [];
                            if (statsPanel) finalElements.push(statsPanel);

                            if (selectedStudentIds.length === 2 && studentCards[0] && studentCards[1]) {
                                const s1Data = studentsData[0];
                                const s2Data = studentsData[1];
                                const diffColumn = (
                                    <div key="diff" className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden">
                                        <div className="h-[144px] flex flex-col justify-center border-b border-slate-100 dark:border-slate-800">
                                            <div className="flex flex-col items-center">
                                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">分数差</h3>
                                                {s1Data?.latest && s2Data?.latest ? (
                                                    <span className={`text-3xl font-bold ${(s1Data.latest.total_score || 0) - (s2Data.latest.total_score || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                        {(s1Data.latest.total_score || 0) - (s2Data.latest.total_score || 0) > 0 ? '+' : ''}
                                                        {(s1Data.latest.total_score || 0) - (s2Data.latest.total_score || 0)}
                                                    </span>
                                                ) : (
                                                    <span className="text-2xl font-bold text-slate-300 dark:text-slate-700">--</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            {SUBJECTS.map((subName, sIdx) => {
                                                const s1 = s1Data?.latest?.subjects?.find((item: any) => item.subject === subName);
                                                const s2 = s2Data?.latest?.subjects?.find((item: any) => item.subject === subName);
                                                const diff = (s1 && s2) ? s1.score - s2.score : null;
                                                return (
                                                    <div
                                                        key={`diff-${subName}`}
                                                        className={`h-[72px] px-6 flex items-center justify-center ${sIdx % 2 !== 0 ? 'bg-slate-100/80 dark:bg-slate-800/20' : ''} ${sIdx !== SUBJECTS.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/40' : ''}`}
                                                    >
                                                        {diff !== null ? (
                                                            <span className={`text-2xl font-semibold ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {diff > 0 ? '+' : ''}{diff}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-200 dark:text-slate-800">--</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                                finalElements.push(studentCards[0], diffColumn, studentCards[1]);
                            } else {
                                finalElements.push(...studentCards);
                            }
                            return finalElements;
                        })()}
                    </div>
                )}
            </main>
        </div>
    );
}
