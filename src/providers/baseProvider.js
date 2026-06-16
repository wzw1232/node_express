/**
 * @fileoverview AI Provider 抽象基类（Base AI Provider）
 *
 * @description
 * 定义所有 AI 服务商 Provider 必须实现的接口契约：
 *   - chat()       — 非流式对话，返回完整回复
 *   - chatStream() — 流式对话，通过回调逐块输出
 *
 * 子类（OpenAI、Claude 等）需继承此类并实现上述方法。
 * 不直接实例化基类——若子类未覆写方法，调用时将抛出异常。
 */

class BaseProvider {
  /**
   * 非流式对话 —— 发送消息并等待完整回复。
   *
   * @param {Array<{role: string, content: string}>} messages - 消息数组
   *   role 取值：'system' | 'user' | 'assistant'
   * @param {Object} [options] - 可选参数
   * @param {string} [options.model]       - 模型名称（覆盖默认值）
   * @param {number} [options.temperature] - 生成温度 0~2
   * @param {number} [options.maxTokens]   - 最大输出 token 数
   * @returns {Promise<{content: string, model: string, usage?: Object}>}
   *   content — AI 回复全文
   *   model   — 实际使用的模型名
   *   usage   — token 用量（如有）
   */
  async chat(_messages, _options) {
    throw new Error('chat() must be implemented by subclass');
  }

  /**
   * 流式对话 —— 发送消息，逐块回调 delta 文本。
   *
   * @param {Array<{role: string, content: string}>} messages - 消息数组
   * @param {Object} [options] - 可选参数（同 chat()）
   * @param {function(string): void} onChunk - 每收到一个文本片段时回调
   *   回调参数为纯文本字符串（已提取 delta content）
   * @returns {Promise<{model: string, usage?: Object}>}
   *   流结束时返回模型名和 token 用量
   */
  async chatStream(_messages, _options, _onChunk) {
    throw new Error('chatStream() must be implemented by subclass');
  }
}

module.exports = BaseProvider;
