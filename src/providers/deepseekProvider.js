/**
 * @fileoverview DeepSeek Provider 实现
 *
 * @description
 * DeepSeek API 与 OpenAI 兼容（Base URL: https://api.deepseek.com），
 * 复用 openai SDK 作为底层 HTTP 客户端。
 *
 * DeepSeek 特有：
 *   - deepseek-reasoner 模型会返回 delta.reasoning_content（推理过程）
 *   - deepseek-chat 模型为标准对话模型
 *
 * 环境变量：
 *   DEEPSEEK_API_KEY  — DeepSeek API 密钥（必填）
 *   DEEPSEEK_MODEL    — 默认模型（可选，默认 deepseek-chat）
 */

const OpenAI = require('openai');
const BaseProvider = require('./baseProvider');

/** DeepSeek OpenAI 兼容 API 地址 */
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

class DeepSeekProvider extends BaseProvider {
  constructor() {
    super();
    const apiKey = process.env.DEEPSEEK_API_KEY || '';
    const defaultModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

    if (!apiKey) {
      console.warn('[DeepSeekProvider] DEEPSEEK_API_KEY 未配置，请求将失败');
    }

    console.log('[DeepSeekProvider] 初始化完成', {
      baseURL: DEEPSEEK_BASE_URL,
      defaultModel,
      hasApiKey: !!apiKey,
    });

    this.client = new OpenAI({
      apiKey,
      baseURL: DEEPSEEK_BASE_URL,
    });
    this.defaultModel = defaultModel;
  }

  // ---------------------------------------------------------------------------
  // 非流式对话
  // ---------------------------------------------------------------------------
  async chat(messages, options = {}) {
    const { model = this.defaultModel, temperature, maxTokens } = options;

    const params = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    console.log('[DeepSeekProvider] chat 请求参数:', {
      model: params.model,
      msgCount: params.messages?.length,
      stream: false,
    });

    try {
      const response = await this.client.chat.completions.create(params);

      const choice = response.choices?.[0]?.message ?? {};

      return {
        content: choice.content ?? '',
        // deepseek-reasoner 模型返回推理过程
        reasoningContent: choice.reasoning_content ?? undefined,
        model: response.model,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      console.error('[DeepSeekProvider] chat 调用失败:', {
        status: error.status,
        code: error.error?.code,
        message: error.message,
        body: error.error,
      });
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // 流式对话
  // ---------------------------------------------------------------------------
  async chatStream(messages, options = {}, onChunk) {
    const { model = this.defaultModel, temperature, maxTokens } = options;

    const params = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    };

    console.log('[DeepSeekProvider] chatStream 请求参数:', {
      model: params.model,
      msgCount: params.messages?.length,
      stream: true,
    });

    let stream;
    try {
      stream = await this.client.chat.completions.create(params);
    } catch (error) {
      console.error('[DeepSeekProvider] chatStream 创建失败:', {
        status: error.status,
        code: error.error?.code,
        message: error.message,
        body: error.error,
      });
      throw error;
    }

    let finishModel = model;
    let finishUsage = undefined;

    try {
      for await (const chunk of stream) {
        if (chunk.model) finishModel = chunk.model;
        if (chunk.usage) {
          finishUsage = {
            promptTokens: chunk.usage.prompt_tokens,
            completionTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens,
          };
        }

        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;

        // deepseek-reasoner 模型的推理过程
        if (delta.reasoning_content) {
          onChunk({
            type: 'reasoning',
            content: delta.reasoning_content,
          });
        }

        // 正式回复内容
        if (delta.content) {
          onChunk({
            type: 'content',
            content: delta.content,
          });
        }
      }
    } catch (error) {
      console.error('[DeepSeekProvider] chatStream 流中断:', {
        message: error.message,
        finishModel,
      });
      throw error;
    }

    console.log('[DeepSeekProvider] chatStream 完成:', {
      model: finishModel,
      hasUsage: !!finishUsage,
    });
    return { model: finishModel, usage: finishUsage };
  }
}

module.exports = DeepSeekProvider;
