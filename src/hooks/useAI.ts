import { useState, useEffect } from 'react';

type AIModel = 'FLASH' | 'PRO' | 'IMAGE';

export function useAI() {
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [provider, setProvider] = useState<string>('GEMINI');
    const [modelName, setModelName] = useState('');
    const [preferredModel, setPreferredModel] = useState<AIModel>('FLASH');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 初始化时从 LocalStorage 读取配置
    useEffect(() => {
        const storedKey = localStorage.getItem('ai_api_key') || localStorage.getItem('gemini_api_key');
        const storedBaseUrl = localStorage.getItem('ai_base_url') || localStorage.getItem('gemini_base_url');
        const storedProvider = localStorage.getItem('ai_provider') || 'GEMINI';
        const storedModelName = localStorage.getItem('ai_model_name') || '';
        const storedModel = localStorage.getItem('gemini_model') as AIModel;

        if (storedKey) setApiKey(storedKey);
        if (storedBaseUrl) setBaseUrl(storedBaseUrl);
        setProvider(storedProvider);
        setModelName(storedModelName);
        if (storedModel) setPreferredModel(storedModel || 'FLASH');
    }, []);

    const saveConfig = (key: string, url: string, provider: string, modelName: string, model: AIModel) => {
        console.log('[useAI] Writing to LocalStorage:', { key, url, provider, modelName, model });
        localStorage.setItem('ai_api_key', key);
        localStorage.setItem('ai_base_url', url);
        localStorage.setItem('ai_provider', provider);
        localStorage.setItem('ai_model_name', modelName);
        localStorage.setItem('gemini_model', model);
        
        setApiKey(key);
        setBaseUrl(url);
        setProvider(provider);
        setModelName(modelName);
        setPreferredModel(model);
    };

    // 默认认为有 Key (由后端决定是否使用 Env Key)
    const hasKey = true;

    const diagnose = async (intent: 'OVERVIEW' | 'SUBJECT_DEEP_DIVE' | 'STRATEGY', context: any, options?: { overrideModel?: AIModel, studentId?: string, examId?: number, forceRefresh?: boolean }) => {
        setLoading(true);
        setError(null);

        try {
            // 实时从本地存储读取最新配置，防止 React 闭包导致旧值被发送
            const currentApiKey = localStorage.getItem('ai_api_key') || localStorage.getItem('gemini_api_key') || apiKey;
            const currentBaseUrl = localStorage.getItem('ai_base_url') || localStorage.getItem('gemini_base_url') || baseUrl;
            const currentProvider = localStorage.getItem('ai_provider') || provider || 'GEMINI';
            const currentModelName = localStorage.getItem('ai_model_name') || modelName || '';

            console.log('[useAI] Sending Request with Provider:', currentProvider, 'Model:', currentModelName);

            const res = await fetch('/api/diagnose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: currentApiKey,
                    baseUrl: currentBaseUrl,
                    provider: currentProvider,
                    modelName: currentModelName,
                    model: options?.overrideModel || preferredModel,
                    intent,
                    context,
                    studentId: options?.studentId,
                    examId: options?.examId,
                    forceRefresh: options?.forceRefresh
                })
            });

            if (!res.ok) {
                const resClone = res.clone();
                let errorMessage = 'Request failed';
                try {
                    const errData = await res.json();
                    errorMessage = errData.error || errorMessage;
                } catch (e) {
                    // 如果 json 解析失败，从克隆流读取 text
                    const textError = await resClone.text();
                    errorMessage = textError || `HTTP Error ${res.status}`;
                }

                if (res.status === 401) {
                    if (options?.forceRefresh) {
                        if (!apiKey) throw new Error('请先配置 API Key');
                        throw new Error(errorMessage);
                    }
                    return null;
                }
                throw new Error(errorMessage);
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

    const displayName = provider === 'GEMINI' 
        ? `Gemini ${preferredModel === 'PRO' ? 'Pro' : 'Flash'}` 
        : (modelName || 'AI 专家');

    return {
        apiKey,
        baseUrl,
        provider,
        modelName,
        displayName,
        preferredModel,
        hasKey,
        loading,
        error,
        saveConfig,
        diagnose
    };
}
