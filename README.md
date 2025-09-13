# FocusFix - AI时间追踪应用

这是一个基于Electron + React + TypeScript的AI驱动时间追踪应用，可以将HTML UI转换为React组件实现。

## 功能特性

### 🎯 主要功能
- **时间线视图**: 查看历史专注时间记录
- **追踪控制**: 启动/停止自动追踪，测试截图和分析功能
- **主题管理**: 管理AI分析的主题分类（三级结构：大类 → 小类 → 具体）
- **设置配置**: 配置API密钥、端点、模型、时间间隔等参数
- **API配置**: 支持多种AI模型和自定义API端点
- **智能截图**: 高性能截图功能，支持压缩和相似度检测

### 🎨 UI特性
- 现代化的渐变背景设计
- 响应式布局，支持移动端
- 毛玻璃效果和阴影
- 流畅的动画过渡
- Material Design风格的开关和按钮

### 🔧 技术栈
- **前端**: React 19 + TypeScript
- **桌面应用**: Electron
- **构建工具**: Vite + electron-vite
- **样式**: CSS3 (渐变、毛玻璃、动画)
- **字体**: Google Fonts (Roboto)

## 项目结构

```
src/renderer/src/
├── components/
│   ├── FocusTracker.tsx      # 主应用组件
│   ├── FocusTracker.css      # 主样式文件
│   ├── Timeline.tsx          # 时间线组件
│   ├── TrackingControl.tsx   # 追踪控制组件
│   ├── ThemeManager.tsx      # 主题管理组件
│   └── Settings.tsx          # 设置组件
├── services/
│   ├── apiService.ts         # API服务模块
│   └── screenshotService.ts  # 截图服务模块
├── App.tsx                   # 应用入口
└── assets/
    └── main.css              # 全局样式
```

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建应用
npm run build

# 构建Windows应用
npm run build:win

# 构建Mac应用
npm run build:mac

# 构建Linux应用
npm run build:linux
```

## 使用说明

1. **启动应用**: 运行 `npm run dev` 启动开发模式
2. **配置API**: 在设置页面配置API端点、密钥和模型
3. **测试连接**: 使用"测试连接"按钮验证API配置
4. **管理主题**: 在主题管理页面添加、编辑或删除主题分类
5. **开始追踪**: 在追踪控制页面启用自动追踪功能
6. **查看时间线**: 在时间线页面查看历史记录

## API配置

### 支持的模型
- **OpenAI**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus
- **Google**: Gemini 1.5 Pro
- **自定义**: 支持自定义模型名称

### API端点配置
- 默认端点: `https://api.openai.com/v1`
- 支持自定义代理和第三方API服务
- 自动验证端点格式和API密钥格式

## 截图功能

### 性能优化
- **图片压缩**: 自动将截图压缩到800x600像素，减小文件大小
- **智能缓存**: 5分钟内重复截图使用缓存，避免重复处理
- **相似度检测**: 自动检测连续截图的相似度，跳过重复分析
- **进程间优化**: 避免在进程间传递大文件，只传递压缩后的base64数据

### 权限要求
- **屏幕录制权限**: 需要用户授权屏幕录制权限
- **跨平台支持**: 支持Windows、macOS、Linux系统
- **权限提示**: 自动处理权限请求和错误提示

### 使用方式
1. 在追踪控制页面点击"测试截图"按钮
2. 首次使用时会请求屏幕录制权限
3. 截图会自动压缩并缓存，提高性能
4. 可设置相似度阈值，避免重复分析

## 数据存储

应用使用localStorage存储以下数据：
- `focusTrackerSettings`: 应用设置
- `focusTrackerThemes`: 主题分类数据
- `focusTrackerAnalyses`: 分析结果数据

## 注意事项

- 当前版本为演示版本，截图和分析功能为模拟实现
- 需要配置有效的OpenAI API密钥才能使用AI分析功能
- 建议在设置中调整截图和分析间隔以适应使用场景

## 许可证

MIT License