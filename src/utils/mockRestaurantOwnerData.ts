/**
 * 模擬數據生成器 - 餐廳業者後台
 * 僅供開發測試使用，生產環境完全禁用
 */

import type { RestaurantExposureMetrics, TrendDataPoint } from '@/types/restaurantOwner';

// 隨機數生成輔助函數
const randomBetween = (min: number, max: number) => 
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min: number, max: number, decimals = 2) => 
  Number((Math.random() * (max - min) + min).toFixed(decimals));

/**
 * 生成模擬的餐廳業者身份數據
 */
export function generateMockOwnerData() {
  return {
    restaurantId: 'mock-restaurant-id-001',
    restaurantName: '測試餐廳 - 開發模式',
    verified: true,
  };
}

/**
 * 生成模擬的基礎統計數據
 */
export interface MockRestaurantStats {
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

export function generateMockRestaurantStats(): MockRestaurantStats {
  const totalImpressions = randomBetween(800, 1500);
  const detailViews = Math.floor(totalImpressions * randomFloat(0.12, 0.18));
  const favoritesCount = Math.floor(detailViews * randomFloat(0.15, 0.25));
  
  return {
    total_impressions: totalImpressions,
    detail_views: detailViews,
    favorites_count: favoritesCount,
    save_rate: Number(((favoritesCount / totalImpressions) * 100).toFixed(1)),
    phone_clicks: randomBetween(15, 45),
    map_clicks: randomBetween(30, 80),
    menu_clicks: randomBetween(20, 60),
    website_clicks: randomBetween(10, 35),
    avg_view_duration_sec: randomBetween(25, 55),
    like_rate: randomFloat(55, 75),
    district_rank: randomBetween(3, 15),
  };
}

/**
 * 生成模擬的曝光指標數據
 */
export function generateMockExposureMetrics(): RestaurantExposureMetrics {
  const districtTotal = randomBetween(120, 200);
  const districtRank = randomBetween(3, 15);
  const cuisineTotal = randomBetween(30, 60);
  const cuisineRank = randomBetween(2, 8);

  return {
    restaurant_id: 'mock-restaurant-id-001',
    district: '大安區',
    cuisine_type: '日式料理',
    competitiveness: {
      district_rank: districtRank,
      district_total: districtTotal,
      district_percentile: Number(((1 - districtRank / districtTotal) * 100).toFixed(1)),
      cuisine_rank: cuisineRank,
      cuisine_total: cuisineTotal,
      cuisine_percentile: Number(((1 - cuisineRank / cuisineTotal) * 100).toFixed(1)),
    },
    efficiency_score: {
      total_score: randomBetween(70, 85),
      exposure_score: randomBetween(18, 24),
      engagement_score: randomBetween(16, 22),
      favorite_score: randomBetween(18, 24),
      quality_score: randomBetween(14, 20),
      comment_score: randomBetween(8, 14),
      comment_engagement_rate: randomFloat(2, 8),
    },
    exposure_boost: {
      current_multiplier: 1.0,
      potential_multiplier: randomFloat(1.3, 1.8),
      estimated_impressions_increase: randomBetween(100, 300),
    },
  };
}

/**
 * 生成模擬的趨勢數據
 * @param days 生成的天數
 */
export function generateMockTrendData(days: number = 30): TrendDataPoint[] {
  const data: TrendDataPoint[] = [];
  const today = new Date();
  
  // 基礎值
  const baseImpressions = randomBetween(30, 50);
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // 週末流量較高
    const weekendMultiplier = isWeekend ? randomFloat(1.2, 1.5) : 1;
    // 隨機波動 ±20%
    const randomVariation = randomFloat(0.8, 1.2);
    
    const impressions = Math.floor(baseImpressions * weekendMultiplier * randomVariation);
    const detailViews = Math.floor(impressions * randomFloat(0.12, 0.18));
    const favorites = Math.floor(detailViews * randomFloat(0.15, 0.3));
    
    data.push({
      date: date.toISOString().split('T')[0],
      impressions,
      detail_views: detailViews,
      favorites,
      ctr: impressions > 0 ? Number(((detailViews / impressions) * 100).toFixed(2)) : 0,
      save_rate: impressions > 0 ? Number(((favorites / impressions) * 100).toFixed(2)) : 0,
    });
  }
  
  return data;
}
