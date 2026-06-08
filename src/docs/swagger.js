const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Node Express 接口文档',
      version: '1.0.0',
      description: 'RESTful 示例项目接口文档',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
      {
        url: 'http://localhost:8080',
      },
      {
        url: 'http://localhost:9527',
      },
    ],
    components: {
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer', example: 0 },
            message: { type: 'string', example: '成功' },
            data: { nullable: true },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: { type: 'string', example: 'tom' },
            email: { type: 'string', example: 'tom@example.com' },
            password: { type: 'string', example: '123456' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'tom@example.com' },
            password: { type: 'string', example: '123456' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
});

function setupSwagger(app) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = {
  setupSwagger,
};
