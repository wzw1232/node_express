/**
 * @fileoverview OpenAI Provider 实现
 *
 * @description
 * 基于 openai 官方 SDK 封装，支持：
 *   - chat()       — 非流式，调用 chat.completions.create
 *   - chatStream() — 流式，设置 stream:true 并遍历 SSE 流
 *
 * 环境变量：
 *   OPENAI_API_KEY   — API 密钥（必填）
 *   OPENAI_MODEL     — 默认模型，如 gpt-4o（可选，默认 gpt-4o）
 *   OPENAI_BASE_URL  — 自定义 API 基础地址（可选，用于代理）
 */

const OpenAI = require('openai');
const BaseProvider = require('./baseProvider');

class OpenAIProvider extends BaseProvider {
  constructor() {
    super();
    const apiKey = process.env.OPENAI_API_KEY || '';
    const baseURL = process.env.OPENAI_BASE_URL || undefined;
    const defaultModel = process.env.OPENAI_MODEL || 'gpt-4o';

    if (!apiKey) {
      console.warn('[OpenAIProvider] OPENAI_API_KEY 未配置，请求将失败');
    }

    this.client = new OpenAI({ apiKey, baseURL });
    this.defaultModel = defaultModel;
  }

  // ---------------------------------------------------------------------------
  // 非流式对话
  // ---------------------------------------------------------------------------
  async chat(messages, options = {}) {
    const { model = this.defaultModel, temperature, maxTokens } = options;

    const response = await this.client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    const choice = response.choices?.[0]?.message ?? {};

    return {
      content: choice.content ?? '',
      model: response.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  // ---------------------------------------------------------------------------
  // 流式对话
  // ---------------------------------------------------------------------------
  async chatStream(messages, options = {}, onChunk) {
    const { model = this.defaultModel, temperature, maxTokens } = options;

    const stream = await this.client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    let finishModel = model;
    let finishUsage = undefined;

    for await (const chunk of stream) {
      // 记录模型和 usage（通常出现在最后一个 chunk）
      if (chunk.model) finishModel = chunk.model;
      if (chunk.usage) {
        finishUsage = {
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
          totalTokens: chunk.usage.total_tokens,
        };
      }

      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        onChunk({ type: 'content', content: delta });
      }
    }

    return { model: finishModel, usage: finishUsage };
  }
}

module.exports = OpenAIProvider;
