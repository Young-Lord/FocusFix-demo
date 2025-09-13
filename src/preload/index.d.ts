import { ElectronAPI } from '@electron-toolkit/preload'

interface ScreenshotResult {
  success: boolean
  data?: string
  hash?: string
  timestamp?: number
  size?: number
  error?: string
}

interface Api {
  takeScreenshot: () => Promise<ScreenshotResult>
  calculateSimilarity: (hash1: string, hash2: string) => Promise<number>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
