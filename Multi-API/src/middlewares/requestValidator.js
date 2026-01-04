// 引入统一响应格式工具
const response = require('../utils/response');

// 验证API配置ID的中间件
const validateId = (req, res, next) => {
  const { id } = req.params;
  if (id && (typeof id !== 'string' || id.length === 0)) {
    return response.badRequest(res, '无效的配置ID');
  }
  next();
};

// 验证API配置创建请求的中间件
const validateConfig = (req, res, next) => {
  if (req.path.includes('/api/configs') && (req.method === 'POST' || req.method === 'PUT')) {
    const { name, endpoint, apiKey } = req.body;
    
    if (!name || name.trim().length === 0) {
      return response.badRequest(res, '配置名称不能为空');
    }
    
    if (!endpoint || endpoint.trim().length === 0) {
      return response.badRequest(res, 'API端点不能为空');
    }
    
    // 验证URL格式
    try {
      new URL(endpoint);
    } catch (error) {
      return response.badRequest(res, 'API端点格式无效');
    }
    
    if (!apiKey || apiKey.trim().length === 0) {
      return response.badRequest(res, 'API密钥不能为空');
    }
  }
  next();
};

// 验证代理请求的中间件
const validateProxy = (req, res, next) => {
  if (req.path.startsWith('/proxy') && !req.headers['content-type'] && req.method !== 'GET' && req.body) {
    req.headers['content-type'] = 'application/json';
  }
  next();
};

// 导出所有中间件
module.exports = (req, res, next) => {
  validateId(req, res, () => {
    validateConfig(req, res, () => {
      validateProxy(req, res, next);
    });
  });
};