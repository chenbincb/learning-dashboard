import { getDb } from '@/lib/db';

export const ClassCompareService = {
    /**
     * 获取学生的分班前后对比数据
     * 基准 (Base): 该生在 class_at_exam = '19班' 时期的所有成绩均值
     * 现状 (Current): 指定考试的成绩
     */
    getStudentComparison: (studentId: string, currentExamId: number) => {
        const db = getDb();

        // 1. 获取 19 班时期的历史均值 (前 4 次考试)
        const historyStats = db.prepare(`
            SELECT 
                AVG(total_score) as avg_score,
                AVG(grade_rank) as avg_grade_rank,
                COUNT(*) as exam_count
            FROM exam_results
            WHERE student_id = ? AND class_at_exam = '19班'
        `).get(studentId) as { avg_score: number | null, avg_grade_rank: number | null, exam_count: number };

        // 2. 获取当前选中考试的表现
        const currentStats = db.prepare(`
            SELECT 
                total_score,
                grade_rank,
                class_at_exam as current_class
            FROM exam_results
            WHERE student_id = ? AND exam_id = ?
        `).get(studentId, currentExamId) as { total_score: number, grade_rank: number, current_class: string } | undefined;

        if (!historyStats.avg_score || !currentStats) {
            return null;
        }

        return {
            history: {
                avgScore: Math.round(historyStats.avg_score),
                avgGradeRank: Math.round(historyStats.avg_grade_rank || 0),
                examCount: historyStats.exam_count
            },
            current: {
                score: currentStats.total_score,
                gradeRank: currentStats.grade_rank,
                class: currentStats.current_class
            },
            // 计算位移: 负数表示排名上升(变好)，正数表示排名下降
            rankChange: currentStats.grade_rank - (historyStats.avg_grade_rank || 0),
            scoreChange: currentStats.total_score - (historyStats.avg_score || 0)
        };
    },

/**
     * 获取所有原 19 班同窗的最新战况 (散作满天星)
     */
    getFormerClassmatesRankings: () => {
        const db = getDb();
        
        // 我们需要找到每个 former_class = '19班' 的学生，并获取他们最近一次考试的成绩
        // 这里的逻辑是: 先找出所有 19 班的学生，然后 JOIN 他们最新的 exam_results
        return db.prepare(`
            SELECT 
                s.id,
                s.name,
                s.class as current_class,
                s.former_class,
                r.grade_rank,
                r.total_score,
                e.name as exam_name,
                e.date as exam_date
            FROM students s
            LEFT JOIN (
                SELECT student_id, MAX(exam_id) as latest_exam_id
                FROM exam_results
                GROUP BY student_id
            ) latest ON s.id = latest.student_id
            LEFT JOIN exam_results r ON s.id = r.student_id AND r.exam_id = latest.latest_exam_id
            LEFT JOIN exams e ON r.exam_id = e.id
            WHERE s.former_class = '19班'
            ORDER BY r.grade_rank ASC, s.name ASC
        `).all();
    }
};
