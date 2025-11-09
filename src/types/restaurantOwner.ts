/**
 * 餐厅业主数据类型定义
 * Phase 1: 曝光指标系统
 */

// ============= 竞争力指标 =============
export interface CompetitivenessMetrics {
  district_rank: number;
  district_total: number;
  district_percentile: number;
  cuisine_rank: number;
  cuisine_total: number;
  cuisine_percentile: number;
}

// ============= 曝光效率评分 =============
export interface EfficiencyScore {
  exposure_score: number;        // 曝光表现 (0-25)
  engagement_score: number;      // 互动表现 (0-25)
  favorite_score: number;        // 收藏表现 (0-25)
  quality_score: number;         // 品质表现 (0-25)
  total_score: number;           // 总分 (0-100)
  
  // 预留：未来留言功能
  comment_score: number;         // 留言互动评分 (0-15)
  comment_engagement_rate: number; // 留言参与率 (%)
}

// ============= 曝光提升预测 =============
export interface ExposureBoost {
  current_multiplier: number;
  potential_multiplier: number;
  estimated_impressions_increase: number;
}

// ============= 综合曝光指标 =============
export interface RestaurantExposureMetrics {
  restaurant_id: string;
  district: string;
  cuisine_type: string;
  competitiveness: CompetitivenessMetrics;
  efficiency_score: EfficiencyScore;
  exposure_boost: ExposureBoost;
}

// ============= 趋势数据点 =============
export interface TrendDataPoint {
  date: string;
  impressions: number;
  detail_views: number;
  favorites: number;
  // 计算字段
  ctr?: number;          // 点击率 (%)
  save_rate?: number;    // 收藏率 (%)
}

// ============= 时间范围选项 =============
export type TimeRange = 7 | 30 | 90;

// ============= 健康评分等级 =============
export type HealthScoreLevel = 'excellent' | 'good' | 'fair' | 'poor';

export const getHealthScoreLevel = (score: number): HealthScoreLevel => {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
};

export const getHealthScoreColor = (score: number): string => {
  const level = getHealthScoreLevel(score);
  const colors = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    fair: 'text-yellow-600',
    poor: 'text-red-600',
  };
  return colors[level];
};

export const getHealthScoreBgColor = (score: number): string => {
  const level = getHealthScoreLevel(score);
  const colors = {
    excellent: 'bg-green-100 dark:bg-green-950',
    good: 'bg-blue-100 dark:bg-blue-950',
    fair: 'bg-yellow-100 dark:bg-yellow-950',
    poor: 'bg-red-100 dark:bg-red-950',
  };
  return colors[level];
};
