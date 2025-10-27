/**
 * 滑卡輔助函數
 * 處理滑卡相關的數據轉換和驗證
 */

import { FilterOptions } from '@/components/SearchAndFilter';
import { hasActiveFilters } from './calculations';

export interface SwipeContext {
  filters: FilterOptions;
  userLocation: { lat: number; lng: number } | null;
  swipeDuration: number;
}

export interface SwipeDataPayload {
  user_id: string;
  restaurant_id: string;
  liked: boolean;
  group_id: string | null;
  swipe_lat: number | null;
  swipe_lng: number | null;
  swipe_distance_km: number | null;
  filter_context: Record<string, any>;
  swipe_duration_ms: number | null;
}

/**
 * 構建滑卡數據負載
 * 統一處理個人和群組滑卡的數據結構
 */
export const buildSwipePayload = (
  userId: string,
  restaurantId: string,
  liked: boolean,
  groupId: string | null,
  distance: number | null,
  context?: SwipeContext
): SwipeDataPayload => {
  return {
    user_id: userId,
    restaurant_id: restaurantId,
    liked,
    group_id: groupId,
    swipe_lat: context?.userLocation?.lat || null,
    swipe_lng: context?.userLocation?.lng || null,
    swipe_distance_km: distance,
    filter_context: context?.filters ? {
      priceRange: context.filters.priceRange as [number, number],
      distanceRange: context.filters.distanceRange,
      minRating: context.filters.minRating,
      cuisineTypes: context.filters.cuisineTypes,
      dietaryOptions: context.filters.dietaryOptions,
      hasMichelinStars: context.filters.hasMichelinStars,
      has500Dishes: context.filters.has500Dishes,
      hasBibGourmand: context.filters.hasBibGourmand,
      hasFilters: hasActiveFilters({
        cuisineTypes: context.filters.cuisineTypes,
        priceRange: context.filters.priceRange as [number, number],
        distanceRange: context.filters.distanceRange,
        minRating: context.filters.minRating
      }),
      searchTerm: context.filters.searchTerm
    } : {},
    swipe_duration_ms: context?.swipeDuration || null
  };
};

/**
 * 驗證滑卡上下文數據
 */
export const validateSwipeContext = (
  userId: string | undefined,
  restaurantId: string | undefined
): { valid: boolean; error?: string } => {
  if (!userId) {
    return { valid: false, error: '用戶未登入' };
  }
  
  if (!restaurantId) {
    return { valid: false, error: '餐廳資訊缺失' };
  }
  
  return { valid: true };
};

/**
 * 格式化滑卡日誌（用於開發除錯）
 */
export const formatSwipeLog = (
  userId: string,
  restaurantId: string,
  restaurantName: string,
  liked: boolean,
  groupId: string | null,
  distance: number | null,
  context?: SwipeContext
): Record<string, any> => {
  return {
    userId,
    restaurantId,
    restaurantName,
    liked,
    groupId: groupId || 'personal',
    swipeDistance: distance,
    swipeDuration: context?.swipeDuration,
    hasFilters: context?.filters ? hasActiveFilters({
      cuisineTypes: context.filters.cuisineTypes,
      priceRange: context.filters.priceRange as [number, number],
      distanceRange: context.filters.distanceRange,
      minRating: context.filters.minRating
    }) : false
  };
};
