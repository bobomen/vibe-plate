import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  id: string;
  subscription_type: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  auto_renew: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }, [user]);

  const createSubscription = useCallback(async () => {
    if (!user || loading) return;
    
    setLoading(true);
    try {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          subscription_type: 'premium',
          status: 'active',
          expires_at: expiryDate.toISOString(),
          auto_renew: true
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('user_id', user.id);

      setSubscription(data);
      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, loading]);

  const cancelSubscription = useCallback(async () => {
    if (!user || !subscription || loading) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          auto_renew: false
        })
        .eq('id', subscription.id);

      if (error) throw error;

      const updatedSubscription = {
        ...subscription,
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        auto_renew: false
      };
      setSubscription(updatedSubscription);
      
      // Check if should lose premium immediately
      let shouldLosePremium = false;
      if (subscription.expires_at) {
        const expiryDate = new Date(subscription.expires_at);
        const now = new Date();
        shouldLosePremium = expiryDate <= now;
      } else {
        shouldLosePremium = true;
      }
      
      if (shouldLosePremium) {
        await supabase
          .from('profiles')
          .update({ is_premium: false })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, subscription, loading]);

  const getDaysUntilExpiry = useCallback(() => {
    if (!subscription?.expires_at) return null;
    
    const expiryDate = new Date(subscription.expires_at);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }, [subscription?.expires_at]);

  useEffect(() => {
    if (user) {
      fetchSubscription().then(setSubscription);
    }
  }, [user, fetchSubscription]);

  return {
    subscription,
    loading,
    createSubscription,
    cancelSubscription,
    daysUntilExpiry: getDaysUntilExpiry(),
    refreshSubscription: fetchSubscription
  };
};