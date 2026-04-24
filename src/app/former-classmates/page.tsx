'use client';

import React, { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { Users, Trophy, ArrowLeft, Loader2, Search, MapPin, Target, ArrowUp, Swords, Sun, Moon, X, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

export default function FormerClassmatesPage() {
    const [classmates, setClassmates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [highlightStudentId, setHighlightStudentId] = useState('');
    const [sortBy, setSortBy] = useState<'rank' | 'pinyin'>('rank');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const itemRefs = React.useRef<{ [key: string]: HTMLAnchorElement | null }>({});

const cardColors = [
    'border-indigo-200 dark:border-indigo-800/50 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-slate-900/60 text-indigo-900 dark:text-indigo-300',
    'border-rose-200 dark:border-rose-800/50 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/40 dark:to-slate-900/60 text-rose-900 dark:text-rose-300',
    'border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900/60 text-amber-900 dark:text-amber-300',
    'border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900/60 text-emerald-900 dark:text-emerald-300',
    'border-sky-200 dark:border-sky-800/50 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/40 dark:to-slate-900/60 text-sky-900 dark:text-sky-300',
    'border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/40 dark:to-slate-900/60 text-purple-900 dark:text-purple-300',
    'border-pink-200 dark:border-pink-800/50 bg-gradient-to-br from-pink-50 to-white dark:from-pink-950/40 dark:to-slate-900/60 text-pink-900 dark:text-pink-300',
    'border-cyan-200 dark:border-cyan-800/50 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/40 dark:to-slate-900/60 text-cyan-900 dark:text-cyan-300',
    'border-lime-200 dark:border-lime-800/50 bg-gradient-to-br from-lime-50 to-white dark:from-lime-950/40 dark:to-slate-900/60 text-lime-900 dark:text-lime-300',
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
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-3 md:py-4 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 transition-colors w-full">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div className="flex flex-col">
                                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 md:w-6 md:h-6 text-rose-500" />
                                    419 同窗
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs">昔日同窗在全校环境下的最新动态</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:hidden">
                            <button onClick={toggleTheme} className="p-2 text-slate-600 dark:text-slate-400">
                                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 text-slate-600 dark:text-slate-400"
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <LayoutGrid className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto pb-4 md:pb-0`}>
                        <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
                            <Link
                                href="/leaderboard"
                                className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 px-3 py-2 rounded-xl text-xs font-bold hover:bg-amber-600 hover:text-white transition-all border border-amber-100 dark:border-amber-900/50"
                            >
                                <Trophy className="w-4 h-4" />
                                <span>排行</span>
                            </Link>
                            <Link
                                href="/pk"
                                className="hidden md:flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 dark:border-indigo-900/50"
                            >
                                <Swords className="w-4 h-4" />
                                <span>PK场</span>
                            </Link>
                            <Link
                                href="/former-classmates"
                                className="flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-3 py-2 rounded-xl text-xs font-bold border border-rose-100 dark:border-rose-900/50"
                            >
                                <Users className="w-4 h-4" />
                                <span>419</span>
                            </Link>
                            <button
                                onClick={toggleTheme}
                                className="hidden md:block p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                            >
                                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </button>
                        </div>
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
                                    className={`group block rounded-2xl p-6 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${highlightStudentId === student.id ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-lg bg-rose-50/30 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200' : cardColors[index % cardColors.length]}`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black transition-colors ${highlightStudentId === student.id ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-500' : 'bg-white/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-rose-500 shadow-inner'}`}>
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-lg ${highlightStudentId === student.id ? 'text-rose-600 dark:text-rose-400' : ''}`}>{student.name}</h3>
                                                <div className={`flex items-center gap-1.5 text-xs ${highlightStudentId === student.id ? 'text-rose-700 dark:text-rose-300' : 'opacity-80'}`}>
                                                    <MapPin className="w-3 h-3" />
                                                    <span>当前所在: </span>
                                                    <span className={`font-bold bg-white/50 dark:bg-slate-800/60 px-2 py-0.5 rounded-full ${highlightStudentId === student.id ? 'text-rose-800 dark:text-rose-200' : ''}`}>{student.current_class || '未记录'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-slate-500">年级排名</div>
                                            <div className={`text-2xl font-black ${highlightStudentId === student.id ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                                                {student.grade_rank ? `#${student.grade_rank}` : '---'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/30 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
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
