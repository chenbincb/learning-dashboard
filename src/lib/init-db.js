const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/scores.db');
const schemaPath = path.join(__dirname, 'schema.sql');

function initDb() {
    console.log('正在初始化数据库:', dbPath);

    // 确保数据目录存在
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = new Database(dbPath);
    const schema = fs.readFileSync(schemaPath, 'utf8');

    try {
        db.exec(schema);
        console.log('✅ 数据库初始化成功');
    } catch (err) {
        console.error('❌ 数据库初始化失败:', err);
    } finally {
        db.close();
    }
}

if (require.main === module) {
    initDb();
}

module.exports = initDb;
