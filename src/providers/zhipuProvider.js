/**
 * @fileoverview 智谱 GLM Provider 实现
 *
 * @description
 * 智谱 AI 的 API 与 OpenAI 兼容（Base URL: https://open.bigmodel.cn/api/paas/v4/），
 * 因此复用 openai SDK 作为底层 HTTP 客户端，仅修改 baseURL 和 API Key。
 *
 * 智谱特有功能：
 *   - thinking: { type: 'enabled' }  启用深度思考模式
 *   - 流式 chunk 中可能包含 delta.reasoning_content（推理过程）
 *
 * 环境变量：
 *   GLM_API_KEY  — 智谱 API 密钥（必填）
 *   GLM_MODEL    — 默认模型，如 glm-4.7（可选，默认 glm-4.7）
 */

const OpenAI = require('openai');
const BaseProvider = require('./baseProvider');

/** 智谱 AI 的 OpenAI 兼容 API 地址 */
const ZHIHU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4/';

class ZhipuProvider extends BaseProvider {
  constructor() {
    super();
    const apiKey = process.env.GLM_API_KEY || '';
    const defaultModel = process.env.GLM_MODEL || 'glm-4.7';

    if (!apiKey) {
      console.warn('[ZhipuProvider] GLM_API_KEY 未配置，请求将失败');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: ZHIHU_BASE_URL,
    });
    this.defaultModel = defaultModel;
  }

  // ---------------------------------------------------------------------------
  // 非流式对话
  // ---------------------------------------------------------------------------
  async chat(messages, options = {}) {
    const { model = this.defaultModel, temperature, maxTokens, thinking } = options;

    const params = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    // 智谱特有：深度思考模式
    if (thinking) {
      params.thinking = thinking;
    }

    const response = await this.client.chat.completions.create(params);

    const choice = response.choices?.[0]?.message ?? {};

    return {
      content: choice.content ?? '',
      // 深度思考模式下，模型会返回推理过程
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
  }

  // ---------------------------------------------------------------------------
  // 流式对话
  // ---------------------------------------------------------------------------
  async chatStream(messages, options = {}, onChunk) {
    const { model = this.defaultModel, temperature, maxTokens, thinking } = options;

    const params = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    };

    // 智谱特有：深度思考模式
    if (thinking) {
      params.thinking = thinking;
    }

    const stream = await this.client.chat.completions.create(params);

    let finishModel = model;
    let finishUsage = undefined;

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

      // 深度思考模式下的推理过程（优先推送）
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

    return { model: finishModel, usage: finishUsage };
  }
}

module.exports = ZhipuProvider;
