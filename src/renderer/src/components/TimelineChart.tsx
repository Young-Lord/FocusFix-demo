import React, { useState, useEffect, useRef, useCallback } from 'react';

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

interface TimelineChartProps {
    analyses: Analysis[];
}

interface TimeSegment {
    startTime: number;
    endTime: number;
    category: string;
    subcategory: string;
    specific: string;
    analysis: string;
    confidence: number;
}

const TimelineChart: React.FC<TimelineChartProps> = ({ analyses }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [panX, setPanX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, panX: 0 });
    const [hoveredSegment, setHoveredSegment] = useState<TimeSegment | null>(null);

    // 颜色映射
    const getCategoryColor = (category: string) => {
        switch (category) {
            case '娱乐':
                return '#2196F3'; // 蓝色
            case '学习':
                if (analyses.find(a => a.theme.subcategory === '编程')) {
                    return '#F44336'; // 红色
                }
                return '#4CAF50'; // 绿色
            case '工作':
                return '#FF9800'; // 橙色
            case '生活':
                return '#9C27B0'; // 紫色
            default:
                return 'rgba(255, 255, 255, 0.1)'; // 透明白底（空闲）
        }
    };

    // 处理分析数据，转换为时间段
    const processAnalyses = useCallback((): TimeSegment[] => {
        if (!analyses.length) return [];

        const segments: TimeSegment[] = [];
        const sortedAnalyses = [...analyses].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        for (let i = 0; i < sortedAnalyses.length; i++) {
            const current = sortedAnalyses[i];
            const next = sortedAnalyses[i + 1];

            const startTime = new Date(current.timestamp).getTime();
            const endTime = next
                ? new Date(next.timestamp).getTime()
                : startTime + 20 * 60 * 1000; // 默认20分钟

            segments.push({
                startTime,
                endTime,
                category: current.theme.category,
                subcategory: current.theme.subcategory,
                specific: current.theme.specific,
                analysis: current.analysis,
                confidence: current.confidence
            });
        }

        return segments;
    }, [analyses]);

    // 计算时间范围和像素比例
    const getTimeRange = useCallback(() => {
        const segments = processAnalyses();
        if (segments.length === 0) return { minTime: 0, maxTime: 0, timeRange: 0, pixelsPerMs: 0 };

        // 获取所有日期的范围，使用本地时区
        const dates = [...new Set(segments.map(s => {
            const date = new Date(s.startTime);
            return date.getFullYear() + '-' +
                String(date.getMonth() + 1).padStart(2, '0') + '-' +
                String(date.getDate()).padStart(2, '0');
        }))].sort();

        if (dates.length === 0) return { minTime: 0, maxTime: 0, timeRange: 0, pixelsPerMs: 0 };

        // 每天的时间范围是0:00-24:00（本地时区）
        const firstDate = dates[0].split('-').map(Number);
        const lastDate = dates[dates.length - 1].split('-').map(Number);

        const minTime = new Date(firstDate[0], firstDate[1] - 1, firstDate[2], 0, 0, 0).getTime();
        const maxTime = new Date(lastDate[0], lastDate[1] - 1, lastDate[2], 24, 0, 0).getTime();
        const timeRange = maxTime - minTime;

        // 基础宽度为1000px，每小时的宽度为1000/24 ≈ 41.67px
        const baseWidth = 1000;
        const pixelsPerMs = (baseWidth * zoom) / (24 * 60 * 60 * 1000); // 每天24小时的像素比例

        return { minTime, maxTime, timeRange, pixelsPerMs, dates };
    }, [processAnalyses, zoom]);

    // 处理鼠标滚轮缩放
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.2, Math.min(2, zoom * delta));
        setZoom(newZoom);
    }, [zoom]);

    // 处理鼠标拖动
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault(); // 防止文字选中
        setIsDragging(true);
        setDragStart({ x: e.clientX, panX });
    }, [panX]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // 处理鼠标移动（拖动和悬停）
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging) {
            e.preventDefault(); // 防止文字选中
            const deltaX = e.clientX - dragStart.x;
            const { pixelsPerMs } = getTimeRange();
            const hourMs = 60 * 60 * 1000;
            const newPanX = Math.max(-hourMs * pixelsPerMs * 24, Math.min(0, dragStart.panX + deltaX));
            setPanX(newPanX);
        }
    }, [isDragging, dragStart]);

    // 处理时间段悬停
    const handleSegmentHover = useCallback((segment: TimeSegment | null) => {
        setHoveredSegment(segment);
    }, []);

    // 初始化事件监听器
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleWheel);
        return () => container.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // 渲染小时刻度
    const renderHourMarkers = () => {
        const { minTime, pixelsPerMs, dates } = getTimeRange();
        if (pixelsPerMs === 0 || !dates) return null;

        const markers: React.ReactElement[] = [];
        const hourMs = 60 * 60 * 1000;

        // 为每一天渲染0-24小时的时间刻度
        if (dates.length > 0) {
            const dateStr = dates[0];
            const [year, month, day] = dateStr.split('-').map(Number);
            const dayStart = new Date(year, month - 1, day, 0, 0, 0).getTime();

            // 每天的基础位置（暂时未使用，保留用于未来扩展）
            // const dayBaseLeft = dateIndex * 1000;

            // 渲染0-24小时
            for (let hour = 0; hour <= 24; hour++) {
                const hourTime = dayStart + hour * hourMs;
                const left = (hourTime - minTime) * pixelsPerMs;

                markers.push(
                    <div
                        key={`${dateStr}-${hour}`}
                        className="hour-marker"
                        style={{
                            left: `${left}px`,
                            position: 'absolute',
                            top: '0',
                            height: '100%',
                            width: '1px',
                            backgroundColor: '#ddd',
                            zIndex: 1
                        }}
                    >
                        <div className="hour-label"
                            style={{
                                padding: 0,
                                maxWidth: `${hourMs * pixelsPerMs - 2}px`,
                                overflow: 'hidden',
                            }}>
                            {hour === 24 ? '24' : hour.toString()}
                        </div>
                    </div>
                );
            }
        }

        return markers;
    };

    // 渲染日期列
    const renderDateColumn = () => {
        const { dates } = getTimeRange();
        if (!dates) return null;

        return (
            <div className="date-column">
                <div className="date-header">日期</div>
                {dates.map((date) => (
                    <div key={date} className="date-item">
                        {new Date(date).toLocaleDateString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            weekday: 'short'
                        })}
                    </div>
                ))}
            </div>
        );
    };

    // 渲染时间段
    const renderTimeSegments = () => {
        const segments = processAnalyses();
        if (segments.length === 0) return null;

        const { pixelsPerMs, dates } = getTimeRange();
        if (pixelsPerMs === 0 || !dates) return null;

        // 按日期分组
        const segmentsByDate = segments.reduce((acc, segment) => {
            const segmentDate = new Date(segment.startTime);
            // 使用本地时区获取日期字符串
            const date = segmentDate.getFullYear() + '-' +
                String(segmentDate.getMonth() + 1).padStart(2, '0') + '-' +
                String(segmentDate.getDate()).padStart(2, '0');
            if (!acc[date]) acc[date] = [];
            acc[date].push(segment);
            return acc;
        }, {} as Record<string, TimeSegment[]>);

        return dates.map((date) => {
            // 创建当天0:00的本地时间
            const [year, month, day] = date.split('-').map(Number);
            const dayStart = new Date(year, month - 1, day, 0, 0, 0).getTime();

            return (
                <div key={date} className="timeline-day">
                    <div className="day-segments">
                        {segmentsByDate[date]?.map((segment, segmentIndex) => {
                            // 使用本地时间计算位置
                            const segmentStart = new Date(segment.startTime).getTime();
                            const segmentEnd = new Date(segment.endTime).getTime();

                            const left = (segmentStart - dayStart) * pixelsPerMs;
                            const width = (Math.min(segmentEnd, dayStart + 24 * 60 * 60 * 1000) - segmentStart) * pixelsPerMs;

                            return (
                                <div
                                    key={segmentIndex}
                                    className={`time-segment ${hoveredSegment === segment ? 'hovered' : ''}`}
                                    style={{
                                        left: `${left}px`,
                                        width: `${Math.max(width, 2)}px`,
                                        backgroundColor: getCategoryColor(segment.category),
                                        position: 'absolute',
                                        top: '5px',
                                        height: '30px',
                                        borderRadius: '4px',
                                        border: '1px solid #fff',
                                        cursor: 'pointer',
                                        zIndex: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={() => handleSegmentHover(segment)}
                                    onMouseLeave={() => handleSegmentHover(null)}
                                    title={`${segment.category} - ${segment.subcategory} - ${segment.specific}`}
                                >
                                    {width > 50 ? (segment.subcategory || segment.category) : ''}
                                </div>
                            );
                        }) || []}
                    </div>
                </div>
            );
        });
    };

    if (analyses.length === 0) {
        return (
            <div className="alert alert-info">
                暂无数据可显示
            </div>
        );
    }

    return (
        <div className="timeline-chart-container">
            <div className="timeline-chart-header">
                <h4>📊 时间分布图</h4>
                <div className="chart-c缩放ontrols">
                    {/* <span>缩放: {Math.round(zoom * 100)}%</span> */}
                    <button
                        className="btn btn-secondary"
                        onClick={() => { setZoom(1); setPanX(0); }}
                    >
                        重置视图
                    </button>
                </div>
            </div>

            <div className="timeline-chart-wrapper">
                {/* 左侧日期列 - 固定不动 */}
                {renderDateColumn()}

                {/* 右侧时间轴和内容区域 - 可滚动和缩放 */}
                <div
                    ref={containerRef}
                    className="timeline-content-area"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    <div className="timeline-chart-content">
                        <div className="hour-markers" style={{ transform: `translateX(${panX}px)` }}>
                            {renderHourMarkers()}
                        </div>
                        <div
                            ref={timelineRef}
                            className="timeline-rows"
                            style={{
                                transform: `translateX(${panX}px)`
                            }}
                        >
                            {renderTimeSegments()}
                        </div>
                    </div>
                </div>
            </div>

            {hoveredSegment && (
                <div className="timeline-tooltip">
                    <div className="tooltip-category" style={{ backgroundColor: getCategoryColor(hoveredSegment.category) }}>
                        {hoveredSegment.category}
                    </div>
                    <div className="tooltip-details">
                        <strong>{hoveredSegment.subcategory} - {hoveredSegment.specific}</strong>
                        <div className="tooltip-time">
                            {new Date(hoveredSegment.startTime).toLocaleTimeString()} -
                            {new Date(hoveredSegment.endTime).toLocaleTimeString()}
                        </div>
                        <div className="tooltip-analysis">{hoveredSegment.analysis}</div>
                    </div>
                </div>
            )}

            <div className="timeline-legend">
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                    <span>空闲</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#2196F3' }}></div>
                    <span>娱乐</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#F44336' }}></div>
                    <span>编程</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
                    <span>学习</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#FF9800' }}></div>
                    <span>工作</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#9C27B0' }}></div>
                    <span>生活</span>
                </div>
            </div>
        </div>
    );
};

export default TimelineChart;