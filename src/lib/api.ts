export interface Student {
    id: string;
    name: string;
    class: string;
    class_order?: number;
}

export interface Exam {
    exam_id: number;
    name: string;
    date: string | null;
    total_score?: number;
}

export interface SubjectScore {
    subject: string;
    score: number;
    grade_rank: number;
    class_rank: number;
    grade_avg?: number;
    class_avg?: number;
}

export interface ExamResult {
    id: number;
    exam_id: number;
    student_id: string;
    total_score: number;
    grade_rank: number;
    class_rank: number;
    exam_name: string;
    date: string;
    student_name: string;
    subjects: SubjectScore[];
}

export interface StudentScoreData {
    latest: ExamResult;
    prevSubjects: SubjectScore[];
    trend: any[]; // Consider defining a stricter type for trend
    exams: Exam[];
    targetData?: {
        targetRank: number;
        total_score: number;
        subjects: Record<string, number>;
    };
}

export interface LeaderboardItem {
    id: string;
    name: string;
    class: string;
    score: number;
    rank: number;
    class_rank: number;
}

export interface ImportDataPayload {
    examName: string;
    examDate: string | null;
    data: any[];
}

export const API = {
    fetchStudentList: async (): Promise<Student[]> => {
        const res = await fetch('/api/student-list');
        if (!res.ok) throw new Error('Failed to fetch student list');
        return res.json();
    },

    fetchStudentScores: async (studentId: string, examId?: string | null, targetRank: number = 200): Promise<StudentScoreData> => {
        const url = `/api/scores?studentId=${studentId}&targetRank=${targetRank}${examId ? `&examId=${examId}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch student scores');
        return res.json();
    },

    fetchLeaderboard: async (examId: string, subject: string = '总分'): Promise<LeaderboardItem[]> => {
        const url = `/api/leaderboard?examId=${examId}&subject=${encodeURIComponent(subject)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        return res.json();
    },

    importExamData: async (payload: ImportDataPayload) => {
        const res = await fetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Import failed');
        return result;
    }
};
