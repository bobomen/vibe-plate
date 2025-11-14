import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserCoupon {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_district?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_spend?: number;
  max_discount?: number;
  expires_at: string;
  status: string;
  claimed_at?: string;
  used_at?: string;
  user_coupon_id?: string;
}

export function useUserCoupons() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 獲取所有可用的優惠券 + 餐廳資訊
      const { data: availableCoupons, error: availableError } = await supabase
        .from('restaurant_ad_coupons')
        .select(`
          id,
          restaurant_id,
          discount_type,
          discount_value,
          min_spend,
          max_discount,
          expires_at,
          status,
          restaurants!inner (
            name,
            district
          )
        `)
        .eq('status', 'available')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (availableError) throw availableError;

      // 獲取用戶已領取的優惠券
      const { data: userCoupons, error: userCouponsError } = await supabase
        .from('user_coupons')
        .select(`
          id,
          coupon_id,
          status,
          claimed_at,
          used_at
        `)
        .eq('user_id', user.id);

      if (userCouponsError) throw userCouponsError;

      // 建立用戶優惠券映射
      const userCouponMap = new Map(
        (userCoupons || []).map(uc => [uc.coupon_id, uc])
      );

      // 合併資料
      const mergedCoupons: UserCoupon[] = (availableCoupons || []).map((coupon: any) => ({
        id: coupon.id,
        restaurant_id: coupon.restaurant_id,
        restaurant_name: coupon.restaurants.name,
        restaurant_district: coupon.restaurants.district,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_spend: coupon.min_spend,
        max_discount: coupon.max_discount,
        expires_at: coupon.expires_at,
        status: coupon.status,
        claimed_at: userCouponMap.get(coupon.id)?.claimed_at,
        used_at: userCouponMap.get(coupon.id)?.used_at,
        user_coupon_id: userCouponMap.get(coupon.id)?.id,
      }));

      setCoupons(mergedCoupons);
    } catch (err) {
      console.error('獲取優惠券失敗:', err);
      setError(err instanceof Error ? err.message : '未知錯誤');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const claimCoupon = async (couponId: string) => {
    if (!user?.id) {
      throw new Error('用戶未登入');
    }

    try {
      // 檢查是否已領取
      const existingClaim = coupons.find(c => c.id === couponId && c.claimed_at);
      if (existingClaim) {
        throw new Error('您已經領取過這張優惠券');
      }

      // 領取優惠券
      const { error: claimError } = await supabase
        .from('user_coupons')
        .insert({
          user_id: user.id,
          coupon_id: couponId,
          status: 'claimed',
          claimed_at: new Date().toISOString(),
        });

      if (claimError) throw claimError;

      // 重新獲取優惠券列表
      await fetchCoupons();
    } catch (err) {
      console.error('領取優惠券失敗:', err);
      throw err;
    }
  };

  return {
    coupons,
    loading,
    error,
    claimCoupon,
    refetch: fetchCoupons,
  };
}
