import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const ImportService = {
    // 备份数据库
    backupDatabase: () => {
        const dbPath = path.join(process.cwd(), 'data/scores.db');
        const backupDir = path.join(process.cwd(), 'data/backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `scores_backup_${timestamp}.db`);

        if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, backupPath);
        }
    },

    // 执行导入事务
    importExamData: (examName: string, examDate: string | null, data: any[]) => {
        const db = getDb();

        const transaction = db.transaction(() => {
            // 1. 确保考试存在并获取 ID
            let examId;
            const existingExam = db.prepare('SELECT id FROM exams WHERE name = ?').get(examName) as any;
            if (existingExam) {
                examId = existingExam.id;
            } else {
                const info = db.prepare('INSERT INTO exams (name, date) VALUES (?, ?)').run(examName, examDate || null);
                examId = info.lastInsertRowid;
            }

            // 2. 遍历数据进行导入
            for (const item of data) {
                const { student_name, class_name, total_score, grade_rank, class_rank, subjects } = item;

                // 2.1 确保学生存在
                let studentId;
                const existingStudent = db.prepare('SELECT id FROM students WHERE name = ?').get(student_name) as any;
                if (existingStudent) {
                    studentId = existingStudent.id;
                    // 更新一下班级（以导入数据为准）
                    db.prepare('UPDATE students SET class = ? WHERE id = ?').run(class_name, studentId);
                } else {
                    const info = db.prepare('INSERT INTO students (name, class) VALUES (?, ?)').run(student_name, class_name);
                    studentId = info.lastInsertRowid;
                }

                // 2.2 插入考试结果 (如果该学生该次考试已存在，则先删除旧的，实现覆盖式导入)
                db.prepare('DELETE FROM exam_results WHERE student_id = ? AND exam_id = ?').run(studentId, examId);
                const resultInfo = db.prepare(`
                    INSERT INTO exam_results (student_id, exam_id, total_score, grade_rank, class_rank)
                    VALUES (?, ?, ?, ?, ?)
                `).run(studentId, examId, total_score, grade_rank, class_rank);
                const resultId = resultInfo.lastInsertRowid;

                // 2.3 插入各科成绩
                if (subjects && Array.isArray(subjects)) {
                    for (const sub of subjects) {
                        db.prepare(`
                            INSERT INTO subject_scores (result_id, subject, score, grade_rank, class_rank, class_avg)
                            VALUES (?, ?, ?, ?, ?, ?)
                        `).run(resultId, sub.subject, sub.score, sub.grade_rank, sub.class_rank, sub.class_avg || null);
                    }
                }
            }
        });

        transaction();
    }
};
