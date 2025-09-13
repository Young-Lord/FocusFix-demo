import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 截图相关API
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  calculateSimilarity: (image1:Uint8Array, image2:Uint8Array) => ipcRenderer.invoke('calculate-similarity', image1, image2),
  
  // OpenAI相关API
  openai: {
    setConfig: (config: { apiKey: string; baseURL: string; model: string }) => 
      ipcRenderer.invoke('openai-set-config', config),
    testConnection: () => ipcRenderer.invoke('openai-test-connection'),
    analyzeImage: (request: any) => ipcRenderer.invoke('openai-analyze-image', request)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
