import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

  return {
    subscription,
    loading,
    error,
    createSubscription,
    cancelSubscription,
    refetch: fetchSubscription,
  };
}
