const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');
const response = require('../utils/response');

// 获取指定API端点支持的模型列表
router.get('/:configId', async (req, res) => {
  try {
    const configId = req.params.configId;
    
    // 获取配置信息
    const config = db.get('apiConfigs')
      .find({ id: configId })
      .value();

    if (!config) {
      return response.notFound(res, '未找到配置');
    }

    // 构建请求URL
    const url = `${config.endpoint}/models`;

    // 设置请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    };

    // 发送请求获取模型列表
    const response = await axios({
      method: 'GET',
      url: url,
      headers: headers
    });

    // 处理响应数据，提取模型ID列表
    const models = response.data.data.map(model => ({
      id: model.id,
      name: model.id
    }));

    // 返回模型列表
    response.success(res, models, '获取模型列表成功');
  } catch (error) {
    console.error('获取模型列表错误:', error.message);
    
    // 返回错误响应
    if (error.response) {
      response.error(res, '获取模型列表失败', error.response.data, error.response.status);
    } else {
      response.error(res, '获取模型列表失败', error.message, 500);
    }
  }
});

module.exports = router;