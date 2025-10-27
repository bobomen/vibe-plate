/**
 * 通用計算工具函數
 * 統一管理所有計算邏輯，避免重複代碼
 */

/**
 * 計算兩個地理座標之間的距離（公里）
 * 使用 Haversine 公式
 * 
 * @param lat1 起點緯度
 * @param lng1 起點經度
 * @param lat2 終點緯度
 * @param lng2 終點經度
 * @returns 距離（公里）
 */
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371; // 地球半徑（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * 檢查篩選條件是否有任何啟用
 * 用於判斷是否有使用篩選功能
 */
export const hasActiveFilters = (filters: {
  cuisineTypes: string[];
  priceRange: [number, number];
  distanceRange: number;
  minRating: number;
}): boolean => {
  return (
    filters.cuisineTypes.length > 0 || 
    filters.priceRange[0] > 0 || 
    filters.priceRange[1] < 10 ||
    filters.distanceRange < 999 ||
    filters.minRating > 0
  );
};

/**
 * 計算兩個時間戳之間的差異（毫秒）
 */
export const calculateDuration = (startTime: number, endTime: number = Date.now()): number => {
  return Math.max(0, endTime - startTime);
};
