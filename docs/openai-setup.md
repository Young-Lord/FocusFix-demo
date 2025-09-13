# OpenAI API 配置指南

## 获取API密钥

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 登录或注册账户
3. 进入 [API Keys](https://platform.openai.com/api-keys) 页面
4. 点击 "Create new secret key" 创建新的API密钥
5. 复制生成的密钥（格式：sk-...）

## 配置应用

1. 打开 FocusFix 应用
2. 进入 "设置" 标签页
3. 在 "API 配置" 部分填入：
   - **API 密钥**: 粘贴从OpenAI获取的密钥
   - **API 端点**: 使用默认值 `https://api.openai.com/v1`
   - **API 模型**: 选择 Vision 模型（推荐 GPT-4o Mini）

## 推荐模型

### Vision 模型（图片分析）
- **GPT-4o**: 最新最强模型，分析准确度最高
- **GPT-4o Mini**: 性价比最高，推荐日常使用
- **GPT-4 Turbo**: 平衡性能和成本
- **GPT-4 Vision Preview**: 专门的图片分析模型

### 成本对比
- GPT-4o Mini: ~$0.15/1M tokens
- GPT-4o: ~$2.50/1M tokens
- GPT-4 Turbo: ~$10/1M tokens

## 测试连接

1. 配置完成后，点击 "测试连接" 按钮
2. 如果成功，会显示 "连接成功！"
3. 如果失败，检查：
   - API密钥是否正确
   - 网络连接是否正常
   - 账户是否有足够余额

## 使用技巧

### 优化成本
- 使用 GPT-4o Mini 进行日常分析
- 设置合适的截图间隔（建议30-60秒）
- 启用相似度检测，避免重复分析

### 提高准确度
- 确保屏幕内容清晰可见
- 避免过于复杂的多窗口布局
- 定期更新主题分类

## 故障排除

### 常见错误
- **401 Unauthorized**: API密钥无效
- **429 Too Many Requests**: 调用频率过高
- **insufficient_quota**: 账户余额不足

### 解决方案
1. 检查API密钥是否正确
2. 降低截图和分析频率
3. 充值OpenAI账户
4. 检查网络连接

## 隐私说明

- 截图数据仅用于本地分析
- 图片会发送到OpenAI服务器进行分析
- 建议不要在敏感内容上使用此功能
- 可以随时停止追踪功能
