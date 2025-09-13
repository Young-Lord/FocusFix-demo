import React from 'react';
import { apiService } from '../services/apiService';

interface Settings {
  trackingEnabled: boolean;
  openaiApiKey: string;
  openaiApiEndpoint: string;
  openaiApiModel: string;
  customApiModel: string;
  screenshotInterval: number;
  analysisInterval: number;
  similarityThreshold: number;
}

interface SettingsProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange }) => {
  const handleInputChange = (field: keyof Settings, value: string | number | boolean) => {
    onSettingsChange({
      ...settings,
      [field]: value
    });
  };

  const resetSettings = () => {
    const defaultSettings: Settings = {
      trackingEnabled: false,
      openaiApiKey: '',
      openaiApiEndpoint: 'https://api.openai.com/v1',
      openaiApiModel: 'gpt-4o-mini',
      customApiModel: '',
      screenshotInterval: 30,
      analysisInterval: 300,
      similarityThreshold: 95
    };
    onSettingsChange(defaultSettings);
  };

  const saveSettings = () => {
    // 设置已经通过onSettingsChange实时保存了
    alert('设置已保存');
  };

  const testApiConnection = async () => {
    if (!settings.openaiApiKey) {
      alert('请先输入API密钥');
      return;
    }

    // 验证配置
    const validation = apiService.validateConfig({
      endpoint: settings.openaiApiEndpoint,
      apiKey: settings.openaiApiKey,
      model: settings.openaiApiModel,
      customModel: settings.customApiModel
    });

    if (!validation.valid) {
      alert(`配置验证失败：\n${validation.errors.join('\n')}`);
      return;
    }

    // 设置API配置
    apiService.setConfig({
      endpoint: settings.openaiApiEndpoint,
      apiKey: settings.openaiApiKey,
      model: settings.openaiApiModel,
      customModel: settings.customApiModel
    });

    try {
      const result = await apiService.testConnection();
      
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      alert(`❌ API连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <>
      <div className="card">
        <h3>🔗 API 配置</h3>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>当前配置：</strong>
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <div>端点: {settings.openaiApiEndpoint}</div>
            <div>模型: {settings.openaiApiModel === 'custom' ? settings.customApiModel : settings.openaiApiModel}</div>
            <div>密钥: {settings.openaiApiKey ? `${settings.openaiApiKey.substring(0, 8)}...` : '未设置'}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>⚙️ 基本设置</h3>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>启用自动追踪：</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={settings.trackingEnabled}
                onChange={(e) => handleInputChange('trackingEnabled', e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </label>
        </div>
        <div className="form-group">
          <label>OpenAI API 密钥：</label>
          <input 
            type="password" 
            value={settings.openaiApiKey}
            onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
            placeholder="sk-..."
          />
          <small style={{ color: '#666' }}>用于AI分析功能的OpenAI API密钥</small>
        </div>
        <div className="form-group">
          <label>API 端点：</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="url" 
              value={settings.openaiApiEndpoint}
              onChange={(e) => handleInputChange('openaiApiEndpoint', e.target.value)}
              placeholder="https://api.openai.com/v1"
              style={{ flex: 1 }}
            />
            <button 
              className="btn btn-secondary" 
              onClick={testApiConnection}
              style={{ whiteSpace: 'nowrap' }}
            >
              测试连接
            </button>
          </div>
          <small style={{ color: '#666' }}>OpenAI API的端点地址，支持自定义代理</small>
        </div>
        <div className="form-group">
          <label>API 模型：</label>
          <select 
            value={settings.openaiApiModel}
            onChange={(e) => handleInputChange('openaiApiModel', e.target.value)}
          >
            <optgroup label="OpenAI Vision 模型（推荐）">
              <option value="gpt-4o">GPT-4o (Vision)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (Vision)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo (Vision)</option>
              <option value="gpt-4-vision-preview">GPT-4 Vision Preview</option>
            </optgroup>
            <optgroup label="其他模型">
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </optgroup>
            <optgroup label="自定义">
              <option value="custom">自定义模型</option>
            </optgroup>
          </select>
          <small style={{ color: '#666' }}>选择用于图片分析的AI模型，Vision模型效果最佳</small>
        </div>
        {settings.openaiApiModel === 'custom' && (
          <div className="form-group">
            <label>自定义模型名称：</label>
            <input 
              type="text" 
              value={settings.customApiModel}
              onChange={(e) => handleInputChange('customApiModel', e.target.value)}
              placeholder="输入自定义模型名称"
            />
            <small style={{ color: '#666' }}>输入自定义的模型名称</small>
          </div>
        )}
      </div>

      <div className="card">
        <h3>⏰ 时间设置</h3>
        <div className="form-group">
          <label>截图间隔（秒）：</label>
          <input 
            type="number" 
            value={settings.screenshotInterval}
            onChange={(e) => handleInputChange('screenshotInterval', parseInt(e.target.value) || 30)}
            min="10" 
            max="300" 
          />
          <small style={{ color: '#666' }}>屏幕截图的频率，建议30-120秒</small>
        </div>
        <div className="form-group">
          <label>AI分析间隔（秒）：</label>
          <input 
            type="number" 
            value={settings.analysisInterval}
            onChange={(e) => handleInputChange('analysisInterval', parseInt(e.target.value) || 300)}
            min="60" 
            max="1800" 
          />
          <small style={{ color: '#666' }}>发送给AI分析的频率，建议300-900秒</small>
        </div>
      </div>

      <div className="card">
        <h3>🔧 高级设置</h3>
        <div className="form-group">
          <label>图片相似度阈值（%）：</label>
          <input 
            type="range" 
            value={settings.similarityThreshold}
            onChange={(e) => handleInputChange('similarityThreshold', parseInt(e.target.value))}
            min="80" 
            max="100" 
          />
          <span>{settings.similarityThreshold}%</span>
          <small style={{ color: '#666' }}>当连续截图相似度超过此阈值时，跳过AI分析</small>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <button className="btn btn-secondary" onClick={resetSettings}>
          重置
        </button>
        <button className="btn" onClick={saveSettings}>
          保存设置
        </button>
      </div>
    </>
  );
};

export default Settings;
