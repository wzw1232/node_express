/**
 * @fileoverview AI Provider 工厂
 *
 * @description
 * 根据环境变量 AI_PROVIDER 返回对应的 Provider 实例。
 * 可选的 provider 值：
 *   - 'openai'  (默认) → OpenAIProvider
 *   - 后续扩展 'claude' / 'gemini' / ...
 *
 * 使用方式：
 *   const ai = getAIProvider();
 *   const result = await ai.chat([{ role: 'user', content: '你好' }]);
 */

let cachedProvider = null;

function getAIProvider() {
  if (cachedProvider) return cachedProvider;

  const providerName = (process.env.AI_PROVIDER || 'openai').toLowerCase();

  switch (providerName) {
    case 'openai': {
      const OpenAIProvider = require('./openaiProvider');
      cachedProvider = new OpenAIProvider();
      break;
    }
    case 'zhipu': {
      const ZhipuProvider = require('./zhipuProvider');
      cachedProvider = new ZhipuProvider();
      break;
    }
    case 'deepseek': {
      const DeepSeekProvider = require('./deepseekProvider');
      cachedProvider = new DeepSeekProvider();
      break;
    }
    // 后续扩展示例：
    // case 'claude': {
    //   const ClaudeProvider = require('./claudeProvider');
    //   cachedProvider = new ClaudeProvider();
    //   break;
    // }
    default:
      throw new Error(`不支持的 AI_PROVIDER: ${providerName}。当前支持: openai, zhipu, deepseek`);
  }

  return cachedProvider;
}

module.exports = { getAIProvider };
