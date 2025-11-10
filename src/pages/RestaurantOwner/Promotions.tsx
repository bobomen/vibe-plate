import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Megaphone, Lock, Sparkles, TrendingUp } from 'lucide-react';
import { useRestaurantOwner } from '@/hooks/useRestaurantOwner';
import { useAdSubscription } from '@/hooks/useAdSubscription';
import { AdSubscriptionWizard } from '@/components/RestaurantOwner/AdSubscriptionWizard';
import { AdSubscriptionStatus } from '@/components/RestaurantOwner/AdSubscriptionStatus';
import { toast } from 'sonner';

export default function RestaurantOwnerPromotions() {
  const { ownerData, loading: ownerLoading } = useRestaurantOwner();
  const { subscription, loading: subLoading, createSubscription, cancelSubscription, refetch } =
    useAdSubscription(ownerData?.restaurantId);
  const [showWizard, setShowWizard] = useState(false);

  const loading = ownerLoading || subLoading;

  const handleCreateSubscription = async (data: {
    plan_amount: number;
    cash_paid: number;
    coupon_budget: number;
    expires_at: string;
  }) => {
    try {
      await createSubscription(data);
      setShowWizard(false);
      toast.success('廣告訂閱創建成功！');
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('創建失敗，請重試');
      throw error;
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('確定要取消訂閱嗎？取消後將無法恢復。')) {
      return;
    }

    try {
      await cancelSubscription();
      toast.success('訂閱已取消');
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('取消失敗，請重試');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // 未订阅状态：显示锁定状态 + Empty State
  if (!subscription) {
    return (
      <>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* 頂部標題 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">廣告投放</h1>
              <p className="text-muted-foreground mt-1">提升餐廳曝光，吸引更多顧客</p>
            </div>
          </div>

          {/* 鎖定狀態預覽 */}
          <div className="relative">
            <div className="pointer-events-none opacity-50 blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">優惠券統計</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">流量儀表板</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">成效分析</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 半透明覆蓋層 + CTA */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <EmptyState
                icon={<Lock className="w-12 h-12" />}
                title="開啟廣告投放，提升餐廳曝光"
                description="通過智能廣告投放系統，讓更多用戶發現您的餐廳"
                action={
                  <Button size="lg" onClick={() => setShowWizard(true)} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    開始設置廣告方案
                  </Button>
                }
              />
            </div>
          </div>

          {/* 功能介紹 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <Megaphone className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">智能曝光提升</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  基礎流量80%起步，隨優惠券核銷自動提升，最高可達100%曝光率
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">靈活方案配置</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  自定義現金+優惠券組合，每核銷¥500優惠券，流量提升5%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Sparkles className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">即時數據追蹤</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  優惠券領取、核銷、流量變化等數據即時更新，效果一目了然
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {showWizard && (
          <AdSubscriptionWizard
            onComplete={handleCreateSubscription}
            onCancel={() => setShowWizard(false)}
          />
        )}
      </>
    );
  }

  // 已订阅状态：显示完整仪表板
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 頂部標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">廣告投放</h1>
          <p className="text-muted-foreground mt-1">管理您的廣告投放和優惠券</p>
        </div>
      </div>

      {/* 訂閱狀態卡片 */}
      <AdSubscriptionStatus
        subscription={subscription}
        onCancelSubscription={handleCancelSubscription}
      />

      {/* 數據儀表板 - 佔位符 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">優惠券使用統計</CardTitle>
            <CardDescription>即將推出</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              優惠券領取率、核銷率等詳細數據統計
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">流量儀表板</CardTitle>
            <CardDescription>即將推出</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              曝光次數、點擊率、流量變化趨勢圖表
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">廣告成效分析</CardTitle>
            <CardDescription>即將推出</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              ROI分析、轉化率、用戶互動等深度數據
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
