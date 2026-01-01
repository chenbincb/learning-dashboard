/**
 * 根据科目名称获取统一的主题颜色
 * @param name 科目名称
 * @returns CSS 颜色代码 (Hex)
 */
export const getSubjectColor = (name: string) => {
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
