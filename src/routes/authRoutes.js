const express = require('express');
const { register, login } = require('../controllers/authController');
const validate = require('../middlewares/validate');

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: 注册成功
 */
router.post(
  '/register',
  validate({
    username: { required: true },
    email: { required: true },
    password: { required: true, minLength: 6 },
  }),
  register
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 登录成功
 */
router.post(
  '/login',
  validate({
    email: { required: true },
    password: { required: true },
  }),
  login
);

module.exports = router;
