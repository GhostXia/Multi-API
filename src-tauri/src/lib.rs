// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use serde_json;
use std::fs::{File, OpenOptions};
use std::io::{Read, Write, BufRead, BufReader};
use std::path::PathBuf;
use std::sync::RwLock;
use once_cell::sync::Lazy;
use uuid::Uuid;
use chrono::{Local, DateTime};
use tokio::net::TcpListener;
use axum::Router;
use axum::routing::{get, post, patch, put, delete, any};
use axum::http::{Request, Response, StatusCode, HeaderMap, Uri, Method};
use axum::body::{Body, Bytes};
use hyper::{client::{Client, HttpConnector}, Request as HyperRequest};
use hyper::body::to_bytes;
use std::sync::Arc;

// API配置结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct APIConfig {
    pub id: String,
    pub name: String,
    pub endpoint: String,
    pub api_key: String,
    pub model: Option<String>,
}

// 调试日志结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DebugLog {
    pub timestamp: String,
    pub r#type: String,
    pub request: Option<serde_json::Value>,
    pub response: Option<serde_json::Value>,
}

// 数据库数据结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DBData {
    pub api_configs: Vec<APIConfig>,
    pub active_config: String,
    pub debug_mode: bool,
    pub debug_logs: Vec<DebugLog>,
    pub language: String,
}

// 数据库管理结构体
#[derive(Debug)]
pub struct DB {
    file_path: PathBuf,
    data: RwLock<DBData>,
}

// 全局数据库实例
static DB_INSTANCE: Lazy<RwLock<Option<DB>>> = Lazy::new(|| RwLock::new(None));

// 初始化数据库
#[tauri::command]
pub fn init_db() -> Result<(), String> {
    let mut instance_lock = DB_INSTANCE.write().unwrap();
    if instance_lock.is_some() {
        return Ok(()); // 已经初始化过
    }

    // 获取数据目录
    let app_dir = tauri::api::path::app_data_dir(None)
        .ok_or("无法获取应用数据目录".to_string())?;
    let data_dir = app_dir.join("multi-api");
    
    // 创建目录
    std::fs::create_dir_all(&data_dir)
        .map_err(|e| format!("创建数据目录失败: {}", e))?;
    
    let db_path = data_dir.join("db.json");
    
    // 初始化默认数据
    let default_data = DBData {
        api_configs: Vec::new(),
        active_config: String::new(),
        debug_mode: false,
        debug_logs: Vec::new(),
        language: "zh".to_string(),
    };
    
    // 检查文件是否存在，如果不存在则创建
    let exists = db_path.exists();
    let db = DB {
        file_path: db_path.clone(),
        data: RwLock::new(default_data.clone()),
    };
    
    if !exists {
        db.save().map_err(|e| format!("保存默认数据失败: {}", e))?;
    } else {
        // 加载现有数据
        db.load().map_err(|e| format!("加载数据失败: {}", e))?;
    }
    
    *instance_lock = Some(db);
    Ok(())
}

// 获取数据库实例
fn get_db_instance() -> Result<&'static DB, String> {
    let instance_lock = DB_INSTANCE.read().unwrap();
    instance_lock.as_ref().ok_or("数据库未初始化".to_string())
}

impl DB {
    // 保存数据到文件
    pub fn save(&self) -> Result<(), std::io::Error> {
        let data = self.data.read().unwrap();
        let json = serde_json::to_string_pretty(&*data)?;
        
        let mut file = File::create(&self.file_path)?;
        file.write_all(json.as_bytes())?;
        Ok(())
    }
    
    // 从文件加载数据
    pub fn load(&self) -> Result<(), std::io::Error> {
        let mut file = File::open(&self.file_path)?;
        let mut json = String::new();
        file.read_to_string(&mut json)?;
        
        let data: DBData = serde_json::from_str(&json)?;
        *self.data.write().unwrap() = data;
        Ok(())
    }
}

