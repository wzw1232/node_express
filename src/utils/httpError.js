function createHttpError(statusCode, message, code = 1) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

module.exports = {
  createHttpError,
};
