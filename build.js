/**
 * 打包脚本
 * 用于将应用打包成可执行文件
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 确保pkg已安装
function ensurePkgInstalled() {
  try {
    console.log('检查pkg是否已安装...');
    execSync('npx pkg --version', { stdio: 'ignore' });
    console.log('✅ pkg已安装');
    return true;
  } catch (error) {
    console.log('⚠️ pkg未安装，正在安装...');
    try {
      execSync('npm install -g pkg', { stdio: 'inherit' });
      console.log('✅ pkg安装成功');
      return true;
    } catch (installError) {
      console.error('❌ pkg安装失败:', installError.message);
      return false;
    }
  }
}

// 创建打包配置
function createPackageConfig() {
  console.log('正在更新package.json配置...');
  
  try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // 添加pkg配置
    packageJson.bin = {
      'multi-api': './src/index.js',
      'clean-privacy': './clean-privacy.js'
    };
    
    packageJson.pkg = {
      assets: [
        'public/**/*',
        'node_modules/**/*',
        'data/**/*',
        'src/**/*'
      ],
      targets: [
        'node16-win-x64'
      ],
      outputPath: 'Multi-API'
    };
    
    // 添加打包脚本
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts.build = 'node build.js';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json更新成功');
    return true;
  } catch (error) {
    console.error('❌ 更新package.json失败:', error.message);
    return false;
  }
}

// 创建输出目录
function createDistDir() {
  const distDir = path.join(__dirname, 'Multi-API');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log('✅ 创建Multi-API目录成功');
  } else {
    console.log('✅ Multi-API目录已存在');
  }
}

// 打包主程序
function buildMainApp() {
  console.log('正在打包主程序...');
  try {
    execSync('npx pkg . --target node16-win-x64 --output Multi-API/Multi-API.exe', { stdio: 'inherit' });
    console.log('✅ 主程序打包成功');
    return true;
  } catch (error) {
    console.error('❌ 主程序打包失败:', error.message);
    return false;
  }
}

// 打包清理工具
function buildCleanTool() {
  console.log('正在打包清理工具...');
  try {
    execSync('npx pkg clean-privacy.js --target node16-win-x64 --output Multi-API/Clean-Privacy.exe', { stdio: 'inherit' });
    console.log('✅ 清理工具打包成功');
    return true;
  } catch (error) {
    console.error('❌ 清理工具打包失败:', error.message);
    return false;
  }
}

// 复制必要文件
function copyNecessaryFiles() {
  console.log('正在复制必要文件...');
  
  // 创建data目录
  const distDataDir = path.join(__dirname, 'Multi-API', 'data');
  if (!fs.existsSync(distDataDir)) {
    fs.mkdirSync(distDataDir, { recursive: true });
  }
  
  // 创建backups目录
  const distBackupsDir = path.join(__dirname, 'Multi-API', 'backups');
  if (!fs.existsSync(distBackupsDir)) {
    fs.mkdirSync(distBackupsDir, { recursive: true });
  }
  
  // 复制.env文件
  try {
    fs.copyFileSync(
      path.join(__dirname, '.env'),
      path.join(__dirname, 'Multi-API', '.env')
    );
    console.log('✅ 复制.env文件成功');
  } catch (error) {
    console.error('❌ 复制.env文件失败:', error.message);
  }
  
  // 创建空的db.json文件
  try {
    const emptyDb = {
      apiConfigs: [],
      activeConfig: null
    };
    
    fs.writeFileSync(
      path.join(distDataDir, 'db.json'),
      JSON.stringify(emptyDb, null, 2)
    );
    console.log('✅ 创建空的db.json文件成功');
  } catch (error) {
    console.error('❌ 创建空的db.json文件失败:', error.message);
  }
  
  console.log('✅ 必要文件复制完成');
  return true;
}

// 创建启动脚本
function createStartScript() {
  console.log('正在创建启动脚本...');
  
  const startBatContent = `@echo off
echo 正在启动Multi-API服务...
start "" "%~dp0Multi-API.exe"
`;
  
  try {
    fs.writeFileSync(
      path.join(__dirname, 'Multi-API', 'start.bat'),
      startBatContent
    );
    console.log('✅ 创建启动脚本成功');
    return true;
  } catch (error) {
    console.error('❌ 创建启动脚本失败:', error.message);
    return false;
  }
}

// 创建README文件
function createReadme() {
  console.log('正在创建README文件...');
  
  const readmeContent = `# Multi-API 应用

## 使用说明

1. 双击 start.bat 启动Multi-API服务
2. 打开浏览器访问 http://localhost:3000 使用应用
3. 如需清理隐私数据，请运行 Clean-Privacy.exe

## 文件说明

- Multi-API.exe: 主程序
- Clean-Privacy.exe: 隐私数据清理工具
- start.bat: 启动脚本
- data/db.json: 数据库文件
- backups/: 备份目录
`;
  
  try {
    fs.writeFileSync(
      path.join(__dirname, 'Multi-API', 'README.txt'),
      readmeContent
    );
    console.log('✅ 创建README文件成功');
    return true;
  } catch (error) {
    console.error('❌ 创建README文件失败:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log('===== 开始打包Multi-API应用 =====');
  
  if (!ensurePkgInstalled()) {
    console.error('❌ pkg安装失败，打包过程终止');
    return;
  }
  
  if (!createPackageConfig()) {
    console.error('❌ 配置更新失败，打包过程终止');
    return;
  }
  
  createDistDir();
  
  const mainAppBuilt = buildMainApp();
  const cleanToolBuilt = buildCleanTool();
  
  if (mainAppBuilt && cleanToolBuilt) {
    copyNecessaryFiles();
    createStartScript();
    createReadme();
    
    console.log('\n===== 打包完成 =====');
    console.log('打包文件位于: ' + path.join(__dirname, 'Multi-API'));
    console.log('可以将dist目录中的所有文件复制到任意位置使用');
  } else {
    console.error('❌ 打包过程中出现错误，请检查上述日志');
  }
}

// 执行主函数
main().catch(error => {
  console.error('打包过程出错:', error);
});