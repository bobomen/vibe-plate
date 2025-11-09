import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TrendDataPoint, TimeRange } from '@/types/restaurantOwner';

interface UseRestaurantTrendOptions {
  restaurantId: string;
  daysBack?: TimeRange;
  enabled?: boolean;
}

/**
 * 获取餐厅趋势数据
 * - 曝光量趋势
 * - 详情页浏览趋势
 * - 收藏数趋势
 * - 自动计算点击率和收藏率
 */
export function useRestaurantTrend({
  restaurantId,
  daysBack = 30,
  enabled = true,
}: UseRestaurantTrendOptions) {
  return useQuery({
    queryKey: ['restaurant-trend', restaurantId, daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_restaurant_trend', {
        target_restaurant_id: restaurantId,
        days_back: daysBack,
      });

      if (error) {
        console.error('Error fetching restaurant trend:', error);
        throw error;
      }

      // 计算衍生指标
      const trendData: TrendDataPoint[] = (data || []).map((point: any) => ({
        date: point.date,
        impressions: point.impressions || 0,
        detail_views: point.detail_views || 0,
        favorites: point.favorites || 0,
        ctr: point.impressions > 0 
          ? Number(((point.detail_views / point.impressions) * 100).toFixed(2))
          : 0,
        save_rate: point.impressions > 0 
          ? Number(((point.favorites / point.impressions) * 100).toFixed(2))
          : 0,
      }));

      return trendData;
    },
    enabled: enabled && !!restaurantId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}
