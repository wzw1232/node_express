/**
 * @fileoverview AI 业务编排层（AI Service）
 *
 * @description
 * 位于 Controller 和 Provider 之间的业务层，负责：
 *   1. 输入参数校验（messages 不为空、role 合法等）
 *   2. 调用 Provider 层的 chat() / chatStream()
 *   3. 将 Provider 异常转换为统一的 HttpError 向上抛出
 *
 * @requires ../providers
 * @requires ../utils/httpError
 */

const { getAIProvider } = require('../providers');
const { createHttpError } = require('../utils/httpError');

/** 合法的 message role 值 */
const VALID_ROLES = new Set(['system', 'user', 'assistant']);

/**
 * 校验 messages 数组。
 *
 * @param {Array} messages - 客户端传入的消息数组
 * @throws {HttpError} 400 - 参数不合法时
 */
function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw createHttpError(400, 'messages 必须是非空数组', 400);
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') {
      throw createHttpError(400, `messages[${i}] 必须是对象`, 400);
    }
    if (!VALID_ROLES.has(msg.role)) {
      throw createHttpError(
        400,
        `messages[${i}].role 不合法，期望 system | user | assistant，实际: ${msg.role}`,
        400
      );
    }
    if (typeof msg.content !== 'string') {
      throw createHttpError(400, `messages[${i}].content 必须是字符串`, 400);
    }
  }
}

/**
 * 非流式对话（内部方法，供 Controller 调用）。
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {Object} [options] - { model, temperature, maxTokens }
 * @returns {Promise<{content: string, model: string, usage?: Object}>}
 */
async function chat(messages, options = {}) {
  validateMessages(messages);

  const provider = getAIProvider();
  const result = await provider.chat(messages, options);
  return result;
}

/**
 * 流式对话（内部方法，供 Controller 调用）。
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {Object} options  - { model, temperature, maxTokens }
 * @param {function(string): void} onChunk - 每收到文本片段时回调
 * @returns {Promise<{model: string, usage?: Object}>}
 */
async function chatStream(messages, options = {}, onChunk) {
  validateMessages(messages);

  if (typeof onChunk !== 'function') {
    throw createHttpError(400, 'onChunk 必须是函数', 400);
  }

  const provider = getAIProvider();
  const result = await provider.chatStream(messages, options, onChunk);
  return result;
}

module.exports = {
  chat,
  chatStream,
};
