import { NextResponse } from 'next/server';
import { ImportService } from '@/services/importService';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { examName, examDate, data } = body;

        if (!examName || !data || !Array.isArray(data)) {
            return NextResponse.json({ error: '无效的数据格式' }, { status: 400 });
        }

        try {
            // 1. 备份数据库
            ImportService.backupDatabase();

            // 2. 执行导入
            ImportService.importExamData(examName, examDate, data);

            return NextResponse.json({ success: true, message: `成功导入考试: ${examName}` });
        } catch (err: any) {
            console.error('Import Service Error:', err);
            return NextResponse.json({ error: `处理失败: ${err.message}` }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Import API Error:', error);
        return NextResponse.json({ error: `导入失败: ${error.message}` }, { status: 500 });
    }
}
