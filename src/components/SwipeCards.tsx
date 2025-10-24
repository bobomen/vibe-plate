/**
 * GOLDEN PATH 1: 個人滑卡 → 收藏
 * INVARIANTS: 
 * - 個人滑卡只讀 group_id IS NULL 的記錄
 * - 重置個人滑卡記錄時，收藏記錄必須完全保留
 */
import React, { useCallback, useState, useEffect } from 'react';
import { Utensils, MapPin, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantCardSkeleton } from '@/components/ui/RestaurantCardSkeleton';
import { SwipeActionButtons } from '@/components/ui/SwipeActionButtons';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import SearchAndFilter from './SearchAndFilter';
import { SwipeCard } from './SwipeCard';
import { usePersonalSwipeLogic } from '@/hooks/usePersonalSwipeLogic';
import { useSwipeState } from '@/hooks/useSwipeState';
import { useRestaurantView } from '@/hooks/useRestaurantView';
import { useOnboarding } from '@/hooks/useOnboarding';
import { TutorialOverlay } from './Onboarding/TutorialOverlay';
import { PremiumTeaser } from './Onboarding/PremiumTeaser';
import { TUTORIAL_MESSAGES } from '@/config/onboardingConfig';


interface SwipeCardsProps {
  showTutorial?: boolean;
}

export const SwipeCards = React.memo(({ showTutorial = false }: SwipeCardsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { completeCoreOnboarding } = useOnboarding();
  
  // Tutorial state
  const [tutorialProgress, setTutorialProgress] = useState(0);
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
    showCoreOnboarding: showTutorial 
  });

  // Phase 1: 記錄卡片顯示時間（用於計算停留時長）
  const [cardDisplayTime, setCardDisplayTime] = useState<number>(Date.now());

  // 當卡片切換時重置顯示時間
  useEffect(() => {
    setCardDisplayTime(Date.now());
  }, [currentIndex]);

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


  // Check if current restaurant is a tutorial card
  const isTutorialCard = currentRestaurant?.id.startsWith('tutorial-');
  const tutorialMessage = isTutorialCard ? TUTORIAL_MESSAGES[currentRestaurant.id] : null;

  // Handle card interactions
  const handleCardSwipe = useCallback(async (liked: boolean) => {
    if (!currentRestaurant) return;
    
    // Tutorial card: Don't write to DB, just advance
    if (isTutorialCard) {
      const newProgress = tutorialProgress + 1;
      setTutorialProgress(newProgress);
      setCurrentIndex(prev => prev + 1);
      
      // After completing both tutorial cards, show premium teaser
      if (newProgress >= 2) {
        completeCoreOnboarding();
        setShowPremiumTeaser(true);
      }
      return;
    }
    
    // Normal card: Full swipe logic
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
    } catch (error) {
      console.error('Error handling swipe:', error);
    }
  }, [handleSwipe, setCurrentIndex, currentRestaurant, addToSwipeHistory, filters, userLocation, cardDisplayTime, isTutorialCard, tutorialProgress, completeCoreOnboarding]);

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
      
      navigate(`/app/restaurant/${currentRestaurant.id}`);
    }
  }, [navigate, currentRestaurant, trackRestaurantView, filters, userLocation]);

  // Event handlers with proper parameters
  const handleMouseUpWithParams = useCallback(() => {
    if (!currentRestaurant) return;
    
    // Tutorial card: Don't write to DB
    if (isTutorialCard) {
      handleMouseUp(currentRestaurant, () => {
        const newProgress = tutorialProgress + 1;
        setTutorialProgress(newProgress);
        setCurrentIndex(prev => prev + 1);
        
        if (newProgress >= 2) {
          completeCoreOnboarding();
          setShowPremiumTeaser(true);
        }
      });
      return;
    }
    
    // Normal card
    handleMouseUp(currentRestaurant, () => {
      addToSwipeHistory(currentRestaurant, true);
      setCurrentIndex(prev => prev + 1);
    });
  }, [handleMouseUp, currentRestaurant, setCurrentIndex, addToSwipeHistory, isTutorialCard, tutorialProgress, completeCoreOnboarding]);

  const handleTouchEndWithParams = useCallback(() => {
    if (!currentRestaurant) return;
    
    // Tutorial card: Don't write to DB
    if (isTutorialCard) {
      handleTouchEnd(currentRestaurant, () => {
        const newProgress = tutorialProgress + 1;
        setTutorialProgress(newProgress);
        setCurrentIndex(prev => prev + 1);
        
        if (newProgress >= 2) {
          completeCoreOnboarding();
          setShowPremiumTeaser(true);
        }
      });
      return;
    }
    
    // Normal card
    handleTouchEnd(currentRestaurant, () => {
      addToSwipeHistory(currentRestaurant, true);
      setCurrentIndex(prev => prev + 1);
    });
  }, [handleTouchEnd, currentRestaurant, setCurrentIndex, addToSwipeHistory, isTutorialCard, tutorialProgress, completeCoreOnboarding]);

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
            {/* Tutorial Overlay */}
            {isTutorialCard && tutorialMessage && (
              <TutorialOverlay
                message={tutorialMessage.instruction}
                direction={tutorialMessage.direction}
                highlightCard
              />
            )}
            
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
              />
            </div>

            {/* Action Buttons - Hidden during tutorial */}
            {!isTutorialCard && (
              <SwipeActionButtons
                onGoBack={goBackToPrevious}
                canGoBack={canGoBack}
                disabled={isDragging}
              />
            )}
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
      
      {/* Premium Teaser after tutorial */}
      {showPremiumTeaser && (
        <PremiumTeaser
          onClose={() => setShowPremiumTeaser(false)}
          onSkip={() => setShowPremiumTeaser(false)}
        />
      )}
    </div>
  );
});

SwipeCards.displayName = 'SwipeCards';