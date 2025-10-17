import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useMonthlyReviewStats(month: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['monthly-stats', month.toISOString(), user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
      
      // Query swipes for the month
      const { data: swipes, error: swipesError } = await supabase
        .from('user_swipes')
        .select('*, restaurants(*)')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (swipesError) throw swipesError;

      // Query favorites for the month
      const { data: favorites, error: favoritesError } = await supabase
        .from('favorites')
        .select('*, restaurants(*)')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (favoritesError) throw favoritesError;

      // Calculate statistics
      const totalSwipes = swipes?.length || 0;
      const totalLikes = swipes?.filter(s => s.liked).length || 0;
      const likePercentage = totalSwipes > 0 ? parseFloat((totalLikes / totalSwipes * 100).toFixed(1)) : 0;
      
      // Most visited district
      const districts = swipes
        ?.map(s => s.restaurants?.district)
        .filter(Boolean) as string[];
      
      const districtCounts = districts.reduce((acc, district) => {
        acc[district] = (acc[district] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostVisitedDistrict = Object.entries(districtCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      // Top cuisine type
      const cuisines = swipes
        ?.map(s => s.restaurants?.cuisine_type)
        .filter(Boolean) as string[];
      
      const cuisineCounts = cuisines.reduce((acc, cuisine) => {
        acc[cuisine] = (acc[cuisine] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topCuisineType = Object.entries(cuisineCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      return {
        totalSwipes,
        totalLikes,
        likePercentage,
        totalFavorites: favorites?.length || 0,
        mostVisitedDistrict,
        topCuisineType,
      };
    },
    enabled: !!user,
  });
}
