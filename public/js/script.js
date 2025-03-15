document.addEventListener('DOMContentLoaded', () => {
  // 初始化错误日志存储 - 使用内存变量而非localStorage
  let apiErrorLogs = [];
  
  // 元素引用
  const configList = document.getElementById('configList');
  const addConfigBtn = document.getElementById('addConfigBtn');
  const configModal = document.getElementById('configModal');
  const modalTitle = document.getElementById('modalTitle');
  const configForm = document.getElementById('configForm');
  const configId = document.getElementById('configId');
  const configName = document.getElementById('configName');
  const configEndpoint = document.getElementById('configEndpoint');
  const configApiKey = document.getElementById('configApiKey');
  const configModel = document.getElementById('configModel');
  const refreshModelBtn = document.getElementById('refreshModelBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const closeBtn = document.querySelector('.close');
  const proxyEndpoint = document.getElementById('proxyEndpoint');
  const toast = document.getElementById('toast');
  const errorLogs = document.getElementById('errorLogs');
  const clearErrorLogsBtn = document.getElementById('clearErrorLogsBtn');

  // 设置代理端点
  const baseUrl = window.location.origin;
  proxyEndpoint.textContent = `${baseUrl}/proxy`;

  // 加载配置列表
  loadConfigs();

  // 事件监听器
  addConfigBtn.addEventListener('click', () => openModal());
  closeBtn.addEventListener('click', () => closeModal());
  cancelBtn.addEventListener('click', () => closeModal());
  configForm.addEventListener('submit', handleFormSubmit);
  clearErrorLogsBtn.addEventListener('click', clearErrorLogs);
  refreshModelBtn.addEventListener('click', handleRefreshModelList);

  // 复制按钮事件
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', handleCopy);
  });
  
  // 加载错误日志
  loadErrorLogs();

  // 加载配置列表
  async function loadConfigs() {
    try {
      const response = await fetch('/api/configs');
      const data = await response.json();

      if (data.success) {
        renderConfigList(data.data);
      } else {
        showToast(data.message || '加载配置失败', true);
      }
    } catch (error) {
      console.error('加载配置错误:', error);
      showToast('加载配置失败', true);
    }
  }

  // 渲染配置列表
  function renderConfigList(configs) {
    if (!configs || configs.length === 0) {
      configList.innerHTML = '<div class="empty-message">暂无配置，请添加新配置</div>';
      return;
    }

    configList.innerHTML = '';
    configs.forEach(config => {
      const configItem = document.createElement('div');
      configItem.className = `config-item ${config.isActive ? 'active' : ''}`;
      configItem.innerHTML = `
        <div class="config-info">
          <div class="config-name">${config.name}</div>
          <div class="config-endpoint">${config.endpoint}</div>
        </div>
        <div class="config-actions">
          ${!config.isActive ? `<button class="btn btn-small btn-primary activate-btn" data-id="${config.id}">激活</button>` : ''}
          <button class="btn btn-small btn-secondary edit-btn" data-id="${config.id}">编辑</button>
          <button class="btn btn-small btn-danger delete-btn" data-id="${config.id}">删除</button>
        </div>
      `;
      configList.appendChild(configItem);
    });

    // 添加事件监听器
    document.querySelectorAll('.activate-btn').forEach(btn => {
      btn.addEventListener('click', handleActivate);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', handleEdit);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', handleDelete);
    });
  }

  // 打开模态框
  function openModal(config = null) {
    modalTitle.textContent = config ? '编辑API配置' : '添加API配置';
    configId.value = config ? config.id : '';
    configName.value = config ? config.name : '';
    configEndpoint.value = config ? config.endpoint : '';
    configApiKey.value = config ? config.apiKey : '';
    
    // 清空模型下拉列表
    configModel.innerHTML = '<option value="">请先选择API端点</option>';
    
    configModal.style.display = 'block';
    
    // 如果是编辑模式，加载模型列表
    if (config && config.id) {
      loadModelList(config.id, config.model);
    }
    
    // 监听API端点和API密钥的变化
    configEndpoint.addEventListener('change', handleEndpointChange);
    configApiKey.addEventListener('change', handleEndpointChange);
  }

  // 关闭模态框
  function closeModal() {
    configModal.style.display = 'none';
    configForm.reset();
  }

  // 处理表单提交
  async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
      name: configName.value.trim(),
      endpoint: configEndpoint.value.trim(),
      apiKey: configApiKey.value.trim(),
      model: configModel.value.trim() || null
    };

    if (!formData.name || !formData.endpoint || !formData.apiKey) {
      showToast('请填写所有必填字段', true);
      return;
    }

    try {
      const isEdit = configId.value !== '';
      const url = isEdit ? `/api/configs/${configId.value}` : '/api/configs';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showToast(isEdit ? '配置已更新' : '配置已添加');
        closeModal();
        loadConfigs();
      } else {
        showToast(data.message || '操作失败', true);
      }
    } catch (error) {
      console.error('提交表单错误:', error);
      showToast('操作失败', true);
    }
  }

  // 处理激活配置
  async function handleActivate(e) {
    const id = e.target.dataset.id;

    try {
      const response = await fetch(`/api/configs/${id}/activate`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        showToast('配置已激活');
        loadConfigs();
      } else {
        showToast(data.message || '激活失败', true);
      }
    } catch (error) {
      console.error('激活配置错误:', error);
      showToast('激活失败', true);
    }
  }

  // 处理编辑配置
  async function handleEdit(e) {
    const id = e.target.dataset.id;

    try {
      const response = await fetch(`/api/configs/${id}`);
      const data = await response.json();

      if (data.success) {
        openModal(data.data);
      } else {
        showToast(data.message || '获取配置失败', true);
      }
    } catch (error) {
      console.error('获取配置错误:', error);
      showToast('获取配置失败', true);
    }
  }

  // 处理删除配置
  async function handleDelete(e) {
    const id = e.target.dataset.id;
    if (!confirm('确定要删除此配置吗？')) return;

    try {
      const response = await fetch(`/api/configs/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showToast('配置已删除');
        loadConfigs();
      } else {
        showToast(data.message || '删除失败', true);
      }
    } catch (error) {
      console.error('删除配置错误:', error);
      showToast('删除失败', true);
    }
  }

  // 处理复制
  function handleCopy(e) {
    const id = e.target.dataset.copy;
    const text = document.getElementById(id).textContent;
    navigator.clipboard.writeText(text)
      .then(() => showToast('已复制到剪贴板'))
      .catch(() => showToast('复制失败', true));
  }

  // 处理刷新模型列表
  function handleRefreshModelList() {
    // 如果是编辑模式，使用当前配置ID
    if (configId.value) {
      loadModelList(configId.value);
    } 
    // 否则创建临时ID
    else if (configEndpoint.value.trim() && configApiKey.value.trim()) {
      const tempId = 'temp_' + Date.now();
      loadModelList(tempId);
    } else {
      showToast('请先填写API端点和API密钥', true);
    }
  }
  
  // 处理API端点变化
  function handleEndpointChange() {
    // 只有当端点和API密钥都有值时才加载模型列表
    if (configEndpoint.value.trim() && configApiKey.value.trim()) {
      // 创建临时ID用于获取模型列表
      const tempId = 'temp_' + Date.now();
      loadModelList(tempId);
    }
  }

  // 加载模型列表
  async function loadModelList(configId, selectedModel = null) {
    // 显示加载中
    const modelLoading = document.getElementById('modelLoading');
    modelLoading.style.display = 'block';
    
    // 清空模型下拉列表，只保留默认选项
    configModel.innerHTML = '<option value="">加载中...</option>';
    
    try {
      // 如果是临时ID，需要先创建临时配置
      let url = `/api/models/${configId}`;
      
      if (configId.startsWith('temp_')) {
        // 创建临时配置对象
        const tempConfig = {
          endpoint: configEndpoint.value.trim(),
          apiKey: configApiKey.value.trim()
        };
        
        // 发送POST请求创建临时配置
        const tempResponse = await fetch('/api/configs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: '临时配置',
            ...tempConfig
          })
        });
        
        const tempData = await tempResponse.json();
        
        if (!tempData.success) {
          throw new Error(tempData.message || '创建临时配置失败');
        }
        
        // 使用返回的配置ID
        url = `/api/models/${tempData.data.id}`;
        
        // 获取模型列表后删除临时配置
        setTimeout(async () => {
          try {
            await fetch(`/api/configs/${tempData.data.id}`, {
              method: 'DELETE'
            });
          } catch (error) {
            console.error('删除临时配置错误:', error);
          }
        }, 5000);
      }
      
      // 获取模型列表
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '获取模型列表失败');
      }
      
      // 更新模型下拉列表
      configModel.innerHTML = '<option value="">请选择默认模型</option>';
      
      data.data.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        option.selected = model.id === selectedModel;
        configModel.appendChild(option);
      });
    } catch (error) {
      console.error('加载模型列表错误:', error);
      configModel.innerHTML = '<option value="">无法加载模型列表</option>';
    } finally {
      // 隐藏加载中
      modelLoading.style.display = 'none';
    }
  }

  // 显示提示框
  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.className = isError ? 'toast error' : 'toast';
    toast.style.display = 'block';
    // 如果是错误，记录到错误日志
    if (isError) {
      logError(message);
    }

    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }
  
  // 记录错误日志
  function logError(message, details = '') {
    apiErrorLogs.unshift({
      time: new Date().toISOString(),
      message: message,
      details: details
    });
    
    // 限制日志数量，最多保存50条
    if (apiErrorLogs.length > 50) {
      apiErrorLogs.pop();
    }
    
    loadErrorLogs();
  }
  
  // 加载错误日志
  function loadErrorLogs() {
    if (apiErrorLogs.length === 0) {
      errorLogs.innerHTML = '<div class="empty-message">暂无错误日志</div>';
      return;
    }
    
    errorLogs.innerHTML = '';
    apiErrorLogs.forEach(log => {
      const logItem = document.createElement('div');
      logItem.className = 'error-log-item';
      
      const time = new Date(log.time);
      const formattedTime = `${time.toLocaleDateString()} ${time.toLocaleTimeString()}`;
      
      logItem.innerHTML = `
        <div class="error-log-time">${formattedTime}</div>
        <div class="error-log-message">${log.message}</div>
        ${log.details ? `<div class="error-log-details">${log.details}</div>` : ''}
      `;
      
      errorLogs.appendChild(logItem);
    });
  }
  
  // 清除错误日志
  function clearErrorLogs() {
    if (confirm('确定要清除所有错误日志吗？')) {
      apiErrorLogs = [];
      loadErrorLogs();
      showToast('错误日志已清除');
    }
  }
});