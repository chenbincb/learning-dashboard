import { getDb } from '@/lib/db';

export interface Student {
    id: string;
    name: string;
    class: string;
    class_order?: number;
    former_class?: string;
}

export const StudentService = {
getAllStudents: (): Student[] => {
        const db = getDb();
        return db.prepare(`
            SELECT id, name, class, class_order, former_class 
            FROM students 
            ORDER BY class ASC, class_order ASC
        `).all() as Student[];
    }
};
