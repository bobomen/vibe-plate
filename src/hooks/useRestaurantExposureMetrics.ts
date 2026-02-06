import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RestaurantExposureMetrics, TimeRange } from '@/types/restaurantOwner';
import { ENABLE_MOCK_DATA } from '@/config/featureFlags';
import { generateMockExposureMetrics } from '@/utils/mockRestaurantOwnerData';

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
  const query = useQuery({
    queryKey: ['restaurant-exposure-metrics', restaurantId, daysBack, ENABLE_MOCK_DATA],
    queryFn: async () => {
      // 模擬數據模式
      if (ENABLE_MOCK_DATA) {
        return generateMockExposureMetrics();
      }

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
    enabled: ENABLE_MOCK_DATA || (enabled && !!restaurantId),
    staleTime: ENABLE_MOCK_DATA ? Infinity : 5 * 60 * 1000, // 模擬模式不重新獲取
    gcTime: 10 * 60 * 1000,
    retry: ENABLE_MOCK_DATA ? 0 : 2,
  });

  return query;
}
