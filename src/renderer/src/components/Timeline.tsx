import React, { useState, useEffect } from 'react';
import TimelineChart from './TimelineChart';

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
  onAnalysesChange?: (analyses: Analysis[]) => void;
}

const Timeline: React.FC<TimelineProps> = ({ analyses, onAnalysesChange }) => {
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

  // 生成测试数据（仅用于演示）
  const generateTestData = () => {
    const testAnalyses: Analysis[] = [];
    const now = new Date();
    const categories = ['学习', '工作', '娱乐', '生活'];
    const subcategories = {
      '学习': ['阅读', '课程'],
      '工作': ['开发', '文档'],
      '娱乐': ['游戏', '视频'],
      '生活': ['购物', '社交', '运动']
    };
    const specifics = {
      '编程': ['Python', 'JavaScript', 'TypeScript'],
      '阅读': ['技术文档', '书籍', '文章'],
      '会议': ['团队会议', '客户沟通', '项目讨论'],
      '开发': ['前端开发', '后端开发', '测试'],
      '游戏': ['我的世界', '其他游戏'],
      '视频': ['YouTube', 'B站', 'Netflix'],
      '购物': ['网购', '实体店'],
      '社交': ['微信', 'QQ', '电话']
    };

    // 生成过去7天的数据
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);

      // 每天生成6-10个时间段，分布在0:00-24:00之间
      const segmentCount = 6 + Math.floor(Math.random() * 5);
      const segments: Array<{
        startTime: number;
        endTime: number;
        category: string;
        subcategory: string;
        specific: string;
        duration: number;
      }> = [];

      for (let j = 0; j < segmentCount; j++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const subcategory = subcategories[category][Math.floor(Math.random() * subcategories[category].length)];
        const specific = specifics[subcategory] ? specifics[subcategory][Math.floor(Math.random() * specifics[subcategory].length)] : '其他';

        // 在0-24小时内随机选择开始时间
        const startHour = Math.random() *18 + 6;
        const startTime = new Date(dayStart.getTime() + startHour * 60 * 60 * 1000);
        const duration = 15 + Math.random() * 120; // 15-135分钟
        const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

        // 确保不超过当天24:00
        if (endTime.getDate() === startTime.getDate()) {
          segments.push({
            startTime: startTime.getTime(),
            endTime: endTime.getTime(),
            category,
            subcategory,
            specific,
            duration
          });
        }
      }

      // 按开始时间排序
      segments.sort((a, b) => a.startTime - b.startTime);

      // 添加到分析数据
      segments.forEach(segment => {
        testAnalyses.push({
          theme: {
            id: Math.floor(Math.random() * 1000),
            category: segment.category,
            subcategory: segment.subcategory,
            specific: segment.specific
          },
          analysis: `在${segment.category}${segment.subcategory}${segment.specific}相关活动`,
          confidence: 0.7 + Math.random() * 0.3,
          timestamp: new Date(segment.startTime).toISOString()
        });
      });
    }

    return testAnalyses.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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
          {/* <button
            className="btn btn-secondary"
            onClick={() => {
              const testData = generateTestData();
              if (onAnalysesChange) {
                onAnalysesChange(testData);
              }
              localStorage.setItem('focusTrackerAnalyses', JSON.stringify(testData));
            }}
          >
            生成测试数据
          </button> */}
        </div>
      </div>
      {/* 时间图 */}
      {analyses.length > 0 && startDate && endDate && (
        <TimelineChart
          analyses={analyses}
        />
      )}

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
