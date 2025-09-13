import React, { useState, useEffect } from 'react';
import { apiService, ApiConfig, AnalysisRequest } from '../services/apiService';
import { screenshotService } from '../services/screenshotService';

interface Theme {
  id: number;
  category: string;
  subcategory: string;
  specific: string;
}

interface Analysis {
  theme: Theme;
  analysis: string;
  confidence: number;
  timestamp: string;
}

interface TrackingControlProps {
  settings: {
    trackingEnabled: boolean;
    openaiApiKey: string;
    openaiApiEndpoint: string;
    openaiApiModel: string;
    customApiModel: string;
    screenshotInterval: number;
    analysisInterval: number;
    similarityThreshold: number;
  };
  themes: Theme[];
  onAnalysesChange: (analyses: Analysis[]) => void;
}

const TrackingControl: React.FC<TrackingControlProps> = ({ 
  settings, 
  themes, 
  onAnalysesChange 
}) => {
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [status, setStatus] = useState({ message: '准备就绪', type: 'warning' });
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [lastScreenshotHash, setLastScreenshotHash] = useState<string | null>(null);
  const [lastScreenshotData, setLastScreenshotData] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState({ hasCache: false, age: 0, size: 0 });
  const [showScreenshot, setShowScreenshot] = useState(false);

  // 模拟追踪功能
  useEffect(() => {
    let trackingInterval: NodeJS.Timeout | null = null;
    let analysisInterval: NodeJS.Timeout | null = null;

    // 更新API服务配置
    const apiConfig: ApiConfig = {
      endpoint: settings.openaiApiEndpoint,
      apiKey: settings.openaiApiKey,
      model: settings.openaiApiModel,
      customModel: settings.customApiModel
    };
    apiService.setConfig(apiConfig);

    if (settings.trackingEnabled) {
      // 启动截图定时器
      trackingInterval = setInterval(() => {
        takeScreenshot();
      }, settings.screenshotInterval * 1000);

      // 启动分析定时器
      analysisInterval = setInterval(() => {
        performAnalysis();
      }, settings.analysisInterval * 1000);

      setStatus({ message: '追踪已启动', type: 'success' });
    } else {
      setStatus({ message: '追踪已停止', type: 'warning' });
    }

    return () => {
      if (trackingInterval) clearInterval(trackingInterval);
      if (analysisInterval) clearInterval(analysisInterval);
    };
  }, [settings.trackingEnabled, settings.screenshotInterval, settings.analysisInterval, settings.openaiApiEndpoint, settings.openaiApiKey, settings.openaiApiModel, settings.customApiModel]);

  const takeScreenshot = async () => {
    try {
      setStatus({ 
        message: '正在截图...', 
        type: 'warning' 
      });

      // 使用截图服务进行截图
      const result = await screenshotService.takeScreenshot();
      
      if (result.success && result.data && result.hash) {
        setScreenshotCount(prev => prev + 1);
        
        // 检查相似度（如果设置了阈值）
        if (lastScreenshotHash && settings.similarityThreshold > 0) {
          const similarity = await screenshotService.calculateSimilarity(lastScreenshotHash, result.hash);
          
          if (similarity >= settings.similarityThreshold) {
            setStatus({ 
              message: `截图完成 (相似度: ${similarity.toFixed(1)}%, 跳过分析${result.fromCache ? ', 使用缓存' : ''})`, 
              type: 'warning' 
            });
            setLastScreenshotHash(result.hash);
            return; // 相似度过高，跳过分析
          }
        }
        
        setLastScreenshotHash(result.hash);
        setLastScreenshotData(result.data);
        
        // 更新缓存信息
        const newCacheInfo = screenshotService.getCacheInfo();
        setCacheInfo(newCacheInfo);
        
        setStatus({ 
          message: `截图完成 (${new Date().toLocaleTimeString()}, 大小: ${(result.size! / 1024).toFixed(1)}KB${result.fromCache ? ', 使用缓存' : ''})`, 
          type: 'success' 
        });
        
        console.log('截图成功:', {
          size: result.size,
          hash: result.hash,
          timestamp: result.timestamp,
          fromCache: result.fromCache
        });
      } else {
        throw new Error(result.error || '截图失败');
      }
    } catch (error) {
      console.error('截图失败:', error);
      setStatus({ 
        message: `截图失败: ${error instanceof Error ? error.message : '未知错误'}`, 
        type: 'error' 
      });
    }
  };

  const performAnalysis = async () => {
    if (!settings.openaiApiKey) {
      setStatus({ message: '请先配置OpenAI API密钥', type: 'error' });
      return;
    }

    setAnalysisCount(prev => prev + 1);

    try {
      // 准备分析请求
      const request: AnalysisRequest = {
        imageData: lastScreenshotData || 'no_image_data', // 使用真实的截图数据
        themes: themes
      };

      // 使用API服务进行分析
      const analysisResult = await apiService.analyzeImage(request);
      
      setCurrentTheme(analysisResult.theme);
      setCurrentAnalysis(analysisResult);

      // 保存分析结果
      const savedAnalyses = JSON.parse(localStorage.getItem('focusTrackerAnalyses') || '[]');
      const newAnalyses = [...savedAnalyses, analysisResult];
      localStorage.setItem('focusTrackerAnalyses', JSON.stringify(newAnalyses));
      onAnalysesChange(newAnalyses);

      const modelName = settings.openaiApiModel === 'custom' 
        ? settings.customApiModel 
        : settings.openaiApiModel;

      setStatus({ 
        message: `分析完成 (${modelName}): ${analysisResult.theme.category} - ${analysisResult.theme.subcategory} - ${analysisResult.theme.specific}`, 
        type: 'success' 
      });
    } catch (error) {
      setStatus({ 
        message: `分析失败: ${error instanceof Error ? error.message : '未知错误'}`, 
        type: 'error' 
      });
    }
  };

  const testScreenshot = async () => {
    await takeScreenshot();
    setShowScreenshot(true);
    // 移除alert，让用户直接看到图片
  };

  const testAnalysis = async () => {
    if (!settings.openaiApiKey) {
      alert('请先配置OpenAI API密钥');
      return;
    }
    await performAnalysis();
    alert('测试分析完成');
  };

  return (
    <>
      <div className="card">
        <h3>🎮 追踪控制</h3>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>启用自动追踪：</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={settings.trackingEnabled}
                disabled
              />
              <span className="slider"></span>
            </label>
          </label>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button className="btn" onClick={testScreenshot}>
            📸 测试截图
          </button>
          <button className="btn" onClick={testAnalysis}>
            🤖 测试分析
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              screenshotService.clearCache();
              setCacheInfo({ hasCache: false, age: 0, size: 0 });
              setLastScreenshotHash(null);
              setLastScreenshotData(null);
              setShowScreenshot(false);
            }}
            disabled={!cacheInfo.hasCache}
          >
            🗑️ 清除缓存
          </button>
          {showScreenshot && lastScreenshotData && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowScreenshot(false)}
            >
              🖼️ 隐藏图片
            </button>
          )}
        </div>
        <div className={`status ${status.type}`}>
          状态：{status.message}
        </div>
      </div>

      <div className="stats">
        <div className="stat-card">
          <div className="stat-number">{screenshotCount}</div>
          <div className="stat-label">截图次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{analysisCount}</div>
          <div className="stat-label">分析次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {currentTheme ? `${currentTheme.category}-${currentTheme.subcategory}` : '-'}
          </div>
          <div className="stat-label">当前主题</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {cacheInfo.hasCache ? `${cacheInfo.age}s` : '-'}
          </div>
          <div className="stat-label">缓存年龄</div>
        </div>
      </div>

      {currentAnalysis && (
        <div className="card">
          <h3>🔍 当前分析结果</h3>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div className="theme-chip">{currentAnalysis.theme.category}</div>
              <div style={{ 
                background: currentAnalysis.confidence > 80 ? '#4caf50' : currentAnalysis.confidence > 60 ? '#ff9800' : '#f44336',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.8em',
                fontWeight: 'bold'
              }}>
                置信度: {Math.round(currentAnalysis.confidence)}%
              </div>
            </div>
            <div style={{ margin: '10px 0' }}>
              <strong>{currentAnalysis.theme.subcategory} - {currentAnalysis.theme.specific}</strong>
            </div>
            <div style={{ color: '#666', marginBottom: '10px' }}>{currentAnalysis.analysis}</div>
            <div style={{ fontSize: '0.8em', color: '#999' }}>
              分析时间: {new Date(currentAnalysis.timestamp).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      )}

      {showScreenshot && lastScreenshotData && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>📸 截图预览</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `data:image/png;base64,${lastScreenshotData}`;
                  link.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
                  link.click();
                }}
                style={{ fontSize: '0.8em', padding: '5px 10px' }}
              >
                💾 下载
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowScreenshot(false)}
                style={{ fontSize: '0.8em', padding: '5px 10px' }}
              >
                ❌ 关闭
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              border: '2px dashed #ddd', 
              borderRadius: '8px', 
              padding: '10px',
              backgroundColor: '#fafafa',
              marginBottom: '10px'
            }}>
              <img 
                src={`data:image/png;base64,${lastScreenshotData}`}
                alt="截图预览"
                style={{
                  maxWidth: '100%',
                  maxHeight: '500px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onClick={() => {
                  // 点击图片可以放大查看
                  const newWindow = window.open();
                  if (newWindow) {
                    newWindow.document.write(`
                      <html>
                        <head><title>截图详情</title></head>
                        <body style="margin:0;padding:20px;background:#f5f5f5;text-align:center;">
                          <img src="data:image/png;base64,${lastScreenshotData}" style="max-width:100%;max-height:100vh;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.2);" />
                          <div style="margin-top:20px;color:#666;">
                            截图时间: ${new Date().toLocaleString('zh-CN')} | 
                            大小: ${Math.round(lastScreenshotData.length * 3 / 4 / 1024)}KB
                          </div>
                        </body>
                      </html>
                    `);
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            </div>
            <div style={{ 
              fontSize: '0.9em', 
              color: '#666', 
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <strong>截图时间:</strong> {new Date().toLocaleString('zh-CN')}
                </div>
                <div>
                  <strong>文件大小:</strong> {lastScreenshotData ? Math.round(lastScreenshotData.length * 3 / 4 / 1024) : 0}KB
                </div>
                <div>
                  <strong>分辨率:</strong> 800×600 (压缩后)
                </div>
                <div>
                  <strong>格式:</strong> PNG
                </div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.8em', color: '#999' }}>
                💡 点击图片可以放大查看，点击下载按钮保存到本地
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TrackingControl;
