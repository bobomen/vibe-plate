import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, MousePointerClick, Ticket, CheckCircle, Heart, TrendingUp, DollarSign } from 'lucide-react';
import { useAdPerformance } from '@/hooks/useAdPerformance';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdPerformanceAnalyticsProps {
  restaurantId: string | undefined;
}

export function AdPerformanceAnalytics({ restaurantId }: AdPerformanceAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<7 | 30>(7);
  const { data: performanceData, isLoading } = useAdPerformance(restaurantId, timeRange);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>載入中...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>目前沒有廣告成效數據</AlertDescription>
        </Alert>
      </div>
    );
  }

  const {
    totalImpressions,
    uniqueViewers,
    totalClicks,
    clickThroughRate,
    couponsClaimed,
    couponsRedeemed,
    redemptionRate,
    newFavorites,
    dailyStats,
    roi,
  } = performanceData;

  return (
    <div className="space-y-6">
      {/* 時間範圍選擇 */}
      <div className="flex gap-2">
        <Button
          variant={timeRange === 7 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeRange(7)}
        >
          最近 7 天
        </Button>
        <Button
          variant={timeRange === 30 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeRange(30)}
        >
          最近 30 天
        </Button>
      </div>

      {/* 核心數據指標卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              總曝光
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              獨立訪客: {uniqueViewers.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-green-500" />
              總點擊
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              點擊率: {clickThroughRate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ticket className="w-4 h-4 text-orange-500" />
              優惠券
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{couponsClaimed.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              已領取 / {couponsRedeemed.toLocaleString()} 已核銷
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              新增收藏
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newFavorites.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              收藏轉換率: {totalImpressions > 0 ? ((newFavorites / totalImpressions) * 100).toFixed(2) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 曝光 & 點擊趨勢圖 */}
      {dailyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>曝光 & 點擊趨勢</CardTitle>
            <CardDescription>每日曝光和點擊數據變化</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="impressions" 
                  stroke="hsl(var(--primary))" 
                  name="曝光數"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="hsl(142, 76%, 36%)" 
                  name="點擊數"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 優惠券領取 vs 核銷對比 */}
      {dailyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>優惠券領取 vs 核銷</CardTitle>
            <CardDescription>追蹤優惠券的使用情況</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="text-sm font-medium">核銷率</span>
                <Badge variant="default" className="text-base">
                  {redemptionRate}%
                </Badge>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="claimed" fill="hsl(var(--primary))" name="已領取" />
                <Bar dataKey="redeemed" fill="hsl(142, 76%, 36%)" name="已核銷" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ROI 分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            投資回報分析（ROI）
          </CardTitle>
          <CardDescription>評估您的廣告投資效益</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">總投入</div>
              <div className="text-2xl font-bold">{roi.totalInvestment.toLocaleString()} 元</div>
              <div className="text-xs text-muted-foreground mt-1">
                現金 + 已核銷優惠券
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">觸達人數</div>
              <div className="text-2xl font-bold text-primary">{roi.totalReach.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                獨立訪客數
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">平均獲客成本</div>
              <div className="text-2xl font-bold text-green-500">
                {roi.totalReach > 0 ? roi.costPerAcquisition.toFixed(2) : 0} 元
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                每個訪客的成本
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-primary/5 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <strong>效益分析：</strong>
                {roi.totalReach > 0 ? (
                  <>
                    您以平均 {roi.costPerAcquisition.toFixed(2)} 元的成本觸達了 {roi.totalReach.toLocaleString()} 位潛在客戶，
                    其中 {newFavorites.toLocaleString()} 位將您加入收藏（轉換率 {((newFavorites / roi.totalReach) * 100).toFixed(2)}%）
                  </>
                ) : (
                  '暫無數據'
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
