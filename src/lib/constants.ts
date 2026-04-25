/**
 * 2026届学生群体基数常量
 * 根据 2026年4月期中考试实考人数及分班结构推算
 */
export const SUBJECT_TOTALS: Record<string, number> = {
    '语文': 1038,
    '数学': 1038,
    '英语': 1038,
    '物理': 920,
    '化学': 920,
    '生物': 565,
    '地理': 415,
    '政治': 150,
    '历史': 100,
    '总分': 1038
};

/**
 * 根据学科和实测最大名次获取动态年级总人数
 * @param subject 科目名称
 * @param maxRank 数据库中该场考试该科目的最大名次
 */
export const getSubjectTotal = (subject: string, maxRank?: number): number => {
    const electiveTotal = SUBJECT_TOTALS[subject] || 1038; // 预设选科基数
    const fullTotal = SUBJECT_TOTALS['总分']; // 全校总基数

    // 如果没有实测名次，回退到预设选科基数
    if (!maxRank) return electiveTotal;

    // 智能判定逻辑：
    // 1. 如果实测名次已经突破了选科基数，说明是全员考试（如期末全考），直接跳到全校总人数
    if (maxRank > electiveTotal) {
        return Math.max(fullTotal, maxRank);
    }

    // 2. 否则，维持选科基数
    return electiveTotal;
};
