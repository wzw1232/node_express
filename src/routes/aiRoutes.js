/**
 * @fileoverview AI 路由（AI Routes）
 *
 * @description
 * 挂载 AI 相关端点：
 *   POST /chat      — SSE 流式对话
 *   POST /chat/sync — 同步（非流式）对话
 */

const express = require('express');
const { chatStream, chatSync } = require('../controllers/aiController');

const router = express.Router();

/**
 * @openapi
 * /api/ai/chat:
 *   post:
 *     summary: AI 流式对话（SSE）
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [messages]
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [system, user, assistant]
 *                     content:
 *                       type: string
 *               model:
 *                 type: string
 *               temperature:
 *                 type: number
 *               maxTokens:
 *                 type: integer
 *     responses:
 *       200:
 *         description: SSE 流式响应
 */
router.post('/chat', chatStream);

/**
 * @openapi
 * /api/ai/chat/sync:
 *   post:
 *     summary: AI 同步对话
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [messages]
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *               model:
 *                 type: string
 *               temperature:
 *                 type: number
 *               maxTokens:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 请求成功
 */
router.post('/chat/sync', chatSync);

module.exports = router;