// 获取所有API配置
#[tauri::command]
pub fn get_all_configs() -> Result<Vec<APIConfig>, String> {
    let db = get_db_instance()?;
    let data = db.data.read().unwrap();
    Ok(data.api_configs.clone())
}

// 根据ID获取API配置
#[tauri::command]
pub fn get_config(id: &str) -> Result<Option<APIConfig>, String> {
    let db = get_db_instance()?;
    let data = db.data.read().unwrap();
    
    let config = data.api_configs.iter()
        .find(|&config| config.id == id)
        .cloned();
    
    Ok(config)
}

// 添加新的API配置
#[tauri::command]
pub fn add_config(name: &str, endpoint: &str, api_key: &str, model: Option<&str>) -> Result<String, String> {
    let db = get_db_instance()?;
    let mut data = db.data.write().unwrap();
    
    // 生成唯一ID
    let id = Uuid::new_v4().to_string();
    
    let new_config = APIConfig {
        id: id.clone(),
        name: name.to_string(),
        endpoint: endpoint.to_string(),
        api_key: api_key.to_string(),
        model: model.map(|s| s.to_string()),
    };
    
    data.api_configs.push(new_config);
    
    // 如果是第一个配置，自动设为活跃配置
    if data.api_configs.len() == 1 {
        data.active_config = id.clone();
    }
    
    db.save().map_err(|e| format!("保存配置失败: {}", e))?;
    Ok(id)
}

// 更新API配置
#[tauri::command]
pub fn update_config(id: &str, name: &str, endpoint: &str, api_key: &str, model: Option<&str>) -> Result<(), String> {
    let db = get_db_instance()?;
    let mut data = db.data.write().unwrap();
    
    let config_index = data.api_configs.iter().position(|c| c.id == id)
        .ok_or("未找到配置".to_string())?;
    
    data.api_configs[config_index] = APIConfig {
        id: id.to_string(),
        name: name.to_string(),
        endpoint: endpoint.to_string(),
        api_key: api_key.to_string(),
        model: model.map(|s| s.to_string()),
    };
    
    db.save().map_err(|e| format!("保存配置失败: {}", e))?;
    Ok(())
}

// 删除API配置
#[tauri::command]
pub fn delete_config(id: &str) -> Result<(), String> {
    let db = get_db_instance()?;
    let mut data = db.data.write().unwrap();
    
    let config_index = data.api_configs.iter().position(|c| c.id == id)
        .ok_or("未找到配置".to_string())?;
    
    // 从切片中删除该配置
    data.api_configs.remove(config_index);
    
    // 如果删除的是当前活跃配置，重置活跃配置
    if data.active_config == id {
        data.active_config = if data.api_configs.is_empty() {
            String::new()
        } else {
            data.api_configs[0].id.clone()
        };
    }
    
    db.save().map_err(|e| format!("保存配置失败: {}", e))?;
    Ok(())
}

// 设置活跃配置
#[tauri::command]
pub fn set_active_config(id: &str) -> Result<(), String> {
    let db = get_db_instance()?;
    let mut data = db.data.write().unwrap();
    
    // 验证配置是否存在
    let exists = data.api_configs.iter().any(|c| c.id == id);
    if !exists {
        return Err("未找到配置".to_string());
    }
    
    data.active_config = id.to_string();
    db.save().map_err(|e| format!("保存配置失败: {}", e))?;
    Ok(())
}

// 获取当前活跃配置
#[tauri::command]
pub fn get_active_config() -> Result<Option<APIConfig>, String> {
    let db = get_db_instance()?;
    let data = db.data.read().unwrap();
    
    if data.active_config.is_empty() {
        return Ok(None);
    }
    
    let config = data.api_configs.iter()
        .find(|&config| config.id == data.active_config)
        .cloned();
    
    Ok(config)
}

// 获取Debug模式状态
#[tauri::command]
pub fn get_debug_mode() -> Result<bool, String> {
    let db = get_db_instance()?;
    let data = db.data.read().unwrap();
    Ok(data.debug_mode)
}

