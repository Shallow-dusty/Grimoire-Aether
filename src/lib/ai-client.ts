/**
 * AI 客户端 - 与后端 AI 网关通信
 * 
 * 重要：此文件不包含任何 API 密钥
 * 所有敏感信息都在服务器端处理
 */

// 消息类型
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// AI 响应类型
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

// 错误响应类型
export interface AIError {
    error: string;
    message?: string;
    status?: number;
}

// 聊天请求参数
export interface ChatRequest {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}

/**
 * 发送消息到 AI
 * 
 * @param messages - 消息历史数组
 * @param options - 可选配置
 * @returns AI 响应
 * 
 * @example
 * ```ts
 * const response = await sendMessageToAI([
 *   { role: 'user', content: 'Hello!' }
 * ]);
 * console.log(response.choices[0].message.content);
 * ```
 */
export async function sendMessageToAI(
    messages: ChatMessage[],
    options?: Partial<Omit<ChatRequest, 'messages'>>
): Promise<ChatResponse> {
    const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages,
            ...options
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new AIClientError(
            data.message || data.error || 'Unknown error',
            response.status,
            data
        );
    }

    return data as ChatResponse;
}

/**
 * 发送简单文本消息
 * 
 * @param content - 用户消息内容
 * @param systemPrompt - 可选的系统提示
 * @returns AI 回复的文本
 * 
 * @example
 * ```ts
 * const reply = await chat('你好！');
 * console.log(reply); // "你好！有什么可以帮助你的吗？"
 * ```
 */
export async function chat(
    content: string,
    systemPrompt?: string
): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content });

    const response = await sendMessageToAI(messages);
    return response.choices[0]?.message?.content || '';
}

/**
 * 检查 AI 服务健康状态
 * 
 * @returns 健康检查结果
 */
export async function checkAIHealth(): Promise<{
    status: string;
    timestamp: string;
    hasApiKey: boolean;
}> {
    const response = await fetch('/api/health');

    if (!response.ok) {
        throw new AIClientError('Health check failed', response.status);
    }

    return response.json();
}

/**
 * 获取可用模型列表
 */
export async function getAvailableModels(): Promise<{
    data: Array<{ id: string; object: string }>;
}> {
    const response = await fetch('/api/ai/models');

    if (!response.ok) {
        throw new AIClientError('Failed to fetch models', response.status);
    }

    return response.json();
}

/**
 * AI 客户端错误类
 */
export class AIClientError extends Error {
    public status: number;
    public data?: AIError;

    constructor(message: string, status: number, data?: AIError) {
        super(message);
        this.name = 'AIClientError';
        this.status = status;
        this.data = data;
    }
}

/**
 * 创建带有上下文的聊天会话
 * 
 * @param systemPrompt - 系统提示词
 * @returns 会话对象
 * 
 * @example
 * ```ts
 * const session = createChatSession('你是一个游戏助手。');
 * const reply1 = await session.send('游戏规则是什么？');
 * const reply2 = await session.send('如何获胜？');
 * session.clear(); // 清除历史
 * ```
 */
export function createChatSession(systemPrompt?: string) {
    const history: ChatMessage[] = [];

    if (systemPrompt) {
        history.push({ role: 'system', content: systemPrompt });
    }

    return {
        /**
         * 发送消息并获取回复
         */
        async send(content: string): Promise<string> {
            history.push({ role: 'user', content });

            const response = await sendMessageToAI(history);
            const reply = response.choices[0]?.message?.content || '';

            history.push({ role: 'assistant', content: reply });

            return reply;
        },

        /**
         * 获取当前历史记录
         */
        getHistory(): ChatMessage[] {
            return [...history];
        },

        /**
         * 清除历史记录
         */
        clear(): void {
            history.length = 0;
            if (systemPrompt) {
                history.push({ role: 'system', content: systemPrompt });
            }
        },

        /**
         * 添加消息到历史（不发送）
         */
        addMessage(message: ChatMessage): void {
            history.push(message);
        }
    };
}
