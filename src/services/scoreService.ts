import { getDb } from '@/lib/db';

export const ScoreService = {
    // 获取学生单次考试详情（包含科目成绩、班级平均分补全）
    getStudentExamResult: (studentId: string, examId?: string) => {
        const db = getDb();

        // 1. 获取考试基本信息
        let latestExam;
        if (examId) {
            latestExam = db.prepare(`
                SELECT r.*, e.name as exam_name, e.date, s.name as student_name
                FROM exam_results r
                JOIN exams e ON r.exam_id = e.id
                JOIN students s ON r.student_id = s.id
                WHERE r.student_id = ? AND r.exam_id = ?
            `).get(studentId, examId);
        } else {
            latestExam = db.prepare(`
                SELECT r.*, e.name as exam_name, e.date, s.name as student_name
                FROM exam_results r
                JOIN exams e ON r.exam_id = e.id
                JOIN students s ON r.student_id = s.id
                WHERE r.student_id = ?
                ORDER BY IFNULL(e.date, '') DESC, e.id DESC
                LIMIT 1
            `).get(studentId);
        }
        latestExam = latestExam as any;

        if (!latestExam) return null;

        // 2. 获取该次考试的科目成绩
        const subjects = db.prepare(`
            SELECT subject, score, grade_rank, class_rank, grade_avg, class_avg
            FROM subject_scores 
            WHERE result_id = ?
        `).all(latestExam.id) as any[];

        // 3. 实时计算班级平均分
        const classAvgData = db.prepare(`
            SELECT ss.subject, AVG(ss.score) as avg_score
            FROM subject_scores ss
            JOIN exam_results er ON ss.result_id = er.id
            JOIN students s ON er.student_id = s.id
            WHERE er.exam_id = ? AND s.class = (SELECT class FROM students WHERE id = ?)
            GROUP BY ss.subject
        `).all(Number(latestExam.exam_id), studentId) as any[];

        // 4. 实时计算年级平均分 (难度系数)
        const gradeAvgData = db.prepare(`
            SELECT ss.subject, AVG(ss.score) as avg_grade
            FROM subject_scores ss
            JOIN exam_results er ON ss.result_id = er.id
            WHERE er.exam_id = ?
            GROUP BY ss.subject
        `).all(Number(latestExam.exam_id)) as any[];

        const enrichedSubjects = subjects.map(s => {
            const cAvg = classAvgData.find(a => a.subject === s.subject);
            const gAvg = gradeAvgData.find(a => a.subject === s.subject);
            return {
                ...s,
                class_avg: s.class_avg || (cAvg ? Math.round(cAvg.avg_score * 10) / 10 : null),
                grade_avg: s.grade_avg || (gAvg ? Math.round(gAvg.avg_grade * 10) / 10 : null)
            };
        });

        return { ...latestExam, subjects: enrichedSubjects };
    },

    // 获取特定学生的历史趋势 (最近10次 - 增加数量以便更好观察趋势)
    getStudentTrend: (studentId: string, limit: number = 10) => {
        const db = getDb();
        const exams = db.prepare(`
            SELECT e.id as exam_id, e.name, e.date, r.id as result_id, r.total_score, r.grade_rank, r.class_rank
            FROM exams e
            JOIN exam_results r ON e.id = r.exam_id
            WHERE r.student_id = ?
            ORDER BY IFNULL(e.date, '') ASC, e.id ASC
            LIMIT ?
        `).all(studentId, limit) as any[];

        // 为每次考试附上各科成绩
        const enrichedExams = exams.map(exam => {
            const subjects = db.prepare(`
                SELECT subject, score, grade_rank, class_rank, grade_avg, class_avg
                FROM subject_scores 
                WHERE result_id = ?
            `).all(exam.result_id) as any[];

            // 为趋势数据也补全平均分 (用于波动率计算)
            const gAvgs = db.prepare(`
                SELECT ss.subject, AVG(ss.score) as avg_grade
                FROM subject_scores ss
                JOIN exam_results er ON ss.result_id = er.id
                WHERE er.exam_id = ?
                GROUP BY ss.subject
            `).all(Number(exam.exam_id)) as any[];

            return {
                ...exam,
                subjects: subjects.map(s => {
                    const gAvg = gAvgs.find(a => a.subject === s.subject);
                    return {
                        ...s,
                        grade_avg: s.grade_avg || (gAvg ? Math.round(gAvg.avg_grade * 10) / 10 : null)
                    };
                })
            };
        });

        return enrichedExams;
    },

    // 获取特定学生的所有考试列表
    getStudentExams: (studentId: string) => {
        const db = getDb();
        return db.prepare(`
            SELECT e.id as exam_id, e.name, e.date, r.total_score, r.grade_rank, r.class_rank
            FROM exams e
            JOIN exam_results r ON e.id = r.exam_id
            WHERE r.student_id = ?
            ORDER BY IFNULL(e.date, '') DESC, e.id DESC
        `).all(studentId);
    },

    // 获取上一次考试的科目成绩 (用于计算进步)
    getPreviousSubjects: (studentId: string, currentExamDate: string | null, currentExamId: number) => {
        const db = getDb();
        const prevExamResult = db.prepare(`
            SELECT r.id
            FROM exam_results r
            JOIN exams e ON r.exam_id = e.id
            WHERE r.student_id = ? AND (
                IFNULL(e.date, '') < IFNULL(?, '') 
                OR (IFNULL(e.date, '') = IFNULL(?, '') AND e.id < ?)
            )
            ORDER BY IFNULL(e.date, '') DESC, e.id DESC
            LIMIT 1
        `).get(studentId, currentExamDate, currentExamDate, currentExamId) as any;

        if (!prevExamResult) return [];

        return db.prepare(`
            SELECT subject, grade_rank, class_rank
            FROM subject_scores 
            WHERE result_id = ?
        `).all(prevExamResult.id) as any[];
    },

    // 获取排行榜
    getLeaderboard: (examId: string, subject: string = '总分') => {
        const db = getDb();
        let query = '';
        const params: any[] = [];

        // 定义选科组合 (语数外 + 3门选科)
        const combinations: Record<string, string[]> = {
            '物化生': ['语文', '数学', '英语', '物理', '化学', '生物'],
            '物化地': ['语文', '数学', '英语', '物理', '化学', '地理'],
            '物化政': ['语文', '数学', '英语', '物理', '化学', '政治'],
            '史政地': ['语文', '数学', '英语', '历史', '政治', '地理']
        };

        if (subject === '总分') {
            query = `
                SELECT s.id, s.name, s.class, r.total_score as score, r.grade_rank as rank, r.class_rank
                FROM exam_results r
                JOIN students s ON r.student_id = s.id
                WHERE r.exam_id = ?
                ORDER BY r.total_score DESC
            `;
            params.push(examId);
        } else if (combinations[subject]) {
            // 组合排名：计算指定6门科目的总分
            const targetSubjects = combinations[subject];
            const placeholders = targetSubjects.map(() => '?').join(',');

            query = `
                SELECT 
                    s.id, s.name, s.class, 
                    SUM(ss.score) as score,
                    RANK() OVER (ORDER BY SUM(ss.score) DESC) as rank,
                    RANK() OVER (PARTITION BY s.class ORDER BY SUM(ss.score) DESC) as class_rank
                FROM subject_scores ss
                JOIN exam_results r ON ss.result_id = r.id
                JOIN students s ON r.student_id = s.id
                WHERE r.exam_id = ? AND ss.subject IN (${placeholders})
                GROUP BY s.id
                ORDER BY score DESC
            `;
            params.push(examId, ...targetSubjects);
        } else {
            // 单科排名
            query = `
                SELECT s.id, s.name, s.class, ss.score, ss.grade_rank as rank, ss.class_rank
                FROM subject_scores ss
                JOIN exam_results r ON ss.result_id = r.id
                JOIN students s ON r.student_id = s.id
                WHERE r.exam_id = ? AND ss.subject = ?
                ORDER BY ss.score DESC
            `;
            params.push(examId, subject);
        }

        return db.prepare(query).all(...params);
    },

    // 获取科学的目标对标数据 (增强版：含难度系数)
    getTargetReferenceData: (examId: number, targetRank: number) => {
        const db = getDb();
        // 1. 抓取目标排名附近的样本池 (±10个名次)
        const range = 10;
        let resultIds = db.prepare(`
            SELECT id, total_score 
            FROM exam_results 
            WHERE exam_id = ? AND grade_rank BETWEEN ? AND ?
        `).all(examId, targetRank - range, targetRank + range) as any[];

        if (resultIds.length === 0) {
            // 如果没查到，找最接近的数据
            resultIds = db.prepare(`
                SELECT id, total_score FROM exam_results 
                WHERE exam_id = ? 
                ORDER BY ABS(grade_rank - ?) ASC
                LIMIT 20
            `).all(examId, targetRank) as any[];
        }

        if (resultIds.length === 0) return null;

        // 2. 计算各项得分的中位数
        const totals = resultIds.map(s => s.total_score).sort((a, b) => a - b);
        const medianTotal = totals[Math.floor(totals.length / 2)];

        // 获取这些学生的所有科目成绩
        const ids = resultIds.map(r => r.id);
        const placeholders = ids.map(() => '?').join(',');
        const allScores = db.prepare(`
            SELECT subject, score 
            FROM subject_scores 
            WHERE result_id IN (${placeholders})
        `).all(...ids) as any[];

        const subjectMap: Record<string, number[]> = {};
        allScores.forEach(s => {
            if (!subjectMap[s.subject]) subjectMap[s.subject] = [];
            subjectMap[s.subject].push(s.score);
        });

        const medianSubjects: Record<string, number> = {};
        Object.keys(subjectMap).forEach(sub => {
            const scores = subjectMap[sub].sort((a, b) => a - b);
            medianSubjects[sub] = scores[Math.floor(scores.length / 2)];
        });

        // 3. 获取全年级各科平均分作为难度系数
        const gradeAvgData = db.prepare(`
            SELECT ss.subject, AVG(ss.score) as avg_grade
            FROM subject_scores ss
            JOIN exam_results er ON ss.result_id = er.id
            WHERE er.exam_id = ?
            GROUP BY ss.subject
        `).all(Number(examId)) as any[];

        const subjectDifficulty: Record<string, number> = {};
        gradeAvgData.forEach(d => {
            subjectDifficulty[d.subject] = Math.round(d.avg_grade * 10) / 10;
        });

        return {
            targetRank,
            total_score: medianTotal,
            subjects: medianSubjects,
            difficulty: subjectDifficulty // 各科难度系数 (年级平均分)
        };
    }

};
