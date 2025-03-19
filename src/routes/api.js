const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取所有API配置
router.get('/configs', (req, res) => {
  const configs = db.get('apiConfigs').value();
  res.json({
    success: true,
    data: configs.map(config => ({
      id: config.id,
      name: config.name,
      endpoint: config.endpoint,
      isActive: config.id === db.get('activeConfig').value()
    }))
  });
});

// 获取单个API配置
router.get('/configs/:id', (req, res) => {
  const config = db.get('apiConfigs')
    .find({ id: req.params.id })
    .value();

  if (!config) {
    return res.status(404).json({ success: false, message: '未找到配置' });
  }

  res.json({ success: true, data: config });
});

// 创建新的API配置
router.post('/configs', (req, res) => {
  const { name, endpoint, apiKey, model } = req.body;

  if (!name || !endpoint || !apiKey) {
    return res.status(400).json({ success: false, message: '名称、端点和API密钥为必填项' });
  }

  const id = Date.now().toString();
  const newConfig = { id, name, endpoint, apiKey, model };

  db.get('apiConfigs')
    .push(newConfig)
    .write();

  // 如果是第一个配置，自动设为活跃配置
  if (db.get('apiConfigs').size().value() === 1) {
    db.set('activeConfig', id).write();
  }

  res.status(201).json({ success: true, data: newConfig });
});

// 更新API配置
router.put('/configs/:id', (req, res) => {
  const { name, endpoint, apiKey, model } = req.body;
  const id = req.params.id;

  const config = db.get('apiConfigs')
    .find({ id })
    .value();

  if (!config) {
    return res.status(404).json({ success: false, message: '未找到配置' });
  }

  db.get('apiConfigs')
    .find({ id })
    .assign({ name, endpoint, apiKey, model })
    .write();

  res.json({ success: true, data: { id, name, endpoint, apiKey, model } });
});

// 删除API配置
router.delete('/configs/:id', (req, res) => {
  const id = req.params.id;

  const config = db.get('apiConfigs')
    .find({ id })
    .value();

  if (!config) {
    return res.status(404).json({ success: false, message: '未找到配置' });
  }

  db.get('apiConfigs')
    .remove({ id })
    .write();

  // 如果删除的是当前活跃配置，重置活跃配置
  if (db.get('activeConfig').value() === id) {
    const firstConfig = db.get('apiConfigs').first().value();
    db.set('activeConfig', firstConfig ? firstConfig.id : null).write();
  }

  res.json({ success: true, message: '配置已删除' });
});

// 设置活跃配置
router.post('/configs/:id/activate', (req, res) => {
  const id = req.params.id;

  const config = db.get('apiConfigs')
    .find({ id })
    .value();

  if (!config) {
    return res.status(404).json({ success: false, message: '未找到配置' });
  }

  db.set('activeConfig', id).write();

  res.json({ success: true, message: '配置已激活', data: config });
});

// 获取当前活跃配置
router.get('/active-config', (req, res) => {
  const activeConfigId = db.get('activeConfig').value();
  
  if (!activeConfigId) {
    return res.status(404).json({ success: false, message: '没有活跃配置' });
  }

  const config = db.get('apiConfigs')
    .find({ id: activeConfigId })
    .value();

  if (!config) {
    return res.status(404).json({ success: false, message: '活跃配置不存在' });
  }

  res.json({ success: true, data: config });
});

// 获取Debug模式状态
router.get('/debug-mode', (req, res) => {
  const debugMode = db.get('debugMode').value();
  res.json({ success: true, enabled: debugMode });
});

// 设置Debug模式状态
router.post('/debug-mode', (req, res) => {
  const { enabled } = req.body;
  const fs = require('fs');
  const path = require('path');
  
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ success: false, message: '参数错误，enabled必须为布尔值' });
  }
  
  // 获取proxy.js模块
  const proxyModule = require('./proxy');
  
  if (enabled) {
    // 开启Debug模式时，创建新的会话日志文件
    const debugDirectory = path.join(process.cwd(), 'data/debug_logs');
    if (!fs.existsSync(debugDirectory)) {
      fs.mkdirSync(debugDirectory, { recursive: true });
    }
    
    // 设置会话开始时间
    proxyModule.debugSessionStartTime = new Date();
    const timestamp = proxyModule.debugSessionStartTime.toISOString().replace(/:/g, '-');
    
    // 创建会话日志文件
    proxyModule.currentDebugLogFile = path.join(debugDirectory, `debug_session_${timestamp}.json`);
    
    // 写入会话开始记录
    const sessionStartData = {
      session_start: timestamp,
      type: 'session_start',
      message: 'Debug模式已开启'
    };
    
    fs.writeFileSync(proxyModule.currentDebugLogFile, JSON.stringify(sessionStartData, null, 2) + '\n');
  } else if (proxyModule.currentDebugLogFile) {
    // 关闭Debug模式时，写入会话结束记录
    const endTimestamp = new Date().toISOString();
    const sessionEndData = {
      session_end: endTimestamp,
      type: 'session_end',
      message: 'Debug模式已关闭',
      duration: `${Math.round((new Date() - proxyModule.debugSessionStartTime) / 1000)}秒`
    };
    
    fs.appendFileSync(proxyModule.currentDebugLogFile, JSON.stringify(sessionEndData, null, 2) + '\n');
    
    // 重置会话文件路径和开始时间
    proxyModule.currentDebugLogFile = null;
    proxyModule.debugSessionStartTime = null;
  }
  
  db.set('debugMode', enabled).write();
  res.json({ success: true, enabled: enabled });
});

// 获取当前语言设置
router.get('/language', (req, res) => {
  const language = db.get('language').value() || 'zh';
  res.json({ success: true, language: language });
});

// 设置语言
router.post('/language', (req, res) => {
  const { language } = req.body;
  
  if (typeof language !== 'string' || !['zh', 'en'].includes(language)) {
    return res.status(400).json({ success: false, message: '参数错误，language必须为zh或en' });
  }
  
  db.set('language', language).write();
  res.json({ success: true, language: language });
});

module.exports = router;