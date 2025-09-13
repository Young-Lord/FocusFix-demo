import { ElectronAPI } from '@electron-toolkit/preload'

interface ScreenshotResult {
  success: boolean
  data?: string
  hash?: string
  timestamp?: number
  size?: number
  error?: string
}

interface ImageAnalysisRequest {
  imageData: string
  themes: Array<{
    id: number
    category: string
    subcategory: string
    specific: string
  }>
}

interface ImageAnalysisResponse {
  theme: {
    id: number
    category: string
    subcategory: string
    specific: string
  }
  analysis: string
  confidence: number
  timestamp: string
  rawResponse?: any
}

interface Api {
  takeScreenshot: () => Promise<ScreenshotResult>
  calculateSimilarity: (image1: Buffer, image2: Buffer) => Promise<number>
  openai: {
    setConfig: (config: { apiKey: string; baseURL: string; model: string }) => Promise<{ success: boolean; message: string }>
    testConnection: () => Promise<{ success: boolean; message: string }>
    analyzeImage: (request: ImageAnalysisRequest) => Promise<ImageAnalysisResponse>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
