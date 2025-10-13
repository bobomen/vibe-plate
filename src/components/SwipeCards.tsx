/**
 * GOLDEN PATH 1: 個人滑卡 → 收藏
 * INVARIANTS: 
 * - 個人滑卡只讀 group_id IS NULL 的記錄
 * - 重置個人滑卡記錄時，收藏記錄必須完全保留
 */
import React, { useCallback, useState } from 'react';
import { Utensils, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantCardSkeleton } from '@/components/ui/RestaurantCardSkeleton';
import { SwipeActionButtons } from '@/components/ui/SwipeActionButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SearchAndFilter from './SearchAndFilter';
import { SwipeCard } from './SwipeCard';
import { usePersonalSwipeLogic } from '@/hooks/usePersonalSwipeLogic';
import { useSwipeState } from '@/hooks/useSwipeState';

const CITY_OPTIONS = [
  { id: 'all', label: '所有地區', icon: '🌏' },
  { id: '台北市', label: '台北市', icon: '🏙️' },
  { id: '新北市', label: '新北市', icon: '🌆' },
  { id: '基隆市', label: '基隆市', icon: '⚓' },
  { id: '桃園市', label: '桃園市', icon: '✈️' },
  { id: '新竹市', label: '新竹市', icon: '🎋' },
  { id: '新竹縣', label: '新竹縣', icon: '🏔️' },
  { id: '苗栗縣', label: '苗栗縣', icon: '🌾' },
  { id: '台中市', label: '台中市', icon: '🏛️' },
  { id: '彰化縣', label: '彰化縣', icon: '🌸' },
  { id: '南投縣', label: '南投縣', icon: '⛰️' },
  { id: '雲林縣', label: '雲林縣', icon: '🌾' },
  { id: '嘉義市', label: '嘉義市', icon: '🌳' },
  { id: '嘉義縣', label: '嘉義縣', icon: '🏞️' },
  { id: '台南市', label: '台南市', icon: '🏯' },
  { id: '高雄市', label: '高雄市', icon: '🚢' },
  { id: '屏東縣', label: '屏東縣', icon: '🌴' },
  { id: '宜蘭縣', label: '宜蘭縣', icon: '🏖️' },
  { id: '花蓮縣', label: '花蓮縣', icon: '🏔️' },
  { id: '台東縣', label: '台東縣', icon: '🌊' },
  { id: '澎湖縣', label: '澎湖縣', icon: '🏝️' },
  { id: '金門縣', label: '金門縣', icon: '🦁' },
  { id: '連江縣', label: '連江縣', icon: '🚤' },
];

export const SwipeCards = React.memo(() => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState<string>('all');
  
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
    setCurrentIndex,
    setFilters,
    resetPersonalSwipes,
    applyFilters,
    addToSwipeHistory,
    goBackToPrevious,
  } = useSwipeState({ groupId: undefined }); // INVARIANT: Personal swipes have no groupId

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

  // Handle city selection
  const handleCityChange = useCallback((city: string) => {
    setSelectedCity(city);
    if (city === 'all') {
      setFilters({ ...filters, cities: [], districts: [] });
    } else {
      setFilters({ ...filters, cities: [city], districts: [] });
    }
  }, [filters, setFilters]);

  // Handle card interactions
  const handleCardSwipe = useCallback(async (liked: boolean) => {
    if (!currentRestaurant) return;
    
    try {
      // Add to history before swiping
      addToSwipeHistory(currentRestaurant, liked);
      
      await handleSwipe(currentRestaurant, liked, () => {
        setCurrentIndex(prev => prev + 1);
      });
    } catch (error) {
      console.error('Error handling swipe:', error);
    }
  }, [handleSwipe, setCurrentIndex, currentRestaurant, addToSwipeHistory]);

  const handleCardClick = useCallback(() => {
    if (currentRestaurant) {
      navigate(`/app/restaurant/${currentRestaurant.id}`);
    }
  }, [navigate, currentRestaurant]);

  // Event handlers with proper parameters
  const handleMouseUpWithParams = useCallback(() => {
    if (!currentRestaurant) return;
    handleMouseUp(currentRestaurant, () => {
      // Add to history before moving to next
      addToSwipeHistory(currentRestaurant, true); // Assuming right swipe is like
      setCurrentIndex(prev => prev + 1);
    });
  }, [handleMouseUp, currentRestaurant, setCurrentIndex, addToSwipeHistory]);

  const handleTouchEndWithParams = useCallback(() => {
    if (!currentRestaurant) return;
    handleTouchEnd(currentRestaurant, () => {
      // Add to history before moving to next
      addToSwipeHistory(currentRestaurant, true); // Assuming right swipe is like
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
        {/* Region Selector */}
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">選擇地區</label>
              <Select value={selectedCity} onValueChange={handleCityChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="選擇城市" />
                </SelectTrigger>
                <SelectContent>
                  {CITY_OPTIONS.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      <span className="mr-2">{city.icon}</span>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {selectedCity === 'all' 
              ? `顯示所有地區的餐廳（${restaurants.length} 間）`
              : `顯示 ${CITY_OPTIONS.find(c => c.id === selectedCity)?.label} 的餐廳（${restaurants.length} 間）`
            }
          </div>
        </div>

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
            <SwipeActionButtons
              onGoBack={goBackToPrevious}
              canGoBack={canGoBack}
              disabled={isDragging}
            />
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

      </div>
    </div>
  );
});

SwipeCards.displayName = 'SwipeCards';