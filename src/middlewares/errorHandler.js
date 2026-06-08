function errorHandler(err, req, res, next) {
  const statusCode = Number(err.statusCode) || 500;
  const code = Number(err.code) || 500;
  const message = err.message || '俺寄了';

  res.status(statusCode).json({
    code,
    message,
    data: null,
  });
}

module.exports = errorHandler;
