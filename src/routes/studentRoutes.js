/**
 * @fileoverview 学生路由 (Student Routes)
 *
 * @description
 * 定义 /api/students 下的所有端点，遵循 RESTful 风格：
 *   GET    /api/students     → 列表查询（分页 + 搜索）
 *   GET    /api/students/:id → 详情查询
 *
 * Swagger 文档注解使用 OpenAPI 3.0 规范，通过 swagger-jsdoc 自动解析生成。
 */

const express = require('express');
const { listStudents, getStudentById } = require('../controllers/studentController');

const router = express.Router();

/**
 * @openapi
 * /api/students:
 *   get:
 *     summary: 获取学生列表
 *     description: 分页查询学生信息，支持按姓名模糊搜索
 *     tags: [学生]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: 页码，从 1 开始
 *       - in: query
 *         name: size
 *         schema: { type: integer, default: 10 }
 *         description: 每页条数，最大 100
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *         description: 按姓名模糊搜索
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/', listStudents);

/**
 * @openapi
 * /api/students/{id}:
 *   get:
 *     summary: 获取学生详情
 *     description: 根据主键 ID 查询单个学生信息
 *     tags: [学生]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: 学生主键 ID
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 学生不存在
 */
router.get('/:id', getStudentById);

module.exports = router;
