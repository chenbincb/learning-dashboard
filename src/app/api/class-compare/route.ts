import { NextResponse } from 'next/server';
import { ClassCompareService } from '@/services/classCompareService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const examId = searchParams.get('examId');

    if (!studentId || !examId) {
        return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    try {
        const comparison = ClassCompareService.getStudentComparison(studentId, parseInt(examId));
        return NextResponse.json(comparison);
    } catch (error) {
        console.error('Class Compare API Error:', error);
        return NextResponse.json({ error: '获取对比数据失败' }, { status: 500 });
    }
}