// 设置Debug模式状态
#[tauri::command]
pub fn set_debug_mode(enabled: bool) -> Result<(), String> {
    let db = get_db_instance()?;
    let mut data = db.data.write().unwrap();
    data.debug_mode = enabled;
    db.save().map_err(|e| format!("保存设置失败: {}", e))?;
    Ok(())
}

// 获取当前语言设置
#[tauri::command]
pub fn get_language() -> Result<String, String> {
    let db = get_db_instance()?;
    let data = db.data.read().unwrap();
    Ok(data.language.clone())
}

// 设置语言
#[tauri::command]
pub fn set_language(lang: &str) -> Result<(), String> {
    let db = get_db_instance()?;
    let mut data = db.data.write().unwrap();
    data.language = lang.to_string();
    db.save().map_err(|e| format!("保存设置失败: {}", e))?;
    Ok(())
}

// 添加调试日志
#[tauri::command]
pub fn add_debug_log(log_type: &str, request: Option<serde_json::Value>, response: Option<serde_json::Value>) -> Result<(), String> {
    let db = get_db_instance()?;
    let mut data = db.data.write().unwrap();
    
    let timestamp = Local::now().to_rfc3339();
    let new_log = DebugLog {
        timestamp,
        r#type: log_type.to_string(),
        request,
        response,
    };
    
    data.debug_logs.push(new_log);
    db.save().map_err(|e| format!("保存日志失败: {}", e))?;
    Ok(())
}

// 检查是否为模型列表请求
fn is_models_request(path: &str) -> bool {
    path.ends_with("/models") || path == "/models"
}

