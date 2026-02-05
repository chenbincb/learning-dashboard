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
    const REAL_SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理', '技术'];

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
        const { student_name, class_name, total_score, subjects } = item;

        // --- 步骤 A: 构建 Map 以便快速查找 ---
        const subjectMap = new Map<string, number>();
        if (subjects && Array.isArray(subjects)) {
          subjects.forEach((s: any) => {
            // 统一转为数字存储，方便后续处理 (部分元数据可能是 0 或 float)
            subjectMap.set(s.subject, s.score);
          });
        }

        // --- 步骤 B: 提取学生基础信息 ---
        // 必须有考号
        let studentIdStr = subjectMap.has('考号') ? String(subjectMap.get('考号')).split('.')[0] : null;

        if (!studentIdStr) {
          console.warn(`Skipping student ${student_name}: Missing '考号'`);
          continue;
        }

        const reportId = subjectMap.has('报到号') ? String(subjectMap.get('报到号')).split('.')[0] : null;
        const gender = subjectMap.get('性别'); // 1 or 2
        const classOrder = subjectMap.get('班序');
        const studentStatus = subjectMap.get('学籍');

        // 2.1 插入/更新学生
        const existingStudent = db.prepare('SELECT id FROM students WHERE id = ?').get(studentIdStr) as any;

        if (existingStudent) {
          db.prepare(`
                        UPDATE students
                        SET name = ?, class = ?, report_id = ?, gender = ?, class_order = ?, student_status = ?
                        WHERE id = ?
                    `).run(student_name, class_name, reportId, gender, classOrder, studentStatus, studentIdStr);
        } else {
          db.prepare(`
                        INSERT INTO students (id, name, class, report_id, gender, class_order, student_status)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `).run(studentIdStr, student_name, class_name, reportId, gender, classOrder, studentStatus);
        }

        // --- 步骤 C: 提取考试结果元数据 (排名等) ---
        const gradeRank = subjectMap.get('总分年名');
        const classRank = subjectMap.get('总分班名');
        const electiveRank = subjectMap.get('选科名次');
        const otherTotal = subjectMap.get('其它总分');
        const otherGradeRank = subjectMap.get('其它总分年名');
        const otherClassRank = subjectMap.get('其它总分班名');
        const missingCount = subjectMap.get('缺考门次');
        const remarks = subjectMap.get('备注');

        // 2.2 插入考试结果
        db.prepare('DELETE FROM exam_results WHERE student_id = ? AND exam_id = ?').run(studentIdStr, examId);
        const resultInfo = db.prepare(`
                    INSERT INTO exam_results (
                        student_id, exam_id, total_score,
                        grade_rank, class_rank, elective_rank,
                        other_total_score, other_total_grade_rank, other_total_class_rank,
                        missing_count, remarks
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
          studentIdStr, examId, total_score,
          gradeRank, classRank, electiveRank,
          otherTotal, otherGradeRank, otherClassRank,
          missingCount, remarks
        );
        const resultId = resultInfo.lastInsertRowid;

        // --- 步骤 D: 提取并聚合科目成绩 ---
        for (const subName of REAL_SUBJECTS) {
          // 如果该学生没有这门课的成绩记录 (Map中不存在)，则跳过
          if (!subjectMap.has(subName)) continue;

          const score = subjectMap.get(subName);
          // 尝试查找对应的排名/赋分数据
          // 命名规则推测: "语文" -> "语文年名", "语文班名", "语文赋分", "语文文理名次"
          const subGradeRank = subjectMap.get(`${subName}年名`);
          const subClassRank = subjectMap.get(`${subName}班名`);
          const subScaledScore = subjectMap.get(`${subName}赋分`);
          const subArtsScienceRank = subjectMap.get(`${subName}文理名次`);

          db.prepare(`
                        INSERT INTO subject_scores (
                            result_id, subject, score,
                            grade_rank, class_rank,
                            scaled_score, arts_science_rank
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `).run(
            resultId, subName, score,
            subGradeRank, subClassRank,
            subScaledScore, subArtsScienceRank
          );
        }
      }
    });

    transaction();
    console.log(`Import completed for exam: ${examName}`);
  },
};
