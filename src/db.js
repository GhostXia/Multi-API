const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

// 确保数据目录存在
const dbDirectory = path.join(__dirname, '../data');
const fs = require('fs');
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

// 初始化数据库
const adapter = new FileSync(path.join(dbDirectory, 'db.json'));
const db = low(adapter);

// 设置默认值
db.defaults({ apiConfigs: [], activeConfig: null }).write();

module.exports = db;