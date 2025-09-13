// 截图服务类
export interface ScreenshotCache {
  data: string;
  hash: string;
  timestamp: number;
  size: number;
}

class ScreenshotService {
  private cache: ScreenshotCache | null = null;
  private readonly MAX_CACHE_AGE = 5 * 60 * 1000; // 5分钟缓存

  // 获取截图
  async takeScreenshot(): Promise<{
    success: boolean;
    data?: string;
    hash?: string;
    timestamp?: number;
    size?: number;
    error?: string;
    fromCache?: boolean;
  }> {
    try {
      // 检查缓存是否有效
      if (this.cache && this.isCacheValid()) {
        console.log('使用缓存的截图');
        return {
          success: true,
          data: this.cache.data,
          hash: this.cache.hash,
          timestamp: this.cache.timestamp,
          size: this.cache.size,
          fromCache: true
        };
      }

      // 调用Electron API获取新截图
      const result = await window.api.takeScreenshot();
      
      if (result.success && result.data && result.hash) {
        // 更新缓存
        this.cache = {
          data: result.data,
          hash: result.hash,
          timestamp: result.timestamp || Date.now(),
          size: result.size || 0
        };
        
        return {
          ...result,
          fromCache: false
        };
      } else {
        throw new Error(result.error || '截图失败');
      }
    } catch (error) {
      console.error('截图服务错误:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 计算相似度
  async calculateSimilarity(hash1: string, hash2: string): Promise<number> {
    try {
      return await window.api.calculateSimilarity(hash1, hash2);
    } catch (error) {
      console.error('相似度计算错误:', error);
      return 0;
    }
  }

  // 检查缓存是否有效
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    const now = Date.now();
    return (now - this.cache.timestamp) < this.MAX_CACHE_AGE;
  }

  // 清除缓存
  clearCache(): void {
    this.cache = null;
    console.log('截图缓存已清除');
  }

  // 获取缓存信息
  getCacheInfo(): { hasCache: boolean; age: number; size: number } {
    if (!this.cache) {
      return { hasCache: false, age: 0, size: 0 };
    }
    
    const age = Date.now() - this.cache.timestamp;
    return {
      hasCache: true,
      age: Math.floor(age / 1000), // 秒
      size: this.cache.size
    };
  }

  // 压缩图片（如果需要进一步压缩）
  compressImage(base64Data: string, quality: number = 0.8): string {
    // 这里可以实现更高级的图片压缩
    // 目前返回原始数据，实际项目中可以使用canvas进行压缩
    return base64Data;
  }

  // 获取图片信息
  getImageInfo(base64Data: string): { size: number; dimensions?: { width: number; height: number } } {
    const size = Math.floor((base64Data.length * 3) / 4); // base64解码后的大小
    
    // 尝试从base64数据中提取图片尺寸（PNG格式）
    try {
      const header = base64Data.substring(0, 100);
      // 这里可以添加更复杂的图片头解析逻辑
      return { size };
    } catch {
      return { size };
    }
  }
}

// 导出单例实例
export const screenshotService = new ScreenshotService();
