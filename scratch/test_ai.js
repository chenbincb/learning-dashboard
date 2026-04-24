const fetch = require('node-fetch');

async function testDiagnose() {
    console.log('--- Testing OpenAI Compatible Mode (Qwen/DeepSeek) ---');
    const payload = {
        apiKey: 'sk-your-key', // 模拟 key
        baseUrl: 'https://api.openai.com/v1',
        provider: 'OPENAI_COMPATIBLE',
        modelName: 'gpt-4o',
        model: 'FLASH',
        intent: 'OVERVIEW',
        studentId: '666413546',
        examId: 5,
        forceRefresh: true,
        context: {
            rank_trend: [],
            current_exam: { grade_rank: 10, class_rank: 1 },
            macro_environment: { class_avg_total: 600 }
        }
    };

    try {
        const res = await fetch('http://localhost:3000/api/diagnose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Response:', text);
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

testDiagnose();
