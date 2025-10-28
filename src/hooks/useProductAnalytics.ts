import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailyActiveUsers {
  activity_date: string;
  dau: number;
}

export interface RetentionCohort {
  cohort_date: string;
  day_0_users: number;
  day_1_users: number;
  day_7_users: number;
  day_30_users: number;
  d7_retention_rate: number;
}

export interface FunnelStats {
  total_swipers: number;
  users_with_favorites: number;
  users_in_groups: number;
  users_with_reviews: number;
  favorite_conversion_rate: number;
  group_adoption_rate: number;
  review_creation_rate: number;
}

export interface HypothesisTracking {
  hypothesis_id: string;
  hypothesis_name: string;
  target_metric: string;
  target_value: number;
  current_value: number;
  status: 'testing' | 'validated' | 'failed';
}

export interface SwipeEngagement {
  total_swipes: number;
  total_likes: number;
  like_rate: number;
  avg_swipes_per_user: number;
}

export interface GeographicDistribution {
  city: string;
  user_count: number;
  percentage: number;
}

export const useProductAnalytics = () => {
  // Daily Active Users (last 30 days)
  const { data: dauData, isLoading: dauLoading } = useQuery({
    queryKey: ['analytics-dau'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_active_users')
        .select('*')
        .order('activity_date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data as DailyActiveUsers[];
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Retention Cohorts
  const { data: retentionData, isLoading: retentionLoading } = useQuery({
    queryKey: ['analytics-retention'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retention_cohorts')
        .select('*')
        .order('cohort_date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data as RetentionCohort[];
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Funnel Stats
  const { data: funnelData, isLoading: funnelLoading } = useQuery({
    queryKey: ['analytics-funnel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnel_stats')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as FunnelStats;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Hypothesis Tracking
  const { data: hypothesesData, isLoading: hypothesesLoading } = useQuery({
    queryKey: ['analytics-hypotheses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hypothesis_tracking')
        .select('*')
        .order('hypothesis_id');
      
      if (error) throw error;
      return data as HypothesisTracking[];
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Swipe Engagement (last 30 days)
  const { data: engagementData, isLoading: engagementLoading } = useQuery({
    queryKey: ['analytics-engagement'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('user_swipes')
        .select('liked')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (error) throw error;

      const totalSwipes = data.length;
      const totalLikes = data.filter(s => s.liked).length;
      const likeRate = totalSwipes > 0 ? (totalLikes / totalSwipes) * 100 : 0;

      // Get unique users count
      const { count: uniqueUsers } = await supabase
        .from('user_swipes')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      const avgSwipesPerUser = uniqueUsers ? totalSwipes / uniqueUsers : 0;

      return {
        total_swipes: totalSwipes,
        total_likes: totalLikes,
        like_rate: Math.round(likeRate * 100) / 100,
        avg_swipes_per_user: Math.round(avgSwipesPerUser * 100) / 100,
      } as SwipeEngagement;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Geographic Distribution
  const { data: geoData, isLoading: geoLoading } = useQuery({
    queryKey: ['analytics-geo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('city');
      
      if (error) throw error;

      const cityCount: { [key: string]: number } = {};
      data.forEach(profile => {
        if (profile.city) {
          cityCount[profile.city] = (cityCount[profile.city] || 0) + 1;
        }
      });

      const totalUsers = data.length;
      const geoDistribution: GeographicDistribution[] = Object.entries(cityCount)
        .map(([city, count]) => ({
          city,
          user_count: count,
          percentage: Math.round((count / totalUsers) * 10000) / 100,
        }))
        .sort((a, b) => b.user_count - a.user_count);

      return geoDistribution;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Calculate key metrics
  const currentDAU = dauData?.[0]?.dau || 0;
  const previousDAU = dauData?.[1]?.dau || 0;
  const dauGrowth = previousDAU > 0 
    ? Math.round(((currentDAU - previousDAU) / previousDAU) * 10000) / 100 
    : 0;

  const avgD7Retention = retentionData && retentionData.length > 0
    ? retentionData.reduce((sum, cohort) => sum + (cohort.d7_retention_rate || 0), 0) / retentionData.length
    : 0;

  return {
    // Raw data
    dauData,
    retentionData,
    funnelData,
    hypothesesData,
    engagementData,
    geoData,
    
    // Loading states
    isLoading: dauLoading || retentionLoading || funnelLoading || hypothesesLoading || engagementLoading || geoLoading,
    
    // Computed metrics
    currentDAU,
    dauGrowth,
    avgD7Retention: Math.round(avgD7Retention * 100) / 100,
  };
};
