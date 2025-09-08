import { useState, useEffect } from 'react';
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

interface ProfileData {
  is_premium: boolean;
  should_nag: boolean;
  last_nag_at: string | null;
  nag_variant: string;
}

export const usePremium = () => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [sessionDismissed, setSessionDismissed] = useState(false); // Track if user dismissed modal in current session

  // Fetch user's subscription status from database
  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  // Determine if modal should show based on premium status and nag settings
  useEffect(() => {
    if (user && profile !== null && !isPremium && !sessionDismissed) {
      const shouldShowModal = shouldShowNagModal();
      setShowFirstTimeModal(shouldShowModal);
    } else {
      setShowFirstTimeModal(false);
    }
  }, [user, profile, isPremium, subscription, sessionDismissed]);

  // Check if we should show the nag modal - optimized logic
  const shouldShowNagModal = (): boolean => {
    if (!profile || isPremium) return false;
    if (!profile.should_nag) return false;
    
    // If never nagged before, show it (first time users)
    if (!profile.last_nag_at) return true;
    
    // Calculate time since last nag
    const lastNagDate = new Date(profile.last_nag_at);
    const now = new Date();
    const daysDiff = (now.getTime() - lastNagDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // For users with cancelled subscription or no subscription, still respect nag timing
    // Only show if it's been at least 1 day since last nag (prevent immediate re-showing)
    if (subscription && subscription.status === 'cancelled') {
      return daysDiff >= 1; // Show after 1 day for cancelled users
    }
    
    // For users with no subscription, show after 1 day
    if (!subscription) {
      return daysDiff >= 1;
    }
    
    // For regular cases, check 7-day rule
    return daysDiff >= 7;
  };

  const fetchSubscriptionStatus = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Batch both queries for better performance
      const [profileResult, subscriptionResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('is_premium, should_nag, last_nag_at, nag_variant')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
      ]);

      const { data: profileData, error: profileError } = profileResult;
      const { data: subscriptionData, error: subError } = subscriptionResult;

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      if (profileData) {
        setProfile(profileData);
      }

      if (subError && subError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subError);
        return;
      }

      let hasActiveSubscription = false;
      let currentSubscription = null;
      
      if (subscriptionData && subscriptionData.length > 0) {
        const sub = subscriptionData[0];
        currentSubscription = sub;
        
        // Check if subscription is truly active and not expired
        if (sub.status === 'active') {
          if (sub.expires_at) {
            const expiryDate = new Date(sub.expires_at);
            const now = new Date();
            hasActiveSubscription = expiryDate > now;
            
            // If expired, update subscription status
            if (expiryDate <= now) {
              await supabase
                .from('subscriptions')
                .update({ status: 'expired' })
                .eq('id', sub.id);
              currentSubscription = { ...sub, status: 'expired' };
            }
          } else {
            // No expiry date means permanent subscription
            hasActiveSubscription = true;
          }
        }
      }
      
      setSubscription(currentSubscription);
      
      // CRITICAL: Subscription table is the source of truth
      const actualPremiumStatus = hasActiveSubscription;
      setIsPremium(actualPremiumStatus);
      
      // Fix inconsistent profile data if needed
      if (profileData && profileData.is_premium !== actualPremiumStatus) {
        console.log('Fixing inconsistent premium status in profile');
        await supabase
          .from('profiles')
          .update({ is_premium: actualPremiumStatus })
          .eq('user_id', user.id);
          
        // Update local profile state
        setProfile({
          ...profileData,
          is_premium: actualPremiumStatus
        });
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNagAsSeen = async () => {
    if (!user) return;
    
    try {
      // Optimistically update UI first for better UX
      setShowFirstTimeModal(false);
      
      // Update local state immediately
      if (profile) {
        setProfile({
          ...profile,
          last_nag_at: new Date().toISOString()
        });
      }
      
      // Call edge function to update nag timestamp
      const { error } = await supabase.functions.invoke('update-nag-seen');
      
      if (error) {
        console.error('Error marking nag as seen:', error);
        // Don't revert UI since user wanted to dismiss
      }
    } catch (error) {
      console.error('Error calling update-nag-seen:', error);
      // UI already updated optimistically
    }
  };

  const markModalAsSeen = () => {
    setSessionDismissed(true); // Mark as dismissed for current session
    markNagAsSeen();
  };

  const upgradeToPremium = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    try {
      // Create a new subscription record
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month from now
      
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

      // Also update the profile for backward compatibility
      await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('user_id', user.id);

      setSubscription(data);
      setIsPremium(true);
      setSessionDismissed(true); // Mark as dismissed since user upgraded
      markNagAsSeen();
    } catch (error) {
      console.error('Error upgrading to premium:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
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

      // Update local subscription state
      const updatedSubscription = {
        ...subscription,
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        auto_renew: false
      };
      setSubscription(updatedSubscription);
      
      // Check if subscription has already expired or expires immediately
      let shouldLosePremium = false;
      if (subscription.expires_at) {
        const expiryDate = new Date(subscription.expires_at);
        const now = new Date();
        shouldLosePremium = expiryDate <= now;
      } else {
        // No expiry date means immediate cancellation
        shouldLosePremium = true;
      }
      
      if (shouldLosePremium) {
        setIsPremium(false);
        await supabase
          .from('profiles')
          .update({ is_premium: false })
          .eq('user_id', user.id);
          
        // Update local profile state
        if (profile) {
          setProfile({
            ...profile,
            is_premium: false
          });
        }
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = () => {
    if (!subscription?.expires_at) return null;
    
    const expiryDate = new Date(subscription.expires_at);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  return {
    isPremium,
    showFirstTimeModal,
    markModalAsSeen,
    upgradeToPremium,
    cancelSubscription,
    loading,
    subscription,
    daysUntilExpiry: getDaysUntilExpiry(),
    refreshSubscription: fetchSubscriptionStatus
  };
};