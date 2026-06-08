const { createHttpError } = require('../utils/httpError');

// 轻量请求体校验中间件。
// 示例：
// validate({ email: { required: true }, password: { required: true, minLength: 6 } })
function validate(schema) {
  return function validateMiddleware(req, res, next) {
    const payload = req.body || {};
    const errors = [];

    Object.entries(schema).forEach(([field, rule]) => {
      const rawValue = payload[field];
      const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} 不能为空`);
        return;
      }

      if (value !== undefined && value !== null && value !== '' && rule.minLength) {
        if (String(value).length < rule.minLength) {
          errors.push(`${field} 长度不能小于 ${rule.minLength}`);
        }
      }
    });

    if (errors.length > 0) {
      return next(createHttpError(400, errors.join('; '), 40001));
    }

    return next();
  };
}

module.exports = validate;
