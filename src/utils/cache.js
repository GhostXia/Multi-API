class ConfigCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 默认缓存时间：5分钟
  }

  // 设置缓存
  set(key, value) {
    const item = {
      value: value,
      expiry: Date.now() + this.ttl
    };
    this.cache.set(key, item);
  }

  // 获取缓存
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  // 删除缓存
  delete(key) {
    this.cache.delete(key);
  }

  // 清空所有缓存
  clear() {
    this.cache.clear();
  }

  // 检查缓存是否存在
  has(key) {
    return this.cache.has(key) && Date.now() <= this.cache.get(key).expiry;
  }
}

// 创建并导出单例实例
module.exports = new ConfigCache();