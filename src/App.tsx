import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ConfigManager } from './components/ConfigManager';
import { DebugMode } from './components/DebugMode';

interface APIConfig {
  id: string;
  name: string;
  endpoint: string;
  api_key: string;
  model?: string;
}

type Tab = 'configs' | 'debug' | 'settings';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('configs');
  const [language, setLanguage] = useState('zh');
  const [proxyPort, setProxyPort] = useState(8080);
  const [proxyRunning, setProxyRunning] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await invoke('init_db');
      
      const lang = await invoke<string>('get_language');
      setLanguage(lang);
    } catch (error) {
      console.error('初始化应用失败:', error);
    }
  };

  const handleConfigChange = () => {
    console.log('配置已更改');
  };

  const startProxy = async () => {
    try {
      await invoke('start_proxy_server', { port: proxyPort });
      setProxyRunning(true);
    } catch (error) {
      console.error('启动代理服务器失败:', error);
      alert('启动代理服务器失败');
    }
  };

  const handleLanguageChange = async (lang: string) => {
    try {
      await invoke('set_language', { lang });
      setLanguage(lang);
    } catch (error) {
      console.error('设置语言失败:', error);
      alert('设置语言失败');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Multi-API Manager</h1>
        <div className="proxy-status">
          <span className={`status-indicator ${proxyRunning ? 'running' : 'stopped'}`}>
            {proxyRunning ? '运行中' : '已停止'}
          </span>
          {!proxyRunning && (
            <button onClick={startProxy}>启动代理</button>
          )}
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'configs' ? 'active' : ''}
          onClick={() => setActiveTab('configs')}
        >
          配置管理
        </button>
        <button
          className={activeTab === 'debug' ? 'active' : ''}
          onClick={() => setActiveTab('debug')}
        >
          调试模式
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          设置
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'configs' && (
          <ConfigManager onConfigChange={handleConfigChange} />
        )}
        {activeTab === 'debug' && <DebugMode />}
        {activeTab === 'settings' && (
          <div className="settings">
            <h2>设置</h2>
            <div className="setting-item">
              <label>语言</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="setting-item">
              <label>代理端口</label>
              <input
                type="number"
                value={proxyPort}
                onChange={(e) => setProxyPort(Number(e.target.value))}
                disabled={proxyRunning}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Multi-API Manager v1.0.0</p>
      </footer>
    </div>
  );
};