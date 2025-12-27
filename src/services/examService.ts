import { getDb } from '@/lib/db';

export interface Exam {
    id: number;
    name: string;
    date: string | null;
}

export const ExamService = {
    getAllExams: (): Exam[] => {
        const db = getDb();
        return db.prepare('SELECT * FROM exams ORDER BY date DESC').all() as Exam[];
    },

    getExamById: (id: string | number): Exam | undefined => {
        const db = getDb();
        return db.prepare('SELECT * FROM exams WHERE id = ?').get(id) as Exam | undefined;
    },

    // Check if exam exists by name
    getExamByName: (name: string): Exam | undefined => {
        const db = getDb();
        return db.prepare('SELECT * FROM exams WHERE name = ?').get(name) as Exam | undefined;
    },

    createExam: (name: string, date?: string): number | bigint => {
        const db = getDb();
        const info = db.prepare('INSERT INTO exams (name, date) VALUES (?, ?)').run(name, date || null);
        return info.lastInsertRowid;
    }
};
