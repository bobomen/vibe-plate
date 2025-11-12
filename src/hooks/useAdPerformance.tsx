import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdPerformanceData {
  totalImpressions: number;
  uniqueViewers: number;
  totalClicks: number;
  clickThroughRate: number;
  couponsClaimed: number;
  couponsRedeemed: number;
  redemptionRate: number;
  newFavorites: number;
  avgTrafficMultiplier: number;
  dailyStats: Array<{
    date: string;
    impressions: number;
    clicks: number;
    claimed: number;
    redeemed: number;
  }>;
  roi: {
    totalInvestment: number; // 現金 + 已核銷優惠券
    totalReach: number;
    costPerAcquisition: number;
  };
}

export const useAdPerformance = (
  restaurantId: string | undefined,
  daysBack: number = 7
) => {
  return useQuery({
    queryKey: ['ad-performance', restaurantId, daysBack],
    queryFn: async (): Promise<AdPerformanceData | null> => {
      if (!restaurantId) return null;

      // 獲取訂閱數據以計算 ROI
      const { data: subscription } = await supabase
        .from('restaurant_ad_subscriptions')
        .select('cash_paid, total_redeemed_amount')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .maybeSingle();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // 獲取廣告成效統計
      const { data: stats, error: statsError } = await supabase
        .from('ad_performance_stats')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('stats_date', startDate.toISOString().split('T')[0])
        .order('stats_date', { ascending: true });

      if (statsError) throw statsError;

      // 如果沒有統計數據，返回空數據
      if (!stats || stats.length === 0) {
        const totalInvestment = subscription 
          ? Number(subscription.cash_paid) + Number(subscription.total_redeemed_amount)
          : 0;

        return {
          totalImpressions: 0,
          uniqueViewers: 0,
          totalClicks: 0,
          clickThroughRate: 0,
          couponsClaimed: 0,
          couponsRedeemed: 0,
          redemptionRate: 0,
          newFavorites: 0,
          avgTrafficMultiplier: 0,
          dailyStats: [],
          roi: {
            totalInvestment,
            totalReach: 0,
            costPerAcquisition: 0,
          },
        };
      }

      // 聚合數據
      const totals = stats.reduce(
        (acc, stat) => ({
          impressions: acc.impressions + stat.total_impressions,
          viewers: acc.viewers + stat.unique_viewers,
          clicks: acc.clicks + stat.total_clicks,
          claimed: acc.claimed + stat.coupons_claimed,
          redeemed: acc.redeemed + stat.coupons_redeemed,
          favorites: acc.favorites + stat.new_favorites,
          avgMultiplier: acc.avgMultiplier + (stat.avg_traffic_multiplier || 0),
        }),
        {
          impressions: 0,
          viewers: 0,
          clicks: 0,
          claimed: 0,
          redeemed: 0,
          favorites: 0,
          avgMultiplier: 0,
        }
      );

      const clickThroughRate =
        totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

      const redemptionRate =
        totals.claimed > 0 ? (totals.redeemed / totals.claimed) * 100 : 0;

      const avgTrafficMultiplier =
        stats.length > 0 ? totals.avgMultiplier / stats.length : 0;

      // 每日統計
      const dailyStats = stats.map((stat) => ({
        date: new Date(stat.stats_date).toLocaleDateString('zh-TW', {
          month: 'short',
          day: 'numeric',
        }),
        impressions: stat.total_impressions,
        clicks: stat.total_clicks,
        claimed: stat.coupons_claimed,
        redeemed: stat.coupons_redeemed,
      }));

      // ROI 計算
      const totalInvestment = subscription
        ? Number(subscription.cash_paid) + Number(subscription.total_redeemed_amount)
        : 0;
      const totalReach = totals.viewers;
      const costPerAcquisition =
        totalReach > 0 ? totalInvestment / totalReach : 0;

      return {
        totalImpressions: totals.impressions,
        uniqueViewers: totals.viewers,
        totalClicks: totals.clicks,
        clickThroughRate: Number(clickThroughRate.toFixed(2)),
        couponsClaimed: totals.claimed,
        couponsRedeemed: totals.redeemed,
        redemptionRate: Number(redemptionRate.toFixed(2)),
        newFavorites: totals.favorites,
        avgTrafficMultiplier: Number(avgTrafficMultiplier.toFixed(2)),
        dailyStats,
        roi: {
          totalInvestment,
          totalReach,
          costPerAcquisition: Number(costPerAcquisition.toFixed(2)),
        },
      };
    },
    enabled: !!restaurantId,
  });
};
