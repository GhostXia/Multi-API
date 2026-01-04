import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface DebugLog {
  timestamp: string;
  type: string;
  request?: any;
  response?: any;
}

export const DebugMode: React.FC = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<DebugLog | null>(null);

  useEffect(() => {
    loadDebugMode();
  }, []);

  const loadDebugMode = async () => {
    try {
      const mode = await invoke<boolean>('get_debug_mode');
      setDebugMode(mode);
    } catch (error) {
      console.error('加载调试模式状态失败:', error);
    }
  };

  const toggleDebugMode = async () => {
    try {
      await invoke('set_debug_mode', { enabled: !debugMode });
      setDebugMode(!debugMode);
    } catch (error) {
      console.error('切换调试模式失败:', error);
      alert('切换调试模式失败');
    }
  };

  return (
    <div className="debug-mode">
      <div className="debug-header">
        <h2>调试模式</h2>
        <button
          className={debugMode ? 'active' : ''}
          onClick={toggleDebugMode}
        >
          {debugMode ? '已启用' : '已禁用'}
        </button>
      </div>

      <div className="debug-info">
        <p>
          调试模式用于记录API请求和响应的详细信息。
          启用后，所有请求和响应都会被记录下来。
        </p>
      </div>

      {debugMode && (
        <div className="debug-logs">
          <h3>调试日志</h3>
          <div className="log-list">
            {logs.length === 0 ? (
              <p className="no-logs">暂无日志记录</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="log-item"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="log-header">
                    <span className="log-type">{log.type}</span>
                    <span className="log-time">{log.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="log-detail-overlay" onClick={() => setSelectedLog(null)}>
          <div className="log-detail" onClick={(e) => e.stopPropagation()}>
            <div className="log-detail-header">
              <h3>日志详情</h3>
              <button onClick={() => setSelectedLog(null)}>关闭</button>
            </div>
            <div className="log-detail-content">
              <div className="log-section">
                <h4>类型</h4>
                <p>{selectedLog.type}</p>
              </div>
              <div className="log-section">
                <h4>时间</h4>
                <p>{selectedLog.timestamp}</p>
              </div>
              {selectedLog.request && (
                <div className="log-section">
                  <h4>请求</h4>
                  <pre>{JSON.stringify(selectedLog.request, null, 2)}</pre>
                </div>
              )}
              {selectedLog.response && (
                <div className="log-section">
                  <h4>响应</h4>
                  <pre>{JSON.stringify(selectedLog.response, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};