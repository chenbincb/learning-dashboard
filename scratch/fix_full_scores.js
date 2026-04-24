const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/scores.db');
const db = new Database(dbPath);

console.log('--- Starting Full Score Migration ---');

try {
    // 1. 检查并增加字段
    try {
        db.prepare('ALTER TABLE subject_scores ADD COLUMN full_score REAL').run();
        console.log('Added full_score to subject_scores');
    } catch (e) { console.log('subject_scores.full_score already exists'); }

    try {
        db.prepare('ALTER TABLE exam_results ADD COLUMN total_full_score REAL').run();
        console.log('Added total_full_score to exam_results');
    } catch (e) { console.log('exam_results.total_full_score already exists'); }

    // 2. 遍历所有考试，判定单科满分
    const exams = db.prepare('SELECT id FROM exams').all();
    
    for (const exam of exams) {
        console.log(`Processing Exam ID: ${exam.id}`);
        
        // 查找该考试各科的最高分
        const subjectMaxes = db.prepare(`
            SELECT ss.subject, MAX(ss.score) as max_score
            FROM subject_scores ss
            JOIN exam_results er ON ss.result_id = er.id
            WHERE er.exam_id = ?
            GROUP BY ss.subject
        `).all(exam.id);

        const subjectFullScores = {};
        for (const s of subjectMaxes) {
            // 逻辑：如果最高分 > 100，则满分为 150；否则 100
            // 特殊逻辑：语数英通常 150，但以最高分为准更鲁棒
            const fullScore = s.max_score > 100 ? 150 : 100;
            subjectFullScores[s.subject] = fullScore;
            
            // 更新该考试下所有该科目的 full_score
            db.prepare(`
                UPDATE subject_scores
                SET full_score = ?
                WHERE subject = ? AND result_id IN (
                    SELECT id FROM exam_results WHERE exam_id = ?
                )
            `).run(fullScore, s.subject, exam.id);
        }

        // 3. 计算每个学生的总满分
        const studentResults = db.prepare('SELECT id FROM exam_results WHERE exam_id = ?').all(exam.id);
        for (const res of studentResults) {
            const studentSubjects = db.prepare('SELECT subject FROM subject_scores WHERE result_id = ?').all(res.id);
            let totalFull = 0;
            for (const sub of studentSubjects) {
                totalFull += (subjectFullScores[sub.subject] || 100);
            }
            
            db.prepare('UPDATE exam_results SET total_full_score = ? WHERE id = ?').run(totalFull, res.id);
        }
    }

    console.log('--- Migration Completed Successfully ---');
} catch (error) {
    console.error('Migration Failed:', error);
} finally {
    db.close();
}
