const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');

// 获取指定API端点支持的模型列表
router.get('/:configId', async (req, res) => {
  try {
    const configId = req.params.configId;
    
    // 获取配置信息
    const config = db.get('apiConfigs')
      .find({ id: configId })
      .value();

    if (!config) {
      return res.status(404).json({ success: false, message: '未找到配置' });
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
    res.json({ success: true, data: models });
  } catch (error) {
    console.error('获取模型列表错误:', error.message);
    
    // 返回错误响应
    if (error.response) {
      res.status(error.response.status).json({
        success: false, 
        message: '获取模型列表失败', 
        error: error.response.data
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: '获取模型列表失败', 
        error: error.message 
      });
    }
  }
});

module.exports = router;