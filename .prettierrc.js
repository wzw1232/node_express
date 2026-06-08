/**
 * Prettier 格式化配置
 *
 * 原则：Prettier 是「零配置」工具，这里的每一项覆盖都有明确理由。
 *       不加理由的选项就直接删掉——相信 Prettier 的默认值。
 *
 * @see https://prettier.io/docs/en/options.html
 */

module.exports = {
  // ---- 行宽 ----
  // 80 是业界事实标准，GitHub diff、分屏编辑、Code Review 都友好。
  // 调大（100-120）会让行过长在 side-by-side diff 中需要横向滚动。
  printWidth: 100,

  // ---- 缩进 ----
  // 2 空格是 Node.js 生态主流（Express、Koa、Fastify 均用 2）
  tabWidth: 2,
  useTabs: false, // 空格缩进，不用 Tab（跨编辑器一致性）

  // ---- 分号 ----
  // true = 所有语句末尾加分号。这是 JS 主流风格，也是 ESLint 默认。
  semi: true,

  // ---- 引号 ----
  // 单引号是 Node.js / npm 生态主流（package.json 用双引号但 .js 用单引号）
  singleQuote: true,

  // ---- 尾逗号 ----
  // "all"  = 所有可能的地方都加（含函数参数）→ git diff 更干净
  // "es5"  = 仅 ES5 支持的位置（数组、对象）加尾逗号（默认值）
  // "none" = 完全不使用尾逗号
  trailingComma: 'es5',

  // ---- 括号空格 ----
  // true = { key: value }
  // false = {key: value}
  bracketSpacing: true,

  // ---- 箭头函数括号 ----
  // "always" = (x) => x，即使只有一个参数也加括号
  // "avoid"  = x => x，单参数省略括号
  arrowParens: 'always',

  // ---- 换行符 ----
  // "lf" = Unix 风格——Git 仓库中统一使用 LF，Windows 开发者通过
  //        git config core.autocrlf true 在检出时自动转换
  endOfLine: 'lf',

  // ---- JSX（本项目不涉及 React，但保留设置以备未来） ----
  // 无 JSX 时不生效，不影响现有代码
  bracketSameLine: false, // JSX 的 > 另起一行
  singleAttributePerLine: false, // JSX 属性不强制每行一个

  // ---- 文件顶部的 vim/emacs modeline ----
  // 比如 "/* vim: set ft=javascript: */" 不加空格
  embeddedLanguageFormatting: 'auto',
};
