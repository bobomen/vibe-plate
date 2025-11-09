import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { TrendDataPoint, TimeRange } from '@/types/restaurantOwner';
import { TrendingUp, Percent } from 'lucide-react';
import { useState } from 'react';

interface TrendChartsProps {
  data: TrendDataPoint[];
  onTimeRangeChange?: (range: TimeRange) => void;
}

export function TrendCharts({ data, onTimeRangeChange }: TrendChartsProps) {
  const [activeTab, setActiveTab] = useState<'quantity' | 'conversion'>('quantity');

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
    <Card className="col-span-full">
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
          <TabsContent value="quantity" className="h-[300px]">
            <ChartContainer config={quantityChartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="impressions" 
                    stroke="var(--color-impressions)" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: 'var(--color-impressions)', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                    name="曝光量"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="detail_views" 
                    stroke="var(--color-detail_views)" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: 'var(--color-detail_views)', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                    name="詳情頁瀏覽"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="favorites" 
                    stroke="var(--color-favorites)" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: 'var(--color-favorites)', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                    name="收藏數"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          {/* 轉化率趨勢圖 */}
          <TabsContent value="conversion" className="h-[300px]">
            <ChartContainer config={conversionChartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis 
                    className="text-xs"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: any) => `${value}%`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ctr" 
                    stroke="var(--color-ctr)" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: 'var(--color-ctr)', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                    name="點擊率"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="save_rate" 
                    stroke="var(--color-save_rate)" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: 'var(--color-save_rate)', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                    name="收藏率"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
