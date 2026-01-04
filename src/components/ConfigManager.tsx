import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface APIConfig {
  id: string;
  name: string;
  endpoint: string;
  api_key: string;
  model?: string;
}

interface ConfigManagerProps {
  onConfigChange: () => void;
}

export const ConfigManager: React.FC<ConfigManagerProps> = ({ onConfigChange }) => {
  const [configs, setConfigs] = useState<APIConfig[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string>('');
  const [editingConfig, setEditingConfig] = useState<APIConfig | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadConfigs = async () => {
    try {
      const result = await invoke<APIConfig[]>('get_all_configs');
      setConfigs(result);
      const activeConfig = await invoke<APIConfig | null>('get_active_config');
      if (activeConfig) {
        setActiveConfigId(activeConfig.id);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleAdd = async (config: Omit<APIConfig, 'id'>) => {
    try {
      await invoke('add_config', {
        name: config.name,
        endpoint: config.endpoint,
        apiKey: config.api_key,
        model: config.model || null,
      });
      setShowForm(false);
      await loadConfigs();
      onConfigChange();
    } catch (error) {
      console.error('添加配置失败:', error);
      alert('添加配置失败');
    }
  };

  const handleUpdate = async (config: APIConfig) => {
    try {
      await invoke('update_config', {
        id: config.id,
        name: config.name,
        endpoint: config.endpoint,
        apiKey: config.api_key,
        model: config.model || null,
      });
      setEditingConfig(null);
      await loadConfigs();
      onConfigChange();
    } catch (error) {
      console.error('更新配置失败:', error);
      alert('更新配置失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此配置吗？')) return;
    
    try {
      await invoke('delete_config', { id });
      await loadConfigs();
      onConfigChange();
    } catch (error) {
      console.error('删除配置失败:', error);
      alert('删除配置失败');
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await invoke('set_active_config', { id });
      setActiveConfigId(id);
      onConfigChange();
    } catch (error) {
      console.error('设置活跃配置失败:', error);
      alert('设置活跃配置失败');
    }
  };

  return (
    <div className="config-manager">
      <div className="config-header">
        <h2>API配置管理</h2>
        <button onClick={() => setShowForm(true)}>添加配置</button>
      </div>

      {showForm && (
        <ConfigForm
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingConfig && (
        <ConfigForm
          config={editingConfig}
          onSave={handleUpdate}
          onCancel={() => setEditingConfig(null)}
        />
      )}

      <div className="config-list">
        {configs.map((config) => (
          <div
            key={config.id}
            className={`config-item ${config.id === activeConfigId ? 'active' : ''}`}
          >
            <div className="config-info">
              <h3>{config.name}</h3>
              <p>端点: {config.endpoint}</p>
              {config.model && <p>模型: {config.model}</p>}
            </div>
            <div className="config-actions">
              {config.id !== activeConfigId && (
                <button onClick={() => handleSetActive(config.id)}>
                  设为活跃
                </button>
              )}
              <button onClick={() => setEditingConfig(config)}>编辑</button>
              <button onClick={() => handleDelete(config.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ConfigFormProps {
  config?: APIConfig;
  onSave: (config: APIConfig | Omit<APIConfig, 'id'>) => void;
  onCancel: () => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ config, onSave, onCancel }) => {
  const [name, setName] = useState(config?.name || '');
  const [endpoint, setEndpoint] = useState(config?.endpoint || '');
  const [apiKey, setApiKey] = useState(config?.api_key || '');
  const [model, setModel] = useState(config?.model || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !endpoint || !apiKey) {
      alert('请填写所有必填字段');
      return;
    }

    if (config) {
      onSave({ ...config, name, endpoint, api_key: apiKey, model: model || undefined });
    } else {
      onSave({ name, endpoint, api_key: apiKey, model: model || undefined });
    }
  };

  return (
    <div className="config-form-overlay">
      <div className="config-form">
        <h3>{config ? '编辑配置' : '添加配置'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="配置名称"
            />
          </div>
          <div className="form-group">
            <label>端点 *</label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div className="form-group">
            <label>API密钥 *</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>
          <div className="form-group">
            <label>模型（可选）</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-3.5-turbo"
            />
          </div>
          <div className="form-actions">
            <button type="submit">保存</button>
            <button type="button" onClick={onCancel}>取消</button>
          </div>
        </form>
      </div>
    </div>
  );
};