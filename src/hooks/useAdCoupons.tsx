import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AdCoupon {
  id: string;
  subscription_id: string;
  restaurant_id: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_spend?: number;
  max_discount?: number;
  radius_km?: number;
  user_id?: string;
  claimed_at?: string;
  redeemed_at?: string;
  redeemed_amount?: number;
  discount_applied?: number;
  verification_code?: string;
  code_generated_at?: string;
  code_expires_at?: string;
  status: 'available' | 'claimed' | 'redeemed' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface CouponStats {
  total_coupons: number;
  available_coupons: number;
  claimed_coupons: number;
  redeemed_coupons: number;
  expired_coupons: number;
  claim_rate: number;
  redemption_rate: number;
  total_redeemed_amount: number;
}

export function useAdCoupons(subscriptionId?: string) {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<AdCoupon[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    if (!user?.id || !subscriptionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('restaurant_ad_coupons')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching ad coupons:', fetchError);
        setError(fetchError.message);
        setCoupons([]);
        return;
      }

      setCoupons((data || []) as AdCoupon[]);

      // Calculate stats
      const total = data?.length || 0;
      const available = data?.filter((c) => c.status === 'available').length || 0;
      const claimed = data?.filter((c) => c.status === 'claimed').length || 0;
      const redeemed = data?.filter((c) => c.status === 'redeemed').length || 0;
      const expired = data?.filter((c) => c.status === 'expired').length || 0;
      const totalRedeemedAmount = data?.reduce((sum, c) => sum + (c.redeemed_amount || 0), 0) || 0;

      setStats({
        total_coupons: total,
        available_coupons: available,
        claimed_coupons: claimed,
        redeemed_coupons: redeemed,
        expired_coupons: expired,
        claim_rate: total > 0 ? ((claimed + redeemed) / total) * 100 : 0,
        redemption_rate: claimed + redeemed > 0 ? (redeemed / (claimed + redeemed)) * 100 : 0,
        total_redeemed_amount: totalRedeemedAmount,
      });
    } catch (err) {
      console.error('Error in fetchCoupons:', err);
      setError(err instanceof Error ? err.message : '未知错误');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, subscriptionId]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const generateCoupons = async (data: {
    subscription_id: string;
    restaurant_id: string;
    count: number;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_spend?: number;
    max_discount?: number;
    radius_km?: number;
    expires_at: string;
  }) => {
    const couponsToInsert = Array.from({ length: data.count }, () => ({
      subscription_id: data.subscription_id,
      restaurant_id: data.restaurant_id,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      min_spend: data.min_spend,
      max_discount: data.max_discount,
      radius_km: data.radius_km,
      expires_at: data.expires_at,
      status: 'available' as const,
    }));

    const { error: insertError } = await supabase
      .from('restaurant_ad_coupons')
      .insert(couponsToInsert);

    if (insertError) {
      throw insertError;
    }

    await fetchCoupons();
  };

  return {
    coupons,
    stats,
    loading,
    error,
    generateCoupons,
    refetch: fetchCoupons,
  };
}
