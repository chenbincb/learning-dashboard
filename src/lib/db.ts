import Database from 'better-sqlite3';
import path from 'path';

import fs from 'fs';

const getDbPath = () => {
    const relativePath = 'data/scores.db';
    let currentPath = path.join(process.cwd(), relativePath);

    // 如果当前路径不存在，尝试向上级查找 (适配某些部署环境)
    if (!fs.existsSync(currentPath)) {
        const parentPath = path.join(process.cwd(), '..', relativePath);
        if (fs.existsSync(parentPath)) {
            return parentPath;
        }
    }
    return currentPath;
};

const dbPath = getDbPath();

let db: Database.Database | null = null;

export function getDb() {
    if (!db) {
        db = new Database(dbPath);
        db.pragma('foreign_keys = ON');
    }
    return db;
}
