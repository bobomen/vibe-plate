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
      toast.success('广告订阅创建成功！');
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('创建失败，请重试');
      throw error;
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('确定要取消订阅吗？取消后将无法恢复。')) {
      return;
    }

    try {
      await cancelSubscription();
      toast.success('订阅已取消');
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('取消失败，请重试');
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
          {/* 顶部标题 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">广告投放</h1>
              <p className="text-muted-foreground mt-1">提升餐厅曝光，吸引更多顾客</p>
            </div>
          </div>

          {/* 锁定状态预览 */}
          <div className="relative">
            <div className="pointer-events-none opacity-50 blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">优惠券统计</CardTitle>
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
                    <CardTitle className="text-lg">流量仪表板</CardTitle>
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

            {/* 半透明覆盖层 + CTA */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <EmptyState
                icon={<Lock className="w-12 h-12" />}
                title="开启广告投放，提升餐厅曝光"
                description="通过智能广告投放系统，让更多用户发现您的餐厅"
                action={
                  <Button size="lg" onClick={() => setShowWizard(true)} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    开始设置广告方案
                  </Button>
                }
              />
            </div>
          </div>

          {/* 功能介绍 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <Megaphone className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">智能曝光提升</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  基础流量80%起步，随优惠券核销自动提升，最高可达100%曝光率
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">灵活方案配置</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  自定义现金+优惠券组合，每核销¥500优惠券，流量提升5%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Sparkles className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">实时数据追踪</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  优惠券领取、核销、流量变化等数据实时更新，效果一目了然
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
      {/* 顶部标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">广告投放</h1>
          <p className="text-muted-foreground mt-1">管理您的广告投放和优惠券</p>
        </div>
      </div>

      {/* 订阅状态卡片 */}
      <AdSubscriptionStatus
        subscription={subscription}
        onCancelSubscription={handleCancelSubscription}
      />

      {/* 数据仪表板 - 占位符 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">优惠券使用统计</CardTitle>
            <CardDescription>即将推出</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              优惠券领取率、核销率等详细数据统计
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">流量仪表板</CardTitle>
            <CardDescription>即将推出</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              曝光次数、点击率、流量变化趋势图表
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">广告成效分析</CardTitle>
            <CardDescription>即将推出</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              ROI分析、转化率、用户互动等深度数据
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
