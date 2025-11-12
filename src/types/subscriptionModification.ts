import { AdSubscription } from '@/hooks/useAdSubscription';

/**
 * 修改限制檢查結果
 */
export interface ModificationLimits {
  canUpgrade: boolean;
  canDowngrade: boolean;
  canModifyCoupons: boolean;
  canChangeToCash: boolean;
  canChangeToHybrid: boolean;
  
  // 限制信息
  minPlanAmount: number;
  issuedCouponCount: number;
  issuedTotalFaceValue: number;
  unredeemedCouponCount: number;
  editableFields: CouponEditableField[];
  restrictions: string[];
  
  // 分級信息
  modificationTier: 'full' | 'limited' | 'locked';
}

/**
 * 可編輯的優惠券欄位
 */
export type CouponEditableField = 
  | 'coupon_count' 
  | 'single_coupon_face_value' 
  | 'min_spend' 
  | 'max_discount';

/**
 * 優惠券配置
 */
export interface CouponConfig {
  coupon_count: number;
  single_coupon_face_value: number;
  min_spend: number;
  max_discount?: number;
}

/**
 * 變更類型
 */
export type ChangeType = 
  | 'upgrade' 
  | 'downgrade' 
  | 'modify_coupons' 
  | 'change_to_hybrid' 
  | 'change_to_cash';

/**
 * 變更歷史記錄
 */
export interface SubscriptionChangeHistory {
  id: string;
  subscription_id: string;
  changed_by: string;
  change_type: ChangeType;
  previous_values: Record<string, any>;
  new_values: Record<string, any>;
  payment_amount?: number;
  notes?: string;
  created_at: string;
}
