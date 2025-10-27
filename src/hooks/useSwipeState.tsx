import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FilterOptions } from '@/components/SearchAndFilter';
import { Restaurant } from '@/types/restaurant';
import { useUserPreferences } from '@/hooks/useUserPreferences';

/**
 * INVARIANTS - 關鍵不變式 (永遠要成立的事)：
 * 1. 個人滑卡只讀 group_id IS NULL 的記錄
 * 2. 群組滑卡只讀 group_id = :groupId 的記錄  
 * 3. 任何 API 不得在未登入時回傳個資
 * 4. 重置個人滑卡記錄時，收藏記錄必須完全保留
 */

interface UseSwipeStateOptions {
  groupId?: string; // undefined for personal swipes, string for group swipes
  maxRetries?: number;
  showCoreOnboarding?: boolean; // For tutorial mode with specific restaurants
}

export const useSwipeState = ({ groupId, maxRetries = 3, showCoreOnboarding = false }: UseSwipeStateOptions) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // 🎯 AI 優化：整合用戶偏好分析
  const { preferences, scoreRestaurant } = useUserPreferences();
  
  // Core state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userSwipes, setUserSwipes] = useState<Set<string>>(new Set());
  const [userPreference, setUserPreference] = useState<{ [key: string]: boolean }>({});
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Premium feature: Swipe history for "go back" functionality
  const [swipeHistory, setSwipeHistory] = useState<Array<{
    restaurant: Restaurant;
    liked: boolean;
    timestamp: Date;
  }>>([]);
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    priceRange: [0, 10],
    distanceRange: 999,
    minRating: 0,
    hasMichelinStars: false,
    has500Dishes: false,
    hasBibGourmand: false,
    cuisineTypes: [],
    dietaryOptions: [],
    cities: [],
    districts: [],
  });

  // User profile preferences (fetched from database)
  const [profilePreferences, setProfilePreferences] = useState<{
    min_rating?: number;
    michelin_stars?: boolean;
    bib_gourmand?: boolean;
    has_500_dishes?: boolean;
    favorite_cuisines?: string[];
    dietary_preferences?: string[];
  } | null>(null);

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

  // Fetch user profile preferences
  const fetchProfilePreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('min_rating, preferences, favorite_cuisines, dietary_preferences')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        const preferences = data.preferences as any;
        setProfilePreferences({
          min_rating: data.min_rating,
          michelin_stars: preferences?.michelin_stars || false,
          bib_gourmand: preferences?.bib_gourmand || false,
          has_500_dishes: preferences?.has_500_dishes || false,
          favorite_cuisines: (data.favorite_cuisines as string[]) || [],
          dietary_preferences: (data.dietary_preferences as string[]) || [],
        });
      }
    } catch (error) {
      console.error('Error fetching profile preferences:', error);
    }
  }, [user?.id]);

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

  // Apply filters to restaurants with UNION logic (個人偏好 ∪ 即時篩選)
  const applyFilters = useCallback(() => {
    if (!allRestaurants.length) {
      setRestaurants([]);
      setCurrentIndex(0);
      return;
    }

    // Helper function to check if user has any active preferences
    const hasAnyActivePreference = (): boolean => {
      if (!profilePreferences) return false;
      
      return !!(
        (profilePreferences.min_rating && profilePreferences.min_rating > 0) ||
        profilePreferences.michelin_stars ||
        profilePreferences.bib_gourmand ||
        profilePreferences.has_500_dishes ||
        (profilePreferences.favorite_cuisines && profilePreferences.favorite_cuisines.length > 0) ||
        (profilePreferences.dietary_preferences && profilePreferences.dietary_preferences.length > 0)
      );
    };

    // Helper function to check if restaurant matches profile preferences
    const matchesProfilePreferences = (restaurant: Restaurant): boolean => {
      // If no profile preferences or no active preferences, return true (show all restaurants)
      if (!profilePreferences || !hasAnyActivePreference()) return true;
      
      let matches = false;
      
      // Rating preference
      if (profilePreferences.min_rating && restaurant.google_rating >= profilePreferences.min_rating) {
        matches = true;
      }
      
      // Michelin stars preference
      if (profilePreferences.michelin_stars && restaurant.michelin_stars > 0) {
        matches = true;
      }
      
      // Bib Gourmand preference
      if (profilePreferences.bib_gourmand && restaurant.bib_gourmand) {
        matches = true;
      }
      
      // 500 Dishes preference
      if (profilePreferences.has_500_dishes && restaurant.has_500_dishes) {
        matches = true;
      }
      
      // Cuisine preferences
      if (profilePreferences.favorite_cuisines && profilePreferences.favorite_cuisines.length > 0) {
        if (profilePreferences.favorite_cuisines.includes(restaurant.cuisine_type)) {
          matches = true;
        }
      }
      
      // Dietary preferences (check dietary_options jsonb field)
      if (profilePreferences.dietary_preferences && profilePreferences.dietary_preferences.length > 0 && restaurant.dietary_options) {
        const dietaryOptions = restaurant.dietary_options as any;
        for (const pref of profilePreferences.dietary_preferences) {
          if (dietaryOptions[pref] === true) {
            matches = true;
            break;
          }
        }
      }
      
      return matches;
    };

    // Helper function to check if restaurant matches immediate filters
    const matchesImmediateFilters = (restaurant: Restaurant): boolean => {
      // Search filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        if (!restaurant.name.toLowerCase().includes(searchTerm) && 
            !restaurant.address?.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // City filter
      if (filters.cities.length > 0) {
        if (!restaurant.city || !filters.cities.includes(restaurant.city)) {
          return false;
        }
      }

      // District filter
      if (filters.districts.length > 0) {
        if (!restaurant.district || !filters.districts.includes(restaurant.district)) {
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

      // Rating filter (immediate)
      if (filters.minRating > 0 && restaurant.google_rating < filters.minRating) {
        return false;
      }

      // Special recognition filters (immediate)
      if (filters.hasMichelinStars && restaurant.michelin_stars === 0) return false;
      if (filters.has500Dishes && !restaurant.has_500_dishes) return false;
      if (filters.hasBibGourmand && !restaurant.bib_gourmand) return false;

      // Cuisine filters (immediate)
      if (filters.cuisineTypes.length > 0) {
        if (!filters.cuisineTypes.includes(restaurant.cuisine_type)) {
          return false;
        }
      }

      // Dietary filters (immediate)
      if (filters.dietaryOptions.length > 0 && restaurant.dietary_options) {
        const dietaryOptions = restaurant.dietary_options as any;
        let hasDietaryMatch = false;
        for (const option of filters.dietaryOptions) {
          if (dietaryOptions[option] === true) {
            hasDietaryMatch = true;
            break;
          }
        }
        if (!hasDietaryMatch) return false;
      }

      return true;
    };

    // Priority logic: Immediate filters are HARD requirements, profile preferences are soft preferences
    let filtered = allRestaurants.filter(restaurant => {
      // Always exclude swiped restaurants
      if (userSwipes.has(restaurant.id)) {
        return false;
      }

      // Check if any immediate filter is active
      const hasImmediateFilters = 
        filters.searchTerm !== '' ||
        filters.priceRange[0] > 0 || filters.priceRange[1] < 10 ||
        filters.distanceRange < 999 ||
        filters.minRating > 0 ||
        filters.hasMichelinStars ||
        filters.has500Dishes ||
        filters.hasBibGourmand ||
        filters.cuisineTypes.length > 0 ||
        filters.dietaryOptions.length > 0 ||
        filters.cities.length > 0 ||
        filters.districts.length > 0;

      // Step 1: Immediate filters are MANDATORY (hard requirement)
      if (hasImmediateFilters) {
        const passesImmediateFilters = matchesImmediateFilters(restaurant);
        
        // If doesn't pass immediate filters, exclude immediately
        if (!passesImmediateFilters) {
          return false;
        }
      }

      // Step 2: If no immediate filters, apply profile preferences
      if (!hasImmediateFilters) {
        // If no active preferences, show all restaurants (return true)
        if (!hasAnyActivePreference()) {
          return true;
        }
        // If has active preferences, match against them
        return matchesProfilePreferences(restaurant);
      }

      // If passed immediate filters, show restaurant (profile preferences not used as filter, only for future ranking)
      return true;
    });

    // Tutorial mode: Put "美味蟹堡" and "軟飯" at the front ONLY during first-time onboarding
    // This ensures tutorial restaurants appear first ONLY when onboarding is active
    // After onboarding is complete, restaurants are shown in normal order
    if (showCoreOnboarding && !groupId) {
      const tutorialRestaurants = filtered.filter(r => 
        r.name === '美味蟹堡' || r.name === '軟飯'
      );
      
      // Only apply tutorial priority if tutorial restaurants exist
      if (tutorialRestaurants.length > 0) {
        const otherRestaurants = filtered.filter(r => 
          r.name !== '美味蟹堡' && r.name !== '軟飯'
        );
        
        // Sort tutorial restaurants to ensure "美味蟹堡" comes first, then "軟飯"
        tutorialRestaurants.sort((a, b) => {
          if (a.name === '美味蟹堡') return -1;
          if (b.name === '美味蟹堡') return 1;
          return 0;
        });
        
        filtered = [...tutorialRestaurants, ...otherRestaurants];
      }
    }

    // 🎯 智能排序：根據用戶偏好排序（僅個人模式 + 有足夠數據時）
    // 群組模式保持隨機，避免影響群組共識
    if (!groupId && preferences && preferences.totalSwipes >= 10) {
      // 給每個餐廳評分
      const scored = filtered.map(restaurant => ({
        restaurant,
        score: scoreRestaurant(restaurant)
      }));

      // 排序：高分在前
      scored.sort((a, b) => b.score - a.score);

      // 🎲 保留隨機性：前 20% 打散，避免太可預測
      const topPercentage = Math.ceil(scored.length * 0.2);
      const topRestaurants = scored.slice(0, topPercentage);
      const restRestaurants = scored.slice(topPercentage);

      // Fisher-Yates 洗牌演算法
      const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const shuffledTop = shuffleArray(topRestaurants);
      filtered = [...shuffledTop, ...restRestaurants].map(item => item.restaurant);
    }

    setRestaurants(filtered);
    setCurrentIndex(0);
  }, [allRestaurants, userSwipes, filters, userLocation, calculateDistance, profilePreferences, groupId, showCoreOnboarding]);

  /**
   * INVARIANT: 重置個人滑卡記錄時，收藏記錄必須完全保留
   */
  const resetPersonalSwipes = useCallback(async () => {
    if (!user?.id || groupId) return false; // Only for personal swipes
    
    try {
      const operation = async () => {
        // INVARIANT: Only delete personal swipes (group_id IS NULL), not favorites
        const { error, count } = await supabase
          .from('user_swipes')
          .delete({ count: 'exact' })
          .eq('user_id', user.id)
          .is('group_id', null);
        
        if (error) throw error;
        return count;
      };

      const deletedCount = await withRetry(operation);
      
      // Clear local state immediately and force rerender
      setUserSwipes(new Set());
      setUserPreference({});
      setSwipeHistory([]); // Clear swipe history
      setCurrentIndex(0);
      
      // Force immediate re-application of filters with cleared state
      setTimeout(() => {
        // Manually apply filter logic to check what should be available
        const availableRestaurants = allRestaurants.filter(restaurant => {
          // Since we just cleared userSwipes, all restaurants should be available
          return true;
        });
        
        setRestaurants(availableRestaurants);
        setCurrentIndex(0);
      }, 50);
      
      toast({
        title: "重置成功",
        description: `已清除 ${deletedCount} 筆個人滑卡記錄，收藏記錄保持不變`,
      });
      
      return true;
    } catch (error) {
      console.error('[resetPersonalSwipes] Error:', error);
      toast({
        title: "重置失敗", 
        description: `無法清除滑卡記錄：${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  }, [user?.id, groupId, withRetry, allRestaurants, setUserSwipes, setUserPreference, setCurrentIndex, setRestaurants, toast]);

  /**
   * Reset group swipes for testing purposes
   * INVARIANT: 只刪除當前用戶在指定群組的投票記錄
   */
  const resetGroupSwipes = useCallback(async () => {
    if (!user?.id || !groupId) return false; // Only for group swipes
    
    try {
      const operation = async () => {
        // INVARIANT: Only delete current user's swipes in this specific group
        const { error, count } = await supabase
          .from('user_swipes')
          .delete({ count: 'exact' })
          .eq('user_id', user.id)
          .eq('group_id', groupId);
        
        if (error) throw error;
        return count;
      };

      const deletedCount = await withRetry(operation);
      
      // Clear local state and force rerender
      setUserSwipes(new Set());
      setUserPreference({});
      setSwipeHistory([]); // Clear swipe history
      setCurrentIndex(0);
      
      // Re-apply filters to show available restaurants again
      setTimeout(() => {
        applyFilters();
      }, 50);
      
      toast({
        title: "重置成功",
        description: `已清除 ${deletedCount} 筆群組投票記錄，現在可以重新開始投票`,
      });
      
      return true;
    } catch (error) {
      console.error('[resetGroupSwipes] Error:', error);
      toast({
        title: "重置失敗", 
        description: `無法清除群組投票記錄：${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  }, [user?.id, groupId, withRetry, applyFilters, toast]);

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

  // Premium feature: Check if can go back
  const canGoBack = useMemo(() => swipeHistory.length > 0, [swipeHistory]);

  // Premium feature: Go back to previous restaurant
  const goBackToPrevious = useCallback(async () => {
    if (!user?.id || swipeHistory.length === 0) return false;

    try {
      const lastSwipe = swipeHistory[swipeHistory.length - 1];
      
      // Remove the swipe record from database
      const operation = async () => {
        let query = supabase
          .from('user_swipes')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', lastSwipe.restaurant.id);

        // Apply correct group filter
        if (groupId) {
          query = query.eq('group_id', groupId);
        } else {
          query = query.is('group_id', null);
        }

        const { error } = await query;
        if (error) throw error;
      };

      await withRetry(operation);

      // Remove from local state
      const newSwipes = new Set(userSwipes);
      newSwipes.delete(lastSwipe.restaurant.id);
      setUserSwipes(newSwipes);

      const newPreference = { ...userPreference };
      delete newPreference[lastSwipe.restaurant.id];
      setUserPreference(newPreference);

      // Remove from history
      setSwipeHistory(prev => prev.slice(0, -1));

      // Add restaurant back to the beginning of the list
      setRestaurants(prev => [lastSwipe.restaurant, ...prev]);
      setCurrentIndex(0);

      toast({
        title: "已回到上一間餐廳",
        description: `重新顯示 ${lastSwipe.restaurant.name}`,
      });

      return true;
    } catch (error) {
      console.error('Error going back:', error);
      toast({
        title: "回退失敗",
        description: "無法回到上一間餐廳，請稍後再試",
        variant: "destructive"
      });
      return false;
    }
  }, [user?.id, swipeHistory, groupId, withRetry, userSwipes, userPreference, toast]);

  // Add restaurant to swipe history (called externally when swiping)
  const addToSwipeHistory = useCallback((restaurant: Restaurant, liked: boolean) => {
    setSwipeHistory(prev => [...prev, {
      restaurant,
      liked,
      timestamp: new Date()
    }]);
  }, []);

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
        await Promise.all([
          fetchRestaurants(), 
          fetchUserSwipes(), 
          fetchProfilePreferences()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchRestaurants, fetchUserSwipes, fetchProfilePreferences]);

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
    swipeHistory,
    
    // Actions
    setCurrentIndex,
    setFilters,
    fetchUserSwipes,
    fetchRestaurants,
    fetchProfilePreferences,
    resetPersonalSwipes,
    resetGroupSwipes,
    applyFilters,
    addToSwipeHistory,
    goBackToPrevious,
    
    // Helpers
    calculateDistance,
    withRetry,
    scoreRestaurant, // 🎯 導出評分函數，供 useSwipeLogic 使用
    
    // Computed
    isPersonalMode: !groupId,
    isGroupMode: !!groupId,
    canGoBack,
    hasEnoughDataForAI: preferences ? preferences.totalSwipes >= 10 : false, // 🎯 標記是否啟用 AI
  };
};