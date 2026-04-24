import { NextRequest, NextResponse } from 'next/server';
import { AIServiceAdapter, AIProvider } from '@/lib/aiAdapter';
import { SchemaType } from '@google/generative-ai';
import { getDb } from '@/lib/db';

// 定义接口请求体
interface DiagnoseRequest {
    apiKey: string;
    baseUrl?: string;
    provider?: AIProvider;
    modelName?: string;
    model: 'FLASH' | 'PRO';
    intent: 'OVERVIEW' | 'SUBJECT_DEEP_DIVE' | 'STRATEGY';
    context: any; // 前端传来的数据 payload
    studentId?: string;
    examId?: number;
    forceRefresh?: boolean;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const examId = searchParams.get('examId');

    if (!studentId || !examId) {
        return NextResponse.json({ error: 'Missing studentId or examId' }, { status: 400 });
    }

    try {
        const db = getDb();
        const results = db.prepare(`
            SELECT intent FROM ai_diagnoses 
            WHERE student_id = ? AND exam_id = ?
        `).all(studentId, examId) as { intent: string }[];

        return NextResponse.json(results.map(r => r.intent));
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as DiagnoseRequest;
        console.log('[Diagnose] Received Body:', { ...body, apiKey: '***' });

        const { 
            apiKey, 
            baseUrl, 
            provider = 'GEMINI', 
            modelName: inputModelName, 
            model, 
            intent, 
            context,
            studentId,
            examId,
            forceRefresh = false
        } = body;

        const db = getDb();
        const queryStudentId = String(studentId || '');
        const queryExamId = Number(examId || 0);

        console.log(`[Diagnose] Params: provider=${provider} student=${queryStudentId} exam=${queryExamId} intent=${intent} refresh=${forceRefresh}`);

        if (!forceRefresh && studentId && examId) {
            console.log('[Diagnose] Checking Cache...');
            const cached = db.prepare(`
                SELECT result 
                FROM ai_diagnoses 
                WHERE student_id = ? AND exam_id = ? AND intent = ? AND model = ?
            `).get(queryStudentId, queryExamId, intent, model) as { result: string };

            if (cached) {
                console.log(`[Cache Hit] Serving cached diagnosis for ${studentId} - ${intent}`);
                try {
                    return NextResponse.json(JSON.parse(cached.result));
                } catch (e) {
                    return NextResponse.json({ result: cached.result });
                }
            }
        }

        // 确定最终使用的模型 ID
        let finalModelName = inputModelName;
        if (provider === 'GEMINI') {
            finalModelName = inputModelName || (model === 'PRO' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview');
        } else if (!finalModelName) {
            finalModelName = 'gpt-4o';
        }

        console.log(`[Diagnose] Using Model: ${finalModelName} via ${provider}`);

        // 初始化通用 AI 适配器
        const adapter = new AIServiceAdapter({
            provider,
            apiKey: apiKey || process.env.GEMINI_API_KEY || '',
            baseUrl,
            modelName: finalModelName
        });

        // --- 核心增强：数据自组装 (Auto-Context) ---
        let finalContext = context;
        if (!finalContext && studentId && examId) {
            console.log(`[Diagnose] Auto-assembling context for student=${studentId} exam=${examId}`);
            // 查询本次考试成绩
            const examData = db.prepare(`
                SELECT * FROM student_exams 
                WHERE student_id = ? AND exam_id = ?
            `).get(studentId, examId) as any;

            if (examData) {
                // 查询该考试的所有科目分值
                const subjects = db.prepare(`
                    SELECT * FROM subject_results 
                    WHERE student_exam_id = ?
                `).all(examData.id) as any[];

                const totalScore = subjects.reduce((a, b) => a + (b.score || 0), 0);
                const totalFullScore = subjects.reduce((a, b) => a + (b.full_score || 0), 0);
                const classAvgTotal = subjects.reduce((a, b) => a + (b.class_avg || 0), 0);

                finalContext = {
                    current_exam: {
                        total_score: totalScore,
                        full_score: totalFullScore,
                        grade_rank: examData.grade_rank,
                        class_rank: examData.class_rank,
                        grade_total: 1200 // 模拟值
                    },
                    macro_environment: {
                        class_avg_total: Math.round(classAvgTotal)
                    },
                    subjects: subjects.map(s => ({
                        name: s.subject,
                        score: s.score,
                        full_score: s.full_score,
                        class_avg: s.class_avg,
                        grade_avg: s.grade_avg,
                        grade_rank: s.grade_rank
                    }))
                };
            }
        }

        // 1. 总评模式 (OVERVIEW)
        if (intent === 'OVERVIEW') {
            const systemPrompt = `
                你是一位拥有20年经验的高级升学规划师。你需要根据学生的考试数据，给出一句精辟、犀利但富有建设性的“总指挥官评语”。
                
                风格要求：
                1. 拒绝废话，直击核心。
                2. 它是给学生本人看的，要有人情味。
                3. 如果年级排名上升，必须肯定；如果下降，必须指出是因卷子难（看班均分）还是个人失误。
            `;

            const prompt = `
                分析数据：
                - 本次考试总表现：${finalContext.current_exam.total_score} / ${finalContext.current_exam.full_score} (得分率: ${Math.round(finalContext.current_exam.total_score / finalContext.current_exam.full_score * 100)}%)
                - 历史表现趋势：${JSON.stringify(finalContext.rank_trend || '暂无历史数据')}
                - 本次排名：${finalContext.current_exam.grade_rank}
                - 班级排名：${finalContext.current_exam.class_rank}
                - 班级平均分：${finalContext.macro_environment.class_avg_total}

                注意：历次考试的满分(full_score)可能不同，请优先参考“得分率”和“排名”的波动，而非绝对分数。

                请输出 JSON：
                {
                    "summary": "一句不超过120字的评语，需结合得分率和难度进行点评",
                    "trend_tag": "RISING_STAR" | "STABLE" | "SLIPPING" | "CRISIS",
                    "confidence_score": 0-100
                }
            `;

            const responseSchema = {
                type: SchemaType.OBJECT,
                properties: {
                    summary: { type: SchemaType.STRING },
                    trend_tag: { type: SchemaType.STRING, enum: ["RISING_STAR", "STABLE", "SLIPPING", "CRISIS"] },
                    confidence_score: { type: SchemaType.NUMBER },
                },
                required: ["summary", "trend_tag", "confidence_score"],
            };

            const result = await adapter.chat(prompt, systemPrompt, responseSchema);

            // 保存结果到数据库
            if (studentId && examId && !result.error) {
                const info = db.prepare(`
                    INSERT OR REPLACE INTO ai_diagnoses (student_id, exam_id, intent, model, result, created_at)
                    VALUES (?, ?, ?, ?, ?, datetime('now'))
                `).run(studentId, examId, intent, model, JSON.stringify(result));
                console.log(`[DB Insert] Saved diagnosis. Changes: ${info.changes}`);
            }

            return NextResponse.json(result);
        }

        // 2. 学科深潜模式 (SUBJECT_DEEP_DIVE)
        if (intent.startsWith('SUBJECT_DEEP_DIVE')) {
            const systemPrompt = `
                你是该学科的特级教师。根据学生的单科表现，诊断病灶。
                分析逻辑：
                1. 如果 得分 > 班均分 但 < 年级顶尖，说明基础好但压轴题弱。
                2. 如果 稳定性指数(标准差) 高，说明是“过山车”型，心态或不熟练。
                3. 必须给出 2 条具体的、可执行的建议。
            `;

            const prompt = `
                学科：${context.subject}
                本次表现：
                - 得分：${context.subject_metrics.score}
                - 班级平均分：${context.subject_metrics.class_avg}
                - 年级平均分 (难度系数)：${context.subject_metrics.grade_avg}
                
                对比环境：
                - 难度参考：该科目年级均分为 ${context.subject_metrics.grade_avg}，分值越高表示试卷越简单。
                - 班级位次：第 ${context.subject_metrics.class_rank} 名
                
                历史表现(含难度波动)：
                ${context.history?.map((h: any) => `- ${h.exam_name}: 得分 ${h.score}, 难度(均分) ${h.grade_avg}`).join('\n') || '无历史记录'}

                请结合以上背景，特别是试卷难度与得分的对比（识别学生是在简单卷表现更好还是难题更稳），进行深度诊断。

                请输出 JSON：
                {
                    "diagnosis": "一段约150字的深度诊断，需提及难度对表现的影响",
                    "root_cause": "FOUNDATION_WEAK" | "SKILL_ISSUE" | "MINDSET" | "EXAM_DIFFICULTY" | "INCONSISTENT_BY_DIFFICULTY",
                    "suggestions": ["建议1", "建议2"]
                }
            `;

            const responseSchema = {
                type: SchemaType.OBJECT,
                properties: {
                    diagnosis: { type: SchemaType.STRING },
                    root_cause: { type: SchemaType.STRING, enum: ["FOUNDATION_WEAK", "SKILL_ISSUE", "MINDSET", "EXAM_DIFFICULTY", "INCONSISTENT_BY_DIFFICULTY"] },
                    suggestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                },
                required: ["diagnosis", "root_cause", "suggestions"],
            };

            const result = await adapter.chat(prompt, systemPrompt, responseSchema);

            // 保存结果
            if (studentId && examId && !result.error) {
                const info = db.prepare(`
                    INSERT OR REPLACE INTO ai_diagnoses (student_id, exam_id, intent, model, result, created_at)
                    VALUES (?, ?, ?, ?, ?, datetime('now'))
                `).run(studentId, examId, intent, model, JSON.stringify(result));
                console.log(`[DB Insert] Saved DEEP_DIVE. Changes: ${info.changes}`);
            }

            return NextResponse.json(result);
        }

        // 3. 策略/图表模式 (STRATEGY)
        if (intent === 'STRATEGY') {
            // 第一步：利用 Gemini Pro 制定具体的提分计划
            const analysisSystemPrompt = `
                你是一位资深的教育规划专家。你需要根据学生的数据，制定一个“核心分析 + 关键弱点 + 行动清单”的战术分析。
                输出格式必须是 JSON，包含以下字段：
                - core_analysis: 核心战略分析 (一针见血，限40字以内)
                - key_weakness: 关键弱点 (具体知识点，限40字以内)
                - action_plan: 具体的行动清单 (条理清晰，限60字以内，纯文本)
            `;

            const analysisPrompt = `
                目标名次：${context.target_rank}
                目标总分：${context.target_total_score}
                
                当前成绩详情:
                总分: ${context.latest_performance.total_score} (年级排名: ${context.latest_performance.grade_rank}, 班级排名: ${context.latest_performance.class_rank})
                
                各科详细表现 (含历史趋势):
                ${context.latest_performance.subjects.map((s: any) => {
                const insight = context.historical_insights.find((hi: any) => hi.subject === s.subject);
                return `- ${s.subject}: ${s.score}分 (年级排名: ${s.grade_rank}, 班级排名: ${s.class_rank} | 年级平均: ${s.grade_avg}, 班级平均: ${s.class_avg} | 目标: ${s.target_score}) | 历史趋势: ${insight?.recent_trend || 'N/A'}, 历史平均: ${insight?.avg_score || 'N/A'}`;
            }).join('\n')}
                
                请结合历史趋势和分差，给出具有实战意义的战略分析。
                
                【关键要求】
                1. 拒绝废话：不要说“保持心态”、“多做练习”这种通用建议。
                2. 必须具体：指出具体需要提升的*知识板块*或*题型*。
                3. 结构化：
                   - "核心分析": 一针见血地指出当前最大的短板是什么。
                   - "关键弱点": 具体到学科或题型的痛点。
                   - "行动清单": 3-4 条具体的提分动作。
            `;

            const analysisSchema = {
                type: SchemaType.OBJECT,
                properties: {
                    core_analysis: { type: SchemaType.STRING },
                    key_weakness: { type: SchemaType.STRING },
                    action_plan: { type: SchemaType.STRING }
                },
                required: ["core_analysis", "key_weakness", "action_plan"]
            };

            const plan = await adapter.chat(analysisPrompt, analysisSystemPrompt, analysisSchema);

            if (plan.error) {
                return NextResponse.json({ error: 'Strategy analysis failed', details: plan.raw }, { status: 500 });
            }

            // 第二步：构建包含具体文字指令的 Imagen Prompt
            // 核心目标：直接进行文字排版
            const finalImagePrompt = `
                A professional "Educational Typography Poster" or "Study Note Layout" in Chinese.
                
                **NEGATIVE_PROMPT: CROWDED, MESSY, DISTORTED TEXT, BLURRED, PHOTOS, REALISTIC FACES, SCENERY, ABSTRACT ART.**
                
                Layout Requirement:
                - Divide the canvas into 3 clear sections (Top, Middle, Bottom or Left/Right).
                - Use BOXES or FRAMES to contain the text.
                - Decorate with simple stationery icons (pen, book, tape) but maintain WHITE SPACE.
                
                Mandatory Text Content to Render (Chinese Hanzi):
                Section 1 Title: "核心分析"
                Content 1: "${plan.core_analysis}"
                
                Section 2 Title: "关键弱点"
                Content 2: "${plan.key_weakness}"
                
                Section 3 Title: "行动清单"
                Content 3: "${plan.action_plan}"
                
                Visual Style:
                - Clean, legible High-Res Typography.
                - Hand-written font aesthetics or Bold Sans-serif.
                - Colors: White background with Indigo/Blue accents (matching the App Theme).
                - Look like a beautifully organized "Bullet Journal" page.
            `;

            const imageUrl = await adapter.generateImage(finalImagePrompt);

            if (imageUrl) {
                const result = {
                    image_url: imageUrl,
                    plan: plan // 同时也返回文字版计划供前端备用
                };
                // 保存结果
                if (studentId && examId) {
                    const info = db.prepare(`
                        INSERT OR REPLACE INTO ai_diagnoses (student_id, exam_id, intent, model, result, created_at)
                        VALUES (?, ?, ?, ?, ?, datetime('now'))
                    `).run(studentId, examId, intent, model, JSON.stringify(result));
                    console.log(`[DB Insert] Saved STRATEGY. Changes: ${info.changes}`);
                }
                return NextResponse.json(result);
            }

            return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
        }

        return NextResponse.json({ error: 'Invalid Intent' }, { status: 400 });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error.toString()
        }, { status: 500 });
    }
}
