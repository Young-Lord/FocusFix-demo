// 截图服务类
import { Buffer } from 'buffer';

class ScreenshotService {
  // 将base64字符串转换为Buffer
  private base64ToBuffer(base64: string): Buffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return Buffer.from(bytes);
  }

  // 获取截图
  async takeScreenshot(): Promise<{
    success: boolean;
    data?: string;
    buffer?: Uint8Array;
    timestamp?: number;
    size?: number;
    width?: number;
    height?: number;
    format?: string;
    error?: string;
  }> {
    try {
      // 调用Electron API获取新截图
      const result = await window.api.takeScreenshot();
      
      if (result.success && result.data) {
        const buffer = this.base64ToBuffer(result.data.split(',')[1]);  // data:image/jpeg;base64,
        return {
          success: true,
          data: result.data,
          buffer: buffer,
          timestamp: result.timestamp || Date.now(),
          size: result.size || buffer.length,
          width: result.width,
          height: result.height,
          format: result.format
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
  async calculateSimilarity(image1:Uint8Array, image2:Uint8Array): Promise<number> {
    try {
      return await window.api.calculateSimilarity(image1, image2);
    } catch (error) {
      console.error('相似度计算错误:', error);
      return 0;
    }
  }
}

// 导出单例实例
export const screenshotService = new ScreenshotService();
