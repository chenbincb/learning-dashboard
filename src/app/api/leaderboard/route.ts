import { NextResponse } from 'next/server';
import { ScoreService } from '@/services/scoreService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const subject = searchParams.get('subject') || '总分';

    if (!examId) {
        return NextResponse.json({ error: '必须提供考试 ID' }, { status: 400 });
    }

    try {
        const rankings = ScoreService.getLeaderboard(examId, subject);
        return NextResponse.json(rankings);
    } catch (error) {
        console.error('Leaderboard API Error:', error);
        return NextResponse.json({ error: '获取排行榜失败' }, { status: 500 });
    }
}
