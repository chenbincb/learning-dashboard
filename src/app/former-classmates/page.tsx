'use client';

import React, { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { Users, Trophy, ArrowLeft, Loader2, Search, MapPin, Target, ArrowUp, Swords, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

export default function FormerClassmatesPage() {
    const [classmates, setClassmates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [highlightStudentId, setHighlightStudentId] = useState('');
    const [sortBy, setSortBy] = useState<'rank' | 'pinyin'>('rank');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const itemRefs = React.useRef<{ [key: string]: HTMLAnchorElement | null }>({});

const cardColors = [
    'border-indigo-200 bg-gradient-to-br from-indigo-50 to-white text-indigo-900',
    'border-rose-200 bg-gradient-to-br from-rose-50 to-white text-rose-900',
    'border-amber-200 bg-gradient-to-br from-amber-50 to-white text-amber-900',
    'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white text-emerald-900',
    'border-sky-200 bg-gradient-to-br from-sky-50 to-white text-sky-900',
    'border-purple-200 bg-gradient-to-br from-purple-50 to-white text-purple-900',
    'border-pink-200 bg-gradient-to-br from-pink-50 to-white text-pink-900',
    'border-cyan-200 bg-gradient-to-br from-cyan-50 to-white text-cyan-900',
    'border-lime-200 bg-gradient-to-br from-lime-50 to-white text-lime-900',
];

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === 'dark') document.documentElement.classList.add('dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        }

        const fetchData = async () => {
            try {
                const data = await API.fetchFormerClassmates();
                setClassmates(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to fetch classmates:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark');
    };

    // 处理定位滚动
    const scrollToHighlight = (id: string) => {
        if (id && itemRefs.current[id]) {
            itemRefs.current[id]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    };

    useEffect(() => {
        if (highlightStudentId) {
            scrollToHighlight(highlightStudentId);
        }
    }, [highlightStudentId]);

    // 处理排序
    const sortedClassmates = [...classmates]
        .sort((a, b) => {
            if (sortBy === 'pinyin') {
                return a.name.localeCompare(b.name, 'zh-Hans-CN');
            }
            const rankA = a.grade_rank || 9999;
            const rankB = b.grade_rank || 9999;
            return rankA - rankB;
        });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-4 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 transition-colors">
<div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/"
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Users className="w-6 h-6 text-rose-500" />
                                419班同窗轨迹
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">昔日同窗在全校新环境下的最新动态</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/leaderboard"
                            className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 hover:text-white transition-all border border-amber-100 dark:border-amber-900/50 cursor-pointer"
                        >
                            <Trophy className="w-4 h-4" />
                            排行
                        </Link>
                        <Link
                            href="/pk"
                            className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 dark:border-indigo-900/50 cursor-pointer"
                        >
                            <Swords className="w-4 h-4" />
                            PK场
                        </Link>
                        <Link
                            href="/former-classmates"
                            className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl text-sm font-bold border border-rose-100 dark:border-rose-900/50 cursor-pointer"
                        >
                            <Users className="w-4 h-4" />
                            419
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

            <main className="max-w-7xl mx-auto p-4 md:p-8 relative">
                {/* Search & Sort */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className={`flex-1 flex items-center gap-2 bg-white dark:bg-slate-900 border ${highlightStudentId ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-2xl px-4 py-3 shadow-sm transition-all`}>
                        <Search className="w-5 h-5 text-slate-400" />
                        <select
                            className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 dark:text-slate-200 w-full cursor-pointer dark:bg-slate-900"
                            value={highlightStudentId}
                            onChange={(e) => setHighlightStudentId(e.target.value)}
                        >
                            <option value="" className="dark:bg-slate-800">快速定位同窗...</option>
                            {[...classmates].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')).map(c => (
                                <option key={c.id} value={c.id} className="dark:bg-slate-800">{c.name} ({c.id})</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1">
                        <button 
                            onClick={() => setSortBy('rank')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === 'rank' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            按最新年级排名
                        </button>
                        <button 
                            onClick={() => setSortBy('pinyin')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === 'pinyin' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            按姓名拼音排序
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
                        <p className="text-slate-500 font-medium animate-pulse">正在汇聚同窗数据...</p>
                    </div>
                ) : (
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedClassmates.map((student, index) => {
                            const colorClass = cardColors[index % cardColors.length].split(' ').pop();
                            return (
                                <Link 
                                    key={student.id} 
                                    ref={el => { itemRefs.current[student.id] = el; }}
                                    href={`/?studentId=${student.id}`}
                                    className={`group block rounded-2xl p-6 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${highlightStudentId === student.id ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-lg bg-rose-50/30 text-rose-900' : cardColors[index % cardColors.length]}`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black transition-colors ${highlightStudentId === student.id ? 'bg-rose-100 text-rose-500' : 'bg-white/60 text-slate-600 group-hover:bg-white group-hover:text-rose-500 shadow-inner'}`}>
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-lg ${highlightStudentId === student.id ? 'text-rose-600' : colorClass}`}>{student.name}</h3>
                                                <div className={`flex items-center gap-1.5 text-xs ${highlightStudentId === student.id ? 'text-rose-700' : colorClass + '/80'}`}>
                                                    <MapPin className="w-3 h-3" />
                                                    <span>当前所在: </span>
                                                    <span className={`font-bold bg-white/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-full ${highlightStudentId === student.id ? 'text-rose-800' : colorClass}`}>{student.current_class || '未记录'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-slate-500">年级排名</div>
                                            <div className={`text-2xl font-black ${highlightStudentId === student.id ? 'text-rose-600' : colorClass}`}>
                                                {student.grade_rank ? `#${student.grade_rank}` : '---'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1 italic">
                                            <Trophy className="w-3 h-3 text-amber-500" />
                                            数据来源: {student.exam_name || '暂无成绩数据'}
                                        </div>
                                        <div className="font-mono text-slate-400">{student.id}</div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
                
                {/* Floating Actions */}
                <div className="fixed bottom-8 left-1/2 ml-[640px] flex flex-col gap-3 z-40">
                    {highlightStudentId && (
                        <button
                            onClick={() => scrollToHighlight(highlightStudentId)}
                            className="p-4 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 hover:scale-110 active:scale-95 transition-all animate-in zoom-in duration-300"
                            title="定位选中学生"
                        >
                            <Target className="w-6 h-6" />
                        </button>
                    )}
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className={`p-4 bg-white dark:bg-slate-800 text-slate-400 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
                        title="返回顶部"
                    >
                        <ArrowUp className="w-6 h-6" />
                    </button>
                </div>
                
                {!loading && sortedClassmates.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-slate-400">未找到匹配的同窗信息。</p>
                    </div>
                )}
            </main>
        </div>
    );
}
