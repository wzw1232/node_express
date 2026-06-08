/**
 * ESLint 配置文件 (CommonJS 传统格式，兼容 ESLint v8)
 *
 * 规范层级说明：
 *   "off"    (0) — 不检查
 *   "warn"   (1) — 警告（开发期提醒，不阻止提交）
 *   "error"  (2) — 错误（CI/CD 中会阻断）
 *
 * 插件角色：
 *   eslint-config-prettier — 关闭所有与 Prettier 冲突的 ESLint 规则，
 *     确保 ESLint 只管代码质量，格式化完全交给 Prettier
 *   eslint-plugin-prettier — 将 Prettier 格式化结果作为 ESLint 规则来校验，
 *     IDE 保存时 ESLint auto-fix 就会自动格式化
 *
 * @see https://eslint.org/docs/latest/use/configure/
 * @see https://github.com/prettier/eslint-config-prettier
 */

module.exports = {
  // ---- 运行环境 ----
  env: {
    node: true, // 启用 Node.js 全局变量 (process, __dirname, module 等)
    es2022: true, // 支持 ES2022 语法（顶层 await、.at()、Error.cause 等）
  },

  // ---- 规则继承链（后面的覆盖前面的） ----
  extends: [
    'eslint:recommended', // ESLint 官方推荐规则（★ 标记的规则）
    'plugin:prettier/recommended', // 合并 Prettier，必须在最后
    // 注意：plugin:prettier/recommended 等价于：
    //   extends:  ['prettier']          ← 关闭冲突的 ESLint 规则
    //   plugins:  ['prettier']          ← 注册 prettier 插件
    //   rules:    { 'prettier/prettier': 'error' }
  ],

  // ---- 解析器选项 ----
  parserOptions: {
    ecmaVersion: 2022, // 解析的 JS 版本
    sourceType: 'script', // CommonJS 使用 'script'（非 ESM 'module'）
    ecmaFeatures: {
      impliedStrict: false, // CommonJS 默认非严格模式（use strict 可选）
    },
  },

  // ---- 全局变量（只读） ----
  globals: {
    // 项目中无浏览器全局变量，仅 Node.js 环境
  },

  // ---- 规则覆盖 ----
  // 在此覆盖继承链中的任何规则。
  // 每一条都附带【为什么】注释，避免后来者不理解意图。
  rules: {
    // ==================== 代码质量（推荐级别之上额外加强） ====================

    // 禁止未使用的变量（函数参数不检查，回调签名常有不用的第3、4参数）
    'no-unused-vars': [
      'warn',
      {
        vars: 'all',
        args: 'none', // function(err, data, next) 中 next 可能不用
        ignoreRestSiblings: true, // const { a, ...rest } = obj 中 rest 算用到了
      },
    ],

    // 禁止在条件表达式中使用赋值运算符，除非显式加括号
    'no-cond-assign': ['error', 'except-parens'],

    // 要求使用 === 而不是 ==（null 除外，== null 等价于 === null || === undefined）
    eqeqeq: ['error', 'always', { null: 'ignore' }],

    // 禁止在返回语句中赋值（return x = 5 通常是想写 return x == 5）
    'no-return-assign': ['error', 'except-parens'],

    // 要求 case 语句中有 break（fall-through 需显式注释 "falls through"）
    'no-fallthrough': 'error',

    // 禁止修改 const 声明的变量（基础保障，不能降级）
    'no-const-assign': 'error',

    // 禁止重复声明
    'no-redeclare': 'error',

    // 禁止空代码块（catch 块允许为空，用于吞掉已知异常）
    'no-empty': ['warn', { allowEmptyCatch: true }],

    // 不要求 default case——Express 项目中 switch 用得少
    'default-case': 'off',

    // ==================== 风格（与 Prettier 互补，Prettier 不处理的领域） ====================

    // 优先使用 const，确实需要重新赋值才用 let
    'prefer-const': 'warn',

    // 禁止 var（项目中统一 let/const）
    'no-var': 'error',

    // 箭头函数体省略花括号时保持简练风格
    'arrow-body-style': ['warn', 'as-needed'],

    // 箭头函数参数只有一个时不强制加括号（prettier 也处理，保持一致即可）
    'arrow-parens': 'off', // 交给 prettier

    // 建议使用模板字符串而非字符串拼接
    'prefer-template': 'warn',

    // 使用对象/数组解构（不强制，部分场景直接 . 访问更清晰）
    'prefer-destructuring': 'off',

    // 模板字符串中的表达式不加空格（`${name}` 而非 `${ name }`）
    'template-curly-spacing': ['error', 'never'],

    // 后端项目保留 console 很正常（启动日志、请求日志），
    // warn 级别提醒开发者注意但不会阻断
    'no-console': ['warn', { allow: ['log', 'warn', 'error', 'debug', 'info'] }],

    // ==================== Node.js 特定 ====================

    // 禁止将 require 混在非顶层代码中（统一在文件头部引入）
    'global-require': 'warn',

    // 禁止使用 __dirname 拼接路径，推荐 path.join
    'no-path-concat': 'error',

    // 回调中必须处理 error 参数（Express 中间件常用）
    'handle-callback-err': ['warn', '^(err|error)$'],

    // 禁止使用已废弃的 API（如 url.parse、new Buffer）
    'no-deprecated-api': 'off', // Node 版本不一，暂不开启

    // ==================== Best Practices ====================

    // 强制 Error 对象必须被处理（throw 或 reject 出去的必须被 catch）
    'no-throw-literal': 'error',

    // Promise reject 必须用 Error 对象
    'prefer-promise-reject-errors': 'error',

    // 要求异步函数有 await 表达式
    'require-await': 'warn',

    // 不强制每个 return 都显式返回值
    'consistent-return': 'off',
  },
};
