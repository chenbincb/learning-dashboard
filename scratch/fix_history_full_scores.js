const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../data/scores.db');
const db = new Database(dbPath);

console.log('Opening database at:', dbPath);

const results = db.prepare('SELECT id FROM exam_results').all();
const updateStmt = db.prepare('UPDATE exam_results SET total_full_score = ? WHERE id = ?');
const subjectsStmt = db.prepare('SELECT subject, score FROM subject_scores WHERE result_id = ?');

let count = 0;
db.transaction(() => {
    for (const res of results) {
        const subjects = subjectsStmt.all(res.id);
        let totalFull = 0;
        
        // 我们需要先找出这场考试该科目的最高分，来判定是100还是150
        // 为了简单起见，这里先用 > 100 判定。如果更严谨，应该按考试分组统计。
        for (const s of subjects) {
            // 只有有分数的科目且不为 null 的才计入
            if (s.score !== null && s.score !== undefined && s.score !== '') {
                // 简单的判定逻辑：通常语数英是150，其他100。或者根据分数判断。
                let full = 100;
                if (['语文', '数学', '英语'].includes(s.subject)) {
                    full = 150;
                } else if (s.score > 100) {
                    full = 150;
                }
                totalFull += full;
            }
        }
        
        if (totalFull > 0) {
            updateStmt.run(totalFull, res.id);
            count++;
        }
    }
})();

console.log(`Successfully updated ${count} records with correct total_full_score.`);
