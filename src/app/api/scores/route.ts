import { NextResponse } from 'next/server';
import { ScoreService } from '@/services/scoreService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || '66641354';
    const examId = searchParams.get('examId');

    try {
        const latestExam = ScoreService.getStudentExamResult(studentId, examId || undefined);

        if (!latestExam) {
            return NextResponse.json({ error: '未找到成绩数据' }, { status: 404 });
        }

        const trend = ScoreService.getStudentTrend(studentId);
        const exams = ScoreService.getStudentExams(studentId);

        // 获取上一场考试数据用于对比
        const prevSubjects = ScoreService.getPreviousSubjects(
            studentId,
            latestExam.date,
            latestExam.exam_id
        );

        // 获取目标排名对标数据 (科学评估算法)
        const targetRank = parseInt(searchParams.get('targetRank') || '200');
        const targetData = ScoreService.getTargetReferenceData(latestExam.exam_id, targetRank);

        return NextResponse.json({
            latest: latestExam,
            prevSubjects,
            trend,
            exams,
            targetData
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
    }
}
