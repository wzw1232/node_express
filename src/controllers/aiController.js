/**
 * @fileoverview AI 控制器（AI Controller）
 *
 * @description
 * HTTP 请求入口层，职责：
 *   1. 从 req.body 中提取 messages 和 options
 *   2. 委托给 aiService 处理业务
 *   3. 流式端点设置 SSE 响应头，逐块推送
 *   4. 同步端点使用项目统一 ok() 响应
 *
 * @requires ../services/aiService
 * @requires ../utils/response
 */

const aiService = require('../services/aiService');
const { ok } = require('../utils/response');

/**
 * POST /api/ai/chat —— SSE 流式对话（默认端点）。
 *
 * 请求体示例：
 *   {
 *     "messages": [
 *       { "role": "system", "content": "你是一个助手" },
 *       { "role": "user",   "content": "解释闭包" }
 *     ],
 *     "model": "gpt-4o",
 *     "temperature": 0.7,
 *     "maxTokens": 2000
 *   }
 *
 * 响应格式 (text/event-stream)：
 *   data: {"type":"content","content":"你"}
 *   data: {"type":"content","content":"好"}
 *   // 深度思考模式下还会有 reasoning 类型的 chunk：
 *   data: {"type":"reasoning","content":"用户想要了解..."}
 *   data: [DONE]
 */
async function chatStream(req, res, next) {
  // --- 提前设置 SSE 响应头，确保 error/abort 也是 SSE 格式 ---
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲

  // --- 客户端断开时中止 ---
  let aborted = false;
  req.on('close', () => {
    aborted = true;
  });

  try {
    const { messages, ...options } = req.body;

    await aiService.chatStream(messages, options, (chunk) => {
      if (aborted) return;
      // chunk 为 { type: 'content'|'reasoning', content: '文本片段' }
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    });

    if (!aborted) {
      res.write('data: [DONE]\n\n');
    }
  } catch (error) {
    // 流已开始时出错的兜底 —— 用 SSE 格式推送错误
    if (!aborted) {
      const errMsg = error instanceof Error ? error.message : 'AI 服务异常';
      res.write(`data: ${JSON.stringify({ type: 'error', content: errMsg })}\n\n`);
      res.write('data: [DONE]\n\n');
    }
  } finally {
    if (!aborted) {
      res.end();
    }
  }
}

/**
 * POST /api/ai/chat/sync —— 同步（非流式）对话端点。
 *
 * 请求体同 chatStream。
 * 响应为普通 JSON：
 *   { "code": 0, "message": "OK", "data": { "content": "...", "model": "..." } }
 */
async function chatSync(req, res, next) {
  try {
    const { messages, ...options } = req.body;
    const result = await aiService.chat(messages, options);
    return ok(res, result, 'OK');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  chatStream,
  chatSync,
};
