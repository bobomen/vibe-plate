/**
 * AI 功能相關的類型定義
 * 
 * 這個文件為未來的 AI 集成準備類型定義
 * 包括：推薦系統、偏好分析、智能排序
 */

import { Restaurant } from './restaurant';

/**
 * AI 推薦餐廳的結果
 */
export interface AIRecommendation {
  restaurant: Restaurant;
  score: number; // 0-100 的推薦分數
  reasons: RecommendationReason[]; // 推薦原因
  confidence: number; // 0-1 的信心度
}

/**
 * 推薦原因
 */
export interface RecommendationReason {
  type: 
    | 'cuisine_match'      // 菜系匹配
    | 'price_match'        // 價格匹配
    | 'location_match'     // 地點匹配
    | 'rating_high'        // 高評分
    | 'michelin'          // 米其林
    | '500_dishes'        // 500 盤
    | 'bib_gourmand'      // 必比登
    | 'similar_users'     // 相似用戶喜歡
    | 'trending';         // 熱門趨勢
  
  weight: number; // 權重 0-1
  description: string; // 中文描述
}

/**
 * 用戶偏好向量
 * 用於 AI 計算相似度
 */
export interface UserPreferenceVector {
  userId: string;
  
  // 菜系偏好向量 (One-Hot Encoding)
  cuisinePreferences: Record<string, number>;
  
  // 價格偏好
  pricePreference: number; // 1-4 的平均值
  
  // 評分要求
  minRating: number;
  
  // 特殊偏好
  michelinPreference: number; // 0-1
  dishes500Preference: number; // 0-1
  bibGourmandPreference: number; // 0-1
  
  // 行為特徵
  likeRate: number; // 總體喜歡率
  avgSwipeDuration: number; // 平均停留時間
  
  // 更新時間
  updatedAt: Date;
}

/**
 * AI 推薦請求參數
 */
export interface AIRecommendationRequest {
  userId: string;
  location?: {
    lat: number;
    lng: number;
  };
  filters?: {
    cuisineTypes?: string[];
    priceRange?: [number, number];
    maxDistance?: number;
    minRating?: number;
  };
  limit?: number; // 推薦數量
  excludeRestaurants?: string[]; // 排除的餐廳 ID
}

/**
 * AI 分析結果
 */
export interface AIAnalysisResult {
  userId: string;
  
  // 用戶畫像
  userProfile: {
    primaryCuisines: string[]; // 主要喜好菜系
    priceSegment: 'budget' | 'mid' | 'premium' | 'luxury';
    explorationLevel: 'conservative' | 'moderate' | 'adventurous'; // 探索程度
    qualitySeeker: boolean; // 是否追求高品質
  };
  
  // 推薦建議
  recommendations: AIRecommendation[];
  
  // 模型元數據
  modelVersion: string;
  confidence: number;
  generatedAt: Date;
}

/**
 * 滑卡演算法配置
 */
export interface SwipeAlgorithmConfig {
  // 推薦策略
  strategy: 
    | 'collaborative' // 協同過濾
    | 'content_based' // 內容推薦
    | 'hybrid'        // 混合推薦
    | 'random';       // 隨機（默認）
  
  // 多樣性控制
  diversityWeight: number; // 0-1，越高越多樣
  
  // 探索 vs 利用
  explorationRate: number; // 0-1，探索新選項的比例
  
  // 是否啟用 AI
  enableAI: boolean;
  
  // 更新頻率
  updateFrequency: 'realtime' | 'hourly' | 'daily';
}

/**
 * 餐廳特徵向量
 * 用於相似度計算
 */
export interface RestaurantFeatureVector {
  restaurantId: string;
  
  // 基本特徵
  cuisineType: string;
  priceRange: number;
  rating: number;
  reviewCount: number;
  
  // 地理特徵
  district: string;
  lat: number;
  lng: number;
  
  // 特殊標記
  hasMichelin: boolean;
  has500Dishes: boolean;
  hasBibGourmand: boolean;
  
  // 受歡迎程度
  viewCount: number;
  favoriteCount: number;
  likeRate: number;
}
