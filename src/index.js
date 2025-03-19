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
app.use(cors());
app.use(bodyParser.json({ limit: Infinity }));
app.use(bodyParser.urlencoded({ limit: Infinity, extended: true }));
app.use(express.static('public'));

// 路由
app.use('/api', apiRoutes);
app.use('/proxy', proxyRoutes);
app.use('/api/models', modelsRoutes);

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});