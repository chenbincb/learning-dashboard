import { getDb } from "@/lib/db";
import fs from "fs";
import path from "path";

export const ImportService = {
  // 备份数据库
  backupDatabase: () => {
    const dbPath = path.join(process.cwd(), "data/scores.db");
    const backupDir = path.join(process.cwd(), "data/backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
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
      let examId: number | bigint;
      const existingExam = db.prepare('SELECT id FROM exams WHERE name = ?').get(examName) as any;
      if (existingExam) {
        examId = existingExam.id;
      } else {
        const info = db.prepare('INSERT INTO exams (name, date) VALUES (?, ?)').run(examName, examDate || null);
        examId = info.lastInsertRowid;
      }

      // 2. 预处理：计算本次考试每门科目的最高分，用于判定满分 (100 or 150)
      const subjectMaxMap: Record<string, number> = {};
      for (const item of data) {
        if (item.subjects && Array.isArray(item.subjects)) {
          for (const sub of item.subjects) {
            if (sub.score !== undefined && sub.score !== null) {
              subjectMaxMap[sub.subject] = Math.max(subjectMaxMap[sub.subject] || 0, sub.score);
            }
          }
        }
      }

      // 3. 遍历数据进行导入
      for (const item of data) {
        const { student_info, exam_result, subjects } = item;
        
        if (!student_info || !student_info.id) {
          console.warn(`跳过无效学生数据: ${item.student_info?.name || '未知'}`);
          continue;
        }

        const studentId = String(student_info.id);

        // 3.1 插入/更新学生 (代码保持原样...)
        const existingStudent = db.prepare('SELECT id FROM students WHERE id = ?').get(studentId) as any;
        if (existingStudent) {
          db.prepare(`UPDATE students SET name = ?, class = ?, report_id = ?, gender = ?, class_order = ?, student_status = ? WHERE id = ?`)
            .run(student_info.name, student_info.class, student_info.report_id, student_info.gender, student_info.class_order, student_info.student_status, studentId);
        } else {
          db.prepare(`INSERT INTO students (id, name, class, report_id, gender, class_order, student_status) VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .run(studentId, student_info.name, student_info.class, student_info.report_id, student_info.gender, student_info.class_order, student_info.student_status);
        }

        // 3.2 清理旧数据
        const existingResult = db.prepare('SELECT id FROM exam_results WHERE student_id = ? AND exam_id = ?').get(studentId, examId) as any;
        if (existingResult) {
          db.prepare('DELETE FROM subject_scores WHERE result_id = ?').run(existingResult.id);
          db.prepare('DELETE FROM exam_results WHERE id = ?').run(existingResult.id);
        }

        // 3.3 计算该学生的总满分
        let totalFullScore = 0;
        const processedSubjects = (subjects || []).map((sub: any) => {
          const hasScore = sub.score !== null && sub.score !== undefined && sub.score !== '';
          const fullScore = (subjectMaxMap[sub.subject] || 0) > 100 ? 150 : 100;
          if (hasScore) {
            totalFullScore += fullScore;
          }
          return { ...sub, full_score: fullScore };
        });

        // 3.4 插入考试总成绩 (exam_results)
        const resultInfo = db.prepare(`
                    INSERT INTO exam_results (
                        student_id, exam_id, total_score, total_full_score,
                        grade_rank, class_rank, elective_rank,
                        other_total_score, other_total_grade_rank, other_total_class_rank,
                        missing_count, remarks, class_at_exam
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    studentId, 
                    examId, 
                    exam_result.total_score,
                    totalFullScore,
                    exam_result.grade_rank, 
                    exam_result.class_rank, 
                    exam_result.elective_rank,
                    exam_result.other_total_score, 
                    exam_result.other_total_grade_rank, 
                    exam_result.other_total_class_rank,
                    exam_result.missing_count, 
                    exam_result.remarks, 
                    student_info.class
                );
        const resultId = resultInfo.lastInsertRowid;

        // 3.5 插入单科详细成绩 (subject_scores)
        if (processedSubjects.length > 0) {
          const insertScore = db.prepare(`
                        INSERT INTO subject_scores (
                            result_id, subject, score, full_score,
                            grade_rank, class_rank,
                            scaled_score, arts_science_rank
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `);

          for (const sub of processedSubjects) {
            insertScore.run(
              resultId, 
              sub.subject, 
              sub.score,
              sub.full_score,
              sub.grade_rank, 
              sub.class_rank,
              sub.scaled_score, 
              sub.arts_science_rank
            );
          }
        }
      }
    });

    transaction();
    console.log(`考试数据导入完成: ${examName}`);
  },

};
