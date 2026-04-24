
import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIProvider = 'GEMINI' | 'OPENAI_COMPATIBLE';

export interface AIServiceConfig {
    provider: AIProvider;
    apiKey: string;
    baseUrl?: string;
    modelName?: string;
}

export class AIServiceAdapter {
    private config: AIServiceConfig;

    constructor(config: AIServiceConfig) {
        this.config = config;
    }

    async chat(prompt: string, systemInstruction: string, responseSchema?: any) {
        if (this.config.provider === 'GEMINI') {
            return this.callGemini(prompt, systemInstruction, responseSchema);
        } else {
            return this.callOpenAICompatible(prompt, systemInstruction);
        }
    }

    private async callGemini(prompt: string, systemInstruction: string, responseSchema?: any) {
        const genAI = new GoogleGenerativeAI(this.config.apiKey);
        const model = genAI.getGenerativeModel({
            model: this.config.modelName || 'gemini-3-flash-preview',
            systemInstruction: systemInstruction,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return JSON.parse(text);
    }

    private async callOpenAICompatible(prompt: string, systemInstruction: string, responseSchema?: any) {
        const url = `${this.config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
        
        // 如果有 Schema，将其转化为对 JSON 格式的显式要求
        let enhancedSystemPrompt = systemInstruction + "\nIMPORTANT: You must output ONLY valid JSON.";
        if (responseSchema) {
            enhancedSystemPrompt += `\nYour JSON response must match this schema structure: ${JSON.stringify(responseSchema)}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.modelName || 'gpt-4o',
                messages: [
                    { role: 'system', content: enhancedSystemPrompt },
                    { role: 'user', content: prompt }
                ]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`AI Provider Error (${response.status}): ${err}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
            // 尝试直接解析
            return JSON.parse(content);
        } catch (e) {
            // 如果解析失败，尝试用正则提取第一个 { ... } 块
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (e2) {
                    throw new Error("Failed to parse AI response as JSON even after extraction");
                }
            }
            throw new Error("AI response did not contain valid JSON content");
        }
    }

    // 图像生成目前依然主要支持 Gemini (因为 OpenAI DALL-E 协议不同)
    async generateImage(prompt: string): Promise<string | null> {
        if (this.config.provider !== 'GEMINI') {
            return null; // 目前非 Gemini 暂不支持生图
        }
        const genAI = new GoogleGenerativeAI(this.config.apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-image-preview' });
        const result = await model.generateContent(prompt);
        const parts = result.response.candidates?.[0].content.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    }
}
