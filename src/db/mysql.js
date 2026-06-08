/**
 * @fileoverview MySQL 连接池管理模块 (MySQL Connection Pool)
 *
 * @description
 * 基于 `mysql2/promise` 封装的数据库连接池管理模块，提供：
 *   1. 连接池的惰性创建与复用（单例模式）
 *   2. 数据库连通性自检 (health check)
 *   3. 连接池生命周期事件监听（用于运维监控和排障）
 *   4. 应用退出前的优雅关闭 (graceful shutdown)
 *
 * ## 为什么使用连接池而不是单连接？
 *   - 单连接模式下所有查询串行排队，前一个慢查询会阻塞后续所有请求
 *   - 连接池预建多条连接，并发请求各取所需，用完后归还复用
 *   - 避免了每次请求重新 TCP 握手 + MySQL 认证的开销（约 50-200ms）
 *
 * ## 关键设计决策
 *   - 惰性初始化：首次调用 getMysqlPool() 时才创建池，避免应用启动即占用连接
 *   - 单例缓存：全局只存在一个 pool 实例，防止重复创建消耗数据库连接数
 *   - 事件监听：记录 acquire/release/error 事件，便于通过日志定位连接泄漏或池耗尽
 *
 * @requires mysql2/promise - npm 包 mysql2 的 Promise API 子模块
 * @requires ./config        - 数据库配置模块，集中管理连接参数
 *
 * @example
 *   const { getMysqlPool } = require('../db/mysql');
 *   const pool = getMysqlPool();
 *   const [rows] = await pool.execute('SELECT 1');
 */

const mysql = require('mysql2/promise');
const { dbConfig, validateConfig } = require('./config');

// ---------------------------------------------------------------------------
// 模块级私有状态
// ---------------------------------------------------------------------------

/**
 * 连接池单例引用。
 *
 * 使用模块闭包存储，而非全局变量，避免被外部意外篡改。
 * 初始值为 null，首次调用 getMysqlPool() 时完成初始化。
 *
 * @type {import('mysql2/promise').Pool | null}
 */
let pool = null;

/**
 * 连接池是否正在执行关闭流程。
 *
 * 用于防止在 closePool() 异步关闭期间有新的 getMysqlPool() 调用
 * 重新创建已被关闭的连接池。
 *
 * @type {boolean}
 */
let isClosing = false;

// ---------------------------------------------------------------------------
// 事件监听注册
// ---------------------------------------------------------------------------

/**
 * 为连接池绑定生命周期事件监听器。
 *
 * 这些事件仅在 DEBUG 级别下输出，避免生产环境日志洪泛。
 * 若需要持久化采集（如接入 Prometheus / Grafana），
 * 可将 event handler 中的 console.debug 替换为 metrics 计数器。
 *
 * 事件说明：
 *   - acquire    连接被从池中取出（业务请求拿到了一条连接）
 *   - release    连接被归还到池中（业务请求完成，连接复归于池）
 *   - connection 新建了一条到 MySQL 的 TCP 长连接
 *   - enqueue    请求因池中无空闲连接而进入等待队列
 *   - error      连接池级别的错误（非 SQL 查询错误）
 *
 * @param {import('mysql2/promise').Pool} p - 已创建的连接池实例
 */
function attachPoolEvents(p) {
  p.on('acquire', (conn) => {
    console.debug(`[mysql] 连接已获取 (threadId=${conn.threadId})`);
  });

  p.on('release', (conn) => {
    console.debug(`[mysql] 连接已释放 (threadId=${conn.threadId})`);
  });

  p.on('connection', (conn) => {
    console.debug(`[mysql] 新连接建立 (threadId=${conn.threadId})`);
  });

  p.on('enqueue', () => {
    // 频繁出现此日志说明 connectionLimit 偏低，应考虑扩容或优化慢查询
    console.warn('[mysql] 连接池已满，请求进入等待队列');
  });

  p.on('error', (err) => {
    // 连接池级别的致命错误（如 MySQL 重启导致的连接断开）。
    // 注意：SQL 查询错误不会触发此事件，仅连接层错误会触发。
    console.error(`[mysql] 连接池异常: ${err.message}`, err);
  });
}

// ---------------------------------------------------------------------------
// 公开 API
// ---------------------------------------------------------------------------

