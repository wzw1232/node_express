const { registerUser, loginUser } = require('../services/authService');
const { ok, created } = require('../utils/response');

async function register(req, res, next) {
  try {
    const result = await registerUser(req.body || {});
    return created(res, result, 'Register success');
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await loginUser(req.body || {});
    return ok(res, result, 'Login success');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
};
