import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'

// ============================================================
// 类型定义 - 2025年12月最新
// ============================================================

type Bindings = {
    // 各提供商独立 Key
    DEEPSEEK_API_KEY?: string
    KIMI_API_KEY?: string           // Moonshot AI / Kimi
    SILICONFLOW_API_KEY?: string    // 硅基流动
    OPENROUTER_API_KEY?: string
    OPENAI_API_KEY?: string
    ANTHROPIC_API_KEY?: string

    // 旧版兼容
    LLM_API_KEY?: string
}

interface ProviderConfig {
    name: string
    url: string
    models: string[]
    keyEnvs: (keyof Bindings)[]
    headers?: (apiKey: string) => Record<string, string>
}

// ============================================================
// 2025年12月 最新模型配置
// ============================================================

const PROVIDERS: Record<string, ProviderConfig> = {
    // DeepSeek - 深度求索 (2025年12月最新)
    deepseek: {
        name: 'DeepSeek',
        url: 'https://api.deepseek.com',
        models: [
            'deepseek-chat',              // DeepSeek-V3.2 对话模型
            'deepseek-reasoner',          // DeepSeek-R1 推理模型  
            'deepseek-coder'              // 代码模型
            // 注：deepseek-chat 自动映射到最新的 V3.2
            // deepseek-reasoner 自动映射到最新的 R1
        ],
        keyEnvs: ['DEEPSEEK_API_KEY', 'LLM_API_KEY']
    },

    // Kimi - 月之暗面 (2025年12月最新)
    kimi: {
        name: 'Kimi (Moonshot)',
        url: 'https://api.moonshot.cn/v1',
        models: [
            'kimi-k2-thinking',           // Kimi K2 Thinking - 最强推理模型 (256k上下文)
            'moonshot-v1-128k',           // 128K 上下文
            'moonshot-v1-32k',            // 32K 上下文
            'moonshot-v1-8k',             // 8K 上下文
            'kimi-latest'                 // 最新实验版本
        ],
        keyEnvs: ['KIMI_API_KEY']
    },

    // 硅基流动 - SiliconFlow (2025年12月)
    siliconflow: {
        name: '硅基流动 (SiliconFlow)',
        url: 'https://api.siliconflow.cn/v1',
        models: [
            'deepseek-ai/DeepSeek-V3',           // DeepSeek V3
            'deepseek-ai/DeepSeek-R1',           // DeepSeek R1 推理
            'Qwen/Qwen2.5-72B-Instruct',         // 通义千问 2.5
            'Qwen/QwQ-32B',                      // QwQ 推理模型
            'THUDM/GLM-4-9B-0414',               // 智谱 GLM-4
            'meta-llama/Llama-3.3-70B-Instruct', // Meta Llama 3.3
            'Pro/Qwen/Qwen2.5-7B-Instruct'       // 免费模型
        ],
        keyEnvs: ['SILICONFLOW_API_KEY']
    },

    // OpenRouter - 多模型聚合 (2025年12月)
    openrouter: {
        name: 'OpenRouter',
        url: 'https://openrouter.ai/api/v1',
        models: [
            'anthropic/claude-3.5-sonnet',
            'openai/gpt-4o',
            'openai/o1',                         // OpenAI o1
            'google/gemini-2.0-flash',           // Gemini 2.0
            'deepseek/deepseek-r1',
            'moonshotai/kimi-k2-thinking'        // Kimi K2 Thinking
        ],
        keyEnvs: ['OPENROUTER_API_KEY'],
        headers: (apiKey) => ({
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://grimoire-aether.pages.dev',
            'X-Title': 'Grimoire Aether'
        })
    },

    // OpenAI (2025年12月)
    openai: {
        name: 'OpenAI',
        url: 'https://api.openai.com/v1',
        models: [
            'gpt-4o',                    // GPT-4o
            'gpt-4o-mini',               // GPT-4o Mini
            'o1',                        // OpenAI o1 推理
            'o1-mini',                   // OpenAI o1 Mini
            'o3-mini',                   // OpenAI o3 Mini (2025新)
            'gpt-4-turbo'                // GPT-4 Turbo
        ],
        keyEnvs: ['OPENAI_API_KEY']
    },

    // Anthropic (2025年12月)
    anthropic: {
        name: 'Anthropic',
        url: 'https://api.anthropic.com/v1',
        models: [
            'claude-sonnet-4-20250514',     // Claude Sonnet 4 (2025新)
            'claude-3-5-sonnet-latest',     // Claude 3.5 Sonnet
            'claude-3-5-haiku-latest',      // Claude 3.5 Haiku
            'claude-3-opus-latest'          // Claude 3 Opus
        ],
        keyEnvs: ['ANTHROPIC_API_KEY'],
        headers: (apiKey) => ({
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        })
    }
}

