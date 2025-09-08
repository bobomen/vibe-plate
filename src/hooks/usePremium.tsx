import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const usePremium = () => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch user's premium status from database
  useEffect(() => {
    if (user) {
      fetchPremiumStatus();
      
      // Check if user has seen the premium modal before
      const hasSeenPremiumModal = localStorage.getItem(`premium_modal_seen_${user.id}`);
      
      if (!hasSeenPremiumModal) {
        // Show modal after a short delay to let the app load
        const timer = setTimeout(() => {
          setShowFirstTimeModal(true);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const fetchPremiumStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching premium status:', error);
        return;
      }

      if (data) {
        setIsPremium(data.is_premium || false);
      }
    } catch (error) {
      console.error('Error fetching premium status:', error);
    }
  };

  const markModalAsSeen = () => {
    if (user) {
      localStorage.setItem(`premium_modal_seen_${user.id}`, 'true');
    }
    setShowFirstTimeModal(false);
  };

  const upgradeToPremium = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsPremium(true);
      markModalAsSeen();
    } catch (error) {
      console.error('Error upgrading to premium:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isPremium,
    showFirstTimeModal,
    markModalAsSeen,
    upgradeToPremium,
    loading
  };
};