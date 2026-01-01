import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini 3.0 (2026 Edition)
export const AI_MODELS = {
    FLASH: 'gemini-3-flash-preview',     // Ultra-fast, low latency (Preview)
    PRO: 'gemini-3-pro-preview',         // Reasoning & Complex tasks (Preview)
    IMAGE: 'gemini-3-pro-image-preview', // Text-to-Image Generation (Nano Banana Pro)
};

export class GeminiService {
    private apiKey: string;
    private baseUrl?: string;
    private genAI: GoogleGenerativeAI;

    /**
     * @param apiKey Google API Key
     * @param baseUrl (Optional) API Proxy URL
     */
    constructor(apiKey?: string, baseUrl?: string) {
        this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
        if (!this.apiKey) {
            console.warn("GeminiService initialized without API Key");
        }
        this.baseUrl = baseUrl;
        this.genAI = new GoogleGenerativeAI(this.apiKey);
    }

    /**
     * 通用文本诊断方法
     * @param modelType 模型偏好 ('FLASH' | 'PRO')
     * @param prompt 提示词
     * @param systemInstruction 系统预设角色
     * @returns 结构化的 JSON 对象
     */
    async diagnoseText(
        modelType: 'FLASH' | 'PRO',
        prompt: string,
        systemInstruction: string,
        responseSchema?: any // 可选的 JSON Schema
    ) {
        try {
            const modelName = modelType === 'PRO' ? AI_MODELS.PRO : AI_MODELS.FLASH;

            const model = this.genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemInstruction,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                }
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // 尝试解析 JSON
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error("JSON Parse Error:", text);
                return { error: "AI response was not valid JSON", raw: text };
            }

        } catch (error) {
            console.error("Gemini API Error:", error);
            throw error;
        }
    }

    /**
     * 生成高保真图像 (Nano Banana)
     * @param prompt 图像描述提示词
     * @returns Base64 Image string or URL
     */
    async generateImage(prompt: string): Promise<string | null> {
        try {
            const model = this.genAI.getGenerativeModel({
                model: AI_MODELS.IMAGE
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;

            // 检查 candidates 中的 inlineData
            if (response.candidates && response.candidates.length > 0) {
                const parts = response.candidates[0].content.parts;
                for (const part of parts) {
                    if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }

            return null;
        } catch (e) {
            console.error("Gemini Image Gen Failed:", e);
            throw e;
        }
    }
}
