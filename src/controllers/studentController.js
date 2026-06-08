/**
 * @fileoverview 学生控制器 (Student Controller)
 *
 * @description
 * HTTP 请求的入口层，职责非常薄：
 *   1. 从 req 中提取请求参数
 *   2. 委托给 Service 层处理业务
 *   3. 用统一的响应格式（ok / created）返回给客户端
 *   4. 将所有错误交给 Express 错误处理中间件（next(error)）
 *
 * Controller 不应包含任何业务逻辑或 SQL —— 它们属于 Service 和 Repository。
 *
 * @requires ../services/studentService
 * @requires ../utils/response
 */

const studentService = require('../services/studentService');
const { ok } = require('../utils/response');

/**
 * GET /api/students
 * 获取学生列表（分页 + 关键词搜索）。
 *
 * Query 参数：
 *   - page    {number} 页码，默认 1
 *   - size    {number} 每页条数，默认 10，最大 100
 *   - keyword {string} 按姓名模糊搜索
 */
async function listStudents(req, res, next) {
  try {
    const data = await studentService.getStudentList(req.query);
    return ok(res, data, '查询成功');
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/students/:id
 * 获取单个学生详情。
 *
 * Path 参数：
 *   - id {number} 学生主键 ID
 */
async function getStudentById(req, res, next) {
  try {
    const data = await studentService.getStudentDetail(req.params.id);
    return ok(res, data, '查询成功');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listStudents,
  getStudentById,
};
