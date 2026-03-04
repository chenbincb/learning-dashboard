import { NextResponse } from 'next/server';
import { ScoreService } from '@/services/scoreService';

export async function GET() {
    try {
        const exams = ScoreService.getAllExams();
        return NextResponse.json(exams);
    } catch (error) {
        console.error('Exams API Error:', error);
        return NextResponse.json({ error: '获取考试列表失败' }, { status: 500 });
    }
}