// 代理请求处理函数
async fn proxy_handler(
    method: Method,
    uri: Uri,
    headers: HeaderMap,
    body: Body,
) -> Result<Response<Body>, StatusCode> {
    // 获取当前活跃配置
    let active_config = get_active_config().map_err(|_| StatusCode::BAD_REQUEST)?;
    let config = match active_config {
        Some(cfg) => cfg,
        None => return Err(StatusCode::BAD_REQUEST),
    };
    
    // 获取请求路径
    let path = uri.path();
    
    // 检查是否为模型列表请求
    if is_models_request(path) {
        return Ok(Response::builder()
            .status(StatusCode::OK)
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::to_string(&serde_json::json!({
                "object": "list",
                "data": [{
                    "id": "请在后端执行全部操作",
                    "object": "model",
                    "created": Local::now().timestamp(),
                    "owned_by": "system",
                    "permission": [],
                    "root": "请在后端执行全部操作",
                    "parent": serde_json::Value::Null,
                }]
            })).unwrap()))
            .unwrap());
    }
    
    // 构建目标URL
    let target_url = format!("{}{}", config.endpoint, path);
    
    // 读取请求体
    let body_bytes = to_bytes(body).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let mut request_body = body_bytes.to_vec();
    
    // 如果有请求体，检查并修改模型名称
    if !request_body.is_empty() && config.model.is_some() {
        if let Ok(mut json_body) = serde_json::from_slice::<serde_json::Value>(&request_body) {
            if let Some(obj) = json_body.as_object_mut() {
                if obj.contains_key("model") && config.model.is_some() {
                    obj.insert("model".to_string(), serde_json::Value::String(config.model.clone().unwrap()));
                    // 重新编码请求体
                    request_body = serde_json::to_vec(&obj).unwrap();
                }
            }
        }
    }
    
    // 创建HTTP客户端
    let client = Client::new();
    
    // 创建新的HTTP请求
    let mut hyper_request = HyperRequest::builder()
        .method(method)
        .uri(target_url)
        .body(Body::from(request_body))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // 复制请求头
    for (key, value) in headers.iter() {
        if key.as_str() != "host" {
            hyper_request.headers_mut().insert(key.clone(), value.clone());
        }
    }
    
    // 设置API密钥
    hyper_request.headers_mut().insert(
        hyper::header::AUTHORIZATION,
        hyper::header::HeaderValue::from_str(&format!("Bearer {}", config.api_key)).unwrap(),
    );
    
    // 发送请求
    let mut response = client.request(hyper_request).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // 检查是否为流式请求
    let is_stream = response.headers().get("content-type")
        .map(|v| v.to_str().unwrap_or("").contains("text/event-stream"))
        .unwrap_or(false);
    
    // 获取Debug模式状态
    let debug_mode = get_debug_mode().unwrap_or(false);
    
    if debug_mode {
        // 准备请求数据用于日志记录
        let mut request_data = serde_json::json!({
            "method": method.to_string(),
            "url": target_url,
            "headers": headers,
        });
        
        if !body_bytes.is_empty() {
            request_data["body"] = serde_json::from_slice(&body_bytes).unwrap_or(serde_json::Value::String(String::from_utf8_lossy(&body_bytes).to_string()));
        }
        
        // 处理流式响应
        if is_stream {
            // 获取响应体
            let response_body = response.body_mut();
            
            // 创建新的响应
            return Ok(Response::builder()
                .status(response.status())
                .headers(response.headers().clone())
                .body(Body::from_stream(async_stream::stream! {
                    let mut buffer = Vec::new();
                    while let Some(chunk) = response_body.data().await {
                        let chunk = chunk.unwrap();
                        buffer.extend_from_slice(&chunk);
                        
                        // 检查是否包含完整的行
                        while let Some(newline_pos) = buffer.iter().position(|&b| b == b'\n') {
                            let line = buffer.drain(0..=newline_pos).collect::<Vec<_>>();
                            yield Ok::<_, std::io::Error>(line.into());
                            
                            // 记录流式数据块
                            let chunk_data = serde_json::json!({
                                "chunk": String::from_utf8_lossy(&line),
                            });
                            let _ = add_debug_log("stream_chunk", Some(request_data.clone()), Some(chunk_data));
                        }
                    }
                    
                    // 发送剩余的数据
                    if !buffer.is_empty() {
                        yield Ok(buffer.into());
                    }
                }))
                .unwrap());
        } else {
            // 读取完整响应体
            let response_body_bytes = to_bytes(response.body_mut()).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            
            // 准备响应数据用于日志记录
            let mut response_data = serde_json::json! {
                "status": response.status().as_u16(),
                "headers": response.headers(),
            };
            
            if !response_body_bytes.is_empty() {
                response_data["body"] = serde_json::from_slice(&response_body_bytes).unwrap_or(serde_json::Value::String(String::from_utf8_lossy(&response_body_bytes).to_string()));
            }
            
            // 记录请求和响应
            let _ = add_debug_log("request_response", Some(request_data), Some(response_data));
            
            // 创建新的响应
            return Ok(Response::builder()
                .status(response.status())
                .headers(response.headers().clone())
                .body(Body::from(response_body_bytes))
                .unwrap());
        }
    }
    
    // 返回原始响应
    Ok(response.map(Body::new))
}

// 启动代理服务器
#[tauri::command]
pub async fn start_proxy_server(port: u16) -> Result<(), String> {
    // 确保数据库已初始化
    init_db()?;
    
    // 创建路由
    let router = Router::new()
        .route("/*path", any(proxy_handler));
    
    // 绑定地址
    let addr = format!("0.0.0.0:{}", port);
    let listener = TcpListener::bind(addr).await.map_err(|e| format!("绑定地址失败: {}", e))?;
    
    println!("代理服务器启动在 http://{}", addr);
    
    // 启动服务器
    axum::serve(listener, router)
        .await
        .map_err(|e| format!("服务器启动失败: {}", e))?;
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            init_db,
            get_all_configs,
            get_config,
            add_config,
            update_config,
            delete_config,
            set_active_config,
            get_active_config,
            get_debug_mode,
            set_debug_mode,
            get_language,
            set_language,
            add_debug_log,
            start_proxy_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
