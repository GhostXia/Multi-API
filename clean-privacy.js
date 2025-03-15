/**
 * 隐私数据清理脚本
 * 此脚本用于清理包含个人隐私信息的文件
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 定义包含隐私数据的文件路径
const DB_FILE_PATH = path.join(__dirname, 'data', 'db.json');
const BACKUP_DIR = path.join(__dirname, 'backups');
const BACKUP_FILE_PATH = path.join(BACKUP_DIR, `db_backup_${Date.now()}.json`);

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 备份原始数据文件
 */
function backupFile() {
  // 确保备份目录存在
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  // 复制文件到备份目录
  if (fs.existsSync(DB_FILE_PATH)) {
    fs.copyFileSync(DB_FILE_PATH, BACKUP_FILE_PATH);
    console.log(`✅ 原始数据已备份到: ${BACKUP_FILE_PATH}`);
    return true;
  } else {
    console.log(`❌ 数据库文件不存在: ${DB_FILE_PATH}`);
    return false;
  }
}

/**
 * 清理数据库文件中的隐私信息
 */
function cleanDbFile() {
  try {
    // 读取数据库文件
    const dbData = JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf8'));
    
    // 清理API配置中的敏感信息
    if (dbData.apiConfigs && Array.isArray(dbData.apiConfigs)) {
      dbData.apiConfigs = dbData.apiConfigs.map(config => {
        return {
          ...config,
          apiKey: '********', // 替换API密钥为占位符
        };
      });
    }
    
    // 写入清理后的数据
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dbData, null, 2));
    console.log('✅ 数据库文件中的隐私信息已清理');
    return true;
  } catch (error) {
    console.error('❌ 清理数据库文件失败:', error.message);
    return false;
  }
}

/**
 * 创建空的数据库结构
 */
function createEmptyDb() {
  try {
    const emptyDb = {
      apiConfigs: [],
      activeConfig: null
    };
    
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(emptyDb, null, 2));
    console.log('✅ 已创建空的数据库结构');
    return true;
  } catch (error) {
    console.error('❌ 创建空数据库失败:', error.message);
    return false;
  }
}

/**
 * 恢复备份文件
 */
function restoreBackup(backupPath) {
  try {
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, DB_FILE_PATH);
      console.log(`✅ 已从备份恢复: ${backupPath}`);
      return true;
    } else {
      console.log(`❌ 备份文件不存在: ${backupPath}`);
      return false;
    }
  } catch (error) {
    console.error('❌ 恢复备份失败:', error.message);
    return false;
  }
}

/**
 * 列出所有备份文件
 */
function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      console.log('没有找到备份目录');
      return [];
    }
    
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('db_backup_'))
      .map(file => path.join(BACKUP_DIR, file));
    
    if (backups.length === 0) {
      console.log('没有找到备份文件');
    } else {
      console.log('可用的备份文件:');
      backups.forEach((backup, index) => {
        const stats = fs.statSync(backup);
        const date = new Date(stats.mtime);
        console.log(`${index + 1}. ${path.basename(backup)} - ${date.toLocaleString()}`);
      });
    }
    
    return backups;
  } catch (error) {
    console.error('❌ 列出备份失败:', error.message);
    return [];
  }
}

/**
 * 清空所有数据及备份
 */
function cleanAllData() {
  try {
    // 清空数据库文件
    if (fs.existsSync(DB_FILE_PATH)) {
      createEmptyDb();
    }
    
    // 清空备份目录
    if (fs.existsSync(BACKUP_DIR)) {
      const backups = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('db_backup_'))
        .map(file => path.join(BACKUP_DIR, file));
      
      if (backups.length > 0) {
        backups.forEach(backup => {
          fs.unlinkSync(backup);
        });
        console.log(`✅ 已清空 ${backups.length} 个备份文件`);
      } else {
        console.log('备份目录已经是空的');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ 清空所有数据失败:', error.message);
    return false;
  }
}

/**
 * 主菜单
 */
function showMenu() {
  console.log('\n隐私数据清理工具');
  console.log('==================');
  console.log('1. 备份并完全清空数据');
  console.log('2. 恢复备份');
  console.log('3. 清空全部数据及备份');
  console.log('4. 退出');
  
  rl.question('请选择操作 [1-4]: ', (answer) => {
    switch (answer.trim()) {
      case '1':
        if (backupFile()) {
          createEmptyDb();
        }
        showMenu();
        break;
      case '2':
        const backups = listBackups();
        if (backups.length > 0) {
          rl.question('请输入要恢复的备份编号: ', (index) => {
            const backupIndex = parseInt(index) - 1;
            if (backupIndex >= 0 && backupIndex < backups.length) {
              restoreBackup(backups[backupIndex]);
            } else {
              console.log('❌ 无效的备份编号');
            }
            showMenu();
          });
        } else {
          showMenu();
        }
        break;
      case '3':
        rl.question('确定要清空所有数据及备份吗? (y/n): ', (confirm) => {
          if (confirm.toLowerCase() === 'y') {
            cleanAllData();
          } else {
            console.log('操作已取消');
          }
          showMenu();
        });
        break;
      case '4':
        console.log('再见!');
        rl.close();
        break;
      default:
        console.log('❌ 无效的选择，请重试');
        showMenu();
    }
  });
}

// 启动程序
console.log('欢迎使用隐私数据清理工具');
console.log('此工具将帮助您管理数据库文件及其备份');
console.log('主要处理的文件: data/db.json (包含API密钥等敏感信息)');
console.log('注意: 清理操作前会自动创建备份');

showMenu();