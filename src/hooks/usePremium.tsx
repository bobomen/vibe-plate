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

  // Fetch user's subscription status from database
  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  // Determine if modal should show based on premium status and nag settings
  useEffect(() => {
    if (user && profile !== null && !isPremium) {
      const shouldShowModal = shouldShowNagModal();
      setShowFirstTimeModal(shouldShowModal);
    } else {
      setShowFirstTimeModal(false);
    }
  }, [user, profile, isPremium]);

  // Check if we should show the nag modal based on 7-day rule
  const shouldShowNagModal = (): boolean => {
    if (!profile || isPremium) return false;
    if (!profile.should_nag) return false;
    
    // If never nagged before, show it
    if (!profile.last_nag_at) return true;
    
    // Check if 7 days have passed since last nag
    const lastNagDate = new Date(profile.last_nag_at);
    const now = new Date();
    const daysDiff = (now.getTime() - lastNagDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysDiff >= 7;
  };

  const fetchSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      // Get profile data including nag settings
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, should_nag, last_nag_at, nag_variant')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      if (profileData) {
        setProfile(profileData);
        setIsPremium(profileData.is_premium || false);
      }

      // Get active subscription
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (subError && subError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subError);
        return;
      }

      let hasActiveSubscription = false;
      
      if (subscriptionData && subscriptionData.length > 0) {
        const sub = subscriptionData[0];
        setSubscription(sub);
        
        // Check if subscription is still valid
        if (sub.expires_at) {
          const expiryDate = new Date(sub.expires_at);
          const now = new Date();
          hasActiveSubscription = expiryDate > now;
        } else {
          // No expiry date means permanent subscription
          hasActiveSubscription = true;
        }
      } else {
        setSubscription(null);
      }
      
      // Update premium status based on subscription
      if (hasActiveSubscription && !isPremium) {
        setIsPremium(true);
        // Update profile is_premium if needed
        await supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const markNagAsSeen = async () => {
    if (!user) return;
    
    try {
      // Call edge function to update nag timestamp
      const { data, error } = await supabase.functions.invoke('update-nag-seen');
      
      if (error) {
        console.error('Error marking nag as seen:', error);
        return;
      }
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          last_nag_at: new Date().toISOString()
        });
      }
      
      setShowFirstTimeModal(false);
    } catch (error) {
      console.error('Error calling update-nag-seen:', error);
      // Fallback to just hiding modal
      setShowFirstTimeModal(false);
    }
  };

  const markModalAsSeen = () => {
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
      markModalAsSeen();
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

      // Update local state
      setSubscription({
        ...subscription,
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        auto_renew: false
      });
      
      // If subscription expired, also update premium status
      if (subscription.expires_at) {
        const expiryDate = new Date(subscription.expires_at);
        const now = new Date();
        if (expiryDate <= now) {
          setIsPremium(false);
          await supabase
            .from('profiles')
            .update({ is_premium: false })
            .eq('user_id', user.id);
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