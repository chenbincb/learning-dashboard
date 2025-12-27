const Database = require('better-sqlite3');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/scores.db');
const examsDir = path.join(__dirname, '../../历次成绩');

// 字段映射配置 (Excel 字段名 -> 数据库字段名)
const STUDENT_FIELDS = {
    '姓名': 'name',
    '考号': 'id',
    '报到号\t': 'report_id',
    '性别': 'gender',
    '班级': 'class',
    '班序\t': 'class_order',
    '学籍': 'student_status'
};

const RESULT_FIELDS = {
    '总分\t': 'total_score',
    '总分年名\t\t': 'grade_rank',
    '总分班名': 'class_rank',
    '选科名次\t': 'elective_rank',
    '其他总分': 'other_total_score',
    '其他总分年名': 'other_total_grade_rank',
    '其他总分班名': 'other_total_class_rank',
    '缺考门次': 'missing_count',
    '备注': 'remarks'
};

const SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];

function importExams() {
    const db = new Database(dbPath);
    const files = fs.readdirSync(examsDir).filter(f => f.endsWith('.xlsx'));

    console.log(`发现 ${files.length} 个考试文件`);

    const insertStudent = db.prepare(`
        INSERT OR REPLACE INTO students (id, report_id, name, gender, class, class_order, student_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertExam = db.prepare(`
        INSERT OR IGNORE INTO exams (name, date, type) VALUES (?, ?, ?)
    `);

    const getExamId = db.prepare(`SELECT id FROM exams WHERE name = ?`);

    const insertResult = db.prepare(`
        INSERT OR REPLACE INTO exam_results (
            exam_id, student_id, total_score, grade_rank, class_rank, 
            elective_rank, other_total_score, other_total_grade_rank, 
            other_total_class_rank, missing_count, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertSubjectScore = db.prepare(`
        INSERT OR REPLACE INTO subject_scores (
            result_id, subject, score, grade_rank, class_rank, arts_science_rank, scaled_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const file of files) {
        const examName = file.replace('.xlsx', '');
        console.log(`正在导入考试: ${examName}`);

        // 1. 插入考试信息
        insertExam.run(examName, null, examName.includes('期中') ? '期中' : (examName.includes('期末') ? '期末' : '月考'));
        const examId = getExamId.get(examName).id;

        // 2. 读取 Excel
        const workbook = xlsx.readFile(path.join(examsDir, file));
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        db.transaction(() => {
            for (const row of data) {
                const studentId = String(row['考号'] || row['考籍号\t'] || '');
                if (!studentId) continue;

                // 3. 插入学生信息
                insertStudent.run(
                    studentId,
                    String(row['报到号\t'] || ''),
                    row['姓名'],
                    row['性别'],
                    row['班级'],
                    row['班序\t'],
                    row['学籍']
                );

                // 4. 插入考试结果主表
                const result = insertResult.run(
                    examId,
                    studentId,
                    row['总分\t'],
                    row['总分年名\t\t'],
                    row['总分班名'],
                    row['选科名次\t'],
                    row['其他总分'],
                    row['其他总分年名'],
                    row['其他总分班名'],
                    row['缺考门次'],
                    row['备注']
                );
                const resultId = result.lastInsertRowid;

                // 5. 插入科目成绩
                for (const sub of SUBJECTS) {
                    if (row[sub] !== undefined) {
                        insertSubjectScore.run(
                            resultId,
                            sub,
                            row[sub],
                            row[`${sub}年名`],
                            row[`${sub}班名`],
                            row[`${sub}文理名次`],
                            row[`${sub}赋分`]
                        );
                    }
                }
            }
        })();
        console.log(`✅ ${examName} 导入完成`);
    }

    db.close();
}

if (require.main === module) {
    importExams();
}

module.exports = importExams;
