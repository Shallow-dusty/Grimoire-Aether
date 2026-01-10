/**
 * 游戏设置面板组件
 *
 * 提供游戏功能的配置界面
 */

import { useState, useEffect } from 'react';
import {
    getGameConfig,
    saveGameConfig,
    resetGameConfig,
    FEATURE_LABELS,
    FEATURE_DESCRIPTIONS,
    type GameFeatureConfig
} from '../../config/gameConfig';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
    const [config, setConfig] = useState<GameFeatureConfig>(getGameConfig());
    const [hasChanges, setHasChanges] = useState(false);

    // 同步配置
    useEffect(() => {
        if (isOpen) {
            setConfig(getGameConfig());
            setHasChanges(false);
        }
    }, [isOpen]);

    // 切换功能开关
    const handleToggle = (key: keyof GameFeatureConfig) => {
        const newConfig = { ...config, [key]: !config[key] };
        setConfig(newConfig);
        setHasChanges(true);
    };

    // 保存设置
    const handleSave = () => {
        saveGameConfig(config);
        setHasChanges(false);
        onClose();
    };

    // 重置设置
    const handleReset = () => {
        resetGameConfig();
        setConfig(getGameConfig());
        setHasChanges(true);
    };

    if (!isOpen) return null;

    // 功能分组
    const featureGroups = [
        {
            title: '游戏玩法',
            features: ['clockwiseVoting', 'quickFirstNight', 'ghostsCanSeeRoles'] as const
        },
        {
            title: 'AI 与辅助',
            features: ['aiAssistant', 'debugMode', 'verboseHistory'] as const
        },
        {
            title: '界面与体验',
            features: ['animations', 'soundEffects'] as const
        },
        {
            title: '数据与同步',
            features: ['autoSave', 'realtimeSync'] as const
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
                {/* 标题栏 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-white">游戏设置</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                        aria-label="关闭"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 设置内容 */}
                <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-140px)]">
                    {featureGroups.map((group) => (
                        <div key={group.title} className="mb-6">
                            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                                {group.title}
                            </h3>
                            <div className="space-y-3">
                                {group.features.map((featureKey) => (
                                    <FeatureToggle
                                        key={featureKey}
                                        featureKey={featureKey}
                                        label={FEATURE_LABELS[featureKey]}
                                        description={FEATURE_DESCRIPTIONS[featureKey]}
                                        enabled={config[featureKey]}
                                        onToggle={() => handleToggle(featureKey)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 底部按钮 */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/50">
                    <button
                        onClick={handleReset}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        恢复默认
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            className={`px-4 py-2 text-sm rounded-md transition-colors ${
                                hasChanges
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            保存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// 功能开关组件
// ============================================================

interface FeatureToggleProps {
    featureKey: string;
    label: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
}

function FeatureToggle({ featureKey, label, description, enabled, onToggle }: FeatureToggleProps) {
    return (
        <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
            <div className="flex-1">
                <label
                    htmlFor={`toggle-${featureKey}`}
                    className="text-sm font-medium text-white cursor-pointer"
                >
                    {label}
                </label>
                <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
            <button
                id={`toggle-${featureKey}`}
                role="switch"
                aria-checked={enabled}
                onClick={onToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabled ? 'bg-blue-600' : 'bg-slate-600'
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </button>
        </div>
    );
}

// ============================================================
// 设置按钮组件（用于触发打开设置面板）
// ============================================================

interface SettingsButtonProps {
    onClick: () => void;
    className?: string;
}

export function SettingsButton({ onClick, className = '' }: SettingsButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ${className}`}
            aria-label="打开设置"
            title="设置"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
            </svg>
        </button>
    );
}
