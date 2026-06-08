function notFoundHandler(req, res, next) {
  res.status(404).json({
    code: 404,
    message: `接口不存在: ${req.method} ${req.originalUrl}`,
    data: null,
  });
}

module.exports = notFoundHandler;
