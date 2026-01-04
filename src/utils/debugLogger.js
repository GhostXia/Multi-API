const fs = require('fs');
const path = require('path');
const db = require('../db');

// 确保debug日志目录存在
const debugDirectory = path.join(process.cwd(), 'data/debug_logs');
if (!fs.existsSync(debugDirectory)) {
  fs.mkdirSync(debugDirectory, { recursive: true });
}

// 当前debug会话的日志文件路径
let currentDebugLogFile = null;
// 当前debug会话的开始时间
let debugSessionStartTime = null;

class DebugLogger {
  // 开启Debug模式
  static startDebugSession() {
    // 设置会话开始时间
    debugSessionStartTime = new Date();
    const timestamp = debugSessionStartTime.toISOString().replace(/:/g, '-');
    
    // 创建会话日志文件
    currentDebugLogFile = path.join(debugDirectory, `debug_session_${timestamp}.json`);
    
    // 写入会话开始记录
    const sessionStartData = {
      session_start: timestamp,
      type: 'session_start',
      message: 'Debug模式已开启'
    };
    
    fs.writeFileSync(currentDebugLogFile, JSON.stringify(sessionStartData, null, 2) + '\n');
  }

  // 关闭Debug模式
  static endDebugSession() {
    if (currentDebugLogFile) {
      // 关闭Debug模式时，写入会话结束记录
      const endTimestamp = new Date().toISOString();
      const sessionEndData = {
        session_end: endTimestamp,
        type: 'session_end',
        message: 'Debug模式已关闭',
        duration: `${Math.round((new Date() - debugSessionStartTime) / 1000)}秒`
      };
      
      fs.appendFileSync(currentDebugLogFile, JSON.stringify(sessionEndData, null, 2) + '\n');
      
      // 重置会话文件路径和开始时间
      currentDebugLogFile = null;
      debugSessionStartTime = null;
    }
  }

  // 记录请求和响应日志
  static logRequestResponse(req, res, url, response) {
    if (!currentDebugLogFile) return;
    
    const timestamp = new Date().toISOString();
    
    const logData = {
      timestamp: timestamp,
      type: 'request_response',
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
    
    fs.appendFileSync(currentDebugLogFile, JSON.stringify(logData, null, 2) + '\n');
    db.get('debugLogs').push(logData).write();
  }

  // 记录流式数据块
  static logStreamChunk(req, url, chunk) {
    if (!currentDebugLogFile) return;
    
    const timestamp = new Date().toISOString();
    
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
    
    fs.appendFileSync(currentDebugLogFile, JSON.stringify(logData) + '\n');
  }

  // 获取当前会话状态
  static getSessionStatus() {
    return {
      isActive: !!currentDebugLogFile,
      sessionStartTime: debugSessionStartTime,
      logFile: currentDebugLogFile
    };
  }
}

module.exports = DebugLogger;