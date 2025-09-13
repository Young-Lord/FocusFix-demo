import React, { useState, useEffect } from 'react';
import './FocusTracker.css';
import Timeline from './Timeline';
import TrackingControl from './TrackingControl';
import ThemeManager from './ThemeManager';
import SettingsComponent from './Settings';

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

const FocusTracker: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('timeline');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [settings, setSettings] = useState<Settings>({
    trackingEnabled: false,
    openaiApiKey: 'sk-8Nz6BDNk4E67460222C1T3BlBkFJ8067Dceff21C4D38Ba22',
    openaiApiEndpoint: 'https://cn2us02.opapi.win/v1',
    openaiApiModel: 'custom',
    customApiModel: 'gpt-4.1-nano',
    screenshotInterval: 10,
    analysisInterval: 20,
    similarityThreshold: 80
  });
  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  // 初始化数据
  useEffect(() => {
    loadSettings();
    loadThemes();
    loadAnalyses();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('focusTrackerSettings');
    if (saved) {
      setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
    }
  };

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('focusTrackerSettings', JSON.stringify(newSettings));
  };

  const loadThemes = () => {
    const saved = localStorage.getItem('focusTrackerThemes');
    if (saved) {
      setThemes(JSON.parse(saved));
    } else {
      // 默认主题
      const defaultThemes: Theme[] = [
        { id: 4, category: '学习', subcategory: '阅读', specific: '技术文档' },
        { id: 5, category: '学习', subcategory: '阅读', specific: '书籍' },
        { id: 6, category: '工作', subcategory: '会议', specific: '团队会议' },
        { id: 7, category: '工作', subcategory: '会议', specific: '客户沟通' },
        { id: 8, category: '工作', subcategory: '开发', specific: '前端开发' },
        { id: 9, category: '工作', subcategory: '开发', specific: '后端开发' },
        { id: 10, category: '娱乐', subcategory: '游戏', specific: '我的世界' },
        { id: 11, category: '娱乐', subcategory: '游戏', specific: '其他游戏' },
        { id: 12, category: '娱乐', subcategory: '视频', specific: 'YouTube' },
        { id: 13, category: '娱乐', subcategory: '视频', specific: 'B站' },
        { id: 14, category: '生活', subcategory: '购物', specific: '网购' },
        { id: 15, category: '生活', subcategory: '社交', specific: '微信' },
        { id: 16, category: '生活', subcategory: '社交', specific: 'QQ' }
      ];
      setThemes(defaultThemes);
      localStorage.setItem('focusTrackerThemes', JSON.stringify(defaultThemes));
    }
  };

  const loadAnalyses = () => {
    const saved = localStorage.getItem('focusTrackerAnalyses');
    if (saved) {
      setAnalyses(JSON.parse(saved));
    }
  };

  const saveAnalyses = (newAnalyses: Analysis[]) => {
    setAnalyses(newAnalyses);
    localStorage.setItem('focusTrackerAnalyses', JSON.stringify(newAnalyses));
  };

  const showTab = (tabName: string) => {
    setCurrentTab(tabName);
  };

  return (
    <div className="container">
      {/* 头部 */}
      <div className="header">
        <h1>🎯 FocusFix</h1>
        <p>AI驱动的智能时间追踪应用</p>
      </div>

      {/* 标签页 */}
      <div className="tabs">
        <button
          className={`tab ${currentTab === 'timeline' ? 'active' : ''}`}
          onClick={() => showTab('timeline')}
        >
          时间线
        </button>
        <button
          className={`tab ${currentTab === 'tracking' ? 'active' : ''}`}
          onClick={() => showTab('tracking')}
        >
          追踪控制
        </button>
        <button
          className={`tab ${currentTab === 'themes' ? 'active' : ''}`}
          onClick={() => showTab('themes')}
        >
          主题管理
        </button>
        <button
          className={`tab ${currentTab === 'settings' ? 'active' : ''}`}
          onClick={() => showTab('settings')}
        >
          设置
        </button>
      </div>

      {/* 时间线标签页 */}
      {currentTab === 'timeline' && (
        <div className="tab-content active">
          <Timeline analyses={analyses} onAnalysesChange={saveAnalyses} />
        </div>
      )}

      {/* 追踪控制标签页 */}
      {currentTab === 'tracking' && (
        <div className="tab-content active">
          <TrackingControl
            settings={settings}
            themes={themes}
            onAnalysesChange={saveAnalyses}
            onSettingsChange={saveSettings}
          />
        </div>
      )}

      {/* 主题管理标签页 */}
      {currentTab === 'themes' && (
        <div className="tab-content active">
          <ThemeManager
            themes={themes}
            onThemesChange={(newThemes) => {
              setThemes(newThemes);
              localStorage.setItem('focusTrackerThemes', JSON.stringify(newThemes));
            }}
          />
        </div>
      )}

      {/* 设置标签页 */}
      {currentTab === 'settings' && (
        <div className="tab-content active">
          <SettingsComponent
            settings={settings}
            onSettingsChange={saveSettings}
          />
        </div>
      )}

    </div>
  );
};

export default FocusTracker;
