/**
 * GOLDEN PATH 1: 個人滑卡 → 收藏
 * INVARIANTS: 
 * - 個人滑卡只讀 group_id IS NULL 的記錄
 * - 重置個人滑卡記錄時，收藏記錄必須完全保留
 */
import React, { useCallback, useState, useEffect } from 'react';
import { Utensils, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantCardSkeleton } from '@/components/ui/RestaurantCardSkeleton';
import { SwipeActionButtons } from '@/components/ui/SwipeActionButtons';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import SearchAndFilter from './SearchAndFilter';
import { SwipeCard } from './SwipeCard';
import { usePersonalSwipeLogic } from '@/hooks/usePersonalSwipeLogic';
import { useSwipeState } from '@/hooks/useSwipeState';
import { useRestaurantView } from '@/hooks/useRestaurantView';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingOverlay } from './Onboarding/OnboardingOverlay';
import { PremiumTeaser } from './Onboarding/PremiumTeaser';
import { usePremium } from '@/hooks/usePremium';

export const SwipeCards = React.memo(() => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showCoreOnboarding, completeCoreOnboarding } = useOnboarding();
  const { upgradeToPremium } = usePremium();
  
  // Onboarding state tracking
  const [showPremiumTeaser, setShowPremiumTeaser] = useState(false);
  
  // Use unified swipe state (personal mode - no groupId)
  const {
    restaurants,
    allRestaurants,
    currentIndex,
    loading,
    userSwipes: userPersonalSwipes,
    filters,
    currentRestaurant,
    distance,
    canGoBack,
    userLocation,
    setCurrentIndex,
    setFilters,
    resetPersonalSwipes,
    applyFilters,
    addToSwipeHistory,
    goBackToPrevious,
  } = useSwipeState({ 
    groupId: undefined, // INVARIANT: Personal swipes have no groupId
    showCoreOnboarding, // Pass onboarding state to prioritize tutorial restaurants
  });

  // Phase 1: 記錄卡片顯示時間（用於計算停留時長）
  const [cardDisplayTime, setCardDisplayTime] = useState<number>(Date.now());
  
  // Local state to track if onboarding has been shown in this session
  // CRITICAL: Initialize based on showCoreOnboarding to prevent re-triggering
  // If user has already completed onboarding (showCoreOnboarding = false), 
  // mark session as seen immediately to prevent accidental re-triggers
  const [hasSeenOnboardingSession, setHasSeenOnboardingSession] = useState(() => {
    const initialValue = !showCoreOnboarding;
    if (initialValue) {
      console.log('[Onboarding] User has completed onboarding before, session marked as seen on init');
    }
    return initialValue;
  });

  // CRITICAL: Track if user has started onboarding flow in this session
  // This prevents re-triggering onboarding when resetting swipes or going back
  // Once onboarding starts, it should not restart in the same session
  const [hasStartedOnboarding, setHasStartedOnboarding] = useState(false);

  // 當卡片切換時重置顯示時間
  useEffect(() => {
    setCardDisplayTime(Date.now());
  }, [currentIndex]);

  // CRITICAL: Mark onboarding as started when it first appears
  // This ensures onboarding won't re-trigger in the same session
  // even if user resets swipes or goes back to previous cards
  useEffect(() => {
    if (showCoreOnboarding && !hasSeenOnboardingSession && currentIndex < 2 && !hasStartedOnboarding) {
      console.log('[Onboarding] Tutorial started for the first time in this session');
      setHasStartedOnboarding(true);
    }
  }, [currentIndex, showCoreOnboarding, hasSeenOnboardingSession, hasStartedOnboarding]);

  // Personal swipe logic hook  
  const {
    swipeDirection,
    isDragging,
    dragOffset,
    handleSwipe,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = usePersonalSwipeLogic();

  // Restaurant view tracking hook
  const { trackRestaurantView } = useRestaurantView();

  // Calculate if onboarding should be shown
  // Only show if ALL conditions are met:
  // 1. Core onboarding not completed (localStorage)
  // 2. Not seen in this session
  // 3. Not started in this session (prevents re-trigger on reset/back)
  // 4. Currently on first two cards
  const shouldShowOnboarding = 
    showCoreOnboarding && 
    !hasSeenOnboardingSession && 
    !hasStartedOnboarding && 
    currentIndex < 2;

  // Handle card interactions
  const handleCardSwipe = useCallback(async (liked: boolean) => {
    if (!currentRestaurant) return;
    
    const swipeDuration = Date.now() - cardDisplayTime;
    
    try {
      addToSwipeHistory(currentRestaurant, liked);
      
      await handleSwipe(currentRestaurant, liked, () => {
        setCurrentIndex(prev => prev + 1);
      }, {
        filters,
        userLocation,
        swipeDuration
      });

      // Onboarding tracking (non-blocking)
      // CRITICAL: Only complete onboarding during active onboarding flow
      // Check hasStartedOnboarding to ensure we're in an active tutorial session
      try {
        if (showCoreOnboarding && hasStartedOnboarding && !hasSeenOnboardingSession && currentIndex === 1) {
          // After swiping second card (index 1), complete onboarding permanently
          console.log('[Onboarding] Completing core onboarding after second swipe');
          completeCoreOnboarding();
          setHasSeenOnboardingSession(true);
          setShowPremiumTeaser(true);
        }
      } catch (onboardingError) {
        console.error('[Onboarding] Error:', onboardingError);
        // Fail gracefully but still mark as complete to prevent infinite loop
        completeCoreOnboarding();
        setHasSeenOnboardingSession(true);
      }
    } catch (error) {
      console.error('Error handling swipe:', error);
    }
  }, [handleSwipe, setCurrentIndex, currentRestaurant, addToSwipeHistory, filters, userLocation, cardDisplayTime, showCoreOnboarding, currentIndex, completeCoreOnboarding]);

  const handleCardClick = useCallback(() => {
    if (currentRestaurant) {
      // Track restaurant view
      trackRestaurantView(currentRestaurant.id, {
        source: 'personal_swipe',
        filters,
        userLocation,
        restaurantLocation: {
          lat: currentRestaurant.lat,
          lng: currentRestaurant.lng
        }
      });
      
      navigate(`/restaurant/${currentRestaurant.id}`);
    }
  }, [navigate, currentRestaurant, trackRestaurantView, filters, userLocation]);

  // Event handlers with proper parameters
  const handleMouseUpWithParams = useCallback(() => {
    if (!currentRestaurant) return;
    
    handleMouseUp(currentRestaurant, () => {
      addToSwipeHistory(currentRestaurant, true);
      setCurrentIndex(prev => prev + 1);
    });
  }, [handleMouseUp, currentRestaurant, setCurrentIndex, addToSwipeHistory]);

  const handleTouchEndWithParams = useCallback(() => {
    if (!currentRestaurant) return;
    
    handleTouchEnd(currentRestaurant, () => {
      addToSwipeHistory(currentRestaurant, true);
      setCurrentIndex(prev => prev + 1);
    });
  }, [handleTouchEnd, currentRestaurant, setCurrentIndex, addToSwipeHistory]);

  if (loading) {
    return <RestaurantCardSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">請先登入以使用滑卡功能</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {/* Filter */}
        <SearchAndFilter
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={applyFilters}
          resultsCount={restaurants.length}
        />

        {/* Current Card */}
        {currentRestaurant ? (
          <div className="relative">
            {/* Swipe Card */}
            <div className="relative mx-auto max-w-sm">
              <SwipeCard
                restaurant={currentRestaurant}
                distance={distance}
                swipeDirection={swipeDirection}
                isDragging={isDragging}
                dragOffset={dragOffset}
                onSwipe={handleCardSwipe}
                onCardClick={handleCardClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpWithParams}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEndWithParams}
                isOnboarding={shouldShowOnboarding}
                onboardingStep={(currentIndex + 1) as 1 | 2}
              />
              
              {/* Onboarding Overlay - only show during active tutorial */}
              {shouldShowOnboarding && (
                <OnboardingOverlay 
                  step={(currentIndex + 1) as 1 | 2}
                />
              )}
            </div>

            {/* Action Buttons */}
            <SwipeActionButtons
              onGoBack={goBackToPrevious}
              canGoBack={canGoBack}
              disabled={isDragging}
            />
          </div>
        ) : (
          <EmptyState
            icon={<Utensils className="h-16 w-16" />}
            title="沒有更多餐廳了"
            description={
              allRestaurants.length === userPersonalSwipes.size
                ? "您已經看過所有餐廳了。重置滑卡記錄來重新探索，收藏記錄將保持不變。"
                : "目前沒有符合篩選條件的餐廳。試試調整篩選條件或重置滑卡記錄。"
            }
            action={
              allRestaurants.length === userPersonalSwipes.size ? (
                <Button
                  onClick={async () => {
                    if (window.confirm('確定要重置所有個人滑卡記錄嗎？收藏記錄將保持不變。')) {
                      await resetPersonalSwipes();
                    }
                  }}
                  variant="default"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置滑卡記錄
                </Button>
              ) : undefined
            }
          />
        )}

      </div>

      {/* Premium Teaser - After onboarding completion */}
      <PremiumTeaser
        open={showPremiumTeaser}
        onClose={() => setShowPremiumTeaser(false)}
        onUpgrade={() => {
          setShowPremiumTeaser(false);
          upgradeToPremium();
        }}
      />
    </div>
  );
});

SwipeCards.displayName = 'SwipeCards';