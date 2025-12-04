/**
 * AI 客户端 - 2025年12月 最新版
 * 
 * 支持提供商：
 * - DeepSeek（V3.2 / R1）
 * - Kimi（K2 Thinking）
 * - SiliconFlow（硅基流动）
 * - OpenRouter
 * - OpenAI（o1 / o3-mini）
 * - Anthropic（Claude Sonnet 4）
 */

// ============================================================
// 类型
// ============================================================

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: ChatMessage;
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export type AIProvider =
    | 'deepseek'
    | 'kimi'
    | 'siliconflow'
    | 'openrouter'
    | 'openai'
    | 'anthropic';

export interface ChatOptions {
    model?: string;
    provider?: AIProvider;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}

// ============================================================
// API
// ============================================================

export async function sendMessage(
    messages: ChatMessage[],
    options?: ChatOptions
): Promise<ChatResponse> {
    const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, ...options })
    });

    const data = await response.json();
    if (!response.ok) throw new AIClientError(data.message || data.error, response.status, data);
    return data;
}

export async function chat(
    content: string,
    options?: ChatOptions & { systemPrompt?: string }
): Promise<string> {
    const messages: ChatMessage[] = [];
    if (options?.systemPrompt) messages.push({ role: 'system', content: options.systemPrompt });
    messages.push({ role: 'user', content });

    const response = await sendMessage(messages, options);
    return response.choices[0]?.message?.content || '';
}

export async function checkHealth() {
    const response = await fetch('/api/health');
    if (!response.ok) throw new AIClientError('Health check failed', response.status);
    return response.json();
}

export async function getProviders() {
    const response = await fetch('/api/ai/providers');
    if (!response.ok) throw new AIClientError('Failed to fetch', response.status);
    return response.json();
}

export class AIClientError extends Error {
    public status: number;
    public data?: unknown;

    constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.name = 'AIClientError';
        this.status = status;
        this.data = data;
    }
}

// ============================================================
// 会话
// ============================================================

export function createSession(options?: {
    systemPrompt?: string;
    provider?: AIProvider;
    model?: string;
}) {
    const history: ChatMessage[] = [];
    const opts: ChatOptions = { provider: options?.provider, model: options?.model };

    if (options?.systemPrompt) {
        history.push({ role: 'system', content: options.systemPrompt });
    }

    return {
        async send(content: string): Promise<string> {
            history.push({ role: 'user', content });
            const response = await sendMessage(history, opts);
            const reply = response.choices[0]?.message?.content || '';
            history.push({ role: 'assistant', content: reply });
            return reply;
        },
        getHistory: () => [...history],
        clear() {
            history.length = 0;
            if (options?.systemPrompt) history.push({ role: 'system', content: options.systemPrompt });
        },
        setProvider(p: AIProvider) { opts.provider = p; },
        setModel(m: string) { opts.model = m; }
    };
}

// ============================================================
// 提供商快捷方式 - 2025年12月最新模型
// ============================================================

/** DeepSeek - V3.2 / R1 */
export const deepseek = {
    chat: (content: string, systemPrompt?: string) =>
        chat(content, { provider: 'deepseek', systemPrompt }),

    reasoner: (content: string, systemPrompt?: string) =>
        chat(content, { provider: 'deepseek', model: 'deepseek-reasoner', systemPrompt }),

    session: (systemPrompt?: string) =>
        createSession({ provider: 'deepseek', systemPrompt }),

    models: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder'] as const
};

/** Kimi - K2 Thinking (256k 上下文) */
export const kimi = {
    chat: (content: string, systemPrompt?: string) =>
        chat(content, { provider: 'kimi', model: 'kimi-k2-thinking', systemPrompt }),

    fast: (content: string, systemPrompt?: string) =>
        chat(content, { provider: 'kimi', model: 'moonshot-v1-8k', systemPrompt }),

    session: (systemPrompt?: string) =>
        createSession({ provider: 'kimi', model: 'kimi-k2-thinking', systemPrompt }),

    models: ['kimi-k2-thinking', 'moonshot-v1-128k', 'moonshot-v1-32k', 'moonshot-v1-8k'] as const
};

/** 硅基流动 - 多模型聚合 */
export const siliconflow = {
    chat: (content: string, model: string, systemPrompt?: string) =>
        chat(content, { provider: 'siliconflow', model, systemPrompt }),

    deepseek: (content: string, systemPrompt?: string) =>
        chat(content, { provider: 'siliconflow', model: 'deepseek-ai/DeepSeek-V3', systemPrompt }),

    qwen: (content: string, systemPrompt?: string) =>
        chat(content, { provider: 'siliconflow', model: 'Qwen/Qwen2.5-72B-Instruct', systemPrompt }),

    free: (content: string, systemPrompt?: string) =>
        chat(content, { provider: 'siliconflow', model: 'Pro/Qwen/Qwen2.5-7B-Instruct', systemPrompt }),

    session: (model: string, systemPrompt?: string) =>
        createSession({ provider: 'siliconflow', model, systemPrompt }),

    models: [
        'deepseek-ai/DeepSeek-V3',
        'deepseek-ai/DeepSeek-R1',
        'Qwen/Qwen2.5-72B-Instruct',
        'Qwen/QwQ-32B',
        'Pro/Qwen/Qwen2.5-7B-Instruct'
    ] as const
};

/** OpenRouter */
export const openrouter = {
    chat: (content: string, model: string, systemPrompt?: string) =>
        chat(content, { provider: 'openrouter', model, systemPrompt }),

    session: (model: string, systemPrompt?: string) =>
        createSession({ provider: 'openrouter', model, systemPrompt }),

    models: [
        'anthropic/claude-3.5-sonnet',
        'openai/gpt-4o',
        'openai/o1',
        'google/gemini-2.0-flash',
        'deepseek/deepseek-r1'
    ] as const
};

/** OpenAI - GPT-4o / o1 / o3-mini */
export const openai = {
    chat: (content: string, systemPrompt?: string) =>
        chat(content, { provider: 'openai', model: 'gpt-4o', systemPrompt }),

    o1: (content: string, systemPrompt?: string) =>
        chat(content, { provider: 'openai', model: 'o1', systemPrompt }),

    o3mini: (content: string, systemPrompt?: string) =>
        chat(content, { provider: 'openai', model: 'o3-mini', systemPrompt }),

    session: (model = 'gpt-4o', systemPrompt?: string) =>
        createSession({ provider: 'openai', model, systemPrompt }),

    models: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'o3-mini'] as const
};

/** Anthropic - Claude Sonnet 4 */
export const anthropic = {
    chat: (content: string, systemPrompt?: string) =>
        chat(content, { provider: 'anthropic', model: 'claude-sonnet-4-20250514', systemPrompt }),

    sonnet35: (content: string, systemPrompt?: string) =>
        chat(content, { provider: 'anthropic', model: 'claude-3-5-sonnet-latest', systemPrompt }),

    session: (model = 'claude-sonnet-4-20250514', systemPrompt?: string) =>
        createSession({ provider: 'anthropic', model, systemPrompt }),

    models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'] as const
};
