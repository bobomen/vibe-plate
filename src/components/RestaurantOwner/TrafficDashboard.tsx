import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Zap, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTrafficDashboard } from '@/hooks/useTrafficDashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrafficDashboardProps {
  restaurantId: string | undefined;
}

export function TrafficDashboard({ restaurantId }: TrafficDashboardProps) {
  const { data: trafficData, isLoading } = useTrafficDashboard(restaurantId);

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

  if (!trafficData) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>目前沒有活躍的廣告訂閱</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { 
    currentMultiplier, 
    baseTraffic, 
    bonusTraffic,
    couponBudget,
    totalRedeemed,
    remainingBudget,
    budgetUsagePercent,
    nextMilestone,
    multiplierHistory 
  } = trafficData;

  const trafficPercent = currentMultiplier * 100;
  const basePercent = baseTraffic * 100;
  const bonusPercent = bonusTraffic * 100;

  // 預算警示等級
  const getBudgetLevel = () => {
    if (budgetUsagePercent >= 100) return 'exhausted';
    if (budgetUsagePercent >= 80) return 'critical';
    if (budgetUsagePercent >= 60) return 'warning';
    return 'normal';
  };

  const budgetLevel = getBudgetLevel();

  return (
    <div className="space-y-6">
      {/* 當前流量狀態 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            當前流量狀態
          </CardTitle>
          <CardDescription>您的餐廳曝光流量倍數</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="text-5xl font-bold text-primary">{trafficPercent.toFixed(0)}%</div>
            <div className="flex items-center gap-2 mb-2">
              {currentMultiplier >= 1.0 ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <Badge variant="default" className="bg-green-500">最高流量</Badge>
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <Badge variant="secondary">可提升</Badge>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">基礎流量</span>
              <span className="font-medium">{basePercent.toFixed(0)}%</span>
            </div>
            <Progress value={basePercent} className="h-2" />
          </div>

          {bonusPercent > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">加成流量</span>
                <span className="font-medium text-primary">+{bonusPercent.toFixed(0)}%</span>
              </div>
              <Progress value={bonusPercent} className="h-2" />
            </div>
          )}

          <div className="pt-2 text-xs text-muted-foreground">
            💡 流量倍數決定您的餐廳在用戶滑卡時出現的頻率
          </div>
        </CardContent>
      </Card>

      {/* 優惠券預算監控 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            優惠券預算監控
          </CardTitle>
          <CardDescription>追蹤您的優惠券預算使用情況</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">總預算</div>
              <div className="text-2xl font-bold">{couponBudget.toLocaleString()} 元</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">已核銷</div>
              <div className="text-2xl font-bold text-orange-500">{totalRedeemed.toLocaleString()} 元</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">剩餘</div>
              <div className="text-2xl font-bold text-green-500">{remainingBudget.toLocaleString()} 元</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">預算使用進度</span>
              <span className="font-medium">{budgetUsagePercent.toFixed(1)}%</span>
            </div>
            <Progress 
              value={budgetUsagePercent} 
              className={`h-3 ${
                budgetLevel === 'exhausted' ? 'bg-red-100' :
                budgetLevel === 'critical' ? 'bg-orange-100' :
                budgetLevel === 'warning' ? 'bg-yellow-100' : ''
              }`}
            />
          </div>

          {budgetLevel === 'exhausted' && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                優惠券預算已用盡，新用戶將無法領取優惠券
              </AlertDescription>
            </Alert>
          )}

          {budgetLevel === 'critical' && (
            <Alert className="border-orange-500 text-orange-700">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                優惠券預算即將用盡（剩餘 {remainingBudget.toLocaleString()} 元）
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 流量提升指引 */}
      {nextMilestone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              流量提升指引
            </CardTitle>
            <CardDescription>下個流量里程碑</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-primary/5 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">再核銷</div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {nextMilestone.amount.toLocaleString()} 元
                </div>
                <div className="text-sm">
                  流量將提升至 <span className="font-semibold text-primary">{(nextMilestone.newMultiplier * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                💡 每核銷 500 元優惠券，流量提升 5%，最高可達 100%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 流量倍數歷史趨勢 */}
      {multiplierHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>流量倍數變化趨勢</CardTitle>
            <CardDescription>追蹤您的流量提升歷程</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={multiplierHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[0.75, 1.05]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, '流量倍數']}
                  labelFormatter={(label) => `日期: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="multiplier" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
