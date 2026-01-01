import { useState, useEffect } from 'react';

type AIModel = 'FLASH' | 'PRO' | 'IMAGE';

export function useAI() {
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [preferredModel, setPreferredModel] = useState<AIModel>('FLASH');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 初始化时从 LocalStorage 读取配置
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        const storedBaseUrl = localStorage.getItem('gemini_base_url');
        const storedModel = localStorage.getItem('gemini_model') as AIModel;

        if (storedKey) setApiKey(storedKey);
        if (storedBaseUrl) setBaseUrl(storedBaseUrl);
        if (storedModel) setPreferredModel(storedModel);
    }, []);

    const saveConfig = (key: string, url: string, model: AIModel) => {
        localStorage.setItem('gemini_api_key', key);
        localStorage.setItem('gemini_base_url', url);
        localStorage.setItem('gemini_model', model);
        setApiKey(key);
        setBaseUrl(url);
        setPreferredModel(model);
    };

    // 默认认为有 Key (由后端决定是否使用 Env Key)
    // 这样可以让前端在没有输入 Key 的情况下也能尝试调用 AI
    const hasKey = true;

    const diagnose = async (intent: 'OVERVIEW' | 'SUBJECT_DEEP_DIVE' | 'STRATEGY', context: any, options?: { overrideModel?: AIModel, studentId?: string, examId?: number, forceRefresh?: boolean }) => {
        // 允许尝试调用 API (让后端决定是否拦截缺少 Key)
        // if (!apiKey) { ... } 移除拦截

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/diagnose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey, // 即使为空也传过去
                    baseUrl,
                    model: options?.overrideModel || preferredModel,
                    intent,
                    context,
                    studentId: options?.studentId,
                    examId: options?.examId,
                    forceRefresh: options?.forceRefresh
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                if (res.status === 401) {
                    // 如果是强制刷新（用户主动点击），则报错提示配置
                    if (options?.forceRefresh) {
                        if (!apiKey) throw new Error('请先配置 API Key');
                        throw new Error(errData.error || 'Unauthorized');
                    }
                    // 如果是自动检查缓存，401 意味着没 Key 且没缓存，静默失败即可
                    return null;
                }
                throw new Error(errData.error || 'Request failed');
            }

            const data = await res.json();
            return data;
        } catch (err: any) {
            setError(err.message);
            console.error('AI Diagnose Failed:', err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        apiKey,
        baseUrl,
        preferredModel,
        hasKey,
        loading,
        error,
        saveConfig,
        diagnose
    };
}
