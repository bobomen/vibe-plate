import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TrendDataPoint, TimeRange } from '@/types/restaurantOwner';
import { TrendingUp, Percent } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getChartOptimizationConfig } from '@/utils/webViewOptimization';

interface TrendChartsProps {
  data: TrendDataPoint[];
  onTimeRangeChange?: (range: TimeRange) => void;
}

export function TrendCharts({ data, onTimeRangeChange }: TrendChartsProps) {
  const [activeTab, setActiveTab] = useState<'quantity' | 'conversion'>('quantity');
  const [isChartReady, setIsChartReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const config = getChartOptimizationConfig();

  // 延迟渲染图表，确保容器尺寸已确定（针对 iPad 和 WebView 优化）
  useEffect(() => {
    setIsChartReady(false);
    
    // 使用 requestAnimationFrame + setTimeout 确保 DOM 完全渲染
    requestAnimationFrame(() => {
      const timer = setTimeout(() => {
        setIsChartReady(true);
      }, config.renderDelay);
      
      return () => clearTimeout(timer);
    });
  }, [activeTab, data.length, config.renderDelay]);

  // 监听容器尺寸变化（处理设备旋转等场景）
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (config.deviceInfo.isWebView) {
          console.log('[Chart] Container resized:', entry.contentRect);
        }
        // 容器尺寸变化时重新渲染图表
        setIsChartReady(false);
        setTimeout(() => setIsChartReady(true), 100);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [config.deviceInfo.isWebView]);

  // 数据采样（如果数据点过多，进行降采样以提升 WebView 性能）
  const chartData = useMemo(() => {
    if (data.length <= config.samplingThreshold) {
      return data;
    }
    
    // 降采样：每 N 个点保留一个
    const step = Math.ceil(data.length / config.samplingThreshold);
    return data.filter((_, index) => index % step === 0);
  }, [data, config.samplingThreshold]);

  // 输出调试信息
  useEffect(() => {
    if (config.deviceInfo.isWebView || config.deviceInfo.isIPad) {
      console.log('[TrendCharts] Environment:', {
        ...config.deviceInfo,
        config,
        originalDataLength: data.length,
        sampledDataLength: chartData.length,
      });
    }
  }, [config, data.length, chartData.length]);

  // 圖表配置
  const quantityChartConfig = {
    impressions: { label: '曝光量', color: 'hsl(var(--chart-1))' },
    detail_views: { label: '詳情頁瀏覽', color: 'hsl(var(--chart-2))' },
    favorites: { label: '收藏數', color: 'hsl(var(--chart-3))' },
  };

  const conversionChartConfig = {
    ctr: { label: '點擊率', color: 'hsl(var(--chart-4))' },
    save_rate: { label: '收藏率', color: 'hsl(var(--chart-5))' },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              數據趨勢分析
            </CardTitle>
            <CardDescription>近期表現趨勢圖</CardDescription>
          </div>
          
          {/* 時間範圍選擇器 */}
          <Tabs defaultValue="30" onValueChange={(value) => onTimeRangeChange?.(Number(value) as TimeRange)}>
            <TabsList>
              <TabsTrigger value="7">近7天</TabsTrigger>
              <TabsTrigger value="30">近30天</TabsTrigger>
              <TabsTrigger value="90">近90天</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="quantity" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              數量趨勢
            </TabsTrigger>
            <TabsTrigger value="conversion" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              轉化率趨勢
            </TabsTrigger>
          </TabsList>

          {/* 數量趨勢圖 */}
          <TabsContent 
            value="quantity"
            ref={containerRef}
            className="relative"
            style={{
              height: '400px',
              minHeight: '400px',
              maxHeight: '400px',
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
              // WebView 硬件加速关键 CSS
              WebkitTransform: 'translateZ(0)',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              WebkitPerspective: 1000,
              perspective: 1000,
              willChange: 'transform',
            }}
          >
            {isChartReady ? (
              <ResponsiveContainer 
                width="100%" 
                height={400}
                key={`quantity-${activeTab}-${chartData.length}`}
              >
                <LineChart 
                  data={chartData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--muted))" 
                    opacity={0.2}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    stroke="hsl(var(--border))"
                    height={40}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    stroke="hsl(var(--border))"
                    width={50}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--popover-foreground))',
                      WebkitTransform: 'translateZ(0)',
                      transform: 'translateZ(0)',
                    }}
                    animationDuration={0}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      color: 'hsl(var(--foreground))',
                      paddingTop: '10px',
                    }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="impressions" 
                    stroke="hsl(199, 89%, 65%)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: 'hsl(199, 89%, 65%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    name="曝光量"
                    isAnimationActive={config.enableAnimation}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="detail_views" 
                    stroke="hsl(142, 76%, 58%)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: 'hsl(142, 76%, 58%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    name="詳情頁瀏覽"
                    isAnimationActive={config.enableAnimation}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="favorites" 
                    stroke="hsl(340, 82%, 65%)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: 'hsl(340, 82%, 65%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    name="收藏數"
                    isAnimationActive={config.enableAnimation}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div 
                className="flex items-center justify-center h-full"
                style={{ height: '400px' }}
              >
                <div className="animate-pulse text-muted-foreground text-sm">
                  載入圖表中...
                </div>
              </div>
            )}
          </TabsContent>

          {/* 轉化率趨勢圖 */}
          <TabsContent 
            value="conversion"
            className="relative"
            style={{
              height: '400px',
              minHeight: '400px',
              maxHeight: '400px',
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
              WebkitTransform: 'translateZ(0)',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              WebkitPerspective: 1000,
              perspective: 1000,
              willChange: 'transform',
            }}
          >
            {isChartReady ? (
              <ResponsiveContainer 
                width="100%" 
                height={400}
                key={`conversion-${activeTab}-${chartData.length}`}
              >
                <LineChart 
                  data={chartData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--muted))" 
                    opacity={0.2}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    stroke="hsl(var(--border))"
                    height={40}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    stroke="hsl(var(--border))"
                    tickFormatter={(value) => `${value}%`}
                    width={50}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--popover-foreground))',
                      WebkitTransform: 'translateZ(0)',
                      transform: 'translateZ(0)',
                    }}
                    formatter={(value: any) => `${value}%`}
                    animationDuration={0}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      color: 'hsl(var(--foreground))',
                      paddingTop: '10px',
                    }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ctr" 
                    stroke="hsl(47, 96%, 60%)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: 'hsl(47, 96%, 60%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    name="點擊率"
                    isAnimationActive={config.enableAnimation}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="save_rate" 
                    stroke="hsl(280, 75%, 65%)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: 'hsl(280, 75%, 65%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    name="收藏率"
                    isAnimationActive={config.enableAnimation}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div 
                className="flex items-center justify-center h-full"
                style={{ height: '400px' }}
              >
                <div className="animate-pulse text-muted-foreground text-sm">
                  載入圖表中...
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
