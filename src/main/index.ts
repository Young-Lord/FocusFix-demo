import { app, shell, BrowserWindow, ipcMain, desktopCapturer } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { openaiService, ImageAnalysisRequest } from './services/openaiService'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // 截图功能
  ipcMain.handle('take-screenshot', async () => {
    try {
      // 请求屏幕录制权限
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 800, height: 600 } // 压缩到较小尺寸
      })

      if (sources.length === 0) {
        throw new Error('无法获取屏幕源，请检查屏幕录制权限设置')
      }

      // 获取主屏幕
      const primarySource = sources.find(source => source.name === 'Entire Screen') || sources[0]
      
      // 将截图转换为base64
      const thumbnail = primarySource.thumbnail
      const base64 = thumbnail.toPNG().toString('base64')
      
      // 计算图片的简单哈希值用于相似度检测
      const imageData = thumbnail.toPNG()
      const hash = calculateImageHash(imageData)
      
      return {
        success: true,
        data: base64,
        hash: hash,
        timestamp: Date.now(),
        size: imageData.length
      }
    } catch (error) {
      console.error('截图失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  // 计算图片哈希值（用于相似度检测）
  function calculateImageHash(imageData: Buffer): string {
    // 简单的哈希算法，将图片数据转换为字符串
    let hash = 0
    for (let i = 0; i < imageData.length; i += 4) {
      hash = ((hash << 5) - hash + imageData[i]) & 0xffffffff
    }
    return hash.toString(16)
  }

  // 计算两张图片的相似度
  ipcMain.handle('calculate-similarity', async (_, hash1: string, hash2: string) => {
    try {
      // 简单的哈希相似度计算
      const h1 = parseInt(hash1, 16)
      const h2 = parseInt(hash2, 16)
      const similarity = 100 - Math.abs(h1 - h2) / Math.max(h1, h2) * 100
      return Math.max(0, Math.min(100, similarity))
    } catch (error) {
      console.error('相似度计算失败:', error)
      return 0
    }
  })

  // OpenAI API配置
  ipcMain.handle('openai-set-config', async (_, config: {
    apiKey: string;
    baseURL: string;
    model: string;
  }) => {
    try {
      openaiService.setConfig(config)
      return { success: true, message: 'OpenAI配置已设置' }
    } catch (error) {
      console.error('OpenAI配置失败:', error)
      return { 
        success: false, 
        message: error instanceof Error ? error.message : '配置失败' 
      }
    }
  })

  // 测试OpenAI连接
  ipcMain.handle('openai-test-connection', async () => {
    try {
      return await openaiService.testConnection()
    } catch (error) {
      console.error('OpenAI连接测试失败:', error)
      return { 
        success: false, 
        message: error instanceof Error ? error.message : '连接测试失败' 
      }
    }
  })

  // 分析图片
  ipcMain.handle('openai-analyze-image', async (_, request: ImageAnalysisRequest) => {
    try {
      return await openaiService.analyzeImage(request)
    } catch (error) {
      console.error('OpenAI图片分析失败:', error)
      throw error // 让渲染进程处理错误
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
