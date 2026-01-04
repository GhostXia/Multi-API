const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');
const DebugLogger = require('../utils/debugLogger');

// 检查是否为模型列表请求
function isModelsRequest(req) {
  return req.originalUrl.endsWith('/models');
}

// 代理所有OpenAI兼容的API请求
router.use('/', async (req, res, next) => {
  // 在try块外定义变量，以便在catch块中使用
  let config;
  let requestPath;
  
  try {
      // 获取当前活跃配置
      const activeConfigId = db.get('activeConfig').value();
      
      if (!activeConfigId) {
        return res.status(400).json({ error: '没有活跃的API配置' });
      }

      // 从缓存获取配置
      const cache = require('../utils/cache');
      const cacheKey = `config_${activeConfigId}`;
      
      if (cache.has(cacheKey)) {
        config = cache.get(cacheKey);
      } else {
        config = db.get('apiConfigs')
          .find({ id: activeConfigId })
          .value();
        
        // 缓存配置
        if (config) {
          cache.set(cacheKey, config);
        }
      }

    if (!config) {
      return res.status(400).json({ error: '活跃配置不存在' });
    }

    // 检查是否为模型列表请求
    if (isModelsRequest(req)) {
      return res.json({
        "object": "list",
        "data": [{
          "id": "请在后端执行全部操作",
          "object": "model",
          "created": Date.now(),
          "owned_by": "system",
          "permission": [],
          "root": "请在后端执行全部操作",
          "parent": null
        }]
      });
    }

    // 构建请求URL
    requestPath = req.originalUrl.replace('/proxy', '');
    const url = `${config.endpoint}${requestPath}`;

    // 检查并修改请求体中的模型名称
    if (req.body && req.body.model && config.model) {
      req.body.model = config.model;
    }

    // 设置请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    };

    // 检查是否为流式请求
    const isStreamRequest = req.headers['accept'] === 'text/event-stream' || 
                           (req.body && req.body.stream === true);

    // 设置请求配置
    const axiosConfig = {
      method: req.method,
      url: url,
      headers: headers,
      data: req.method !== 'GET' ? req.body : undefined,
      params: req.method === 'GET' ? req.query : undefined,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      responseType: isStreamRequest ? 'stream' : 'json'
    };

    // 发送请求
    const response = await axios(axiosConfig);

    // 处理流式响应
    if (isStreamRequest) {
      // 设置流式响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 转发流式数据
      response.data.on('data', (chunk) => {
        res.write(chunk);

        // 如果Debug模式开启，记录流式数据块
        const debugMode = db.get('debugMode').value();
        if (debugMode) {
          DebugLogger.logStreamChunk(req, url, chunk);
        }
      });

      response.data.on('end', () => {
        res.end();
      });

      // 错误处理
      response.data.on('error', (error) => {
        console.error('流式传输错误:', error);
        res.end();
      });
    } else {
      // 处理普通响应
      const debugMode = db.get('debugMode').value();
      if (debugMode) {
        DebugLogger.logRequestResponse(req, res, url, response);
      }
      
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error('代理请求错误:', error.message);
    
    // 构建详细的错误信息
    const errorDetails = {
      timestamp: new Date().toISOString(),
      endpoint: config ? config.endpoint : 'unknown',
      path: requestPath || 'unknown',
      method: req.method,
      error: error.message
    };
    
    // 如果有响应错误，添加响应信息
    if (error.response) {
      errorDetails.status = error.response.status;
      
      // 使用自定义replacer函数处理可能的循环引用
      const safeReplacer = (key, value) => {
        // 排除可能导致循环引用的对象，如Socket、TLSSocket等
        if (value && typeof value === 'object' && 
            (value.constructor && ['Socket', 'TLSSocket'].includes(value.constructor.name))) {
          return '[Socket Object]';
        }
        return value;
      };
      
      // 安全地获取响应数据
      try {
        errorDetails.responseData = JSON.parse(JSON.stringify(error.response.data, safeReplacer));
      } catch (jsonError) {
        errorDetails.responseData = { error: '无法序列化响应数据', message: jsonError.message };
      }
      
      // 返回错误响应，并添加额外的错误详情字段
      let responseData;
      try {
        responseData = {
          ...JSON.parse(JSON.stringify(error.response.data, safeReplacer)),
          proxy_error_details: errorDetails
        };
      } catch (jsonError) {
        responseData = {
          error: '代理请求失败',
          message: error.message,
          proxy_error_details: errorDetails
        };
      }
      
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

// 导出路由
module.exports = {
  router
};