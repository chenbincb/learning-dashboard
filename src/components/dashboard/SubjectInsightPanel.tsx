'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Zap, Sparkles } from 'lucide-react';

interface SubjectInsightPanelProps {
    subjects: any[];
    prevSubjects?: any[];
    totalScore: number;
    targetData?: any;
    targetRank: number;
    diagnosedIntents: string[];
    onAIDiagnose: (subject: any) => void;
}

export function SubjectInsightPanel({
    subjects,
    prevSubjects,
    totalScore,
    targetData,
    targetRank,
    diagnosedIntents,
    onAIDiagnose
}: SubjectInsightPanelProps) {
    const insights = subjects.map(s => {
        const ps = prevSubjects?.find(p => p.subject === s.subject);
        const gain = ps ? (ps.grade_rank - s.grade_rank) : 0;
        const fullScore = ['语文', '数学', '英语'].includes(s.subject) ? 150 : 100;
        const scoreRate = (s.score / fullScore) * 100;

        return { ...s, gain, scoreRate };
    });

    const gainers = [...insights].filter(i => i.gain > 0).sort((a, b) => b.gain - a.gain).slice(0, 2);
    const decliners = [...insights].filter(i => i.gain < 0).sort((a, b) => a.gain - b.gain).slice(0, 2);

    const isGoalReached = targetData ? totalScore >= targetData.total_score : false;
    const totalGap = targetData ? Math.max(0, targetData.total_score - totalScore).toFixed(1) : null;

    // 1. 计算所有科目的原始差距和权重
    const ALL_SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
    let candidates = ALL_SUBJECTS.map(subName => {
        const s = subjects.find(sub => sub.subject === subName);
        if (!s) return { subject: subName, rawGap: 0, weight: 0, difficulty: 0, difficultyRatio: 0, score: 0 };

        const fullScore = ['语文', '数学', '英语'].includes(subName) ? 150 : 100;
        const targetValue = targetData?.subjects[subName] || 0;
        const rawGap = Math.max(0, targetValue - s.score);

        const gradeAvg = targetData?.difficulty?.[subName] || fullScore * 0.6;
        const difficultyRatio = gradeAvg / fullScore;

        const classAvg = s.class_avg || gradeAvg;
        const capabilityRatio = s.score / classAvg;

        const weight = rawGap * (1 + (1 - difficultyRatio) * 0.3) * (1 + (1 - capabilityRatio) * 0.5);

        return {
            subject: subName,
            rawGap, // 原始差距 (对标 benchmark)
            weight,
            difficultyRatio,
            score: s.score
        };
    }).sort((a, b) => b.weight - a.weight);

    // 2. 智能分配提分目标 (只分配由于总分差距带来的缺口)
    let requiredGain = targetData ? Math.max(0, targetData.total_score - totalScore) : 0;
    
    const subjectSuggestions = candidates.map(c => {
        let suggestedGain = 0;
        if (requiredGain > 0 && c.rawGap > 0) {
            // 分配原则：优先填补最容易提分的科目，但不超过该科目的 Benchmark 差距
            const allocation = Math.min(c.rawGap, requiredGain);
            suggestedGain = allocation;
            requiredGain -= allocation;
        }

        return {
            subject: c.subject,
            gap: isGoalReached ? 0 : Math.round(suggestedGain * 10) / 10,
            weight: c.weight,
            difficulty: Math.round(c.difficultyRatio * 100)
        };
    });
    // 注意：这里由于 candidates 已经排序，map 后的 subjectSuggestions 也是按权重排序的，无需再 sort

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
        <div className="flex-1 flex flex-col justify-between py-2 min-h-0 overflow-hidden font-sans">

            <div className="p-2 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 rounded-lg border border-indigo-100/50 dark:border-indigo-800/30">
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-snug">
                    {smartInsight}
                </p>
            </div>

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

            <div className="space-y-1 pt-2">
                <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">科学提分路线 (对标 {targetRank} 名)</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                    {subjectSuggestions.map(s => {
                        const isDiagnosed = diagnosedIntents.includes(`SUBJECT_DEEP_DIVE:${s.subject}`);
                        return (
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

                                <button
                                    onClick={() => onAIDiagnose(subjects.find(sub => sub.subject === s.subject))}
                                    className={`ml-2 p-1 rounded-md cursor-pointer transition-colors ${isDiagnosed
                                        ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30'
                                        : 'text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                                    title="AI 深度诊断"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

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
