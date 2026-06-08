/**
 * @fileoverview 学生数据访问层 (Student Repository)
 *
 * @description
 * 封装 students 表的所有数据库操作，对上层的 Service 层屏蔽 SQL 细节。
 * 遵循「数据访问对象 (Repository)」模式 —— 一个模块只负责一张表的 CRUD。
 *
 * ## 设计约定
 *   - 所有查询使用参数化 SQL（? 占位符），防止 SQL 注入
 *   - 查询结果中的数据库字段名（snake_case）在此层转换为 JS 驼峰命名（camelCase）
 *   - 查询不到数据时返回 null 或空数组，不抛异常；仅数据库错误才向上抛
 *
 * @requires ../db/mysql - 通过 getMysqlPool() 获取连接池
 */

const { getMysqlPool } = require('../db/mysql');

/**
 * 查询所有学生（支持分页）。
 *
 * @param {Object} [options] - 分页与过滤参数
 * @param {number} [options.page=1]  - 当前页码，从 1 开始
 * @param {number} [options.size=10] - 每页条数
 * @param {string} [options.keyword] - 按姓名模糊搜索
 * @returns {Promise<{list: Array<Object>, total: number, page: number, size: number}>}
 */
async function findAll({ page = 1, size = 10, keyword = '' } = {}) {
  const pool = getMysqlPool();

  console.log(page, size, keyword, '哈哈哈');

  // 构建 WHERE 子句：keyword 不为空时按姓名模糊匹配
  const conditions = [];
  const params = [];

  if (keyword) {
    conditions.push('name LIKE ?');
    params.push(`%${keyword}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // ---- 查总数 ----
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM students ${whereClause}`,
    params
  );
  const total = countRows[0].total;

  // ---- 查分页数据 ----
  const offset = (page - 1) * size;
  const [rows] = await pool.execute(
    `SELECT id, name, gender, age, mobile, create_time
     FROM students
     ${whereClause}
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
    [...params, size, offset]
  );

  // 数据库 snake_case → JS camelCase
  const list = rows.map(toCamelCase);

  return { list, total, page, size };
}

/**
 * 根据 ID 查询单个学生。
 *
 * @param {number|string} id - 学生主键 ID
 * @returns {Promise<Object|null>} 学生对象，不存在时返回 null
 */
async function findById(id) {
  const pool = getMysqlPool();
  const [rows] = await pool.execute(
    `SELECT id, name, gender, age, mobile, create_time
     FROM students WHERE id = ? LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  return toCamelCase(rows[0]);
}

// ---------------------------------------------------------------------------
// 内部工具
// ---------------------------------------------------------------------------

/**
 * 将数据库行（snake_case）转为 JS 惯用的 camelCase 对象。
 *
 * @param {Object} row - 数据库原始行
 * @returns {Object} 转换后的对象
 */
function toCamelCase(row) {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    gender: row.gender,
    mobile: row.mobile,
    createTime: row.create_time,
  };
}

module.exports = {
  findAll,
  findById,
};
