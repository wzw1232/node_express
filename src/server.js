// dotenv 必须最先加载，确保后续所有模块 require 时 process.env 已就绪
const dotenv = require('dotenv');
dotenv.config();

const createApp = require('./app');
const app = createApp();
const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
