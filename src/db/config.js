/**
 * @fileoverview 数据库配置模块 (Database Configuration)
 *
 * @description
 * 集中管理所有数据库连接相关的配置项。
 * 遵循「配置即代码 (Configuration as Code)」的理念，将散落在各处的
 * 硬编码默认值统一收口到此模块，使得：
 *   1. 配置变更只需修改一处，降低维护成本
 *   2. 不同环境（本地开发 / 测试 / 预发布 / 生产）通过 .env 注入差异
 *   3. 新增只读副本、读写分离等扩展场景时可基于此模块派生
 *
 * 优先级：环境变量 process.env > 此处硬编码的默认值
 *
 * @requires dotenv - 需在应用入口（server.js）先调用 dotenv.config() 加载 .env
 *
 * @example
 *   // 在其他模块中使用
 *   const { dbConfig } = require('../db/config');
 *   console.log(dbConfig.host); // => '127.0.0.1' (或被环境变量覆盖后的值)
 */

// ---------------------------------------------------------------------------
// 主库配置（读写）
// ---------------------------------------------------------------------------
// 当前项目规模较小，暂只配置单库。当业务量增长需要读写分离时，
// 可在此模块中新增 readReplica 配置对象，上层调用方按场景选择。

const dbConfig = {
  // ---- 数据库连接基础参数 ----

  /** 数据库主机地址，默认连接本地 MySQL */
  host: process.env.DB_HOST || '127.0.0.1',

  /** 数据库端口，MySQL 默认端口为 3306 */
  port: Number(process.env.DB_PORT) || 3306,

  /** 数据库用户名，生产环境务必使用低权限账号 */
  user: process.env.DB_USER || 'root',

  /** 数据库密码，生产环境严禁硬编码，必须通过环境变量注入 */
  password: process.env.DB_PASSWORD || '',

  /** 目标数据库名称 */
  database: process.env.DB_NAME || 'node_express',

  // ---- 连接池参数 ----
  // 连接池是持有多个 TCP 连接的缓存池，避免每次查询都重新握手。
  // mysql2 内置的连接池在创建时会预建立 connectionLimit 条连接。

  /**
   * 连接池最大连接数 (connectionLimit)
   *
   * 调优建议：
   *   单核 / 小内存 VPS     → 5 ~ 10
   *   双核 / 4GB 常规云服务器 → 10 ~ 25
   *   MySQL max_connections=151 的多实例场景 → 不超过 max_connections / 实例数
   *
   * 警告：此值不宜盲目调大。每个空闲连接都会消耗 MySQL 内存（约 256KB~2MB/条），
   * 且可能触发 MySQL 端的 "Too many connections" 错误。
   */
  connectionLimit: 10,

  /**
   * 是否在连接池满时排队等待 (waitForConnections)
   *
   * true  → 连接池耗尽时请求排队，等前面的连接释放后继续（推荐）。
   *         配合 queueLimit 控制最大排队深度，防止无限积压。
   * false → 连接池耗尽时立即抛出 Error，适合需要快速失败（fast-fail）的场景。
   */
  waitForConnections: true,

  /**
   * 最大排队请求数 (queueLimit)
   *
   * 0 = 无限制（排队请求可以无限堆积，可能导致内存溢出）
   * N > 0 = 排满 N 个请求后，第 N+1 个请求直接报错
   *
   * 建议在承载高并发的生产环境中设置一个合理上限（如 50~100），
   * 避免 DB 短暂抖动导致请求队列被撑爆。
   */
  queueLimit: 0,

  // ---- 连接超时与保活参数 ----

  /**
   * 获取连接的超时时间（毫秒）(acquireTimeout)
   *
   * 当连接池中无空闲连接且 waitForConnections=true 时，
   * 请求最多等待此时间。超时后抛出 PROTOCOL_SEQUENCE_TIMEOUT。
   *
   * 默认值 10000（10 秒），可根据网络延迟适当调整。
   */
  acquireTimeout: Number(process.env.DB_ACQUIRE_TIMEOUT) || 10000,

  /**
   * 连接存活超时（毫秒）(connectTimeout)
   *
   * 建立新连接时 TCP 握手 + MySQL 认证的总超时时间。
   * 用于防止数据库不可达时无限阻塞启动流程。
   */
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 10000,

  /**
   * 空闲连接最大存活时间（毫秒）(idleTimeout)
   *
   * 连接空闲超过此时间后会被自动回收。
   * 应小于 MySQL wait_timeout（默认 28800s = 8h），
   * 否则连接池可能持有已被 MySQL 端关闭的连接导致 ECONNRESET。
   * 这里设为 5 分钟，适合多数 Web 应用场景。
   */
  idleTimeout: Number(process.env.DB_IDLE_TIMEOUT) || 300000,

  // ---- 字符集与时区 ----

  /** 连接字符集，utf8mb4 支持 emoji 和扩展 Unicode 字符 */
  charset: 'utf8mb4',

  /** 时区偏移，"+08:00" 表示东八区（中国标准时间） */
  timezone: process.env.DB_TIMEZONE || '+08:00',
};

/**
 * 运行时校验并警告不安全的配置组合
 *
 * 此函数在应用启动时调用一次，仅做日志输出，不阻断启动。
 * 生产环境应配合告警系统将此类警告提升为阻断（throw Error），
 * 防止不安全的配置上线。
 */
function validateConfig(config = dbConfig) {
  const isProduction = process.env.NODE_ENV === 'production';
  const warnings = [];

  // ---- 生产环境专属校验（安全风险，不可忽略） ----
  if (isProduction) {
    if (!config.password) {
      warnings.push('生产环境未设置 DB_PASSWORD，数据库将使用空密码连接');
    }
    if (config.user === 'root') {
      warnings.push('生产环境建议使用专用数据库账号，而非 root');
    }
    if (config.connectionLimit < 5) {
      warnings.push('生产环境 connectionLimit 偏小，高并发下可能出现连接饥饿');
    }
  }

  // ---- 高并发风险：仅在生产环境告警，开发环境无需关注 ----
  if (isProduction && config.waitForConnections && config.queueLimit === 0) {
    warnings.push(
      'queueLimit=0 且 waitForConnections=true，请求排队无上限，高并发下有内存溢出风险'
    );
  }

  // ---- idleTimeout 不合理：仅在生产环境告警 ----
  if (isProduction && config.idleTimeout > 28800000) {
    warnings.push('idleTimeout 超过 MySQL 默认 wait_timeout (8h)，空闲连接可能已被 MySQL 端回收');
  }

  if (warnings.length > 0) {
    console.warn(`[db/config] 配置校验发现 ${warnings.length} 个问题：`);
    warnings.forEach((msg) => console.warn(`  ⚠ ${msg}`));
  }

  return warnings;
}

module.exports = {
  dbConfig,
  validateConfig,
};
