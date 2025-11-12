import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Ticket, DollarSign, AlertCircle, AlertTriangle } from 'lucide-react';
import { AdSubscription } from '@/hooks/useAdSubscription';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface AdSubscriptionStatusProps {
  subscription: AdSubscription;
  stats?: {
    total_issued: number;
    total_redeemed: number;
  };
  onCancelSubscription: () => void;
}

export function AdSubscriptionStatus({
  subscription,
  stats,
  onCancelSubscription,
}: AdSubscriptionStatusProps) {
  const daysRemaining = Math.ceil(
    (new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // 预算使用率
  const budgetUsagePercent = subscription.coupon_budget > 0
    ? (subscription.total_redeemed_amount / subscription.coupon_budget) * 100
    : 0;
  
  const remainingBudget = subscription.coupon_budget - subscription.total_redeemed_amount;

  // 流量解锁进度
  const trafficProgress = ((subscription.traffic_multiplier - 0.8) / 0.2) * 100;

  // 预算警告级别
  const budgetWarningLevel = budgetUsagePercent >= 100 
    ? 'exhausted' 
    : budgetUsagePercent >= 80 
    ? 'critical' 
    : budgetUsagePercent >= 60 
    ? 'warning' 
    : 'normal';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            當前訂閱狀態
            <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
              {subscription.status === 'active' ? '進行中' : '已結束'}
            </Badge>
          </CardTitle>
          {subscription.status === 'active' && (
            <Button variant="outline" size="sm" onClick={onCancelSubscription}>
              取消訂閱
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="w-4 h-4" />
              方案金額
            </div>
            <p className="text-2xl font-bold">{subscription.plan_amount} 元</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Ticket className="w-4 h-4" />
              優惠券預算
            </div>
            <p className="text-2xl font-bold">{subscription.coupon_budget} 元</p>
            <p className="text-xs text-muted-foreground">
              剩餘 {remainingBudget} 元
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="w-4 h-4" />
              當前流量係數
            </div>
            <p className="text-2xl font-bold">
              {Math.round(subscription.traffic_multiplier * 100)}%
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="w-4 h-4" />
              剩餘天數
            </div>
            <p className="text-2xl font-bold">{daysRemaining}天</p>
          </div>
        </div>

        {/* 优惠券统计 */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">已發放優惠券</p>
              <p className="text-lg font-semibold">{stats.total_issued} 張</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">已核銷優惠券</p>
              <p className="text-lg font-semibold">{stats.total_redeemed} 張</p>
            </div>
          </div>
        )}

        {/* 预算使用进度 */}
        {subscription.coupon_budget > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">優惠券預算使用進度</span>
              <span className="font-medium">
                {subscription.total_redeemed_amount} / {subscription.coupon_budget} 元
                <span className={`ml-2 ${
                  budgetWarningLevel === 'exhausted' ? 'text-destructive' :
                  budgetWarningLevel === 'critical' ? 'text-amber-500' :
                  budgetWarningLevel === 'warning' ? 'text-yellow-500' :
                  'text-muted-foreground'
                }`}>
                  ({Math.round(budgetUsagePercent)}%)
                </span>
              </span>
            </div>
            <Progress 
              value={Math.min(budgetUsagePercent, 100)} 
              className={`h-2 ${
                budgetWarningLevel === 'exhausted' ? '[&>div]:bg-destructive' :
                budgetWarningLevel === 'critical' ? '[&>div]:bg-amber-500' :
                budgetWarningLevel === 'warning' ? '[&>div]:bg-yellow-500' :
                ''
              }`}
            />
            <p className="text-xs text-muted-foreground">
              {budgetWarningLevel === 'exhausted' 
                ? '⛔ 預算已用完，無法繼續核銷優惠券' 
                : budgetWarningLevel === 'critical'
                ? '⚠️ 預算即將用完，請注意剩餘額度'
                : budgetWarningLevel === 'warning'
                ? '💡 預算使用已過半，注意監控'
                : '✅ 預算使用正常'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">流量解鎖進度</span>
            <span className="font-medium">
              {Math.round(subscription.traffic_multiplier * 100)}% / 100%
            </span>
          </div>
          <Progress value={trafficProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            每核銷 500 元優惠券，流量 +5%，最高 100%
          </p>
        </div>

        {/* 预算警告 */}
        {budgetWarningLevel === 'exhausted' && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-destructive">優惠券預算已用完</p>
              <p className="text-muted-foreground mt-1">
                您的優惠券預算已全部使用，用戶將無法繼續核銷優惠券。系統已自動停止發放新優惠券。
              </p>
            </div>
          </div>
        )}

        {budgetWarningLevel === 'critical' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-500">優惠券預算即將用完</p>
              <p className="text-muted-foreground mt-1">
                您的優惠券預算已使用 {Math.round(budgetUsagePercent)}%，剩餘 {remainingBudget} 元。
                建議考慮續費或調整優惠券策略。
              </p>
            </div>
          </div>
        )}

        {/* 订阅到期警告 */}
        {daysRemaining <= 7 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-500">訂閱即將到期</p>
              <p className="text-muted-foreground mt-1">
                您的廣告訂閱將在{' '}
                {formatDistanceToNow(new Date(subscription.expires_at), {
                  locale: zhCN,
                  addSuffix: true,
                })}
                到期
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
