import { NextResponse } from 'next/server';
import { ClassCompareService } from '@/services/classCompareService';

export async function GET() {
    try {
        const rankings = ClassCompareService.getFormerClassmatesRankings();
        return NextResponse.json(rankings);
    } catch (error) {
        console.error('Former Classmates API Error:', error);
        return NextResponse.json({ error: '获取同窗数据失败' }, { status: 500 });
    }
}
