import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Eye, Heart, MousePointerClick, Award, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useRestaurantOwner } from '@/hooks/useRestaurantOwner';
import { ClaimPrompt } from '@/components/RestaurantOwner/ClaimPrompt';
import { CompetitivenessCard } from '@/components/RestaurantOwner/CompetitivenessCard';
import { EfficiencyScoreCard } from '@/components/RestaurantOwner/EfficiencyScoreCard';
import { TrendCharts } from '@/components/RestaurantOwner/TrendCharts';
import { ErrorFallback } from '@/components/RestaurantOwner/ErrorFallback';
import { useRestaurantExposureMetrics } from '@/hooks/useRestaurantExposureMetrics';
import { useRestaurantTrend } from '@/hooks/useRestaurantTrend';
import type { TimeRange } from '@/types/restaurantOwner';

interface RestaurantStats {
  total_impressions: number;
  detail_views: number;
  favorites_count: number;
  save_rate: number;
  phone_clicks: number;
  map_clicks: number;
  menu_clicks: number;
  website_clicks: number;
  avg_view_duration_sec: number;
  like_rate: number;
  district_rank: number;
}

export default function RestaurantOwnerOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOwner, ownerData } = useRestaurantOwner();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  // Phase 1: 獲取曝光指標數據
  const { data: exposureMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useRestaurantExposureMetrics({
    restaurantId: ownerData?.restaurantId || '',
    daysBack: timeRange,
    enabled: !!ownerData?.restaurantId,
  });

  const { data: trendData, isLoading: trendLoading, refetch: refetchTrend } = useRestaurantTrend({
    restaurantId: ownerData?.restaurantId || '',
    daysBack: timeRange,
    enabled: !!ownerData?.restaurantId,
  });

  useEffect(() => {
    if (user && ownerData) {
      fetchRestaurantData();
    } else {
      setLoading(false);
    }
  }, [user, ownerData]);

  const fetchRestaurantData = async () => {
    if (!user?.id || !ownerData?.restaurantId) return;

    setLoading(true);

    try {
      // 獲取餐廳統計數據
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_restaurant_stats', {
          target_restaurant_id: ownerData.restaurantId,
          days_back: 30
        });

      if (statsError) throw statsError;

      setStats(statsData as unknown as RestaurantStats);
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      toast({
        title: '載入失敗',
        description: '無法載入餐廳數據',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isOwner || !ownerData) {
    return <ClaimPrompt />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* 頂部工具欄 */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-2xl font-bold">成效總覽</h1>
        <p className="text-sm text-muted-foreground mt-1">{ownerData.restaurantName}</p>
      </div>

      {/* 統計卡片 */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總曝光次數</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_impressions || 0}</div>
            <p className="text-xs text-muted-foreground">過去 30 天</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">詳細頁瀏覽</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.detail_views || 0}</div>
            <p className="text-xs text-muted-foreground">
              點擊率 {stats ? ((stats.detail_views / stats.total_impressions) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">收藏次數</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.favorites_count || 0}</div>
            <p className="text-xs text-muted-foreground">收藏率 {stats?.save_rate || 0}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">區域排名</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{stats?.district_rank || '-'}</div>
            <p className="text-xs text-muted-foreground">區域內排名</p>
          </CardContent>
        </Card>
      </div>

      {/* Phase 1: 競爭力指數 & 曝光效率評分 */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {metricsLoading ? (
          <>
            <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
            <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
          </>
        ) : exposureMetrics ? (
          <>
            <CompetitivenessCard 
              data={exposureMetrics.competitiveness}
              district={exposureMetrics.district}
              cuisineType={exposureMetrics.cuisine_type}
            />
            <EfficiencyScoreCard 
              data={exposureMetrics.efficiency_score}
            />
          </>
        ) : (
          <>
            <ErrorFallback 
              title="曝光指標載入失敗"
              onRetry={() => refetchMetrics()}
            />
            <ErrorFallback 
              title="效率評分載入失敗"
              onRetry={() => refetchMetrics()}
            />
          </>
        )}
      </div>

      {/* Phase 1: 趨勢圖表 */}
      <div className="max-w-7xl mx-auto mb-6">
        {trendLoading ? (
          <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
        ) : trendData && trendData.length > 0 ? (
          <TrendCharts 
            data={trendData}
            onTimeRangeChange={setTimeRange}
          />
        ) : (
          <ErrorFallback 
            title="趨勢數據載入失敗"
            message="暫無趨勢數據，請確保餐廳有足夠的歷史數據"
            onRetry={() => refetchTrend()}
          />
        )}
      </div>

      {/* 互動統計 */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>使用者互動</CardTitle>
            <CardDescription>過去 30 天的互動數據</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">電話點擊</span>
              <span className="text-sm font-medium">{stats?.phone_clicks || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">地圖點擊</span>
              <span className="text-sm font-medium">{stats?.map_clicks || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">菜單點擊</span>
              <span className="text-sm font-medium">{stats?.menu_clicks || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">網站點擊</span>
              <span className="text-sm font-medium">{stats?.website_clicks || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>品質指標</CardTitle>
            <CardDescription>使用者行為分析</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">平均瀏覽時長</span>
              <span className="text-sm font-medium">{stats?.avg_view_duration_sec || 0} 秒</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">喜歡率</span>
              <span className="text-sm font-medium">{stats?.like_rate || 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">收藏率</span>
              <span className="text-sm font-medium">{stats?.save_rate || 0}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
