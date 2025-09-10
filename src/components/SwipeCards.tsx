/**
 * GOLDEN PATH 1: 個人滑卡 → 收藏
 * INVARIANTS: 
 * - 個人滑卡只讀 group_id IS NULL 的記錄
 * - 重置個人滑卡記錄時，收藏記錄必須完全保留
 */
import React, { useCallback } from 'react';
import { Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantCardSkeleton } from '@/components/ui/RestaurantCardSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SearchAndFilter from './SearchAndFilter';
import { SwipeCard } from './SwipeCard';
import { useSwipeLogic } from '@/hooks/useSwipeLogic';
import { useSwipeState } from '@/hooks/useSwipeState';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  google_rating: number;
  google_reviews_count: number;
  michelin_stars: number;
  has_500_dishes: boolean;
  photos: string[];
  cuisine_type: string;
  price_range: number;
  bib_gourmand: boolean;
}

export const SwipeCards = React.memo(() => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
    setCurrentIndex,
    setFilters,
    resetPersonalSwipes,
    applyFilters,
  } = useSwipeState({ groupId: undefined }); // INVARIANT: Personal swipes have no groupId

  // Swipe logic hook  
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
  } = useSwipeLogic();

  // Handle card interactions
  const handleCardSwipe = useCallback(async (liked: boolean) => {
    if (!currentRestaurant) return;
    
    try {
      await handleSwipe(currentRestaurant, liked, () => {
        setCurrentIndex(prev => prev + 1);
      });
    } catch (error) {
      console.error('Error handling swipe:', error);
    }
  }, [handleSwipe, setCurrentIndex, currentRestaurant]);

  const handleCardClick = useCallback(() => {
    if (currentRestaurant) {
      navigate(`/app/restaurant/${currentRestaurant.id}`);
    }
  }, [navigate, currentRestaurant]);

  // Event handlers with proper parameters
  const handleMouseUpWithParams = useCallback(() => {
    if (!currentRestaurant) return;
    handleMouseUp(currentRestaurant, () => {
      setCurrentIndex(prev => prev + 1);
    });
  }, [handleMouseUp, currentRestaurant, setCurrentIndex]);

  const handleTouchEndWithParams = useCallback(() => {
    if (!currentRestaurant) return;
    handleTouchEnd(currentRestaurant, () => {
      setCurrentIndex(prev => prev + 1);
    });
  }, [handleTouchEnd, currentRestaurant, setCurrentIndex]);

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
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleCardSwipe(false)}
                className="rounded-full w-14 h-14 border-2 border-red-200 hover:border-red-300 hover:bg-red-50"
                disabled={isDragging}
              >
                <span className="text-xl">👎</span>
              </Button>
              <Button
                variant="outline" 
                size="lg"
                onClick={() => handleCardSwipe(true)}
                className="rounded-full w-14 h-14 border-2 border-green-200 hover:border-green-300 hover:bg-green-50"
                disabled={isDragging}
              >
                <span className="text-xl">👍</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Utensils className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">沒有更多餐廳了！</h2>
            <p className="text-muted-foreground mb-4">
              {allRestaurants.length === userPersonalSwipes.size ? 
                "您已經看過所有餐廳了" : 
                "目前沒有符合篩選條件的餐廳"}
            </p>
            <div className="space-y-2">
              {allRestaurants.length === userPersonalSwipes.size && (
                <Button 
                  onClick={async () => {
                    if (window.confirm('確定要重置所有個人滑卡記錄嗎？收藏記錄將保持不變。')) {
                      await resetPersonalSwipes();
                    }
                  }}
                  variant="outline"
                  className="w-full"
                >
                  重置所有滑卡記錄
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {restaurants.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            {currentIndex + 1} / {restaurants.length + currentIndex} 張餐廳卡片
          </div>
        )}
      </div>
    </div>
  );
});

SwipeCards.displayName = 'SwipeCards';