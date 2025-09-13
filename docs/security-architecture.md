# 安全架构说明

## 架构概述

FocusFix 采用安全的 Electron 架构设计，确保 API 密钥和敏感数据的安全性。

## 进程分离

### 主进程 (Main Process)
- **职责**: 处理系统级操作和外部API调用
- **安全特性**:
  - 存储和管理 OpenAI API 密钥
  - 执行所有外部网络请求
  - 处理截图和文件系统操作
  - 不暴露敏感信息给渲染进程

### 渲染进程 (Renderer Process)
- **职责**: 用户界面和交互逻辑
- **安全限制**:
  - 无法直接访问文件系统
  - 无法直接调用外部API
  - 通过 IPC 与主进程通信
  - 不存储敏感信息

## 通信机制

### IPC (Inter-Process Communication)
- **安全通道**: 通过 `contextBridge` 暴露安全的API
- **类型安全**: 完整的 TypeScript 类型定义
- **权限控制**: 只暴露必要的功能接口

### API 调用流程
```
渲染进程 → IPC → 主进程 → OpenAI API → 主进程 → IPC → 渲染进程
```

## 安全措施

### API 密钥保护
- ✅ API 密钥仅存储在主进程中
- ✅ 渲染进程无法直接访问 API 密钥
- ✅ 通过 IPC 安全传递配置信息
- ✅ 不在网络请求中暴露密钥

### 数据隔离
- ✅ 截图数据在主进程中处理
- ✅ 图片分析结果通过 IPC 传递
- ✅ 敏感数据不存储在 localStorage
- ✅ 进程间通信加密

### 权限控制
- ✅ 最小权限原则
- ✅ 渲染进程沙箱化
- ✅ 禁用 Node.js 集成
- ✅ 启用上下文隔离

## 实现细节

### 主进程服务
```typescript
// src/main/services/openaiService.ts
class OpenAIService {
  private client: OpenAI | null = null;
  private config: { apiKey: string; ... } | null = null;
  
  // API 密钥安全存储
  setConfig(config) { ... }
  
  // 安全的 API 调用
  async analyzeImage(request) { ... }
}
```

### IPC 接口
```typescript
// src/preload/index.ts
const api = {
  openai: {
    setConfig: (config) => ipcRenderer.invoke('openai-set-config', config),
    testConnection: () => ipcRenderer.invoke('openai-test-connection'),
    analyzeImage: (request) => ipcRenderer.invoke('openai-analyze-image', request)
  }
}
```

### 渲染进程调用
```typescript
// src/renderer/src/services/apiService.ts
async analyzeImage(request) {
  // 通过 IPC 调用主进程
  const result = await window.api.openai.analyzeImage(request);
  return result;
}
```

## 安全优势

1. **API 密钥保护**: 密钥永远不会暴露给渲染进程
2. **网络隔离**: 所有外部请求都在主进程中执行
3. **数据安全**: 敏感数据不存储在用户可访问的位置
4. **权限最小化**: 渲染进程只有必要的权限
5. **类型安全**: 完整的类型检查防止数据泄露

## 最佳实践

1. **永远不要**在渲染进程中存储 API 密钥
2. **永远不要**在渲染进程中直接调用外部 API
3. **始终使用** IPC 进行进程间通信
4. **定期更新**依赖项以修复安全漏洞
5. **监控**网络请求和错误日志

## 合规性

- ✅ 符合 Electron 安全最佳实践
- ✅ 遵循 OWASP 安全指南
- ✅ 支持企业安全策略
- ✅ 可审计的代码结构

