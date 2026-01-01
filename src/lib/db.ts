import path from 'path';
import fs from 'fs';

let dbInstance: any = null;

const getDbPath = () => {
    // 优先使用环境变量定义的 DB 路径
    if (process.env.DB_PATH) {
        return process.env.DB_PATH;
    }
    const relativePath = 'data/scores.db';
    return path.join(process.cwd(), relativePath);
};

export function getDb() {
    if (!dbInstance) {
        const dbPath = getDbPath();
        const dir = path.dirname(dbPath);

        try {
            if (!fs.existsSync(dir)) {
                console.log(`[DB] Creating missing directory: ${dir}`);
                fs.mkdirSync(dir, { recursive: true });
            }
        } catch (e) {
            console.error(`[DB] Failed to create directory ${dir}. Using memory DB fallback or causing fatal error. Error:`, e);
            // 这里我们不 Crash，而是抛出错误让上层处理，或者降级处理
        }

        try {
            // Lazy load better-sqlite3 to avoid top-level load crashes
            const Database = require('better-sqlite3');
            dbInstance = new Database(dbPath);
            dbInstance.pragma('foreign_keys = ON');
            console.log(`[DB] Database initialized at ${dbPath}`);
        } catch (e: any) {
            console.error("[DB] Failed to initialize SQLite:", e);
            throw new Error(`Database initialization failed: ${e.message}`);
        }
    }
    return dbInstance;
}

