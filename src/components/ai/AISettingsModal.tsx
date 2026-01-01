import React, { useState, useEffect } from 'react';
import { Settings, Save, Key, Cpu, ShieldCheck, Globe } from 'lucide-react';
import { useAI } from '@/hooks/useAI';

interface AISettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
    const { apiKey, preferredModel, baseUrl: savedBaseUrl, saveConfig } = useAI();
    const [inputKey, setInputKey] = useState('');
    const [inputBaseUrl, setInputBaseUrl] = useState('');
    const [selectedModel, setSelectedModel] = useState<string>('FLASH');

    // 同步 hook 状态到本地状态
    useEffect(() => {
        if (isOpen) {
            setInputKey(apiKey || '');
            setInputBaseUrl(savedBaseUrl || '');
            setSelectedModel(preferredModel || 'FLASH');
        }
    }, [isOpen, apiKey, savedBaseUrl, preferredModel]);

    const handleSave = () => {
        saveConfig(inputKey, inputBaseUrl, selectedModel as any);
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
                    <p className="text-indigo-100 text-sm">连接 Gemini 3 大脑，开启深度学情诊断</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* API Key Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Key className="w-4 h-4 text-slate-400" />
                            Google Gemini API Key
                        </label>
                        <input
                            type="password"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 transition-all font-mono text-sm"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            您的 Key 仅存储在本地浏览器。
                        </p>
                    </div>

                    {/* Base URL Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Globe className="w-4 h-4 text-slate-400" />
                            API Base URL (代理地址)
                        </label>
                        <input
                            type="text"
                            value={inputBaseUrl}
                            onChange={(e) => setInputBaseUrl(e.target.value)}
                            placeholder="https://generativelanguage.googleapis.com"
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 transition-all font-mono text-sm"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            选填。如果您在国内，请填入可用的 Gemini 代理地址。
                        </p>
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Cpu className="w-4 h-4 text-slate-400" />
                            默认思考模型
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setSelectedModel('FLASH')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${selectedModel === 'FLASH'
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="font-bold flex items-center gap-1">
                                    🚀 Flash
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded">免费</span>
                                </div>
                                <span className="text-xs opacity-70">极速响应，实时互动</span>
                            </button>

                            <button
                                onClick={() => setSelectedModel('PRO')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${selectedModel === 'PRO'
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="font-bold flex items-center gap-1">
                                    🧠 Pro
                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1 rounded">深度</span>
                                </div>
                                <span className="text-xs opacity-70">深度推理，专家诊断</span>
                            </button>
                        </div>
                    </div>
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
