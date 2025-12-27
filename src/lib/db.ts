import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/scores.db');

let db: Database.Database | null = null;

export function getDb() {
    if (!db) {
        db = new Database(dbPath);
        db.pragma('foreign_keys = ON');
    }
    return db;
}
