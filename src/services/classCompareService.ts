import { getDb } from '@/lib/db';

export const ClassCompareService = {
    /**
     * 获取学生的分班前后对比数据
     * 基准 (Base): 该生在 class_at_exam = '19班' 时期的所有成绩均值
     * 现状 (Current): 指定考试的成绩
     */
    getStudentComparison: (studentId: string, currentExamId: number) => {
        const db = getDb();

        // 1. 获取该学生参与过的所有班级（按考试顺序倒序）
        const classHistory = db.prepare(`
            SELECT DISTINCT class_at_exam 
            FROM exam_results 
            WHERE student_id = ? AND class_at_exam IS NOT NULL
            ORDER BY exam_id DESC
        `).all(studentId) as { class_at_exam: string }[];

        if (classHistory.length < 2) {
            // 如果只有一个班级记录，无法进行对比
            return null;
        }

        const currentClass = classHistory[0].class_at_exam;
        const previousClass = classHistory[1].class_at_exam;

        // 2. 获取“上一个班级”时期的全量均值及累计值 (BEFORE)
        const historyStats = db.prepare(`
            SELECT 
                AVG(total_score) as avg_score,
                AVG(total_full_score) as avg_full_score,
                SUM(total_score) as sum_score,
                SUM(total_full_score) as sum_full_score,
                AVG(grade_rank) as avg_grade_rank,
                COUNT(*) as exam_count
            FROM exam_results
            WHERE student_id = ? AND class_at_exam = ?
        `).get(studentId, previousClass) as { avg_score: number | null, avg_full_score: number | null, sum_score: number | null, sum_full_score: number | null, avg_grade_rank: number | null, exam_count: number };

        // 3. 获取“当前班级”时期的全量均值及累计值 (NOW)
        const currentStats = db.prepare(`
            SELECT 
                AVG(total_score) as avg_score,
                AVG(total_full_score) as avg_full_score,
                SUM(total_score) as sum_score,
                SUM(total_full_score) as sum_full_score,
                AVG(grade_rank) as avg_grade_rank,
                COUNT(*) as exam_count
            FROM exam_results
            WHERE student_id = ? AND class_at_exam = ?
        `).get(studentId, currentClass) as { avg_score: number | null, avg_full_score: number | null, sum_score: number | null, sum_full_score: number | null, avg_grade_rank: number | null, exam_count: number };

        if (!historyStats.avg_score || !currentStats.avg_score) {
            return null;
        }

        return {
            history: {
                avgScore: Math.round(historyStats.avg_score),
                avgFullScore: Math.round(historyStats.avg_full_score || 0),
                sumScore: Math.round(historyStats.sum_score || 0),
                sumFullScore: Math.round(historyStats.sum_full_score || 0),
                avgGradeRank: Math.round(historyStats.avg_grade_rank || 0),
                examCount: historyStats.exam_count,
                class: previousClass
            },
            current: {
                score: Math.round(currentStats.avg_score),
                fullScore: Math.round(currentStats.avg_full_score || 0),
                sumScore: Math.round(currentStats.sum_score || 0),
                sumFullScore: Math.round(currentStats.sum_full_score || 0),
                gradeRank: Math.round(currentStats.avg_grade_rank || 0),
                examCount: currentStats.exam_count,
                class: currentClass
            },
            // 计算位移: 均值位移
            rankChange: (currentStats.avg_grade_rank || 0) - (historyStats.avg_grade_rank || 0),
            scoreChange: (currentStats.avg_score || 0) - (historyStats.avg_score || 0)
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
