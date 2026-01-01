import { NextRequest, NextResponse } from 'next/server';
import { GeminiService, AI_MODELS } from '@/lib/gemini';
import { SchemaType } from '@google/generative-ai';
import { getDb } from '@/lib/db';

// 定义接口请求体
interface DiagnoseRequest {
    apiKey: string;
    baseUrl?: string;
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
        const { apiKey, baseUrl, model, intent, context } = body;

        const db = getDb();

        // 0. 检查缓存 (如果不是强制刷新)
        const forceRefresh = body.forceRefresh;
        const queryStudentId = String(body.studentId);
        const queryExamId = Number(body.examId);

        console.log(`[Diagnose] Request: student=${queryStudentId} exam=${queryExamId} intent=${intent} refresh=${forceRefresh}`);

        if (!forceRefresh && body.studentId && body.examId) {
            const cached = db.prepare(`
                SELECT result 
                FROM ai_diagnoses 
                WHERE student_id = ? AND exam_id = ? AND intent = ? AND model = ?
            `).get(queryStudentId, queryExamId, intent, model) as { result: string };

            if (cached) {
                console.log(`[Cache Hit] Serving cached diagnosis for ${body.studentId} - ${intent}`);
                // 尝试解析 JSON，如果失败（如图片URL字符串）直接返回字符串
                try {
                    return NextResponse.json(JSON.parse(cached.result));
                } catch (e) {
                    return NextResponse.json({ result: cached.result });
                }
            } else {
                console.log(`[Cache Miss] No cache found for ${body.studentId} - ${intent}`);
                // 注意：这里去掉了之前的早期返回 null 逻辑，改为允许继续执行 AI 调用
                // 这样如果没有缓存，就会自动触发 AI 生成，前提是 API Key 有效（或使用默认 Key）
            }
        }

        // 初始化 Gemini Service (apiKey 为空时将在 Service 内部 fallback 到环境变量)
        const gemini = new GeminiService(apiKey, baseUrl);

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
                - 年级排名趋势：${JSON.stringify(context.rank_trend)}
                - 本次排名：${context.current_exam.grade_rank} (全校${context.current_exam.grade_total || '未知'}人)
                - 班级排名：${context.current_exam.class_rank}
                - 试卷难度系数(班均分)：${context.macro_environment.class_avg_total}

                请输出 JSON：
                {
                    "summary": "一句不超过120字的评语",
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

            const result = await gemini.diagnoseText(model, prompt, systemPrompt, responseSchema);

            // 保存结果到数据库
            if (body.studentId && body.examId && !result.error) {
                const info = db.prepare(`
                    INSERT OR REPLACE INTO ai_diagnoses (student_id, exam_id, intent, model, result, created_at)
                    VALUES (?, ?, ?, ?, ?, datetime('now'))
                `).run(body.studentId, body.examId, intent, model, JSON.stringify(result));
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

            const result = await gemini.diagnoseText(model, prompt, systemPrompt, responseSchema);

            // 保存结果
            if (body.studentId && body.examId && !result.error) {
                const info = db.prepare(`
                    INSERT OR REPLACE INTO ai_diagnoses (student_id, exam_id, intent, model, result, created_at)
                    VALUES (?, ?, ?, ?, ?, datetime('now'))
                `).run(body.studentId, body.examId, intent, model, JSON.stringify(result));
                console.log(`[DB Insert] Saved DEEP_DIVE. Changes: ${info.changes}`);
            }

            return NextResponse.json(result);
        }

        // 3. 策略/图表模式 (STRATEGY)
        if (intent === 'STRATEGY') {
            // 第一步：利用 Gemini Pro 制定具体的提分计划
            const analysisSystemPrompt = `
                你是一位资深的教育规划专家。你需要根据学生的数据，制定一个分为三个阶段的提分计划。
                输出格式必须是 JSON，包含以下字段：
                - phase1: 基础建设期的核心目标和具体动作 (20字以内)
                - phase2: 专项突破期的核心目标和具体动作 (20字以内)
                - phase3: 考前冲刺期的核心目标和具体动作 (20字以内)
                - visual_description: 描述一个能体现这些计划的赛博朋克风格场景 (英文, 80字左右，用于图像生成)
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
                
                请结合历史趋势和分差，给出具有实战意义、分阶段的提分方案。
                注意：如果某科虽然当前分数低但处于“IMPROVING”趋势，请以鼓励和保持为主；如果是“DECLINING”或长期停滞，请作为核心突破点。
            `;

            const analysisSchema = {
                type: SchemaType.OBJECT,
                properties: {
                    phase1: { type: SchemaType.STRING },
                    phase2: { type: SchemaType.STRING },
                    phase3: { type: SchemaType.STRING },
                    visual_description: { type: SchemaType.STRING }
                },
                required: ["phase1", "phase2", "phase3", "visual_description"]
            };

            const plan = await gemini.diagnoseText('PRO', analysisPrompt, analysisSystemPrompt, analysisSchema);

            if (plan.error) {
                return NextResponse.json({ error: 'Strategy analysis failed', details: plan.raw }, { status: 500 });
            }

            // 第二步：构建包含具体文字指令的 Imagen Prompt
            const finalImagePrompt = `
                A high-quality academic "Score Improvement Roadmap" infographic. 
                Visual Scene: ${plan.visual_description}. NOT CYBERPUNK.
                Style: Clean, professional, minimal, flat design. White or light blue background.
                
                Mandatory Text Labels (Must be clearly readable in English or Chinese):
                1. "TARGET: TOP ${context.target_rank} | GAP: -${context.target_total_score - context.latest_performance.total_score}"
                2. "PHASE 1: ${plan.phase1}"
                3. "PHASE 2: ${plan.phase2}"
                4. "PHASE 3: ${plan.phase3}"
                
                Design: A clear path/ladder/bridge from "Current" to "Target". 
                Colors: Ocean blue, emerald green, and soft indigo. 
                Vibe: Inspiring, structured, clear, academic. 8k, sharp vector-like typography.
            `;

            const imageUrl = await gemini.generateImage(finalImagePrompt);

            if (imageUrl) {
                const result = {
                    image_url: imageUrl,
                    plan: plan // 同时也返回文字版计划供前端备用
                };
                // 保存结果
                if (body.studentId && body.examId) {
                    const info = db.prepare(`
                        INSERT OR REPLACE INTO ai_diagnoses (student_id, exam_id, intent, model, result, created_at)
                        VALUES (?, ?, ?, ?, ?, datetime('now'))
                    `).run(body.studentId, body.examId, intent, model, JSON.stringify(result));
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
