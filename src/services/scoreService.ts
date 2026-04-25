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
        // 确保显式选择 rank 字段，虽说 r.* 应该涵盖，但这里是 subject_scores
        const subjects = db.prepare(`
            SELECT subject, score, grade_rank, class_rank, grade_avg, class_avg, scaled_score, arts_science_rank
            FROM subject_scores 
            WHERE result_id = ?
        `).all(latestExam.id) as any[];

        // 3. 实时计算班级平均分（分阶段逻辑：ID >= 5 的考试统一以 15 班为基准，历史数据维持原样）
        const examIdNum = Number(latestExam.exam_id);
        const useFixedClass = examIdNum >= 5;

        const classAvgData = db.prepare(`
            SELECT ss.subject, AVG(ss.score) as avg_score
            FROM subject_scores ss
            JOIN exam_results er ON ss.result_id = er.id
            WHERE er.exam_id = ? AND er.class_at_exam = ${useFixedClass ? "'15班'" : `(
                SELECT class_at_exam FROM exam_results WHERE student_id = ? AND exam_id = ?
            )`}
            GROUP BY ss.subject
        `).all(...(useFixedClass ? [examIdNum] : [examIdNum, studentId, examIdNum])) as any[];

        // 4. 实时计算年级平均分 (难度系数)
        const gradeAvgData = db.prepare(`
            SELECT ss.subject, AVG(ss.score) as avg_grade
            FROM subject_scores ss
            JOIN exam_results er ON ss.result_id = er.id
            WHERE er.exam_id = ?
            GROUP BY ss.subject
        `).all(Number(latestExam.exam_id)) as any[];

        // 5. 实时计算本次考试各科的年级总人数 (MAX rank) 作为分母
        const gradeTotals = db.prepare(`
            SELECT ss.subject, MAX(ss.grade_rank) as max_rank
            FROM subject_scores ss
            JOIN exam_results er ON ss.result_id = er.id
            WHERE er.exam_id = ?
            GROUP BY ss.subject
        `).all(Number(latestExam.exam_id)) as any[];

        const enrichedSubjects = subjects.map(s => {
            const cAvg = classAvgData.find(a => a.subject === s.subject);
            const gAvg = gradeAvgData.find(a => a.subject === s.subject);
            const gTotal = gradeTotals.find(t => t.subject === s.subject);
            return {
                ...s,
                class_avg: s.class_avg || (cAvg ? Math.round(cAvg.avg_score * 10) / 10 : null),
                grade_avg: s.grade_avg || (gAvg ? Math.round(gAvg.avg_grade * 10) / 10 : null),
                grade_total: gTotal ? gTotal.max_rank : null
            };
        });

        // 确保返回对象包含 grade_rank
        return { 
            ...latestExam, 
            grade_rank: latestExam.grade_rank, // Explicitly return
            class_rank: latestExam.class_rank, // Explicitly return
            subjects: enrichedSubjects 
        };
    },

    // 获取特定学生的历史趋势 (最近10次 - 增加数量以便更好观察趋势)
    getStudentTrend: (studentId: string, limit: number = 10) => {
        const db = getDb();
        const exams = db.prepare(`
            SELECT e.id as exam_id, e.name, e.date, r.id as result_id, r.total_score, r.total_full_score, r.grade_rank, r.class_rank
            FROM exams e
            JOIN exam_results r ON e.id = r.exam_id
            WHERE r.student_id = ?
            ORDER BY IFNULL(e.date, '') ASC, e.id ASC
            LIMIT ?
        `).all(studentId, limit) as any[];

        // 为每次考试附上各科成绩
        const enrichedExams = exams.map(exam => {
            const subjects = db.prepare(`
                SELECT subject, score, grade_rank, class_rank, grade_avg, class_avg, scaled_score, arts_science_rank
                FROM subject_scores 
                WHERE result_id = ?
            `).all(exam.result_id) as any[];

            // 为趋势数据获取各科实考总人数
            const gradeTotals = db.prepare(`
                SELECT ss.subject, MAX(ss.grade_rank) as max_rank
                FROM subject_scores ss
                JOIN exam_results er ON ss.result_id = er.id
                WHERE er.exam_id = ?
                GROUP BY ss.subject
            `).all(Number(exam.exam_id)) as any[];

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
                    const gTotal = gradeTotals.find(t => t.subject === s.subject);
                    return {
                        ...s,
                        grade_avg: s.grade_avg || (gAvg ? Math.round(gAvg.avg_grade * 10) / 10 : null),
                        grade_total: gTotal ? gTotal.max_rank : null
                    };
                })
            };
        });

        return enrichedExams;
    },

    // 获取所有考试列表
    getAllExams: () => {
        const db = getDb();
        return db.prepare(`
            SELECT id as exam_id, name, date
            FROM exams
            ORDER BY IFNULL(date, '') DESC, id DESC
        `).all();
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

    // 获取某次考试的所有班级列表
    getExamClasses: (examId: string): string[] => {
        const db = getDb();
        const records = db.prepare(`
            SELECT DISTINCT class_at_exam 
            FROM exam_results 
            WHERE exam_id = ? AND class_at_exam IS NOT NULL
            ORDER BY class_at_exam
        `).all(examId) as any[];
        return records.map(r => r.class_at_exam);
    },

// 获取排行榜
    getLeaderboard: (examId: string, subject: string = '总分', classFilter?: string) => {
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

        const filterClause = (classFilter && classFilter !== '全部')
            ? (classFilter === '419' ? 'AND s.former_class = ?' : classFilter === '415' ? 'AND (s.former_class != ? OR s.former_class IS NULL)' : 'AND r.class_at_exam = ?')
            : '';

        if (subject === '总分') {
            query = `
                SELECT s.id, s.name, s.former_class, r.class_at_exam as class, r.total_score as score, r.grade_rank as rank, r.class_rank
                FROM exam_results r
                JOIN students s ON r.student_id = s.id
                WHERE r.exam_id = ? ${filterClause}
                ORDER BY r.total_score DESC
            `;
            params.push(examId);
            if (classFilter && classFilter !== '全部') {
                params.push(classFilter === '419' ? '19班' : classFilter === '415' ? '19班' : classFilter);
            }
        } else if (combinations[subject]) {
            // 组合排名：计算指定6门科目的总分
            const targetSubjects = combinations[subject];
            const placeholders = targetSubjects.map(() => '?').join(',');

            query = `
                SELECT 
                    s.id, s.name, s.former_class, r.class_at_exam as class, 
                    SUM(ss.score) as score,
                    RANK() OVER (ORDER BY SUM(ss.score) DESC) as rank,
                    RANK() OVER (PARTITION BY r.class_at_exam ORDER BY SUM(ss.score) DESC) as class_rank
                FROM subject_scores ss
                JOIN exam_results r ON ss.result_id = r.id
                JOIN students s ON r.student_id = s.id
                WHERE r.exam_id = ? AND ss.subject IN (${placeholders}) ${filterClause}
                GROUP BY s.id
                ORDER BY score DESC
            `;
            params.push(examId, ...targetSubjects);
            if (classFilter && classFilter !== '全部') {
                params.push(classFilter === '419' ? '19班' : classFilter === '415' ? '19班' : classFilter);
            }
        } else {
            // 单科排名
            query = `
                SELECT s.id, s.name, s.former_class, r.class_at_exam as class, ss.score, ss.grade_rank as rank, ss.class_rank
                FROM subject_scores ss
                JOIN exam_results r ON ss.result_id = r.id
                JOIN students s ON r.student_id = s.id
                WHERE r.exam_id = ? AND ss.subject = ? ${filterClause}
                ORDER BY ss.score DESC
            `;
            params.push(examId, subject);
            if (classFilter && classFilter !== '全部') {
                params.push(classFilter === '419' ? '19班' : classFilter === '415' ? '19班' : classFilter);
            }
        }

        return db.prepare(query).all(...params);
    },

    // 获取科学的目标对标数据 (增强版：含难度系数)
    getTargetReferenceData: (examId: number, targetRank: number) => {
        const db = getDb();
        // 新逻辑：线性插值计算目标分数 (针对稀疏数据优化)
        
        // 1. 找到排名 <= targetRank 的最近一个 (Upper Bound, 更好或相等的排名)
        const better = db.prepare(`
            SELECT id, grade_rank, total_score 
            FROM exam_results 
            WHERE exam_id = ? AND grade_rank <= ?
            ORDER BY grade_rank DESC 
            LIMIT 1
        `).get(examId, targetRank) as any;

        // 2. 找到排名 >= targetRank 的最近一个 (Lower Bound, 更差或相等的排名)
        const worse = db.prepare(`
            SELECT id, grade_rank, total_score 
            FROM exam_results 
            WHERE exam_id = ? AND grade_rank >= ?
            ORDER BY grade_rank ASC 
            LIMIT 1
        `).get(examId, targetRank) as any;

        let targetTotalScore = 0;
        let referenceIds: number[] = [];

        if (better && worse) {
            if (better.grade_rank === worse.grade_rank) {
                targetTotalScore = better.total_score;
                referenceIds = [better.id];
            } else {
                // 线性插值
                const rankGap = worse.grade_rank - better.grade_rank;
                const scoreGap = better.total_score - worse.total_score; // 排名越好分数越高，better.score > worse.score
                const factor = (targetRank - better.grade_rank) / rankGap;
                targetTotalScore = better.total_score - (scoreGap * factor);
                referenceIds = [better.id, worse.id];
            }
        } else if (better) {
            targetTotalScore = better.total_score;
            referenceIds = [better.id];
        } else if (worse) {
            targetTotalScore = worse.total_score;
            referenceIds = [worse.id];
        } else {
            return null; // 无数据
        }
        
        // 3. 计算各科分数 (取参考样本的平均值)
        const placeholders = referenceIds.map(() => '?').join(',');
        const allScores = db.prepare(`
            SELECT subject, score 
            FROM subject_scores 
            WHERE result_id IN (${placeholders})
        `).all(...referenceIds) as any[];

        const subjectMap: Record<string, number[]> = {};
        allScores.forEach(s => {
            if (!subjectMap[s.subject]) subjectMap[s.subject] = [];
            subjectMap[s.subject].push(s.score);
        });

        const medianSubjects: Record<string, number> = {};
        Object.keys(subjectMap).forEach(sub => {
            const scores = subjectMap[sub];
            const sum = scores.reduce((a, b) => a + b, 0);
            medianSubjects[sub] = sum / scores.length;
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
            total_score: targetTotalScore,
            subjects: medianSubjects,
            difficulty: subjectDifficulty // 各科难度系数 (年级平均分)
        };
    }

};
