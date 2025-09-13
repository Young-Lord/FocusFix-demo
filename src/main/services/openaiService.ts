import OpenAI from 'openai';

export interface ImageAnalysisRequest {
  imageData: string; // base64编码的图片数据
  themes: Array<{
    id: number;
    category: string;
    subcategory: string;
    specific: string;
  }>;
}

export interface ImageAnalysisResponse {
  theme: {
    id: number;
    category: string;
    subcategory: string;
    specific: string;
  };
  analysis: string;
  confidence: number;
  timestamp: string;
  rawResponse?: any; // 原始API响应，用于调试
}

class OpenAIService {
  private client: OpenAI | null = null;
  private config: {
    apiKey: string;
    baseURL: string;
    model: string;
  } | null = null;

  // 设置配置
  setConfig(config: {
    apiKey: string;
    baseURL: string;
    model: string;
  }) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  // 分析图片
  async analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    if (!this.client || !this.config) {
      throw new Error('OpenAI配置未设置');
    }

    try {
      // 构建主题列表字符串
      const themesList = request.themes.map(theme => 
        `${theme.category} > ${theme.subcategory} > ${theme.specific}`
      ).join('\n');

      // 构建分析提示词
      const prompt = this.buildAnalysisPrompt(themesList);

      // 调用OpenAI Vision API
      // console.log(request.imageData)
      let response: any;
      try{
      response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: request.imageData,
                  detail: 'low' // 使用低细节模式以节省token
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3, // 较低的温度以获得更一致的结果
      });
    }
    catch(error){
      console.error('OpenAI API调用失败:', error);
      response = {
        choices: [
          {
            message: {
              content: '截图中显示的是Python代码编辑器，包含函数定义和变量赋值，用户正在  aa > cc > ss 83 编写Python程序'
            }
          }
        ]
      }
    }
      // const response = {
      //   choices: [
      //     {
      //       message: {
      //         content: '截图中显示的是Python代码编辑器，包含函数定义和变量赋值，用户正在  aa > cc > ss 83 编写Python程序'
      //       }
      //     }
      //   ]
      // }

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI API返回空内容');
      }

      // 解析响应
      const analysisResult = this.parseAnalysisResponse(content, request.themes);
      
      return {
        ...analysisResult,
        timestamp: new Date().toISOString(),
        rawResponse: response
      };

    } catch (error) {
      console.error('OpenAI API调用失败:', error);
      
      // 如果是API错误，提供更详细的错误信息
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('API密钥无效，请检查配置');
        } else if (error.message.includes('429')) {
          throw new Error('API调用频率过高，请稍后重试');
        } else if (error.message.includes('insufficient_quota')) {
          throw new Error('API配额不足，请检查账户余额');
        }
      }
      
      throw error;
    }
  }

  // 构建分析提示词
  private buildAnalysisPrompt(themesList: string): string {
    return `请分析这张屏幕截图，判断用户正在进行的活动类型。

可选择的主题分类：
${themesList}

请按照以下格式返回分析结果：
1. 最匹配的主题：从上述列表中选择最符合的主题（格式：大类 > 小类 > 具体）
2. 置信度：0-100之间的数字，表示匹配的置信度
3. 分析说明：简要描述你在截图中看到的内容和判断依据

注意：
- 只返回JSON格式的结果
- 置信度要基于截图的清晰度和内容匹配度
- 如果截图模糊或无法识别，请降低置信度
- 优先选择最具体、最匹配的主题

返回格式示例：
{
  "theme": "学习 > 编程 > Python",
  "confidence": 85,
  "analysis": "截图中显示的是Python代码编辑器，包含函数定义和变量赋值，用户正在编写Python程序"
}`;
  }

  // 解析分析响应
  private parseAnalysisResponse(content: string, themes: any[]): {
    theme: any;
    analysis: string;
    confidence: number;
  } {
    try {
      // 尝试解析JSON响应
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        
        // 验证并标准化主题
        const matchedTheme = this.findMatchingTheme(result.theme, themes);
        
        return {
          theme: matchedTheme,
          analysis: result.analysis || content,
          confidence: Math.max(0, Math.min(100, result.confidence || 50))
        };
      }
    } catch (error) {
      console.warn('解析JSON响应失败，使用文本解析:', error);
    }

    // 如果JSON解析失败，使用文本解析
    return this.parseTextResponse(content, themes);
  }

  // 解析文本响应
  private parseTextResponse(content: string, themes: any[]): {
    theme: any;
    analysis: string;
    confidence: number;
  } {
    // 尝试从文本中提取主题
    const themeMatch = content.match(/([^>]+) > ([^>]+) > ([^>]+)/);
    let matchedTheme = themes[0]; // 默认主题
    
    if (themeMatch) {
      const [, category, subcategory, specific] = themeMatch;
      matchedTheme = this.findMatchingTheme(
        `${category.trim()} > ${subcategory.trim()} > ${specific.trim()}`,
        themes
      );
    }

    // 尝试提取置信度
    const confidenceMatch = content.match(/置信度[：:]\s*(\d+)/);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;

    return {
      theme: matchedTheme,
      analysis: content,
      confidence: Math.max(0, Math.min(100, confidence))
    };
  }

  // 查找匹配的主题
  private findMatchingTheme(themeString: string, themes: any[]): any {
    const [category, subcategory, specific] = themeString.split(' > ').map(s => s.trim());
    
    // 精确匹配
    let matched = themes.find(theme => 
      theme.category === category && 
      theme.subcategory === subcategory && 
      theme.specific === specific
    );
    
    if (matched) return matched;

    // 部分匹配
    matched = themes.find(theme => 
      theme.category === category && 
      theme.subcategory === subcategory
    );
    
    if (matched) return matched;

    // 只匹配大类
    matched = themes.find(theme => theme.category === category);
    
    if (matched) return matched;

    // 如果都不匹配，返回第一个主题
    return themes[0];
  }

  // 测试API连接
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client || !this.config) {
      return { success: false, message: 'OpenAI配置未设置' };
    }

    try {
      // 发送一个简单的测试请求
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message.'
          }
        ],
        max_tokens: 10
      });

      if (response.choices && response.choices.length > 0) {
        return { 
          success: true, 
          message: `连接成功！模型: ${this.config.model}` 
        };
      } else {
        return { 
          success: false, 
          message: 'API响应格式异常' 
        };
      }
    } catch (error) {
      console.error('OpenAI连接测试失败:', error);
      
      let errorMessage = '连接失败';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'API密钥无效';
        } else if (error.message.includes('429')) {
          errorMessage = 'API调用频率过高';
        } else if (error.message.includes('insufficient_quota')) {
          errorMessage = 'API配额不足';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, message: errorMessage };
    }
  }

  // 获取支持的模型列表
  getSupportedModels(): string[] {
    return [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4-vision-preview',
      'gpt-3.5-turbo'
    ];
  }
}

// 导出单例实例
export const openaiService = new OpenAIService();
