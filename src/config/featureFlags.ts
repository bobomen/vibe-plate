/**
 * Feature Flags 配置
 * 用於快速啟用/禁用新功能，確保可回溯性
 */
export const FEATURE_FLAGS = {
  // 訂閱管理擴展功能總開關
  SUBSCRIPTION_MODIFICATION: true,
  
  // 子功能開關
  UPGRADE_ENABLED: true,
  DOWNGRADE_ENABLED: true,
  COUPON_MODIFICATION_ENABLED: true,
  PAYMENT_TYPE_CHANGE_ENABLED: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
