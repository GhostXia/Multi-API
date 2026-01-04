// 国际化资源文件
const i18n = {
  zh: {
    // 页面标题
    title: "多API管理器",
    subtitle: "管理和切换您的API端点和密钥",
    
    // 卡片标题
    apiConfig: "API配置",
    proxyInfo: "代理信息",
    errorLogs: "错误日志",
    
    // 按钮
    addConfig: "添加配置",
    edit: "编辑",
    delete: "删除",
    activate: "激活",
    save: "保存",
    cancel: "取消",
    copy: "复制",
    refresh: "刷新",
    clearLogs: "清除日志",
    
    // 表单标签
    name: "名称",
    endpoint: "API端点",
    apiKey: "API密钥",
    defaultModel: "默认模型",
    
    // 模态框
    addApiConfig: "添加API配置",
    editApiConfig: "编辑API配置",
    
    // 连接信息
    connectionInfo: "SillyTavern连接信息",
    connectionDesc: "在SillyTavern中使用以下设置连接到此代理：",
    apiType: "API类型:",
    apiEndpoint: "API端点:",
    apiKeyDesc: "API密钥:",
    apiKeyValue: "任意值 (不会被使用)",
    
    // Debug模式
    debugMode: "Debug模式",
    debugModeDesc: "开启后，将自动保存所有通过代理的数据交互记录",
    enabled: "已开启",
    disabled: "已关闭",
    
    // 提示信息
    noConfig: "暂无配置，请添加新配置",
    noErrorLogs: "暂无错误日志",
    loading: "加载中...",
    selectModel: "请选择默认模型",
    selectEndpoint: "请先选择API端点",
    copied: "已复制到剪贴板",
    configUpdated: "配置已更新",
    configAdded: "配置已添加",
    configActivated: "配置已激活",
    configDeleted: "配置已删除",
    logsCleared: "错误日志已清除",
    debugModeOn: "Debug模式已开启",
    debugModeOff: "Debug模式已关闭",
    
    // 确认信息
    confirmDelete: "确定要删除此配置吗？",
    confirmClearLogs: "确定要清除所有错误日志吗？",
    
    // 错误信息
    fillAllFields: "请填写所有必填字段",
    operationFailed: "操作失败",
    activationFailed: "激活失败",
    getConfigFailed: "获取配置失败",
    deleteFailed: "删除失败",
    copyFailed: "复制失败",
    loadModelsFailed: "无法加载模型列表",
    fillEndpointKey: "请先填写API端点和API密钥",
    debugModeToggleFailed: "Debug模式切换失败"
  },
  en: {
    // Page titles
    title: "Multi-API Manager",
    subtitle: "Manage and switch your API endpoints and keys",
    
    // Card titles
    apiConfig: "API Configuration",
    proxyInfo: "Proxy Information",
    errorLogs: "Error Logs",
    
    // Buttons
    addConfig: "Add Config",
    edit: "Edit",
    delete: "Delete",
    activate: "Activate",
    save: "Save",
    cancel: "Cancel",
    copy: "Copy",
    refresh: "Refresh",
    clearLogs: "Clear Logs",
    
    // Form labels
    name: "Name",
    endpoint: "API Endpoint",
    apiKey: "API Key",
    defaultModel: "Default Model",
    
    // Modal
    addApiConfig: "Add API Configuration",
    editApiConfig: "Edit API Configuration",
    
    // Connection info
    connectionInfo: "SillyTavern Connection Info",
    connectionDesc: "Use the following settings in SillyTavern to connect to this proxy:",
    apiType: "API Type:",
    apiEndpoint: "API Endpoint:",
    apiKeyDesc: "API Key:",
    apiKeyValue: "Any value (will not be used)",
    
    // Debug mode
    debugMode: "Debug Mode",
    debugModeDesc: "When enabled, all data interactions through the proxy will be automatically saved",
    enabled: "Enabled",
    disabled: "Disabled",
    
    // Prompts
    noConfig: "No configurations, please add a new one",
    noErrorLogs: "No error logs",
    loading: "Loading...",
    selectModel: "Please select a default model",
    selectEndpoint: "Please select an API endpoint first",
    copied: "Copied to clipboard",
    configUpdated: "Configuration updated",
    configAdded: "Configuration added",
    configActivated: "Configuration activated",
    configDeleted: "Configuration deleted",
    logsCleared: "Error logs cleared",
    debugModeOn: "Debug mode enabled",
    debugModeOff: "Debug mode disabled",
    
    // Confirmations
    confirmDelete: "Are you sure you want to delete this configuration?",
    confirmClearLogs: "Are you sure you want to clear all error logs?",
    
    // Error messages
    fillAllFields: "Please fill in all required fields",
    operationFailed: "Operation failed",
    activationFailed: "Activation failed",
    getConfigFailed: "Failed to get configuration",
    deleteFailed: "Delete failed",
    copyFailed: "Copy failed",
    loadModelsFailed: "Failed to load model list",
    fillEndpointKey: "Please fill in API endpoint and API key first",
    debugModeToggleFailed: "Failed to toggle debug mode"
  }
};

// 导出i18n对象
window.i18n = i18n;