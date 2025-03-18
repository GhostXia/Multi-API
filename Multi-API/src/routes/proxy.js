const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');
const fs = require('fs');
const path = require('path');

// 确保debug日志目录存在
const debugDirectory = path.join(process.cwd(), 'data/debug_logs');
if (!fs.existsSync(debugDirectory)) {
  fs.mkdirSync(debugDirectory, { recursive: true });
}

// 检查是否为模型列表请求
function isModelsRequest(req) {
  return req.originalUrl.endsWith('/models');
}

// 代理所有OpenAI兼容的API请求
router.all('/*', async (req, res) => {
  // 在try块外定义变量，以便在catch块中使用
  let config;
  let requestPath;
  
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
          const timestamp = new Date().toISOString().replace(/:/g, '-');
          const logFileName = `debug_stream_${timestamp}.json`;
          const logFilePath = path.join(debugDirectory, logFileName);
          
          const logData = {
            timestamp: timestamp,
            type: 'stream_chunk',
            request: {
              method: req.method,
              url: url,
              headers: req.headers,
              body: req.method !== 'GET' ? req.body : undefined,
              query: req.method === 'GET' ? req.query : undefined
            },
            chunk: chunk.toString()
          };
          
          fs.appendFileSync(logFilePath, JSON.stringify(logData) + '\n');
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
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const logFileName = `debug_${timestamp}.json`;
        const logFilePath = path.join(debugDirectory, logFileName);
        
        const logData = {
          timestamp: timestamp,
          request: {
            method: req.method,
            url: url,
            headers: req.headers,
            body: req.method !== 'GET' ? req.body : undefined,
            query: req.method === 'GET' ? req.query : undefined
          },
          response: {
            status: response.status,
            data: response.data
          }
        };
        
        fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
        db.get('debugLogs').push(logData).write();
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