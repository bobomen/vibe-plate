import { ReferencePlan, BudgetAnalysis } from '@/types/adCoupon';

/**
 * 参考方案配置
 * 基于 coupon_budget × 2 的可发放面值
 */
export const getReferencePlans = (couponBudget: number): ReferencePlan[] => {
  const issuableFaceValue = couponBudget * 2;

  return [
    {
      id: 'conservative',
      name: '保守型',
      description: '高门槛，低核销率，适合高客单价餐厅',
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
      description: '中等门槛，平衡核销率，适合大多数餐厅',
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
      name: '积极型',
      description: '低门槛，高核销率，快速吸引客流',
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
 * 计算预算分析
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
 * 验证优惠券配置
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
    return { valid: false, error: '优惠券数量必须大于 0' };
  }

  if (config.single_coupon_face_value <= 0) {
    return { valid: false, error: '单张面值必须大于 0' };
  }

  if (config.min_spend < config.single_coupon_face_value) {
    return { valid: false, error: '最低消费不能低于优惠券面值' };
  }

  const totalFaceValue = config.coupon_count * config.single_coupon_face_value;
  if (totalFaceValue > issuableFaceValue * 1.1) {
    return { 
      valid: false, 
      error: `总面值 (${totalFaceValue}) 不能超过可发放额度 (${issuableFaceValue})` 
    };
  }

  return { valid: true };
};
