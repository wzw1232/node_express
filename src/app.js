const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middlewares/notFoundHandler');
const errorHandler = require('./middlewares/errorHandler');
const cookieParser = require('./middlewares/cookieParser');
const { apiLogger } = require('./middlewares/apiLog');
const { setupSwagger } = require('./docs/swagger');

function createApp() {
  const app = express();

  // 全局中间件
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser);
  app.use(apiLogger());

  // Swagger 文档地址: /api-docs
  setupSwagger(app);

  // 业务路由
  app.use(apiRoutes);

  // 兜底中间件
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
