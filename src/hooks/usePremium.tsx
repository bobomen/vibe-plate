import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const usePremium = () => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);

  useEffect(() => {
    if (user) {
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

  const markModalAsSeen = () => {
    if (user) {
      localStorage.setItem(`premium_modal_seen_${user.id}`, 'true');
    }
    setShowFirstTimeModal(false);
  };

  const upgradeToPremium = () => {
    // TODO: Implement actual payment logic here
    setIsPremium(true);
    markModalAsSeen();
  };

  return {
    isPremium,
    showFirstTimeModal,
    markModalAsSeen,
    upgradeToPremium
  };
};