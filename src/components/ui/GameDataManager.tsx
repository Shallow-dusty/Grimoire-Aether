/**
 * 游戏数据管理组件
 *
 * 提供游戏状态的导出、导入和恢复功能
 */

import { useState, useRef, useCallback } from 'react';
import {
    exportGameState,
    importGameState,
    getSavedStateInfo,
    clearGameState,
    hasSavedState
} from '../../utils/statePersistence';
import type { GameState } from '../../types/game';

interface GameDataManagerProps {
    /** 当前游戏状态 */
    currentState: GameState | null;
    /** 恢复状态回调 */
    onRestore: (state: GameState) => void;
    /** 是否显示恢复按钮 */
    showRestorePrompt?: boolean;
}

export function GameDataManager({
    currentState,
    onRestore,
    showRestorePrompt = true
}: GameDataManagerProps) {
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 获取保存状态信息
    const savedInfo = getSavedStateInfo();

    // 导出当前状态
    const handleExport = useCallback(() => {
        if (!currentState) return;
        exportGameState(currentState);
    }, [currentState]);

    // 触发文件选择
    const handleImportClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    // 处理文件导入
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportError(null);

        try {
            const state = await importGameState(file);
            if (state) {
                onRestore(state);
            } else {
                setImportError('导入失败：文件格式无效');
            }
        } catch (error) {
            setImportError('导入失败：读取文件时出错');
        } finally {
            setIsImporting(false);
            // 清除文件选择，允许再次选择同一文件
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [onRestore]);

    // 清除保存的状态
    const handleClear = useCallback(() => {
        clearGameState();
        setShowConfirmClear(false);
    }, []);

    // 格式化时间
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-4">
            {/* 恢复提示 */}
            {showRestorePrompt && savedInfo?.exists && savedInfo.timestamp && (
                <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm text-blue-200">
                                发现未完成的游戏
                            </p>
                            <p className="text-xs text-blue-300 mt-1">
                                保存于 {formatTime(savedInfo.timestamp)} · 第 {savedInfo.day} 天
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-2">
                {/* 导出按钮 */}
                <button
                    onClick={handleExport}
                    disabled={!currentState}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        currentState
                            ? 'bg-slate-700 hover:bg-slate-600 text-white'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                    title="导出游戏状态到文件"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    导出
                </button>

                {/* 导入按钮 */}
                <button
                    onClick={handleImportClick}
                    disabled={isImporting}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
                    title="从文件导入游戏状态"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {isImporting ? '导入中...' : '导入'}
                </button>

                {/* 隐藏的文件输入 */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* 清除按钮 */}
                {hasSavedState() && (
                    <button
                        onClick={() => setShowConfirmClear(true)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-md transition-colors"
                        title="清除保存的游戏状态"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        清除
                    </button>
                )}
            </div>

            {/* 导入错误提示 */}
            {importError && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-md">
                    <p className="text-sm text-red-300">{importError}</p>
                </div>
            )}

            {/* 清除确认对话框 */}
            {showConfirmClear && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-lg shadow-xl p-6 max-w-sm">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            确认清除？
                        </h3>
                        <p className="text-sm text-slate-300 mb-4">
                            这将删除浏览器中保存的游戏状态，此操作无法撤销。
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmClear(false)}
                                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleClear}
                                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                            >
                                确认清除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// 快速操作按钮组件
// ============================================================

interface QuickSaveButtonProps {
    onSave: () => void;
    isSaving?: boolean;
}

export function QuickSaveButton({ onSave, isSaving }: QuickSaveButtonProps) {
    return (
        <button
            onClick={onSave}
            disabled={isSaving}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="保存游戏"
        >
            {isSaving ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
            )}
        </button>
    );
}
