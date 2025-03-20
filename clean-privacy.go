package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"multi-api/config"
	"multi-api/models"
)

// 定义包含隐私数据的文件路径
var (
	backupDir string
)

// 初始化配置和路径
func init() {
	// 获取应用配置
	cfg := config.GetConfig()
	
	// 设置备份目录
	backupDir = filepath.Join(".", "backups")
	
	// 确保备份目录存在
	os.MkdirAll(backupDir, 0755)
}

// 备份原始数据文件
func backupFile() bool {
	// 获取应用配置
	cfg := config.GetConfig()
	
	// 确保备份目录存在
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		fmt.Printf("❌ 创建备份目录失败: %s\n", err.Error())
		return false
	}
	
	// 生成备份文件名
	timestamp := time.Now().UnixNano()
	backupFilePath := filepath.Join(backupDir, fmt.Sprintf("db_backup_%d.json", timestamp))
	
	// 复制文件到备份目录
	if _, err := os.Stat(cfg.DBPath); err == nil {
		srcFile, err := os.Open(cfg.DBPath)
		if err != nil {
			fmt.Printf("❌ 打开数据库文件失败: %s\n", err.Error())
			return false
		}
		defer srcFile.Close()
		
		dstFile, err := os.Create(backupFilePath)
		if err != nil {
			fmt.Printf("❌ 创建备份文件失败: %s\n", err.Error())
			return false
		}
		defer dstFile.Close()
		
		_, err = io.Copy(dstFile, srcFile)
		if err != nil {
			fmt.Printf("❌ 复制文件失败: %s\n", err.Error())
			return false
		}
		
		fmt.Printf("✅ 原始数据已备份到: %s\n", backupFilePath)
		return true
	} else {
		fmt.Printf("❌ 数据库文件不存在: %s\n", cfg.DBPath)
		return false
	}
}

// 清理数据库文件中的隐私信息
func cleanDbFile() bool {
	// 获取应用配置
	cfg := config.GetConfig()
	
	// 读取数据库文件
	file, err := os.Open(cfg.DBPath)
	if err != nil {
		fmt.Printf("❌ 打开数据库文件失败: %s\n", err.Error())
		return false
	}
	defer file.Close()
	
	// 解析JSON数据
	var dbData models.DBData
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&dbData); err != nil {
		fmt.Printf("❌ 解析数据库文件失败: %s\n", err.Error())
		return false
	}
	
	// 清理API配置中的敏感信息
	for i := range dbData.APIConfigs {
		dbData.APIConfigs[i].APIKey = "********" // 替换API密钥为占位符
	}
	
	// 写入清理后的数据
	outFile, err := os.Create(cfg.DBPath)
	if err != nil {
		fmt.Printf("❌ 创建输出文件失败: %s\n", err.Error())
		return false
	}
	defer outFile.Close()
	
	encoder := json.NewEncoder(outFile)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(dbData); err != nil {
		fmt.Printf("❌ 写入数据失败: %s\n", err.Error())
		return false
	}
	
	fmt.Println("✅ 数据库文件中的隐私信息已清理")
	return true
}

// 创建空的数据库结构
func createEmptyDb() bool {
	// 获取应用配置
	cfg := config.GetConfig()
	
	// 创建空的数据结构
	emptyDb := models.DBData{
		APIConfigs:   []models.APIConfig{},
		ActiveConfig: "",
		DebugMode:    false,
		DebugLogs:    []models.DebugLog{},
		Language:     "zh", // 默认语言设置为中文
	}
	
	// 写入文件
	file, err := os.Create(cfg.DBPath)
	if err != nil {
		fmt.Printf("❌ 创建数据库文件失败: %s\n", err.Error())
		return false
	}
	defer file.Close()
	
	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(emptyDb); err != nil {
		fmt.Printf("❌ 写入数据失败: %s\n", err.Error())
		return false
	}
	
	fmt.Println("✅ 已创建空的数据库结构")
	return true
}
}

// 列出所有备份文件
func listBackups() []string {
	backups := []string{}

	if _, err := os.Stat(backupDir); os.IsNotExist(err) {
		fmt.Println("没有找到备份目录")
		return backups
	}

	files, err := os.ReadDir(backupDir)
	if err != nil {
		fmt.Printf("❌ 列出备份失败: %s\n", err.Error())
		return backups
	}

	for _, file := range files {
		if !file.IsDir() && strings.HasPrefix(file.Name(), "db_backup_") {
			backupPath := filepath.Join(backupDir, file.Name())
			backups = append(backups, backupPath)
		}
	}

	if len(backups) == 0 {
		fmt.Println("没有找到备份文件")
	} else {
		fmt.Println("可用的备份文件:")
		for i, backup := range backups {
			fileInfo, err := os.Stat(backup)
			if err != nil {
				continue
			}
			fmt.Printf("%d. %s - %s\n", i+1, filepath.Base(backup), fileInfo.ModTime().Format("2006-01-02 15:04:05"))
		}
	}

	return backups
}

