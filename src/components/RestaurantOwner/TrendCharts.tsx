import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
          <TabsContent value="quantity" className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="impressions" 
                  stroke="hsl(199, 89%, 65%)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: 'hsl(199, 89%, 65%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                  name="曝光量"
                />
                <Line 
                  type="monotone" 
                  dataKey="detail_views" 
                  stroke="hsl(142, 76%, 58%)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: 'hsl(142, 76%, 58%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                  name="詳情頁瀏覽"
                />
                <Line 
                  type="monotone" 
                  dataKey="favorites" 
                  stroke="hsl(340, 82%, 65%)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: 'hsl(340, 82%, 65%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                  name="收藏數"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* 轉化率趨勢圖 */}
          <TabsContent value="conversion" className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                  formatter={(value: any) => `${value}%`}
                />
                <Legend 
                  wrapperStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ctr" 
                  stroke="hsl(47, 96%, 60%)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: 'hsl(47, 96%, 60%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                  name="點擊率"
                />
                <Line 
                  type="monotone" 
                  dataKey="save_rate" 
                  stroke="hsl(280, 75%, 65%)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: 'hsl(280, 75%, 65%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                  name="收藏率"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
