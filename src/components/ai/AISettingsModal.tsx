import React, { useState, useEffect } from 'react';
import { Settings, Save, Key, Cpu, ShieldCheck, Globe } from 'lucide-react';
import { useAI } from '@/hooks/useAI';

interface AISettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
    const { apiKey, baseUrl: savedBaseUrl, provider: savedProvider, modelName: savedModelName, preferredModel, saveConfig } = useAI();
    const [inputKey, setInputKey] = useState('');
    const [inputBaseUrl, setInputBaseUrl] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<string>('GEMINI');
    const [inputModelName, setInputModelName] = useState('');
    const [selectedModel, setSelectedModel] = useState<string>('FLASH');

    // 同步 hook 状态到本地状态
    useEffect(() => {
        if (isOpen) {
            console.log('[AISettings] Syncing from Hook:', { apiKey, savedBaseUrl, savedProvider, savedModelName, preferredModel });
            setInputKey(apiKey || '');
            setInputBaseUrl(savedBaseUrl || '');
            setSelectedProvider(savedProvider || 'GEMINI');
            setInputModelName(savedModelName || '');
            setSelectedModel(preferredModel || 'FLASH');
        }
    }, [isOpen, apiKey, savedBaseUrl, savedProvider, savedModelName, preferredModel]);

    const handleSave = () => {
        console.log('[AISettings] Saving Config:', { inputKey, inputBaseUrl, selectedProvider, inputModelName, selectedModel });
        saveConfig(inputKey, inputBaseUrl, selectedProvider, inputModelName, selectedModel as any);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                    <div className="flex items-center gap-2 mb-1">
                        <Cpu className="w-6 h-6" />
                        <h2 className="text-xl font-bold">AI 智能中枢配置</h2>
                    </div>
                    <p className="text-indigo-100 text-sm">适配多模型驱动，开启深度学情诊断</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Provider Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            选择 AI 供应商
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setSelectedProvider('GEMINI')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${selectedProvider === 'GEMINI'
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="font-bold">Google Gemini</span>
                                <span className="text-[10px] opacity-70">原生 SDK 驱动</span>
                            </button>
                            <button
                                onClick={() => setSelectedProvider('OPENAI_COMPATIBLE')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${selectedProvider === 'OPENAI_COMPATIBLE'
                                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="font-bold text-center">OpenAI 兼容协议</span>
                                <span className="text-[10px] opacity-70">支持 DeepSeek / GPT 等</span>
                            </button>
                        </div>
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Key className="w-4 h-4 text-slate-400" />
                            API Key
                        </label>
                        <input
                            type="password"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 transition-all font-mono text-sm"
                        />
                    </div>

                    {selectedProvider === 'OPENAI_COMPATIBLE' && (
                        <>
                            {/* Base URL Input */}
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                    <Globe className="w-4 h-4 text-slate-400" />
                                    API Base URL
                                </label>
                                <input
                                    type="text"
                                    value={inputBaseUrl}
                                    onChange={(e) => setInputBaseUrl(e.target.value)}
                                    placeholder="https://api.deepseek.com/v1"
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 transition-all font-mono text-sm"
                                />
                            </div>

                            {/* Custom Model Name */}
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                    <Settings className="w-4 h-4 text-slate-400" />
                                    模型 ID (Model Name)
                                </label>
                                <input
                                    type="text"
                                    value={inputModelName}
                                    onChange={(e) => setInputModelName(e.target.value)}
                                    placeholder="deepseek-chat / gpt-4o"
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 transition-all font-mono text-sm"
                                />
                            </div>
                        </>
                    )}

                    {selectedProvider === 'GEMINI' && (
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Cpu className="w-4 h-4 text-slate-400" />
                                默认思考模型
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setSelectedModel('FLASH')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${selectedModel === 'FLASH'
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                >
                                    <span className="font-bold">🚀 Flash</span>
                                    <span className="text-[10px] opacity-70 text-center">极速响应</span>
                                </button>
                                <button
                                    onClick={() => setSelectedModel('PRO')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${selectedModel === 'PRO'
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                >
                                    <span className="font-bold text-center">🧠 Pro</span>
                                    <span className="text-[10px] opacity-70 text-center">深度推理</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        保存配置
                    </button>
                </div>
            </div>
        </div>
    );
}
