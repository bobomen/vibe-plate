import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ModificationLimits, CouponConfig } from '@/types/subscriptionModification';
import { FEATURE_FLAGS } from '@/config/featureFlags';

export interface AdSubscription {
  id: string;
  restaurant_id: string;
  plan_amount: number;
  cash_paid: number;
  coupon_budget: number;
  coupon_ratio: number;
  traffic_multiplier: number;
  total_redeemed_amount: number;
  status: 'active' | 'expired' | 'cancelled';
  subscription_type: 'cash_only' | 'hybrid';
  started_at: string;
  expires_at: string;
  cancelled_at?: string;
  stripe_payment_id?: string;
  stripe_subscription_id?: string;
  coupon_config?: Record<string, any> | null;
  last_modified_at?: string | null;
  modification_count?: number;
}

export function useAdSubscription(restaurantId?: string) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<AdSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id || !restaurantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('restaurant_ad_subscriptions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching ad subscription:', fetchError);
        setError(fetchError.message);
        setSubscription(null);
        return;
      }

      setSubscription(data as AdSubscription);
    } catch (err) {
      console.error('Error in fetchSubscription:', err);
      setError(err instanceof Error ? err.message : '未知错误');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, restaurantId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const createSubscription = async (data: {
    plan_amount: number;
    cash_paid: number;
    coupon_budget: number;
    expires_at: string;
  }) => {
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    const coupon_ratio = (data.coupon_budget / data.plan_amount) * 100;

    const { data: newSubscription, error: createError } = await supabase
      .from('restaurant_ad_subscriptions')
      .insert({
        restaurant_id: restaurantId,
        plan_amount: data.plan_amount,
        cash_paid: data.cash_paid,
        coupon_budget: data.coupon_budget,
        coupon_ratio,
        expires_at: data.expires_at,
        subscription_type: data.coupon_budget > 0 ? 'hybrid' : 'cash_only',
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    setSubscription(newSubscription as AdSubscription);
    return newSubscription;
  };

  const cancelSubscription = async () => {
    if (!subscription?.id) {
      throw new Error('No active subscription');
    }

    const { error: updateError } = await supabase
      .from('restaurant_ad_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      throw updateError;
    }

    await fetchSubscription();
  };

  /**
   * 檢查修改限制
   * 🔒 只讀操作，不影響數據
   */
  const checkModificationLimits = useCallback(async (): Promise<ModificationLimits> => {
    if (!FEATURE_FLAGS.SUBSCRIPTION_MODIFICATION) {
      return {
        canUpgrade: false,
        canDowngrade: false,
        canModifyCoupons: false,
        canChangeToCash: false,
        canChangeToHybrid: false,
        minPlanAmount: 0,
        issuedCouponCount: 0,
        issuedTotalFaceValue: 0,
        unredeemedCouponCount: 0,
        editableFields: [],
        restrictions: ['訂閱管理功能目前未啟用'],
        modificationTier: 'locked',
      };
    }
    
    if (!subscription) {
      return {
        canUpgrade: false,
        canDowngrade: false,
        canModifyCoupons: false,
        canChangeToCash: false,
        canChangeToHybrid: false,
        minPlanAmount: 0,
        issuedCouponCount: 0,
        issuedTotalFaceValue: 0,
        unredeemedCouponCount: 0,
        editableFields: [],
        restrictions: ['無有效訂閱'],
        modificationTier: 'locked',
      };
    }

    try {
      // 1. 獲取已發放優惠券數據
      const { data: issuedCoupons, error: couponError } = await supabase
        .from('restaurant_ad_coupons')
        .select('discount_value, status')
        .eq('subscription_id', subscription.id)
        .in('status', ['available', 'claimed']);
      
      if (couponError) throw couponError;
      
      const issuedCount = issuedCoupons?.length || 0;
      const issuedTotalFaceValue = issuedCoupons?.reduce(
        (sum, c) => sum + (Number(c.discount_value) || 0), 0
      ) || 0;
      const unredeemedCount = issuedCoupons?.filter(c => c.status === 'claimed').length || 0;
      
      // 2. 計算最低允許方案金額（基於已核銷金額）
      const minPlanAmount = subscription.coupon_ratio > 0
        ? subscription.total_redeemed_amount / (subscription.coupon_ratio / 100)
        : subscription.total_redeemed_amount;
      
      // 3. 判斷分級（0-10 / 11-50 / 51+）
      const modificationTier: ModificationLimits['modificationTier'] = 
        issuedCount <= 10 ? 'full' :
        issuedCount <= 50 ? 'limited' :
        'locked';
      
      // 4. 確定可編輯欄位
      const editableFields: ModificationLimits['editableFields'] = 
        modificationTier === 'full' 
          ? ['coupon_count', 'single_coupon_face_value', 'min_spend', 'max_discount']
          : modificationTier === 'limited'
          ? ['min_spend', 'max_discount']
          : [];
      
      // 5. 判斷各種操作的可行性
      const restrictions: string[] = [];
      
      const canUpgrade = FEATURE_FLAGS.UPGRADE_ENABLED;
      
      const canDowngrade = FEATURE_FLAGS.DOWNGRADE_ENABLED && 
        subscription.total_redeemed_amount < subscription.plan_amount * 0.5;
      if (!canDowngrade && FEATURE_FLAGS.DOWNGRADE_ENABLED) {
        restrictions.push('已核銷金額過高，無法降級');
      }
      
      const canModifyCoupons = FEATURE_FLAGS.COUPON_MODIFICATION_ENABLED && 
        subscription.subscription_type === 'hybrid' &&
        modificationTier !== 'locked';
      if (!canModifyCoupons && subscription.subscription_type === 'hybrid') {
        if (modificationTier === 'locked') {
          restrictions.push('已發放優惠券過多（51+ 張），無法修改配置');
        }
      }
      
      const canChangeToCash = subscription.subscription_type === 'hybrid' && 
        unredeemedCount === 0;
      if (!canChangeToCash && subscription.subscription_type === 'hybrid') {
        restrictions.push(`有 ${unredeemedCount} 張未核銷優惠券，無法改為純現金支付`);
      }
      
      const canChangeToHybrid = subscription.subscription_type === 'cash_only';
      
      // 6. 檢查修改頻率限制（7天內只能修改一次）
      if (subscription.last_modified_at) {
        const daysSinceLastMod = Math.floor(
          (Date.now() - new Date(subscription.last_modified_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastMod < 7) {
          restrictions.push(`距離上次修改不足 7 天（剩餘 ${7 - daysSinceLastMod} 天）`);
        }
      }
      
      return {
        canUpgrade,
        canDowngrade,
        canModifyCoupons,
        canChangeToCash,
        canChangeToHybrid,
        minPlanAmount,
        issuedCouponCount: issuedCount,
        issuedTotalFaceValue,
        unredeemedCouponCount: unredeemedCount,
        editableFields,
        restrictions,
        modificationTier,
      };
    } catch (err) {
      console.error('Error checking modification limits:', err);
      return {
        canUpgrade: false,
        canDowngrade: false,
        canModifyCoupons: false,
        canChangeToCash: false,
        canChangeToHybrid: false,
        minPlanAmount: 0,
        issuedCouponCount: 0,
        issuedTotalFaceValue: 0,
        unredeemedCouponCount: 0,
        editableFields: [],
        restrictions: ['檢查修改限制時發生錯誤'],
        modificationTier: 'locked',
      };
    }
  }, [subscription]);

  /**
   * 升級訂閱
   * 🔒 獨立事務，失敗自動回滾
   */
  const upgradeSubscription = useCallback(async (
    newPlanAmount: number,
    paymentProof?: string
  ): Promise<AdSubscription> => {
    if (!FEATURE_FLAGS.UPGRADE_ENABLED) {
      throw new Error('升級功能目前未啟用');
    }
    
    if (!subscription) {
      throw new Error('無有效訂閱');
    }
    
    if (newPlanAmount <= subscription.plan_amount) {
      throw new Error(`新金額（${newPlanAmount}）必須大於當前金額（${subscription.plan_amount}）`);
    }
    
    const priceDiff = newPlanAmount - subscription.plan_amount;
    const newCouponBudget = newPlanAmount * (subscription.coupon_ratio / 100);
    const newCashPaid = subscription.cash_paid + priceDiff * (1 - subscription.coupon_ratio / 100);
    
    try {
      // 1. 更新訂閱（使用樂觀鎖）
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('restaurant_ad_subscriptions')
        .update({
          plan_amount: newPlanAmount,
          cash_paid: newCashPaid,
          coupon_budget: newCouponBudget,
          last_modified_at: new Date().toISOString(),
          modification_count: (subscription.modification_count || 0) + 1,
        })
        .eq('id', subscription.id)
        .eq('modification_count', subscription.modification_count || 0) // 樂觀鎖
        .select()
        .single();
      
      if (updateError) {
        if (updateError.code === 'PGRST116') {
          throw new Error('訂閱已被其他操作修改，請重新整理後再試');
        }
        throw updateError;
      }
      
      // 2. 記錄變更歷史
      const { error: historyError } = await supabase
        .from('subscription_change_history')
        .insert({
          subscription_id: subscription.id,
          changed_by: user!.id,
          change_type: 'upgrade',
          previous_values: {
            plan_amount: subscription.plan_amount,
            cash_paid: subscription.cash_paid,
            coupon_budget: subscription.coupon_budget,
          },
          new_values: {
            plan_amount: newPlanAmount,
            cash_paid: newCashPaid,
            coupon_budget: newCouponBudget,
          },
          payment_amount: priceDiff,
          notes: paymentProof ? `支付憑證：${paymentProof}` : undefined,
        });
      
      if (historyError) {
        console.error('Failed to log history:', historyError);
        // 不中斷流程，歷史記錄失敗不影響升級
      }
      
      // 3. 更新本地狀態
      setSubscription(updatedSubscription as AdSubscription);
      
      return updatedSubscription as AdSubscription;
    } catch (err) {
      console.error('Upgrade failed:', err);
      throw err;
    }
  }, [subscription, user]);

  /**
   * 降級訂閱
   * 🔒 包含安全檢查，防止預算超支
   */
  const downgradeSubscription = useCallback(async (
    newPlanAmount: number
  ): Promise<AdSubscription> => {
    if (!FEATURE_FLAGS.DOWNGRADE_ENABLED) {
      throw new Error('降級功能目前未啟用');
    }
    
    if (!subscription) {
      throw new Error('無有效訂閱');
    }
    
    // 1. 檢查修改限制
    const limits = await checkModificationLimits();
    if (!limits.canDowngrade) {
      throw new Error(
        '無法降級：\n' + limits.restrictions.filter(r => r.includes('降級')).join('\n')
      );
    }
    
    // 2. 驗證最低金額
    if (newPlanAmount < limits.minPlanAmount) {
      throw new Error(
        `新金額（${newPlanAmount} 元）不能低於最低允許金額（${Math.ceil(limits.minPlanAmount)} 元）\n` +
        `最低金額基於已核銷金額 ${subscription.total_redeemed_amount} 元計算`
      );
    }
    
    // 3. 檢查已發放優惠券總面值
    const newCouponBudget = newPlanAmount * (subscription.coupon_ratio / 100);
    const newIssuableFaceValue = newCouponBudget * 2;
    
    if (limits.issuedTotalFaceValue > newIssuableFaceValue) {
      throw new Error(
        `無法降級：已發放優惠券總面值（${limits.issuedTotalFaceValue} 元）` +
        `超過新方案的可發放額度（${newIssuableFaceValue} 元）\n` +
        `請等待更多優惠券被核銷或到期後再試`
      );
    }
    
    const newCashPaid = newPlanAmount * (1 - subscription.coupon_ratio / 100);
    
    try {
      // 4. 更新訂閱
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('restaurant_ad_subscriptions')
        .update({
          plan_amount: newPlanAmount,
          cash_paid: newCashPaid,
          coupon_budget: newCouponBudget,
          last_modified_at: new Date().toISOString(),
          modification_count: (subscription.modification_count || 0) + 1,
        })
        .eq('id', subscription.id)
        .eq('modification_count', subscription.modification_count || 0)
        .select()
        .single();
      
      if (updateError) {
        if (updateError.code === 'PGRST116') {
          throw new Error('訂閱已被其他操作修改，請重新整理後再試');
        }
        throw updateError;
      }
      
      // 5. 記錄變更歷史
      await supabase.from('subscription_change_history').insert({
        subscription_id: subscription.id,
        changed_by: user!.id,
        change_type: 'downgrade',
        previous_values: {
          plan_amount: subscription.plan_amount,
          coupon_budget: subscription.coupon_budget,
        },
        new_values: {
          plan_amount: newPlanAmount,
          coupon_budget: newCouponBudget,
        },
        payment_amount: -(subscription.plan_amount - newPlanAmount), // 負數表示減少
        notes: '降級不退款，僅調整未來預算',
      });
      
      setSubscription(updatedSubscription as AdSubscription);
      return updatedSubscription as AdSubscription;
    } catch (err) {
      console.error('Downgrade failed:', err);
      throw err;
    }
  }, [subscription, user, checkModificationLimits]);

  /**
   * 修改優惠券配置
   * 🔒 分級限制，保護已發放優惠券
   */
  const updateCouponConfig = useCallback(async (
    newConfig: CouponConfig
  ): Promise<AdSubscription> => {
    if (!FEATURE_FLAGS.COUPON_MODIFICATION_ENABLED) {
      throw new Error('優惠券修改功能目前未啟用');
    }
    
    if (!subscription || subscription.subscription_type !== 'hybrid') {
      throw new Error('只有混合支付訂閱可以修改優惠券配置');
    }
    
    // 1. 檢查修改限制
    const limits = await checkModificationLimits();
    if (!limits.canModifyCoupons) {
      throw new Error(
        '無法修改優惠券配置：\n' + 
        limits.restrictions.filter(r => r.includes('優惠券')).join('\n')
      );
    }
    
    // 2. 驗證可編輯欄位（分級檢查）
    if (limits.modificationTier === 'limited') {
      // 11-50張：只能修改 min_spend 和 max_discount
      const currentConfig = subscription.coupon_config as CouponConfig | null;
      if (currentConfig) {
        if (newConfig.coupon_count !== currentConfig.coupon_count) {
          throw new Error('已發放 11-50 張優惠券，無法修改優惠券數量');
        }
        if (newConfig.single_coupon_face_value !== currentConfig.single_coupon_face_value) {
          throw new Error('已發放 11-50 張優惠券，無法修改單張面值');
        }
      }
    }
    
    // 3. 驗證總面值不超過可發放額度
    const totalFaceValue = newConfig.coupon_count * newConfig.single_coupon_face_value;
    const issuableFaceValue = subscription.coupon_budget * 2;
    
    if (totalFaceValue > issuableFaceValue) {
      throw new Error(
        `總面值（${totalFaceValue} 元）超過可發放額度（${issuableFaceValue} 元）\n` +
        `請調整優惠券數量或單張面值`
      );
    }
    
    // 4. 驗證最低消費規則（3-5倍面值）
    if (newConfig.min_spend < newConfig.single_coupon_face_value * 3) {
      throw new Error(
        `最低消費（${newConfig.min_spend} 元）應至少為單張面值（${newConfig.single_coupon_face_value} 元）的 3 倍`
      );
    }
    
    try {
      // 5. 更新配置
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('restaurant_ad_subscriptions')
        .update({
          coupon_config: newConfig as any,
          last_modified_at: new Date().toISOString(),
          modification_count: (subscription.modification_count || 0) + 1,
        })
        .eq('id', subscription.id)
        .eq('modification_count', subscription.modification_count || 0)
        .select()
        .single();
      
      if (updateError) {
        if (updateError.code === 'PGRST116') {
          throw new Error('訂閱已被其他操作修改，請重新整理後再試');
        }
        throw updateError;
      }
      
      // 6. 記錄變更
      const { error: historyError } = await supabase
        .from('subscription_change_history')
        .insert({
          subscription_id: subscription.id,
          changed_by: user!.id,
          change_type: 'modify_coupons',
          previous_values: (subscription.coupon_config || {}) as any,
          new_values: newConfig as any,
          notes: `修改級別：${limits.modificationTier}`,
        });
      
      if (historyError) {
        console.error('Failed to log history:', historyError);
      }
      
      setSubscription(updatedSubscription as AdSubscription);
      return updatedSubscription as AdSubscription;
    } catch (err) {
      console.error('Update coupon config failed:', err);
      throw err;
    }
  }, [subscription, user, checkModificationLimits]);

  return {
    // 現有方法（不變）
    subscription,
    loading,
    error,
    createSubscription,
    cancelSubscription,
    refetch: fetchSubscription,
    
    // 新增方法
    checkModificationLimits,
    upgradeSubscription,
    downgradeSubscription,
    updateCouponConfig,
  };
}
