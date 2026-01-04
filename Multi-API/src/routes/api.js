const express = require('express');
const router = express.Router();
const db = require('../db');
const response = require('../utils/response');

// 获取所有API配置
router.get('/configs', (req, res) => {
  const configs = db.get('apiConfigs').value();
  const activeConfigId = db.get('activeConfig').value();
  
  const formattedConfigs = configs.map(config => ({
    id: config.id,
    name: config.name,
    endpoint: config.endpoint,
    isActive: config.id === activeConfigId
  }));
  
  response.success(res, formattedConfigs, '获取配置列表成功');
});

// 获取单个API配置
router.get('/configs/:id', (req, res) => {
  const config = db.get('apiConfigs')
    .find({ id: req.params.id })
    .value();

  if (!config) {
    return response.notFound(res, '未找到配置');
  }

  response.success(res, config, '获取配置成功');
});

// 创建新的API配置
router.post('/configs', (req, res) => {
  const { name, endpoint, apiKey, model } = req.body;
  const cache = require('../utils/cache');

  const id = Date.now().toString();
  const newConfig = { id, name, endpoint, apiKey, model };

  db.get('apiConfigs')
    .push(newConfig)
    .write();

  // 如果是第一个配置，自动设为活跃配置
  if (db.get('apiConfigs').size().value() === 1) {
    db.set('activeConfig', id).write();
  }

  // 清除相关缓存
  cache.clear();

  response.created(res, newConfig, '创建配置成功');
});

// 更新API配置
router.put('/configs/:id', (req, res) => {
  const { name, endpoint, apiKey, model } = req.body;
  const id = req.params.id;
  const cache = require('../utils/cache');

  const config = db.get('apiConfigs')
    .find({ id })
    .value();

  if (!config) {
    return response.notFound(res, '未找到配置');
  }

  db.get('apiConfigs')
    .find({ id })
    .assign({ name, endpoint, apiKey, model })
    .write();

  // 清除相关缓存
  cache.clear();

  response.success(res, { id, name, endpoint, apiKey, model }, '配置更新成功');
});

// 删除API配置
router.delete('/configs/:id', (req, res) => {
  const id = req.params.id;
  const cache = require('../utils/cache');

  const config = db.get('apiConfigs')
    .find({ id })
    .value();

  if (!config) {
    return response.notFound(res, '未找到配置');
  }

  db.get('apiConfigs')
    .remove({ id })
    .write();

  // 如果删除的是当前活跃配置，重置活跃配置
  if (db.get('activeConfig').value() === id) {
    const firstConfig = db.get('apiConfigs').first().value();
    db.set('activeConfig', firstConfig ? firstConfig.id : null).write();
  }

  // 清除相关缓存
  cache.clear();

  response.success(res, null, '配置删除成功');
});

// 设置活跃配置
router.post('/configs/:id/activate', (req, res) => {
  const id = req.params.id;
  const cache = require('../utils/cache');

  const config = db.get('apiConfigs')
    .find({ id })
    .value();

  if (!config) {
    return response.notFound(res, '未找到配置');
  }

  db.set('activeConfig', id).write();

  // 清除相关缓存
  cache.clear();

  response.success(res, config, '配置激活成功');
});

// 获取当前活跃配置
router.get('/active-config', (req, res) => {
  const activeConfigId = db.get('activeConfig').value();
  const cache = require('../utils/cache');
  
  if (!activeConfigId) {
    return response.notFound(res, '没有活跃配置');
  }

  // 从缓存获取活跃配置
  const cacheKey = `active_config`;
  if (cache.has(cacheKey)) {
    const config = cache.get(cacheKey);
    if (config.id === activeConfigId) {
      return response.success(res, config, '获取活跃配置成功');
    }
  }

  const config = db.get('apiConfigs')
    .find({ id: activeConfigId })
    .value();

  if (!config) {
    return response.notFound(res, '活跃配置不存在');
  }

  // 缓存活跃配置
  cache.set(cacheKey, config);

  response.success(res, config, '获取活跃配置成功');
});

// 获取Debug模式状态
router.get('/debug-mode', (req, res) => {
  const debugMode = db.get('debugMode').value();
  response.success(res, { enabled: debugMode }, '获取Debug模式状态成功');
});

// 设置Debug模式状态
router.post('/debug-mode', (req, res) => {
  const { enabled } = req.body;
  
  if (typeof enabled !== 'boolean') {
    return response.badRequest(res, '参数错误，enabled必须为布尔值');
  }
  
  // 使用DebugLogger模块管理debug会话
  const DebugLogger = require('../utils/debugLogger');
  
  if (enabled) {
    DebugLogger.startDebugSession();
  } else {
    DebugLogger.endDebugSession();
  }
  
  db.set('debugMode', enabled).write();
  response.success(res, { enabled }, 'Debug模式状态设置成功');
});

// 获取当前语言设置
router.get('/language', (req, res) => {
  const language = db.get('language').value() || 'zh';
  response.success(res, { language }, '获取语言设置成功');
});

// 设置语言
router.post('/language', (req, res) => {
  const { language } = req.body;
  
  if (typeof language !== 'string' || !['zh', 'en'].includes(language)) {
    return response.badRequest(res, '参数错误，language必须为zh或en');
  }
  
  db.set('language', language).write();
  response.success(res, { language }, '语言设置更新成功');
});

module.exports = router;