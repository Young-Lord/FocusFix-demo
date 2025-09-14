# FocusFix - AI 时间追踪应用

这是一个 vibe 出来的，基于 Electron + React + TypeScript 的 AI 驱动时间追踪应用。

SJTU 2025 AI Hackathon. 目前来说不建议用，除非你想把隐私全都送给某些可疑的第三方。另外还有主页视图错位一类的小 bug，迟早会重写。

赞美 19 组的每位队友。

## 主要功能

- **时间线视图**: 查看历史专注时间记录
- **追踪控制**: 启动/停止自动追踪，测试截图和分析功能
- **主题管理**: 管理 AI 分析的主题分类（三级结构：大类 → 小类 → 具体）（这货应该改成基于标签）

<img alt="预览图，显示了条状的历史时间使用情况" width="50%" src="https://github.com/user-attachments/assets/de711961-ec5f-497a-a73a-07c7da17a2d4" />

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run dev

# 构建应用
pnpm run build

# 构建Windows应用
pnpm run build:win

# 构建Mac应用
pnpm run build:mac

# 构建Linux应用
pnpm run build:linux
```

## 使用说明

1. **启动应用**: 运行 `pnpm run dev` 启动开发模式
2. **配置API**: 在设置页面配置API端点、密钥和模型
3. **管理主题**: 在主题管理页面添加、编辑或删除主题分类
4. **开始追踪**: 在追踪控制页面启用自动追踪功能
5. **查看时间线**: 在时间线页面查看历史记录
