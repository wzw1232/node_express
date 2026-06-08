/**
 * @fileoverview 学生业务逻辑层 (Student Service)
 *
 * @description
 * 位于 Controller 和 Repository 之间的业务编排层，负责：
 *   1. 参数校验与默认值设定
 *   2. 调用 Repository 获取原始数据
 *   3. 对数据做二次加工（脱敏、格式化、聚合）
 *   4. 将业务异常转换为统一的 HttpError 向上抛出
 *
 * 当前 student 业务较为简单，多为透传调用。
 * 随着业务复杂度增长（如成绩关联、选课逻辑），此层的价值会更加明显。
 *
 * @requires ../repositories/studentRepository
 * @requires ../utils/httpError
 */

const studentRepo = require('../repositories/studentRepository');
const { createHttpError } = require('../utils/httpError');

/**
 * 获取学生列表（含分页）。
 *
 * @param {Object} query - 来自请求 query string 的原始参数
 * @param {string} [query.page]    - 页码
 * @param {string} [query.size]    - 每页条数
 * @param {string} [query.keyword] - 按姓名搜索的关键词
 * @returns {Promise<{list: Array, total: number, page: number, size: number}>}
 */
async function getStudentList(query = {}) {
  // 参数归一化与边界保护
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const size = Math.min(100, Math.max(1, parseInt(query.size, 10) || 10));
  const keyword = String(query.keyword || '').trim();

  const result = await studentRepo.findAll({ page, size, keyword });

  return result;
}

/**
 * 获取单个学生详情。
 *
 * @param {string|number} id - 学生 ID
 * @returns {Promise<Object>} 学生对象
 * @throws {HttpError} 404 - 当学生不存在时
 */
async function getStudentDetail(id) {
  const student = await studentRepo.findById(id);

  if (!student) {
    throw createHttpError(404, `学生不存在 (id=${id})`, 404);
  }

  return student;
}

module.exports = {
  getStudentList,
  getStudentDetail,
};
