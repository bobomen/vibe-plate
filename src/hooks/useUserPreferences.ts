/**
 * 用戶偏好分析 Hook
 * 
 * 這個 Hook 為未來的 AI 功能準備：
 * 1. 分析用戶的滑卡歷史
 * 2. 提取用戶偏好特徵
 * 3. 為推薦演算法提供數據
 * 
 * 數據來源：
 * - user_swipes: 滑卡記錄
 * - favorites: 收藏記錄
 * - restaurant_views: 瀏覽記錄
 * - profiles: 用戶設定的偏好
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ALGORITHM_WEIGHTS, calculateEngagementScore } from '@/config/algorithmConfig';

export interface UserPreferenceData {
  // 基本統計
  totalSwipes: number;
  totalLikes: number;
  likeRate: number;
  
  // 菜系偏好（從滑卡歷史中提取）
  favoriteCuisines: Array<{
    cuisineType: string;
    count: number;
    likeRate: number;
  }>;
  
  // 價格偏好
  preferredPriceRange: [number, number];
  avgLikedPrice: number;
  
  // 地區偏好
  preferredDistricts: Array<{
    district: string;
    count: number;
  }>;
  
  // 評分偏好
  minPreferredRating: number;
  avgLikedRating: number;
  
  // 特殊偏好
  prefersMichelin: boolean;
  prefers500Dishes: boolean;
  prefersBibGourmand: boolean;
  
  // 時間模式（預留給未來）
  peakSwipeHours?: number[];
  avgSwipeDuration?: number;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferenceData | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * 分析用戶滑卡歷史，提取偏好特徵
   */
  const analyzeUserPreferences = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return null;
    }

    try {
      // 獲取用戶所有滑卡記錄（個人滑卡）
      const { data: swipes, error: swipesError } = await supabase
        .from('user_swipes')
        .select(`
          id,
          liked,
          created_at,
          swipe_duration_ms,
          filter_context,
          interaction_metadata,
          restaurants (
            id,
            name,
            cuisine_type,
            price_range,
            district,
            google_rating,
            michelin_stars,
            has_500_dishes,
            bib_gourmand
          )
        `)
        .eq('user_id', user.id)
        .is('group_id', null)
        .order('created_at', { ascending: false })
        .limit(500); // 分析最近 500 次滑卡

      if (swipesError) throw swipesError;

      // 如果沒有數據，返回默認值
      if (!swipes || swipes.length === 0) {
        const defaultPrefs: UserPreferenceData = {
          totalSwipes: 0,
          totalLikes: 0,
          likeRate: 0,
          favoriteCuisines: [],
          preferredPriceRange: [1, 4],
          avgLikedPrice: 2,
          preferredDistricts: [],
          minPreferredRating: 3.0,
          avgLikedRating: 4.0,
          prefersMichelin: false,
          prefers500Dishes: false,
          prefersBibGourmand: false,
        };
        setPreferences(defaultPrefs);
        return defaultPrefs;
      }

      // 基本統計
      const totalSwipes = swipes.length;
      const likedSwipes = swipes.filter(s => s.liked);
      const totalLikes = likedSwipes.length;
      const likeRate = totalSwipes > 0 ? totalLikes / totalSwipes : 0;

      // 菜系偏好分析
      const cuisineMap = new Map<string, { total: number; liked: number }>();
      swipes.forEach(swipe => {
        const restaurant = swipe.restaurants as any;
        if (restaurant?.cuisine_type) {
          const cuisine = restaurant.cuisine_type;
          const existing = cuisineMap.get(cuisine) || { total: 0, liked: 0 };
          cuisineMap.set(cuisine, {
            total: existing.total + 1,
            liked: existing.liked + (swipe.liked ? 1 : 0)
          });
        }
      });

      const favoriteCuisines = Array.from(cuisineMap.entries())
        .map(([cuisineType, stats]) => ({
          cuisineType,
          count: stats.total,
          likeRate: stats.total > 0 ? stats.liked / stats.total : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 價格偏好
      const likedPrices = likedSwipes
        .map(s => (s.restaurants as any)?.price_range)
        .filter(p => p !== null && p !== undefined);
      
      const avgLikedPrice = likedPrices.length > 0
        ? likedPrices.reduce((sum, p) => sum + p, 0) / likedPrices.length
        : 2;
      
      const minPrice = likedPrices.length > 0 ? Math.min(...likedPrices) : 1;
      const maxPrice = likedPrices.length > 0 ? Math.max(...likedPrices) : 4;

      // 地區偏好
      const districtMap = new Map<string, number>();
      likedSwipes.forEach(swipe => {
        const district = (swipe.restaurants as any)?.district;
        if (district) {
          districtMap.set(district, (districtMap.get(district) || 0) + 1);
        }
      });

      const preferredDistricts = Array.from(districtMap.entries())
        .map(([district, count]) => ({ district, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 評分偏好
      const likedRatings = likedSwipes
        .map(s => (s.restaurants as any)?.google_rating)
        .filter(r => r !== null && r !== undefined);
      
      const avgLikedRating = likedRatings.length > 0
        ? likedRatings.reduce((sum, r) => sum + r, 0) / likedRatings.length
        : 4.0;
      
      const minPreferredRating = likedRatings.length > 0 
        ? Math.max(3.0, avgLikedRating - 0.5)
        : 3.0;

      // 特殊偏好
      const michelinCount = likedSwipes.filter(s => 
        (s.restaurants as any)?.michelin_stars > 0
      ).length;
      const dishes500Count = likedSwipes.filter(s => 
        (s.restaurants as any)?.has_500_dishes
      ).length;
      const bibCount = likedSwipes.filter(s => 
        (s.restaurants as any)?.bib_gourmand
      ).length;

      const preferenceData: UserPreferenceData = {
        totalSwipes,
        totalLikes,
        likeRate,
        favoriteCuisines,
        preferredPriceRange: [minPrice, maxPrice],
        avgLikedPrice,
        preferredDistricts,
        minPreferredRating,
        avgLikedRating,
        prefersMichelin: michelinCount / Math.max(totalLikes, 1) > 0.2,
        prefers500Dishes: dishes500Count / Math.max(totalLikes, 1) > 0.15,
        prefersBibGourmand: bibCount / Math.max(totalLikes, 1) > 0.15,
      };

      setPreferences(preferenceData);
      return preferenceData;

    } catch (error) {
      console.error('Error analyzing user preferences:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 自動載入偏好數據
  useEffect(() => {
    analyzeUserPreferences();
  }, [analyzeUserPreferences]);

  /**
   * 獲取推薦餐廳的評分
   * 這個函數為未來的 AI 演算法準備
   * 根據用戶偏好給餐廳打分
   */
  const scoreRestaurant = useCallback((restaurant: {
    cuisine_type?: string;
    price_range?: number;
    district?: string;
    google_rating?: number;
    michelin_stars?: number;
    has_500_dishes?: boolean;
    bib_gourmand?: boolean;
    interaction_metadata?: any;
  }): number => {
    if (!preferences) return 0;

    let score = 0;
    const weights = ALGORITHM_WEIGHTS;

    // 菜系匹配 (使用配置的權重)
    const cuisineMatch = preferences.favoriteCuisines.find(
      c => c.cuisineType === restaurant.cuisine_type
    );
    if (cuisineMatch) {
      score += weights.cuisine_match * cuisineMatch.likeRate;
    }

    // 價格匹配
    if (restaurant.price_range) {
      const [minPrice, maxPrice] = preferences.preferredPriceRange;
      if (restaurant.price_range >= minPrice && restaurant.price_range <= maxPrice) {
        score += weights.price_match;
      }
    }

    // 地區匹配
    const districtMatch = preferences.preferredDistricts.find(
      d => d.district === restaurant.district
    );
    if (districtMatch) {
      score += weights.district_preference * (districtMatch.count / preferences.totalLikes);
    }

    // 評分匹配
    if (restaurant.google_rating && restaurant.google_rating >= preferences.minPreferredRating) {
      score += weights.rating_preference;
    }

    // Phase 1: 互動深度評分
    if (restaurant.interaction_metadata) {
      const engagementScore = calculateEngagementScore(restaurant.interaction_metadata);
      score += weights.card_engagement * engagementScore;
    }

    // 特殊偏好
    let specialScore = 0;
    if (restaurant.michelin_stars && preferences.prefersMichelin) specialScore += 33.3;
    if (restaurant.has_500_dishes && preferences.prefers500Dishes) specialScore += 33.3;
    if (restaurant.bib_gourmand && preferences.prefersBibGourmand) specialScore += 33.3;
    score += (weights.special_features / 100) * specialScore;

    return Math.min(100, score);
  }, [preferences]);

  return {
    preferences,
    loading,
    analyzeUserPreferences,
    scoreRestaurant,
  };
};
