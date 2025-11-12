/**
 * 广告优惠券系统类型定义
 * 支持大规模用户场景 (10k-30k+)
 */

// ============= 优惠券配置 =============
export interface CouponConfig {
  coupon_count: number;              // 优惠券数量
  single_coupon_face_value: number;  // 单张面值
  min_spend: number;                 // 最低消费
  max_discount?: number;             // 最高折扣（可选）
}

// ============= 参考方案 =============
export interface ReferencePlan {
  id: 'conservative' | 'balanced' | 'aggressive';
  name: string;
  description: string;
  config: CouponConfig;
  // 预计效果
  estimated_reach: number;           // 预计触达人数
  estimated_redemption_rate: number; // 预计核销率 (%)
}

// ============= 预算分析 =============
export interface BudgetAnalysis {
  plan_amount: number;               // 方案总额
  cash_paid: number;                 // 现金支付
  coupon_budget: number;             // 优惠券预算
  issuable_face_value: number;       // 可发放面值总额 (budget × 2)
  redemption_cap: number;            // 兑换上限 (= coupon_budget)
}

// ============= 优惠券状态检查 =============
export interface CouponRedemptionCheck {
  can_redeem: boolean;               // 是否可兑换
  reason?: 'budget_exhausted' | 'expired' | 'invalid'; // 不可兑换原因
  remaining_budget: number;          // 剩余预算
  budget_usage_percent: number;      // 预算使用率 (%)
}

// ============= 预算使用统计 =============
export interface BudgetUsageStats {
  total_budget: number;              // 总预算
  used_amount: number;               // 已使用金额
  remaining_amount: number;          // 剩余金额
  usage_percent: number;             // 使用率 (%)
  total_issued: number;              // 已发放数量
  total_redeemed: number;            // 已核销数量
  redemption_rate: number;           // 核销率 (%)
}
