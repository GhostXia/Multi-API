require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const apiRoutes = require('./routes/api');
const proxyModule = require('./routes/proxy');
const proxyRoutes = proxyModule.router;
const modelsRoutes = require('./routes/models');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
// 配置更严格的CORS策略
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 添加请求大小限制
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('public'));

// 请求验证中间件
const requestValidator = require('./middlewares/requestValidator');
app.use(requestValidator);

// 路由
app.use('/api', apiRoutes);
app.use('/proxy', proxyRoutes);
app.use('/api/models', modelsRoutes);

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});