/**
 * 隐私数据清理工具
 * 用于清理应用存储的所有隐私数据，包括API密钥、配置等
 */

const fs = require('fs');
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, 'data', 'db.json');
// 调试日志目录
const debugLogsDir = path.join(__dirname, 'data', 'debug_logs');

console.log('正在清理隐私数据...');

// 清理数据库文件
try {
  if (fs.existsSync(dbPath)) {
    // 创建空的数据库文件
    const emptyDb = {
      apiConfigs: [],
      activeConfig: null,
      debugMode: false,
      language: 'zh'
    };
    fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2));
    console.log('✅ 数据库隐私数据清理完成');
  }
} catch (error) {
  console.error('❌ 清理数据库文件失败:', error.message);
}

// 清理调试日志
try {
  if (fs.existsSync(debugLogsDir)) {
    // 读取目录中的所有文件
    const files = fs.readdirSync(debugLogsDir);
    
    // 删除所有日志文件
    files.forEach(file => {
      const filePath = path.join(debugLogsDir, file);
      fs.unlinkSync(filePath);
    });
    
    console.log('✅ 调试日志清理完成');
  }
} catch (error) {
  console.error('❌ 清理调试日志失败:', error.message);
}

console.log('\n🎉 隐私数据清理完成！');
console.log('\n说明:');
console.log('1. API密钥、配置已从数据库中移除');
console.log('2. 调试日志已被清空');
console.log('3. 应用设置（如语言、调试模式）已重置为默认值');
