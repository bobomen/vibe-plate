import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';
import { usePremiumModal } from './usePremiumModal';

export const usePremium = () => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    subscription,
    loading: subscriptionLoading,
    createSubscription,
    cancelSubscription,
    daysUntilExpiry,
    refreshSubscription
  } = useSubscription();

  const { showFirstTimeModal, markModalAsSeen } = usePremiumModal(isPremium, subscription);

  // Check if subscription is active
  const checkPremiumStatus = useCallback(() => {
    if (!subscription) return false;
    
    if (subscription.status === 'active') {
      if (subscription.expires_at) {
        const expiryDate = new Date(subscription.expires_at);
        const now = new Date();
        return expiryDate > now;
      }
      return true; // No expiry date means permanent
    }
    
    return false;
  }, [subscription]);

  // Update premium status when subscription changes
  useEffect(() => {
    const premiumStatus = checkPremiumStatus();
    setIsPremium(premiumStatus);
    
    // Sync with profile if needed
    if (user && subscription) {
      supabase
        .from('profiles')
        .update({ is_premium: premiumStatus })
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) console.error('Error syncing premium status:', error);
        });
    }
  }, [subscription, checkPremiumStatus, user]);

  const upgradeToPremium = useCallback(async () => {
    if (!user || loading || subscriptionLoading) return;
    
    setLoading(true);
    try {
      await createSubscription();
      await refreshSubscription();
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, loading, subscriptionLoading, createSubscription, refreshSubscription]);

  const handleCancelSubscription = useCallback(async () => {
    if (!user || loading || subscriptionLoading) return;
    
    setLoading(true);
    try {
      await cancelSubscription();
      await refreshSubscription();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, loading, subscriptionLoading, cancelSubscription, refreshSubscription]);

  const memoizedReturn = useMemo(() => ({
    isPremium,
    showFirstTimeModal,
    markModalAsSeen,
    upgradeToPremium,
    cancelSubscription: handleCancelSubscription,
    loading: loading || subscriptionLoading,
    subscription,
    daysUntilExpiry,
    refreshSubscription
  }), [
    isPremium,
    showFirstTimeModal,
    markModalAsSeen,
    upgradeToPremium,
    handleCancelSubscription,
    loading,
    subscriptionLoading,
    subscription,
    daysUntilExpiry,
    refreshSubscription
  ]);

  return memoizedReturn;
};