// 清理Debug日志文件
func cleanDebugLogs() bool {
	// 获取应用配置
	cfg := config.GetConfig()
	
	// 清空调试日志目录
	if err := os.RemoveAll(cfg.DebugLogsDir); err != nil {
		fmt.Printf("❌ 清理调试日志目录失败: %s\n", err.Error())
		return false
	}
	
	// 重新创建目录
	if err := os.MkdirAll(cfg.DebugLogsDir, 0755); err != nil {
		fmt.Printf("❌ 创建调试日志目录失败: %s\n", err.Error())
		return false
	}
	
	fmt.Println("✅ 调试日志已清理完成")
	return true
}

// 清空所有数据及备份
func cleanAllData() bool {
	// 获取应用配置
	cfg := config.GetConfig()

	// 清空数据库文件
	if _, err := os.Stat(cfg.DBPath); err == nil {
		if !createEmptyDb() {
			return false
		}
	}

	// 清空Debug日志
	if !cleanDebugLogs() {
		return false
	}

	// 清空备份目录
	if _, err := os.Stat(backupDir); err == nil {
		backups := listBackups()
		if len(backups) > 0 {
			for _, backup := range backups {
				if err := os.Remove(backup); err != nil {
					fmt.Printf("❌ 删除备份文件失败: %s\n", err.Error())
					return false
				}
			}
			fmt.Printf("✅ 已清空 %d 个备份文件\n", len(backups))
		} else {
			fmt.Println("备份目录已经是空的")
		}
	}

	return true
}

// 显示主菜单
func showMenu() {
	reader := bufio.NewReader(os.Stdin)

	for {
		fmt.Println("\n隐私数据清理工具")
		fmt.Println("==================")
		fmt.Println("1. 备份并完全清空数据")
		fmt.Println("2. 恢复备份")
		fmt.Println("3. 清空全部数据及备份")
		fmt.Println("4. 清理Debug日志")
		fmt.Println("5. 退出")

		fmt.Print("请选择操作 [1-5]: ")
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)

		switch input {
		case "1":
			if backupFile() {
				createEmptyDb()
			}
		case "2":
			backups := listBackups()
			if len(backups) > 0 {
				fmt.Print("请输入要恢复的备份编号: ")
				input, _ := reader.ReadString('\n')
				input = strings.TrimSpace(input)
				index, err := strconv.Atoi(input)
				if err != nil || index < 1 || index > len(backups) {
					fmt.Println("❌ 无效的备份编号")
				} else {
					restoreBackup(backups[index-1])
				}
			}
		case "3":
			fmt.Print("确定要清空所有数据及备份吗? (y/n): ")
			input, _ := reader.ReadString('\n')
			input = strings.ToLower(strings.TrimSpace(input))
			if input == "y" {
				cleanAllData()
			} else {
				fmt.Println("操作已取消")
			}
		case "4":
			cleanDebugLogs()
		case "5":
			fmt.Println("再见!")
			return
		default:
			fmt.Println("❌ 无效的选择，请重试")
		}
	}
}

func main() {
	// 显示欢迎信息
	fmt.Println("欢迎使用隐私数据清理工具")
	fmt.Println("此工具将帮助您管理数据库文件及其备份")
	fmt.Println("主要处理的文件: data/db.json (包含API密钥等敏感信息)")
	fmt.Println("以及 data/debug_logs/ 目录下的Debug日志文件")
	fmt.Println("注意: 清理操作前会自动创建备份")

	// 启动主菜单
	showMenu()
}

// 恢复备份文件
func restoreBackup(backupPath string) bool {
	// 获取应用配置
	cfg := config.GetConfig()

	if _, err := os.Stat(backupPath); err == nil {
		srcFile, err := os.Open(backupPath)
		if err != nil {
			fmt.Printf("❌ 打开备份文件失败: %s\n", err.Error())
			return false
		}
		defer srcFile.Close()

		dstFile, err := os.Create(cfg.DBPath)
		if err != nil {
			fmt.Printf("❌ 创建数据库文件失败: %s\n", err.Error())
			return false
		}
		defer dstFile.Close()

		_, err = io.Copy(dstFile, srcFile)
		if err != nil {
			fmt.Printf("❌ 复制文件失败: %s\n", err.Error())
			return false
		}

		fmt.Printf("✅ 已从备份恢复: %s\n", backupPath)
		return true
	} else {
		fmt.Printf("❌ 备份文件不存在: %s\n", backupPath)
		return false
	}
}				if err := os.Remove(filePath); err != nil {
					fmt.Printf("❌ 删除文件失败 %s: %s\n", filePath, err.Error())
				} else {
					count++
				}
			}
		}
		
		if count > 0 {
			fmt.Printf("✅ 已清空 %d 个Debug日志文件\n", count)
		} else {
			fmt.Println("Debug日志目录已经是空的")
		}
		
		return true
	} catch (err error) {
		fmt.Printf("❌ 清理Debug日志失败: %s\n", err