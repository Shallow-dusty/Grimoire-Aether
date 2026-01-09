/**
 * 游戏功能配置
 *
 * 集中管理所有可选功能的开关，便于调试和定制化
 */

export interface GameFeatureConfig {
    /** 时针投票模式 - 启用后投票按座位顺序进行 */
    clockwiseVoting: boolean;

    /** AI 辅助功能 - 启用后提供角色分配建议 */
    aiAssistant: boolean;

    /** 调试模式 - 启用后显示额外调试信息 */
    debugMode: boolean;

    /** 快速首夜 - 启用后自动跳过首夜无行动角色 */
    quickFirstNight: boolean;

    /** 自动保存 - 启用后游戏状态自动保存到本地存储 */
    autoSave: boolean;

    /** 声音效果 - 启用后播放游戏音效 */
    soundEffects: boolean;

    /** 动画效果 - 启用后显示过渡动画 */
    animations: boolean;

    /** 幽灵玩家可见 - 启用后幽灵可以看到其他玩家角色 */
    ghostsCanSeeRoles: boolean;

    /** 详细日志 - 启用后在历史记录中显示详细信息 */
    verboseHistory: boolean;

    /** 实时多人 - 启用 Supabase 实时同步 */
    realtimeSync: boolean;
}

/** 默认配置 */
export const DEFAULT_GAME_CONFIG: GameFeatureConfig = {
    clockwiseVoting: false,
    aiAssistant: false,
    debugMode: false,
    quickFirstNight: true,
    autoSave: true,
    soundEffects: true,
    animations: true,
    ghostsCanSeeRoles: false,
    verboseHistory: false,
    realtimeSync: false,
};

/** 开发模式配置 */
export const DEV_GAME_CONFIG: GameFeatureConfig = {
    ...DEFAULT_GAME_CONFIG,
    debugMode: true,
    verboseHistory: true,
    quickFirstNight: true,
};

/** 生产模式配置 */
export const PROD_GAME_CONFIG: GameFeatureConfig = {
    ...DEFAULT_GAME_CONFIG,
    debugMode: false,
    verboseHistory: false,
};

/**
 * 获取当前环境的配置
 */
export function getGameConfig(): GameFeatureConfig {
    const isDev = import.meta.env.DEV;
    const baseConfig = isDev ? DEV_GAME_CONFIG : PROD_GAME_CONFIG;

    // 从本地存储加载用户自定义配置
    try {
        const savedConfig = localStorage.getItem('grimoire-aether-config');
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig) as Partial<GameFeatureConfig>;
            return { ...baseConfig, ...parsed };
        }
    } catch {
        // 忽略解析错误
    }

    return baseConfig;
}

/**
 * 保存配置到本地存储
 */
export function saveGameConfig(config: Partial<GameFeatureConfig>): void {
    try {
        const currentConfig = getGameConfig();
        const newConfig = { ...currentConfig, ...config };
        localStorage.setItem('grimoire-aether-config', JSON.stringify(newConfig));
    } catch {
        // 忽略存储错误
    }
}

/**
 * 重置配置到默认值
 */
export function resetGameConfig(): void {
    try {
        localStorage.removeItem('grimoire-aether-config');
    } catch {
        // 忽略存储错误
    }
}

/**
 * 功能开关描述
 */
export const FEATURE_DESCRIPTIONS: Record<keyof GameFeatureConfig, string> = {
    clockwiseVoting: '按座位顺序依次投票，更接近实体游戏体验',
    aiAssistant: '提供角色分配建议和游戏策略提示',
    debugMode: '显示调试面板和额外的技术信息',
    quickFirstNight: '跳过首夜无行动的角色，加快游戏节奏',
    autoSave: '自动保存游戏进度到浏览器',
    soundEffects: '播放游戏事件音效',
    animations: '显示界面过渡动画',
    ghostsCanSeeRoles: '死亡玩家可以查看所有存活玩家的角色',
    verboseHistory: '在游戏历史中记录详细的事件信息',
    realtimeSync: '启用实时多人同步功能',
};

/**
 * 功能开关标签
 */
export const FEATURE_LABELS: Record<keyof GameFeatureConfig, string> = {
    clockwiseVoting: '时针投票',
    aiAssistant: 'AI 辅助',
    debugMode: '调试模式',
    quickFirstNight: '快速首夜',
    autoSave: '自动保存',
    soundEffects: '音效',
    animations: '动画效果',
    ghostsCanSeeRoles: '幽灵可见角色',
    verboseHistory: '详细日志',
    realtimeSync: '实时同步',
};
