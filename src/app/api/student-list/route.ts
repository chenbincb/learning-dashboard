import { NextResponse } from 'next/server';
import { StudentService } from '@/services/studentService';

export async function GET(request: Request) {
    try {
        const students = StudentService.getAllStudents();
        return NextResponse.json(students);
    } catch (error) {
        console.error('API Students Error:', error);
        return NextResponse.json({ error: '获取学生列表失败', details: String(error) }, { status: 500 });
    }
}
