import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrafficDashboardData {
  currentMultiplier: number;
  baseTraffic: number;
  bonusTraffic: number;
  couponBudget: number;
  totalRedeemed: number;
  remainingBudget: number;
  budgetUsagePercent: number;
  nextMilestone: {
    amount: number;
    newMultiplier: number;
  } | null;
  multiplierHistory: Array<{
    date: string;
    multiplier: number;
    redeemedAmount: number;
  }>;
}

export const useTrafficDashboard = (restaurantId: string | undefined) => {
  return useQuery({
    queryKey: ['traffic-dashboard', restaurantId],
    queryFn: async (): Promise<TrafficDashboardData | null> => {
      if (!restaurantId) return null;

      // 獲取當前訂閱數據
      const { data: subscription, error: subError } = await supabase
        .from('restaurant_ad_subscriptions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .maybeSingle();

      if (subError) throw subError;
      if (!subscription) return null;

      // 獲取流量倍數歷史
      const { data: history, error: historyError } = await supabase
        .from('traffic_multiplier_history')
        .select('*')
        .eq('subscription_id', subscription.id)
        .order('calculated_at', { ascending: true })
        .limit(30);

      if (historyError) throw historyError;

      const currentMultiplier = subscription.traffic_multiplier || 0.8;
      const baseTraffic = 0.8; // 80% 基礎流量
      const bonusTraffic = Math.max(0, currentMultiplier - baseTraffic);
      
      const couponBudget = subscription.coupon_budget || 0;
      const totalRedeemed = subscription.total_redeemed_amount || 0;
      const remainingBudget = Math.max(0, couponBudget - totalRedeemed);
      const budgetUsagePercent = couponBudget > 0 ? (totalRedeemed / couponBudget) * 100 : 0;

      // 計算下個里程碑（每 500 元提升 5%）
      let nextMilestone = null;
      if (currentMultiplier < 1.0) {
        const currentSteps = Math.floor(totalRedeemed / 500);
        const nextStepAmount = (currentSteps + 1) * 500;
        const amountNeeded = nextStepAmount - totalRedeemed;
        
        if (amountNeeded > 0 && amountNeeded <= remainingBudget) {
          nextMilestone = {
            amount: amountNeeded,
            newMultiplier: Math.min(1.0, 0.8 + ((currentSteps + 1) * 0.05)),
          };
        }
      }

      // 格式化歷史數據
      const multiplierHistory = (history || []).map((h) => ({
        date: new Date(h.calculated_at).toLocaleDateString('zh-TW'),
        multiplier: Number(h.new_multiplier),
        redeemedAmount: Number(h.redeemed_amount_at_change),
      }));

      return {
        currentMultiplier,
        baseTraffic,
        bonusTraffic,
        couponBudget,
        totalRedeemed,
        remainingBudget,
        budgetUsagePercent,
        nextMilestone,
        multiplierHistory,
      };
    },
    enabled: !!restaurantId,
  });
};
