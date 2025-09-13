import React, { useState, useEffect } from 'react';

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

interface TimelineProps {
  analyses: Analysis[];
}

const Timeline: React.FC<TimelineProps> = ({ analyses }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredAnalyses, setFilteredAnalyses] = useState<Analysis[]>([]);

  useEffect(() => {
    // 设置默认日期范围（最近7天）
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(weekAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadTimeline();
    }
  }, [startDate, endDate, analyses]);

  const loadTimeline = () => {
    if (!startDate || !endDate) {
      setFilteredAnalyses([]);
      return;
    }

    const filtered = analyses.filter(analysis => {
      const analysisDate = new Date(analysis.timestamp).toISOString().split('T')[0];
      return analysisDate >= startDate && analysisDate <= endDate;
    });

    setFilteredAnalyses(filtered);
  };

  const renderTimeline = () => {
    if (filteredAnalyses.length === 0) {
      return (
        <div className="alert alert-info">
          该日期范围内没有数据
        </div>
      );
    }

    // 按日期分组
    const grouped = filteredAnalyses.reduce((acc, analysis) => {
      const date = new Date(analysis.timestamp).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(analysis);
      return acc;
    }, {} as Record<string, Analysis[]>);

    return Object.keys(grouped).sort().reverse().map(date => {
      const dateAnalyses = grouped[date];
      return (
        <div key={date} className="timeline-item">
          <div className="timeline-date">
            {new Date(date).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </div>
          {dateAnalyses.map((analysis, index) => (
            <div key={index}>
              <div className="timeline-theme">
                <div className="theme-chip">{analysis.theme.category}</div>
                <div>
                  <strong>{analysis.theme.subcategory} - {analysis.theme.specific}</strong>
                </div>
                <div className="timeline-duration">
                  {new Date(analysis.timestamp).toLocaleTimeString('zh-CN')}
                </div>
              </div>
              <div style={{ color: '#666', marginTop: '5px' }}>
                {analysis.analysis}
              </div>
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <div className="card">
      <h3>📊 专注时间线</h3>
      <div className="form-group">
        <label>选择日期范围：</label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ flex: 1 }} 
          />
          <span>至</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ flex: 1 }} 
          />
          <button className="btn" onClick={loadTimeline}>
            加载
          </button>
        </div>
      </div>
      <div id="timelineContent">
        {analyses.length === 0 ? (
          <div className="alert alert-info">
            <strong>提示：</strong>请先开始追踪以查看时间线数据。
          </div>
        ) : (
          renderTimeline()
        )}
      </div>
    </div>
  );
};

export default Timeline;