// ============================================================
// 辅助函数
// ============================================================

function getApiKey(env: Bindings, provider: ProviderConfig): string | undefined {
    for (const keyName of provider.keyEnvs) {
        if (env[keyName]) return env[keyName]
    }
    return undefined
}

function buildHeaders(provider: ProviderConfig, apiKey: string): Record<string, string> {
    if (provider.headers) {
        return provider.headers(apiKey)
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    }
}

// ============================================================
// 应用
// ============================================================

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
}))

// 健康检查
app.get('/health', (c) => {
    const providers: Record<string, { name: string; configured: boolean }> = {}

    for (const [id, config] of Object.entries(PROVIDERS)) {
        providers[id] = {
            name: config.name,
            configured: !!getApiKey(c.env, config)
        }
    }

    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2025.12',
        providers
    })
})

// 获取提供商和模型
app.get('/ai/providers', (c) => {
    const available: Record<string, {
        name: string
        models: string[]
        configured: boolean
    }> = {}

    for (const [id, config] of Object.entries(PROVIDERS)) {
        available[id] = {
            name: config.name,
            models: config.models,
            configured: !!getApiKey(c.env, config)
        }
    }

    return c.json({ providers: available })
})

// AI 聊天
app.post('/ai/chat', async (c) => {
    try {
        const body = await c.req.json<{
            messages: Array<{ role: string; content: string }>
            model?: string
            provider?: string
            stream?: boolean
            temperature?: number
            max_tokens?: number
        }>()

        if (!body.messages || !Array.isArray(body.messages)) {
            return c.json({ error: 'Invalid request', message: 'messages 必须是数组' }, 400)
        }

        const providerName = body.provider || 'deepseek'
        const provider = PROVIDERS[providerName]

        if (!provider) {
            return c.json({
                error: 'Unknown provider',
                message: `不支持: ${providerName}`,
                available: Object.keys(PROVIDERS)
            }, 400)
        }

        const apiKey = getApiKey(c.env, provider)
        if (!apiKey) {
            return c.json({
                error: 'Missing API Key',
                message: `请配置 ${provider.keyEnvs[0]}`,
                provider: provider.name
            }, 500)
        }

        const model = body.model || provider.models[0]
        const headers = buildHeaders(provider, apiKey)

        const endpoint = providerName === 'anthropic'
            ? `${provider.url}/messages`
            : `${provider.url}/chat/completions`

        let requestBody: Record<string, unknown>

        if (providerName === 'anthropic') {
            requestBody = {
                model: model,
                messages: body.messages.filter(m => m.role !== 'system'),
                system: body.messages.find(m => m.role === 'system')?.content,
                max_tokens: body.max_tokens ?? 4096
            }
        } else {
            requestBody = {
                model: model,
                messages: body.messages,
                stream: body.stream ?? false,
                temperature: body.temperature ?? 0.7,
                max_tokens: body.max_tokens ?? 4096
            }
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`${provider.name} Error:`, response.status, errorText)
            return c.json({
                error: `${provider.name} API Error`,
                status: response.status,
                message: errorText
            }, response.status as 400 | 401 | 403 | 404 | 500)
        }

        const data = await response.json()

        if (providerName === 'anthropic') {
            return c.json({
                id: data.id,
                object: 'chat.completion',
                created: Date.now(),
                model: data.model,
                choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: data.content?.[0]?.text || ''
                    },
                    finish_reason: data.stop_reason
                }],
                usage: data.usage
            })
        }

        return c.json(data)

    } catch (error) {
        console.error('AI Chat Error:', error)
        return c.json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
    }
})

app.notFound((c) => c.json({ error: 'Not Found', path: c.req.path }, 404))

app.onError((err, c) => {
    console.error('Hono Error:', err)
    return c.json({ error: 'Internal Server Error', message: err.message }, 500)
})

export const onRequest = handle(app)
