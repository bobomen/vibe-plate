import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Ticket, DollarSign, AlertCircle } from 'lucide-react';
import { AdSubscription } from '@/hooks/useAdSubscription';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface AdSubscriptionStatusProps {
  subscription: AdSubscription;
  onCancelSubscription: () => void;
}

export function AdSubscriptionStatus({
  subscription,
  onCancelSubscription,
}: AdSubscriptionStatusProps) {
  const daysRemaining = Math.ceil(
    (new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const redemptionProgress =
    (subscription.total_redeemed_amount / subscription.coupon_budget) * 100;

  const trafficProgress = ((subscription.traffic_multiplier - 0.8) / 0.2) * 100;

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
            <p className="text-2xl font-bold">¥{subscription.plan_amount}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Ticket className="w-4 h-4" />
              優惠券預算
            </div>
            <p className="text-2xl font-bold">¥{subscription.coupon_budget}</p>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">優惠券核銷進度</span>
            <span className="font-medium">
              ¥{subscription.total_redeemed_amount} / ¥{subscription.coupon_budget}
            </span>
          </div>
          <Progress value={redemptionProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            已核銷 {Math.round(redemptionProgress)}%
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">流量解鎖進度</span>
            <span className="font-medium">
              {Math.round(subscription.traffic_multiplier * 100)}% / 100%
            </span>
          </div>
          <Progress value={trafficProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            每核銷¥500優惠券，流量+5%，最高100%
          </p>
        </div>

        {daysRemaining <= 7 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
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
