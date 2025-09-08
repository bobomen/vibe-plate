import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  is_premium: boolean;
  should_nag: boolean;
  last_nag_at: string | null;
  nag_variant: string;
}

interface SubscriptionData {
  status: string;
}

export const usePremiumModal = (isPremium: boolean, subscription: SubscriptionData | null) => {
  const { user } = useAuth();
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [sessionDismissed, setSessionDismissed] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_premium, should_nag, last_nag_at, nag_variant')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [user]);

  const shouldShowNagModal = useCallback((): boolean => {
    if (!profile || isPremium) return false;
    if (!profile.should_nag) return false;
    
    // If never nagged before, always show (first time users)
    if (!profile.last_nag_at) return true;
    
    // For non-premium users (cancelled or no subscription), show modal immediately on login
    if (subscription && subscription.status === 'cancelled') {
      return true;
    }
    
    // If user has no subscription at all, always show
    if (!subscription) {
      return true;
    }
    
    // For other cases (expired subscriptions), check timing
    const lastNagDate = new Date(profile.last_nag_at);
    const now = new Date();
    const daysDiff = (now.getTime() - lastNagDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysDiff >= 7;
  }, [profile, isPremium, subscription]);

  const markNagAsSeen = useCallback(async () => {
    if (!user) return;
    
    try {
      // Optimistically update UI first
      setShowFirstTimeModal(false);
      
      if (profile) {
        setProfile({
          ...profile,
          last_nag_at: new Date().toISOString()
        });
      }
      
      const { error } = await supabase.functions.invoke('update-nag-seen');
      
      if (error) {
        console.error('Error marking nag as seen:', error);
      }
    } catch (error) {
      console.error('Error calling update-nag-seen:', error);
    }
  }, [user, profile]);

  const markModalAsSeen = useCallback(() => {
    setSessionDismissed(true);
    setShowFirstTimeModal(false);
    markNagAsSeen();
  }, [markNagAsSeen]);

  // Fetch profile data
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  // Determine if modal should show
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && profile !== null && !isPremium && !sessionDismissed) {
        const shouldShow = shouldShowNagModal();
        setShowFirstTimeModal(shouldShow);
      } else {
        setShowFirstTimeModal(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, profile, isPremium, subscription, sessionDismissed, shouldShowNagModal]);

  return {
    showFirstTimeModal,
    markModalAsSeen
  };
};