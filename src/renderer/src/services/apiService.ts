// 移除OpenAI依赖，改为通过IPC调用主进程

// API服务模块
export interface ApiConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  customModel?: string;
}

export interface AnalysisRequest {
  imageData: string; // base64编码的图片数据
  themes: Array<{
    id: number;
    category: string;
    subcategory: string;
    specific: string;
  }>;
}

export interface AnalysisResponse {
  theme: {
    id: number;
    category: string;
    subcategory: string;
    specific: string;
  };
  analysis: string;
  confidence: number;
  timestamp: string;
}

class ApiService {
  private config: ApiConfig | null = null;

  // 设置API配置
  setConfig(config: ApiConfig) {
    this.config = config;
  }

  // 获取当前配置
  getConfig(): ApiConfig | null {
    return this.config;
  }

  // 测试API连接
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config) {
      return { success: false, message: 'API配置未设置' };
    }

    try {
      // 通过IPC调用主进程设置OpenAI配置
      await window.api.openai.setConfig({
        apiKey: this.config.apiKey,
        baseURL: this.config.endpoint,
        model: this.getModelName()
      });

      // 通过IPC调用主进程测试连接
      const result = await window.api.openai.testConnection();
      return result;

    } catch (error) {
      console.error('API连接测试失败:', error);
      return { 
        success: false, 
        message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  // 执行分析
  async analyzeImage(request: AnalysisRequest): Promise<AnalysisResponse> {
    if (!this.config) {
      throw new Error('API配置未设置');
    }

    try {
      // 通过IPC调用主进程设置OpenAI配置
      await window.api.openai.setConfig({
        apiKey: this.config.apiKey,
        baseURL: this.config.endpoint,
        model: this.getModelName()
      });

      // 构建图片分析请求
      const imageRequest = {
        imageData: request.imageData,
        themes: request.themes
      };

      // 通过IPC调用主进程进行图片分析
      const result = await window.api.openai.analyzeImage(imageRequest);
      
      // 转换响应格式
      return {
        theme: result.theme,
        analysis: result.analysis,
        confidence: result.confidence,
        timestamp: result.timestamp
      };

    } catch (error) {
      console.error('图片分析失败:', error);
      
      // 如果OpenAI API失败，回退到模拟分析
      console.warn('回退到模拟分析模式');
      return this.fallbackAnalysis(request);
    }
  }

  // 回退分析（当OpenAI API不可用时）
  private fallbackAnalysis(request: AnalysisRequest): AnalysisResponse {
    const randomTheme = request.themes[Math.floor(Math.random() * request.themes.length)];
    const modelName = this.getModelName();
    const imageSize = request.imageData.length;
    const analysisQuality = imageSize > 100000 ? '高质量' : '标准质量';
    
    return {
      theme: randomTheme,
      analysis: `[模拟模式] 使用${modelName}模型分析 (${analysisQuality}): 用户正在${randomTheme.category}${randomTheme.subcategory}${randomTheme.specific}相关活动。图片大小: ${(imageSize / 1024).toFixed(1)}KB`,
      confidence: 0.6 + Math.random() * 0.2, // 模拟模式置信度较低
      timestamp: new Date().toISOString()
    };
  }

  // 获取模型名称
  private getModelName(): string {
    if (!this.config) return 'unknown';
    return this.config.model === 'custom' 
      ? (this.config.customModel || 'custom') 
      : this.config.model;
  }

  // 验证配置
  validateConfig(config: Partial<ApiConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.endpoint) {
      errors.push('API端点不能为空');
    } else if (!this.isValidUrl(config.endpoint)) {
      errors.push('API端点格式不正确');
    }

    if (!config.apiKey) {
      errors.push('API密钥不能为空');
    } else if (!config.apiKey.startsWith('sk-')) {
      errors.push('API密钥格式不正确（应以sk-开头）');
    }

    if (!config.model) {
      errors.push('模型不能为空');
    }

    if (config.model === 'custom' && !config.customModel) {
      errors.push('自定义模型名称不能为空');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // 验证URL格式
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// 导出单例实例
export const apiService = new ApiService();
