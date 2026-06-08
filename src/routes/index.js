const express = require('express');
const { getHealth, getWelcome } = require('../controllers/baseController');
const authRoutes = require('./authRoutes');
const studentRoutes = require('./studentRoutes');
const { getUserInfo, getMockData, getMockMapData } = require('../controllers/userInfoController');

const router = express.Router();

/**
 * @openapi
 * /:
 *   get:
 *     summary: 欢迎接口
 *     tags: [基础]
 *     responses:
 *       200:
 *         description: 请求成功
 */
router.get('/', getWelcome);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: 健康检查
 *     tags: [基础]
 *     responses:
 *       200:
 *         description: 服务运行正常
 */
router.get('/health', getHealth);

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: 获取当前请求的 Cookie 信息
 *     tags: [用户]
 *     responses:
 *       200:
 *         description: 请求成功
 */
router.get('/info', getUserInfo);
router.get('/api/users/me', getUserInfo);
router.get('/api/dashboard/data', getMockData);
router.get('/api/dashboard-map/data', getMockMapData);
router.use('/api/auth', authRoutes);
router.use('/api/students', studentRoutes);

module.exports = router;
