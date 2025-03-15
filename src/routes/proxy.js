const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');

// 代理所有OpenAI兼容的API请求
router.all('/*', async (req, res) => {
  // 在try块外定义变量，以便在catch块中使用
  let config;
  let path;
  
  try {
    // 获取当前活跃配置
    const activeConfigId = db.get('activeConfig').value();
    
    if (!activeConfigId) {
      return res.status(400).json({ error: '没有活跃的API配置' });
    }

    config = db.get('apiConfigs')
      .find({ id: activeConfigId })
      .value();

    if (!config) {
      return res.status(400).json({ error: '活跃配置不存在' });
    }

    // 构建请求URL
    path = req.originalUrl.replace('/proxy', '');
    const url = `${config.endpoint}${path}`;

    // 设置请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    };

    // 转发请求
    const response = await axios({
      method: req.method,
      url: url,
      headers: headers,
      data: req.method !== 'GET' ? req.body : undefined,
      params: req.method === 'GET' ? req.query : undefined,
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    // 返回响应
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('代理请求错误:', error.message);
    
    // 构建详细的错误信息
    const errorDetails = {
      timestamp: new Date().toISOString(),
      endpoint: config ? config.endpoint : 'unknown',
      path: path || 'unknown',
      method: req.method,
      error: error.message
    };
    
    // 如果有响应错误，添加响应信息
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.responseData = error.response.data;
      
      // 返回错误响应，并添加额外的错误详情字段
      const responseData = {
        ...error.response.data,
        proxy_error_details: errorDetails
      };
      
      res.status(error.response.status).json(responseData);
    } else {
      // 返回错误响应
      res.status(500).json({ 
        error: '代理请求失败', 
        message: error.message,
        proxy_error_details: errorDetails
      });
    }
  }
});

module.exports = router;