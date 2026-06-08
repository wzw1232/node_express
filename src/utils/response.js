// 统一 REST 响应工具：
// code: 0 表示成功，非 0 表示业务或系统错误。
function sendResponse(res, { statusCode = 200, code = 0, message = 'OK', data = null }) {
  return res.status(statusCode).json({
    code,
    message,
    data,
  });
}

// 200 成功响应，常用于查询/更新类接口。
function ok(res, data = null, message = 'OK') {
  return sendResponse(res, {
    statusCode: 200,
    code: 0,
    message,
    data,
  });
}

// 201 创建成功响应，常用于新增类接口。
function created(res, data = null, message = 'Created') {
  return sendResponse(res, {
    statusCode: 201,
    code: 0,
    message,
    data,
  });
}

module.exports = {
  sendResponse,
  ok,
  created,
};
