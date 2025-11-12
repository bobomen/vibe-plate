import { ReferencePlan, BudgetAnalysis } from '@/types/adCoupon';

/**
 * 參考方案配置
 * 基於 coupon_budget × 2 的可發放面值
 */
export const getReferencePlans = (couponBudget: number): ReferencePlan[] => {
  const issuableFaceValue = couponBudget * 2;

  return [
    {
      id: 'conservative',
      name: '保守型',
      description: '高門檻，低核銷率，適合高客單價餐廳',
      config: {
        coupon_count: Math.floor(issuableFaceValue / 150),
        single_coupon_face_value: 150,
        min_spend: 500,
        max_discount: 150,
      },
      estimated_reach: Math.floor(issuableFaceValue / 150) * 10,
      estimated_redemption_rate: 25,
    },
    {
      id: 'balanced',
      name: '平衡型',
      description: '中等門檻，平衡核銷率，適合大多數餐廳',
      config: {
        coupon_count: Math.floor(issuableFaceValue / 100),
        single_coupon_face_value: 100,
        min_spend: 300,
        max_discount: 100,
      },
      estimated_reach: Math.floor(issuableFaceValue / 100) * 8,
      estimated_redemption_rate: 35,
    },
    {
      id: 'aggressive',
      name: '積極型',
      description: '低門檻，高核銷率，快速吸引客流',
      config: {
        coupon_count: Math.floor(issuableFaceValue / 50),
        single_coupon_face_value: 50,
        min_spend: 150,
        max_discount: 50,
      },
      estimated_reach: Math.floor(issuableFaceValue / 50) * 6,
      estimated_redemption_rate: 50,
    },
  ];
};

/**
 * 計算預算分析
 */
export const calculateBudgetAnalysis = (
  planAmount: number,
  cashPaid: number
): BudgetAnalysis => {
  const couponBudget = planAmount - cashPaid;
  const issuableFaceValue = couponBudget * 2;

  return {
    plan_amount: planAmount,
    cash_paid: cashPaid,
    coupon_budget: couponBudget,
    issuable_face_value: issuableFaceValue,
    redemption_cap: couponBudget,
  };
};

/**
 * 驗證優惠券配置
 */
export const validateCouponConfig = (
  config: {
    coupon_count: number;
    single_coupon_face_value: number;
    min_spend: number;
    max_discount?: number;
  },
  issuableFaceValue: number
): { valid: boolean; error?: string } => {
  if (config.coupon_count <= 0) {
    return { valid: false, error: '優惠券數量必須大於 0' };
  }

  if (config.single_coupon_face_value <= 0) {
    return { valid: false, error: '單張面值必須大於 0' };
  }

  if (config.min_spend < config.single_coupon_face_value) {
    return { valid: false, error: '最低消費不能低於優惠券面值' };
  }

  const totalFaceValue = config.coupon_count * config.single_coupon_face_value;
  if (totalFaceValue > issuableFaceValue * 1.1) {
    return { 
      valid: false, 
      error: `總面值 (${totalFaceValue}) 不能超過可發放額度 (${issuableFaceValue})` 
    };
  }

  return { valid: true };
};
