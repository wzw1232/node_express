const { ok } = require('../utils/response');

function getUserInfo(req, res) {
  return ok(
    res,
    {
      cookieHeader: req.headers.cookie || '',
      cookies: req.cookies || {},
    },
    'User request info'
  );
}

function getMockMapData(req, res) {
  return res.status(200).json({
    msg: undefined,
    data: {},
    code: 200,
    success: true,
  });
}
function getMockData(req, res) {
  return res.status(200).json({
    msg: undefined,
    data: {},
    code: 200,
    success: true,
  });
}

module.exports = {
  getUserInfo,
  getMockData,
  getMockMapData,
};