/**
 * 获取 MySQL 连接池实例（惰性单例）。
 *
 * 首次调用时根据 dbConfig 创建连接池，后续调用直接返回缓存的实例。
 * 线程安全由 Node.js 单线程事件循环保证。
 *
 * @returns {import('mysql2/promise').Pool} 可复用的连接池实例
 * @throws {Error} 当 pool 正在关闭时调用会抛出异常
 *
 * @example
 *   // 基础用法：获取池后执行查询
 *   const pool = getMysqlPool();
 *   const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [1]);
 *
 * @example
 *   // 配合事务使用（手动获取连接以在同一连接上执行多条 SQL）
 *   const pool = getMysqlPool();
 *   const conn = await pool.getConnection();
 *   try {
 *     await conn.beginTransaction();
 *     await conn.execute('UPDATE ...');
 *     await conn.execute('INSERT ...');
 *     await conn.commit();
 *   } catch (err) {
 *     await conn.rollback();
 *     throw err;
 *   } finally {
 *     conn.release(); // 务必释放连接，否则会导致连接泄漏
 *   }
 */
function getMysqlPool() {
  if (isClosing) {
    throw new Error('[mysql] 连接池正在关闭中，无法获取连接');
  }

  if (pool) {
    return pool;
  }

  // ---- 创建连接池 ----
  // mysql2 的 createPool 在内部构造时不会立即建立连接，
  // 实际连接在首次查询或显式调用 pool.getConnection() 时才建立。
  pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: dbConfig.waitForConnections,
    connectionLimit: dbConfig.connectionLimit,
    queueLimit: dbConfig.queueLimit,
    acquireTimeout: dbConfig.acquireTimeout,
    connectTimeout: dbConfig.connectTimeout,
    idleTimeout: dbConfig.idleTimeout,
    charset: dbConfig.charset,
    timezone: dbConfig.timezone,
  });

  // 注册事件监听，用于运维可观测性
  attachPoolEvents(pool);

  // 启动时的配置校验（非阻断式）
  validateConfig(dbConfig);

  console.log(
    `[mysql] 连接池已创建 → ` +
      `${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database} ` +
      `(connectionLimit=${dbConfig.connectionLimit})`
  );

  return pool;
}

/**
 * 测试数据库连通性（健康检查）。
 *
 * 向数据库发送一条轻量查询 `SELECT 1`，用于确认：
 *   - 连接池能正常获取和归还连接
 *   - MySQL 服务处于可用状态
 *   - 网络层面没有丢包或路由问题
 *
 * 常见用途：
 *   - Kubernetes liveness / readiness probe
 *   - 负载均衡器的健康检查端点
 *   - 应用启动后的冒烟验证
 *
 * @returns {Promise<boolean>} true 表示数据库可达，false 表示不可达
 *
 * @example
 *   const { checkDatabaseConnection } = require('../db/mysql');
 *   const ok = await checkDatabaseConnection();
 *   if (!ok) {
 *     console.error('数据库不可达，请检查 MySQL 服务状态');
 *   }
 */
async function checkDatabaseConnection() {
  try {
    const p = getMysqlPool();
    const [rows] = await p.execute('SELECT 1 AS result');
    return rows.length > 0;
  } catch (err) {
    console.error(`[mysql] 健康检查失败: ${err.message}`);
    return false;
  }
}

/**
 * 优雅关闭连接池。
 *
 * 在应用进程退出前（SIGINT / SIGTERM / 手动调用）执行此函数，
 * 确保所有活跃连接被正确释放，避免：
 *   - 正在执行的查询被暴力中断导致数据不一致
 *   - TCP 连接没有发送 FIN 包导致 MySQL 端出现 CLOSE_WAIT 堆积
 *   - 连接池持有的 socket 句柄泄漏
 *
 * 调用后 pool 引用被置为 null，
 * 后续的 getMysqlPool() 调用将重新创建一个全新的连接池。
 *
 * @returns {Promise<void>}
 *
 * @example
 *   // 在进程退出钩子中调用
 *   process.on('SIGTERM', async () => {
 *     await closePool();
 *     process.exit(0);
 *   });
 */
async function closePool() {
  if (!pool) {
    return;
  }

  isClosing = true;

  try {
    await pool.end();
    console.log('[mysql] 连接池已关闭');
  } catch (err) {
    console.error(`[mysql] 关闭连接池时发生错误: ${err.message}`);
  } finally {
    pool = null;
    isClosing = false;
  }
}

module.exports = {
  getMysqlPool,
  checkDatabaseConnection,
  closePool,
};
