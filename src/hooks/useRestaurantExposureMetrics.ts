import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RestaurantExposureMetrics, TimeRange } from '@/types/restaurantOwner';

interface UseRestaurantExposureMetricsOptions {
  restaurantId: string;
  daysBack?: TimeRange;
  enabled?: boolean;
}

/**
 * 获取餐厅曝光指标数据
 * - 竞争力指数
 * - 曝光效率评分
 * - 曝光提升预测
 */
export function useRestaurantExposureMetrics({
  restaurantId,
  daysBack = 30,
  enabled = true,
}: UseRestaurantExposureMetricsOptions) {
  return useQuery({
    queryKey: ['restaurant-exposure-metrics', restaurantId, daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_restaurant_exposure_metrics', {
        target_restaurant_id: restaurantId,
        days_back: daysBack,
      });

      if (error) {
        console.error('Error fetching exposure metrics:', error);
        throw error;
      }

      return data as unknown as RestaurantExposureMetrics;
    },
    enabled: enabled && !!restaurantId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    gcTime: 10 * 60 * 1000,   // 10分钟垃圾回收
    retry: 2,
  });
}
