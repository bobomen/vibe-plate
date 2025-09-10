import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FilterOptions } from '@/components/SearchAndFilter';

/**
 * INVARIANTS - 關鍵不變式 (永遠要成立的事)：
 * 1. 個人滑卡只讀 group_id IS NULL 的記錄
 * 2. 群組滑卡只讀 group_id = :groupId 的記錄  
 * 3. 任何 API 不得在未登入時回傳個資
 * 4. 重置個人滑卡記錄時，收藏記錄必須完全保留
 */

interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  google_rating: number;
  google_reviews_count: number;
  michelin_stars: number;
  has_500_dishes: boolean;
  photos: string[];
  cuisine_type: string;
  price_range: number;
  bib_gourmand: boolean;
}

interface UseSwipeStateOptions {
  groupId?: string; // undefined for personal swipes, string for group swipes
  maxRetries?: number;
}

export const useSwipeState = ({ groupId, maxRetries = 3 }: UseSwipeStateOptions) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userSwipes, setUserSwipes] = useState<Set<string>>(new Set());
  const [userPreference, setUserPreference] = useState<{ [key: string]: boolean }>({});
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    priceRange: [0, 10],
    distanceRange: 999,
    minRating: 0,
    hasMichelinStars: false,
    has500Dishes: false,
    hasBibGourmand: false,
  });

  // Helper: Distance calculation
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Helper: Retry mechanism for network operations  
  const withRetry = useCallback(async (
    operation: () => Promise<any>,
    retries: number = maxRetries
  ) => {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        // Wait progressively longer between retries
        await new Promise(resolve => setTimeout(resolve, (maxRetries - retries + 1) * 1000));
        return withRetry(operation, retries - 1);
      }
      throw error;
    }
  }, [maxRetries]);

  /**
   * INVARIANT: 個人滑卡只讀 group_id IS NULL / 群組滑卡只讀 group_id = :groupId
   */
  const fetchUserSwipes = useCallback(async () => {
    if (!user?.id) return;

    try {
      const operation = async () => {
        let query = supabase
          .from('user_swipes')
          .select('restaurant_id, liked')
          .eq('user_id', user.id);

        // INVARIANT: Apply correct group filter based on context
        if (groupId) {
          query = query.eq('group_id', groupId);
        } else {
          query = query.is('group_id', null);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
      };

      const data = await withRetry(operation);
      
      const swipeSet = new Set<string>();
      const preferenceMap: { [key: string]: boolean } = {};
      
      if (data) {
        data.forEach((swipe) => {
          swipeSet.add(swipe.restaurant_id);
          preferenceMap[swipe.restaurant_id] = swipe.liked;
        });
      }
      
      setUserSwipes(swipeSet);
      setUserPreference(preferenceMap);
    } catch (error) {
      console.error('Error fetching user swipes:', error);
      toast({
        title: "載入失敗",
        description: "無法載入滑卡記錄，請檢查網路連線",
        variant: "destructive"
      });
    }
  }, [user?.id, groupId, withRetry, toast]);

  // Fetch all restaurants
  const fetchRestaurants = useCallback(async () => {
    try {
      const operation = async () => {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .order('name');
        
        if (error) throw error;
        return data || [];
      };

      const data = await withRetry(operation);
      setAllRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast({
        title: "載入失敗",
        description: "無法載入餐廳資料，請重新整理頁面",
        variant: "destructive"
      });
    }
  }, [withRetry, toast]);

  // Apply filters to restaurants
  const applyFilters = useCallback(() => {
    if (!allRestaurants.length) return;

    let filtered = allRestaurants.filter(restaurant => {
      // Exclude swiped restaurants
      if (userSwipes.has(restaurant.id)) return false;

      // Search filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        if (!restaurant.name.toLowerCase().includes(searchTerm) && 
            !restaurant.address?.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Price filter  
      if (restaurant.price_range < filters.priceRange[0] || 
          restaurant.price_range > filters.priceRange[1]) {
        return false;
      }

      // Distance filter
      if (filters.distanceRange < 999 && userLocation) {
        const distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          restaurant.lat, restaurant.lng
        );
        if (distance > filters.distanceRange) return false;
      }

      // Rating filter
      if (filters.minRating > 0 && restaurant.google_rating < filters.minRating) {
        return false;
      }

      // Special recognition filters
      if (filters.hasMichelinStars && restaurant.michelin_stars === 0) return false;
      if (filters.has500Dishes && !restaurant.has_500_dishes) return false;
      if (filters.hasBibGourmand && !restaurant.bib_gourmand) return false;

      return true;
    });

    setRestaurants(filtered);
    setCurrentIndex(0);
  }, [allRestaurants, userSwipes, filters, userLocation, calculateDistance]);

  /**
   * INVARIANT: 重置個人滑卡記錄時，收藏記錄必須完全保留
   */
  const resetPersonalSwipes = useCallback(async () => {
    if (!user?.id || groupId) return false; // Only for personal swipes

    try {
      const operation = async () => {
        // INVARIANT: Only delete personal swipes (group_id IS NULL), not favorites
        const { error } = await supabase
          .from('user_swipes')
          .delete()
          .eq('user_id', user.id)
          .is('group_id', null);
        
        if (error) throw error;
      };

      await withRetry(operation);
      
      // Reset state and reload
      setUserSwipes(new Set());
      setUserPreference({});
      setCurrentIndex(0);
      await fetchRestaurants();
      await fetchUserSwipes();
      
      toast({
        title: "重置成功",
        description: "個人滑卡記錄已清除，收藏記錄保持不變",
      });
      
      return true;
    } catch (error) {
      console.error('Error resetting swipes:', error);
      toast({
        title: "重置失敗", 
        description: "無法清除滑卡記錄",
        variant: "destructive"
      });
      return false;
    }
  }, [user?.id, groupId, withRetry, fetchRestaurants, fetchUserSwipes, toast]);

  // Get current restaurant
  const currentRestaurant = useMemo(() => 
    restaurants[currentIndex], [restaurants, currentIndex]
  );

  // Get distance to current restaurant
  const distance = useMemo(() => 
    userLocation && currentRestaurant ? 
      calculateDistance(userLocation.lat, userLocation.lng, currentRestaurant.lat, currentRestaurant.lng) : 
      null, 
    [userLocation, currentRestaurant, calculateDistance]
  );

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Could not get user location:', error);
        }
      );
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchRestaurants(), fetchUserSwipes()]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchRestaurants, fetchUserSwipes]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return {
    // State
    restaurants,
    allRestaurants,
    currentIndex,
    loading,
    userSwipes,
    userPreference,
    userLocation,
    filters,
    currentRestaurant,
    distance,
    
    // Actions
    setCurrentIndex,
    setFilters,
    fetchUserSwipes,
    fetchRestaurants,
    resetPersonalSwipes,
    applyFilters,
    
    // Helpers
    calculateDistance,
    withRetry,
    
    // Computed
    isPersonalMode: !groupId,
    isGroupMode: !!groupId,
  };
};